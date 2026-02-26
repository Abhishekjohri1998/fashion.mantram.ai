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
    const { imageUrl, category, measurements } = await req.json();
    const isLastDrawing = category === "footwear_last";

    if (!imageUrl && !isLastDrawing) {
      return new Response(JSON.stringify({ error: "imageUrl is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Use the public URL if available, otherwise send base64
    const imageContent = imageUrl
      ? (imageUrl.startsWith("http") || imageUrl.startsWith("data:") ? imageUrl : imageUrl)
      : null;

    const productType = category || "product";

    // Build measurement annotation text
    let measurementText = "";
    if (measurements && typeof measurements === "object" && Object.keys(measurements).length > 0) {
      const entries = Object.entries(measurements)
        .filter(([_, v]) => typeof v === "number" || typeof v === "string")
        .map(([key, value]) => {
          const label = key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
          return `${label}: ${value}`;
        });
      if (entries.length > 0) {
        measurementText = `\n\nIMPORTANT: Annotate the drawing with these EXACT measurements using dimension lines and labels. Place measurement arrows/lines pointing to the corresponding parts:\n${entries.join("\n")}\n\nEach measurement MUST be clearly visible with dimension lines (arrows on both ends) and the numeric value written next to the line. Use standard technical drawing annotation style.`;
      }
    }

    let prompt: string;

    if (isLastDrawing) {
      prompt = `You are a technical footwear engineering illustrator specializing in shoe lasts. Generate a professional technical drawing sheet showing a SHOE LAST (the wooden/plastic mold used to shape shoes) from FOUR VIEWS arranged in a 2x2 grid:

TOP-LEFT: Side profile view (medial) — showing the full last silhouette with:
  - Footwear Length dimension line (heel to toe)
  - Heel/Instep Length dimension line
  - Ball Girth cross-section line
  - Instep Perimeter cross-section line
  - Key points labeled: K (back curve), B (heel), S (sole), F (instep), A (toe tip)

TOP-RIGHT: Three-quarter oblique view — showing:
  - Back Center Line and Front Center Line marked on the last surface
  - Vamp Point (G) labeled
  - Shoe-last axis line
  - Ball Girth cross-section visible
  - Key points: K, B, E, D, A

BOTTOM-LEFT: Side profile view (lateral) — showing:
  - Key construction points: H (top), G, C, E, A
  - Reference lines and curves on the last surface

BOTTOM-RIGHT: Bottom/sole view — showing:
  - Waist Girth cross-section
  - Feather Line (outline of sole edge)
  - Lower Center Line
  - Key points: N, O, M, S

Requirements:
- Clean monochrome technical drawing style with thin precise lines on white background
- All dimension lines with arrows on both ends and numeric values
- Professional CAD/blueprint aesthetic
- Yellow/gold construction lines on the last surface for reference curves${measurementText}

Generate the technical drawing sheet now.`;
    } else {
      prompt = `You are a technical fashion illustrator. Look at the attached ${productType} product photo and create a clean technical CAD-style line drawing of it. Requirements:
- Wireframe/blueprint style with clean outlines and construction lines
- Monochrome with thin precise lines on white background  
- Professional tech pack illustration style${measurementText}

Generate the technical drawing image now.`;
    }

    console.log("Starting AI image generation for category:", productType, "with", measurements ? Object.keys(measurements).length : 0, "measurements", "isLast:", isLastDrawing);

    // Build message content: text-only for last drawings, image+text for product drawings
    const messageContent = isLastDrawing
      ? prompt  // Text-only prompt for generating a last from scratch
      : [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: imageContent } },
        ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages: [
          {
            role: "user",
            content: messageContent,
          },
        ],
        modalities: ["image", "text"],
      }),
    });

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

      throw new Error(`AI Gateway returned ${response.status}: ${errorText.substring(0, 200)}`);
    }

    const data = await response.json();

    // Check for embedded errors in the choices array (e.g. upstream 429)
    const choiceError = data.choices?.[0]?.error;
    if (choiceError) {
      const code = choiceError.code || 500;
      const msg = choiceError.metadata?.raw
        ? JSON.parse(choiceError.metadata.raw)?.error?.message || choiceError.message
        : choiceError.message;
      console.error("Upstream error in choices:", code, msg);
      const isRateLimit = code === 429 || (typeof msg === "string" && msg.toLowerCase().includes("resource exhausted"));
      const status = isRateLimit ? 429 : code === 402 ? 402 : 500;
      return new Response(
        JSON.stringify({ error: isRateLimit ? "Rate limit exceeded. Please try again in a moment." : msg }),
        { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if error message is in the content itself
    const contentStr = typeof data.choices?.[0]?.message?.content === "string" ? data.choices[0].message.content : "";
    if (contentStr.toLowerCase().includes("resource exhausted")) {
      console.error("Resource exhausted detected in content");
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Also check top-level error
    if (data.error) {
      const errMsg = typeof data.error === "string" ? data.error : data.error.message || JSON.stringify(data.error);
      const isRateLimit = errMsg.toLowerCase().includes("resource exhausted") || errMsg.toLowerCase().includes("rate limit");
      console.error("Top-level error:", errMsg);
      return new Response(
        JSON.stringify({ error: isRateLimit ? "Rate limit exceeded. Please try again in a moment." : errMsg }),
        { status: isRateLimit ? 429 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log the full response structure for debugging
    const message = data.choices?.[0]?.message;
    console.log("Response message keys:", message ? Object.keys(message).join(", ") : "no message");

    if (message?.images) {
      console.log("Images array length:", message.images.length);
      if (message.images[0]) {
        console.log("First image keys:", Object.keys(message.images[0]).join(", "));
      }
    }

    // Try multiple extraction paths
    let generatedImage: string | null = null;

    // Path 1: message.images[].image_url.url (documented format)
    if (message?.images?.[0]?.image_url?.url) {
      generatedImage = message.images[0].image_url.url;
      console.log("Found image via path: images[0].image_url.url");
    }

    // Path 2: message.images[].url
    if (!generatedImage && message?.images?.[0]?.url) {
      generatedImage = message.images[0].url;
      console.log("Found image via path: images[0].url");
    }

    // Path 3: Check content for inline base64
    if (!generatedImage && typeof message?.content === "string") {
      const match = message.content.match(/(data:image\/[^;]+;base64,[A-Za-z0-9+/=]+)/);
      if (match) {
        generatedImage = match[1];
        console.log("Found image via inline base64 in content");
      }
    }

    // Path 4: content might be an array with image parts
    if (!generatedImage && Array.isArray(message?.content)) {
      for (const part of message.content) {
        if (part.type === "image_url" && part.image_url?.url) {
          generatedImage = part.image_url.url;
          console.log("Found image via content array image_url");
          break;
        }
        if (part.type === "image" && part.url) {
          generatedImage = part.url;
          console.log("Found image via content array image url");
          break;
        }
      }
    }

    if (!generatedImage) {
      // Log truncated response for debugging
      const responseStr = JSON.stringify(data);
      console.error("No image found. Full response (first 3000 chars):", responseStr.substring(0, 3000));
      throw new Error("No image in AI response. The model may not have generated an image for this input.");
    }

    return new Response(JSON.stringify({ drawing: generatedImage }), {
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
