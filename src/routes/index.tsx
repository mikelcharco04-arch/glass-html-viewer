import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useMemo, useRef, useState } from "react";
import { ArrowLeft, Home, Search, RotateCw, X, Globe } from "lucide-react";
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

function prettyHost(u: string | null): string {
  if (!u) return "";
  try {
    return new URL(u).host.replace(/^www\./, "");
  } catch {
    return u;
  }
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
  const inputRef = useRef<HTMLInputElement>(null);

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
      inputRef.current?.blur();
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
    setHistory([]);
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

  const reload = () => {
    if (currentUrl) load(currentUrl);
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        position: "relative",
        backgroundImage: `url(${homeBg.url})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        backgroundColor: "var(--color-background)",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          background: html
            ? "linear-gradient(180deg, rgba(8,8,16,0.92), rgba(8,8,16,0.96))"
            : "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.5) 60%, rgba(0,0,0,0.85) 100%)",
          transition: "background 0.4s ease",
          pointerEvents: "none",
        }}
      />

      {/* Top bar */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 30,
          padding: "calc(env(safe-area-inset-top) + 10px) 12px 10px",
        }}
      >
        <div
          className="glass-strong"
          style={{
            borderRadius: 24,
            padding: 10,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {/* Row 1: nav controls + host pill */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button type="button" onClick={goBack} aria-label="Atrás" style={iconBtn}>
              <ArrowLeft size={18} strokeWidth={2.2} />
            </button>
            <button type="button" onClick={goHome} aria-label="Inicio" style={iconBtn}>
              <Home size={18} strokeWidth={2.2} />
            </button>

            <div
              style={{
                flex: 1,
                minWidth: 0,
                display: "flex",
                alignItems: "center",
                gap: 6,
                justifyContent: "center",
                padding: "0 8px",
                color: "rgba(255,255,255,0.85)",
                fontSize: 12.5,
                fontWeight: 500,
                letterSpacing: 0.2,
              }}
            >
              <Globe size={13} style={{ opacity: 0.7, flexShrink: 0 }} />
              <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {currentUrl ? prettyHost(currentUrl) : "Inicio"}
              </span>
            </div>

            <button
              type="button"
              onClick={reload}
              aria-label="Recargar"
              disabled={!currentUrl}
              style={{ ...iconBtn, opacity: currentUrl ? 1 : 0.4 }}
            >
              <RotateCw size={16} strokeWidth={2.2} />
            </button>
          </div>

          {/* Row 2: search pill */}
          <form
            onSubmit={onSubmit}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 6px 6px 14px",
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.18)",
              borderRadius: 999,
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)",
            }}
          >
            <Search size={16} style={{ color: "rgba(255,255,255,0.7)", flexShrink: 0 }} />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar o introducir sitio web"
              inputMode="url"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                padding: "8px 4px",
                fontSize: 15,
                color: "var(--color-foreground)",
                minWidth: 0,
              }}
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  inputRef.current?.focus();
                }}
                aria-label="Borrar"
                style={{ ...iconBtn, width: 28, height: 28, background: "rgba(255,255,255,0.12)" }}
              >
                <X size={14} strokeWidth={2.4} />
              </button>
            )}
            <button
              type="submit"
              aria-label="Buscar"
              disabled={!query.trim() || loading}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                height: 34,
                padding: "0 14px",
                borderRadius: 999,
                border: "none",
                background:
                  "linear-gradient(135deg, oklch(0.82 0.22 350), oklch(0.7 0.24 320))",
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                cursor: query.trim() ? "pointer" : "default",
                opacity: query.trim() && !loading ? 1 : 0.55,
                boxShadow: "0 6px 18px rgba(236, 72, 153, 0.35)",
                transition: "transform 0.15s ease, opacity 0.2s ease",
              }}
            >
              <Search size={15} strokeWidth={2.4} />
              <span>Buscar</span>
            </button>
          </form>

          {/* Row 3: engine chips */}
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
            {engines.map((en) => {
              const active = en.id === engineId;
              return (
                <button
                  key={en.id}
                  type="button"
                  onClick={() => setEngineId(en.id)}
                  style={{
                    padding: "5px 12px",
                    fontSize: 12,
                    fontWeight: 500,
                    borderRadius: 999,
                    border: "1px solid",
                    borderColor: active ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.15)",
                    background: active ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.05)",
                    color: "#fff",
                    whiteSpace: "nowrap",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {en.name}
                </button>
              );
            })}
          </div>
        </div>

        {loading && (
          <div
            style={{
              height: 2,
              marginTop: 8,
              borderRadius: 2,
              overflow: "hidden",
              background: "rgba(255,255,255,0.1)",
            }}
          >
            <div
              style={{
                width: "40%",
                height: "100%",
                background: "linear-gradient(90deg, transparent, oklch(0.82 0.22 350), transparent)",
                animation: "loadbar 1.1s ease-in-out infinite",
              }}
            />
          </div>
        )}
        <style>{`@keyframes loadbar { 0%{transform:translateX(-100%);} 100%{transform:translateX(350%);} }`}</style>
      </header>

      {/* Content */}
      <main style={{ position: "relative", padding: "0 12px 24px", zIndex: 1 }}>
        {!html && !error && (
          <div
            className="fade-in"
            style={{ textAlign: "center", padding: "12vh 8px 0", color: "#fff" }}
          >
            <h1
              style={{
                fontSize: 44,
                margin: 0,
                fontWeight: 700,
                letterSpacing: -1,
                textShadow: "0 4px 24px rgba(0,0,0,0.7)",
                background: "linear-gradient(180deg, #fff, rgba(255,255,255,0.7))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Axell &amp; Sam
            </h1>
            <p
              style={{
                marginTop: 10,
                opacity: 0.85,
                fontSize: 14,
                letterSpacing: 0.3,
                textTransform: "uppercase",
              }}
            >
              Solo HTML puro
            </p>

            <div
              className="glass fade-in"
              style={{
                marginTop: 32,
                padding: 16,
                borderRadius: 22,
                maxWidth: 440,
                marginInline: "auto",
                textAlign: "left",
              }}
            >
              <p style={{ margin: 0, fontSize: 13.5, opacity: 0.92, lineHeight: 1.5 }}>
                Escribe una búsqueda o pega una URL en la barra superior. El contenido se mostrará
                sin CSS, sin scripts ni efectos visuales — únicamente la estructura HTML.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div
            className="glass fade-in"
            style={{ marginTop: 16, padding: 16, borderRadius: 18, color: "#fff" }}
          >
            <strong>Error</strong>
            <p style={{ margin: "6px 0 0", opacity: 0.9, fontSize: 14 }}>{error}</p>
          </div>
        )}

        {html && (
          <div
            className="fade-in"
            style={{
              marginTop: 12,
              borderRadius: 22,
              overflow: "hidden",
              background: "#fff",
              border: "1px solid rgba(255,255,255,0.2)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.55)",
            }}
          >
            <iframe
              title="Contenido"
              srcDoc={html}
              sandbox="allow-same-origin allow-popups"
              referrerPolicy="no-referrer"
              style={{
                width: "100%",
                height: "calc(100dvh - 220px)",
                border: "none",
                background: "#fff",
                colorScheme: "light",
                display: "block",
              }}
            />
          </div>
        )}
      </main>
    </div>
  );
}

const iconBtn: React.CSSProperties = {
  width: 36,
  height: 36,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 999,
  background: "rgba(255,255,255,0.1)",
  border: "1px solid rgba(255,255,255,0.18)",
  color: "var(--color-foreground)",
  cursor: "pointer",
  flexShrink: 0,
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15)",
};
