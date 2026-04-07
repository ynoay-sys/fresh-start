import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Reusable horizontal tab bar with arrow navigation.
 * Props: tabs [{key, label}], activeKey, onChange
 */
export default function TabBar({ tabs, activeKey, onChange, className = "" }) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  function checkScroll() {
    const el = scrollRef.current;
    if (!el) return;
    // In RTL, scrollLeft can be negative in some browsers
    const sl = Math.abs(el.scrollLeft);
    setCanScrollLeft(sl > 4);
    setCanScrollRight(sl < el.scrollWidth - el.clientWidth - 4);
  }

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll, { passive: true });
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    return () => { el.removeEventListener("scroll", checkScroll); ro.disconnect(); };
  }, [tabs]);

  function scrollBy(dir) {
    const el = scrollRef.current;
    if (!el) return;
    // dir: "left" = show more left tabs (scroll right in RTL), "right" = opposite
    el.scrollBy({ left: dir === "left" ? -120 : 120, behavior: "smooth" });
  }

  return (
    <div className={`relative flex items-center ${className}`} style={{ overflow: "hidden" }}>
      {/* Right arrow (shows tabs to the right / earlier in RTL list) */}
      {canScrollLeft && (
        <button
          onClick={() => scrollBy("left")}
          className="absolute right-0 z-10 flex items-center justify-center bg-white shadow-md border border-gray-200 rounded-full flex-shrink-0"
          style={{ width: 28, height: 28, top: "50%", transform: "translateY(-50%)" }}
        >
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </button>
      )}

      {/* Scrollable tab list */}
      <div
        ref={scrollRef}
        className="flex gap-1 overflow-x-auto w-full"
        style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch",
          paddingRight: canScrollLeft ? 34 : 0,
          paddingLeft: canScrollRight ? 34 : 0 }}
      >
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap flex-shrink-0 transition-colors ${
              activeKey === tab.key ? "text-white" : "text-gray-600 bg-white border border-gray-200 hover:bg-gray-50"
            }`}
            style={activeKey === tab.key ? { backgroundColor: "#1E5FA8" } : {}}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Left arrow */}
      {canScrollRight && (
        <button
          onClick={() => scrollBy("right")}
          className="absolute left-0 z-10 flex items-center justify-center bg-white shadow-md border border-gray-200 rounded-full flex-shrink-0"
          style={{ width: 28, height: 28, top: "50%", transform: "translateY(-50%)" }}
        >
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        </button>
      )}
    </div>
  );
}