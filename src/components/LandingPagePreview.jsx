export default function LandingPagePreview({ page, businessName }) {
  if (!page) return null;

  const primary = page.primary_color || "#1E5FA8";
  const secondary = page.secondary_color || "#EAF2FB";
  const phone = page.contact_phone;
  const waLink = phone ? `https://wa.me/972${phone.replace(/^0/, "").replace(/\D/g, "")}` : null;

  return (
    <div className="font-rubik text-right" dir="rtl" style={{ fontFamily: "Rubik, sans-serif" }}>
      {/* Header */}
      <div className="px-6 py-5" style={{ backgroundColor: primary }}>
        <p className="text-white font-bold text-2xl">{businessName || "שם העסק"}</p>
        {page.tagline && <p className="text-white/80 text-sm mt-1">{page.tagline}</p>}
      </div>

      {/* Hero */}
      <div className="px-6 py-10 text-center" style={{ backgroundColor: secondary }}>
        <h1 className="font-bold text-3xl text-gray-900 mb-3">{page.headline || "כותרת ראשית"}</h1>
        {page.subheadline && <p className="text-gray-600 text-lg mb-6">{page.subheadline}</p>}
        <a href="#contact"
          className="inline-block px-6 py-3 rounded-lg text-white font-medium text-sm"
          style={{ backgroundColor: primary }}>
          צור קשר ←
        </a>
      </div>

      {/* Services */}
      {page.services_list && page.services_list.length > 0 && (
        <div className="px-6 py-10 bg-white">
          <h2 className="font-bold text-xl text-gray-900 mb-6 text-center">השירותים שלי</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {page.services_list.map((s, i) => (
              <div key={i} className="p-4 rounded-lg border border-gray-100 bg-gray-50"
                style={{ borderTop: `3px solid ${primary}` }}>
                <p className="font-bold text-gray-800 mb-1">{s.title}</p>
                {s.description && <p className="text-gray-500 text-sm">{s.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contact */}
      <div id="contact" className="px-6 py-10 bg-gray-50">
        <h2 className="font-bold text-xl text-gray-900 mb-5 text-center">צור קשר</h2>
        <div className="space-y-3 flex flex-col items-center">
          {phone && (
            <a href={`tel:${phone}`} className="text-gray-700 text-base font-medium">📞 {phone}</a>
          )}
          {page.contact_email && (
            <a href={`mailto:${page.contact_email}`} className="text-gray-700 text-base font-medium">✉️ {page.contact_email}</a>
          )}
          {waLink && (
            <a href={waLink} target="_blank" rel="noopener noreferrer"
              className="mt-2 inline-block px-6 py-3 rounded-lg text-white font-medium text-sm"
              style={{ backgroundColor: "#25D366" }}>
              שלח הודעה בוואטסאפ ←
            </a>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 text-center bg-gray-800">
        <p className="text-white text-sm">נבנה עם Fresh Start 💙</p>
      </div>
    </div>
  );
}