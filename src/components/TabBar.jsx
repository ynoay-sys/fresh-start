import { useRef, useState, useEffect, useLayoutEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Reusable horizontal tab bar with arrow navigation.
 * Works correctly in RTL layouts.
 */
export default function TabBar({ tabs, activeKey, onChange, className = "" }) {
  const scrollRef = useRef(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);

  function checkScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 2) {
      setAtStart(true);
      setAtEnd(true);
      return;
    }
    // scrollLeft in RTL: Chrome uses 0 at right-start, goes negative leftward
    // Use Math.abs for cross-browser safety
    const sl = Math.abs(el.scrollLeft);
    setAtStart(sl < 4);
    setAtEnd(sl > maxScroll - 4);
  }

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    // Delay to let layout stabilize
    const t = setTimeout(checkScroll, 50);
    el.addEventListener("scroll", checkScroll, { passive: true });
    const ro = new ResizeObserver(() => { checkScroll(); });
    ro.observe(el);
    return () => { clearTimeout(t); el.removeEventListener("scroll", checkScroll); ro.disconnect(); };
  }, [tabs]);

  // Scroll toward the end (left in RTL = more tabs)
  function goToEnd() {
    const el = scrollRef.current;
    if (!el) return;
    // In RTL Chrome, scrollLeft is negative for leftward scroll
    el.scrollBy({ left: -120, behavior: "smooth" });
  }

  // Scroll back toward start (right in RTL)
  function goToStart() {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: 120, behavior: "smooth" });
  }

  const showLeftArrow = !atEnd;   // more tabs hidden to the LEFT
  const showRightArrow = !atStart; // we've scrolled left, can go back RIGHT

  return (
    <div className={`relative flex items-center ${className}`} style={{ overflow: "hidden" }}>
      {/* LEFT arrow — reveals tabs hidden to the left */}
      {showLeftArrow && (
        <button
          onClick={goToEnd}
          className="absolute left-0 z-10 flex items-center justify-center bg-white shadow-md border border-gray-200 rounded-full flex-shrink-0"
          style={{ width: 30, height: 30, top: "50%", transform: "translateY(-50%)" }}
        >
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        </button>
      )}

      {/* Scrollable tab list */}
      <div
        ref={scrollRef}
        className="flex gap-1 w-full"
        style={{
          overflowX: "auto",
          scrollbarWidth: "none",
          WebkitOverflowScrolling: "touch",
          paddingLeft: showLeftArrow ? 36 : 0,
          paddingRight: showRightArrow ? 36 : 0,
        }}
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

      {/* RIGHT arrow — go back towards the start */}
      {showRightArrow && (
        <button
          onClick={goToStart}
          className="absolute right-0 z-10 flex items-center justify-center bg-white shadow-md border border-gray-200 rounded-full flex-shrink-0"
          style={{ width: 30, height: 30, top: "50%", transform: "translateY(-50%)" }}
        >
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </button>
      )}
    </div>
  );
}