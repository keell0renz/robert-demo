import sharp from "sharp";
import { openai } from "@ai-sdk/openai";
import { generateImage } from "ai";

// One place that knows how to turn a short description into a macOS-style app
// icon. The rails live here (not in the agent prompt) so every icon comes out
// the same shape and weight — a square tile that fills edge to edge with one
// bold centered symbol, which the dock then clips into a rounded squircle.
const STYLE_RAILS =
  "Fill the ENTIRE square edge to edge (no margins, no transparent areas, no white frame) " +
  "with a rich gradient or solid colour background and ONE bold, simple, centred symbol " +
  "representing the app. Flat modern vector illustration, clean geometric shapes, vibrant but " +
  "tasteful colours, subtle depth. ABSOLUTELY NO text, letters, words, or numbers. Do not draw " +
  "rounded corners — the artwork fills the whole square. High contrast, crisp, iconographic, " +
  "like an icon sitting on the macOS dock.";

// The dock tile is tiny, so we store a small icon. gpt-image only emits 1024px+,
// so we downscale — which ALSO re-encodes the PNG and strips the bulky C2PA
// metadata it embeds. Result: ~5KB of base64 instead of ~1.5MB, which is what
// makes it safe to store and pass around.
const ICON_PX = 128;

// Generate an app icon and return it as a small PNG data URL ready to store/render.
// `subject` is a short visual brief (e.g. "a steaming coffee cup" / "AI assistant").
export async function generateAppIcon(subject: string): Promise<string> {
  const { image } = await generateImage({
    model: openai.image("gpt-image-2"),
    prompt: `A modern macOS-style app icon. Subject: ${subject}. ${STYLE_RAILS}`,
    size: "1024x1024",
    providerOptions: {
      // Keep cost/latency down for the demo; the tile is small in the dock anyway.
      openai: { quality: "low", outputFormat: "png" },
    },
  });

  const small = await sharp(Buffer.from(image.uint8Array))
    .resize(ICON_PX, ICON_PX, { fit: "cover" })
    .png({ compressionLevel: 9 })
    .toBuffer();

  return `data:image/png;base64,${small.toString("base64")}`;
}
