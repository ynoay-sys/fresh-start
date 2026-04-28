import { base44 } from "@/api/base44Client";

// Always fetch from DB — never cache role in memory or localStorage.
// UserProfile.role is the single source of truth.
export async function getUserRole() {
  try {
    const user = await base44.auth.me();
    const profiles = await base44.entities.UserProfile.filter({ created_by: user.email });
    return profiles[0]?.role || "user";
  } catch {
    return "user";
  }
}

export async function isAdmin() {
  const role = await getUserRole();
  return ["admin", "super_admin"].includes(role);
}

export async function isSuperAdmin() {
  const role = await getUserRole();
  return role === "super_admin";
}

export async function isPartner() {
  const role = await getUserRole();
  return role === "partner";
}