export function generateSignatureHtml({ fullName, role, businessName, phone, email, website, primaryColor, style, includeAvatar }) {
  const initials = fullName
    ? fullName.trim().split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  const contactLine = [
    phone ? `📞 ${phone}` : null,
    email ? `✉️ ${email}` : null,
    website ? `🌐 ${website}` : null,
  ].filter(Boolean).join("&nbsp;&nbsp;|&nbsp;&nbsp;");

  const roleLine = [role, businessName].filter(Boolean).join(" | ");

  const avatarHtml = includeAvatar
    ? `<div style="width:56px;height:56px;border-radius:50%;background-color:${primaryColor};color:white;font-size:20px;font-weight:bold;text-align:center;line-height:56px;font-family:Arial,sans-serif;">${initials}</div>`
    : "";

  if (style === "modern") {
    return `<table style="font-family:Arial,sans-serif;border-collapse:collapse;direction:rtl;border:none;" cellpadding="0" cellspacing="0">
  <tr>
    ${includeAvatar ? `<td style="padding:0 0 0 12px;vertical-align:top;">${avatarHtml}</td>` : ""}
    <td style="padding:0;vertical-align:top;">
      <p style="margin:0 0 4px;font-size:16px;font-weight:bold;color:#1A1A2E;">${fullName || ""}</p>
      ${roleLine ? `<p style="margin:0 0 8px;font-size:13px;color:#555555;">${roleLine}</p>` : ""}
      <p style="margin:0;font-size:12px;color:#777777;">${contactLine}</p>
      <hr style="border:none;border-top:2px solid ${primaryColor};margin:8px 0;width:200px;">
    </td>
  </tr>
</table>`;
  }

  if (style === "classic") {
    return `<table style="font-family:Arial,sans-serif;border-collapse:collapse;direction:rtl;border-top:3px solid ${primaryColor};padding-top:10px;" cellpadding="0" cellspacing="0">
  <tr>
    <td style="padding:10px 0 0 0;text-align:right;">
      ${includeAvatar ? `<div style="margin-bottom:8px;">${avatarHtml}</div>` : ""}
      <p style="margin:0 0 4px;font-size:17px;font-weight:bold;color:#1A1A2E;">${fullName || ""}</p>
      ${roleLine ? `<p style="margin:0 0 6px;font-size:13px;color:${primaryColor};font-weight:600;">${roleLine}</p>` : ""}
      ${phone ? `<p style="margin:0 0 3px;font-size:12px;color:#555;">📞 ${phone}</p>` : ""}
      ${email ? `<p style="margin:0 0 3px;font-size:12px;color:#555;">✉️ ${email}</p>` : ""}
      ${website ? `<p style="margin:0;font-size:12px;color:#555;">🌐 ${website}</p>` : ""}
    </td>
  </tr>
</table>`;
  }

  // minimal
  return `<p style="font-family:Arial,sans-serif;font-size:13px;color:#333333;direction:rtl;margin:0;">
  <strong>${fullName || ""}</strong>${roleLine ? ` | ${roleLine}` : ""}${phone ? ` | 📞 ${phone}` : ""}${email ? ` | ✉️ ${email}` : ""}${website ? ` | 🌐 ${website}` : ""}
</p>`;
}