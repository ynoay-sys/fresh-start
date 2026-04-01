import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import LandingPagePreview from "../components/LandingPagePreview";

export default function PublicLandingPage() {
  const [page, setPage] = useState(null);
  const [businessName, setBusinessName] = useState("");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      const pathParts = window.location.pathname.split("/");
      const subdomain = pathParts[pathParts.length - 1];
      if (!subdomain) { setNotFound(true); setLoading(false); return; }

      const pages = await base44.entities.LandingPage.filter({ subdomain, is_published: true });
      if (pages.length === 0) { setNotFound(true); setLoading(false); return; }

      const p = pages[0];
      setPage(p);

      // Try to get business name from user profile
      try {
        const profiles = await base44.entities.UserProfile.filter({ created_by: p.created_by });
        setBusinessName(profiles[0]?.business_name || "");
      } catch {
        setBusinessName("");
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50" dir="rtl">
        <span className="text-6xl mb-4">🌐</span>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">הדף לא נמצא</h1>
        <p className="text-gray-500 text-sm mb-6">הדף שחיפשת אינו קיים או לא פורסם</p>
        <a href="/" className="px-5 py-2.5 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: "#1E5FA8" }}>
          Fresh Start ←
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <LandingPagePreview page={page} businessName={businessName} />
    </div>
  );
}