import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sourceImage, colorHex, colorRefImage, materialImage, materialLabel } =
      await req.json();

    if (!sourceImage) {
      return new Response(JSON.stringify({ error: "sourceImage is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Helper: ensure image is a proper data URI with correct MIME type
    async function ensureDataUri(input: string): Promise<string> {
      // Already a proper data URI
      if (input.startsWith("data:image/")) return input;

      // If it's a URL, fetch and convert
      if (input.startsWith("http")) {
        const resp = await fetch(input);
        const contentType = resp.headers.get("content-type") || "image/png";
        const mime = contentType.startsWith("image/") ? contentType : "image/png";
        const buffer = await resp.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
        return `data:${mime};base64,${base64}`;
      }

      // Raw base64 without header — assume PNG
      if (!input.includes(";base64,")) {
        return `data:image/png;base64,${input}`;
      }

      // Has base64 marker but wrong mime (e.g. application/octet-stream)
      const match = input.match(/^data:([^;]+);base64,(.+)$/);
      if (match && !match[1].startsWith("image/")) {
        return `data:image/png;base64,${match[2]}`;
      }

      return input;
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Build prompt
    let promptParts: string[] = [
      "You are a product visualization AI. Take this footwear product photo and generate a NEW realistic product image with the following changes applied:",
    ];

    if (colorHex) {
      promptParts.push(`- Change the primary color of the product to ${colorHex}.`);
    }

    if (materialLabel) {
      promptParts.push(
        `- Change the material/texture to ${materialLabel}. Make it look realistic with proper texture, light reflections and material properties.`
      );
    } else if (materialImage) {
      promptParts.push(
        "- Apply the material/texture shown in the material reference image to the product surface. Make it look realistic."
      );
    }

    promptParts.push(
      "Keep the same shoe shape, angle, and proportions. Generate a photorealistic product image on a clean white/light background."
    );

    const prompt = promptParts.join("\n");

    // Build content array with images
    const content: any[] = [{ type: "text", text: prompt }];

    // Source product image
    const sourceDataUri = await ensureDataUri(sourceImage);
    console.log("Source image MIME:", sourceDataUri.substring(0, 30));
    content.push({
      type: "image_url",
      image_url: { url: sourceDataUri },
    });

    // Color reference image (optional)
    if (colorRefImage) {
      const colorDataUri = await ensureDataUri(colorRefImage);
      content.push({
        type: "text",
        text: "Color reference image (match this color):",
      });
      content.push({
        type: "image_url",
        image_url: { url: colorDataUri },
      });
    }

    // Material texture image (optional)
    if (materialImage) {
      const materialDataUri = await ensureDataUri(materialImage);
      content.push({
        type: "text",
        text: "Material/texture reference image (apply this texture to the product):",
      });
      content.push({
        type: "image_url",
        image_url: { url: materialDataUri },
      });
    }

    console.log("Generating customized product image...");

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
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
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(`AI Gateway returned ${response.status}`);
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message;

    console.log("Response keys:", message ? Object.keys(message).join(", ") : "no message");

    // Extract image from response
    let generatedImage: string | null = null;

    if (message?.images?.[0]?.image_url?.url) {
      generatedImage = message.images[0].image_url.url;
    } else if (message?.images?.[0]?.url) {
      generatedImage = message.images[0].url;
    } else if (typeof message?.content === "string") {
      const match = message.content.match(
        /(data:image\/[^;]+;base64,[A-Za-z0-9+/=]+)/
      );
      if (match) generatedImage = match[1];
    } else if (Array.isArray(message?.content)) {
      for (const part of message.content) {
        if (part.type === "image_url" && part.image_url?.url) {
          generatedImage = part.image_url.url;
          break;
        }
        if (part.type === "image" && part.url) {
          generatedImage = part.url;
          break;
        }
      }
    }

    if (!generatedImage) {
      const responseStr = JSON.stringify(data);
      console.error("No image found. Response (first 2000):", responseStr.substring(0, 2000));
      throw new Error("No image generated by AI model.");
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
