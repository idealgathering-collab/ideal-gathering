import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_control/owner")({ component: () => <Outlet /> });
