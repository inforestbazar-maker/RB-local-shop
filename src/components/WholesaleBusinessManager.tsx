import React, { useState } from 'react';
import { 
  Building2, 
  Store, 
  DollarSign, 
  Percent, 
  Package, 
  CheckCircle2, 
  Search, 
  Filter, 
  Sparkles, 
  Layers, 
  FileSpreadsheet, 
  Copy, 
  Check, 
  AlertCircle, 
  Edit3, 
  Save, 
  ArrowRight,
  TrendingDown,
  Info,
  HelpCircle
} from 'lucide-react';
import { Business, Product, WholesaleTier } from '../types';
import { WHOLESALE_UNITS, getEffectiveProductPrice } from '../utils/wholesaleUtils';

interface WholesaleBusinessManagerProps {
  business: Business;
  onUpdateBusiness: (updatedBiz: Partial<Business>) => Promise<void>;
  onUpdateProducts: (updatedProducts: Product[]) => Promise<void>;
}

export const WholesaleBusinessManager: React.FC<WholesaleBusinessManagerProps> = ({
  business,
  onUpdateBusiness,
  onUpdateProducts
}) => {
  // Business-level Wholesale Settings State
  const [isWholesale, setIsWholesale] = useState<boolean>(business.isWholesale ?? false);
  const [wholesaleMode, setWholesaleMode] = useState<'wholesale_only' | 'retail_and_wholesale'>(
    business.wholesaleMode || 'retail_and_wholesale'
  );
  const [minOrderAmount, setMinOrderAmount] = useState<number>(business.wholesaleMinOrderAmount || 0);
  const [defaultDiscount, setDefaultDiscount] = useState<number>(business.wholesaleDiscountPercentage || 15);
  const [defaultMinQty, setDefaultMinQty] = useState<number>(business.wholesaleMinQtyDefault || 5);
  const [wholesaleTerms, setWholesaleTerms] = useState<string>(
    business.wholesaleTerms || 'অগ্রিম ২০% পরিশোধে পণ্য ডেলিভারি করা হয়। বাল্ক অর্ডারে বিশেষ ছাড় প্রযোজ্য।'
  );

  // Product Matrix State
  const [products, setProducts] = useState<Product[]>(business.products || []);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'wholesale_active' | 'retail_only'>('all');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [copiedPriceList, setCopiedPriceList] = useState<boolean>(false);

  // Bulk Discount Modal State
  const [showBulkDiscountModal, setShowBulkDiscountModal] = useState<boolean>(false);
  const [bulkDiscountPercent, setBulkDiscountPercent] = useState<number>(15);
  const [bulkMinQty, setBulkMinQty] = useState<number>(5);

  // Tier Editor Modal State
  const [editingTierProduct, setEditingTierProduct] = useState<Product | null>(null);
  const [currentTiers, setCurrentTiers] = useState<WholesaleTier[]>([]);
  const [newTierQty, setNewTierQty] = useState<number>(20);
  const [newTierPrice, setNewTierPrice] = useState<number>(0);

  // Filter products for matrix
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (filterType === 'wholesale_active') return p.isWholesaleAvailable === true;
    if (filterType === 'retail_only') return !p.isWholesaleAvailable;
    return true;
  });

  // Handle single product wholesale field updates
  const handleProductChange = (productId: string, updates: Partial<Product>) => {
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        return { ...p, ...updates };
      }
      return p;
    }));
  };

  // Open volume tier editor for a specific product
  const handleOpenTierEditor = (p: Product) => {
    setEditingTierProduct(p);
    setCurrentTiers(p.wholesaleTiers ? [...p.wholesaleTiers] : []);
    setNewTierQty(Math.max(10, (p.wholesaleMinQty || 5) * 2));
    setNewTierPrice(p.wholesalePrice ? Math.round(p.wholesalePrice * 0.9) : Math.round(p.price * 0.8));
  };

  const handleAddTierToProduct = () => {
    if (!editingTierProduct) return;
    if (newTierQty <= 1) {
      alert('টায়ার পরিমাণ কমপক্ষে ২ বা তার বেশি হতে হবে!');
      return;
    }
    if (newTierPrice <= 0 || newTierPrice >= editingTierProduct.price) {
      alert('টায়ার মূল্য অবশ্যই খুচরা মূল্যের চেয়ে কম এবং ০ এর বেশি হতে হবে!');
      return;
    }

    const updated = [
      ...currentTiers.filter(t => t.minQty !== newTierQty),
      { minQty: newTierQty, price: newTierPrice, label: `${newTierQty}+ ${editingTierProduct.wholesaleUnit || 'পিস'}` }
    ].sort((a, b) => a.minQty - b.minQty);

    setCurrentTiers(updated);
    setNewTierPrice(Math.round(newTierPrice * 0.95));
    setNewTierQty(newTierQty + 20);
  };

  const handleSaveTiersForProduct = () => {
    if (!editingTierProduct) return;
    handleProductChange(editingTierProduct.id, {
      wholesaleTiers: currentTiers,
      isWholesaleAvailable: true
    });
    setEditingTierProduct(null);
  };

  // 1-Click Bulk apply discount % across all products
  const handleApplyBulkDiscount = () => {
    if (bulkDiscountPercent <= 0 || bulkDiscountPercent >= 90) {
      alert('ছাড়ের হার ১% থেকে ৯০% এর মধ্যে হতে হবে!');
      return;
    }

    const updated = products.map(p => {
      const wholesalePrice = Math.max(1, Math.round(p.price * (1 - bulkDiscountPercent / 100)));
      return {
        ...p,
        isWholesaleAvailable: true,
        wholesalePrice,
        wholesaleMinQty: bulkMinQty,
        wholesaleUnit: p.wholesaleUnit || 'পিস'
      };
    });

    setProducts(updated);
    setShowBulkDiscountModal(false);
    alert(`সাফল্যের সাথে সকল (${updated.length}টি) পণ্যে ${bulkDiscountPercent}% পাইকারি ছাড় ও MOQ ${bulkMinQty} প্রযোজ্য করা হয়েছে! নিচে 'সকল পাইকারি সেটিংস সেভ করুন' বাটনে ক্লিক করুন।`);
  };

  // Save all settings to server
  const handleSaveAll = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      // 1. Update business wholesale settings
      await onUpdateBusiness({
        isWholesale,
        wholesaleMode,
        wholesaleMinOrderAmount: minOrderAmount,
        wholesaleDiscountPercentage: defaultDiscount,
        wholesaleMinQtyDefault: defaultMinQty,
        wholesaleTerms
      });

      // 2. Update products with wholesale matrix
      await onUpdateProducts(products);

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
      alert('✅ পাইকারি ব্যবসা মোড এবং পণ্যসমূহের পাইকারি মূল্য সফলভাবে সেভ করা হয়েছে!');
    } catch (e) {
      console.error('Error saving wholesale settings:', e);
      alert('পাইকারি সেটিংস সেভ করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setIsSaving(false);
    }
  };

  // Generate Wholesale Price List Text for WhatsApp / Printing
  const handleCopyPriceList = () => {
    let text = `🏭 *${business.name} - পাইকারি মূল্য তালিকা (Wholesale Rate Chart)* 🏭\n`;
    text += `📍 ঠিকানা: ${business.address}\n`;
    text += `📞 অর্ডার হটলাইন: ${business.phone}\n`;
    if (minOrderAmount > 0) {
      text += `📦 সর্বনিম্ন পাইকারি অর্ডার: ৳${minOrderAmount}\n`;
    }
    text += `\n================================\n`;
    text += `*পণ্য তালিকা ও পাইকারি দর:*\n`;

    products.forEach((p, idx) => {
      const unit = p.wholesaleUnit || 'পিস';
      const isW = p.isWholesaleAvailable;
      const wPrice = p.wholesalePrice || Math.round(p.price * (1 - (defaultDiscount || 15) / 100));
      const moq = p.wholesaleMinQty || defaultMinQty || 5;

      if (isW) {
        text += `${idx + 1}. *${p.name}*\n`;
        text += `   • খুচরা দর: ৳${p.price}/${unit}\n`;
        text += `   • পাইকারি দর: ৳${wPrice}/${unit} (কমপক্ষে ${moq} ${unit})\n`;
        if (p.wholesaleTiers && p.wholesaleTiers.length > 0) {
          text += `   • ভলিউম টায়ার: `;
          p.wholesaleTiers.forEach(t => {
            text += `[${t.minQty}+ ${unit}: ৳${t.price}] `;
          });
          text += `\n`;
        }
      } else {
        text += `${idx + 1}. ${p.name} - ৳${p.price}/${unit}\n`;
      }
    });

    text += `\n================================\n`;
    if (wholesaleTerms) {
      text += `*শর্তাবলী:* ${wholesaleTerms}\n`;
    }
    text += `🛒 সরাসরি অনলাইনে অর্ডার করতে ভিজিট করুন: ${window.location.origin}`;

    navigator.clipboard.writeText(text);
    setCopiedPriceList(true);
    setTimeout(() => setCopiedPriceList(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Master Switch */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-blue-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-indigo-500/30 border border-indigo-400/30 px-3 py-1 rounded-full text-xs font-black text-indigo-200">
              <Building2 className="w-3.5 h-3.5 text-indigo-300" />
              <span>পাইকারি ব্যবসা নিয়ন্ত্রণ কেন্দ্র (Wholesale Hub)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              🏢 পাইকারি বিক্রি (Wholesale Business Mode)
            </h2>
            <p className="text-xs sm:text-sm text-indigo-100/90 leading-relaxed font-medium">
              আপনার দোকানে বাল্ক পরিমাণ ও ভলিউম অনুযায়ী পাইকারি মূল্য, সর্বনিম্ন অর্ডারের শর্তাবলী (MOQ), এবং বাণিজ্যিক প্যাকেজিং নির্ধারণ করে বড় বড় পাইকারি কাস্টমার ও দোকানদারদের কাছে সরাসরি বিক্রি বাড়ান।
            </p>
          </div>

          {/* Master Toggle Button */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 flex items-center justify-between gap-5 shrink-0 w-full lg:w-auto">
            <div>
              <span className="text-xs font-black text-white block">হোলসেল মোড চালু আছে?</span>
              <span className="text-[10px] text-indigo-200 font-medium">
                {isWholesale ? '🟢 স্টোরে পাইকারি দর প্রদর্শিত হচ্ছে' : '⚪ বর্তমানে সাধারণ রিটেইল মোডে আছে'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsWholesale(!isWholesale)}
              className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isWholesale ? 'bg-emerald-500' : 'bg-slate-500/50'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  isWholesale ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Main Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Business-wide Wholesale Rules */}
        <div className="lg:col-span-1 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Store className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-black text-slate-900">দোকানের পাইকারি পলিসি ও সেটিংস</h3>
          </div>

          {/* Wholesale Operation Model */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-700 block">
              ব্যবসা পরিচালনার ধরন (Business Model)
            </label>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => setWholesaleMode('retail_and_wholesale')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  wholesaleMode === 'retail_and_wholesale'
                    ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800">🛍️ খুচরা ও পাইকারি উভয় (Hybrid)</span>
                  {wholesaleMode === 'retail_and_wholesale' && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  সাধারণ কাস্টমাররা ১টি পিস খুচরা দরে কিনতে পারবে এবং বেশি পরিমাণে নিলে স্বয়ংক্রিয়ভাবে পাইকারি দর পাবে।
                </p>
              </button>

              <button
                type="button"
                onClick={() => setWholesaleMode('wholesale_only')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  wholesaleMode === 'wholesale_only'
                    ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800">🏭 শুধুমাত্র পাইকারি (Wholesale Only)</span>
                  {wholesaleMode === 'wholesale_only' && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  দোকানে শুধুমাত্র নির্ধারিত ন্যূনতম অর্ডারের বেশি ছাড়া খুচরা বিক্রি করা হবে না।
                </p>
              </button>
            </div>
          </div>

          {/* Minimum Order Amount (৳) */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700 flex items-center justify-between">
              <span>সর্বনিম্ন পাইকারি অর্ডার সাইজ (৳)</span>
              <span className="text-[10px] text-slate-400 font-bold">ঐচ্ছিক</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">৳</span>
              <input
                type="number"
                min="0"
                placeholder="যেমন: ১০০০ বা ৫০০০"
                value={minOrderAmount || ''}
                onChange={(e) => setMinOrderAmount(Number(e.target.value))}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-7 pr-3 font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <p className="text-[10px] text-slate-500">
              পাইকারি অর্ডারে কার্ট টোটাল এই টাকার নিচে থাকলে কাস্টমারকে সতর্কবার্তা দেখানো হবে।
            </p>
          </div>

          {/* Default Minimum Quantity (MOQ) */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700 block">
              ডিফল্ট পাইকারি ন্যূনতম পরিমাণ (Default MOQ)
            </label>
            <input
              type="number"
              min="2"
              value={defaultMinQty}
              onChange={(e) => setDefaultMinQty(Math.max(1, Number(e.target.value)))}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Default Discount (%) */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700 block">
              ডিফল্ট পাইকারি ছাড়ের হার (%)
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                max="80"
                value={defaultDiscount}
                onChange={(e) => setDefaultDiscount(Number(e.target.value))}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 pr-8 font-black text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">%</span>
            </div>
          </div>

          {/* Wholesale Terms & Conditions */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700 block">
              পাইকারি ডেলিভারি ও পেমেন্ট শর্তাবলী
            </label>
            <textarea
              rows={3}
              value={wholesaleTerms}
              onChange={(e) => setWholesaleTerms(e.target.value)}
              placeholder="যেমন: জেলা সদরে পরিবহন ডেলিভারি ফ্রি, অগ্রিম ৩০% বিকাশ পেমেন্ট করতে হবে।"
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 resize-none font-medium"
            />
          </div>

          {/* Save Button for Left Panel */}
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSaveAll}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs py-3 px-4 rounded-2xl transition-all shadow-md shadow-indigo-100 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'সংরক্ষণ করা হচ্ছে...' : 'সকল সেটিংস সংরক্ষণ করুন (Save All)'}</span>
          </button>
        </div>

        {/* Right 2 Columns: Product-by-Product Wholesale Matrix */}
        <div className="lg:col-span-2 space-y-4">
          {/* Action Header Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Package className="w-4 h-4 text-indigo-600" />
                  <span>পণ্য অনুযায়ী পাইকারি দাম নির্ধারণ (Product Wholesale Matrix)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  প্রতিটি পণ্যের আলাদা পাইকারি দর, সর্বনিম্ন অর্ডার ও একক নির্ধারণ করুন।
                </p>
              </div>

              {/* Quick Actions Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowBulkDiscountModal(true)}
                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>বাল্ক ছাড় বসান (Bulk Apply)</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyPriceList}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedPriceList ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">কপি হয়েছে!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-600" />
                      <span>দরপত্র কপি (WhatsApp Rate List)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="পণ্য খুঁজুন..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
                <button
                  type="button"
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    filterType === 'all' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  সকল ({products.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('wholesale_active')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    filterType === 'wholesale_active' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  পাইকারি সক্রিয় ({products.filter(p => p.isWholesaleAvailable).length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('retail_only')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    filterType === 'retail_only' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  শুধু খুচরা ({products.filter(p => !p.isWholesaleAvailable).length})
                </button>
              </div>
            </div>
          </div>

          {/* Product Items Interactive List */}
          <div className="space-y-3">
            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center border border-slate-200">
                <Package className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-700">কোনো পণ্য পাওয়া যায়নি</h4>
                <p className="text-xs text-slate-400 mt-1">সার্চ বা ফিল্টার পরিবর্তন করে পুনরায় চেষ্টা করুন।</p>
              </div>
            ) : (
              filteredProducts.map((p) => {
                const isWholesaleActive = p.isWholesaleAvailable === true;
                const wholesalePrice = p.wholesalePrice || Math.round(p.price * (1 - (defaultDiscount || 15) / 100));
                const minQty = p.wholesaleMinQty || defaultMinQty || 5;
                const unit = p.wholesaleUnit || 'পিস';
                const discount = p.price > 0 && wholesalePrice < p.price
                  ? Math.round(((p.price - wholesalePrice) / p.price) * 100)
                  : 0;

                return (
                  <div
                    key={p.id}
                    className={`bg-white rounded-2xl p-4 sm:p-5 border transition-all ${
                      isWholesaleActive 
                        ? 'border-indigo-200/90 shadow-2xs hover:border-indigo-400' 
                        : 'border-slate-200 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Left: Product Info & Toggle */}
                      <div className="flex items-start gap-3.5 flex-1 min-w-0">
                        <img
                          src={p.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200'}
                          alt={p.name}
                          className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-black text-slate-900 truncate">{p.name}</h4>
                            {isWholesaleActive ? (
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.2 rounded-full shrink-0">
                                পাইকারি সক্রিয়
                              </span>
                            ) : (
                              <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.2 rounded-full shrink-0">
                                শুধু খুচরা
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs">
                            <span className="text-slate-500 font-medium">খুচরা মূল্য:</span>
                            <span className="font-black text-slate-800">৳ {p.price}</span>
                            {discount > 0 && isWholesaleActive && (
                              <span className="text-[10px] bg-indigo-50 text-indigo-700 font-black px-1.5 py-0.2 rounded border border-indigo-100">
                                {discount}% ছাড়
                              </span>
                            )}
                          </div>
                          {p.wholesaleTiers && p.wholesaleTiers.length > 0 && (
                            <div className="text-[10px] text-indigo-600 font-bold mt-1">
                              ✨ {p.wholesaleTiers.length} টি ভলিউম টায়ার সক্রিয়
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Inline Wholesale Pricing Controls */}
                      <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                        {/* Toggle switch for this product */}
                        <div className="flex items-center gap-1.5 pr-2 border-r border-slate-200">
                          <button
                            type="button"
                            onClick={() => handleProductChange(p.id, { 
                              isWholesaleAvailable: !isWholesaleActive,
                              wholesalePrice: isWholesaleActive ? p.wholesalePrice : wholesalePrice,
                              wholesaleMinQty: p.wholesaleMinQty || defaultMinQty,
                              wholesaleUnit: p.wholesaleUnit || 'পিস'
                            })}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              isWholesaleActive ? 'bg-indigo-600' : 'bg-slate-300'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                isWholesaleActive ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>

                        {/* Wholesale Price Input */}
                        <div className="w-24">
                          <label className="text-[9px] font-bold text-slate-500 block">পাইকারি দর (৳)</label>
                          <input
                            type="number"
                            disabled={!isWholesaleActive}
                            value={p.wholesalePrice || ''}
                            placeholder={String(wholesalePrice)}
                            onChange={(e) => handleProductChange(p.id, { wholesalePrice: Number(e.target.value) })}
                            className="w-full text-xs bg-white border border-slate-200 rounded-lg p-1.5 font-black text-indigo-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-400"
                          />
                        </div>

                        {/* Packaging Unit Selector */}
                        <div className="w-24">
                          <label className="text-[9px] font-bold text-slate-500 block">বাণিজ্যিক একক</label>
                          <select
                            disabled={!isWholesaleActive}
                            value={unit}
                            onChange={(e) => handleProductChange(p.id, { wholesaleUnit: e.target.value })}
                            className="w-full text-xs bg-white border border-slate-200 rounded-lg p-1.5 font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100"
                          >
                            {WHOLESALE_UNITS.map(u => (
                              <option key={u.id} value={u.id}>{u.id}</option>
                            ))}
                          </select>
                        </div>

                        {/* Minimum Quantity Input */}
                        <div className="w-20">
                          <label className="text-[9px] font-bold text-slate-500 block">ন্যূনতম MOQ</label>
                          <input
                            type="number"
                            min="2"
                            disabled={!isWholesaleActive}
                            value={p.wholesaleMinQty || minQty}
                            onChange={(e) => handleProductChange(p.id, { wholesaleMinQty: Number(e.target.value) })}
                            className="w-full text-xs bg-white border border-slate-200 rounded-lg p-1.5 font-extrabold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100 text-center"
                          />
                        </div>

                        {/* Tier Edit Button */}
                        <button
                          type="button"
                          disabled={!isWholesaleActive}
                          onClick={() => handleOpenTierEditor(p)}
                          title="ভলিউম টায়ার সেট করুন"
                          className="bg-white hover:bg-indigo-50 text-indigo-600 border border-slate-200 hover:border-indigo-300 p-2 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                        >
                          <Layers className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom Floating/Fixed Save Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3 sticky bottom-4">
            <div className="text-xs text-slate-600 font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>পণ্য তালিকায় পরিবর্তন করার পর 'সংরক্ষণ করুন' বাটনে চাপ দিন।</span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSaveAll}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-3 px-8 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'সেভ হচ্ছে...' : '✓ সকল পাইকারি সেটিংস সেভ করুন'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Discount Modal */}
      {showBulkDiscountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 border border-slate-200">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900">এক ক্লিকে সকল পণ্যে পাইকারি ছাড়</h4>
                <p className="text-xs text-slate-500">দোকানের সকল পণ্যের পাইকারি মূল্য নির্ধারণ করুন</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">ছাড়ের শতকরা হার (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="80"
                    value={bulkDiscountPercent}
                    onChange={(e) => setBulkDiscountPercent(Number(e.target.value))}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 font-black text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="absolute right-3 top-3 text-xs font-bold text-slate-400">%</span>
                </div>
                <div className="flex gap-2 pt-1">
                  {[10, 15, 20, 25, 30].map(pct => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setBulkDiscountPercent(pct)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 text-xs font-bold"
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">ডিফল্ট পাইকারি ন্যূনতম পরিমাণ (MOQ)</label>
                <input
                  type="number"
                  min="2"
                  value={bulkMinQty}
                  onChange={(e) => setBulkMinQty(Number(e.target.value))}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-slate-900"
                />
              </div>

              <div className="p-3 bg-indigo-50/70 rounded-xl text-xs text-indigo-900 font-medium">
                💡 এটি আপনার স্টোরের সকল পণ্যে পাইকারি মোড চালু করবে এবং খুচরা মূল্য থেকে {bulkDiscountPercent}% ছাড় হিসেবে পাইকারি দর সেট করবে।
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowBulkDiscountModal(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 rounded-xl text-xs cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleApplyBulkDiscount}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-2.5 rounded-xl text-xs cursor-pointer shadow-md shadow-indigo-100"
              >
                প্রয়োগ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tier Pricing Modal for Single Product */}
      {editingTierProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>ভলিউম টায়ার প্রাইসিং (Volume Slabs)</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">{editingTierProduct.name} (খুচরা: ৳{editingTierProduct.price})</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingTierProduct(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-600 font-medium">
                অর্ডারের পরিমাণ যত বাড়বে, তত কম পাইকারি দর দিতে চাইলে নিচে টায়ার যোগ করুন:
              </p>

              {/* Current Tiers List */}
              {currentTiers.length > 0 ? (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">ন্যূনতম সংখ্যা</th>
                        <th className="p-2.5">একক পাইকারি দর (৳)</th>
                        <th className="p-2.5 text-right">মুছুন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentTiers.map((t, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2.5 font-black text-indigo-900">
                            {t.minQty}+ {editingTierProduct.wholesaleUnit || 'পিস'}
                          </td>
                          <td className="p-2.5 font-black text-emerald-600">
                            ৳ {t.price}
                          </td>
                          <td className="p-2.5 text-right">
                            <button
                              type="button"
                              onClick={() => setCurrentTiers(prev => prev.filter((_, i) => i !== idx))}
                              className="text-rose-500 hover:text-rose-700 font-bold p-1"
                            >
                              মুছুন
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-4 bg-slate-50 rounded-xl text-xs text-slate-400">
                  এখনো কোনো অতিরিক্ত ভলিউম টায়ার যোগ করা হয়নি।
                </div>
              )}

              {/* Add Tier Row */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600">ন্যূনতম পরিমাণ</label>
                  <input
                    type="number"
                    min="2"
                    value={newTierQty}
                    onChange={(e) => setNewTierQty(Number(e.target.value))}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600">একক পাইকারি দর (৳)</label>
                  <input
                    type="number"
                    min="1"
                    value={newTierPrice}
                    onChange={(e) => setNewTierPrice(Number(e.target.value))}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-black text-emerald-700"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddTierToProduct}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-2 rounded-xl transition-all cursor-pointer"
              >
                + টায়ার তালিকায় যুক্ত করুন
              </button>
            </div>

            <div className="flex gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingTierProduct(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 rounded-xl text-xs cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleSaveTiersForProduct}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-2.5 rounded-xl text-xs cursor-pointer"
              >
                সংরক্ষণ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
