import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import type { Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { pathToFileURL } from "node:url";
import { LanguageProvider } from "@/i18n";
import { guestInvitationCopy } from "@/i18n/guest-invitations";
import { privateGatheringCopy } from "@/i18n/private-gatherings";
const fixture=vi.hoisted(()=>({ create:vi.fn(), manage:vi.fn() }));
vi.mock("@/lib/guest-invitations.functions",()=>({createGuestInvitation:fixture.create,manageGuestInvitations:fixture.manage}));
import { GuestInvitation } from "@/components/guest-invitation";
import { HostGuestInvitations } from "@/components/host-guest-invitations";
const token="A".repeat(43), id="62000000-0000-4000-8000-000000000001";
const details={subject:"Private tea",starts_at:"2027-01-01T12:00:00Z",venue_name:"Home",address:"Private address",description:"Bring tea",response:"invited",guest_name:null,expires_at:"2027-01-01T12:00:00Z"};

describe.skipIf(!process.env.HAVATO_TEST_JSDOM)("guest invitation DOM",()=>{
  let root:Root, host:HTMLElement, qc:QueryClient;
  const fetcher=vi.fn();
  beforeEach(async()=>{
    const { JSDOM }=await import(/* @vite-ignore */pathToFileURL(process.env.HAVATO_TEST_JSDOM!).href);
    const dom=new JSDOM("<html><body><div id='root'></div></body></html>",{url:`http://localhost/guest-invite#${token}`});
    for(const key of ["window","document","navigator","HTMLElement","HTMLInputElement","Element","Node","Event","CustomEvent"] as const) vi.stubGlobal(key,key==="window"?dom.window:dom.window[key]);
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT",true);vi.stubGlobal("fetch",fetcher);
    fetcher.mockReset();fetcher.mockImplementation(async(_url,init)=>{
      const data=JSON.parse(init.body);return Response.json({...details,response:data.response??"invited",guest_name:data.name??null});
    });
    fixture.create.mockReset();fixture.manage.mockReset();fixture.manage.mockResolvedValue([]);
    fixture.create.mockResolvedValue({id,token,expires_at:details.expires_at});
    const { createRoot } = await import("react-dom/client");
    qc=new QueryClient({defaultOptions:{queries:{retry:false}}});host=document.getElementById("root")!;root=createRoot(host);
  },30000);
  afterEach(async()=>{if(root)await act(async()=>root.unmount());qc?.clear();vi.unstubAllGlobals();});
  async function render(component=createElement(GuestInvitation)){
    await act(async()=>{root.render(createElement(LanguageProvider,{children:createElement(QueryClientProvider,{client:qc},component)}));});
    await act(async()=>{await new Promise(r=>setTimeout(r,30));});
  }
  const button=(text:string)=>Array.from(host.querySelectorAll("button")).find(b=>b.textContent===text)!;
  async function open(lang="fa"){
    await act(async()=>{(host.querySelector('input[type="checkbox"]') as HTMLInputElement).click();});
    await act(async()=>button(guestInvitationCopy[lang]["guest.open"]).click());
  }
  async function input(selector:string,value:string){
    const field=host.querySelector(selector) as HTMLInputElement;
    await act(async()=>{Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,"value")!.set!.call(field,value);field.dispatchEvent(new Event("input",{bubbles:true}));});
  }
  it.each(["fa","en"])("requires 18+, keeps details private, supports all responses in %s",async lang=>{
    window.history.replaceState(null,"",`/guest-invite?lang=${lang}#${token}`);await render();
    expect(document.documentElement.dir).toBe(lang==="fa"?"rtl":"ltr");
    expect(host.textContent).not.toContain("Private tea");expect(fetcher).not.toHaveBeenCalled();
    expect(window.location.hash).toBe("");expect(button(guestInvitationCopy[lang]["guest.open"]).disabled).toBe(true);
    await open(lang);expect(host.textContent).toContain("Private tea");
    expect(button(privateGatheringCopy[lang]["private.going"]).disabled).toBe(true);
    await input("#guest-name","Guest");
    for(const response of ["going","maybe","declined"]){
      await act(async()=>button(privateGatheringCopy[lang][`private.${response}`]).click());
      expect(JSON.parse(fetcher.mock.calls.at(-1)![1].body)).toMatchObject({token,adult:true,response,name:"Guest"});
      expect(button(privateGatheringCopy[lang][`private.${response}`]).getAttribute("aria-pressed")).toBe("true");
    }
  });
  it("rejects malformed fragment without revealing or requesting details",async()=>{
    window.history.replaceState(null,"","/guest-invite#invalid");await render();
    expect(host.querySelector('[role="alert"]')?.textContent).toContain(guestInvitationCopy.fa["guest.unavailable"]);expect(fetcher).not.toHaveBeenCalled();
  });
  it("keeps prior response on full and permits retry",async()=>{
    await render();await open();await input("#guest-name","Guest");
    fetcher.mockResolvedValueOnce(Response.json({code:"full"},{status:409}));
    await act(async()=>button(privateGatheringCopy.fa["private.going"]).click());
    expect(host.querySelector('[role="alert"]')?.textContent).toBe(privateGatheringCopy.fa["private.full"]);
    expect(button(privateGatheringCopy.fa["private.going"]).getAttribute("aria-pressed")).toBe("false");
    expect(button(privateGatheringCopy.fa["private.going"]).disabled).toBe(false);
  });
  it("clears private details after revoked/unavailable response",async()=>{
    await render();await open();await input("#guest-name","Guest");
    fetcher.mockResolvedValueOnce(Response.json({code:"unavailable"},{status:404}));
    await act(async()=>button(privateGatheringCopy.fa["private.maybe"]).click());
    expect(host.textContent).not.toContain("Private tea");expect(host.textContent).toContain(guestInvitationCopy.fa["guest.unavailable"]);
  });
  it("shows throttling error and allows retry",async()=>{
    fetcher.mockResolvedValueOnce(Response.json({code:"limited"},{status:429}));await render();await open();
    expect(host.textContent).toContain(guestInvitationCopy.fa["guest.limited"]);
    await act(async()=>button(guestInvitationCopy.fa["guest.open"]).click());expect(host.textContent).toContain("Private tea");
  });
  it("lets the host create an individual fragment link and revoke the exact invitation",async()=>{
    fixture.manage.mockResolvedValue([{id,label:"Maryam",guest_name:"Maryam",response:"going",expires_at:details.expires_at,revoked_at:null,created_at:"2026-10-10T00:00:00Z"}]);
    await render(createElement(HostGuestInvitations,{gatheringId:id,userId:"host",open:true}));
    await input("#guest-label","Maryam");
    await act(async()=>host.querySelector("form")!.dispatchEvent(new Event("submit",{bubbles:true,cancelable:true})));
    expect(fixture.create).toHaveBeenCalledWith({data:{id,label:"Maryam",days:3}});
    expect((host.querySelector("#guest-link") as HTMLInputElement).value).toBe(`http://localhost/guest-invite#${token}`);
    await act(async()=>button(privateGatheringCopy.fa["private.revoke"]).click());
    expect(fixture.manage).toHaveBeenCalledWith({data:{id,action:"revoke",invitation:id}});
    expect(host.querySelector("#guest-link")).toBeNull();
  });
  it("disables host creation for closed gatherings",async()=>{
    await render(createElement(HostGuestInvitations,{gatheringId:id,userId:"host",open:false}));
    expect(button(guestInvitationCopy.fa["guest.create"]).disabled).toBe(true);
  });
});
