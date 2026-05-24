"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/nav/theme-toggle";
import { Loader2, User, Palette, Shield, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useRouter } from "next/navigation";
import { deleteUserAccount } from "@/lib/supabase/auth-actions";

export default function SettingsPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        setEmail(user.email || "");
        
        const { data } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();
          
        if (data?.full_name) {
          setFullName(data.full_name);
        }
      }
      setLoading(false);
    };
    loadProfile();
  }, [supabase]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName })
        .eq("id", userId);
        
      if (error) throw error;
      toast.success("Profile updated successfully");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) return;
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/dashboard/settings`,
      });
      if (error) throw error;
      toast.success("Password reset email sent");
    } catch {
      toast.error("Failed to send reset email");
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setSaving(true);
      const res = await deleteUserAccount();
      if (!res.success) {
        toast.error(res.error || "Failed to delete account");
        return;
      }
      
      toast.success("Your account has been deleted");
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } catch (err: unknown) {
      console.error(err);
      toast.error("Failed to delete account");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--accent)" }} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1
          className="text-2xl font-semibold"
          style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}
        >
          Settings
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Manage your account preferences and settings
        </p>
      </div>

      <div className="space-y-8">
        {/* Profile Section */}
        <section className="card-base" style={{ padding: 32 }}>
          <div className="flex items-center gap-3 mb-6">
            <User className="w-5 h-5" style={{ color: "var(--accent)" }} />
            <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
              Profile
            </h2>
          </div>
          
          <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full px-3 opacity-50 cursor-not-allowed"
              />
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                Your email address cannot be changed
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-3"
              />
            </div>
            
            <button
              type="submit"
              disabled={saving}
              className="btn-primary"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
            </button>
          </form>
        </section>

        {/* Appearance Section */}
        <section className="card-base" style={{ padding: 32 }}>
          <div className="flex items-center gap-3 mb-6">
            <Palette className="w-5 h-5" style={{ color: "var(--accent)" }} />
            <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
              Appearance
            </h2>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium" style={{ color: "var(--text-primary)" }}>Theme</p>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Switch between light and dark mode
              </p>
            </div>
            <div className="p-2 rounded-lg" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
              <ThemeToggle />
            </div>
          </div>
        </section>

        {/* Security Section */}
        <section className="card-base" style={{ padding: 32 }}>
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-5 h-5" style={{ color: "var(--accent)" }} />
            <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
              Security
            </h2>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="font-medium" style={{ color: "var(--text-primary)" }}>Password</p>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Receive an email with a secure link to reset your password
              </p>
            </div>
            <button
              onClick={handleResetPassword}
              className="btn-ghost shrink-0"
              style={{ border: "1px solid var(--border)" }}
            >
              Reset Password
            </button>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="card-base" style={{ padding: 32, borderColor: "var(--danger-bg)" }}>
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="w-5 h-5" style={{ color: "var(--danger)" }} />
            <h2 className="text-lg font-semibold" style={{ color: "var(--danger)" }}>
              Danger Zone
            </h2>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="font-medium" style={{ color: "var(--text-primary)" }}>Delete Account</p>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Permanently delete your account and all of your data
              </p>
            </div>
            <ConfirmDialog
              title="Delete Account"
              description="Are you absolutely sure you want to delete your account? This action cannot be undone and will permanently delete all your financial data."
              confirmLabel="Delete Account"
              onConfirm={handleDeleteAccount}
              trigger={
                <button className="btn-danger shrink-0">
                  Delete Account
                </button>
              }
            />
          </div>
        </section>
      </div>
    </div>
  );
}
