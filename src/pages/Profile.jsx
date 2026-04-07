import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ChevronDown, ChevronUp, Plus, Trash2, Check, ShieldCheck } from "lucide-react";
import { checkAndUnlockAchievements } from "../lib/achievements";

const SIG_TYPE_LABELS = { drawn: "צויירה", uploaded: "הועלתה", typed: "הוקלדה" };

const RELATION_OPTIONS = [
  { value: "spouse", label: "בן/בת זוג" },
  { value: "child", label: "ילד/ה" },
  { value: "parent", label: "הורה" },
  { value: "sibling", label: "אח/אחות" },
  { value: "other", label: "אחר" },
];

const REQUIRED_FIELDS = [
  "first_name", "last_name", "date_of_birth", "address", "city",
  "bank_name", "bank_branch", "bank_account",
  "vat_number", "tax_file_number", "nii_number",
];

function maskBankAccount(value) {
  if (!value) return "";
  if (value.startsWith("●")) return value;
  const visible = value.slice(-4);
  const masked = "●".repeat(Math.max(0, value.length - 4));
  return masked + visible;
}

function calcCompleteness(profile) {
  if (!profile) return 0;
  const filled = REQUIRED_FIELDS.filter(f => profile[f] && String(profile[f]).trim() !== "").length;
  return Math.round((filled / REQUIRED_FIELDS.length) * 100);
}

function SectionHeader({ title, expanded, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
    >
      <span className="font-semibold text-gray-800 text-base">{title}</span>
      {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
    </button>
  );
}

function FieldInput({ label, value, onChange, type = "text", dirty, saved, placeholder }) {
  const baseClass = "w-full rounded-lg border px-3 py-2 text-sm outline-none transition-all";
  let stateClass = "border-gray-200 bg-white focus:border-blue-400";
  if (dirty) stateClass = "border-gray-200 bg-white border-r-2 focus:border-blue-400";
  if (saved && !dirty) stateClass = "border-gray-200 focus:border-blue-400";

  const style = {};
  if (dirty) { style.borderRightColor = "#1A7A4A"; style.borderRightWidth = "2px"; }
  if (saved && !dirty) { style.backgroundColor = "#FFF5EE"; }

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-600">{label}</label>
      <input
        type={type}
        value={value || ""}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={style}
        className={`${baseClass} ${stateClass}`}
        dir="rtl"
      />
    </div>
  );
}

function SaveButton({ onClick, saving, justSaved }) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      className="flex items-center gap-2 px-5 py-2 rounded-lg text-white text-sm font-medium transition-all disabled:opacity-60"
      style={{ backgroundColor: justSaved ? "#1A7A4A" : "#1E5FA8" }}
    >
      {justSaved ? (
        <><Check className="w-4 h-4" /> נשמר ✓</>
      ) : saving ? (
        "שומר..."
      ) : (
        "שמור"
      )}
    </button>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const [achievements, setAchievements] = useState([]);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileId, setProfileId] = useState(null);
  const [activeSig, setActiveSig] = useState(null);
  const [loading, setLoading] = useState(true);

  // Section expanded states
  const [expanded, setExpanded] = useState({ personal: true, bank: false, business: false, family: false, signature: false });

  // Per-section dirty / saving / justSaved states
  const [dirty, setDirty] = useState({ personal: false, bank: false, business: false, family: false });
  const [saving, setSaving] = useState({ personal: false, bank: false, business: false, family: false });
  const [justSaved, setJustSaved] = useState({ personal: false, bank: false, business: false, family: false });

  // Working copies per section
  const [personal, setPersonal] = useState({});
  const [bank, setBank] = useState({});
  const [business, setBusiness] = useState({});
  const [family, setFamily] = useState([]);

  useEffect(() => {
    async function load() {
      const u = await base44.auth.me();
      setUser(u);
      const results = await base44.entities.UserProfile.filter({ created_by: u.email });
      if (results.length > 0) {
        const p = results[0];
        setProfileId(p.id);
        setProfile(p);
        initSections(p);
      } else {
        const created = await base44.entities.UserProfile.create({ user_id: u.id });
        setProfileId(created.id);
        setProfile(created);
        initSections(created);
      }
      // Load active signature
      base44.entities.Signature.filter({ created_by: u.email, is_active: true })
        .then(sigs => setActiveSig(sigs[0] || null))
        .catch(() => {});
      base44.entities.Achievement.filter({ created_by: u.email })
        .then(items => setAchievements(items))
        .catch(() => {});
      setLoading(false);
    }
    load();
  }, []);

  function initSections(p) {
    setPersonal({ first_name: p.first_name, last_name: p.last_name, date_of_birth: p.date_of_birth, address: p.address, city: p.city, gender: p.gender || "not_specified" });
    setBank({ bank_name: p.bank_name, bank_branch: p.bank_branch, bank_account: p.bank_account });
    setBusiness({ vat_number: p.vat_number, tax_file_number: p.tax_file_number, nii_number: p.nii_number });
    setFamily(p.family_data || []);
  }

  function markDirty(section) {
    setDirty(d => ({ ...d, [section]: true }));
  }

  async function saveSection(section, data) {
    setSaving(s => ({ ...s, [section]: true }));
    await base44.entities.UserProfile.update(profileId, data);
    setProfile(p => ({ ...p, ...data }));
    setSaving(s => ({ ...s, [section]: false }));
    setDirty(d => ({ ...d, [section]: false }));
    setJustSaved(j => ({ ...j, [section]: true }));
    setTimeout(() => setJustSaved(j => ({ ...j, [section]: false })), 2000);
    checkAndUnlockAchievements().catch(() => {});
  }

  const completeness = calcCompleteness({ ...profile, ...personal, ...bank, ...business });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  const isSaved = (section) => !dirty[section] && (justSaved[section] || (profile && !!profile.first_name));

  return (
    <div className="max-w-2xl mx-auto px-4 py-8" dir="rtl">
      {/* Achievements Summary */}
      {achievements.length > 0 && (
        <button
          onClick={() => navigate("/progress")}
          className="flex items-center gap-2 mb-4 px-4 py-2.5 bg-white rounded-xl border border-gray-200 w-full hover:border-gray-300 transition-colors"
        >
          <span className="text-base">🏆</span>
          <span className="text-sm font-semibold text-gray-800">{achievements.length} הישגים</span>
          <div className="flex gap-1 mr-1">
            {achievements.slice(0, 6).map(a => (
              <div key={a.achievement_key}
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #1E5FA8, #5C1A8A)" }}
              >
                {a.icon}
              </div>
            ))}
          </div>
          <span className="text-xs text-gray-400 mr-auto">צפה בכל ←</span>
        </button>
      )}

      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">הפרופיל שלי</h1>
        <p className="text-sm text-gray-500 mt-1">{user?.email}</p>
      </div>

      {/* Completeness Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-700">פרופיל מלא: {completeness}%</span>
          {completeness === 100 && (
            <span className="text-xs text-green-600 font-medium flex items-center gap-1">
              <Check className="w-3 h-3" /> הפרופיל מלא!
            </span>
          )}
        </div>
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${completeness}%`, backgroundColor: "#1E5FA8" }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1.5">
          {Math.round((completeness / 100) * REQUIRED_FIELDS.length)} מתוך {REQUIRED_FIELDS.length} שדות מולאו
        </p>
      </div>

      {/* Section 1: פרטים אישיים */}
      <div className="bg-white rounded-xl border border-gray-200 mb-4 overflow-hidden">
        <SectionHeader
          title="פרטים אישיים"
          expanded={expanded.personal}
          onToggle={() => setExpanded(e => ({ ...e, personal: !e.personal }))}
        />
        {expanded.personal && (
          <div className="px-5 pb-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FieldInput label="שם פרטי" value={personal.first_name}
                onChange={v => { setPersonal(p => ({ ...p, first_name: v })); markDirty("personal"); }}
                dirty={dirty.personal} saved={!dirty.personal && justSaved.personal} />
              <FieldInput label="שם משפחה" value={personal.last_name}
                onChange={v => { setPersonal(p => ({ ...p, last_name: v })); markDirty("personal"); }}
                dirty={dirty.personal} saved={!dirty.personal && justSaved.personal} />
            </div>
            <FieldInput label="תאריך לידה" value={personal.date_of_birth} type="date"
              onChange={v => { setPersonal(p => ({ ...p, date_of_birth: v })); markDirty("personal"); }}
              dirty={dirty.personal} saved={!dirty.personal && justSaved.personal} />
            <FieldInput label="כתובת" value={personal.address}
              onChange={v => { setPersonal(p => ({ ...p, address: v })); markDirty("personal"); }}
              dirty={dirty.personal} saved={!dirty.personal && justSaved.personal} />
            <FieldInput label="עיר" value={personal.city}
              onChange={v => { setPersonal(p => ({ ...p, city: v })); markDirty("personal"); }}
              dirty={dirty.personal} saved={!dirty.personal && justSaved.personal} />
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">מין</label>
              <div className="flex gap-4">
                {[{val:"male",label:"זכר"},{val:"female",label:"נקבה"},{val:"not_specified",label:"לא צוין"}].map(opt => (
                  <label key={opt.val} className="flex items-center gap-1.5 cursor-pointer text-sm text-gray-700">
                    <input
                      type="radio"
                      name="gender"
                      value={opt.val}
                      checked={(personal.gender || "not_specified") === opt.val}
                      onChange={() => { setPersonal(p => ({ ...p, gender: opt.val })); markDirty("personal"); }}
                      className="accent-blue-600"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-start pt-1">
              <SaveButton
                onClick={() => saveSection("personal", personal)}
                saving={saving.personal}
                justSaved={justSaved.personal}
              />
            </div>
          </div>
        )}
      </div>

      {/* Section 2: פרטי בנק */}
      <div className="bg-white rounded-xl border border-gray-200 mb-4 overflow-hidden">
        <SectionHeader
          title="פרטי בנק"
          expanded={expanded.bank}
          onToggle={() => setExpanded(e => ({ ...e, bank: !e.bank }))}
        />
        {expanded.bank && (
          <div className="px-5 pb-5 space-y-4">
            <FieldInput label="שם הבנק" value={bank.bank_name}
              onChange={v => { setBank(b => ({ ...b, bank_name: v })); markDirty("bank"); }}
              dirty={dirty.bank} saved={!dirty.bank && justSaved.bank} />
            <div className="grid grid-cols-2 gap-4">
              <FieldInput label="מספר סניף" value={bank.bank_branch}
                onChange={v => { setBank(b => ({ ...b, bank_branch: v })); markDirty("bank"); }}
                dirty={dirty.bank} saved={!dirty.bank && justSaved.bank} />
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">מספר חשבון</label>
                <input
                  type="text"
                  value={bank.bank_account ? maskBankAccount(bank.bank_account) : ""}
                  onChange={e => {
                    const raw = e.target.value.replace(/●/g, "");
                    setBank(b => ({ ...b, bank_account: raw }));
                    markDirty("bank");
                  }}
                  onFocus={e => {
                    if (bank.bank_account) {
                      e.target.value = bank.bank_account;
                    }
                  }}
                  onBlur={e => {
                    if (bank.bank_account) {
                      e.target.value = maskBankAccount(bank.bank_account);
                    }
                  }}
                  placeholder="●●●●●●1234"
                  dir="ltr"
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition-all border-gray-200 bg-white focus:border-blue-400 text-right"
                  style={dirty.bank ? { borderRightColor: "#1A7A4A", borderRightWidth: "2px" } : !dirty.bank && justSaved.bank ? { backgroundColor: "#FFF5EE" } : {}}
                />
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
              <span>פרטי הבנק מוצפנים ומאובטחים</span>
            </div>
            <div className="flex justify-start pt-1">
              <SaveButton
                onClick={() => saveSection("bank", bank)}
                saving={saving.bank}
                justSaved={justSaved.bank}
              />
            </div>
          </div>
        )}
      </div>

      {/* Section 3: פרטי עסק */}
      <div className="bg-white rounded-xl border border-gray-200 mb-4 overflow-hidden">
        <SectionHeader
          title='פרטי עסק'
          expanded={expanded.business}
          onToggle={() => setExpanded(e => ({ ...e, business: !e.business }))}
        />
        {expanded.business && (
          <div className="px-5 pb-5 space-y-4">
            <FieldInput label='מספר עוסק / מע"מ' value={business.vat_number}
              onChange={v => { setBusiness(b => ({ ...b, vat_number: v })); markDirty("business"); }}
              dirty={dirty.business} saved={!dirty.business && justSaved.business} />
            <FieldInput label="תיק מס הכנסה" value={business.tax_file_number}
              onChange={v => { setBusiness(b => ({ ...b, tax_file_number: v })); markDirty("business"); }}
              dirty={dirty.business} saved={!dirty.business && justSaved.business} />
            <FieldInput label="מספר ביטוח לאומי" value={business.nii_number}
              onChange={v => { setBusiness(b => ({ ...b, nii_number: v })); markDirty("business"); }}
              dirty={dirty.business} saved={!dirty.business && justSaved.business} />
            <div className="flex justify-start pt-1">
              <SaveButton
                onClick={() => saveSection("business", business)}
                saving={saving.business}
                justSaved={justSaved.business}
              />
            </div>
          </div>
        )}
      </div>

      {/* Section 5: החתימה שלי */}
      <div className="bg-white rounded-xl border border-gray-200 mb-4 overflow-hidden">
        <SectionHeader
          title="החתימה שלי"
          expanded={expanded.signature}
          onToggle={() => setExpanded(e => ({ ...e, signature: !e.signature }))}
        />
        {expanded.signature && (
          <div className="px-5 pb-5 space-y-4">
            {activeSig ? (
              <>
                <img
                  src={activeSig.storage_path}
                  alt="חתימה"
                  className="max-h-24 border border-gray-100 rounded-lg bg-gray-50"
                />
                <div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">
                    {SIG_TYPE_LABELS[activeSig.type] || activeSig.type}
                  </span>
                </div>
                <button
                  onClick={() => navigate("/documents/sign/create")}
                  className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                  style={{ backgroundColor: "#1E5FA8" }}
                >
                  החלף חתימה
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-gray-500">לא הוגדרה חתימה עדיין</p>
                <button
                  onClick={() => navigate("/documents/sign/create")}
                  className="px-4 py-2 rounded-lg text-white text-sm font-medium w-fit"
                  style={{ backgroundColor: "#1E5FA8" }}
                >
                  צור חתימה ←
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Section 4: משפחה */}
      <div className="bg-white rounded-xl border border-gray-200 mb-4 overflow-hidden">
        <SectionHeader
          title="משפחה"
          expanded={expanded.family}
          onToggle={() => setExpanded(e => ({ ...e, family: !e.family }))}
        />
        {expanded.family && (
          <div className="px-5 pb-5 space-y-3">
            {family.map((member, idx) => (
              <div key={idx} className="flex gap-2 items-start p-3 rounded-lg border border-gray-100 bg-gray-50/50">
                <div className="flex-1 grid grid-cols-3 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-500">שם</label>
                    <input
                      type="text"
                      value={member.name || ""}
                      onChange={e => {
                        const updated = [...family];
                        updated[idx] = { ...updated[idx], name: e.target.value };
                        setFamily(updated);
                        markDirty("family");
                      }}
                      className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-blue-400"
                      style={dirty.family ? { borderRightColor: "#1A7A4A", borderRightWidth: "2px" } : {}}
                      dir="rtl"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-500">תאריך לידה</label>
                    <input
                      type="date"
                      value={member.dob || ""}
                      onChange={e => {
                        const updated = [...family];
                        updated[idx] = { ...updated[idx], dob: e.target.value };
                        setFamily(updated);
                        markDirty("family");
                      }}
                      className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-blue-400"
                      style={dirty.family ? { borderRightColor: "#1A7A4A", borderRightWidth: "2px" } : {}}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-500">קרבה</label>
                    <select
                      value={member.relation || ""}
                      onChange={e => {
                        const updated = [...family];
                        updated[idx] = { ...updated[idx], relation: e.target.value };
                        setFamily(updated);
                        markDirty("family");
                      }}
                      className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-blue-400 bg-white"
                      dir="rtl"
                    >
                      <option value="">בחר</option>
                      {RELATION_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setFamily(f => f.filter((_, i) => i !== idx));
                    markDirty("family");
                  }}
                  className="mt-5 p-1.5 rounded-md text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            <button
              onClick={() => {
                setFamily(f => [...f, { name: "", dob: "", relation: "" }]);
                markDirty("family");
              }}
              className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg border border-dashed border-gray-300 hover:border-blue-400 hover:text-blue-600 transition-colors text-gray-500 w-full justify-center"
            >
              <Plus className="w-4 h-4" />
              + הוסף בן משפחה
            </button>

            <div className="flex justify-start pt-1">
              <SaveButton
                onClick={() => saveSection("family", { family_data: family })}
                saving={saving.family}
                justSaved={justSaved.family}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}