import type { ComponentProps } from "react";

// Actual landing component and waitlist helper; no hosted backend requests.
export function Link({
  to,
  search,
  children,
  ...props
}: ComponentProps<"a"> & {
  to: string;
  search?: Record<string, string>;
}) {
  return (
    <a href={to + (search ? `?${new URLSearchParams(search)}` : "")} {...props}>
      {children}
    </a>
  );
}

// Fixture deliberately exports both the router adapter and synthetic backend.
// eslint-disable-next-line react-refresh/only-export-components
export const supabase = {
  from(table: string) {
    if (table !== "waitlist") throw new Error("Unexpected table");
    return {
      async insert(row: unknown) {
        window.dispatchEvent(new CustomEvent("fixture-insert", { detail: row }));
        await new Promise((resolve) => setTimeout(resolve, 250));
        const result = new URLSearchParams(window.location.search).get("result");
        return {
          error:
            result === "existing"
              ? { code: "23505" }
              : result === "failed"
                ? { code: "42501" }
                : null,
        };
      },
    };
  },
};
