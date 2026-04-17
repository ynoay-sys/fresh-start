import { base44 } from "@/api/base44Client";

let _cachedRole = null;
let _cacheTs = 0;
const CACHE_TTL = 60000; // 1 minute

export async function getUserRole() {
  const now = Date.now();
  if (_cachedRole && now - _cacheTs < CACHE_TTL) return _cachedRole;
  try {
    const user = await base44.auth.me();
    const profiles = await base44.entities.UserProfile.filter({ created_by: user.email });
    _cachedRole = profiles[0]?.role || "user";
    _cacheTs = now;
    return _cachedRole;
  } catch {
    return "user";
  }
}

export function clearRoleCache() {
  _cachedRole = null;
  _cacheTs = 0;
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