import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { uploadToStorage } from '@/lib/supabase-storage';

export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/jpg',
  'application/pdf',
];

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const rawFolder = (formData.get('folder') as string) || 'documents';

    // Sanitize folder name to prevent path traversal
    const folder = rawFolder.replace(/[^a-zA-Z0-9_-]/g, '');

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, WebP, and PDF are allowed.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is 5MB. Your file is ${(file.size / (1024 * 1024)).toFixed(1)}MB.` },
        { status: 400 }
      );
    }

    const rawExt = file.name.split('.').pop() || 'pdf';
    const ext = rawExt.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4);
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const filename = `${folder}/${timestamp}-${random}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadToStorage('documents', filename, buffer, file.type);

    return NextResponse.json({ url, filename, size: file.size, type: file.type });
  } catch (error) {
    console.error('Document upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
