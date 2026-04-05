import { NextResponse } from 'next/server';
import {

export const dynamic = 'force-dynamic';
  CERTIFICATION_TYPES,
  ISSUING_AUTHORITIES,
  LANGUAGES,
  GUIDE_TYPES,
  SPECIALIZATIONS,
  DIFFICULTY_LEVELS,
  MONTHS,
  PACKAGE_CATEGORIES,
  GENDER_OPTIONS,
  ID_PROOF_TYPES,
} from '@/lib/taxonomy';

// GET /api/taxonomy â€” returns all controlled vocabularies
// No auth required â€” used by forms

export async function GET() {
  return NextResponse.json({
    certificationTypes: [...CERTIFICATION_TYPES],
    issuingAuthorities: [...ISSUING_AUTHORITIES],
    languages: [...LANGUAGES],
    guideTypes: [...GUIDE_TYPES],
    specializations: [...SPECIALIZATIONS],
    difficultyLevels: [...DIFFICULTY_LEVELS],
    months: [...MONTHS],
    packageCategories: [...PACKAGE_CATEGORIES],
    genderOptions: [...GENDER_OPTIONS],
    idProofTypes: [...ID_PROOF_TYPES],
  });
}
