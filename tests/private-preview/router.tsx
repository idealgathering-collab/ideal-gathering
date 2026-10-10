import type { ReactNode } from "react";
export const createFileRoute = () => (options: Record<string, unknown>) => ({ ...options, useSearch: () => ({ private: true }) });
export const useNavigate = () => () => {};
export function Link({ children }: { children: ReactNode }) { return <a href="#">{children}</a>; }
