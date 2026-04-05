'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Users,
  Search,
  Star,
  CheckCircle,
  XCircle,
  MapPin,
  Calendar,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Eye,
  Filter,
  Edit3,
  X,
  Save,
  Loader2,
  Activity,
  TrendingUp,
  Shield,
  UserCheck,
  MessageCircle,
  Award,
  Lightbulb,
  RefreshCw,
} from 'lucide-react';

interface Guide {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string | null;
  slug: string;
  bio: string | null;
  address: string | null;
  baseLocation: string;
  isVerified: boolean;
  isActive: boolean;
  averageRating: number;
  totalReviews: number;
  totalPackages: number;
  approvedPackages: number;
  approvedDepartures: number;
  completedTrips: number;
  totalTrips: number;
  experienceYears: number | null;
  languages: string[];
  specializations: string[];
  certifications: string[];
  guideScore: number;
  joinedOn: string;
  createdAt: string;
}

interface ScoreTip {
  dimension: string;
  score: number;
  maxScore: number;
  percentage: number;
  tips: string[];
}

interface ScorePopupData {
  guideName: string;
  guideId: string;
  score: number;
  breakdown: Record<string, number>;
  tips: ScoreTip[];
  updatedAt: string;
}

type SortField = 'name' | 'averageRating' | 'totalPackages' | 'approvedPackages' | 'approvedDepartures' | 'completedTrips' | 'guideScore' | 'joinedOn';
type SortOrder = 'asc' | 'desc';
type StatusFilter = 'ALL' | 'VERIFIED' | 'PENDING' | 'INACTIVE';

export default function SuperAdminGuidesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [sortField, setSortField] = useState<SortField>('joinedOn');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Edit modal state
  const [editGuide, setEditGuide] = useState<Guide | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    isVerified: false,
    isActive: true,
    averageRating: 0,
    bio: '',
    address: '',
    experienceYears: 0,
  });
  const [editSaving, setEditSaving] = useState(false);

  // Score popup state
  const [scorePopup, setScorePopup] = useState<ScorePopupData | null>(null);
  const [scorePopupLoading, setScorePopupLoading] = useState(false);
  const [bulkRecalculating, setBulkRecalculating] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session && (session.user as any).role !== 'SUPER_ADMIN') {
      router.push('/dashboard');
    }
  }, [session, status, router]);

  useEffect(() => {
    if (session && (session.user as any).role === 'SUPER_ADMIN') {
      fetchGuides();
    }
  }, [session]);

  const fetchGuides = async () => {
    try {
      const res = await fetch('/api/super-admin/guides');
      if (res.ok) {
        const data = await res.json();
        setGuides(data.guides);
      }
    } catch (error) {
      console.error('Error fetching guides:', error);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (guide: Guide) => {
    setEditGuide(guide);
    setEditForm({
      name: guide.name,
      isVerified: guide.isVerified,
      isActive: guide.isActive,
      averageRating: guide.averageRating,
      bio: guide.bio || '',
      address: guide.address || '',
      experienceYears: guide.experienceYears || 0,
    });
  };

  const handleSaveEdit = async () => {
    if (!editGuide) return;
    setEditSaving(true);
    try {
      const res = await fetch('/api/super-admin/guides', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guideId: editGuide.id,
          name: editForm.name,
          isVerified: editForm.isVerified,
          isActive: editForm.isActive,
          averageRating: editForm.averageRating,
          bio: editForm.bio,
          address: editForm.address,
          experienceYears: editForm.experienceYears,
        }),
      });
      if (res.ok) {
        // Update local state
        setGuides((prev) =>
          prev.map((g) =>
            g.id === editGuide.id
              ? {
                  ...g,
                  name: editForm.name,
                  isVerified: editForm.isVerified,
                  isActive: editForm.isActive,
                  averageRating: editForm.averageRating,
                  bio: editForm.bio,
                  address: editForm.address,
                  experienceYears: editForm.experienceYears,
                }
              : g
          )
        );
        setEditGuide(null);
      }
    } catch (error) {
      console.error('Error updating guide:', error);
    } finally {
      setEditSaving(false);
    }
  };

  const openScorePopup = async (guideId: string) => {
    setScorePopupLoading(true);
    try {
      const res = await fetch(`/api/guide/score?guideId=${guideId}`);
      if (res.ok) {
        const data = await res.json();
        setScorePopup(data);
      }
    } catch (error) {
      console.error('Error fetching score:', error);
    } finally {
      setScorePopupLoading(false);
    }
  };

  const handleBulkRecalculate = async () => {
    setBulkRecalculating(true);
    try {
      const res = await fetch('/api/guide/score/recalculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        await fetchGuides();
      }
    } catch (error) {
      console.error('Bulk recalculation error:', error);
    } finally {
      setBulkRecalculating(false);
    }
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-blue-100 text-blue-800';
    if (score >= 40) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getScoreBarColor = (pct: number) => {
    if (pct >= 80) return 'bg-green-500';
    if (pct >= 60) return 'bg-blue-500';
    if (pct >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 ml-1 text-gray-400" />;
    return sortOrder === 'asc' 
      ? <ChevronUp className="h-4 w-4 ml-1 text-blue-600" />
      : <ChevronDown className="h-4 w-4 ml-1 text-blue-600" />;
  };

  const filteredGuides = guides
    .filter((guide) => {
      // Search filter
      const matchesSearch = 
        guide.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        guide.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        guide.baseLocation.toLowerCase().includes(searchQuery.toLowerCase());

      // Status filter
      let matchesStatus = true;
      if (statusFilter === 'VERIFIED') {
        matchesStatus = guide.isVerified && guide.isActive;
      } else if (statusFilter === 'PENDING') {
        matchesStatus = !guide.isVerified;
      } else if (statusFilter === 'INACTIVE') {
        matchesStatus = !guide.isActive;
      }

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === 'joinedOn') {
        aValue = new Date(a.joinedOn).getTime();
        bValue = new Date(b.joinedOn).getTime();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const statusCounts = {
    all: guides.length,
    verified: guides.filter((g) => g.isVerified && g.isActive).length,
    pending: guides.filter((g) => !g.isVerified).length,
    inactive: guides.filter((g) => !g.isActive).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="h-7 w-7" />
          Guides Management
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={handleBulkRecalculate}
            disabled={bulkRecalculating}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${bulkRecalculating ? 'animate-spin' : ''}`} />
            {bulkRecalculating ? 'Recalculating...' : 'Recalculate All Scores'}
          </button>
          <div className="text-sm text-gray-500">
            Total: {guides.length} guides
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by name, email, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Status Filter Buttons */}
          <div className="flex gap-2 items-center">
            <Filter className="h-4 w-4 text-gray-500" />
            <div className="flex gap-1">
              <Button
                variant={statusFilter === 'ALL' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('ALL')}
              >
                All ({statusCounts.all})
              </Button>
              <Button
                variant={statusFilter === 'VERIFIED' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('VERIFIED')}
              >
                Verified ({statusCounts.verified})
              </Button>
              <Button
                variant={statusFilter === 'PENDING' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('PENDING')}
              >
                Pending ({statusCounts.pending})
              </Button>
              <Button
                variant={statusFilter === 'INACTIVE' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('INACTIVE')}
              >
                Inactive ({statusCounts.inactive})
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    className="flex items-center hover:text-gray-700"
                    onClick={() => handleSort('name')}
                  >
                    Guide Name
                    <SortIcon field="name" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Base Location
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    className="flex items-center hover:text-gray-700"
                    onClick={() => handleSort('averageRating')}
                  >
                    Avg. Rating
                    <SortIcon field="averageRating" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    className="flex items-center hover:text-gray-700"
                    onClick={() => handleSort('totalPackages')}
                  >
                    Total Packages
                    <SortIcon field="totalPackages" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    className="flex items-center hover:text-gray-700"
                    onClick={() => handleSort('approvedPackages')}
                  >
                    Approved Packages
                    <SortIcon field="approvedPackages" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    className="flex items-center hover:text-gray-700"
                    onClick={() => handleSort('approvedDepartures')}
                  >
                    Approved Departures
                    <SortIcon field="approvedDepartures" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    className="flex items-center hover:text-gray-700"
                    onClick={() => handleSort('completedTrips')}
                  >
                    Completed Trips
                    <SortIcon field="completedTrips" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    className="flex items-center hover:text-gray-700"
                    onClick={() => handleSort('joinedOn')}
                  >
                    Joined On
                    <SortIcon field="joinedOn" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    className="flex items-center hover:text-gray-700"
                    onClick={() => handleSort('guideScore')}
                  >
                    Health Score
                    <SortIcon field="guideScore" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredGuides.map((guide) => (
                <tr key={guide.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900">{guide.name}</span>
                      <span className="text-sm text-gray-500">{guide.email}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                      {guide.baseLocation}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      {guide.isVerified ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                          <XCircle className="h-3 w-3 mr-1" />
                          Pending
                        </span>
                      )}
                      {!guide.isActive && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                          Inactive
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 mr-1" />
                      <span className="font-medium">{guide.averageRating.toFixed(1)}</span>
                      <span className="text-gray-400 text-sm ml-1">({guide.totalReviews})</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {guide.totalPackages}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      {guide.approvedPackages}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                      {guide.approvedDepartures}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                      {guide.completedTrips}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                      {new Date(guide.joinedOn).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-center">
                    <button
                      onClick={() => openScorePopup(guide.id)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-semibold cursor-pointer hover:opacity-80 transition-opacity ${getScoreBadgeColor(guide.guideScore)}`}
                      title="Click to view score breakdown"
                    >
                      <Activity className="h-3.5 w-3.5" />
                      {guide.guideScore.toFixed(1)}
                    </button>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="flex items-center gap-1" onClick={() => openEditModal(guide)}>
                        <Edit3 className="h-4 w-4" />
                        Edit
                      </Button>
                      <Link href={`/guides/${guide.slug}`} target="_blank">
                        <Button variant="outline" size="sm" className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredGuides.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-gray-500">
                    No guides found matching your criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{guides.length}</div>
          <div className="text-sm text-gray-500">Total Guides</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{statusCounts.verified}</div>
          <div className="text-sm text-gray-500">Verified & Active</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">{statusCounts.pending}</div>
          <div className="text-sm text-gray-500">Pending Verification</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-gray-600">
            {guides.reduce((sum, g) => sum + g.completedTrips, 0)}
          </div>
          <div className="text-sm text-gray-500">Total Completed Trips</div>
        </Card>
      </div>

      {/* Edit Guide Modal */}
      {editGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Edit Guide Profile</h2>
              <button onClick={() => setEditGuide(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              {/* Read-only info */}
              <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">Email:</span> <span className="font-medium">{editGuide.email}</span></div>
                <div><span className="text-gray-500">Slug:</span> <span className="font-medium">{editGuide.slug}</span></div>
                <div><span className="text-gray-500">Total Packages:</span> <span className="font-medium">{editGuide.totalPackages}</span></div>
                <div><span className="text-gray-500">Approved Packages:</span> <span className="font-medium">{editGuide.approvedPackages}</span></div>
                <div><span className="text-gray-500">Approved Departures:</span> <span className="font-medium">{editGuide.approvedDepartures}</span></div>
                <div><span className="text-gray-500">Completed Trips:</span> <span className="font-medium">{editGuide.completedTrips}</span></div>
                <div><span className="text-gray-500">Joined On:</span> <span className="font-medium">{new Date(editGuide.joinedOn).toLocaleDateString('en-IN')}</span></div>
                <div><span className="text-gray-500">Base Location:</span> <span className="font-medium">{editGuide.baseLocation}</span></div>
              </div>

              {/* Editable fields */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Guide Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/40"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/40"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Average Rating (0-5)</label>
                  <input
                    type="number"
                    min={0}
                    max={5}
                    step={0.1}
                    value={editForm.averageRating}
                    onChange={(e) => setEditForm({ ...editForm, averageRating: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Experience (years)</label>
                  <input
                    type="number"
                    min={0}
                    value={editForm.experienceYears}
                    onChange={(e) => setEditForm({ ...editForm, experienceYears: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={editForm.isVerified}
                        onChange={(e) => setEditForm({ ...editForm, isVerified: e.target.checked })}
                        className="rounded border-gray-300"
                      />
                      Verified
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={editForm.isActive}
                        onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                        className="rounded border-gray-300"
                      />
                      Active
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-gray-100">
              <Button variant="outline" onClick={() => setEditGuide(null)}>Cancel</Button>
              <Button variant="primary" onClick={handleSaveEdit} disabled={editSaving}>
                {editSaving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Guide Health Score Popup */}
      {(scorePopup || scorePopupLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto mx-4">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-600" />
                <h2 className="text-lg font-bold text-gray-900">Guide Health Report</h2>
              </div>
              <button onClick={() => { setScorePopup(null); }} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            {scorePopupLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
              </div>
            ) : scorePopup && (
              <div className="p-5 space-y-5">
                {/* Guide name + overall score */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Guide</p>
                    <p className="font-semibold text-gray-900">{scorePopup.guideName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Overall Score</p>
                    <p className={`text-3xl font-bold ${scorePopup.score >= 80 ? 'text-green-600' : scorePopup.score >= 60 ? 'text-blue-600' : scorePopup.score >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {scorePopup.score}
                      <span className="text-sm font-normal text-gray-400">/100</span>
                    </p>
                  </div>
                </div>

                {/* Dimension breakdown */}
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-gray-700">Score Breakdown</p>
                  {scorePopup.tips.map((tip) => (
                    <div key={tip.dimension} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">{tip.dimension}</span>
                        <span className="font-medium text-gray-900">{tip.score}/{tip.maxScore}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${getScoreBarColor(tip.percentage)}`}
                          style={{ width: `${tip.percentage}%` }}
                        />
                      </div>
                      {tip.tips.length > 0 && (
                        <ul className="ml-1 space-y-0.5">
                          {tip.tips.map((t, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-xs text-gray-500">
                              <Lightbulb className="w-3 h-3 text-yellow-500 flex-shrink-0 mt-0.5" />
                              {t}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>

                {/* Action items summary */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Key Action Items</p>
                  <ul className="space-y-1.5">
                    {scorePopup.tips
                      .filter(t => t.percentage < 70)
                      .sort((a, b) => a.percentage - b.percentage)
                      .slice(0, 3)
                      .map((tip, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                          <span className={`inline-block w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 ${getScoreBarColor(tip.percentage)}`}>
                            {i + 1}
                          </span>
                          <span><strong>{tip.dimension}</strong> ({tip.percentage}%) — {tip.tips[0] || 'Needs improvement'}</span>
                        </li>
                      ))}
                    {scorePopup.tips.filter(t => t.percentage < 70).length === 0 && (
                      <li className="text-xs text-green-600 font-medium">All dimensions are performing well!</li>
                    )}
                  </ul>
                </div>

                <p className="text-[10px] text-gray-400 text-right">
                  Updated: {new Date(scorePopup.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
