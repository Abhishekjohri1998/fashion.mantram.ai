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
    const { productImage, category, colorHex, materialLabel, materialImage, modelPhoto } = await req.json();

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
      const map: Record<string, string> = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif" };
      return map[ext || ""] || "image/png";
    }

    async function ensureDataUri(input: string): Promise<string> {
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
        return `data:${mime};base64,${btoa(binary)}`;
      }
      if (!input.includes(";base64,")) return `data:image/png;base64,${input}`;
      return input;
    }

    const imageDataUri = await ensureDataUri(productImage);

    // Category-specific detail shots
    const detailsByCategory: Record<string, string[]> = {
      footwear: [
        "extreme closeup of the toe box construction, stitching, and material texture",
        "closeup of the heel counter and back tab detailing",
        "sole tread pattern and outsole material from below at an angle",
        "lacing system / closure mechanism detail (eyelets, lace tips, tongue)",
        "side profile showing the midsole stack, cushioning layers",
        "interior lining and insole branding detail shot",
      ],
      jacket: [
        "closeup of the collar/lapel construction and stitching",
        "zipper or button closure detail with hardware closeup",
        "sleeve cuff and hem finishing detail",
        "pocket construction and flap detailing",
        "back panel seaming and yoke construction",
        "interior lining, label, and inner pocket detail",
      ],
      dress: [
        "neckline and collar/bodice construction closeup",
        "waistline seaming, dart, or gathering detail",
        "hem finishing and skirt drape detail at ankle/knee level",
        "sleeve or shoulder construction closeup",
        "back closure (zipper, buttons, or ties) detail",
        "fabric texture and pattern detail at macro level",
      ],
      tshirt: [
        "neckline rib knit construction and stitching closeup",
        "shoulder seam and sleeve attachment detail",
        "hem and side seam finishing closeup",
        "fabric weave/knit texture at macro level",
        "sleeve cuff and length detail",
        "back panel and label/tag detail",
      ],
    };

    const categoryLabels: Record<string, string> = {
      footwear: "shoe",
      jacket: "jacket",
      dress: "dress",
      tshirt: "t-shirt",
    };
    const productType = categoryLabels[category || "footwear"] || "garment";
    const details = detailsByCategory[category || "footwear"] || detailsByCategory.footwear;

    const hasModelPhoto = !!modelPhoto;

    const promptText = `You are a fashion product photography AI specializing in editorial detail collages.

TASK: Generate a SINGLE COLLAGE IMAGE that artfully combines multiple closeup detail shots of the ${productType} shown in the reference image. This must be ONE unified image — a beautifully composed collage, NOT separate images.

ABSOLUTE RULE — DESIGN PRESERVATION:
The attached product image is the GROUND TRUTH. Every detail shown MUST be from the EXACT SAME product:
- SAME colors${colorHex ? ` (exact hex: ${colorHex})` : ""}
- SAME materials${materialLabel ? ` (${materialLabel})` : ""}, textures, patterns
- SAME construction details, hardware, stitching
- DO NOT alter, simplify, or reinterpret ANY design element

COLLAGE COMPOSITION — Include these detail views artfully arranged in one image:
1. ${details[0]}
2. ${details[1]}
3. ${details[2]}
4. ${details[3]}
5. ${details[4]}
6. ${details[5]}

${hasModelPhoto ? `The model wearing the product should match the reference photo's face and appearance exactly.` : "Show the product being worn by a model where appropriate for context."}

PHOTOGRAPHY & LAYOUT STYLE:
- Professional macro/closeup fashion photography
- Arrange all detail shots as ONE cohesive collage — like a high-end lookbook detail page
- Use creative overlapping, varied sizes, and asymmetric layout for editorial feel
- Shallow depth of field with tack-sharp focus on each detail area
- Soft, diffused lighting that reveals texture and construction
- Consistent warm color grading across the entire collage
- Include subtle thin white or cream borders/gaps between sections
- The overall image should feel like a single curated editorial spread, NOT a rigid grid

OUTPUT: A single beautiful collage image combining all detail shots into one unified composition.`;

    const content: any[] = [
      { type: "text", text: "REFERENCE PRODUCT — Show closeup details of this exact product:" },
      { type: "image_url", image_url: { url: imageDataUri } },
    ];

    if (modelPhoto) {
      const modelPhotoUri = await ensureDataUri(modelPhoto);
      content.push(
        { type: "text", text: "MODEL REFERENCE — Use this person when showing worn details:" },
        { type: "image_url", image_url: { url: modelPhotoUri } },
      );
    }

    if (materialImage) {
      const materialDataUri = await ensureDataUri(materialImage);
      content.push(
        { type: "text", text: "MATERIAL TEXTURE REFERENCE:" },
        { type: "image_url", image_url: { url: materialDataUri } },
      );
    }

    content.push({ type: "text", text: promptText });

    console.log("Generating detail grid for", productType);

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
      throw new Error("No detail grid generated. Please try again.");
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
