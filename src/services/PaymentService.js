import { TRANZILA_TERMINAL_NAME, TRANZILA_HOSTED_URL, APP_BASE_URL } from "../config/paymentConfig";
import { base44 } from "@/api/base44Client";
import { trackEvent } from "../lib/trackEvent";

/**
 * Builds the Tranzila hosted-page redirect URL.
 * Returns the URL string — does NOT redirect.
 */
export function initiatePayment({ amount, description, userEmail, orderId }) {
  const params = new URLSearchParams({
    supplier: TRANZILA_TERMINAL_NAME,
    sum: String(Math.round(amount)),
    currency: "1",
    contact: userEmail || "",
    remarks: description || "",
    tranmode: "A",
    success_url: `${APP_BASE_URL}/payment/success?orderId=${encodeURIComponent(orderId)}`,
    fail_url: `${APP_BASE_URL}/payment/failed?orderId=${encodeURIComponent(orderId)}`,
    notify_url: `${APP_BASE_URL}/api/payment/notify`,
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