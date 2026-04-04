import { base44 } from "@/api/base44Client";

/**
 * Store or update an agent session for a given user + portal.
 */
export async function storeSession(userId, portalKey, sessionData) {
  const existing = await base44.entities.AgentSession.filter({
    created_by: userId,
    portal_key: portalKey,
  });

  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();
  const payload = {
    user_id: userId,
    portal_key: portalKey,
    session_data: typeof sessionData === "string" ? sessionData : JSON.stringify(sessionData),
    expires_at: expiresAt,
  };

  if (existing.length > 0) {
    return base44.entities.AgentSession.update(existing[0].id, payload);
  } else {
    return base44.entities.AgentSession.create(payload);
  }
}

/**
 * Get a valid (non-expired) session for a given user + portal.
 */
export async function getSession(userId, portalKey) {
  const records = await base44.entities.AgentSession.filter({
    created_by: userId,
    portal_key: portalKey,
  });

  const now = new Date().toISOString();
  const valid = records.find(s => s.expires_at && s.expires_at > now);
  if (!valid) return null;

  try {
    return JSON.parse(valid.session_data);
  } catch {
    return valid.session_data;
  }
}

/**
 * Delete a session for a given user + portal.
 */
export async function clearSession(userId, portalKey) {
  const records = await base44.entities.AgentSession.filter({
    created_by: userId,
    portal_key: portalKey,
  });
  await Promise.all(records.map(s => base44.entities.AgentSession.delete(s.id)));
}

/**
 * Clear all expired sessions for a user.
 */
export async function clearExpiredSessions(userId) {
  const records = await base44.entities.AgentSession.filter({ created_by: userId });
  const now = new Date().toISOString();
  const expired = records.filter(s => !s.expires_at || s.expires_at <= now);
  await Promise.all(expired.map(s => base44.entities.AgentSession.delete(s.id)));
}