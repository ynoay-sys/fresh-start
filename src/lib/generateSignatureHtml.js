export function generateSignatureHtml({ fullName, role, businessName, phone, email, website, primaryColor, style }) {
  const roleLine = [role, businessName].filter(Boolean).join(" | ");

  // Build contact parts — no emojis, pipe-separated, only valid values
  const contactParts = [
    phone || null,
    email || null,
    website ? `<span style="color:#1E5FA8;font-weight:bold;font-size:12px;">Fresh Start</span> freshstart.app/${website.replace(/^freshstart\.app\//, "")}` : null,
  ].filter(Boolean);
  const contactLine = contactParts.join("&nbsp;&nbsp;|&nbsp;&nbsp;");

  // Plain text version for styles that don't use HTML spans in contact line
  const contactParts2 = [
    phone || null,
    email || null,
    website ? `freshstart.app/${website.replace(/^freshstart\.app\//, "")}` : null,
  ].filter(Boolean);
  const contactLinePlain = contactParts2.join(" | ");

  if (style === "modern") {
    return `<table style="font-family:Arial,sans-serif;border-collapse:collapse;direction:rtl;border:none;" cellpadding="0" cellspacing="0">
  <tr>
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
      <p style="margin:0 0 4px;font-size:17px;font-weight:bold;color:#1A1A2E;">${fullName || ""}</p>
      ${roleLine ? `<p style="margin:0 0 6px;font-size:13px;color:${primaryColor};font-weight:600;">${roleLine}</p>` : ""}
      ${phone ? `<p style="margin:0 0 3px;font-size:12px;color:#555;">${phone}</p>` : ""}
      ${email ? `<p style="margin:0 0 3px;font-size:12px;color:#555;">${email}</p>` : ""}
      ${website ? `<p style="margin:0;font-size:12px;color:#555;"><span style="color:#1E5FA8;font-weight:bold;">Fresh Start</span> freshstart.app/${website.replace(/^freshstart\.app\//, "")}</p>` : ""}
    </td>
  </tr>
</table>`;
  }

  // minimal
  return `<p style="font-family:Arial,sans-serif;font-size:13px;color:#333333;direction:rtl;margin:0;">
  <strong>${fullName || ""}</strong>${roleLine ? ` | ${roleLine}` : ""}${contactLinePlain ? ` | ${contactLinePlain}` : ""}
</p>`;
}