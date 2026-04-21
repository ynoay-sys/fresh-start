// Payment Gateway Configuration — Tranzila hosted page
export const TRANZILA_TERMINAL_NAME = "fresh_start_terminal"; // Replace with real terminal name post-deployment
export const TRANZILA_HOSTED_URL = "https://secure5.tranzila.com/cgi-bin/tranzila71u.cgi";
export const APP_BASE_URL = typeof window !== "undefined" ? window.location.origin : "https://app.fresh-start.co.il";

// Email Configuration
export const EMAIL_FROM_ADDRESS = "noreply@fresh-start.co.il";
export const EMAIL_REPLY_TO = "support@fresh-start.co.il";