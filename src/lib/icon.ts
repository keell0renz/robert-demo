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

// Generate an app icon and return it as a PNG data URL ready to store/render.
// `subject` is a short visual brief (e.g. "a steaming coffee cup" / "AI assistant").
export async function generateAppIcon(subject: string): Promise<string> {
  const { image } = await generateImage({
    model: openai.image("gpt-image-1"),
    prompt: `A modern macOS-style app icon. Subject: ${subject}. ${STYLE_RAILS}`,
    size: "1024x1024",
    providerOptions: {
      // Keep cost down for the demo; the tile is small in the dock anyway.
      openai: { quality: "low", outputFormat: "png" },
    },
  });
  return `data:image/png;base64,${image.base64}`;
}
