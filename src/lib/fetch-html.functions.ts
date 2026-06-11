import { createServerFn } from "@tanstack/react-start";

/**
 * ============================================================================
 * STRIPPER ULTRA - Elimina TODO el CSS, estilos visuales, animaciones,
 * fuentes, imágenes, scripts y cualquier elemento visual de una página HTML.
 * Solo deja la estructura HTML pura, forzando blanco y negro.
 * ============================================================================
 */

function stripAllVisualElements(html: string, baseUrl: string): string {
  let out = html;
  const originalSize = new Blob([html]).size;
  const elementsRemoved: Record<string, number> = {
    stylesheets: 0, styleTags: 0, inlineStyles: 0,
    classes: 0, ids: 0, fonts: 0, animations: 0,
    scripts: 0, images: 0, iframes: 0, eventHandlers: 0,
    visualAttrs: 0,
  };

  // =====================================================================
  // 1. ELIMINAR HOJAS DE ESTILO EXTERNAS <link rel="stylesheet">
  // =====================================================================
  const stylesheetRegex = /<link[^>]*rel=["']stylesheet["'][^>]*\/?>/gi;
  const stylesheetMatches = out.match(stylesheetRegex);
  if (stylesheetMatches) {
    elementsRemoved.stylesheets = stylesheetMatches.length;
    out = out.replace(stylesheetRegex, '');
  }

  // =====================================================================
  // 2. ELIMINAR CUALQUIER <link> CON .css EN EL HREF
  // =====================================================================
  const cssLinkRegex = /<link[^>]*href=["'][^"']*\.css["'][^>]*\/?>/gi;
  const cssLinkMatches = out.match(cssLinkRegex);
  if (cssLinkMatches) {
    elementsRemoved.stylesheets += cssLinkMatches.length;
    out = out.replace(cssLinkRegex, '');
  }

  // =====================================================================
  // 3. ELIMINAR TODAS LAS ETIQUETAS <style>...</style>
  // =====================================================================
  const styleTagRegex = /<style[^>]*>[\s\S]*?<\/style>/gi;
  const styleMatches = out.match(styleTagRegex);
  if (styleMatches) {
    elementsRemoved.styleTags = styleMatches.length;
    out = out.replace(styleTagRegex, '');
  }

  // =====================================================================
  // 4. ELIMINAR ESTILOS INLINE (style="...")
  // =====================================================================
  const inlineStyleDoubleRegex = /\sstyle=["']([^"']*)["']/gi;
  const inlineDoubleMatches = out.match(inlineStyleDoubleRegex);
  if (inlineDoubleMatches) {
    elementsRemoved.inlineStyles = inlineDoubleMatches.length;
    out = out.replace(inlineStyleDoubleRegex, '');
  }

  const inlineStyleSingleRegex = /\sstyle='([^']*)'/gi;
  const inlineSingleMatches = out.match(inlineStyleSingleRegex);
  if (inlineSingleMatches) {
    elementsRemoved.inlineStyles += inlineSingleMatches.length;
    out = out.replace(inlineStyleSingleRegex, '');
  }

  // =====================================================================
  // 5. ELIMINAR CLASES (class="...")
  // =====================================================================
  const classDoubleRegex = /\sclass=["']([^"']*)["']/gi;
  const classDoubleMatches = out.match(classDoubleRegex);
  if (classDoubleMatches) {
    elementsRemoved.classes = classDoubleMatches.length;
    out = out.replace(classDoubleRegex, '');
  }

  const classSingleRegex = /\sclass='([^']*)'/gi;
  const classSingleMatches = out.match(classSingleRegex);
  if (classSingleMatches) {
    elementsRemoved.classes += classSingleMatches.length;
    out = out.replace(classSingleRegex, '');
  }

  // =====================================================================
  // 6. ELIMINAR IDs (id="...")
  // =====================================================================
  const idDoubleRegex = /\sid=["']([^"']*)["']/gi;
  const idDoubleMatches = out.match(idDoubleRegex);
  if (idDoubleMatches) {
    elementsRemoved.ids = idDoubleMatches.length;
    out = out.replace(idDoubleRegex, '');
  }

  const idSingleRegex = /\sid='([^']*)'/gi;
  const idSingleMatches = out.match(idSingleRegex);
  if (idSingleMatches) {
    elementsRemoved.ids += idSingleMatches.length;
    out = out.replace(idSingleRegex, '');
  }

  // =====================================================================
  // 7. ELIMINAR MANEJADORES DE EVENTOS (onclick, onload, etc.)
  // =====================================================================
  const eventHandlerRegex = /\son[a-z]+\s*=\s*["']([^"']*)["']/gi;
  const eventMatches = out.match(eventHandlerRegex);
  if (eventMatches) {
    elementsRemoved.eventHandlers = eventMatches.length;
    out = out.replace(eventHandlerRegex, '');
  }

  // =====================================================================
  // 8. ELIMINAR SCRIPTS
  // =====================================================================
  const scriptRegex = /<script[^>]*>[\s\S]*?<\/script>/gi;
  const scriptMatches = out.match(scriptRegex);
  if (scriptMatches) {
    elementsRemoved.scripts = scriptMatches.length;
    out = out.replace(scriptRegex, '');
  }

  // Scripts autocerrados
  const scriptSelfRegex = /<script[^>]*\/>/gi;
  const scriptSelfMatches = out.match(scriptSelfRegex);
  if (scriptSelfMatches) {
    elementsRemoved.scripts += scriptSelfMatches.length;
    out = out.replace(scriptSelfRegex, '');
  }

  // =====================================================================
  // 9. ELIMINAR IMÁGENES
  // =====================================================================
  const imgRegex = /<img[^>]*>/gi;
  const imgMatches = out.match(imgRegex);
  if (imgMatches) {
    elementsRemoved.images = imgMatches.length;
    out = out.replace(imgRegex, '');
  }

  // <picture>
  out = out.replace(/<picture[^>]*>[\s\S]*?<\/picture>/gi, '');

  // <svg>
  out = out.replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, '');

  // <canvas>
  out = out.replace(/<canvas[^>]*>[\s\S]*?<\/canvas>/gi, '');

  // srcset
  out = out.replace(/\ssrcset=["']([^"']*)["']/gi, '');

  // =====================================================================
  // 10. ELIMINAR IFRAMES Y EMBEDS
  // =====================================================================
  out = out.replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '');
  out = out.replace(/<embed[^>]*>/gi, '');
  out = out.replace(/<object[^>]*>[\s\S]*?<\/object>/gi, '');
  out = out.replace(/<video[^>]*>[\s\S]*?<\/video>/gi, '');
  out = out.replace(/<audio[^>]*>[\s\S]*?<\/audio>/gi, '');

  // =====================================================================
  // 11. ELIMINAR FUENTES PERSONALIZADAS
  // =====================================================================
  // @font-face
  const fontFaceRegex = /@font-face\s*\{[^}]*\}/gi;
  const fontFaceMatches = out.match(fontFaceRegex);
  if (fontFaceMatches) {
    elementsRemoved.fonts = fontFaceMatches.length;
    out = out.replace(fontFaceRegex, '');
  }

  // Google Fonts
  out = out.replace(/<link[^>]*href=["'][^"']*fonts\.googleapis\.com[^"']*["'][^>]*\/?>/gi, '');

  // Font links (woff, woff2, ttf, otf, eot)
  const fontLinkRegex = /<link[^>]*href=["'][^"']*\.(woff|woff2|ttf|otf|eot)["'][^>]*\/?>/gi;
  out = out.replace(fontLinkRegex, '');

  // =====================================================================
  // 12. ELIMINAR ANIMACIONES CSS (@keyframes)
  // =====================================================================
  const keyframesRegex = /@keyframes\s+[a-zA-Z0-9_-]+\s*\{[\s\S]*?\}/gi;
  const keyframesMatches = out.match(keyframesRegex);
  if (keyframesMatches) {
    elementsRemoved.animations = keyframesMatches.length;
    out = out.replace(keyframesRegex, '');
  }

  // =====================================================================
  // 13. ELIMINAR ATRIBUTOS VISUALES
  // =====================================================================
  const visualAttrs = ['align', 'valign', 'bgcolor', 'color', 'border',
    'cellpadding', 'cellspacing', 'background', 'width', 'height'];
  for (const attr of visualAttrs) {
    const regex = new RegExp(`\\s${attr}=["']([^"']*)["']`, 'gi');
    const matches = out.match(regex);
    if (matches) {
      elementsRemoved.visualAttrs += matches.length;
      out = out.replace(regex, '');
    }
  }

  // =====================================================================
  // 14. ELIMINAR NOSCRIPT
  // =====================================================================
  out = out.replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '');

  // =====================================================================
  // 15. RESOLVER URLs RELATIVAS A ABSOLUTAS
  // =====================================================================
  try {
    const base = new URL(baseUrl);
    out = out.replace(/\s(href|src|action)\s*=\s*"([^"]*)"/gi, (_m: string, attr: string, val: string) => {
      try {
        if (!val || val.startsWith("javascript:") || val.startsWith("data:") ||
            val.startsWith("#") || val.startsWith("mailto:") || val.startsWith("tel:")) {
          return ` ${attr}="${val}"`;
        }
        const abs = new URL(val, base).toString();
        return ` ${attr}="${abs}"`;
      } catch {
        return ` ${attr}="${val}"`;
      }
    });
  } catch {
    // Si baseUrl es inválida, ignorar
  }

  // =====================================================================
  // 16. INYECTAR CSS MÍNIMO EN BLANCO Y NEGRO
  // =====================================================================
  const minimalCSS = `
    <style id="__axell_sam_stripper">
      /* ================================================
         RESET COMPLETO - Anula TODO estilo externo
         ================================================ */
      *, *::before, *::after {
        all: revert !important;
        box-sizing: border-box !important;
      }

      /* ================================================
         BLOQUEO TOTAL DE ANIMACIONES Y TRANSICIONES
         ================================================ */
      *, *::before, *::after {
        animation: none !important;
        animation-delay: 0s !important;
        animation-duration: 0s !important;
        transition: none !important;
        transition-delay: 0s !important;
        transition-duration: 0s !important;
        transform: none !important;
      }

      /* ================================================
         FORZAR BLANCO Y NEGRO
         ================================================ */
      html {
        background: #ffffff !important;
      }

      body {
        background: #ffffff !important;
        color: #000000 !important;
        font-family: -apple-system, "Helvetica Neue", Arial, sans-serif !important;
        font-size: 16px !important;
        line-height: 1.5 !important;
        margin: 0 auto !important;
        padding: 12px !important;
        max-width: 800px !important;
        width: 100% !important;
        min-height: 100vh !important;
        -webkit-text-size-adjust: 100% !important;
        text-size-adjust: 100% !important;
        overflow-x: hidden !important;
        word-wrap: break-word !important;
      }

      /* Forzar blanco en todos los fondos */
      div, section, article, header, footer, nav, aside, main,
      span, p, h1, h2, h3, h4, h5, h6, a, li, td, th {
        background: transparent !important;
        color: inherit !important;
      }

      /* ================================================
         HEADINGS
         ================================================ */
      h1 { font-size: 1.5em !important; font-weight: bold !important; margin: 0.67em 0 !important; }
      h2 { font-size: 1.3em !important; font-weight: bold !important; margin: 0.5em 0 !important; }
      h3 { font-size: 1.17em !important; font-weight: bold !important; margin: 0.5em 0 !important; }
      h4 { font-size: 1em !important; font-weight: bold !important; margin: 0.5em 0 !important; }
      h5 { font-size: 0.83em !important; font-weight: bold !important; margin: 0.5em 0 !important; }
      h6 { font-size: 0.67em !important; font-weight: bold !important; margin: 0.5em 0 !important; }

      /* ================================================
         ENLACES
         ================================================ */
      a { color: #0000EE !important; text-decoration: underline !important; cursor: pointer !important; }
      a:visited { color: #551A8B !important; }
      a:hover { text-decoration: underline !important; }

      /* ================================================
         PÁRRAFOS Y TEXTO
         ================================================ */
      p { margin: 0.5em 0 !important; display: block !important; }
      strong, b { font-weight: bold !important; }
      em, i { font-style: italic !important; }
      u { text-decoration: underline !important; }
      s, strike, del { text-decoration: line-through !important; }

      /* ================================================
         LISTAS
         ================================================ */
      ul, ol { padding-left: 25px !important; margin: 0.5em 0 !important; display: block !important; }
      li { display: list-item !important; margin: 0.2em 0 !important; }
      ul li { list-style-type: disc !important; }
      ol li { list-style-type: decimal !important; }

      /* ================================================
         TABLAS
         ================================================ */
      table {
        border-collapse: collapse !important;
        width: 100% !important;
        margin: 0.5em 0 !important;
        display: table !important;
      }
      td, th {
        border: 1px solid #888 !important;
        padding: 4px 8px !important;
        text-align: left !important;
        vertical-align: top !important;
        display: table-cell !important;
      }
      th { font-weight: bold !important; background: #f0f0f0 !important; }
      tr { display: table-row !important; }

      /* ================================================
         CÓDIGO
         ================================================ */
      pre, code {
        font-family: "Courier New", monospace !important;
        background: #f5f5f5 !important;
        padding: 2px 4px !important;
        border-radius: 2px !important;
        font-size: 0.9em !important;
      }
      pre {
        display: block !important;
        padding: 8px !important;
        overflow-x: auto !important;
        white-space: pre-wrap !important;
      }

      /* ================================================
         FORMULARIOS
         ================================================ */
      input, textarea, select, button {
        border: 1px solid #888 !important;
        padding: 4px 8px !important;
        background: #fff !important;
        color: #000 !important;
        font-family: inherit !important;
        font-size: inherit !important;
        display: inline-block !important;
      }
      button { cursor: pointer !important; }
      input[type="checkbox"],
      input[type="radio"] {
        width: auto !important;
        display: inline !important;
      }

      /* ================================================
         CITAS
         ================================================ */
      blockquote {
        border-left: 3px solid #888 !important;
        padding-left: 10px !important;
        margin: 0.5em 0 !important;
        display: block !important;
      }
      hr {
        border: none !important;
        border-top: 1px solid #888 !important;
        margin: 1em 0 !important;
      }

      /* ================================================
         IMÁGENES (ocultas por si alguna sobrevive)
         ================================================ */
      img, svg, canvas, picture, video, audio, iframe, embed, object {
        display: none !important;
        width: 0 !important;
        height: 0 !important;
        position: absolute !important;
        opacity: 0 !important;
        pointer-events: none !important;
      }

      /* ================================================
         MISCELÁNEO
         ================================================ */
      details, summary { display: block !important; }
      details { margin: 0.5em 0 !important; }
      summary { font-weight: bold !important; cursor: pointer !important; }

      abbr, acronym { cursor: help !important; }
      sub { vertical-align: sub !important; font-size: smaller !important; }
      sup { vertical-align: super !important; font-size: smaller !important; }

      /* Ocultar elementos decorativos */
      [aria-hidden="true"] { display: none !important; }
    </style>
  `;

  // =====================================================================
  // 17. INYECTAR NUESTRO CSS EN EL <head>
  // =====================================================================
  if (/<head[^>]*>/i.test(out)) {
    out = out.replace(/<head[^>]*>/i, (match: string) => match + minimalCSS);
  } else if (/<html[^>]*>/i.test(out)) {
    out = out.replace(/<html[^>]*>/i, (match: string) =>
      `${match}<head>${minimalCSS}</head>`);
  } else {
    out = `<!DOCTYPE html><html><head>${minimalCSS}</head><body>${out}</body></html>`;
  }

  // =====================================================================
  // 18. ELIMINAR META VIEWPORT (lo reemplazamos)
  // =====================================================================
  out = out.replace(/<meta[^>]*name=["']viewport["'][^>]*\/?>/gi, '');
  out = out.replace(/<meta[^>]*name=['"]viewport['"][^>]*\/?>/gi, '');

  // Añadir nuestro viewport
  const viewportMeta = '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">';
  out = out.replace(/<head[^>]*>/i, (match: string) => match + viewportMeta);

  // =====================================================================
  // 19. ELIMINAR CUALQUIER Rastro DE ATRIBUTOS data-*
  // =====================================================================
  out = out.replace(/\sdata-[a-zA-Z0-9_-]+=["']([^"']*)["']/gi, '');
  out = out.replace(/\sng-[a-zA-Z0-9_-]+=["']([^"']*)["']/gi, '');
  out = out.replace(/\sv-[a-zA-Z0-9_-]+=["']([^"']*)["']/gi, '');

  const finalSize = new Blob([out]).size;
  const removedBytes = originalSize - finalSize;

  return out;
}

/**
 * Escapa HTML para mostrar como texto preformateado
 */
function escapeHtml(s: string): string {
  return s.replace(/[&<>]/g, (c: string) => {
    switch (c) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      default: return c;
    }
  });
}

/**
 * Lista de User-Agents para rotar
 */
const USER_AGENTS = [
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (compatible; AxellSamBrowser/1.0)",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
];

/**
 * Intenta hacer fetch con timeout
 */
async function tryFetch(url: string, ua: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  try {
    return await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": ua,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * ============================================================================
 * SERVER FUNCTION PRINCIPAL - fetchPage
 * Recibe una URL, descarga la página, elimina TODO el CSS y
 * devuelve solo el HTML puro en blanco y negro.
 * ============================================================================
 */
export const fetchPage = createServerFn({ method: "POST" })
  .inputValidator((input: { url: string }) => {
    if (!input || typeof input.url !== "string") throw new Error("URL invalida");
    if (!input.url.trim()) throw new Error("URL vacia");
    return input;
  })
  .handler(async ({ data }) => {
    let target = data.url.trim();

    // Añadir https:// si no tiene protocolo
    if (!/^https?:\/\//i.test(target)) {
      target = "https://" + target;
    }

    // Validar URL
    let parsed: URL;
    try {
      parsed = new URL(target);
    } catch {
      throw new Error("URL invalida: no se pudo interpretar la direccion");
    }

    if (!parsed.hostname.includes('.')) {
      throw new Error("URL invalida: dominio no reconocido");
    }

    let lastErr: unknown = null;

    // Intentar con cada User-Agent
    for (const ua of USER_AGENTS) {
      try {
        const res = await tryFetch(parsed.toString(), ua);
        const contentType = (res.headers.get("content-type") || "").toLowerCase();
        const finalUrl = res.url || parsed.toString();

        // Leer body
        const text = await res.text();

        // Verificar si es HTML
        if (contentType.includes("html") || contentType.includes("xml") ||
            contentType === "" || /<html|<body|<div|<p|<a[ >]/i.test(text)) {

          // APLICAR STRIP COMPLETO - eliminar TODO el CSS
          const cleaned = stripAllVisualElements(
            text || `<p>Respuesta vacia (HTTP ${res.status})</p>`,
            finalUrl
          );

          return {
            html: cleaned,
            finalUrl,
            status: res.status,
          };
        }

        // No es HTML - mostrar como texto plano
        const preview = text.length > 200000
          ? text.slice(0, 200000) + "\n\n[... contenido truncado, el archivo es demasiado grande]"
          : text;

        return {
          html: `<p>Tipo de contenido: ${escapeHtml(contentType || "desconocido")}</p><hr><pre>${escapeHtml(preview)}</pre>`,
          finalUrl,
          status: res.status,
        };
      } catch (e) {
        lastErr = e;
        continue;
      }
    }

    // Todos los intentos fallaron
    const msg = lastErr instanceof Error ? lastErr.message : "Error desconocido";
    throw new Error(`No se pudo cargar la pagina: ${msg}`);
  });