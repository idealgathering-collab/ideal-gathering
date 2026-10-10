import { createHash, createHmac } from "node:crypto";
import { isIP } from "node:net";
import { guestRequest, guestDetails } from "./guest-invitations";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const headers = {
  "content-type": "application/json; charset=utf-8", "cache-control": "no-store, private",
  "referrer-policy": "no-referrer", "x-robots-tag": "noindex, nofollow, noarchive",
};
function reply(code: string, status: number) { return Response.json({ code }, { status, headers }); }

export async function handleGuestInvitation(request: Request): Promise<Response> {
  if (request.method !== "POST") return reply("failed",405);
  if (request.headers.get("origin") !== new URL(request.url).origin) return reply("failed",403);
  if (!request.headers.get("content-type")?.startsWith("application/json")) return reply("failed",415);
  // Bound the actual streamed body, including requests with no Content-Length.
  const reader = request.body?.getReader();
  if (!reader) return reply("failed",400);
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > 2048) { await reader.cancel(); return reply("failed",413); }
      chunks.push(value);
    }
    const parsed = guestRequest.safeParse(JSON.parse(Buffer.concat(chunks).toString("utf8")));
    if (!parsed.success) return reply("unavailable",400);
    const input = parsed.data;
    const hash = createHash("sha256").update(input.token).digest("hex");
    // Never trust X-Forwarded-For by default. Configure only a header the ingress
    // overwrites/strips from client requests; otherwise global/token limits apply.
    const ipHeader = process.env.GUEST_INVITE_TRUSTED_IP_HEADER;
    const ip = ipHeader ? request.headers.get(ipHeader)?.trim() : undefined;
    const ipHash = ip && isIP(ip) && process.env.SUPABASE_SERVICE_ROLE_KEY
      ? createHmac("sha256",process.env.SUPABASE_SERVICE_ROLE_KEY).update(ip).digest("hex") : undefined;
    const limit = await supabaseAdmin.rpc("guest_invitation_limit", { _hash: hash, ...(ipHash ? { _ip_hash: ipHash } : {}) });
    if (limit.error) return reply("failed",503);
    if (limit.data !== true) return new Response(JSON.stringify({ code: "limited" }), { status: 429, headers: { ...headers, "retry-after": "600" } });
    const result = await supabaseAdmin.rpc("use_guest_invitation", {
      _hash: hash, _adult: true, ...(input.response ? { _response: input.response, _name: input.name } : {}),
    });
    if (result.error) return reply(result.error.message.includes("GATHERING_FULL") ? "full" : "failed",409);
    if (!result.data) return reply("unavailable",404);
    const details = guestDetails.parse(result.data);
    if (input.coordination) {
      const coordination = await supabaseAdmin.rpc("guest_coordination", {
        _hash: hash, _adult: true, _data: input.coordination.operation === "list" ? {} : input.coordination,
      });
      if (coordination.error) return reply(coordination.error.message.includes("TASK_TAKEN") ? "taken" : "failed",409);
      if (!coordination.data) return reply("unavailable",404);
      details.coordination = coordination.data as typeof details.coordination;
    }
    return Response.json(guestDetails.parse(details), { headers });
  } catch {
    // Do not log request bodies, bearer capabilities or backend errors.
    return reply("failed",503);
  } finally { reader.releaseLock(); }
}
