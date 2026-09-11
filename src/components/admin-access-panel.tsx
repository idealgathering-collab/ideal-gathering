import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changeAdminAccess, listAdminAccess } from "@/lib/owner-access.functions";

export function AdminAccessPanel() {
  const [userId, setUserId] = useState("");
  const admins = useQuery({ queryKey: ["owner-admin-access"], queryFn: listAdminAccess });
  const change = useMutation({
    mutationFn: (data: { userId: string; action: "grant" | "restrict" | "restore" | "remove" }) =>
      changeAdminAccess({ data }),
    onSuccess: async () => {
      setUserId("");
      await admins.refetch();
      toast.success("Admin access updated.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-soft">
      <h2 className="font-display text-2xl">Admin access</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Platform operations covers all staff tools. Restricting it removes staff privileges while
        keeping the Admin role. Owner access is managed separately by a trusted database operator.
      </p>
      <form
        className="my-6 flex flex-wrap items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          change.mutate({ userId: userId.trim(), action: "grant" });
        }}
      >
        <div className="min-w-0 flex-1 space-y-2">
          <Label htmlFor="admin-account-id">Existing account ID</Label>
          <Input
            id="admin-account-id"
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            required
            placeholder="Account UUID from Member accounts"
            disabled={change.isPending}
          />
        </div>
        <Button type="submit" disabled={change.isPending || !userId.trim()}>
          Grant Admin access
        </Button>
      </form>
      {admins.isPending && <p role="status">Loading Admin access...</p>}
      {admins.isError && (
        <div role="alert">
          <p>Could not load Admin access.</p>
          <Button variant="outline" onClick={() => admins.refetch()}>
            Retry
          </Button>
        </div>
      )}
      {admins.isSuccess && admins.data.length === 0 && <p>No Admin accounts.</p>}
      <div className="space-y-3">
        {(admins.data ?? []).map((admin) => {
          const active = admin.permissions.includes("platform_operations");
          return (
            <div
              key={admin.user_id}
              className="flex flex-wrap items-center gap-3 rounded-2xl border border-border p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="break-all font-mono text-sm">{admin.user_id}</p>
                <p className="text-sm text-muted-foreground">
                  {admin.is_owner
                    ? "Owner — unrestricted"
                    : active
                      ? "Platform operations allowed"
                      : "Platform operations restricted"}
                </p>
              </div>
              {!admin.is_owner && (
                <>
                  <Button
                    variant="outline"
                    disabled={change.isPending}
                    onClick={() =>
                      change.mutate({
                        userId: admin.user_id,
                        action: active ? "restrict" : "restore",
                      })
                    }
                  >
                    {active ? "Restrict operations" : "Restore operations"}
                  </Button>
                  <Button
                    variant="outline"
                    disabled={change.isPending}
                    onClick={() =>
                      change.mutate({
                        userId: admin.user_id,
                        action: "remove",
                      })
                    }
                  >
                    Remove Admin
                  </Button>
                </>
              )}
            </div>
          );
        })}
      </div>
      {change.isPending && (
        <p role="status" className="mt-3">
          Saving access change...
        </p>
      )}
      {change.isError && (
        <p role="alert" className="mt-3 text-destructive">
          {change.error.message}
        </p>
      )}
    </section>
  );
}
