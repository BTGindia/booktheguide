// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//  WordPress Preview Mode â€” Draft content preview
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//
//  When editors click "Preview" in WordPress, they're redirected
//  here with a secret + slug. Next.js enters draft mode so the
//  WPGraphQL queries can fetch unpublished content.
//
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

import { NextRequest, NextResponse } from 'next/server';
import { draftMode } from 'next/headers';

export const dynamic = 'force-dynamic';

const PREVIEW_SECRET = process.env.WORDPRESS_PREVIEW_SECRET || '';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  const slug = searchParams.get('slug');
  const type = searchParams.get('type') || 'post';

  // Validate the secret
  if (!PREVIEW_SECRET || secret !== PREVIEW_SECRET) {
    return NextResponse.json({ message: 'Invalid preview secret' }, { status: 401 });
  }

  if (!slug) {
    return NextResponse.json({ message: 'Missing slug parameter' }, { status: 400 });
  }

  // Enable draft mode
  draftMode().enable();

  // Determine redirect path based on post type
  let redirectPath = '/';
  switch (type) {
    case 'post':
      redirectPath = `/blog/${slug}`;
      break;
    case 'page':
      redirectPath = `/${slug}`;
      break;
    case 'state_hub':
      redirectPath = `/explore/${slug}`;
      break;
    case 'category_landing':
      redirectPath = `/experiences/${slug}`;
      break;
    default:
      redirectPath = `/blog/${slug}`;
  }

  return NextResponse.redirect(new URL(redirectPath, request.url));
}
