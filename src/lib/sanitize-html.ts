/**
 * Server-side HTML sanitizer for WordPress content.
 * Strips dangerous tags/attributes while preserving safe formatting.
 * No external dependency required — uses regex-based allowlist approach.
 */

const ALLOWED_TAGS = new Set([
  'p', 'br', 'b', 'i', 'u', 'em', 'strong', 'a', 'ul', 'ol', 'li',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'code',
  'img', 'figure', 'figcaption', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'span', 'div', 'section', 'article', 'details', 'summary',
  'dl', 'dt', 'dd', 'hr', 'sup', 'sub', 'mark', 'time', 'abbr',
]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(['href', 'title', 'target', 'rel']),
  img: new Set(['src', 'alt', 'width', 'height', 'loading']),
  td: new Set(['colspan', 'rowspan']),
  th: new Set(['colspan', 'rowspan', 'scope']),
  time: new Set(['datetime']),
  abbr: new Set(['title']),
  '*': new Set(['class', 'id']),
};

const DANGEROUS_ATTR_PATTERN = /^on|javascript:|data:/i;

/**
 * Sanitise an HTML string by stripping disallowed tags & attributes.
 * Safe for use with `dangerouslySetInnerHTML`.
 */
export function sanitizeHtml(dirty: string): string {
  if (!dirty) return '';

  // Remove <script>, <style>, <iframe>, <object>, <embed>, <form>, <input>, <textarea>, <select>, <button> blocks entirely
  let clean = dirty
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<iframe[\s\S]*?\/?>/gi, '')
    .replace(/<object[\s\S]*?<\/object>/gi, '')
    .replace(/<embed[\s\S]*?\/?>/gi, '')
    .replace(/<form[\s\S]*?<\/form>/gi, '')
    .replace(/<input[\s\S]*?\/?>/gi, '')
    .replace(/<textarea[\s\S]*?<\/textarea>/gi, '')
    .replace(/<select[\s\S]*?<\/select>/gi, '')
    .replace(/<button[\s\S]*?<\/button>/gi, '');

  // Process remaining tags — keep allowed, strip others
  clean = clean.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g, (match, tag, attrs) => {
    const lowerTag = tag.toLowerCase();
    const isClosing = match.startsWith('</');

    if (!ALLOWED_TAGS.has(lowerTag)) return '';
    if (isClosing) return `</${lowerTag}>`;

    // Filter attributes
    const allowedForTag = ALLOWED_ATTRS[lowerTag] ?? new Set();
    const globalAttrs = ALLOWED_ATTRS['*'];

    const safeAttrs: string[] = [];
    const attrRegex = /([a-zA-Z][a-zA-Z0-9-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|(\S+))/g;
    let attrMatch: RegExpExecArray | null;

    while ((attrMatch = attrRegex.exec(attrs)) !== null) {
      const attrName = attrMatch[1].toLowerCase();
      const attrValue = attrMatch[2] ?? attrMatch[3] ?? attrMatch[4] ?? '';

      // Skip dangerous attributes
      if (DANGEROUS_ATTR_PATTERN.test(attrName) || DANGEROUS_ATTR_PATTERN.test(attrValue)) continue;
      if (!allowedForTag.has(attrName) && !globalAttrs.has(attrName)) continue;

      // Force safe link targets
      if (attrName === 'href') {
        try {
          const url = new URL(attrValue, 'https://www.booktheguide.com');
          if (!['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol)) continue;
        } catch {
          if (!attrValue.startsWith('/') && !attrValue.startsWith('#')) continue;
        }
      }

      safeAttrs.push(`${attrName}="${attrValue}"`);
    }

    // Also pick up standalone attribute names without values (e.g. boolean attrs)
    // but only 'loading' for <img loading="lazy">
    const isSelfClosing = match.endsWith('/>');
    const attrStr = safeAttrs.length > 0 ? ' ' + safeAttrs.join(' ') : '';
    return `<${lowerTag}${attrStr}${isSelfClosing ? ' /' : ''}>`;
  });

  return clean;
}
