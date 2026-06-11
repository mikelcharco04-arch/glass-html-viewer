import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useMemo, useRef, useState } from "react";
import { fetchPage } from "@/lib/fetch-html.functions";
import homeBg from "@/assets/home-bg.jpeg.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Axell & Sam — Navegador" },
      { name: "description", content: "Navegador rápido que muestra solo HTML puro, sin estilos." },
    ],
  }),
  component: BrowserApp,
});

type Engine = { id: string; name: string; search: (q: string) => string };

const engines: Engine[] = [
  { id: "duckduckgo", name: "DuckDuckGo", search: (q) => `https://duckduckgo.com/?q=${encodeURIComponent(q)}` },
  { id: "brave", name: "Brave", search: (q) => `https://search.brave.com/search?q=${encodeURIComponent(q)}` },
  { id: "google", name: "Google", search: (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}` },
  { id: "bing", name: "Bing", search: (q) => `https://www.bing.com/search?q=${encodeURIComponent(q)}` },
];

function isLikelyUrl(input: string): boolean {
  const s = input.trim();
  if (/\s/.test(s)) return false;
  if (/^https?:\/\//i.test(s)) return true;
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+(\/.*)?$/i.test(s);
}

function BrowserApp() {
  const fetchFn = useServerFn(fetchPage);
  const [query, setQuery] = useState("");
  const [engineId, setEngineId] = useState("duckduckgo");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [html, setHtml] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const engine = useMemo(() => engines.find((e) => e.id === engineId) ?? engines[0], [engineId]);

  const load = useCallback(
    async (raw: string) => {
      const input = raw.trim();
      if (!input) return;
      const url = isLikelyUrl(input)
        ? (/^https?:\/\//i.test(input) ? input : `https://${input}`)
        : engine.search(input);
      setLoading(true);
      setError(null);
      try {
        const res = await fetchFn({ data: { url } });
        setHtml(res.html);
        setCurrentUrl(res.finalUrl);
        setHistory((h) => (h[h.length - 1] === res.finalUrl ? h : [...h, res.finalUrl]));
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo cargar la página");
      } finally {
        setLoading(false);
      }
    },
    [engine, fetchFn],
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    load(query);
  };

  const goHome = () => {
    setHtml(null);
    setCurrentUrl(null);
    setError(null);
    setQuery("");
  };

  const goBack = () => {
    if (history.length < 2) {
      goHome();
      return;
    }
    const next = [...history];
    next.pop();
    const prev = next[next.length - 1];
    setHistory(next);
    if (prev) load(prev);
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        position: "relative",
        backgroundImage: html ? "none" : `url(${homeBg.url})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundColor: "var(--color-background)",
      }}
    >
      {!html && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 70%, rgba(0,0,0,0.85) 100%)",
          }}
        />
      )}

      {/* Top bar */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          padding: "calc(env(safe-area-inset-top) + 10px) 12px 10px",
        }}
      >
        <div
          className="glass-strong"
          style={{
            borderRadius: "999px",
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 10px",
          }}
        >
          <button
            type="button"
            onClick={html ? goBack : goHome}
            aria-label="Atrás"
            style={iconBtn}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>

          <form onSubmit={onSubmit} style={{ flex: 1, display: "flex" }}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={currentUrl ?? "Buscar o introducir sitio web"}
              inputMode="url"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                padding: "8px 10px",
                fontSize: 15,
                color: "var(--color-foreground)",
                minWidth: 0,
              }}
            />
          </form>

          <select
            value={engineId}
            onChange={(e) => setEngineId(e.target.value)}
            aria-label="Motor de búsqueda"
            style={{
              background: "rgba(255,255,255,0.08)",
              color: "var(--color-foreground)",
              border: "1px solid var(--glass-border)",
              borderRadius: 999,
              padding: "6px 8px",
              fontSize: 12,
            }}
          >
            {engines.map((en) => (
              <option key={en.id} value={en.id} style={{ color: "#000" }}>
                {en.name}
              </option>
            ))}
          </select>

          <button type="button" onClick={goHome} aria-label="Inicio" style={iconBtn}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></svg>
          </button>
        </div>
        {loading && (
          <div style={{ height: 2, marginTop: 6, borderRadius: 2, overflow: "hidden", background: "rgba(255,255,255,0.1)" }}>
            <div style={{ width: "40%", height: "100%", background: "var(--color-accent)", animation: "loadbar 1.1s ease-in-out infinite" }} />
          </div>
        )}
        <style>{`@keyframes loadbar { 0%{transform:translateX(-100%);} 100%{transform:translateX(350%);} }`}</style>
      </header>

      {/* Content */}
      <main style={{ position: "relative", padding: "0 12px 24px", zIndex: 1 }}>
        {!html && !error && (
          <div className="fade-in" style={{ textAlign: "center", padding: "18vh 8px 0", color: "#fff" }}>
            <h1 style={{ fontSize: 38, margin: 0, fontWeight: 700, letterSpacing: -0.5, textShadow: "0 2px 16px rgba(0,0,0,0.6)" }}>
              Axell &amp; Sam
            </h1>
            <p style={{ marginTop: 10, opacity: 0.85, fontSize: 15 }}>
              Navegación limpia. Solo HTML puro.
            </p>
            <div className="glass" style={{ marginTop: 28, padding: 14, borderRadius: 20, maxWidth: 420, marginInline: "auto", textAlign: "left" }}>
              <p style={{ margin: 0, fontSize: 13, opacity: 0.9 }}>
                Escribe una búsqueda o pega una URL en la barra superior. El contenido se mostrará sin CSS, sin scripts ni efectos visuales.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="glass fade-in" style={{ marginTop: 16, padding: 16, borderRadius: 18, color: "#fff" }}>
            <strong>Error</strong>
            <p style={{ margin: "6px 0 0", opacity: 0.9, fontSize: 14 }}>{error}</p>
          </div>
        )}

        {html && (
          <div
            className="fade-in"
            style={{
              marginTop: 12,
              borderRadius: 20,
              overflow: "hidden",
              background: "#fff",
              border: "1px solid var(--glass-border)",
              boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
            }}
          >
            <iframe
              ref={iframeRef}
              title="Contenido"
              srcDoc={html}
              sandbox="allow-same-origin allow-popups"
              referrerPolicy="no-referrer"
              style={{
                width: "100%",
                height: "calc(100dvh - 130px)",
                border: "none",
                background: "#fff",
                colorScheme: "light",
              }}
            />
          </div>
        )}
      </main>
    </div>
  );
}

const iconBtn: React.CSSProperties = {
  width: 34,
  height: 34,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 999,
  background: "rgba(255,255,255,0.08)",
  border: "1px solid var(--glass-border)",
  color: "var(--color-foreground)",
  cursor: "pointer",
  flexShrink: 0,
};
