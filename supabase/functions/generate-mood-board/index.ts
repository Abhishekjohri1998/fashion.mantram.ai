import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { colorHex, materialImage, materialLabel, keywords, category } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const keywordStr = Array.isArray(keywords) && keywords.length > 0
      ? `\nStyle keywords to incorporate: ${keywords.join(", ")}`
      : "";

    const categoryStr = category || "fashion";

    const content: any[] = [
      {
        type: "text",
        text: `Generate a professional ${categoryStr} design mood board image. Create a single cohesive mood board collage that includes:

- Color palette swatches based on ${colorHex || "the provided color"}
- Complementary textures and patterns inspired by ${materialLabel || "the provided material"}
- Lifestyle/environment imagery that matches this aesthetic (urban, nature, sport, luxury — whatever fits)
- Typography mood samples
- Seasonal and trend references${keywordStr}

The mood board should feel like a professional fashion designer's inspiration board — visually rich, curated, and cohesive. Use a clean layout with the images arranged in an editorial grid style. The overall tone should reflect the color ${colorHex} and ${materialLabel || "material"} aesthetic.`,
      },
    ];

    if (materialImage) {
      content.push({
        type: "image_url",
        image_url: { url: materialImage },
      });
    }

    console.log("Generating mood board for", categoryStr, "with keywords:", keywords);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content }],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      throw new Error(`AI Gateway returned ${status}: ${errorText.substring(0, 200)}`);
    }

    const rawText = await response.text();
    if (!rawText || rawText.trim().length === 0) {
      throw new Error("AI service returned an empty response. Please try again.");
    }
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (parseErr) {
      console.error("Failed to parse AI response:", rawText.substring(0, 500));
      throw new Error("AI service returned an invalid response. Please try again.");
    }

    // Check for embedded errors
    const choiceError = data.choices?.[0]?.error;
    if (choiceError) {
      const code = choiceError.code || 500;
      const msg = choiceError.metadata?.raw
        ? JSON.parse(choiceError.metadata.raw)?.error?.message || choiceError.message
        : choiceError.message;
      console.error("Upstream error:", code, msg);
      return new Response(
        JSON.stringify({ error: code === 429 ? "Rate limit exceeded. Please try again in a moment." : msg }),
        { status: code === 429 ? 429 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const message = data.choices?.[0]?.message;

    // Extract image from response
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
      throw new Error("No mood board image generated. Please try again.");
    }

    return new Response(JSON.stringify({ image: generatedImage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
