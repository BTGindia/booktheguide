'use client';

import { useState, useEffect } from 'react';
import {
  DollarSign, Loader2, Save, Plus, Trash2,
  ChevronDown, ChevronRight, TrendingUp, Users, Calculator,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface StateCommission {
  id: string;
  name: string;
  code: string;
  commissionPercent: number;
}

interface SubCategoryInfo {
  id: string;
  name: string;
  slug: string;
  isEnabled: boolean;
}

interface CategoryInfo {
  id: string;
  slug: string;
  label: string;
  isEnabled: boolean;
  subCategories: SubCategoryInfo[];
}

interface CatCommission {
  id: string;
  stateId: string;
  categoryId: string | null;
  subCategoryId: string | null;
  commissionPercent: number;
  state: { id: string; name: string };
  category: { id: string; slug: string; label: string } | null;
  subCategory: { id: string; name: string } | null;
}

interface PnLEntry {
  id: string;
  guideId: string;
  productId: string | null;
  contractType: string;
  profitSharePercent: number | null;
  onlineSaleAmount: number;
  onlineSalePersons: number;
  offlineSaleAmount: number;
  offlineSalePersons: number;
  totalCostAmount: number;
  totalRevenue: number;
  totalProfit: number;
  influencerShare: number;
  platformShare: number;
  notes: string | null;
  period: string | null;
  isFinalized: boolean;
  guide?: { user: { name: string } };
  product?: { title: string } | null;
}

export default function SuperAdminCommissionPage() {
  const [states, setStates] = useState<StateCommission[]>([]);
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [catCommissions, setCatCommissions] = useState<CatCommission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const [selectedState, setSelectedState] = useState('');
  const [activeTab, setActiveTab] = useState<'commission' | 'influencer'>('commission');

  // Inline commission edit
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // Influencer P&L
  const [pnlEntries, setPnlEntries] = useState<PnLEntry[]>([]);
  const [pnlLoading, setPnlLoading] = useState(false);
  const [showPnlForm, setShowPnlForm] = useState(false);
  const [pnlForm, setPnlForm] = useState({
    guideId: '',
    productId: '',
    contractType: 'COMMISSION',
    profitSharePercent: '50',
    onlineSaleAmount: '0',
    onlineSalePersons: '0',
    offlineSaleAmount: '0',
    offlineSalePersons: '0',
    totalCostAmount: '0',
    notes: '',
    period: '',
  });
  const [influencerGuides, setInfluencerGuides] = useState<{ id: string; name: string }[]>([]);
  const [influencerProducts, setInfluencerProducts] = useState<{ id: string; title: string }[]>([]);

  useEffect(() => {
    fetchCommissionData();
  }, []);

  useEffect(() => {
    if (activeTab === 'influencer') {
      fetchPnLData();
      fetchInfluencerGuides();
    }
  }, [activeTab]);

  const fetchCommissionData = async () => {
    try {
      const res = await fetch('/api/admin/commission');
      const data = await res.json();
      setStates(data.states || []);
      setCategories(data.categories || []);
      setCatCommissions(data.categoryCommissions || []);
      if (data.states?.length > 0) setSelectedState(data.states[0].id);
    } catch {
      toast.error('Failed to load');
    } finally {
      setLoading(false);
    }
  };

  const fetchPnLData = async () => {
    setPnlLoading(true);
    try {
      const res = await fetch('/api/super-admin/influencer-pnl');
      const data = await res.json();
      setPnlEntries(data.entries || []);
    } catch {
      // API might not exist yet
    } finally {
      setPnlLoading(false);
    }
  };

  const fetchInfluencerGuides = async () => {
    try {
      const res = await fetch('/api/super-admin/influencer-pnl?action=guides');
      const data = await res.json();
      setInfluencerGuides(data.guides || []);
    } catch {}
  };

  const fetchInfluencerProducts = async (guideId: string) => {
    try {
      const res = await fetch(`/api/super-admin/influencer-pnl?action=products&guideId=${encodeURIComponent(guideId)}`);
      const data = await res.json();
      setInfluencerProducts(data.products || []);
    } catch {}
  };

  const getCommission = (catId: string, subCatId?: string): CatCommission | undefined => {
    return catCommissions.find(
      (cc) =>
        cc.stateId === selectedState &&
        cc.categoryId === catId &&
        (subCatId ? cc.subCategoryId === subCatId : cc.subCategoryId === null)
    );
  };

  const getStateDefault = (): number => {
    const state = states.find((s) => s.id === selectedState);
    return state?.commissionPercent || 15;
  };

  const toggleCategory = (catId: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      next.has(catId) ? next.delete(catId) : next.add(catId);
      return next;
    });
  };

  const startEdit = (key: string, currentValue: number) => {
    setEditingKey(key);
    setEditValue(String(currentValue));
  };

  const saveCommission = async (categoryId: string, subCategoryId?: string) => {
    if (!selectedState) return;
    const key = subCategoryId ? `${categoryId}-${subCategoryId}` : categoryId;
    setSaving(key);
    try {
      const res = await fetch('/api/admin/commission', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stateId: selectedState,
          categoryId,
          subCategoryId: subCategoryId || undefined,
          commissionPercent: Number(editValue),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(data.message);
      const refreshRes = await fetch('/api/admin/commission');
      const refreshData = await refreshRes.json();
      setCatCommissions(refreshData.categoryCommissions || []);
      setEditingKey(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save');
    } finally {
      setSaving(null);
    }
  };

  const deleteCommission = async (id: string) => {
    if (!confirm('Remove this commission override? Will fall back to state default.')) return;
    setSaving(id);
    try {
      const res = await fetch(`/api/admin/commission?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Override removed');
      setCatCommissions((prev) => prev.filter((c) => c.id !== id));
    } catch {
      toast.error('Failed to delete');
    } finally {
      setSaving(null);
    }
  };

  const savePnLEntry = async () => {
    if (!pnlForm.guideId) { toast.error('Select an influencer'); return; }
    setSaving('pnl-save');
    try {
      const onlineSale = Number(pnlForm.onlineSaleAmount);
      const offlineSale = Number(pnlForm.offlineSaleAmount);
      const totalCost = Number(pnlForm.totalCostAmount);
      const totalRevenue = onlineSale + offlineSale;
      const totalProfit = totalRevenue - totalCost;
      const sharePercent = Number(pnlForm.profitSharePercent) / 100;

      const res = await fetch('/api/super-admin/influencer-pnl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guideId: pnlForm.guideId,
          productId: pnlForm.productId || null,
          contractType: pnlForm.contractType,
          profitSharePercent: pnlForm.contractType === 'PNL_SHARING' ? Number(pnlForm.profitSharePercent) : null,
          onlineSaleAmount: onlineSale,
          onlineSalePersons: Number(pnlForm.onlineSalePersons),
          offlineSaleAmount: offlineSale,
          offlineSalePersons: Number(pnlForm.offlineSalePersons),
          totalCostAmount: totalCost,
          totalRevenue,
          totalProfit,
          influencerShare: pnlForm.contractType === 'PNL_SHARING' ? totalProfit * sharePercent : 0,
          platformShare: pnlForm.contractType === 'PNL_SHARING' ? totalProfit * (1 - sharePercent) : totalProfit,
          notes: pnlForm.notes,
          period: pnlForm.period,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('P&L entry saved');
      setShowPnlForm(false);
      setPnlForm({
        guideId: '', productId: '', contractType: 'COMMISSION', profitSharePercent: '50',
        onlineSaleAmount: '0', onlineSalePersons: '0', offlineSaleAmount: '0',
        offlineSalePersons: '0', totalCostAmount: '0', notes: '', period: '',
      });
      fetchPnLData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save');
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-btg-terracotta" />
      </div>
    );
  }

  const selectedStateName = states.find((s) => s.id === selectedState)?.name || '';

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold font-heading text-btg-dark mb-1">Commission Settings</h1>
        <p className="text-gray-600">
          Set commissions per experience category and subcategory for each state. Influencer P&L tracking below.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        <button
          onClick={() => setActiveTab('commission')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'commission' ? 'bg-white text-btg-terracotta shadow-sm' : 'text-gray-600'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Category &amp; Subcategory Commission
        </button>
        <button
          onClick={() => setActiveTab('influencer')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'influencer' ? 'bg-white text-btg-terracotta shadow-sm' : 'text-gray-600'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Influencer P&amp;L Sharing
        </button>
      </div>

      {/* ═══════ Category & Subcategory Commission ═══════ */}
      {activeTab === 'commission' && (
        <div className="space-y-6">
          {/* State Selector */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-4 flex-wrap">
              <label className="text-sm font-medium text-gray-700">Select State:</label>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-btg-terracotta/40 min-w-[200px]"
              >
                {states.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <span className="text-sm text-gray-500">
                State default: <strong className="text-btg-terracotta">{getStateDefault()}%</strong>
              </span>
            </div>
          </div>

          {/* Categories Tree */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700">
                Commission per Category &amp; Subcategory — {selectedStateName}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Click on the percentage to edit. If not set, state default ({getStateDefault()}%) applies.
              </p>
            </div>

            {categories.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">
                No experience categories found. Seed categories from the Categories page first.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {categories.map((cat) => {
                  const isExpanded = expandedCats.has(cat.id);
                  const catComm = getCommission(cat.id);
                  const catKey = cat.id;
                  const catPercent = catComm?.commissionPercent ?? getStateDefault();

                  return (
                    <div key={cat.id}>
                      {/* Category Row */}
                      <div className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                        <button onClick={() => toggleCategory(cat.id)} className="text-gray-400 hover:text-gray-600">
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-btg-dark">{cat.label}</span>
                            {!cat.isEnabled && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-600">disabled</span>
                            )}
                            <span className="text-xs text-gray-400">({cat.subCategories.length} subcategories)</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {editingKey === catKey ? (
                            <>
                              <input
                                type="number"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                min={0} max={50} step={0.5}
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-right"
                                autoFocus
                              />
                              <span className="text-sm text-gray-500">%</span>
                              <button
                                onClick={() => saveCommission(cat.id)}
                                disabled={saving === catKey}
                                className="px-2 py-1 bg-btg-terracotta text-white text-xs rounded hover:bg-btg-terracotta/90 disabled:opacity-50"
                              >
                                {saving === catKey ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                              </button>
                              <button onClick={() => setEditingKey(null)} className="text-gray-400 hover:text-gray-600 text-xs">Cancel</button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEdit(catKey, catPercent)}
                                className="px-3 py-1 text-sm font-semibold text-btg-terracotta hover:bg-btg-terracotta/5 rounded transition-colors"
                              >
                                {catComm ? `${catComm.commissionPercent}%` : `${getStateDefault()}% (default)`}
                              </button>
                              {catComm && (
                                <button
                                  onClick={() => deleteCommission(catComm.id)}
                                  disabled={saving === catComm.id}
                                  className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {/* Subcategories */}
                      {isExpanded && cat.subCategories.length > 0 && (
                        <div className="bg-gray-50/50">
                          {cat.subCategories.map((sub) => {
                            const subComm = getCommission(cat.id, sub.id);
                            const subKey = `${cat.id}-${sub.id}`;
                            const subPercent = subComm?.commissionPercent ?? catPercent;

                            return (
                              <div key={sub.id} className="flex items-center gap-3 px-5 pl-14 py-2.5 hover:bg-gray-100/50 transition-colors border-t border-gray-100/50">
                                <div className="flex-1">
                                  <span className="text-sm text-gray-700">{sub.name}</span>
                                  {!sub.isEnabled && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-600 ml-2">disabled</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  {editingKey === subKey ? (
                                    <>
                                      <input
                                        type="number"
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        min={0} max={50} step={0.5}
                                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-right"
                                        autoFocus
                                      />
                                      <span className="text-sm text-gray-500">%</span>
                                      <button
                                        onClick={() => saveCommission(cat.id, sub.id)}
                                        disabled={saving === subKey}
                                        className="px-2 py-1 bg-btg-terracotta text-white text-xs rounded hover:bg-btg-terracotta/90 disabled:opacity-50"
                                      >
                                        {saving === subKey ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                      </button>
                                      <button onClick={() => setEditingKey(null)} className="text-gray-400 hover:text-gray-600 text-xs">Cancel</button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() => startEdit(subKey, subPercent)}
                                        className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-200/50 rounded transition-colors"
                                      >
                                        {subComm ? `${subComm.commissionPercent}%` : `${catPercent}% (inherited)`}
                                      </button>
                                      {subComm && (
                                        <button
                                          onClick={() => deleteCommission(subComm.id)}
                                          disabled={saving === subComm.id}
                                          className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {isExpanded && cat.subCategories.length === 0 && (
                        <div className="px-5 pl-14 py-3 text-xs text-gray-400 bg-gray-50/30 border-t border-gray-100/50">
                          No subcategories defined for this category.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════ Influencer P&L Sharing ═══════ */}
      {activeTab === 'influencer' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-btg-dark flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Travel with Influencer — P&amp;L Sharing
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Influencers may work on profit &amp; loss sharing contracts. Track sales, costs, and profit splits here.
                </p>
              </div>
              <button
                onClick={() => setShowPnlForm(!showPnlForm)}
                className="flex items-center gap-1.5 px-4 py-2 bg-btg-terracotta text-white text-sm rounded-lg hover:bg-btg-terracotta/90"
              >
                <Plus className="w-4 h-4" />
                Add P&amp;L Entry
              </button>
            </div>

            {showPnlForm && (
              <div className="bg-gray-50 rounded-xl p-5 mb-4 border border-gray-200">
                <h4 className="font-medium text-btg-dark mb-4">New P&amp;L Entry</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Influencer *</label>
                    <select
                      value={pnlForm.guideId}
                      onChange={(e) => {
                        setPnlForm({ ...pnlForm, guideId: e.target.value, productId: '' });
                        if (e.target.value) fetchInfluencerProducts(e.target.value);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="">Select influencer</option>
                      {influencerGuides.map((g) => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Trip/Product</label>
                    <select
                      value={pnlForm.productId}
                      onChange={(e) => setPnlForm({ ...pnlForm, productId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      disabled={!pnlForm.guideId}
                    >
                      <option value="">All trips (global)</option>
                      {influencerProducts.map((p) => (
                        <option key={p.id} value={p.id}>{p.title}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Contract Type *</label>
                    <select
                      value={pnlForm.contractType}
                      onChange={(e) => setPnlForm({ ...pnlForm, contractType: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="COMMISSION">Commission Based</option>
                      <option value="PNL_SHARING">P&amp;L Sharing</option>
                    </select>
                  </div>
                  {pnlForm.contractType === 'PNL_SHARING' && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Influencer Profit Share %</label>
                      <input
                        type="number"
                        value={pnlForm.profitSharePercent}
                        onChange={(e) => setPnlForm({ ...pnlForm, profitSharePercent: e.target.value })}
                        min={0} max={100}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Period</label>
                    <input
                      type="text"
                      placeholder="e.g. March 2026"
                      value={pnlForm.period}
                      onChange={(e) => setPnlForm({ ...pnlForm, period: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <Calculator className="w-4 h-4" />
                    Revenue &amp; Costs
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Online Sale (Website) &#x20B9;</label>
                      <input type="number" value={pnlForm.onlineSaleAmount} onChange={(e) => setPnlForm({ ...pnlForm, onlineSaleAmount: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Online Persons</label>
                      <input type="number" value={pnlForm.onlineSalePersons} onChange={(e) => setPnlForm({ ...pnlForm, onlineSalePersons: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Offline Sale &#x20B9;</label>
                      <input type="number" value={pnlForm.offlineSaleAmount} onChange={(e) => setPnlForm({ ...pnlForm, offlineSaleAmount: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Offline Persons</label>
                      <input type="number" value={pnlForm.offlineSalePersons} onChange={(e) => setPnlForm({ ...pnlForm, offlineSalePersons: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Total Cost &#x20B9;</label>
                      <input type="number" value={pnlForm.totalCostAmount} onChange={(e) => setPnlForm({ ...pnlForm, totalCostAmount: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                      <input type="text" value={pnlForm.notes} onChange={(e) => setPnlForm({ ...pnlForm, notes: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                    </div>
                  </div>

                  {pnlForm.contractType === 'PNL_SHARING' && (
                    <div className="mt-4 bg-white rounded-lg p-4 border border-gray-200">
                      <h6 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">P&amp;L Preview</h6>
                      {(() => {
                        const totalRev = Number(pnlForm.onlineSaleAmount) + Number(pnlForm.offlineSaleAmount);
                        const totalProfit = totalRev - Number(pnlForm.totalCostAmount);
                        const sharePercent = Number(pnlForm.profitSharePercent) / 100;
                        return (
                          <div className="grid grid-cols-4 gap-3 text-sm">
                            <div><span className="text-gray-500">Total Revenue:</span> <span className="font-semibold">&#x20B9;{totalRev.toLocaleString('en-IN')}</span></div>
                            <div><span className="text-gray-500">Profit:</span> <span className={`font-semibold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>&#x20B9;{totalProfit.toLocaleString('en-IN')}</span></div>
                            <div><span className="text-gray-500">Influencer:</span> <span className="font-semibold text-blue-600">&#x20B9;{(totalProfit * sharePercent).toLocaleString('en-IN')}</span></div>
                            <div><span className="text-gray-500">Platform:</span> <span className="font-semibold text-btg-terracotta">&#x20B9;{(totalProfit * (1 - sharePercent)).toLocaleString('en-IN')}</span></div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 mt-4">
                  <button onClick={() => setShowPnlForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
                  <button
                    onClick={savePnLEntry}
                    disabled={saving === 'pnl-save'}
                    className="flex items-center gap-1.5 px-4 py-2 bg-btg-terracotta text-white text-sm rounded-lg hover:bg-btg-terracotta/90 disabled:opacity-50"
                  >
                    {saving === 'pnl-save' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save P&amp;L Entry
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700">P&amp;L Records</h3>
            </div>
            {pnlLoading ? (
              <div className="p-8 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-gray-400" /></div>
            ) : pnlEntries.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">
                No P&amp;L entries yet. Add an entry above to start tracking influencer revenue sharing.
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Influencer</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Trip</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Revenue</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Profit</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Influencer Share</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Period</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pnlEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 text-sm font-medium">{entry.guide?.user?.name || '—'}</td>
                      <td className="px-5 py-3 text-sm">{entry.product?.title || 'All trips'}</td>
                      <td className="px-5 py-3 text-sm">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${entry.contractType === 'PNL_SHARING' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                          {entry.contractType === 'PNL_SHARING' ? `P&L (${entry.profitSharePercent}%)` : 'Commission'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm">&#x20B9;{entry.totalRevenue.toLocaleString('en-IN')}</td>
                      <td className="px-5 py-3 text-sm">
                        <span className={entry.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                          &#x20B9;{entry.totalProfit.toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm font-semibold text-blue-600">&#x20B9;{entry.influencerShare.toLocaleString('en-IN')}</td>
                      <td className="px-5 py-3 text-sm text-gray-500">{entry.period || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
