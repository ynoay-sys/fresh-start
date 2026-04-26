import {
  TRANZILA_TERMINAL_NAME as DEFAULT_TERMINAL,
  TRANZILA_HOSTED_URL,
  APP_BASE_URL as DEFAULT_BASE_URL,
} from "../config/paymentConfig";
import { base44 } from "@/api/base44Client";
import { trackEvent } from "../lib/trackEvent";

// Cache resolved config for the session to avoid repeated entity reads
let _configCache = null;

async function getPaymentConfig() {
  if (_configCache) return _configCache;
  try {
    const configs = await base44.entities.SystemConfig.list();
    const byKey = {};
    for (const c of configs) byKey[c.key] = c.value;
    _configCache = {
      terminalName: byKey["tranzila_terminal_name"] || DEFAULT_TERMINAL,
      baseUrl: byKey["app_base_url"] || DEFAULT_BASE_URL,
    };
  } catch {
    _configCache = { terminalName: DEFAULT_TERMINAL, baseUrl: DEFAULT_BASE_URL };
  }
  return _configCache;
}

/**
 * Builds the Tranzila hosted-page redirect URL.
 * Reads terminal name and base URL from SystemConfig entity (falls back to defaults).
 * Returns the URL string — does NOT redirect.
 */
export async function initiatePayment({ amount, description, userEmail, orderId }) {
  const { terminalName, baseUrl } = await getPaymentConfig();
  const params = new URLSearchParams({
    supplier: terminalName,
    sum: String(Math.round(amount)),
    currency: "1",
    contact: userEmail || "",
    remarks: description || "",
    tranmode: "A",
    success_url: `${baseUrl}/payment/success?orderId=${encodeURIComponent(orderId)}`,
    fail_url: `${baseUrl}/payment/failed?orderId=${encodeURIComponent(orderId)}`,
    notify_url: `${baseUrl}/api/payment/notify`,
  });
  return `${TRANZILA_HOSTED_URL}?${params.toString()}`;
}

/**
 * Creates a pending Payment record before redirecting to Tranzila.
 */
export async function createPendingPayment({ orderId, amount, description, featureKey, userEmail, userId }) {
  return await base44.entities.Payment.create({
    user_id: userId,
    feature_key: featureKey || "other",
    amount_ils: amount,
    currency: "ILS",
    status: "pending",
    gateway_ref: orderId,
    notes: description,
  });
}

/**
 * Queries the Payment entity for the record matching orderId.
 * Returns the status field string, or null if not found.
 */
export async function getPaymentStatus(orderId) {
  const user = await base44.auth.me();
  const records = await base44.entities.Payment.filter({ created_by: user.email, gateway_ref: orderId });
  if (records.length === 0) return null;
  return records[0].status;
}

/**
 * Updates the Payment record status by orderId.
 */
export async function updatePaymentStatus(orderId, status) {
  const user = await base44.auth.me();
  const records = await base44.entities.Payment.filter({ created_by: user.email, gateway_ref: orderId });
  if (records.length === 0) {
    // Try without user filter (for redirect-back case where user may not be re-authed yet)
    const allRecords = await base44.entities.Payment.filter({ gateway_ref: orderId });
    if (allRecords.length > 0) {
      await base44.entities.Payment.update(allRecords[0].id, { status });
      return allRecords[0];
    }
    return null;
  }
  await base44.entities.Payment.update(records[0].id, { status });
  return records[0];
}