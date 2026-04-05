'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Package, Eye, Edit, Trash2, Clock, CheckCircle, XCircle, AlertTriangle, FileEdit, Search } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  durationDays: number;
  durationNights: number;
  pricePerPerson: number;
  activityType: string;
  difficultyLevel: string;
  status: string;
  coverImage: string;
  destination: {
    name: string;
    city: { name: string; state: { name: string } };
  };
  fixedDepartures: any[];
  _count: { bookings: number };
  createdAt: string;
}

const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
  DRAFT: { icon: FileEdit, color: 'text-gray-600 bg-gray-50', label: 'Draft' },
  PENDING_REVIEW: { icon: Clock, color: 'text-amber-600 bg-amber-50', label: 'Pending Review' },
  APPROVED: { icon: CheckCircle, color: 'text-green-600 bg-green-50', label: 'Approved' },
  REJECTED: { icon: XCircle, color: 'text-red-600 bg-red-50', label: 'Rejected' },
  CHANGES_REQUESTED: { icon: AlertTriangle, color: 'text-orange-600 bg-orange-50', label: 'Changes Needed' },
};

export default function GuideProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/guide/products');
      const data = await res.json();
      setProducts(data.products || []);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await fetch(`/api/guide/products/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Product deleted');
      setProducts(products.filter((p) => p.id !== id));
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete');
    }
  };

  const filteredProducts = products
    .filter((p) => filter === 'all' || p.status === filter)
    .filter((p) => !searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase()));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-btg-terracotta"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Tour Packages</h1>
          <p className="text-gray-600 mt-1">Manage your tour packages and trips</p>
        </div>
        <Link
          href="/dashboard/guide/products/new"
          className="flex items-center gap-2 bg-btg-terracotta text-white px-4 py-2 rounded-lg hover:bg-btg-terracotta transition-colors"
        >
          <Plus className="h-5 w-5" />
          Add New Package
        </Link>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search packages by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-btg-terracotta/40 focus:border-transparent"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
        {[
          { key: 'all', label: 'All' },
          { key: 'DRAFT', label: 'Drafts' },
          { key: 'APPROVED', label: 'Approved' },
          { key: 'PENDING_REVIEW', label: 'Pending' },
          { key: 'REJECTED', label: 'Rejected' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === tab.key
                ? 'bg-btg-terracotta text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab.label}
            <span className="ml-2 text-xs">
              ({tab.key === 'all'
                ? products.length
                : products.filter((p) => p.status === tab.key).length})
            </span>
          </button>
        ))}
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No packages yet</h3>
          <p className="text-gray-600 mb-6">
            Create your first tour package to start accepting bookings
          </p>
          <Link
            href="/dashboard/guide/products/new"
            className="inline-flex items-center gap-2 bg-btg-terracotta text-white px-6 py-3 rounded-lg hover:bg-btg-terracotta transition-colors"
          >
            <Plus className="h-5 w-5" />
            Create Package
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProducts.map((product) => {
            const statusInfo = statusConfig[product.status] || statusConfig.PENDING_REVIEW;
            const StatusIcon = statusInfo.icon;
            const upcomingDepartures = product.fixedDepartures.filter(
              (d: any) => new Date(d.startDate) > new Date()
            );

            return (
              <div
                key={product.id}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-6">
                  {/* Cover image */}
                  <div className="w-32 h-24 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                    {product.coverImage ? (
                      <img
                        src={product.coverImage}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">{product.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {product.destination.name} • {product.destination.city.name},{' '}
                          {product.destination.city.state.name}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}
                      >
                        <StatusIcon className="h-3.5 w-3.5" />
                        {statusInfo.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-6 mt-3 text-sm text-gray-600">
                      <span>{product.durationDays}D/{product.durationNights}N</span>
                      <span>{product.activityType.replace(/_/g, ' ')}</span>
                      <span>{product.difficultyLevel}</span>
                    </div>

                    <div className="flex items-center gap-6 mt-2 text-sm">
                      <span className="text-gray-600">
                        {product._count.bookings} bookings
                      </span>
                      <span className="text-gray-600">
                        {upcomingDepartures.length} upcoming departures
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link
                      href={`/trips/${product.slug}`}
                      className="p-2 text-gray-400 hover:text-btg-terracotta transition-colors"
                      title="View"
                    >
                      <Eye className="h-5 w-5" />
                    </Link>
                    <Link
                      href={`/dashboard/guide/products/${product.id}/edit`}
                      className="p-2 text-gray-400 hover:text-btg-terracotta transition-colors"
                      title="Edit"
                    >
                      <Edit className="h-5 w-5" />
                    </Link>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
