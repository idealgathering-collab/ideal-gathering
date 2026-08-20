import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarClock, MapPin, Users, ArrowLeft, Coffee, Lock, CalendarPlus, Share2, Flag } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { MenuSection } from "@/components/menu-section";
import { GatheringChat, GatheringChecklist } from "@/components/gathering-room";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { VerifyEmailBanner } from "@/components/verify-email-banner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { fetchGathering, formatDateTime } from "@/lib/gatherings";
import { useI18n, useT } from "@/i18n";
import { gatheringHead, type SeoLang } from "@/lib/seo";
import { getPublicGathering } from "@/lib/public-data.functions";
import { getTableFit } from "@/lib/matching.functions";
import { TableFitChip, TakeQuizNudge } from "@/components/table-fit";
import { ReportDialog, type ReportTarget } from "@/components/report-dialog";
import { AttendanceRoster } from "@/components/attendance-roster";
import { checkinWindow } from "@/lib/attendance.functions";
import { useState } from "react";


export const Route = createFileRoute("/gatherings/$id")({
  component: GatheringDetail,
  validateSearch: (search: Record<string, unknown>): { lang?: SeoLang } =>
    search.lang === "tr" || search.lang === "fa" ? { lang: search.lang } : {},
  loader: async ({ params }) => {
    try {
      return { g: await getPublicGathering({ data: { id: params.id } }) };
    } catch {
      return { g: null };
    }
  },
  head: ({ params, match, loaderData }) =>
    gatheringHead(loaderData?.g ?? null, match.search.lang, params.id),
});

function GatheringDetail() {
  const { id } = Route.useParams();
  const { user } = useSession();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const t = useT();
  const { lang } = useI18n();
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);

  const { data: g, isLoading } = useQuery({
    queryKey: ["gathering", id],
    queryFn: () => fetchGathering(id),
  });

  const { data: isOwner = false } = useQuery({
    queryKey: ["gathering-is-owner", g?.business?.id, user?.id],
    enabled: !!user && !!g?.business?.id,
    queryFn: async () => {
      const { isBusinessOwner } = await import("@/lib/business.functions");
      return await isBusinessOwner({ data: { id: g!.business!.id } });
    },
  });

  const { data: fitData } = useQuery({
    queryKey: ["table-fit", user?.id, [id]],
    enabled: !!user,
    queryFn: () => getTableFit({ data: { gatheringIds: [id] } }),
  });
  const fit = fitData?.fits.find((f) => f.gatheringId === id);
  const showQuizNudge = !!user && fitData?.viewerHasTraits === false;


  async function join() {
    if (!user) {
      navigate({ to: "/auth", search: { mode: "signup", redirect: `/gatherings/${id}` } });
      return;
    }
    if (!user.email_confirmed_at) {
      toast.error(t("gd.verifyToJoin"));
      return;
    }
    const { error } = await supabase.from("gathering_attendees").insert({ gathering_id: id, user_id: user.id });
    if (error) {
      const { classifyJoinError } = await import("@/lib/gatherings");
      const reason = classifyJoinError(error);
      if (reason === "full") {
        toast.error(t("gd.joinFull"));
        qc.invalidateQueries({ queryKey: ["gathering", id] });
        return;
      }
      if (reason === "closed") return toast.error(t("gd.joinClosed"));
      if (reason === "already_joined") {
        toast.error(t("gd.joinAlready"));
        qc.invalidateQueries({ queryKey: ["gathering", id] });
        return;
      }
      return toast.error(error.message);
    }
    toast.success(t("gd.joinedOk"));
    qc.invalidateQueries({ queryKey: ["gathering", id] });

  }

  async function leave() {
    if (!user) return;
    const { error } = await supabase.from("gathering_attendees").delete().eq("gathering_id", id).eq("user_id", user.id);
    if (error) return toast.error(error.message);
    toast.success(t("gd.leftOk"));
    qc.invalidateQueries({ queryKey: ["gathering", id] });
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-3xl px-4 py-16 text-center text-muted-foreground">{t("common.loading")}</div>
      </div>
    );
  }

  if (!g) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h1 className="font-display text-4xl">{t("gd.notFound.title")}</h1>
          <p className="mt-2 text-muted-foreground">{t("gd.notFound.body")}</p>
          <Button asChild className="mt-6 rounded-full">
            <Link to="/">{t("common.backToGatherings")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  const attendees = (g.gathering_attendees ?? []) as Array<{ user_id: string }>;
  const isAttending = user ? attendees.some((a) => a.user_id === user.id) : false;
  const seatsLeft = Math.max(0, g.seats - attendees.length);
  const isHost = user?.id === g.host_id;
  const isMember = isHost || isAttending;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero" />
        {g.business?.cover_url && (
          <img src={g.business.cover_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40 mix-blend-multiply" />
        )}
        <div className="relative mx-auto max-w-3xl px-4 py-16 text-primary-foreground">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-primary-foreground/80 hover:text-primary-foreground">
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" /> {t("gd.allGatherings")}
          </Link>
          <div className="mt-4 flex items-center gap-2 text-xs uppercase tracking-wider text-sunshine">
            <Coffee className="h-4 w-4" />
            {g.table?.label ? `${t("gd.table")} ${g.table.label}` : g.neighborhood || t("card.gathering")}
            {g.status !== "approved" && (
              <span className="ms-2 rounded-full bg-sunshine px-2 py-0.5 text-sunshine-foreground">
                {g.status === "proposed"
                  ? t("gd.status.proposed")
                  : g.status === "rejected"
                    ? t("gd.status.rejected")
                    : t("gd.status.cancelled")}
              </span>
            )}
          </div>
          <h1 className="mt-3 font-display text-4xl sm:text-6xl leading-[0.95]">{g.subject}</h1>
          {g.description && <p className="mt-4 max-w-2xl text-primary-foreground/85">{g.description}</p>}
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
              <CalendarClock className="h-3.5 w-3.5 text-primary" /> {t("create.datetime")}
            </div>
            <div className="mt-1 font-display text-lg">{formatDateTime(g.starts_at, lang)}</div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 text-tangerine" /> {t("biz.venue")}
            </div>
            <div className="mt-1 font-display text-lg">{g.business?.name ?? g.venue_name}</div>
            {(g.business?.city || g.neighborhood) && (
              <div className="text-xs text-muted-foreground">{g.business?.city ?? g.neighborhood}</div>
            )}
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
              <Users className="h-3.5 w-3.5 text-primary" /> {t("create.seats")}
            </div>
            <div className="mt-1 font-display text-lg">
              {attendees.length} / {g.seats}
            </div>
            <div className="text-xs text-muted-foreground">
              {seatsLeft > 0 ? t("gd.seatsLeft", { n: seatsLeft }) : t("gd.full")}
            </div>
          </div>
        </div>

        {fit && (
          <div className="mt-6">
            <TableFitChip fit={fit} />
          </div>
        )}
        {showQuizNudge && (
          <div className="mt-6">
            <TakeQuizNudge />
          </div>
        )}



        {user && !user.email_confirmed_at && g.status === "approved" && !isHost && !isOwner && !isAttending && (
          <div className="mt-6">
            <VerifyEmailBanner email={user.email} />
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          {g.status === "approved" && !isHost && !isOwner && (
            isAttending ? (
              <Button variant="outline" size="lg" onClick={leave} className="rounded-full">
                {t("gd.leave")}
              </Button>
            ) : (
              <Button size="lg" onClick={join} disabled={seatsLeft === 0} className="rounded-full bg-tangerine text-tangerine-foreground hover:bg-tangerine/90">
                {seatsLeft === 0 ? t("gd.full") : t("gd.join")}
              </Button>
            )
          )}
          {g.status === "approved" && isMember && (
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() =>
                downloadIcs({
                  id: g.id,
                  subject: g.subject,
                  description: g.description,
                  startsAt: g.starts_at,
                  location: [g.business?.name ?? g.venue_name, g.business?.city ?? g.neighborhood]
                    .filter(Boolean)
                    .join(" — "),
                })
              }
            >
              <CalendarPlus className="me-1.5 h-4 w-4" />
              {t("gd.addToCalendar")}
            </Button>
          )}
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => shareGathering(g.subject, g.description ?? "", t("gd.linkCopied"))}
          >
            <Share2 className="me-1.5 h-4 w-4" />
            {t("gd.share")}
          </Button>
          {user && !isHost && (
            <Button
              variant="ghost"
              className="rounded-full text-muted-foreground"
              onClick={() =>
                setReportTarget({
                  targetType: "gathering",
                  targetId: g.id,
                  targetUserId: g.host_id,
                  gatheringId: g.id,
                  label: g.subject,
                })
              }
            >
              <Flag className="me-1.5 h-4 w-4" />
              {t("mod.reportGathering")}
            </Button>
          )}
          <ReportDialog target={reportTarget} onOpenChange={(o) => !o && setReportTarget(null)} />
          {g.status !== "approved" && (isHost || isOwner) && (
            <div className="rounded-full bg-sunshine px-4 py-2 text-sm text-sunshine-foreground">
              {g.status === "proposed"
                ? t("gd.waitingApproval")
                : g.status === "rejected"
                  ? t("gd.rejectedMsg")
                  : t("gd.cancelledMsg")}
            </div>
          )}
          {isOwner && g.business && (
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/businesses/$id" params={{ id: g.business.id }}>
                {t("gd.manageVenue")}
              </Link>
            </Button>
          )}
        </div>

        {/* Gathering Room */}
        {g.status === "approved" && user && (
          <div className="mt-8">
            <Tabs defaultValue="chat">
              <TabsList>
                <TabsTrigger value="chat">{t("room.tab.chat")}</TabsTrigger>
                <TabsTrigger value="checklist">{t("room.tab.checklist")}</TabsTrigger>
                {isHost && checkinOpen && <TabsTrigger value="attendance">{t("att.tab")}</TabsTrigger>}
              </TabsList>
              <TabsContent value="chat" className="mt-4">
                {isMember ? (
                  <GatheringChat gatheringId={g.id} currentUserId={user.id} />
                ) : (
                  <LockedPanel t={t} />
                )}
              </TabsContent>
              <TabsContent value="checklist" className="mt-4">
                {isMember ? (
                  <GatheringChecklist gatheringId={g.id} currentUserId={user.id} isHost={isHost} />
                ) : (
                  <LockedPanel t={t} />
                )}
              </TabsContent>
              {isHost && checkinOpen && (
                <TabsContent value="attendance" className="mt-4">
                  <AttendanceRoster gatheringId={g.id} />
                </TabsContent>
              )}
            </Tabs>
          </div>
        )}

        {g.business && <MenuSection businessId={g.business.id} isOwner={!!isOwner} />}
      </main>
    </div>
  );
}

function LockedPanel({ t }: { t: (k: string) => string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
      <Lock className="mx-auto h-6 w-6 text-muted-foreground" />
      <h3 className="mt-2 font-display text-lg">{t("room.locked.title")}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{t("room.locked.body")}</p>
    </div>
  );
}

function icsEscape(v: string) {
  return v.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}
function icsDate(d: Date) {
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    d.getUTCFullYear().toString() +
    p(d.getUTCMonth() + 1) +
    p(d.getUTCDate()) +
    "T" +
    p(d.getUTCHours()) +
    p(d.getUTCMinutes()) +
    p(d.getUTCSeconds()) +
    "Z"
  );
}
function icsFold(line: string) {
  // 75-octet line folding per RFC 5545
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const out: string[] = [];
  let buf = "";
  let size = 0;
  for (const ch of line) {
    const chSize = new TextEncoder().encode(ch).length;
    if (size + chSize > 75) {
      out.push(buf);
      buf = " " + ch;
      size = 1 + chSize;
    } else {
      buf += ch;
      size += chSize;
    }
  }
  if (buf) out.push(buf);
  return out.join("\r\n");
}

function downloadIcs(g: { id: string; subject: string; description: string | null; startsAt: string; location: string }) {
  const start = new Date(g.startsAt);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const host = typeof window !== "undefined" ? window.location.hostname : "idealgathering.com";
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Ideal Gathering//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${g.id}@${host}`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${icsEscape(g.subject)}`,
    g.location ? `LOCATION:${icsEscape(g.location)}` : "",
    g.description ? `DESCRIPTION:${icsEscape(g.description)}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean).map(icsFold);
  const blob = new Blob([lines.join("\r\n") + "\r\n"], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${g.subject.replace(/[^\w\-]+/g, "_").slice(0, 60) || "gathering"}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function shareGathering(title: string, text: string, copiedMsg: string) {
  const url = typeof window !== "undefined" ? window.location.href : "";
  if (typeof navigator !== "undefined" && "share" in navigator) {
    try {
      await navigator.share({ title, text, url });
      return;
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return;
      // fall through to clipboard
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    toast.success(copiedMsg);
  } catch {
    toast.error(url);
  }
}
