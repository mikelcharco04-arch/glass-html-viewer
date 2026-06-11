import { createServerFn } from "@tanstack/react-start";

function stripHtml(html: string, baseUrl: string): string {
  let out = html;
  // Remove style blocks
  out = out.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "");
  // Remove script blocks
  out = out.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
  // Remove noscript
  out = out.replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, "");
  // Remove link tags (stylesheets, preloads, fonts, icons)
  out = out.replace(/<link\b[^>]*\/?>/gi, "");
  // Remove meta refresh / charset stays but remove others minor — keep meta charset
  // Remove inline style attributes
  out = out.replace(/\sstyle\s*=\s*"(?:[^"\\]|\\.)*"/gi, "");
  out = out.replace(/\sstyle\s*=\s*'(?:[^'\\]|\\.)*'/gi, "");
  // Remove class attributes
  out = out.replace(/\sclass\s*=\s*"(?:[^"\\]|\\.)*"/gi, "");
  out = out.replace(/\sclass\s*=\s*'(?:[^'\\]|\\.)*'/gi, "");
  // Remove event handler attrs (on*)
  out = out.replace(/\son[a-z]+\s*=\s*"(?:[^"\\]|\\.)*"/gi, "");
  out = out.replace(/\son[a-z]+\s*=\s*'(?:[^'\\]|\\.)*'/gi, "");
  // Remove iframes (they can carry styled content)
  out = out.replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, "");
  // Remove svg (often styling decoration)
  out = out.replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, "");

  // Resolve relative href/src against base
  try {
    const base = new URL(baseUrl);
    out = out.replace(/\s(href|src)\s*=\s*"([^"]*)"/gi, (_m, attr, val) => {
      try {
        if (!val || val.startsWith("javascript:") || val.startsWith("data:")) return ` ${attr}="${val}"`;
        const abs = new URL(val, base).toString();
        return ` ${attr}="${abs}"`;
      } catch {
        return ` ${attr}="${val}"`;
      }
    });
  } catch {}

  // Inject a <base> so relative links still resolve, and force no styling
  const injection = `<base href="${baseUrl}"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">`;
  if (/<head[^>]*>/i.test(out)) {
    out = out.replace(/<head[^>]*>/i, (m) => m + injection);
  } else {
    out = injection + out;
  }
  return out;
}

export const fetchPage = createServerFn({ method: "POST" })
  .inputValidator((input: { url: string }) => {
    if (!input || typeof input.url !== "string") throw new Error("URL inválida");
    return input;
  })
  .handler(async ({ data }) => {
    let target = data.url.trim();
    if (!/^https?:\/\//i.test(target)) {
      target = "https://" + target;
    }
    let parsed: URL;
    try {
      parsed = new URL(target);
    } catch {
      throw new Error("URL inválida");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch(parsed.toString(), {
        redirect: "follow",
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; AxellSamBrowser/1.0)",
          Accept: "text/html,application/xhtml+xml",
        },
      });
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("text/html") && !contentType.includes("xml")) {
        return {
          html: `<pre>${(await res.text()).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]!))}</pre>`,
          finalUrl: res.url || parsed.toString(),
          status: res.status,
        };
      }
      const html = await res.text();
      const cleaned = stripHtml(html, res.url || parsed.toString());
      return { html: cleaned, finalUrl: res.url || parsed.toString(), status: res.status };
    } finally {
      clearTimeout(timeout);
    }
  });
