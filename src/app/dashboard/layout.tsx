import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/nav/dashboard-shell";
import { CurrencyProvider } from "@/components/currency-provider";
import { KeyboardShortcutsProvider } from "@/components/keyboard-shortcuts-provider";
import { Toaster } from "sonner";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .single();

  const userName = profile?.full_name || "";
  const userEmail = profile?.email || user.email || "";

  return (
    <KeyboardShortcutsProvider>
      <CurrencyProvider>
        <DashboardShell userName={userName} userEmail={userEmail}>
          {children}
        </DashboardShell>
      </CurrencyProvider>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
          },
        }}
      />
      </KeyboardShortcutsProvider>
  );
}
