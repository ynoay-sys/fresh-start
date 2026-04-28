import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { isAdmin } from "@/lib/userRole";
import { base44 } from "@/api/base44Client";

const BOOTSTRAP_ADMIN_EMAIL = "ynoay9@gmail.com";

async function ensureBootstrapAdmin() {
  try {
    const user = await base44.auth.me();
    if (user.email !== BOOTSTRAP_ADMIN_EMAIL) return false;

    // Check if a super_admin UserProfile already exists
    const profiles = await base44.entities.UserProfile.filter({ created_by: user.email });
    const profile = profiles[0];

    if (!profile) {
      // Create the profile with super_admin role
      await base44.entities.UserProfile.create({ role: "super_admin" });
      return true;
    } else if (!["admin", "super_admin"].includes(profile.role)) {
      // Upgrade existing profile to super_admin
      await base44.entities.UserProfile.update(profile.id, { role: "super_admin" });
      return true;
    }
    return ["admin", "super_admin"].includes(profile.role);
  } catch {
    return false;
  }
}

export default function AdminRoute({ children }) {
  const [status, setStatus] = useState("loading"); // loading | allowed | denied

  useEffect(() => {
    async function check() {
      const ok = await isAdmin();
      if (ok) { setStatus("allowed"); return; }
      // Try bootstrap admin fallback
      const bootstrapped = await ensureBootstrapAdmin();
      setStatus(bootstrapped ? "allowed" : "denied");
    }
    check();
  }, []);

  if (status === "loading") {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (status === "denied") return <Navigate to="/dashboard" replace />;

  return children;
}