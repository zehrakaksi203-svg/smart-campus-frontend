import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllCourseSections } from "../api/courses";
import { getAllAnnouncements } from "../api/announcements";
import { getAllEvents } from "../api/events";
import Icon from "./Icon";

function GlobalSearch() {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
      if (event.key === "Escape") {
        setQuery("");
        inputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const term = query.trim().toLocaleLowerCase("tr-TR");
    if (term.length < 2) {
      setResults([]);
      return undefined;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const [sectionsRes, announcementsRes, eventsRes] = await Promise.all([
          getAllCourseSections(), getAllAnnouncements(), getAllEvents(),
        ]);
        const sections = Array.isArray(sectionsRes.data) ? sectionsRes.data : [];
        const announcements = Array.isArray(announcementsRes.data) ? announcementsRes.data : [];
        const events = Array.isArray(eventsRes.data?.events) ? eventsRes.data.events : [];
        const matched = [
          ...sections.map((section) => ({ type: "Ders", title: `${section.course?.courseCode || ""} ${section.course?.courseName || ""}`.trim(), detail: section.faculty?.user?.fullName || "Ders", to: "/courses", icon: "book" })),
          ...announcements.map((item) => ({ type: "Duyuru", title: item.title || "Duyuru", detail: item.content || "", to: "/announcements", icon: "bell" })),
          ...events.map((item) => ({ type: "Etkinlik", title: item.title || "Etkinlik", detail: item.location || item.description || "", to: "/events", icon: "spark" })),
        ].filter((item) => `${item.title} ${item.detail}`.toLocaleLowerCase("tr-TR").includes(term)).slice(0, 6);
        setResults(matched);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  const selectResult = (to) => {
    navigate(to);
    setQuery("");
  };

  return (
    <div className="relative hidden max-w-xl flex-1 md:block">
      <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-400 shadow-sm focus-within:border-indigo-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-50">
        <Icon name="search" className="h-5 w-5" />
        <input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400" placeholder="Ders, duyuru veya etkinlik ara..." aria-label="Kampüste ara" />
        <kbd className="shrink-0 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-400">⌘ K</kbd>
      </label>
      {query.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/10">
          {loading ? <p className="px-3 py-4 text-sm text-slate-400">Aranıyor...</p> : results.length === 0 ? <p className="px-3 py-4 text-sm text-slate-400">Sonuç bulunamadı.</p> : results.map((result, index) => (
            <button key={`${result.type}-${index}`} onMouseDown={(event) => event.preventDefault()} onClick={() => selectResult(result.to)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-indigo-50">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-indigo-50 text-indigo-600"><Icon name={result.icon} className="h-4 w-4" /></span>
              <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-slate-700">{result.title}</span><span className="block truncate text-xs text-slate-400">{result.detail || result.type}</span></span>
              <span className="text-[11px] font-bold text-indigo-500">{result.type}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default GlobalSearch;
