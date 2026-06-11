import { createServerFn } from "@tanstack/react-start";

function stripHtml(html: string, baseUrl: string): string {
  let out = html;
  out = out.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "");
  out = out.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
  out = out.replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, "");
  out = out.replace(/<link\b[^>]*\/?>/gi, "");
  out = out.replace(/\sstyle\s*=\s*"(?:[^"\\]|\\.)*"/gi, "");
  out = out.replace(/\sstyle\s*=\s*'(?:[^'\\]|\\.)*'/gi, "");
  out = out.replace(/\sclass\s*=\s*"(?:[^"\\]|\\.)*"/gi, "");
  out = out.replace(/\sclass\s*=\s*'(?:[^'\\]|\\.)*'/gi, "");
  out = out.replace(/\son[a-z]+\s*=\s*"(?:[^"\\]|\\.)*"/gi, "");
  out = out.replace(/\son[a-z]+\s*=\s*'(?:[^'\\]|\\.)*'/gi, "");
  out = out.replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, "");

  try {
    const base = new URL(baseUrl);
    out = out.replace(/\s(href|src|action)\s*=\s*"([^"]*)"/gi, (_m, attr, val) => {
      try {
        if (!val || val.startsWith("javascript:") || val.startsWith("data:") || val.startsWith("#") || val.startsWith("mailto:")) {
          return ` ${attr}="${val}"`;
        }
        const abs = new URL(val, base).toString();
        return ` ${attr}="${abs}"`;
      } catch {
        return ` ${attr}="${val}"`;
      }
    });
  } catch {}

  const injection = `<base href="${baseUrl}"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">`;
  if (/<head[^>]*>/i.test(out)) {
    out = out.replace(/<head[^>]*>/i, (m) => m + injection);
  } else if (/<html[^>]*>/i.test(out)) {
    out = out.replace(/<html[^>]*>/i, (m) => `${m}<head>${injection}</head>`);
  } else {
    out = `<!doctype html><html><head>${injection}</head><body>${out}</body></html>`;
  }
  return out;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]!));
}

const USER_AGENTS = [
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  "Mozilla/5.0 (compatible; AxellSamBrowser/1.0)",
];

async function tryFetch(url: string, ua: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    return await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": ua,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

export const fetchPage = createServerFn({ method: "POST" })
  .inputValidator((input: { url: string }) => {
    if (!input || typeof input.url !== "string") throw new Error("URL inválida");
    return input;
  })
  .handler(async ({ data }) => {
    let target = data.url.trim();
    if (!/^https?:\/\//i.test(target)) target = "https://" + target;
    let parsed: URL;
    try {
      parsed = new URL(target);
    } catch {
      throw new Error("URL inválida");
    }

    let lastErr: unknown = null;
    for (const ua of USER_AGENTS) {
      try {
        const res = await tryFetch(parsed.toString(), ua);
        const contentType = (res.headers.get("content-type") || "").toLowerCase();
        const finalUrl = res.url || parsed.toString();

        // Try to read body even on non-2xx — many sites return useful HTML on 4xx/5xx
        const text = await res.text();

        if (contentType.includes("html") || contentType.includes("xml") || contentType === "" || /<html[\s>]/i.test(text)) {
          const cleaned = stripHtml(text || `<p>Respuesta vacía (HTTP ${res.status})</p>`, finalUrl);
          return { html: cleaned, finalUrl, status: res.status };
        }

        // Non-HTML: render as preformatted text
        const preview = text.length > 200000 ? text.slice(0, 200000) + "\n…(truncado)" : text;
        return {
          html: `<!doctype html><html><head><meta charset="utf-8"></head><body><p>Tipo de contenido: ${escapeHtml(contentType || "desconocido")}</p><pre>${escapeHtml(preview)}</pre></body></html>`,
          finalUrl,
          status: res.status,
        };
      } catch (e) {
        lastErr = e;
        continue;
      }
    }

    const msg = lastErr instanceof Error ? lastErr.message : "Error desconocido";
    throw new Error(`No se pudo cargar la página: ${msg}`);
  });
