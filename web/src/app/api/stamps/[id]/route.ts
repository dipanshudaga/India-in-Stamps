import type { NextRequest } from "next/server";

import { getStamp, parseStampId } from "@/lib/stamps-server";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/stamps/[id]">) {
  const { id } = await ctx.params;
  const parsed = parseStampId(id);
  const stamp = parsed === undefined ? undefined : getStamp(parsed);
  if (!stamp) return Response.json({ error: "Stamp not found" }, { status: 404 });
  return Response.json(stamp, { headers: { "Cache-Control": "public, max-age=3600" } });
}
