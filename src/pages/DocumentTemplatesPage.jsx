import TemplatesLibrary from "../components/TemplatesLibrary";

export default function DocumentTemplatesPage() {
  return (
    <div className="px-4 py-8 max-w-6xl mx-auto" dir="rtl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">ספריית טפסים ממשלתיים</h1>
      <TemplatesLibrary />
    </div>
  );
}