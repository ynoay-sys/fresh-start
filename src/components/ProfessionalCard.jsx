import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { trackEvent } from "../lib/trackEvent";

function getAvatarColor(name) {
  const colors = ["#1E5FA8", "#1A7A4A", "#5C1A8A", "#C25A00", "#008080", "#B8860B", "#AA1111", "#0D3B6E"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function StarRating({ rating }) {
  return (
    <span style={{ color: "#F59E0B", fontSize: 13 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i}>{i <= Math.round(rating) ? "★" : "☆"}</span>
      ))}
    </span>
  );
}

function ProfileModal({ partner, onClose, onSave, saved }) {
  const phone = partner.phone?.replace(/[-\s]/g, "");
  const waPhone = phone ? `972${phone.replace(/^0/, "")}` : null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" dir="rtl" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 text-lg">{partner.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <div className="px-5 py-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
              style={{ backgroundColor: getAvatarColor(partner.name) }}>
              {partner.logoInitials || partner.name?.slice(0, 2)}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{partner.name}</p>
              <p className="text-sm text-gray-500">{partner.profession}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <StarRating rating={partner.rating} />
                <span className="text-xs text-gray-400">({partner.reviewCount} ביקורות)</span>
              </div>
            </div>
          </div>
          {partner.description && <p className="text-sm text-gray-700 leading-relaxed">{partner.description}</p>}
          <div className="space-y-2 text-sm text-gray-600">
            <p>📍 {partner.city}{partner.address ? `, ${partner.address}` : ""}</p>
            {partner.phone && <p>📞 {partner.phone}</p>}
            {partner.email && <p>✉️ {partner.email}</p>}
            {partner.website && (
              <a href={partner.website} target="_blank" rel="noopener noreferrer"
                className="block text-blue-600 hover:underline">🌐 {partner.website}</a>
            )}
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={onSave}
              disabled={saved}
              className="flex-1 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-60"
              style={{ backgroundColor: saved ? "#1A7A4A" : "#1E5FA8" }}
            >
              {saved ? "✓ נשמר" : "שמור לאנשי קשר"}
            </button>
            {waPhone && (
              <a href={`https://wa.me/${waPhone}`} target="_blank" rel="noopener noreferrer"
                className="flex-1 py-2 rounded-lg border border-green-200 text-green-700 text-sm font-medium text-center hover:bg-green-50">
                WhatsApp ▸
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfessionalCard({ professional, onContactSaved }) {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const phone = professional.phone?.replace(/[-\s]/g, "");
  const waPhone = phone ? `972${phone.replace(/^0/, "")}` : null;
  const color = getAvatarColor(professional.name);
  const initials = professional.logoInitials || professional.name?.slice(0, 2) || "?";

  async function handleSave() {
    if (saved || saving) return;
    setSaving(true);
    try {
      const user = await base44.auth.me();
      // Check for duplicate by phone
      if (professional.phone) {
        const existing = await base44.entities.Contact.filter({ created_by: user.email });
        const dup = existing.find(c => c.phone?.replace(/[-\s]/g, "") === phone);
        if (dup) {
          onContactSaved?.("dup");
          setSaving(false);
          return;
        }
      }
      await base44.entities.Contact.create({
        full_name: professional.name,
        phone: professional.phone,
        email: professional.email || "",
        profession: professional.profession,
        category: "advisor",
        notes: professional.description || "",
      });
      setSaved(true);
      trackEvent("professional_saved", { category: professional.category });
      onContactSaved?.("saved", professional);
    } catch {
      // silently fail
    }
    setSaving(false);
  }

  function handleWhatsApp() {
    trackEvent("whatsapp_clicked", { isVerifiedPartner: professional.isVerifiedPartner });
  }

  function handleProfileModal() {
    trackEvent("profile_modal_opened", { name: professional.name });
    setShowModal(true);
  }

  return (
    <>
      <div
        className="bg-white rounded-xl border border-gray-100 hover:shadow-md transition-all flex flex-col"
        style={professional.isVerifiedPartner ? { borderRight: "3px solid #1A7A4A" } : {}}
      >
        <div className="p-4 flex-1">
          {/* Avatar + Name */}
          <div className="flex items-start gap-3 mb-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-base font-bold flex-shrink-0"
              style={{ backgroundColor: color }}>
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="font-bold text-gray-900 text-sm">{professional.name}</p>
                {professional.isVerifiedPartner && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold text-white flex-shrink-0"
                    style={{ backgroundColor: "#1A7A4A" }}>
                    ✓ שותף מאומת
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{professional.profession}</p>
            </div>
          </div>

          {/* Location */}
          <p className="text-xs text-gray-500 mb-2 truncate">
            📍 {professional.city}{professional.address ? `, ${professional.address}` : ""}
          </p>

          {/* Rating */}
          <div className="flex items-center gap-1.5">
            <StarRating rating={professional.rating} />
            <span className="text-xs text-gray-500">{professional.rating?.toFixed(1)} ({professional.reviewCount} ביקורות)</span>
          </div>
        </div>

        {/* Actions */}
        <div className="px-4 pb-4 flex flex-col gap-2 sm:flex-row">
          <button
            onClick={handleSave}
            disabled={saved || saving}
            className="flex-1 py-1.5 rounded-lg text-white text-xs font-medium disabled:opacity-60 transition-colors"
            style={{ backgroundColor: saved ? "#1A7A4A" : "#1E5FA8" }}
          >
            {saving ? "שומר..." : saved ? "✓ נשמר" : "שמור לאנשי קשר"}
          </button>
          {waPhone && (
            <a
              href={`https://wa.me/${waPhone}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleWhatsApp}
              className="flex-1 py-1.5 rounded-lg border border-green-200 text-green-700 text-xs font-medium text-center hover:bg-green-50"
            >
              WhatsApp ▸
            </a>
          )}
          {professional.isVerifiedPartner && (
            <button
              onClick={handleProfileModal}
              className="flex-1 py-1.5 rounded-lg border border-gray-200 text-gray-700 text-xs font-medium hover:bg-gray-50"
            >
              פרופיל מלא
            </button>
          )}
        </div>
      </div>

      {showModal && (
        <ProfileModal
          partner={professional}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
          saved={saved}
        />
      )}
    </>
  );
}