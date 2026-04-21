import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Search } from "lucide-react";
import ProfessionalCard from "../components/ProfessionalCard";
import { MOCK_PLACES, CATEGORIES, SUBCATEGORIES } from "../lib/mockPlacesData";
import { trackEvent } from "../lib/trackEvent";

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0" />
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
        </div>
      </div>
      <div className="h-3 bg-gray-100 rounded mb-2" />
      <div className="h-3 bg-gray-100 rounded w-2/3 mb-4" />
      <div className="flex gap-2">
        <div className="flex-1 h-7 bg-gray-200 rounded-lg" />
        <div className="flex-1 h-7 bg-gray-100 rounded-lg" />
      </div>
    </div>
  );
}

function SectionHeader({ title, count, note }) {
  return (
    <div className="mb-3">
      <div className="flex items-center gap-2">
        <h2 className="text-base font-bold text-gray-800">{title}</h2>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{count}</span>
      </div>
      {note && <p className="text-xs text-gray-400 mt-0.5">{note}</p>}
    </div>
  );
}

export default function ProfessionalMarketplace() {
  const navigate = useNavigate();
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [activeSubcategory, setActiveSubcategory] = useState("");
  const [activeCity, setActiveCity] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    document.title = "מצא אנשי מקצוע | Fresh Start";
    trackEvent("marketplace_opened");
    // Simulate async load
    const t = setTimeout(() => {
      base44.entities.ProfessionalPartner.list().then(res => {
        setPartners(res);
        setLoading(false);
      }).catch(() => setLoading(false));
    }, 800);
    return () => clearTimeout(t);
  }, []);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  function handleContactSaved(result) {
    if (result === "saved") showToast("איש הקשר נוסף בהצלחה ✓");
    else if (result === "dup") showToast("איש קשר זה כבר קיים ברשימה שלך");
  }

  // All cities from both sources
  const allCities = useMemo(() => {
    const set = new Set([...partners.map(p => p.city), ...MOCK_PLACES.map(p => p.city)].filter(Boolean));
    return Array.from(set).sort();
  }, [partners]);

  function matchesFilters(p) {
    const q = search.toLowerCase();
    const matchSearch = !q || [p.name, p.profession, p.city].some(f => f?.toLowerCase().includes(q));
    const matchCat = !activeCategory || p.category === activeCategory;
    const matchSub = !activeSubcategory || p.subcategory === activeSubcategory;
    const matchCity = !activeCity || p.city === activeCity;
    return matchSearch && matchCat && matchSub && matchCity;
  }

  const filteredPartners = partners.filter(matchesFilters);
  const filteredPlaces = MOCK_PLACES.filter(matchesFilters);

  const noResults = !loading && filteredPartners.length === 0 && filteredPlaces.length === 0;

  const subcategories = activeCategory ? (SUBCATEGORIES[activeCategory] || []) : [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6" dir="rtl">
      {/* Back */}
      <button onClick={() => navigate("/contacts")}
        className="flex items-center gap-1.5 text-sm font-medium mb-5"
        style={{ color: "#1E5FA8" }}>
        <span>→</span> חזרה לאנשי קשר
      </button>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">מצא אנשי מקצוע</h1>
        <p className="text-sm text-gray-500 mt-1">גלה אנשי מקצוע מומחים לעסק שלך</p>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="חפש לפי שם, מקצוע או עיר..."
          className="w-full pr-10 pl-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400 bg-white"
          dir="rtl"
        />
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-2">
        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          <button
            onClick={() => { setActiveCategory(""); setActiveSubcategory(""); }}
            className="px-3 py-1.5 rounded-lg text-sm font-medium flex-shrink-0 transition-colors"
            style={!activeCategory ? { backgroundColor: "#1E5FA8", color: "white" } : { backgroundColor: "white", border: "1px solid #E5E7EB", color: "#374151" }}
          >
            הכל
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat === activeCategory ? "" : cat); setActiveSubcategory(""); }}
              className="px-3 py-1.5 rounded-lg text-sm font-medium flex-shrink-0 transition-colors"
              style={activeCategory === cat ? { backgroundColor: "#1E5FA8", color: "white" } : { backgroundColor: "white", border: "1px solid #E5E7EB", color: "#374151" }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Subcategory chips */}
        {subcategories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {subcategories.map(sub => (
              <button
                key={sub}
                onClick={() => setActiveSubcategory(sub === activeSubcategory ? "" : sub)}
                className="px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 transition-colors"
                style={activeSubcategory === sub
                  ? { backgroundColor: "#EAF2FB", color: "#1E5FA8", border: "1px solid #1E5FA8" }
                  : { backgroundColor: "#F3F4F6", color: "#6B7280", border: "1px solid transparent" }}
              >
                {sub}
              </button>
            ))}
          </div>
        )}

        {/* City filter */}
        <div>
          <select
            value={activeCity}
            onChange={e => setActiveCity(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:border-blue-400"
            dir="rtl"
          >
            <option value="">כל הערים</option>
            {allCities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Loading skeletons */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* No results */}
      {noResults && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="text-5xl mb-4">🔍</span>
          <p className="text-lg font-semibold text-gray-700 mb-1">לא נמצאו תוצאות</p>
          <p className="text-sm text-gray-400">נסה לשנות את הסינון או מילות החיפוש.</p>
        </div>
      )}

      {/* Section A — Partners */}
      {!loading && (
        <div className="mb-8">
          <SectionHeader title="שותפי Fresh Start" count={filteredPartners.length} />
          {filteredPartners.length === 0 ? (
            <p className="text-sm text-gray-400 py-4">לא נמצאו שותפים בקטגוריה זו</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPartners.map(p => (
                <ProfessionalCard key={p.id} professional={p} onContactSaved={handleContactSaved} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Section B — Mock Places */}
      {!loading && (
        <div className="mb-8">
          <SectionHeader
            title="תוצאות נוספות"
            count={filteredPlaces.length}
            note="תוצאות מבוססות על נתוני מיקום ציבוריים"
          />
          {filteredPlaces.length === 0 ? (
            <p className="text-sm text-gray-400 py-4">אין תוצאות נוספות</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPlaces.map(p => (
                <ProfessionalCard key={p.id} professional={p} onContactSaved={handleContactSaved} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)",
          backgroundColor: toast.includes("כבר") ? "#C25A00" : "#1A7A4A",
          color: "white", padding: "10px 20px", borderRadius: 999,
          fontSize: 14, fontWeight: 500, boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
          zIndex: 9999, whiteSpace: "nowrap",
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}