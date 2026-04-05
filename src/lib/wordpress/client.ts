// ─────────────────────────────────────────────────────────────
//  WPGraphQL Client — Headless WordPress for Book The Guide
// ─────────────────────────────────────────────────────────────
//
//  Connects to a WordPress instance running WPGraphQL plugin.
//  All content/SEO fetching flows through this client.
//
//  Required env vars:
//    WORDPRESS_GRAPHQL_URL  — e.g. https://cms.booktheguide.com/graphql
//    WORDPRESS_AUTH_TOKEN   — (optional) Application Password for previews
//    WORDPRESS_PREVIEW_SECRET — secret for Next.js preview mode
//    REVALIDATION_SECRET    — secret for on-demand ISR webhook
//
// ─────────────────────────────────────────────────────────────

const GRAPHQL_URL = process.env.WORDPRESS_GRAPHQL_URL || '';
const AUTH_TOKEN = process.env.WORDPRESS_AUTH_TOKEN || '';

interface GraphQLResponse<T = any> {
  data?: T;
  errors?: { message: string; locations?: any[]; path?: string[] }[];
}

/**
 * Core fetch wrapper for WPGraphQL. Runs server-side only.
 * Supports Next.js `fetch` caching via the `next` option.
 */
export async function wpQuery<T = any>(
  query: string,
  variables: Record<string, any> = {},
  options: {
    /** Next.js revalidation period in seconds (ISR). Default 300 (5 min). */
    revalidate?: number | false;
    /** Pass specific cache tags for on-demand revalidation. */
    tags?: string[];
  } = {},
): Promise<T> {
  if (!GRAPHQL_URL) {
    throw new Error(
      '[WordPress] WORDPRESS_GRAPHQL_URL is not set. Add it to your .env file.',
    );
  }

  const { revalidate = 300, tags } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Attach auth header for draft/preview content
  if (AUTH_TOKEN) {
    headers['Authorization'] = `Bearer ${AUTH_TOKEN}`;
  }

  const nextOptions: Record<string, any> = {};
  if (revalidate !== false) {
    nextOptions.revalidate = revalidate;
  }
  if (tags && tags.length > 0) {
    nextOptions.tags = tags;
  }

  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
    next: nextOptions,
  });

  if (!res.ok) {
    throw new Error(
      `[WordPress] GraphQL request failed: ${res.status} ${res.statusText}`,
    );
  }

  const json: GraphQLResponse<T> = await res.json();

  if (json.errors) {
    const messages = json.errors.map((e) => e.message).join('; ');
    console.error('[WordPress] GraphQL errors:', messages);
    throw new Error(`[WordPress] GraphQL errors: ${messages}`);
  }

  return json.data as T;
}

/**
 * Convenience wrapper that silently returns null on failure.
 * Useful for optional content that shouldn't break the page.
 */
export async function wpQuerySafe<T = any>(
  query: string,
  variables: Record<string, any> = {},
  options: { revalidate?: number | false; tags?: string[] } = {},
): Promise<T | null> {
  try {
    return await wpQuery<T>(query, variables, options);
  } catch (err) {
    console.warn('[WordPress] Query failed (safe mode):', (err as Error).message);
    return null;
  }
}
