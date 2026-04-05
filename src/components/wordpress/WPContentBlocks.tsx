// ─────────────────────────────────────────────────────────────
//  WordPress Content Components
// ─────────────────────────────────────────────────────────────
//
//  Reusable React server components that render WordPress
//  content blocks inside Next.js pages. These overlay WP
//  editorial content on top of existing DB-driven pages.
//
// ─────────────────────────────────────────────────────────────

import Link from 'next/link';
import type { WPFaqItem, WPInternalLink, WPPageSection } from '@/lib/wordpress/types';
import { buildFaqSchema } from '@/lib/wordpress/seo';
import { sanitizeHtml } from '@/lib/sanitize-html';

/* ── FAQ Section (renders + injects FAQPage schema) ── */

export function WPFaqSection({
  faqs,
  heading = 'Frequently Asked Questions',
}: {
  faqs: WPFaqItem[] | null | undefined;
  heading?: string;
}) {
  if (!faqs || faqs.length === 0) return null;

  const faqSchema = buildFaqSchema(faqs);

  return (
    <section className="max-w-7xl mx-auto px-6 lg:px-16 py-12">
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      <h2 className="font-heading text-2xl md:text-3xl font-bold text-btg-dark mb-8">
        {heading}
      </h2>
      <div className="space-y-4 max-w-3xl">
        {faqs.map((faq, i) => (
          <details
            key={i}
            className="group bg-white rounded-xl border border-btg-sand overflow-hidden"
          >
            <summary className="flex items-center justify-between cursor-pointer px-6 py-4 font-heading font-semibold text-btg-dark hover:text-btg-primary transition-colors">
              <span>{faq.question}</span>
              <svg
                className="w-5 h-5 text-btg-light-text group-open:rotate-180 transition-transform flex-shrink-0 ml-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="px-6 pb-5 text-sm text-btg-light-text font-body leading-relaxed">
              <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(faq.answer) }} />
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

/* ── SEO Content Block (long-form editorial for keyword coverage) ── */

export function WPSeoContentBlock({
  content,
  heading,
}: {
  content: string | null | undefined;
  heading?: string;
}) {
  if (!content) return null;

  return (
    <section className="max-w-7xl mx-auto px-6 lg:px-16 py-12">
      {heading && (
        <h2 className="font-heading text-2xl md:text-3xl font-bold text-btg-dark mb-6">
          {heading}
        </h2>
      )}
      <div
        className="prose prose-btg max-w-none font-body text-btg-light-text
                   prose-headings:font-heading prose-headings:text-btg-dark
                   prose-a:text-btg-primary prose-a:no-underline hover:prose-a:underline
                   prose-img:rounded-xl prose-img:shadow-md"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
      />
    </section>
  );
}

/* ── Internal Links Grid (SEO interlinking managed from WP) ── */

export function WPInternalLinksGrid({
  links,
  heading = 'Related Pages',
}: {
  links: WPInternalLink[] | null | undefined;
  heading?: string;
}) {
  if (!links || links.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-6 lg:px-16 py-10">
      <h2 className="font-heading text-xl font-bold text-btg-dark mb-6">{heading}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {links.map((link, i) => (
          <Link
            key={i}
            href={link.url}
            className="group block bg-white rounded-xl p-5 border border-btg-sand hover:border-btg-primary hover:shadow-md transition-all"
          >
            <h3 className="font-heading text-sm font-semibold text-btg-dark group-hover:text-btg-primary transition-colors mb-1">
              {link.label}
            </h3>
            {link.description && (
              <p className="text-xs text-btg-light-text font-body line-clamp-2">
                {link.description}
              </p>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ── Page Sections (for utility pages like About, Terms) ── */

export function WPPageSections({
  sections,
}: {
  sections: WPPageSection[] | null | undefined;
}) {
  if (!sections || sections.length === 0) return null;

  return (
    <>
      {sections.map((section, i) => (
        <section key={i} className="max-w-7xl mx-auto px-6 lg:px-16 py-10">
          <div className={`grid grid-cols-1 ${section.image ? 'lg:grid-cols-2 gap-10 items-center' : ''}`}>
            <div>
              <h2 className="font-heading text-2xl md:text-3xl font-bold text-btg-dark mb-4">
                {section.heading}
              </h2>
              <div
                className="prose prose-btg max-w-none font-body text-btg-light-text
                           prose-headings:font-heading prose-headings:text-btg-dark
                           prose-a:text-btg-primary"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(section.body) }}
              />
            </div>
            {section.image && (
              <div className="rounded-2xl overflow-hidden shadow-md">
                <img
                  src={section.image.sourceUrl}
                  alt={section.image.altText || section.heading}
                  className="w-full h-auto object-cover"
                  loading="lazy"
                />
              </div>
            )}
          </div>
        </section>
      ))}
    </>
  );
}

/* ── WordPress HTML Content Renderer ── */

export function WPContent({
  html,
  className = '',
}: {
  html: string | null | undefined;
  className?: string;
}) {
  if (!html) return null;

  return (
    <div
      className={`prose prose-btg max-w-none font-body text-btg-light-text
                  prose-headings:font-heading prose-headings:text-btg-dark
                  prose-a:text-btg-primary prose-a:no-underline hover:prose-a:underline
                  prose-img:rounded-xl prose-img:shadow-md
                  prose-blockquote:border-btg-primary prose-blockquote:bg-btg-primary/5 prose-blockquote:rounded-r-xl
                  ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
    />
  );
}
