'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  User, Star, MapPin, Phone, Mail, Shield, CheckCircle,
  XCircle, ArrowLeft, Award, Languages, Mountain,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface GuideDetail {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  image: string | null;
  createdAt: string;
  guideProfile: {
    id: string;
    slug: string;
    bio: string | null;
    tagline: string | null;
    gender: string | null;
    experienceYears: number | null;
    totalTrips: number;
    averageRating: number;
    totalReviews: number;
    education: string | null;
    certifications: string[];
    languages: string[];
    specializations: string[];
    guideTypes: string[];
    idType: string | null;
    idNumber: string | null;
    isVerified: boolean;
    isActive: boolean;
    portfolioImages: string[];
    coverImage: string | null;
    serviceAreas: {
      state: { name: string };
      cities: { name: string }[];
    }[];
  } | null;
}

export default function GuideManagerGuideDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [guide, setGuide] = useState<GuideDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/guides/${params.id}`)
      .then(r => r.json())
      .then(data => setGuide(data.guide || data))
      .catch(() => toast.error('Failed to load guide'))
      .finally(() => setLoading(false));
  }, [params.id]);

  const toggleVerification = async () => {
    if (!guide?.guideProfile) return;
    setVerifying(true);
    try {
      const res = await fetch(`/api/admin/guides/${params.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVerified: !guide.guideProfile.isVerified }),
      });
      if (!res.ok) throw new Error();
      setGuide({
        ...guide,
        guideProfile: { ...guide.guideProfile, isVerified: !guide.guideProfile.isVerified },
      });
      toast.success(guide.guideProfile.isVerified ? 'Guide unverified' : 'Guide verified');
    } catch { toast.error('Failed to update'); }
    finally { setVerifying(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!guide || !guide.guideProfile) {
    return <div className="text-center py-20 text-gray-500">Guide not found</div>;
  }

  const profile = guide.guideProfile;

  return (
    <div className="max-w-4xl">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Guides
      </button>

      {/* Header */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {guide.image ? (
                  <img src={guide.image} alt={guide.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-indigo-600" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl font-bold text-gray-900">{guide.name}</h1>
                  {profile.isVerified ? (
                    <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1" /> Verified</Badge>
                  ) : (
                    <Badge variant="warning">Unverified</Badge>
                  )}
                </div>
                {profile.tagline && <p className="text-gray-600 text-sm italic">{profile.tagline}</p>}
                <div className="flex flex-wrap gap-3 text-sm text-gray-500 mt-2">
                  <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {guide.email}</span>
                  {guide.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {guide.phone}</span>}
                </div>
              </div>
            </div>
            <Button
              variant={profile.isVerified ? 'outline' : 'primary'}
              isLoading={verifying}
              onClick={toggleVerification}
            >
              <Shield className="w-4 h-4 mr-1" />
              {profile.isVerified ? 'Unverify' : 'Verify'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Card><CardContent className="p-4 text-center">
          <Star className="w-5 h-5 text-amber-500 mx-auto mb-1" />
          <p className="text-xl font-bold">{profile.averageRating.toFixed(1)}</p>
          <p className="text-xs text-gray-500">Rating</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <Mountain className="w-5 h-5 text-green-600 mx-auto mb-1" />
          <p className="text-xl font-bold">{profile.totalTrips}</p>
          <p className="text-xs text-gray-500">Trips</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <Star className="w-5 h-5 text-sky-600 mx-auto mb-1" />
          <p className="text-xl font-bold">{profile.totalReviews}</p>
          <p className="text-xs text-gray-500">Reviews</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <Award className="w-5 h-5 text-purple-600 mx-auto mb-1" />
          <p className="text-xl font-bold">{profile.experienceYears || 0} yr</p>
          <p className="text-xs text-gray-500">Experience</p>
        </CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Details */}
        <Card>
          <CardContent className="p-6">
            <h2 className="font-bold text-gray-900 mb-4">Profile Details</h2>
            <div className="space-y-3 text-sm">
              {profile.bio && <div><p className="text-gray-500 font-medium">Bio</p><p className="text-gray-700">{profile.bio}</p></div>}
              {profile.gender && <div className="flex justify-between"><span className="text-gray-500">Gender</span><span className="font-medium">{profile.gender}</span></div>}
              {profile.education && <div className="flex justify-between"><span className="text-gray-500">Education</span><span className="font-medium">{profile.education}</span></div>}
              {profile.idType && <div className="flex justify-between"><span className="text-gray-500">ID Type</span><span className="font-medium">{profile.idType}</span></div>}
              {profile.idNumber && <div className="flex justify-between"><span className="text-gray-500">ID Number</span><span className="font-medium">{profile.idNumber}</span></div>}
              {profile.languages.length > 0 && (
                <div><p className="text-gray-500 font-medium mb-1">Languages</p><div className="flex flex-wrap gap-1">{profile.languages.map(l => <Badge key={l} size="sm" variant="outline">{l}</Badge>)}</div></div>
              )}
              {profile.specializations.length > 0 && (
                <div><p className="text-gray-500 font-medium mb-1">Specializations</p><div className="flex flex-wrap gap-1">{profile.specializations.map(s => <Badge key={s} size="sm" variant="info">{s}</Badge>)}</div></div>
              )}
              {profile.certifications.length > 0 && (
                <div><p className="text-gray-500 font-medium mb-1">Certifications</p><div className="flex flex-wrap gap-1">{profile.certifications.map(c => <Badge key={c} size="sm" variant="success">{c}</Badge>)}</div></div>
              )}
              {profile.guideTypes.length > 0 && (
                <div><p className="text-gray-500 font-medium mb-1">Guide Types</p><div className="flex flex-wrap gap-1">{profile.guideTypes.map(t => <Badge key={t} size="sm" variant="outline">{t.replace(/_/g, ' ')}</Badge>)}</div></div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Service Areas */}
        <Card>
          <CardContent className="p-6">
            <h2 className="font-bold text-gray-900 mb-4">Service Areas</h2>
            {profile.serviceAreas.length > 0 ? (
              <div className="space-y-3">
                {profile.serviceAreas.map((area, i) => (
                  <div key={i} className="p-3 bg-gray-50 rounded-xl">
                    <p className="font-semibold text-sm flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-indigo-600" /> {area.state.name}
                    </p>
                    {area.cities.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">{area.cities.map(c => <Badge key={c.name} size="sm" variant="outline">{c.name}</Badge>)}</div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No service areas defined</p>
            )}

            {/* Portfolio */}
            {profile.portfolioImages.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold text-gray-900 mb-3">Portfolio</h3>
                <div className="grid grid-cols-3 gap-2">
                  {profile.portfolioImages.slice(0, 6).map((img, i) => (
                    <div key={i} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                      <img src={img} alt={`Portfolio image`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
