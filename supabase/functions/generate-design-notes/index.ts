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
    const { colorHex, materialLabel, sourceLabel, customizedImage, lifestyleImage, materialImage } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const textPrompt = `You are a professional footwear product designer. Analyze the provided images and write a compelling design brief (4-6 sentences) as flowing prose.

Product details:
- Base product: ${sourceLabel || "Athletic shoe"}
- Color applied: ${colorHex || "not specified"}
- Material: ${materialLabel || "not specified"}

The images provided are:
1. The customized product image showing the new color/material applied
${materialImage ? "2. The fabric/material texture reference" : ""}
${lifestyleImage ? `${materialImage ? "3" : "2"}. A lifestyle photo showing the product worn by a model` : ""}

Based on what you see in these images, write about:
- The overall aesthetic and design language
- How the color and material work together
- The target audience and occasions this design suits
- Seasonal relevance and market positioning

Write in a professional fashion/product design tone. Do not use bullet points or headers.`;

    const content: any[] = [{ type: "text", text: textPrompt }];

    if (customizedImage) {
      content.push({ type: "image_url", image_url: { url: customizedImage } });
    }
    if (materialImage) {
      content.push({ type: "image_url", image_url: { url: materialImage } });
    }
    if (lifestyleImage) {
      content.push({ type: "image_url", image_url: { url: lifestyleImage } });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a professional footwear product designer writing design briefs based on visual references." },
          { role: "user", content },
        ],
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
      throw new Error(`AI Gateway returned ${status}`);
    }

    const data = await response.json();

    const choiceError = data.choices?.[0]?.error;
    if (choiceError) {
      const code = choiceError.code || 500;
      return new Response(
        JSON.stringify({ error: code === 429 ? "Rate limit exceeded. Please try again." : choiceError.message }),
        { status: code === 429 ? 429 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const notes = data.choices?.[0]?.message?.content?.trim();
    if (!notes) throw new Error("No content returned");

    return new Response(JSON.stringify({ notes }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
