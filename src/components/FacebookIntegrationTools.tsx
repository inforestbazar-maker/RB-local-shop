import React, { useState } from 'react';
import { 
  Share2, Sparkles, Download, Copy, Check, ExternalLink, 
  ShoppingBag, Store, Tag, Plus, RefreshCw, AlertCircle, 
  CheckCircle, ArrowRight, Layers, HelpCircle, FileText, 
  Camera, X, Info, Phone, MessageSquare, Flame, Send
} from 'lucide-react';
import { Product, ServiceItem, Business, User, CustomerProduct } from '../types';
import PhotoCaptureUpload from './PhotoCaptureUpload';

export interface ExtractedProductItem {
  name: string;
  price: number;
  originalPrice?: number;
  category: string;
  description: string;
  highlights?: string[];
  tags?: string[];
  image?: string;
  isWholesaleAvailable?: boolean;
  wholesalePrice?: number;
  wholesaleMinQty?: number;
  deliveryCharge?: number;
  contactPhone?: string;
}

export interface ExtractedShopDetails {
  name: string;
  category: string;
  phone: string;
  whatsapp: string;
  address: string;
  description: string;
}

export interface FacebookImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'merchant_product' | 'c2c_marketplace' | 'business_page';
  currentUser?: User;
  business?: Business | null;
  shopCategory?: string;
  onImportProducts?: (products: ExtractedProductItem[]) => Promise<void>;
  onImportCustomerProduct?: (product: Partial<CustomerProduct>) => Promise<void>;
  onImportShopDetails?: (details: ExtractedShopDetails) => Promise<void>;
}

// Quick Sample Posts to help merchants test instantly
const SAMPLE_FACEBOOK_POSTS = [
  {
    title: '🌾 মুদি সামগ্রী প্যাকেজ অফার',
    text: `🔥 বিশেষ ধামাকা অফার! প্রিমিয়াম মিনিকেট চাল ও খাঁটি সরিষার তেল।
🌾 মিনিকেট চাল (২৫ কেজি বস্তা) - মূল্য: মাত্র ১৮৫০ টাকা (আগের দাম ২০০০ টাকা)।
🌾 ঘানি ভাঙা খাঁটি সরিষার তেল (১ লিটার) - মূল্য: ২৫০ টাকা।
✅ ১০০% ফ্রেশ ও খাঁটি।
🚚 সমগ্র এলাকায় ফ্রি হোম ডেলিভারি সুবিধা! ক্যাশ অন ডেলিভারি।
📞 সরাসরি অর্ডার করতে কল করুন: 01711223344
দোকানের ঠিকানা: ধানমন্ডি বাজার, ঢাকা।`
  },
  {
    title: '👗 বুটিক ও থ্রি-পিস কালেকশন',
    text: `✨ নতুন পার্টি কালেকশন প্রিমিয়াম সুতি ডিজিটাল প্রিন্ট থ্রি-পিস!
👗 জামা: পিওর সুতি (৪ গজ)
👗 ওড়না: শিফন নামাজি ওড়না (৫ হাত)
👗 সালোয়ার: ম্যাচিং কটন
💰 স্পেশাল ডিসকাউন্ট প্রাইজ: মাত্র ১২৫০/- (মার্কেট প্রাইজ ১৫০০ টাকা)
📦 সারা দেশে হোম ডেলিভারি (ঢাকার ভেতর ৮০ টাকা, ঢাকার বাইরে ১৫০ টাকা)।
অর্ডার করতে ইনবক্স করুন অথবা হোয়াটসঅ্যাপ: 01811556677`
  },
  {
    title: '📱 মোবাইল ও গ্যাজেট',
    text: `⚡ Hot Deal! Baseus 65W Fast GaN Charger & Cable
🔌 ৩টি পোর্ট (২টি Type-C + ১টি USB-A), ল্যাপটপ ও ফোন এক সাথে চার্জ হবে।
🛡️ ৬ মাসের অফিসিয়াল রিপ্লেসমেন্ট ওয়ারেন্টি।
💵 রেগুলার প্রাইস: ২২০০ টাকা
🏷️ বর্তমান অফার প্রাইস: ১৮৫০ টাকা!
লোকেশন: মিরপুর-১০, ঢাকা। স্টক সীমিত!`
  }
];

export function FacebookImportModal({
  isOpen,
  onClose,
  targetType = 'merchant_product',
  currentUser,
  business,
  onImportProducts,
  onImportCustomerProduct,
  onImportShopDetails
}: FacebookImportModalProps) {
  const [activeTab, setActiveTab] = useState<'import' | 'preview'>('import');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [postText, setPostText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Extracted data state
  const [extractedProducts, setExtractedProducts] = useState<ExtractedProductItem[]>([]);
  const [extractedShop, setExtractedShop] = useState<ExtractedShopDetails | null>(null);
  const [isBulk, setIsBulk] = useState(false);
  const [selectedItemsToSave, setSelectedItemsToSave] = useState<number[]>([]);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleParseFacebookData = async (rawTextOverride?: string) => {
    const textToSubmit = rawTextOverride !== undefined ? rawTextOverride : postText;
    if (!facebookUrl.trim() && !textToSubmit.trim()) {
      setErrorMsg('অনুগ্রহ করে ফেসবুক পোস্টের লিংক অথবা ক্যাপশন/টেক্সট প্রদান করুন।');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSaveSuccessMsg(null);

    try {
      const response = await fetch('/api/facebook-import/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facebookUrl: facebookUrl.trim(),
          postText: textToSubmit.trim(),
          imageUrl: imageUrl.trim(),
          targetType
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'ডেটা পার্স করতে সমস্যা হয়েছে।');
      }

      if (data.products && data.products.length > 0) {
        setExtractedProducts(data.products);
        setIsBulk(data.isBulk || data.products.length > 1);
        setSelectedItemsToSave(data.products.map((_: any, idx: number) => idx));
      }

      if (data.shopDetails) {
        setExtractedShop(data.shopDetails);
      }

      setActiveTab('preview');
    } catch (err: any) {
      setErrorMsg(err.message || 'ফেসবুক পোস্ট প্রসেসিং ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplySample = (sampleText: string) => {
    setPostText(sampleText);
    setErrorMsg(null);
  };

  const handleUpdateExtractedField = (index: number, field: keyof ExtractedProductItem, value: any) => {
    setExtractedProducts(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const toggleSelectItem = (index: number) => {
    setSelectedItemsToSave(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const handleCommitImport = async () => {
    if (selectedItemsToSave.length === 0 && targetType !== 'business_page') {
      alert('অনুগ্রহ করে অন্তত ১টি পণ্য নির্বাচন করুন!');
      return;
    }

    setIsSaving(true);
    setSaveSuccessMsg(null);

    try {
      const selectedList = extractedProducts.filter((_, idx) => selectedItemsToSave.includes(idx));

      if (targetType === 'merchant_product' && onImportProducts) {
        await onImportProducts(selectedList);
        setSaveSuccessMsg(`🎉 সফলভাবে ${selectedList.length}টি পণ্য দোকানে যুক্ত করা হয়েছে!`);
      } else if (targetType === 'c2c_marketplace' && onImportCustomerProduct && selectedList[0]) {
        const item = selectedList[0];
        await onImportCustomerProduct({
          name: item.name,
          category: (item.category as any) || 'other',
          price: item.price,
          originalPrice: item.originalPrice,
          description: item.description,
          image: item.image || undefined,
          images: item.image ? [item.image] : [],
          condition: 'like_new',
          isAvailable: true,
        });
        setSaveSuccessMsg('🎉 পণ্যটি সেকেন্ড-হ্যান্ড / রিসেল মার্কেটপ্লেসে সফলভাবে পোস্ট হয়েছে!');
      } else if (targetType === 'business_page' && onImportShopDetails && extractedShop) {
        await onImportShopDetails(extractedShop);
        if (selectedList.length > 0 && onImportProducts) {
          await onImportProducts(selectedList);
        }
        setSaveSuccessMsg('🎉 ফেসবুক পেজের তথ্য দিয়ে দোকান আপডেট সম্পন্ন হয়েছে!');
      }

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (e: any) {
      alert('ইমপোর্ট ব্যর্থ হয়েছে: ' + (e?.message || 'Error'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-2xl my-auto overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner text-white font-black text-lg">
              f
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight">ফেসবুক অটো-ইমপোর্টার</h3>
                <span className="bg-emerald-400 text-emerald-950 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  AI Powered
                </span>
              </div>
              <p className="text-xs text-blue-100 font-medium">
                ফেসবুক পেজ বা পোস্টের লিংক/টেক্সট দিয়ে এক ক্লিকে পণ্য ও বিবরণ ইমপোর্ট করুন
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 bg-slate-50/70 px-6 pt-3 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('import')}
            className={`pb-3 px-4 text-xs font-black transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'import'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>১. পোস্ট / পেজের তথ্য দিন</span>
          </button>

          <button
            type="button"
            onClick={() => extractedProducts.length > 0 && setActiveTab('preview')}
            disabled={extractedProducts.length === 0}
            className={`pb-3 px-4 text-xs font-black transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'preview'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-xl cursor-pointer'
                : extractedProducts.length > 0
                  ? 'border-transparent text-slate-600 hover:text-slate-800 cursor-pointer'
                  : 'border-transparent text-slate-300 cursor-not-allowed'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>২. প্রিভিউ ও স্টোরে সংরক্ষণ {extractedProducts.length > 0 ? `(${extractedProducts.length})` : ''}</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-2xl text-xs font-bold flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {saveSuccessMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs font-black flex items-center gap-2 animate-bounce">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          {activeTab === 'import' && (
            <div className="space-y-4">
              
              {/* Option A: Facebook Post / Page URL */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-800 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                    <span>ফেসবুক পোস্ট / রিল / পেজ লিংক (ঐচ্ছিক)</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">পোস্ট লিংক দিলে সরাসরি রিড করবে</span>
                </label>
                <input
                  type="url"
                  placeholder="যেমন: https://www.facebook.com/share/p/1Bxxxxxx/ অথবা পেজ লিংক"
                  value={facebookUrl}
                  onChange={(e) => setFacebookUrl(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800 placeholder-slate-400"
                />
              </div>

              {/* Option B: Raw Facebook Post / Caption Text */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>ফেসবুক পোস্টের ক্যাপশন / টেক্সট পেস্ট করুন <span className="text-rose-500">*</span></span>
                  </label>
                  {postText && (
                    <button
                      type="button"
                      onClick={() => setPostText('')}
                      className="text-[10px] text-slate-400 hover:text-rose-500 font-bold"
                    >
                      ক্লিয়ার
                    </button>
                  )}
                </div>
                <textarea
                  rows={5}
                  placeholder={`ফেসবুক পোস্ট থেকে ক্যাপশনটি কপি করে এখানে পেস্ট করুন...\nযেমন:\n🔥 স্পেশাল অফার! প্রিমিয়াম কটন থ্রি-পিস\nমূল্য: ১২৫০ টাকা (আগের দাম ১৫০০ টাকা)\nডেলিভারি চার্জ: ৮০ টাকা\nঅর্ডার করতে কল: 017xxxxxxxx`}
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-2xl p-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800 placeholder-slate-400 transition-all leading-relaxed"
                />
              </div>

              {/* Optional Photo Attachment */}
              <div className="space-y-2">
                <PhotoCaptureUpload
                  currentImage={imageUrl}
                  onImageChange={setImageUrl}
                  label="পণ্যের ছবি / ফটো (যদি থাকে)"
                  sublabel="ফেসবুক থেকে নামানো ছবি আপলোড করুন অথবা ক্যামেরা দিয়ে ছবি তুলুন"
                  shape="rectangle"
                  aspectRatio="4:3"
                  placeholderText="পণ্যের ফটো"
                />
              </div>

              {/* Quick Sample Presets */}
              <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-blue-900 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>দ্রুত টেস্ট করার জন্য ডেমো পোস্টের নমুনা:</span>
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {SAMPLE_FACEBOOK_POSTS.map((sample, idx) => (
                    <button
                      key={`sample-${idx}`}
                      type="button"
                      onClick={() => handleApplySample(sample.text)}
                      className="text-left p-2 rounded-xl bg-white border border-blue-200 hover:border-blue-500 hover:shadow-xs transition-all text-[11px] font-bold text-slate-800 cursor-pointer"
                    >
                      <span className="block text-blue-700 truncate">{sample.title}</span>
                      <span className="text-[9px] text-slate-400 line-clamp-1 mt-0.5">ক্লিক করে লোড করুন</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleParseFacebookData()}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs py-3.5 px-6 rounded-2xl shadow-md hover:shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>এআই দিয়ে ফেসবুক ডেটা বিশ্লেষণ হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>✨ ডেটা স্বয়ংক্রিয়ভাবে এক্সট্র্যাক্ট করুন (Auto-Extract with AI)</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          )}

          {activeTab === 'preview' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3.5 text-xs text-emerald-900 font-bold">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    {isBulk 
                      ? `সফলভাবে ${extractedProducts.length}টি পণ্য আলাদাভাবে শনাক্ত হয়েছে!` 
                      : 'ফেসবুক পোস্ট থেকে পণ্যের তথ্য সফলভাবে তৈরি হয়েছে!'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('import')}
                  className="text-blue-600 hover:underline font-bold text-[11px] cursor-pointer"
                >
                  পুনরায় সম্পাদনা
                </button>
              </div>

              {/* List of Extracted Products */}
              <div className="space-y-4">
                {extractedProducts.map((prod, idx) => {
                  const isSelected = selectedItemsToSave.includes(idx);
                  return (
                    <div 
                      key={`ext-prod-${idx}`} 
                      className={`p-4 rounded-2xl border transition-all ${
                        isSelected 
                          ? 'border-blue-300 bg-blue-50/20 shadow-xs' 
                          : 'border-slate-200 bg-slate-50/50 opacity-70'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3 border-b border-slate-100 pb-2.5">
                        <label className="flex items-center gap-2 text-xs font-black text-slate-800 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectItem(idx)}
                            className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                          />
                          <span>পণ্য #{idx + 1}: {prod.name || 'নতুন আইটেম'}</span>
                        </label>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full uppercase">
                          {prod.category}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Photo Column */}
                        <div className="space-y-1.5 sm:col-span-1">
                          <label className="text-[10px] font-extrabold text-slate-500">পণ্যের ছবি</label>
                          <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                            {prod.image ? (
                              <img 
                                src={prod.image} 
                                alt={prod.name}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-2 text-center">
                                <ShoppingBag className="w-6 h-6 mb-1" />
                                <span className="text-[9px]">ছবি নেই</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Details Column */}
                        <div className="sm:col-span-2 space-y-2.5">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500">নাম / টাইটেল</label>
                            <input
                              type="text"
                              value={prod.name}
                              onChange={(e) => handleUpdateExtractedField(idx, 'name', e.target.value)}
                              className="w-full text-xs font-bold bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] font-bold text-slate-500">বিক্রয় মূল্য (৳)</label>
                              <input
                                type="number"
                                value={prod.price || ''}
                                onChange={(e) => handleUpdateExtractedField(idx, 'price', Number(e.target.value))}
                                className="w-full text-xs font-black text-emerald-700 bg-white border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-500">আগের দাম (ছাড় ছাড়া ৳)</label>
                              <input
                                type="number"
                                value={prod.originalPrice || ''}
                                placeholder="ঐচ্ছিক"
                                onChange={(e) => handleUpdateExtractedField(idx, 'originalPrice', Number(e.target.value))}
                                className="w-full text-xs font-bold text-slate-500 bg-white border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-500">বিবরণ</label>
                            <textarea
                              rows={2}
                              value={prod.description}
                              onChange={(e) => handleUpdateExtractedField(idx, 'description', e.target.value)}
                              className="w-full text-[11px] bg-white border border-slate-200 rounded-xl p-2 text-slate-800 focus:ring-2 focus:ring-blue-500 font-medium"
                            />
                          </div>

                          {/* Highlights tags */}
                          {prod.highlights && prod.highlights.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {prod.highlights.map((h, hIdx) => (
                                <span key={hIdx} className="text-[9px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                                  ✓ {h}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bulk Select Options */}
              {extractedProducts.length > 1 && (
                <div className="flex items-center justify-between text-xs font-bold text-slate-600 pt-1">
                  <span>নির্বাচিত পণ্য: {selectedItemsToSave.length} / {extractedProducts.length}</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedItemsToSave(extractedProducts.map((_, i) => i))}
                      className="text-blue-600 hover:underline cursor-pointer text-[11px]"
                    >
                      সব সিলেক্ট করুন
                    </button>
                    <span>|</span>
                    <button
                      type="button"
                      onClick={() => setSelectedItemsToSave([])}
                      className="text-slate-500 hover:underline cursor-pointer text-[11px]"
                    >
                      সব বাদ দিন
                    </button>
                  </div>
                </div>
              )}

              {/* Commit Save Button */}
              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setActiveTab('import')}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  ফিরে যান
                </button>

                <button
                  type="button"
                  onClick={handleCommitImport}
                  disabled={isSaving || selectedItemsToSave.length === 0}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black px-7 py-2.5 rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>সংরক্ষণ হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>
                        {targetType === 'merchant_product' 
                          ? `${selectedItemsToSave.length}টি পণ্য দোকানে যুক্ত করুন` 
                          : targetType === 'c2c_marketplace'
                            ? 'মার্কেটপ্লেসে পোস্ট করুন'
                            : 'দোকান আপডেট করুন'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}

// ==========================================
// 🚀 FACEBOOK VIRAL SHARE & MARKETING MODAL
// ==========================================
export interface FacebookShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  productTitle?: string;
  productName?: string;
  price?: number;
  productPrice?: number;
  originalPrice?: number;
  shopName?: string;
  shopAddress?: string;
  phone?: string;
  shopPhone?: string;
  category?: string;
  image?: string;
  productImage?: string;
  appUrl?: string;
}

export function FacebookShareModal(props: FacebookShareModalProps) {
  const {
    isOpen,
    onClose,
    title = props.productTitle || props.productName || 'রেস্ট বাজার আকর্ষণীয় পণ্য',
    price = props.productPrice ?? props.price ?? 0,
    originalPrice = props.originalPrice,
    shopName = props.shopName || 'RestBazar Verified Seller',
    shopAddress = props.shopAddress || 'ঢাকা, বাংলাদেশ',
    phone = props.shopPhone || props.phone || '',
    category = props.category || 'shopping',
    image = props.productImage || props.image || '',
    appUrl = props.appUrl || (typeof window !== 'undefined' ? window.location.href : '')
  } = props;
  const [caption, setCaption] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [customNote, setCustomNote] = useState('');

  // Initial caption generation
  React.useEffect(() => {
    if (isOpen) {
      handleGenerateCaption();
    }
  }, [isOpen, title, price]);

  if (!isOpen) return null;

  const handleGenerateCaption = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/facebook-share/generate-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          price,
          originalPrice,
          shopName,
          shopAddress,
          phone,
          category,
          appUrl,
          customNote
        })
      });
      const data = await response.json();
      if (data.caption) {
        setCaption(data.caption);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(caption);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleOpenFacebookShare = () => {
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(appUrl)}&quote=${encodeURIComponent(caption)}`;
    window.open(shareUrl, '_blank', 'width=626,height=436');
  };

  const handleOpenMessengerShare = () => {
    const shareUrl = `fb-messenger://share/?link=${encodeURIComponent(appUrl)}&app_id=123456789`;
    window.open(shareUrl, '_blank');
  };

  const handleOpenWhatsappShare = () => {
    const shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(caption)}`;
    window.open(shareUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-lg my-auto overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white font-black text-lg shadow-inner">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black">ফেসবুক প্রমোশন ও ভাইরাল শেয়ার</h3>
              <p className="text-xs text-blue-100 font-medium">ফেসবুক পেজ, গ্রুপ ও টাইমলাইনে সহজেই পণ্য প্রচার করুন</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          
          {/* Item Quick Overview Card */}
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-3.5 rounded-2xl">
            {image && (
              <img 
                src={image} 
                alt={title} 
                className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0" 
                referrerPolicy="no-referrer"
              />
            )}
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-black text-slate-900 truncate">{title}</h4>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-black text-emerald-600">৳{price}</span>
                {originalPrice && originalPrice > price && (
                  <span className="text-[10px] text-slate-400 line-through">৳{originalPrice}</span>
                )}
                <span className="text-[10px] text-slate-500 truncate">• {shopName}</span>
              </div>
            </div>
          </div>

          {/* AI Caption Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>রেডিমেড ফেসবুক পোস্ট ক্যাপশন (AI Generated)</span>
              </label>
              <button
                type="button"
                onClick={handleGenerateCaption}
                disabled={isGenerating}
                className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isGenerating ? 'animate-spin' : ''}`} />
                <span>নতুন স্টাইলে লিখুন</span>
              </button>
            </div>
            <textarea
              rows={6}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-2xl p-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800 leading-relaxed"
            />
          </div>

          {/* 1-Click Copy and Share Buttons Grid */}
          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={handleCopyCaption}
              className={`w-full py-3 px-4 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
                isCopied 
                  ? 'bg-emerald-600 text-white shadow-emerald-500/20' 
                  : 'bg-slate-900 hover:bg-black text-white'
              }`}
            >
              {isCopied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>ক্যাপশন কপি হয়েছে! ফেসবুকে পেস্ট করুন</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>📋 ফেসবুক পোস্টের পুরো লেখা কপি করুন</span>
                </>
              )}
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleOpenFacebookShare}
                className="bg-[#1877F2] hover:bg-[#0c63d4] text-white font-black text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <span className="font-serif font-black text-sm">f</span>
                <span>ফেসবুকে শেয়ার করুন</span>
              </button>

              <button
                type="button"
                onClick={handleOpenWhatsappShare}
                className="bg-[#25D366] hover:bg-[#1faa4f] text-white font-black text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>হোয়াটসঅ্যাপে পাঠান</span>
              </button>
            </div>
          </div>

          {/* Helpful Tips Box */}
          <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3.5 text-[11px] text-amber-900 space-y-1">
            <div className="font-bold flex items-center gap-1 text-amber-950">
              <Info className="w-3.5 h-3.5 text-amber-600" />
              <span>মার্কেটিং টিপস:</span>
            </div>
            <p className="text-amber-800 leading-relaxed">
              উপরের কপি করা ক্যাপশনটি আপনার ফেসবুক বিজনেস পেজে বা লোকাল বাই-সেল গ্রুপে ফটোসহ পোস্ট দিন। গ্রাহকরা লিংকে ক্লিক করে সরাসরি রেস্ট বাজার অ্যাপে আপনার সাথে অর্ডার কনফার্ম করতে পারবে।
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
