'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, Clock, CheckCircle, XCircle, Search } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Product {
  id: string;
  title: string;
  status: string;
  activityType: string;
  durationDays: number;
  createdAt: string;
  guide: {
    user: { name: string };
  };
  destination: {
    name: string;
    city: { name: string; state: { name: string } };
  };
}

const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
  PENDING_REVIEW: { icon: Clock, color: 'text-amber-600 bg-amber-50', label: 'Pending' },
  APPROVED: { icon: CheckCircle, color: 'text-green-600 bg-green-50', label: 'Approved' },
  REJECTED: { icon: XCircle, color: 'text-red-600 bg-red-50', label: 'Rejected' },
};

export default function SuperAdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('PENDING_REVIEW');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/admin/products');
      const data = await res.json();
      setProducts(data.products || []);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const filtered = products
    .filter((p) => filter === 'all' || p.status === filter)
    .filter(
      (p) =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.guide.user.name.toLowerCase().includes(search.toLowerCase())
    );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-btg-terracotta"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Review Products</h1>
        <p className="text-gray-600 mt-1">Approve or reject guide tour packages (all states)</p>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {[
          { key: 'PENDING_REVIEW', label: 'Pending' },
          { key: 'APPROVED', label: 'Approved' },
          { key: 'REJECTED', label: 'Rejected' },
          { key: 'all', label: 'All' },
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
              ({tab.key === 'all' ? products.length : products.filter((p) => p.status === tab.key).length})
            </span>
          </button>
        ))}
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title or guide name..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40 focus:border-transparent"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No products to show</h3>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((product) => {
            const statusInfo = statusConfig[product.status] || statusConfig.PENDING_REVIEW;
            const StatusIcon = statusInfo.icon;
            return (
              <Link
                key={product.id}
                href={`/dashboard/admin/products/${product.id}`}
                className="block bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-gray-900">{product.title}</h3>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                        <StatusIcon className="h-3 w-3" />
                        {statusInfo.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      By {product.guide.user.name} • {product.destination.name}, {product.destination.city.state.name} • {product.durationDays} days • {product.activityType.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <p className="text-xs text-gray-400">{formatDate(product.createdAt)}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
