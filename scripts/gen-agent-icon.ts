// One-off: generate the central Agent app's logo so its dock tile matches the
// AI-generated app icons. Writes public/agent-icon.png.
//   node --env-file-if-exists=.env --import tsx scripts/gen-agent-icon.ts
import { writeFileSync } from "node:fs";
import { generateAppIcon } from "../src/lib/icon";

async function main() {
  const dataUrl = await generateAppIcon(
    "a friendly AI assistant: a single glowing four-point sparkle / spark mark, " +
      "indigo-to-violet gradient, soft inner glow, centred",
  );
  const base64 = dataUrl.split(",")[1] ?? "";
  writeFileSync("public/agent-icon.png", Buffer.from(base64, "base64"));
  console.log("wrote public/agent-icon.png");
  process.exit(0);
}

void main();
