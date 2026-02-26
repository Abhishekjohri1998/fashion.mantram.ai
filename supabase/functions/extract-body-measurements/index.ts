import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CATEGORY_MEASUREMENTS: Record<string, { keys: string[]; prompt: string }> = {
  footwear: {
    keys: ["foot_length", "foot_width", "ankle_circumference", "arch_length"],
    prompt:
      "Analyze this top-down photo of a foot placed on an A4 sheet of paper (29.7 cm × 21.0 cm). The A4 paper is the absolute scale reference. Measure: foot length (heel to longest toe, in cm), foot width at the widest point (in cm), estimated ankle circumference (in cm, use proportional reasoning from the visible ankle width), and arch length (heel to ball of foot, in cm). Use the A4 paper dimensions to calculate real-world sizes accurately.",
  },
  jacket: {
    keys: [
      "chest_circumference", "shoulder_width", "arm_length",
      "waist_circumference", "neck_circumference", "torso_length",
      "back_width", "bicep_circumference",
    ],
    prompt:
      "Estimate chest circumference, shoulder width (tip to tip), arm length (shoulder to wrist), waist circumference, neck circumference, torso length (shoulder to waist), back width, and bicep circumference — all in cm. Use the front view for width measurements and the side view for depth measurements to accurately estimate circumferences.",
  },
  dress: {
    keys: [
      "bust_circumference", "waist_circumference", "hip_circumference",
      "shoulder_width", "total_height", "arm_length", "torso_length",
      "back_width", "thigh_circumference",
    ],
    prompt:
      "Estimate bust circumference, waist circumference, hip circumference, shoulder width, total body height, arm length, torso length (shoulder to waist), back width, and thigh circumference — all in cm. Use the front view for width proportions and the side view for depth to accurately calculate circumferences.",
  },
  tshirt: {
    keys: [
      "chest_circumference", "shoulder_width", "arm_length",
      "torso_length", "waist_circumference", "bicep_circumference",
      "neck_circumference",
    ],
    prompt:
      "Estimate chest circumference, shoulder width, arm length (shoulder to wrist), torso length (shoulder to waist), waist circumference, bicep circumference, and neck circumference — all in cm. Use front view for widths and side view for depth to cross-reference circumference estimates.",
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { sessionId, category } = body;

    // Support both old single-image and new dual-image format
    const frontImage: string | undefined = body.frontImage || body.image;
    const sideImage: string | undefined = body.sideImage;

    const isFootwear = category === "footwear";

    if (!sessionId || !frontImage || !category) {
      return new Response(
        JSON.stringify({ error: "Missing sessionId, image(s), or category" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    await supabase
      .from("body_measurement_sessions")
      .update({ status: "processing", updated_at: new Date().toISOString() })
      .eq("id", sessionId);

    const catConfig = CATEGORY_MEASUREMENTS[category] || CATEGORY_MEASUREMENTS.tshirt;

    let heightRef: string;
    let viewContext: string;

    if (isFootwear) {
      // Footwear uses A4 paper as scale reference, not body height
      heightRef = "The foot is placed on a standard A4 sheet of paper (29.7 cm long × 21.0 cm wide). Use the visible paper edges as an absolute measurement scale.";
      viewContext = "You are given a TOP-DOWN photo of a foot placed on an A4 sheet of paper. The paper is the ground-truth scale reference. Identify the paper edges and use them to compute real-world dimensions of the foot.";
    } else {
      const heightCm = body.heightCm;
      heightRef = heightCm
        ? `The person's actual height is ${heightCm} cm. Use this as an absolute reference scale.`
        : "Estimate all proportions using standard human body ratios.";
      const hasBothViews = !!sideImage;
      viewContext = hasBothViews
        ? "You are given TWO photos of the same person: a FRONT view and a SIDE view. Use both views together to triangulate accurate circumference measurements — front view gives you width, side view gives you depth. Circumference ≈ π × √((width²+depth²)/2) or use elliptical approximation."
        : "You are given a single photo. Estimate measurements using visible proportions and standard body ratios.";
    }

    const systemPrompt = `You are an expert body measurement estimator with years of experience in garment pattern making.

${viewContext}

${heightRef}

${catConfig.prompt}

CRITICAL RULES:
- Return ONLY valid JSON with measurement keys and numeric values in centimeters
- Use proportional analysis based on anatomical landmarks
- Keys must be exactly: ${catConfig.keys.join(", ")}
- Values must be numbers (no units, no strings)
${isFootwear ? "- Use the A4 paper edges as absolute scale — do NOT guess proportions" : "- For circumference measurements, combine front (width) and side (depth) observations"}
- Be as accurate as possible — these measurements will be used for actual garment production

Example response format:
${JSON.stringify(Object.fromEntries(catConfig.keys.map(k => [k, 0])), null, 2)}`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const toUri = (img: string) => img.startsWith("data:") ? img : `data:image/jpeg;base64,${img}`;

    const userContent: any[] = [];

    if (isFootwear) {
      userContent.push(
        {
          type: "text",
          text: "Analyze this top-down photo of a foot on an A4 sheet of paper. Use the A4 paper as scale reference (29.7cm × 21.0cm). Extract foot measurements for footwear sizing. Return JSON only.",
        },
        {
          type: "image_url",
          image_url: { url: toUri(frontImage) },
        }
      );
      // If a second image was provided (e.g. side/ankle view)
      if (sideImage) {
        userContent.push(
          { type: "text", text: "This is an additional angle showing the ankle area:" },
          { type: "image_url", image_url: { url: toUri(sideImage) } }
        );
      }
    } else {
      const hasBothViews = !!sideImage;
      userContent.push(
        {
          type: "text",
          text: `Analyze ${hasBothViews ? "these two full-body photos (front view and side view)" : "this full-body photo"} and extract body measurements for ${category} sizing. Return JSON only.`,
        },
        {
          type: "image_url",
          image_url: { url: toUri(frontImage) },
        }
      );
      if (hasBothViews && sideImage) {
        userContent.push(
          { type: "text", text: "This is the SIDE VIEW of the same person:" },
          { type: "image_url", image_url: { url: toUri(sideImage) } }
        );
      }
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_measurements",
              description: "Extract body measurements from the photo(s)",
              parameters: {
                type: "object",
                properties: Object.fromEntries(
                  catConfig.keys.map((k) => [k, { type: "number", description: `${k.replace(/_/g, " ")} in cm` }])
                ),
                required: catConfig.keys,
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_measurements" } },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);

      await supabase
        .from("body_measurement_sessions")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("id", sessionId);

      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Usage limit reached" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "AI processing failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    let measurements: Record<string, number> = {};

    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try { measurements = JSON.parse(toolCall.function.arguments); } catch { console.error("Failed to parse tool call arguments"); }
    }

    if (Object.keys(measurements).length === 0) {
      const content = aiData.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try { measurements = JSON.parse(jsonMatch[0]); } catch { /* ignore */ }
      }
    }

    for (const k of Object.keys(measurements)) {
      measurements[k] = Math.round(measurements[k] * 10) / 10;
    }

    const { error: updateError } = await supabase
      .from("body_measurement_sessions")
      .update({
        status: "completed",
        measurements,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sessionId);

    if (updateError) {
      console.error("DB update error:", updateError);
      return new Response(JSON.stringify({ error: "Failed to save results" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ measurements, status: "completed" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-body-measurements error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
