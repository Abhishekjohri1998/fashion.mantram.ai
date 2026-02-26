import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sketchUrl, viewAngle, category, description, projectId, referenceViews } = await req.json();

    if (!sketchUrl) {
      return new Response(JSON.stringify({ error: "sketchUrl is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const descriptionContext = description
      ? `\n\nDesign description: "${description}". Use this to inform materials, colors, textures and styling.`
      : "";

    // Build consistency instructions based on reference views
    const refEntries = referenceViews && typeof referenceViews === "object" ? Object.entries(referenceViews) : [];
    let consistencyInstruction = "";
    if (refEntries.length > 0) {
      const viewNames = refEntries.map(([label]) => label).join(", ");
      consistencyInstruction = `

CRITICAL CONSISTENCY REQUIREMENT:
I am also providing ${refEntries.length} previously generated view(s) of this SAME product (${viewNames}). You MUST ensure the ${viewAngle} you generate is 100% consistent with these reference views:
- EXACT same materials, textures, surface finishes, and colors
- EXACT same design details, stitching, logos, patterns, hardware
- EXACT same proportions and silhouette (just rotated to ${viewAngle})
- EXACT same lighting style and background
- The product must look like the SAME physical object photographed from a different angle
Do NOT introduce any new design elements, colors, or materials not seen in the reference views.`;
    }

    const prompt = `You are an expert product designer and 3D visualization artist. I'm providing a design sketch of a ${category || "product"}.

Your task: Generate a PHOTOREALISTIC product render showing this exact design from the ${viewAngle}.

Requirements:
- Transform the sketch into a realistic, high-quality product image
- Maintain the exact proportions, shape, and design details from the sketch
- Use realistic materials, textures, lighting, and shadows
- Studio-quality white/light gray background with soft shadows
- Professional product photography aesthetic
- The view must be clearly from the ${viewAngle} perspective
- If the sketch shows construction lines or annotations, interpret them as design intent, not render them${descriptionContext}${consistencyInstruction}

Generate the photorealistic ${viewAngle} of this ${category || "product"} design now.`;

    console.log("Generating view:", viewAngle, "for category:", category, "with", refEntries.length, "reference views");

    // Build content array with sketch + reference images
    const contentParts: any[] = [
      { type: "text", text: prompt },
      { type: "image_url", image_url: { url: sketchUrl } },
    ];

    // Add reference views as additional images for consistency
    for (const [label, url] of refEntries) {
      contentParts.push({
        type: "image_url",
        image_url: { url: url as string },
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages: [{ role: "user", content: contentParts }],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI Gateway returned ${response.status}: ${errorText.substring(0, 200)}`);
    }

    const data = await response.json();

    const choiceError = data.choices?.[0]?.error;
    if (choiceError) {
      const code = choiceError.code || 500;
      const msg = choiceError.metadata?.raw
        ? JSON.parse(choiceError.metadata.raw)?.error?.message || choiceError.message
        : choiceError.message;
      console.error("Upstream error:", code, msg);
      const isRateLimit = code === 429 || (typeof msg === "string" && msg.toLowerCase().includes("resource exhausted"));
      return new Response(
        JSON.stringify({ error: isRateLimit ? "Rate limit exceeded. Please try again in a moment." : msg }),
        { status: isRateLimit ? 429 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (data.error) {
      const errMsg = typeof data.error === "string" ? data.error : data.error.message || JSON.stringify(data.error);
      const isRateLimit = errMsg.toLowerCase().includes("resource exhausted") || errMsg.toLowerCase().includes("rate limit");
      return new Response(
        JSON.stringify({ error: isRateLimit ? "Rate limit exceeded. Please try again in a moment." : errMsg }),
        { status: isRateLimit ? 429 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract image
    const message = data.choices?.[0]?.message;
    let generatedImage: string | null = null;

    if (message?.images?.[0]?.image_url?.url) {
      generatedImage = message.images[0].image_url.url;
    } else if (message?.images?.[0]?.url) {
      generatedImage = message.images[0].url;
    } else if (typeof message?.content === "string") {
      const match = message.content.match(/(data:image\/[^;]+;base64,[A-Za-z0-9+/=]+)/);
      if (match) generatedImage = match[1];
    } else if (Array.isArray(message?.content)) {
      for (const part of message.content) {
        if (part.type === "image_url" && part.image_url?.url) {
          generatedImage = part.image_url.url;
          break;
        }
      }
    }

    if (!generatedImage) {
      console.error("No image found in response:", JSON.stringify(data).substring(0, 2000));
      throw new Error("No image in AI response");
    }

    // Upload to storage
    const base64Match = generatedImage.match(/^data:image\/(\w+);base64,(.+)$/);
    if (base64Match && projectId) {
      const ext = base64Match[1] === "jpeg" ? "jpg" : base64Match[1];
      const raw = base64Match[2];
      const bytes = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0));
      const viewKey = viewAngle.toLowerCase().replace(/\s+/g, "_");
      const filePath = `${user.id}/${projectId}/generated_${viewKey}_${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("project-files")
        .upload(filePath, bytes, { contentType: `image/${ext}`, upsert: true });

      if (uploadError) {
        console.error("Storage upload error:", uploadError.message);
        return new Response(JSON.stringify({ image: generatedImage }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: urlData } = supabase.storage.from("project-files").getPublicUrl(filePath);
      console.log("Uploaded generated view to:", urlData.publicUrl);

      return new Response(JSON.stringify({ image: urlData.publicUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ image: generatedImage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
