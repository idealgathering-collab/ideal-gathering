import { describe, expect, it, vi, beforeEach } from "vitest";
import { createHash } from "node:crypto";
import { guestToken, guestRequest, requestGuestInvitation } from "@/lib/guest-invitations";
const fixture=vi.hoisted(()=>({ rpc: vi.fn() }));
vi.mock("@/integrations/supabase/client.server",()=>({ supabaseAdmin:{ rpc:fixture.rpc } }));
import { handleGuestInvitation } from "@/lib/guest-invitations.server";
const token="A".repeat(43);
const details={ subject:"Private tea",starts_at:"2027-01-01T12:00:00Z",venue_name:"Home",address:null,description:null,response:"invited",guest_name:null,expires_at:"2027-01-01T12:00:00Z" };
const req=(body:unknown={token,adult:true},headers:Record<string,string>={})=>new Request("https://havato.test/api/guest-invitation",{ method:"POST",headers:{origin:"https://havato.test","content-type":"application/json",...headers},body:JSON.stringify(body) });
beforeEach(()=>{ fixture.rpc.mockReset(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); fixture.rpc.mockImplementation(async (name:string)=>({data:name==="guest_invitation_limit"?true:details,error:null})); });
describe("guest server boundary",()=>{
  it("keeps tokens out of database calls and returns private noncacheable data",async()=>{
    const response=await handleGuestInvitation(req()); expect(response.status).toBe(200);
    const hash=createHash("sha256").update(token).digest("hex");
    expect(fixture.rpc).toHaveBeenNthCalledWith(1,"guest_invitation_limit",{_hash:hash});
    expect(fixture.rpc).toHaveBeenNthCalledWith(2,"use_guest_invitation",{_hash:hash,_adult:true});
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(await response.json()).toEqual(details);
  });
  it.each([false,null,undefined])("never resolves a guest who has not attested adulthood: %s",async adult=>{
    expect((await handleGuestInvitation(req({token,adult}))).status).toBe(400); expect(fixture.rpc).not.toHaveBeenCalled();
  });
  it.each(["https://attacker.test",""])("rejects foreign or absent origin %s",async origin=>{
    expect((await handleGuestInvitation(req(undefined,{origin}))).status).toBe(403);expect(fixture.rpc).not.toHaveBeenCalled();
  });
  it("rejects GET and non-JSON",async()=>{
    expect((await handleGuestInvitation(new Request("https://havato.test/api/guest-invitation"))).status).toBe(405);
    expect((await handleGuestInvitation(req(undefined,{"content-type":"text/plain"}))).status).toBe(415);
  });
  it("bounds actual body bytes without Content-Length",async()=>{
    expect((await handleGuestInvitation(req({token,adult:true,name:"a".repeat(3000)}))).status).toBe(413);expect(fixture.rpc).not.toHaveBeenCalled();
  });
  it("does not resolve a throttled request",async()=>{
    fixture.rpc.mockResolvedValue({data:false,error:null});const response=await handleGuestInvitation(req());
    expect(response.status).toBe(429);expect(response.headers.get("retry-after")).toBe("600");expect(fixture.rpc).toHaveBeenCalledTimes(1);
  });
  it("ignores spoofable proxy headers unless explicitly configured",async()=>{
    await handleGuestInvitation(req(undefined,{"x-forwarded-for":"203.0.113.4"}));
    expect(fixture.rpc.mock.calls[0][1]).not.toHaveProperty("_ip_hash");
  });
  it("hashes configured single-IP ingress identity",async()=>{
    vi.stubEnv("GUEST_INVITE_TRUSTED_IP_HEADER","x-client-ip");vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY","fixture-only");
    await handleGuestInvitation(req(undefined,{"x-client-ip":"203.0.113.4"}));
    expect(fixture.rpc.mock.calls[0][1]._ip_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(JSON.stringify(fixture.rpc.mock.calls)).not.toContain("203.0.113.4");
  });
  it("collapses unavailable capabilities to a generic result",async()=>{
    fixture.rpc.mockImplementation(async (name:string)=>({data:name==="guest_invitation_limit"?true:null,error:null}));
    const response=await handleGuestInvitation(req()); expect(response.status).toBe(404);expect(await response.json()).toEqual({code:"unavailable"});
  });
  it("hides database error details and maps full capacity",async()=>{
    fixture.rpc.mockImplementation(async (name:string)=> name==="guest_invitation_limit"?{data:true,error:null}:{data:null,error:{message:"GATHERING_FULL: private internal details"}});
    const response=await handleGuestInvitation(req({token,adult:true,response:"going",name:"Guest"}));
    expect(await response.json()).toEqual({code:"full"});
  });
  it("fails closed if rate storage fails",async()=>{
    fixture.rpc.mockResolvedValue({data:null,error:{message:"secret"}});
    expect((await handleGuestInvitation(req())).status).toBe(503);expect(fixture.rpc).toHaveBeenCalledTimes(1);
  });
});
describe("guest client contract",()=>{
  it("requires a valid capability, adulthood and a name for RSVP",()=>{
    expect(guestToken.safeParse("short").success).toBe(false);
    expect(guestRequest.safeParse({token,adult:true,response:"going"}).success).toBe(false);
    expect(guestRequest.safeParse({token,adult:true,response:"declined",name:"Guest"}).success).toBe(true);
    expect(guestRequest.safeParse({token,adult:true,host_id:"fake"}).success).toBe(false);
  });
  it("transmits the token in a POST body, never the URL",async()=>{
    const fetcher=vi.fn().mockResolvedValue(Response.json(details));vi.stubGlobal("fetch",fetcher);
    await requestGuestInvitation({token,adult:true});
    expect(fetcher.mock.calls[0][0]).toBe("/api/guest-invitation");
    expect(fetcher.mock.calls[0][1]).toMatchObject({method:"POST",cache:"no-store",referrerPolicy:"no-referrer"});
  });
});
