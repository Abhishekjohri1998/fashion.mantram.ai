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
    const { productImage, category, keywords, colorHex, materialImage, materialLabel, modelPhoto } = await req.json();

    if (!productImage) {
      return new Response(JSON.stringify({ error: "productImage is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    function mimeFromUrl(url: string): string {
      const ext = url.split("?")[0].split(".").pop()?.toLowerCase();
      const map: Record<string, string> = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif", svg: "image/svg+xml" };
      return map[ext || ""] || "image/png";
    }

    async function ensureDataUri(input: string): Promise<string> {
      // Fix data URIs with non-image MIME (e.g. application/octet-stream from FileReader)
      if (input.startsWith("data:") && !input.startsWith("data:image/")) {
        const base64Part = input.split(",")[1];
        if (base64Part) return `data:image/png;base64,${base64Part}`;
      }
      if (input.startsWith("data:image/")) return input;
      if (input.startsWith("http")) {
        const resp = await fetch(input);
        const contentType = resp.headers.get("content-type") || "";
        const mime = contentType.startsWith("image/") ? contentType.split(";")[0] : mimeFromUrl(input);
        const buffer = await resp.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = "";
        for (let i = 0; i < bytes.length; i += 8192) {
          const chunk = bytes.subarray(i, Math.min(i + 8192, bytes.length));
          for (let j = 0; j < chunk.length; j++) binary += String.fromCharCode(chunk[j]);
        }
        const base64 = btoa(binary);
        return `data:${mime};base64,${base64}`;
      }
      if (!input.includes(";base64,")) return `data:image/png;base64,${input}`;
      return input;
    }

    const imageDataUri = await ensureDataUri(productImage);

    const categoryLabels: Record<string, string> = {
      footwear: "shoe",
      jacket: "jacket",
      dress: "dress",
      tshirt: "t-shirt",
    };
    const productType = categoryLabels[category || "footwear"] || "garment";

    // Build a rich prompt incorporating keywords, color, and material
    // Build keyword descriptions for model and scene
    const keywordStr = Array.isArray(keywords) && keywords.length > 0 ? keywords.join(", ") : "";

    let modelDescription = "a model";
    let sceneDescription = "a stylish environment";

    // Extract model/person descriptors from keywords
    if (keywordStr) {
      modelDescription = `a model matching these descriptions: ${keywordStr}`;
      sceneDescription = `an environment/setting that matches: ${keywordStr}`;
    }

    // Check if a model reference photo was provided
    const hasModelPhoto = !!modelPhoto;
    
    let promptText = `You are a fashion product photography AI. Your #1 priority is DESIGN FIDELITY.

ABSOLUTE RULE — DESIGN PRESERVATION:
The attached product image is the GROUND TRUTH. The ${productType} in the final lifestyle photo MUST be a pixel-perfect match of this exact design:
- SAME silhouette, cut, proportions, length, neckline, hemline
- SAME pattern, print, graphics, logos, embroidery — reproduced exactly
- SAME color (${colorHex ? `exact hex: ${colorHex}` : "match the product image colors precisely"})
- SAME material appearance${materialLabel ? ` (${materialLabel})` : ""} — texture, sheen, drape must match
- SAME construction details: stitching, seams, buttons, zippers, hardware, straps, laces
- DO NOT simplify, reinterpret, or "inspire from" the design. COPY it exactly.
- The product should be the visual hero of the image — sharp, well-lit, clearly visible

${hasModelPhoto ? `FACE IDENTITY PRESERVATION:
A reference photo of the model is provided. The person in the final image MUST have the EXACT SAME face, facial features, skin tone, hair color, and appearance as the reference photo.` : ""}

SCENE & MODEL:
${keywordStr ? `Follow these keywords precisely for the model and scene: "${keywordStr}"` : `Show ${modelDescription} in ${sceneDescription}`}
${hasModelPhoto ? "- Use the reference photo person's exact face and appearance" : "- The model should complement the product"}
- Professional fashion editorial photography
- The ${productType} must be the center of attention, sharply in focus
- Natural, flattering lighting that shows material texture accurately
- Full or 3/4 body shot showing the complete ${productType}

DO NOT alter the design in any way. The output must look like the SAME physical ${productType} was photographed on a real person.`;

    if (materialLabel) {
      promptText += `\n\nMATERIAL NOTE: The fabric/material is ${materialLabel}. Show its characteristic texture, weight, and drape realistically.`;
    }

    console.log("Generating lifestyle image for", productType, "with keywords:", keywords);

    // Build content: product image FIRST (most important reference), then optional references
    const content: any[] = [
      { type: "text", text: "REFERENCE PRODUCT — This is the exact design that must appear in the lifestyle photo:" },
      { type: "image_url", image_url: { url: imageDataUri } },
    ];

    // Model reference photo
    if (modelPhoto) {
      const modelPhotoUri = await ensureDataUri(modelPhoto);
      content.push(
        { type: "text", text: "MODEL REFERENCE — Use this person's exact face and appearance:" },
        { type: "image_url", image_url: { url: modelPhotoUri } },
      );
    }

    // Material reference
    if (materialImage) {
      const materialDataUri = await ensureDataUri(materialImage);
      content.push(
        { type: "text", text: "MATERIAL TEXTURE REFERENCE — The product should have this exact texture:" },
        { type: "image_url", image_url: { url: materialDataUri } },
      );
    }

    // Final instruction after all images
    content.push({ type: "text", text: promptText });


    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages: [{ role: "user", content }],
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
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI Gateway returned ${response.status}`);
    }

    const rawText = await response.text();
    if (!rawText || rawText.trim().length === 0) {
      throw new Error("AI service returned an empty response. Please try again.");
    }
    let data;
    try { data = JSON.parse(rawText); } catch {
      console.error("Failed to parse AI response:", rawText.substring(0, 500));
      throw new Error("AI service returned an invalid response. Please try again.");
    }

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
        if (part.type === "image_url" && part.image_url?.url) { generatedImage = part.image_url.url; break; }
        if (part.type === "image" && part.url) { generatedImage = part.url; break; }
      }
    }

    if (!generatedImage) {
      console.error("No image found:", JSON.stringify(data).substring(0, 2000));
      throw new Error("No lifestyle image generated. Please try again.");
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
