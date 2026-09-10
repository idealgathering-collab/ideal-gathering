/* eslint-disable */

// @ts-nocheck

// This file is generated from the route files. Do not hand-edit unless route generation is unavailable.

import { Route as rootRouteImport } from './routes/__root'
import { Route as AuthenticatedRouteRouteImport } from './routes/_authenticated/route'
import { Route as WaitlistRouteImport } from './routes/waitlist'
import { Route as TermsRouteImport } from './routes/terms'
import { Route as SitemapDotxmlRouteImport } from './routes/sitemap[.]xml'
import { Route as ResetPasswordRouteImport } from './routes/reset-password'
import { Route as PrivacyRouteImport } from './routes/privacy'
import { Route as PreviewRouteImport } from './routes/preview'
import { Route as PendingRouteImport } from './routes/pending'
import { Route as PartnershipRouteImport } from './routes/partnership'
import { Route as OurStoryRouteImport } from './routes/our-story'
import { Route as McpRouteImport } from './routes/mcp'
import { Route as InviteRouteImport } from './routes/invite'
import { Route as ExploreRouteImport } from './routes/explore'
import { Route as AuthRouteImport } from './routes/auth'
import { Route as IndexRouteImport } from './routes/index'
import { Route as VenueDashboardRouteImport } from './routes/venue.dashboard'
import { Route as VenueAuthRouteImport } from './routes/venue.auth'
import { Route as GatheringsIdRouteImport } from './routes/gatherings.$id'
import { Route as AdminAuthRouteImport } from './routes/admin.auth'
import { Route as WellKnownOauthRouteImport } from './routes/[.well-known]/oauth-protected-resource'
import { Route as McpListToolsRouteImport } from './routes/[.mcp]/list-tools'
import { Route as McpInvokeToolRouteImport } from './routes/[.mcp]/invoke-tool/$tool'
import { Route as LovableOauthConsentRouteImport } from './routes/[.]lovable.oauth.consent'
import { Route as AuthenticatedSettingsRouteImport } from './routes/_authenticated/settings'
import { Route as AuthenticatedProfileRouteImport } from './routes/_authenticated/profile'
import { Route as AuthenticatedOnboardingRouteImport } from './routes/_authenticated/onboarding'
import { Route as AuthenticatedMyGatheringsRouteImport } from './routes/_authenticated/my-gatherings'
import { Route as AuthenticatedDashboardRouteImport } from './routes/_authenticated/dashboard'
import { Route as AuthenticatedCreateGatheringRouteImport } from './routes/_authenticated/create-gathering'
import { Route as AuthenticatedChatRouteImport } from './routes/_authenticated/chat'
import { Route as AuthenticatedAdminRouteImport } from './routes/_authenticated/admin'
import { Route as AuthenticatedOwnerRouteImport } from './routes/_authenticated/owner'
import { Route as AuthenticatedOwnerVenuePreviewRouteImport } from './routes/_authenticated/owner.venue-preview'
import { Route as AuthenticatedOwnerActivityRouteImport } from './routes/_authenticated/owner.activity'
import { Route as AuthenticatedOwnerSectionRouteImport } from './routes/_authenticated/owner.$section'
import { Route as AuthenticatedPeopleIdRouteImport } from './routes/_authenticated/people.$id'
import { Route as AuthenticatedBusinessesIdRouteImport } from './routes/_authenticated/businesses.$id'

const AuthenticatedRouteRoute = AuthenticatedRouteRouteImport.update({
  id: '/_authenticated',
  getParentRoute: () => rootRouteImport,
} as any)

const WaitlistRoute = WaitlistRouteImport.update({ id: '/waitlist', path: '/waitlist', getParentRoute: () => rootRouteImport } as any)
const TermsRoute = TermsRouteImport.update({ id: '/terms', path: '/terms', getParentRoute: () => rootRouteImport } as any)
const SitemapDotxmlRoute = SitemapDotxmlRouteImport.update({ id: '/sitemap.xml', path: '/sitemap.xml', getParentRoute: () => rootRouteImport } as any)
const ResetPasswordRoute = ResetPasswordRouteImport.update({ id: '/reset-password', path: '/reset-password', getParentRoute: () => rootRouteImport } as any)
const PrivacyRoute = PrivacyRouteImport.update({ id: '/privacy', path: '/privacy', getParentRoute: () => rootRouteImport } as any)
const PreviewRoute = PreviewRouteImport.update({ id: '/preview', path: '/preview', getParentRoute: () => rootRouteImport } as any)
const PendingRoute = PendingRouteImport.update({ id: '/pending', path: '/pending', getParentRoute: () => rootRouteImport } as any)
const PartnershipRoute = PartnershipRouteImport.update({ id: '/partnership', path: '/partnership', getParentRoute: () => rootRouteImport } as any)
const OurStoryRoute = OurStoryRouteImport.update({ id: '/our-story', path: '/our-story', getParentRoute: () => rootRouteImport } as any)
const McpRoute = McpRouteImport.update({ id: '/mcp', path: '/mcp', getParentRoute: () => rootRouteImport } as any)
const InviteRoute = InviteRouteImport.update({ id: '/invite', path: '/invite', getParentRoute: () => rootRouteImport } as any)
const ExploreRoute = ExploreRouteImport.update({ id: '/explore', path: '/explore', getParentRoute: () => rootRouteImport } as any)
const AuthRoute = AuthRouteImport.update({ id: '/auth', path: '/auth', getParentRoute: () => rootRouteImport } as any)
const IndexRoute = IndexRouteImport.update({ id: '/', path: '/', getParentRoute: () => rootRouteImport } as any)
const VenueDashboardRoute = VenueDashboardRouteImport.update({ id: '/venue/dashboard', path: '/venue/dashboard', getParentRoute: () => rootRouteImport } as any)
const VenueAuthRoute = VenueAuthRouteImport.update({ id: '/venue/auth', path: '/venue/auth', getParentRoute: () => rootRouteImport } as any)
const GatheringsIdRoute = GatheringsIdRouteImport.update({ id: '/gatherings/$id', path: '/gatherings/$id', getParentRoute: () => rootRouteImport } as any)
const AdminAuthRoute = AdminAuthRouteImport.update({ id: '/admin/auth', path: '/admin/auth', getParentRoute: () => rootRouteImport } as any)
const WellKnownOauthRoute = WellKnownOauthRouteImport.update({ id: '/.well-known/oauth-protected-resource', path: '/.well-known/oauth-protected-resource', getParentRoute: () => rootRouteImport } as any)
const McpListToolsRoute = McpListToolsRouteImport.update({ id: '/.mcp/list-tools', path: '/.mcp/list-tools', getParentRoute: () => rootRouteImport } as any)
const McpInvokeToolRoute = McpInvokeToolRouteImport.update({ id: '/.mcp/invoke-tool/$tool', path: '/.mcp/invoke-tool/$tool', getParentRoute: () => rootRouteImport } as any)
const LovableOauthConsentRoute = LovableOauthConsentRouteImport.update({ id: '/.lovable/oauth/consent', path: '/.lovable/oauth/consent', getParentRoute: () => rootRouteImport } as any)

const AuthenticatedSettingsRoute = AuthenticatedSettingsRouteImport.update({ id: '/_authenticated/settings', path: '/settings', getParentRoute: () => AuthenticatedRouteRoute } as any)
const AuthenticatedProfileRoute = AuthenticatedProfileRouteImport.update({ id: '/_authenticated/profile', path: '/profile', getParentRoute: () => AuthenticatedRouteRoute } as any)
const AuthenticatedOnboardingRoute = AuthenticatedOnboardingRouteImport.update({ id: '/_authenticated/onboarding', path: '/onboarding', getParentRoute: () => AuthenticatedRouteRoute } as any)
const AuthenticatedMyGatheringsRoute = AuthenticatedMyGatheringsRouteImport.update({ id: '/_authenticated/my-gatherings', path: '/my-gatherings', getParentRoute: () => AuthenticatedRouteRoute } as any)
const AuthenticatedDashboardRoute = AuthenticatedDashboardRouteImport.update({ id: '/_authenticated/dashboard', path: '/dashboard', getParentRoute: () => AuthenticatedRouteRoute } as any)
const AuthenticatedCreateGatheringRoute = AuthenticatedCreateGatheringRouteImport.update({ id: '/_authenticated/create-gathering', path: '/create-gathering', getParentRoute: () => AuthenticatedRouteRoute } as any)
const AuthenticatedChatRoute = AuthenticatedChatRouteImport.update({ id: '/_authenticated/chat', path: '/chat', getParentRoute: () => AuthenticatedRouteRoute } as any)
const AuthenticatedAdminRoute = AuthenticatedAdminRouteImport.update({ id: '/_authenticated/admin', path: '/admin', getParentRoute: () => AuthenticatedRouteRoute } as any)
const AuthenticatedOwnerRoute = AuthenticatedOwnerRouteImport.update({ id: '/_authenticated/owner', path: '/owner', getParentRoute: () => AuthenticatedRouteRoute } as any)
const AuthenticatedOwnerVenuePreviewRoute = AuthenticatedOwnerVenuePreviewRouteImport.update({ id: '/_authenticated/owner/venue-preview', path: '/owner/venue-preview', getParentRoute: () => AuthenticatedRouteRoute } as any)
const AuthenticatedOwnerActivityRoute = AuthenticatedOwnerActivityRouteImport.update({ id: '/_authenticated/owner/activity', path: '/owner/activity', getParentRoute: () => AuthenticatedRouteRoute } as any)
const AuthenticatedOwnerSectionRoute = AuthenticatedOwnerSectionRouteImport.update({ id: '/_authenticated/owner/$section', path: '/owner/$section', getParentRoute: () => AuthenticatedRouteRoute } as any)
const AuthenticatedPeopleIdRoute = AuthenticatedPeopleIdRouteImport.update({ id: '/_authenticated/people/$id', path: '/people/$id', getParentRoute: () => AuthenticatedRouteRoute } as any)
const AuthenticatedBusinessesIdRoute = AuthenticatedBusinessesIdRouteImport.update({ id: '/_authenticated/businesses/$id', path: '/businesses/$id', getParentRoute: () => AuthenticatedRouteRoute } as any)

export interface FileRoutesByFullPath {
  '/': typeof IndexRoute
  '/auth': typeof AuthRoute
  '/explore': typeof ExploreRoute
  '/invite': typeof InviteRoute
  '/mcp': typeof McpRoute
  '/our-story': typeof OurStoryRoute
  '/partnership': typeof PartnershipRoute
  '/pending': typeof PendingRoute
  '/preview': typeof PreviewRoute
  '/privacy': typeof PrivacyRoute
  '/reset-password': typeof ResetPasswordRoute
  '/sitemap.xml': typeof SitemapDotxmlRoute
  '/terms': typeof TermsRoute
  '/waitlist': typeof WaitlistRoute
  '/.mcp/list-tools': typeof McpListToolsRoute
  '/.well-known/oauth-protected-resource': typeof WellKnownOauthRoute
  '/admin': typeof AuthenticatedAdminRoute
  '/owner': typeof AuthenticatedOwnerRoute
  '/owner/venue-preview': typeof AuthenticatedOwnerVenuePreviewRoute
  '/owner/activity': typeof AuthenticatedOwnerActivityRoute
  '/owner/$section': typeof AuthenticatedOwnerSectionRoute
  '/chat': typeof AuthenticatedChatRoute
  '/create-gathering': typeof AuthenticatedCreateGatheringRoute
  '/dashboard': typeof AuthenticatedDashboardRoute
  '/my-gatherings': typeof AuthenticatedMyGatheringsRoute
  '/onboarding': typeof AuthenticatedOnboardingRoute
  '/profile': typeof AuthenticatedProfileRoute
  '/settings': typeof AuthenticatedSettingsRoute
  '/admin/auth': typeof AdminAuthRoute
  '/gatherings/$id': typeof GatheringsIdRoute
  '/venue/auth': typeof VenueAuthRoute
  '/venue/dashboard': typeof VenueDashboardRoute
  '/.lovable/oauth/consent': typeof LovableOauthConsentRoute
  '/.mcp/invoke-tool/$tool': typeof McpInvokeToolRoute
  '/businesses/$id': typeof AuthenticatedBusinessesIdRoute
  '/people/$id': typeof AuthenticatedPeopleIdRoute
}

export interface FileRoutesByTo extends FileRoutesByFullPath {}

export interface FileRoutesById {
  __root__: typeof rootRouteImport
  '/_authenticated': typeof AuthenticatedRouteRouteWithChildren
  '/': typeof IndexRoute
  '/auth': typeof AuthRoute
  '/explore': typeof ExploreRoute
  '/invite': typeof InviteRoute
  '/mcp': typeof McpRoute
  '/our-story': typeof OurStoryRoute
  '/partnership': typeof PartnershipRoute
  '/pending': typeof PendingRoute
  '/preview': typeof PreviewRoute
  '/privacy': typeof PrivacyRoute
  '/reset-password': typeof ResetPasswordRoute
  '/sitemap.xml': typeof SitemapDotxmlRoute
  '/terms': typeof TermsRoute
  '/waitlist': typeof WaitlistRoute
  '/.mcp/list-tools': typeof McpListToolsRoute
  '/.well-known/oauth-protected-resource': typeof WellKnownOauthRoute
  '/_authenticated/admin': typeof AuthenticatedAdminRoute
  '/_authenticated/owner': typeof AuthenticatedOwnerRoute
  '/_authenticated/owner/venue-preview': typeof AuthenticatedOwnerVenuePreviewRoute
  '/_authenticated/owner/activity': typeof AuthenticatedOwnerActivityRoute
  '/_authenticated/owner/$section': typeof AuthenticatedOwnerSectionRoute
  '/_authenticated/chat': typeof AuthenticatedChatRoute
  '/_authenticated/create-gathering': typeof AuthenticatedCreateGatheringRoute
  '/_authenticated/dashboard': typeof AuthenticatedDashboardRoute
  '/_authenticated/my-gatherings': typeof AuthenticatedMyGatheringsRoute
  '/_authenticated/onboarding': typeof AuthenticatedOnboardingRoute
  '/_authenticated/profile': typeof AuthenticatedProfileRoute
  '/_authenticated/settings': typeof AuthenticatedSettingsRoute
  '/admin/auth': typeof AdminAuthRoute
  '/gatherings/$id': typeof GatheringsIdRoute
  '/venue/auth': typeof VenueAuthRoute
  '/venue/dashboard': typeof VenueDashboardRoute
  '/.lovable/oauth/consent': typeof LovableOauthConsentRoute
  '/.mcp/invoke-tool/$tool': typeof McpInvokeToolRoute
  '/_authenticated/businesses/$id': typeof AuthenticatedBusinessesIdRoute
  '/_authenticated/people/$id': typeof AuthenticatedPeopleIdRoute
}

export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths: keyof FileRoutesByFullPath
  fileRoutesByTo: FileRoutesByTo
  to: keyof FileRoutesByTo
  id: keyof FileRoutesById
  fileRoutesById: FileRoutesById
}

export interface RootRouteChildren {
  AuthenticatedRouteRoute: typeof AuthenticatedRouteRouteWithChildren
  IndexRoute: typeof IndexRoute
  AuthRoute: typeof AuthRoute
  ExploreRoute: typeof ExploreRoute
  InviteRoute: typeof InviteRoute
  McpRoute: typeof McpRoute
  OurStoryRoute: typeof OurStoryRoute
  PartnershipRoute: typeof PartnershipRoute
  PendingRoute: typeof PendingRoute
  PreviewRoute: typeof PreviewRoute
  PrivacyRoute: typeof PrivacyRoute
  ResetPasswordRoute: typeof ResetPasswordRoute
  SitemapDotxmlRoute: typeof SitemapDotxmlRoute
  TermsRoute: typeof TermsRoute
  WaitlistRoute: typeof WaitlistRoute
  McpListToolsRoute: typeof McpListToolsRoute
  WellKnownOauthRoute: typeof WellKnownOauthRoute
  AdminAuthRoute: typeof AdminAuthRoute
  GatheringsIdRoute: typeof GatheringsIdRoute
  VenueAuthRoute: typeof VenueAuthRoute
  VenueDashboardRoute: typeof VenueDashboardRoute
  LovableOauthConsentRoute: typeof LovableOauthConsentRoute
  McpInvokeToolRoute: typeof McpInvokeToolRoute
}

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/_authenticated': { id: '/_authenticated'; path: ''; fullPath: '/'; preLoaderRoute: typeof AuthenticatedRouteRouteImport; parentRoute: typeof rootRouteImport }
    '/': { id: '/'; path: '/'; fullPath: '/'; preLoaderRoute: typeof IndexRouteImport; parentRoute: typeof rootRouteImport }
    '/auth': { id: '/auth'; path: '/auth'; fullPath: '/auth'; preLoaderRoute: typeof AuthRouteImport; parentRoute: typeof rootRouteImport }
    '/explore': { id: '/explore'; path: '/explore'; fullPath: '/explore'; preLoaderRoute: typeof ExploreRouteImport; parentRoute: typeof rootRouteImport }
    '/invite': { id: '/invite'; path: '/invite'; fullPath: '/invite'; preLoaderRoute: typeof InviteRouteImport; parentRoute: typeof rootRouteImport }
    '/mcp': { id: '/mcp'; path: '/mcp'; fullPath: '/mcp'; preLoaderRoute: typeof McpRouteImport; parentRoute: typeof rootRouteImport }
    '/our-story': { id: '/our-story'; path: '/our-story'; fullPath: '/our-story'; preLoaderRoute: typeof OurStoryRouteImport; parentRoute: typeof rootRouteImport }
    '/partnership': { id: '/partnership'; path: '/partnership'; fullPath: '/partnership'; preLoaderRoute: typeof PartnershipRouteImport; parentRoute: typeof rootRouteImport }
    '/pending': { id: '/pending'; path: '/pending'; fullPath: '/pending'; preLoaderRoute: typeof PendingRouteImport; parentRoute: typeof rootRouteImport }
    '/preview': { id: '/preview'; path: '/preview'; fullPath: '/preview'; preLoaderRoute: typeof PreviewRouteImport; parentRoute: typeof rootRouteImport }
    '/privacy': { id: '/privacy'; path: '/privacy'; fullPath: '/privacy'; preLoaderRoute: typeof PrivacyRouteImport; parentRoute: typeof rootRouteImport }
    '/reset-password': { id: '/reset-password'; path: '/reset-password'; fullPath: '/reset-password'; preLoaderRoute: typeof ResetPasswordRouteImport; parentRoute: typeof rootRouteImport }
    '/sitemap.xml': { id: '/sitemap.xml'; path: '/sitemap.xml'; fullPath: '/sitemap.xml'; preLoaderRoute: typeof SitemapDotxmlRouteImport; parentRoute: typeof rootRouteImport }
    '/terms': { id: '/terms'; path: '/terms'; fullPath: '/terms'; preLoaderRoute: typeof TermsRouteImport; parentRoute: typeof rootRouteImport }
    '/waitlist': { id: '/waitlist'; path: '/waitlist'; fullPath: '/waitlist'; preLoaderRoute: typeof WaitlistRouteImport; parentRoute: typeof rootRouteImport }
    '/venue/dashboard': { id: '/venue/dashboard'; path: '/venue/dashboard'; fullPath: '/venue/dashboard'; preLoaderRoute: typeof VenueDashboardRouteImport; parentRoute: typeof rootRouteImport }
    '/venue/auth': { id: '/venue/auth'; path: '/venue/auth'; fullPath: '/venue/auth'; preLoaderRoute: typeof VenueAuthRouteImport; parentRoute: typeof rootRouteImport }
    '/gatherings/$id': { id: '/gatherings/$id'; path: '/gatherings/$id'; fullPath: '/gatherings/$id'; preLoaderRoute: typeof GatheringsIdRouteImport; parentRoute: typeof rootRouteImport }
    '/admin/auth': { id: '/admin/auth'; path: '/admin/auth'; fullPath: '/admin/auth'; preLoaderRoute: typeof AdminAuthRouteImport; parentRoute: typeof rootRouteImport }
    '/.well-known/oauth-protected-resource': { id: '/.well-known/oauth-protected-resource'; path: '/.well-known/oauth-protected-resource'; fullPath: '/.well-known/oauth-protected-resource'; preLoaderRoute: typeof WellKnownOauthRouteImport; parentRoute: typeof rootRouteImport }
    '/.mcp/list-tools': { id: '/.mcp/list-tools'; path: '/.mcp/list-tools'; fullPath: '/.mcp/list-tools'; preLoaderRoute: typeof McpListToolsRouteImport; parentRoute: typeof rootRouteImport }
    '/.mcp/invoke-tool/$tool': { id: '/.mcp/invoke-tool/$tool'; path: '/.mcp/invoke-tool/$tool'; fullPath: '/.mcp/invoke-tool/$tool'; preLoaderRoute: typeof McpInvokeToolRouteImport; parentRoute: typeof rootRouteImport }
    '/.lovable/oauth/consent': { id: '/.lovable/oauth/consent'; path: '/.lovable/oauth/consent'; fullPath: '/.lovable/oauth/consent'; preLoaderRoute: typeof LovableOauthConsentRouteImport; parentRoute: typeof rootRouteImport }
    '/_authenticated/settings': { id: '/_authenticated/settings'; path: '/settings'; fullPath: '/settings'; preLoaderRoute: typeof AuthenticatedSettingsRouteImport; parentRoute: typeof AuthenticatedRouteRoute }
    '/_authenticated/profile': { id: '/_authenticated/profile'; path: '/profile'; fullPath: '/profile'; preLoaderRoute: typeof AuthenticatedProfileRouteImport; parentRoute: typeof AuthenticatedRouteRoute }
    '/_authenticated/onboarding': { id: '/_authenticated/onboarding'; path: '/onboarding'; fullPath: '/onboarding'; preLoaderRoute: typeof AuthenticatedOnboardingRouteImport; parentRoute: typeof AuthenticatedRouteRoute }
    '/_authenticated/my-gatherings': { id: '/_authenticated/my-gatherings'; path: '/my-gatherings'; fullPath: '/my-gatherings'; preLoaderRoute: typeof AuthenticatedMyGatheringsRouteImport; parentRoute: typeof AuthenticatedRouteRoute }
    '/_authenticated/dashboard': { id: '/_authenticated/dashboard'; path: '/dashboard'; fullPath: '/dashboard'; preLoaderRoute: typeof AuthenticatedDashboardRouteImport; parentRoute: typeof AuthenticatedRouteRoute }
    '/_authenticated/create-gathering': { id: '/_authenticated/create-gathering'; path: '/create-gathering'; fullPath: '/create-gathering'; preLoaderRoute: typeof AuthenticatedCreateGatheringRouteImport; parentRoute: typeof AuthenticatedRouteRoute }
    '/_authenticated/chat': { id: '/_authenticated/chat'; path: '/chat'; fullPath: '/chat'; preLoaderRoute: typeof AuthenticatedChatRouteImport; parentRoute: typeof AuthenticatedRouteRoute }
    '/_authenticated/admin': { id: '/_authenticated/admin'; path: '/admin'; fullPath: '/admin'; preLoaderRoute: typeof AuthenticatedAdminRouteImport; parentRoute: typeof AuthenticatedRouteRoute }
    '/_authenticated/owner': { id: '/_authenticated/owner'; path: '/owner'; fullPath: '/owner'; preLoaderRoute: typeof AuthenticatedOwnerRouteImport; parentRoute: typeof AuthenticatedRouteRoute }
    '/_authenticated/owner/venue-preview': { id: '/_authenticated/owner/venue-preview'; path: '/owner/venue-preview'; fullPath: '/owner/venue-preview'; preLoaderRoute: typeof AuthenticatedOwnerVenuePreviewRouteImport; parentRoute: typeof AuthenticatedRouteRoute }
    '/_authenticated/owner/activity': { id: '/_authenticated/owner/activity'; path: '/owner/activity'; fullPath: '/owner/activity'; preLoaderRoute: typeof AuthenticatedOwnerActivityRouteImport; parentRoute: typeof AuthenticatedRouteRoute }
    '/_authenticated/owner/$section': { id: '/_authenticated/owner/$section'; path: '/owner/$section'; fullPath: '/owner/$section'; preLoaderRoute: typeof AuthenticatedOwnerSectionRouteImport; parentRoute: typeof AuthenticatedRouteRoute }
    '/_authenticated/people/$id': { id: '/_authenticated/people/$id'; path: '/people/$id'; fullPath: '/people/$id'; preLoaderRoute: typeof AuthenticatedPeopleIdRouteImport; parentRoute: typeof AuthenticatedRouteRoute }
    '/_authenticated/businesses/$id': { id: '/_authenticated/businesses/$id'; path: '/businesses/$id'; fullPath: '/businesses/$id'; preLoaderRoute: typeof AuthenticatedBusinessesIdRouteImport; parentRoute: typeof AuthenticatedRouteRoute }
  }
}

interface AuthenticatedRouteRouteChildren {
  AuthenticatedSettingsRoute: typeof AuthenticatedSettingsRoute
  AuthenticatedProfileRoute: typeof AuthenticatedProfileRoute
  AuthenticatedOnboardingRoute: typeof AuthenticatedOnboardingRoute
  AuthenticatedMyGatheringsRoute: typeof AuthenticatedMyGatheringsRoute
  AuthenticatedDashboardRoute: typeof AuthenticatedDashboardRoute
  AuthenticatedCreateGatheringRoute: typeof AuthenticatedCreateGatheringRoute
  AuthenticatedChatRoute: typeof AuthenticatedChatRoute
  AuthenticatedAdminRoute: typeof AuthenticatedAdminRoute
  AuthenticatedOwnerRoute: typeof AuthenticatedOwnerRoute
  AuthenticatedOwnerVenuePreviewRoute: typeof AuthenticatedOwnerVenuePreviewRoute
  AuthenticatedOwnerActivityRoute: typeof AuthenticatedOwnerActivityRoute
  AuthenticatedOwnerSectionRoute: typeof AuthenticatedOwnerSectionRoute
  AuthenticatedPeopleIdRoute: typeof AuthenticatedPeopleIdRoute
  AuthenticatedBusinessesIdRoute: typeof AuthenticatedBusinessesIdRoute
}

const AuthenticatedRouteRouteChildren: AuthenticatedRouteRouteChildren = {
  AuthenticatedSettingsRoute,
  AuthenticatedProfileRoute,
  AuthenticatedOnboardingRoute,
  AuthenticatedMyGatheringsRoute,
  AuthenticatedDashboardRoute,
  AuthenticatedCreateGatheringRoute,
  AuthenticatedChatRoute,
  AuthenticatedAdminRoute,
  AuthenticatedOwnerRoute,
  AuthenticatedOwnerVenuePreviewRoute,
  AuthenticatedOwnerActivityRoute,
  AuthenticatedOwnerSectionRoute,
  AuthenticatedPeopleIdRoute,
  AuthenticatedBusinessesIdRoute,
}

const AuthenticatedRouteRouteWithChildren = AuthenticatedRouteRoute._addFileChildren(AuthenticatedRouteRouteChildren)

const rootRouteChildren: RootRouteChildren = {
  AuthenticatedRouteRoute: AuthenticatedRouteRouteWithChildren,
  IndexRoute,
  AuthRoute,
  ExploreRoute,
  InviteRoute,
  McpRoute,
  OurStoryRoute,
  PartnershipRoute,
  PendingRoute,
  PreviewRoute,
  PrivacyRoute,
  ResetPasswordRoute,
  SitemapDotxmlRoute,
  TermsRoute,
  WaitlistRoute,
  McpListToolsRoute,
  WellKnownOauthRoute,
  AdminAuthRoute,
  GatheringsIdRoute,
  VenueAuthRoute,
  VenueDashboardRoute,
  LovableOauthConsentRoute,
  McpInvokeToolRoute,
}

export const routeTree = rootRouteImport._addFileChildren(rootRouteChildren)._addFileTypes<FileRouteTypes>()

import type { getRouter } from './router.tsx'
import type { startInstance } from './start.ts'
declare module '@tanstack/react-start' {
  interface Register {
    ssr: true
    router: Awaited<ReturnType<typeof getRouter>>
    config: Awaited<ReturnType<typeof startInstance.getOptions>>
  }
}
