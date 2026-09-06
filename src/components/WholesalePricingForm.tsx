import React, { useState } from 'react';
import { 
  Building2, 
  Plus, 
  Trash2, 
  Percent, 
  HelpCircle, 
  Layers, 
  Sparkles,
  CheckCircle2,
  PackageCheck,
  TrendingDown
} from 'lucide-react';
import { WholesaleTier } from '../types';
import { WHOLESALE_UNITS } from '../utils/wholesaleUtils';

interface WholesalePricingFormProps {
  retailPrice: number;
  isWholesaleAvailable: boolean;
  onToggleWholesale: (enabled: boolean) => void;
  wholesalePrice: number;
  onChangeWholesalePrice: (price: number) => void;
  wholesaleMinQty: number;
  onChangeWholesaleMinQty: (qty: number) => void;
  wholesaleUnit: string;
  onChangeWholesaleUnit: (unit: string) => void;
  wholesaleTiers: WholesaleTier[];
  onChangeWholesaleTiers: (tiers: WholesaleTier[]) => void;
  wholesaleStock?: number;
  onChangeWholesaleStock?: (stock: number) => void;
  themeColor?: 'emerald' | 'blue' | 'indigo';
}

export const WholesalePricingForm: React.FC<WholesalePricingFormProps> = ({
  retailPrice,
  isWholesaleAvailable,
  onToggleWholesale,
  wholesalePrice,
  onChangeWholesalePrice,
  wholesaleMinQty,
  onChangeWholesaleMinQty,
  wholesaleUnit,
  onChangeWholesaleUnit,
  wholesaleTiers,
  onChangeWholesaleTiers,
  wholesaleStock,
  onChangeWholesaleStock,
  themeColor = 'emerald'
}) => {
  const [showTierBuilder, setShowTierBuilder] = useState(wholesaleTiers && wholesaleTiers.length > 0);
  const [newTierQty, setNewTierQty] = useState<number>(20);
  const [newTierPrice, setNewTierPrice] = useState<number>(0);
  const [newTierLabel, setNewTierLabel] = useState<string>('');

  // Quick discount calculation buttons for wholesale margin
  const applyQuickMarginDiscount = (percent: number) => {
    if (!retailPrice || retailPrice <= 0) return;
    const calculatedPrice = Math.round(retailPrice * (1 - percent / 100));
    onChangeWholesalePrice(calculatedPrice);
  };

  const handleAddTier = () => {
    if (newTierQty <= 1) {
      alert('টায়ার পরিমাণ কমপক্ষে ২ বা তার বেশি হতে হবে!');
      return;
    }
    if (newTierPrice <= 0 || newTierPrice >= retailPrice) {
      alert('টায়ার মূল্য অবশ্যই খুচরা মূল্যের চেয়ে কম এবং ০ এর বেশি হতে হবে!');
      return;
    }

    const exists = wholesaleTiers.some(t => t.minQty === newTierQty);
    if (exists) {
      alert(`ইতোমধ্যে ${newTierQty} পরিমাণের জন্য একটি পাইকারি টায়ার নির্ধারিত আছে!`);
      return;
    }

    const updated = [
      ...wholesaleTiers,
      {
        minQty: newTierQty,
        price: newTierPrice,
        label: newTierLabel.trim() || `${newTierQty}+ ${wholesaleUnit || 'পিস'}`
      }
    ].sort((a, b) => a.minQty - b.minQty);

    onChangeWholesaleTiers(updated);
    setNewTierLabel('');
    setNewTierPrice(0);
    setNewTierQty(newTierQty + 20);
  };

  const handleRemoveTier = (index: number) => {
    const updated = wholesaleTiers.filter((_, idx) => idx !== index);
    onChangeWholesaleTiers(updated);
  };

  // Calculate discount percentage from retail price
  const discountPercent = retailPrice > 0 && wholesalePrice > 0 && wholesalePrice < retailPrice
    ? Math.round(((retailPrice - wholesalePrice) / retailPrice) * 100)
    : 0;

  return (
    <div className={`rounded-2xl border transition-all ${
      isWholesaleAvailable 
        ? 'bg-gradient-to-b from-indigo-50/60 to-white border-indigo-200 shadow-sm p-4 sm:p-5' 
        : 'bg-slate-50/80 border-slate-200 p-3.5 sm:p-4'
    }`}>
      {/* Header Toggle */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm shadow-xs ${
            isWholesaleAvailable ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
          }`}>
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-black text-slate-800">
                🏭 পাইকারি বিক্রয় সুবিধা (Wholesale Pricing)
              </h4>
              {isWholesaleAvailable && (
                <span className="text-[10px] bg-indigo-100 text-indigo-800 font-extrabold px-2 py-0.5 rounded-full border border-indigo-200 uppercase tracking-wider">
                  সক্রিয় (Active)
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              পাইকারি কাস্টমার ও দোকানদারদের জন্য বাল্ক পরিমাণ অনুযায়ী বিশেষ পাইকারি দর নির্ধারণ করুন।
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onToggleWholesale(!isWholesaleAvailable)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            isWholesaleAvailable ? 'bg-indigo-600' : 'bg-slate-300'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
              isWholesaleAvailable ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Expanded Wholesale Controls */}
      {isWholesaleAvailable && (
        <div className="mt-4 pt-4 border-t border-indigo-100 space-y-4 animate-fadeIn">
          {/* Packaging Unit & Minimum Qty */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Wholesale Unit */}
            <div className="space-y-1">
              <label className="text-xs font-extrabold text-slate-700 flex items-center justify-between">
                <span>পাইকারি বাণিজ্যিক একক (Unit)</span>
              </label>
              <select
                value={wholesaleUnit || 'পিস'}
                onChange={(e) => onChangeWholesaleUnit(e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {WHOLESALE_UNITS.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Minimum Order Quantity (MOQ) */}
            <div className="space-y-1">
              <label className="text-xs font-extrabold text-slate-700 flex items-center justify-between">
                <span>ন্যূনতম পাইকারি পরিমাণ (MOQ)</span>
                <span className="text-[10px] text-indigo-600 font-bold">কমপক্ষে অর্ডার</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="2"
                  value={wholesaleMinQty || 5}
                  onChange={(e) => onChangeWholesaleMinQty(Math.max(1, Number(e.target.value)))}
                  className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2.5 font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-12"
                />
                <span className="absolute right-3 top-2.5 text-[11px] font-bold text-slate-400">
                  {wholesaleUnit || 'পিস'}
                </span>
              </div>
            </div>

            {/* Base Wholesale Unit Price */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-slate-700">
                  পাইকারি একক মূল্য (৳)
                </label>
                {discountPercent > 0 && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-black px-1.5 py-0.2 rounded">
                    {discountPercent}% সাশ্রয়
                  </span>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">৳</span>
                <input
                  type="number"
                  min="1"
                  placeholder="যেমন: ৪০০"
                  value={wholesalePrice || ''}
                  onChange={(e) => onChangeWholesalePrice(Number(e.target.value))}
                  className="w-full text-xs bg-white border border-slate-200 rounded-xl py-2.5 pl-7 pr-3 font-black text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Quick Wholesale Discount Margin Presets */}
          {retailPrice > 0 && (
            <div className="bg-white p-3 rounded-xl border border-indigo-100 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-slate-600 font-bold text-[11px]">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>খুচরা মূল্য (৳{retailPrice}) থেকে এক ক্লিকে পাইকারি ছাড় সেট করুন:</span>
              </div>
              <div className="flex items-center gap-1.5">
                {[5, 10, 15, 20, 25].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => applyQuickMarginDiscount(pct)}
                    className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/60 rounded-lg text-[10px] font-black transition-all cursor-pointer"
                  >
                    -{pct}%
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Optional Wholesale Available Stock */}
          {onChangeWholesaleStock && (
            <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
              <div>
                <span className="text-xs font-extrabold text-slate-800 block">
                  পাইকারি মজুত বা স্টক (Wholesale Stock Available)
                </span>
                <span className="text-[10px] text-slate-400 block">
                  হোলসেল বা ডিলারদের জন্য বরাদ্দকৃত মোট পরিমাণ (ঐচ্ছিক)
                </span>
              </div>
              <div className="w-32">
                <input
                  type="number"
                  min="0"
                  placeholder="যেমন: ৫০০"
                  value={wholesaleStock || ''}
                  onChange={(e) => onChangeWholesaleStock(Number(e.target.value))}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold text-slate-900 text-center"
                />
              </div>
            </div>
          )}

          {/* Volume Tier Pricing Accordion / Section */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowTierBuilder(!showTierBuilder)}
                className="text-xs font-black text-indigo-700 hover:text-indigo-900 flex items-center gap-1.5 cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>পরিমাণ অনুযায়ী ধাপে ধাপে পাইকারি মূল্য (Volume Slabs / Tiered Pricing)</span>
                <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-bold">
                  {wholesaleTiers.length} টি টায়ার সক্রিয়
                </span>
              </button>
            </div>

            {showTierBuilder && (
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                <p className="text-[11px] text-slate-500 font-medium">
                  উদাহরণ: ১০-৪৯ টি কিনলে প্রতি {wholesaleUnit || 'পিস'} ৳৪৫০, ৫০-৯৯ টি কিনলে ৳৪২০, ১০০+ কিনলে ৳৩৯০।
                </p>

                {/* Existing Tiers Table */}
                {wholesaleTiers.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs bg-white rounded-lg border border-slate-200">
                      <thead>
                        <tr className="bg-slate-100/80 border-b border-slate-200 text-[10px] font-black text-slate-600">
                          <th className="p-2">ন্যূনতম পরিমাণ</th>
                          <th className="p-2">পাইকারি একক দর (৳)</th>
                          <th className="p-2">ছাড়ের বিবরণ</th>
                          <th className="p-2 text-right">মুছুন</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                        {wholesaleTiers.map((tier, idx) => {
                          const tierDiscount = retailPrice > 0 && tier.price < retailPrice
                            ? Math.round(((retailPrice - tier.price) / retailPrice) * 100)
                            : 0;
                          return (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="p-2 font-black text-indigo-900">
                                {tier.minQty}+ {wholesaleUnit || 'পিস'}
                              </td>
                              <td className="p-2 font-black text-emerald-600">
                                ৳ {tier.price}
                              </td>
                              <td className="p-2 text-[11px] text-slate-500">
                                {tier.label || `${tierDiscount}% ছাড়`}
                              </td>
                              <td className="p-2 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveTier(idx)}
                                  className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Add New Tier Row */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600">ন্যূনতম পরিমাণ</label>
                    <input
                      type="number"
                      min="2"
                      placeholder="যেমন: ২০"
                      value={newTierQty || ''}
                      onChange={(e) => setNewTierQty(Number(e.target.value))}
                      className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600">একক দর (৳)</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="যেমন: ৪২০"
                      value={newTierPrice || ''}
                      onChange={(e) => setNewTierPrice(Number(e.target.value))}
                      className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 font-black text-emerald-700"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600">লেবেল বা নোট (ঐচ্ছিক)</label>
                    <input
                      type="text"
                      placeholder="যেমন: ডিলার রেট"
                      value={newTierLabel}
                      onChange={(e) => setNewTierLabel(e.target.value)}
                      className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleAddTier}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs py-2 px-3 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>টায়ার যোগ করুন</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
