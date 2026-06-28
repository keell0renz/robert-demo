import { eq } from "drizzle-orm";
import { db } from "@/db";
import { apps } from "@/db/schema";

// Serve an app's generated icon as a PNG. The icon is stored as a data URL on
// the row; the dock requests this with a ?v= cache-buster so a regenerated icon
// shows up. 404 when the app has no icon yet → the dock falls back to its letter.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const [row] = await db
    .select({ icon: apps.icon })
    .from(apps)
    .where(eq(apps.id, id))
    .limit(1);

  if (!row?.icon) return new Response("No icon", { status: 404 });

  const base64 = row.icon.split(",")[1] ?? "";
  const bytes = Buffer.from(base64, "base64");
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "image/png",
      // The URL carries a version, so each icon version is immutable.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
