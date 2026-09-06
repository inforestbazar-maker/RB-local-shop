import React, { useState, useMemo } from 'react';
import { 
  Search, ShoppingBag, Plus, Minus, Heart, ArrowRight, Tag, Compass, 
  Sparkles, Filter, Store, Percent, CheckCircle2, ChevronRight,
  Globe, ExternalLink, Eye, Send, PackageCheck, Laptop, AlertCircle
} from 'lucide-react';
import { Business, Product, User, BusinessCategory } from '../types';
import { CATEGORIES } from '../data/categories';
import { BangladeshiPaymentGatewayModal, PaymentGatewayDetails } from './BangladeshiPaymentGatewayModal';

import { Language } from '../translations';

interface AllProductsShopProps {
  currentUser: User;
  businesses: Business[];
  cart: { [productId: string]: { product: Product; quantity: number } };
  addToCart: (product: Product) => void;
  updateCartQty: (productId: string, delta: number) => void;
  setCart: React.Dispatch<React.SetStateAction<{ [productId: string]: { product: Product; quantity: number } }>>;
  onSelectBusiness: (biz: Business) => void;
  onOpenCheckout: () => void;
  categories?: any[];
  fetchDatabase?: () => void;
  setActiveTab?: (tab: any) => void;
  language?: Language;
}

export default function AllProductsShop({
  currentUser,
  businesses,
  cart,
  addToCart: propAddToCart,
  updateCartQty,
  setCart,
  onSelectBusiness,
  onOpenCheckout,
  categories,
  fetchDatabase,
  setActiveTab,
  language = 'bn'
}: AllProductsShopProps) {
  
  const categoriesList = categories && categories.length > 0 ? categories : CATEGORIES;
  const addToCart = (p: Product & { business: Business }) => {
    const isWholesaleBiz = p.business?.category === 'wholesale' || p.business?.isWholesale === true;
    const isVerifiedMerchantOrAdmin = currentUser?.role === 'admin' || (currentUser?.role === 'merchant' && currentUser?.isMerchantVerified === true);
    if (isWholesaleBiz && !isVerifiedMerchantOrAdmin) {
      if (currentUser?.role === 'merchant') {
        alert('দুঃখিত, এটি একটি পাইকারি পণ্য! আপনার মার্চেন্ট অ্যাকাউন্টটি এখনও ভেরিফাইড নয়। অ্যাডমিন কর্তৃক ট্রেড লাইসেন্স ভেরিফিকেশন সম্পন্ন হওয়া আবশ্যক।');
      } else {
        alert('দুঃখিত, এটি একটি পাইকারি পণ্য! এটি কিনতে দয়া করে আপনার অ্যাকাউন্টটি "মার্চেন্ট" (খুচরা বিক্রেতা) রোলে রূপান্তর করুন এবং ট্রেড লাইসেন্স সাবমিট করে ভেরিফাই করুন।');
      }
      return;
    }
    propAddToCart(p);
  };

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<BusinessCategory | 'all'>('all');
  const [priceLimit, setPriceLimit] = useState<number>(50000);
  const [sortOption, setSortOption] = useState<'popular' | 'lowToHigh' | 'highToLow'>('popular');
  const [shopFilterMode, setShopFilterMode] = useState<'all' | 'in_app' | 'linked_websites' | 'wholesale'>('all');

  // Website Live Preview & Order Modal state
  const [selectedWebShopForModal, setSelectedWebShopForModal] = useState<Business | null>(null);
  const [selectedWebShopForOrder, setSelectedWebShopForOrder] = useState<Business | null>(null);
  
  // Custom Web Order Form state
  const [webItemName, setWebItemName] = useState('');
  const [webItemUrl, setWebItemUrl] = useState('');
  const [webItemPrice, setWebItemPrice] = useState<number>(100);
  const [webItemQty, setWebItemQty] = useState<number>(1);
  const [webItemNotes, setWebItemNotes] = useState('');
  const [webDeliveryAddress, setWebDeliveryAddress] = useState(currentUser?.location?.address || '');
  const [webPaymentMethod, setWebPaymentMethod] = useState<'cod' | 'bkash' | 'nagad' | 'rocket'>('cod');
  const [webOrderLoading, setWebOrderLoading] = useState(false);
  const [showWebPaymentGateway, setShowWebPaymentGateway] = useState(false);

  // Compute businesses that have linked website URLs or online catalog support
  const linkedShops = useMemo(() => {
    return businesses
      .filter(b => b.type === 'shop' && b.isApproved !== false)
      .map(b => ({
        ...b,
        websiteUrl: (b.websiteUrl && b.websiteUrl.trim().length > 0)
          ? b.websiteUrl
          : `https://${b.id.toLowerCase().replace(/[^a-z0-9]/g, '')}.restbazar-online.com`
      }));
  }, [businesses]);

  const handlePlaceWebProductOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWebShopForOrder) return;
    if (!webItemName.trim()) {
      alert('অনুগ্রহ করে পণ্যের নাম বা বিবরণ প্রদান করুন।');
      return;
    }
    if (!webDeliveryAddress.trim()) {
      alert('অনুগ্রহ করে ডেলিভারি ঠিকানা লিখুন।');
      return;
    }

    // If MFS method is selected, open Payment Gateway Modal!
    if (webPaymentMethod === 'bkash' || webPaymentMethod === 'nagad' || webPaymentMethod === 'rocket') {
      setShowWebPaymentGateway(true);
      return;
    }

    setWebOrderLoading(true);
    try {
      const totalAmount = (Number(webItemPrice) || 0) * (Number(webItemQty) || 1);
      const deliveryAmt = selectedWebShopForOrder.deliveryCharge || 0;
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: selectedWebShopForOrder.id,
          businessName: selectedWebShopForOrder.name,
          businessPhone: selectedWebShopForOrder.phone,
          businessCategory: selectedWebShopForOrder.category,
          userPhone: currentUser.phone,
          userName: currentUser.name,
          userAddress: webDeliveryAddress,
          type: selectedWebShopForOrder.type || 'shop',
          items: [
            {
              name: `🌐 [ওয়েবসাইট প্রোডাক্ট] ${webItemName}${webItemUrl ? ` (${webItemUrl})` : ''}`,
              price: Number(webItemPrice) || 0,
              quantity: Number(webItemQty) || 1,
              notes: webItemNotes
            }
          ],
          totalPrice: totalAmount,
          deliveryCharge: deliveryAmt,
          paymentMethod: 'cod',
          paymentStatus: 'pending',
          bookingDate: new Date().toISOString().split('T')[0],
        })
      });

      if (response.ok) {
        alert('আপনার ক্যাশ অন ডেলিভারি ওয়েবসাইট প্রোডাক্ট অর্ডারটি সফলভাবে মার্চেন্ট ড্যাশবোর্ডে পাঠানো হয়েছে!');
        setSelectedWebShopForOrder(null);
        setWebItemName('');
        setWebItemUrl('');
        setWebItemNotes('');
        if (fetchDatabase) fetchDatabase();
        if (setActiveTab) setActiveTab('bookings');
      } else {
        alert('অর্ডার সাবমিট করতে ব্যর্থ হয়েছে। আবার চেষ্টা করুন।');
      }
    } catch (err) {
      console.error(err);
      alert('অর্ডার সাবমিট করতে সমস্যা হয়েছে।');
    } finally {
      setWebOrderLoading(false);
    }
  };

  const handleWebPaymentGatewaySuccess = async (details: PaymentGatewayDetails) => {
    if (!selectedWebShopForOrder) return;
    setWebOrderLoading(true);
    try {
      const totalAmount = (Number(webItemPrice) || 0) * (Number(webItemQty) || 1);
      const deliveryAmt = selectedWebShopForOrder.deliveryCharge || 0;
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: selectedWebShopForOrder.id,
          businessName: selectedWebShopForOrder.name,
          businessPhone: selectedWebShopForOrder.phone,
          businessCategory: selectedWebShopForOrder.category,
          userPhone: currentUser.phone,
          userName: currentUser.name,
          userAddress: webDeliveryAddress,
          type: selectedWebShopForOrder.type || 'shop',
          items: [
            {
              name: `🌐 [ওয়েবসাইট প্রোডাক্ট] ${webItemName}${webItemUrl ? ` (${webItemUrl})` : ''}`,
              price: Number(webItemPrice) || 0,
              quantity: Number(webItemQty) || 1,
              notes: webItemNotes
            }
          ],
          totalPrice: totalAmount,
          deliveryCharge: deliveryAmt,
          paymentMethod: details.method,
          paymentStatus: 'paid',
          trxId: details.trxId,
          bookingDate: new Date().toISOString().split('T')[0],
        })
      });

      if (response.ok) {
        setShowWebPaymentGateway(false);
        setSelectedWebShopForOrder(null);
        setWebItemName('');
        setWebItemUrl('');
        setWebItemNotes('');
        if (fetchDatabase) fetchDatabase();
        if (setActiveTab) setActiveTab('bookings');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setWebOrderLoading(false);
    }
  };

  // Compile all available products across all approved businesses
  const compiledProducts = useMemo(() => {
    const list: Array<Product & { business: Business; isWebsiteProduct?: boolean }> = [];
    businesses.forEach(biz => {
      // Show products only for approved businesses unless user is admin or owner
      const isOwner = currentUser && biz.ownerPhone === currentUser.phone;
      const isAdmin = currentUser && currentUser.role === 'admin';
      const isApproved = isAdmin || isOwner || biz.isApproved !== false;

      if (isApproved && biz.type === 'shop') {
        const effectiveWebUrl = (biz.websiteUrl && biz.websiteUrl.trim().length > 0)
          ? biz.websiteUrl
          : `https://${biz.id.toLowerCase().replace(/[^a-z0-9]/g, '')}.restbazar-online.com`;

        const bizWithWeb: Business = {
          ...biz,
          websiteUrl: effectiveWebUrl
        };

        if (biz.products && biz.products.length > 0) {
          biz.products.forEach(p => {
            if (p.isAvailable && p.isApproved !== false) {
              list.push({
                ...p,
                business: bizWithWeb,
                isWebsiteProduct: true
              });
            }
          });
        }

        // Generate sample featured web catalog products for every store
        const sampleWebProducts = [
          {
            id: `web_prod_1_${biz.id}`,
            name: `${biz.name} - প্রিমিয়াম স্টাইলিশ পণ্য (অনলাইন ক্যাটালগ)`,
            price: 450,
            originalPrice: 650,
            description: `ওয়েবসাইট: ${effectiveWebUrl}। সরাসরি ক্লিক ছাড়াই সম্পূর্ণ অনলাইন প্রোডাক্ট সংগ্রহ থেকে যেকোনো পণ্য পছন্দ করে অর্ডার করুন।`,
            image: biz.logo || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
            isAvailable: true,
          },
          {
            id: `web_prod_2_${biz.id}`,
            name: `${biz.name} - সেরা মানের ই-কমার্স হট কালেকশন`,
            price: 890,
            originalPrice: 1200,
            description: `ওয়েবসাইট: ${effectiveWebUrl}। কোনো থার্ডপার্টি লিংকে না গিয়ে অ্যাপের ভেতরেই সরাসরি কেনাকাটা করুন।`,
            image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
            isAvailable: true,
          }
        ];

        sampleWebProducts.forEach(sp => {
          if (!list.some(existing => existing.id === sp.id)) {
            list.push({
              ...sp,
              business: bizWithWeb,
              isWebsiteProduct: true
            });
          }
        });
      }
    });
    return list;
  }, [businesses, currentUser]);

  // Filter and Sort compiled products
  const filteredProducts = useMemo(() => {
    let result = [...compiledProducts];

    // Filter by shopFilterMode (linked_websites vs in_app vs wholesale vs all)
    if (shopFilterMode === 'linked_websites') {
      result = result.filter(p => p.isWebsiteProduct || Boolean(p.business.websiteUrl && p.business.websiteUrl.trim().length > 0));
    } else if (shopFilterMode === 'in_app') {
      result = result.filter(p => !p.business.websiteUrl || p.business.websiteUrl.includes('.restbazar-online.com'));
    } else if (shopFilterMode === 'wholesale') {
      result = result.filter(p => p.isWholesaleAvailable || p.business.isWholesale || p.business.category === 'wholesale');
    }

    // Category filter
    if (selectedCategory !== 'all') {
      result = result.filter(p => p.business.category === selectedCategory);
    }

    // Search query filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        p => 
          p.name.toLowerCase().includes(q) || 
          (p.description || '').toLowerCase().includes(q) ||
          p.business.name.toLowerCase().includes(q)
      );
    }

    // Price limit filter
    result = result.filter(p => p.price <= priceLimit);

    // Sorting
    if (sortOption === 'lowToHigh') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortOption === 'highToLow') {
      result.sort((a, b) => b.price - a.price);
    } else {
      // popular sorting by higher discount percentage
      result.sort((a, b) => {
        const discA = a.originalPrice ? (a.originalPrice - a.price) / a.originalPrice : 0;
        const discB = b.originalPrice ? (b.originalPrice - b.price) / b.originalPrice : 0;
        return discB - discA;
      });
    }

    return result;
  }, [compiledProducts, shopFilterMode, selectedCategory, search, priceLimit, sortOption]);

  // Group products by business category for 'all' landing view
  const groupedProducts = useMemo(() => {
    const groups: { [key: string]: Array<Product & { business: Business }> } = {};
    filteredProducts.forEach(p => {
      const cat = p.business.category;
      if (!groups[cat]) {
        groups[cat] = [];
      }
      groups[cat].push(p);
    });
    return groups;
  }, [filteredProducts]);

  // Direct Buy Now bypassing cart
  const handleBuyNow = (product: Product, biz: Business) => {
    const isWholesaleBiz = biz?.category === 'wholesale' || biz?.isWholesale === true;
    const isVerifiedMerchantOrAdmin = currentUser?.role === 'admin' || (currentUser?.role === 'merchant' && currentUser?.isMerchantVerified === true);
    if (isWholesaleBiz && !isVerifiedMerchantOrAdmin) {
      if (currentUser?.role === 'merchant') {
        alert('দুঃখিত, এটি একটি পাইকারি পণ্য! আপনার মার্চেন্ট অ্যাকাউন্টটি এখনও ভেরিফাইড নয়। অ্যাডমিন কর্তৃক ট্রেড লাইসেন্স ভেরিফিকেশন সম্পন্ন হওয়া আবশ্যক।');
      } else {
        alert('দুঃখিত, এটি একটি পাইকারি পণ্য! এটি কিনতে দয়া করে আপনার অ্যাকাউন্টটি "মার্চেন্ট" (খুচরা বিক্রেতা) রোলে রূপান্তর করুন এবং ট্রেড লাইসেন্স সাবমিট করে ভেরিফাই করুন।');
      }
      return;
    }
    onSelectBusiness(biz);
    setCart({
      [product.id]: { product, quantity: 1 }
    });
    setTimeout(() => {
      onOpenCheckout();
    }, 200);
  };

  // Get display names and classes for categories
  const getCategoryDetails = (catId: string) => {
    const found = categoriesList.find(c => c.id === catId);
    return {
      name: found ? (language === 'en' ? (found.nameEnglish || found.nameBangla) : found.nameBangla) : (language === 'en' ? 'Other Categories' : 'অন্যান্য ক্যাটাগরি'),
      english: found ? found.nameEnglish : 'Others',
      color: found ? found.color : 'bg-slate-50 text-slate-700'
    };
  };

  return (
    <div className="space-y-6">
      
      {/* Mega Shop Banner Header */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-900 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute left-1/3 top-0 -translate-y-12 w-48 h-48 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1.5 max-w-xl">
            <span className="bg-white/25 text-[9px] font-black tracking-widest uppercase px-3 py-1 rounded-full border border-white/10 flex items-center gap-1.5 w-fit">
              <Sparkles className="w-3 h-3 text-yellow-300 animate-pulse" />
              মেগা শপিং হাব (All Products Shop)
            </span>
            <h2 className="text-lg sm:text-xl font-black tracking-tight mt-1">
              সব স্থানীয় বিশ্বস্ত দোকান এখন একসাথে এক ক্লিকে!
            </h2>
            <p className="text-[11px] text-indigo-100 leading-relaxed font-semibold">
              ধানমন্ডির সেরা সব মুদি সামগ্রী, ওষুধ ও রেস্টুরেন্টের সব পণ্য এক জায়গায় সার্চ করুন। সরাসরি অর্ডার ও দ্রুত হোম ডেলিভারি সুবিধা।
            </p>
          </div>
          <div className="bg-white/10 border border-white/20 backdrop-blur-md rounded-2xl p-3.5 text-center shrink-0 min-w-[140px]">
            <span className="block text-[10px] text-indigo-200 font-extrabold uppercase">মোট পণ্য সংখ্যা</span>
            <span className="text-2xl font-black text-white">{compiledProducts.length} টি</span>
          </div>
        </div>
      </div>

      {/* Catalog Mode Selection Switcher */}
      <div className="bg-slate-100 p-1.5 rounded-2xl flex flex-wrap items-center justify-between gap-1 text-xs font-bold shadow-inner">
        <button
          onClick={() => setShopFilterMode('all')}
          className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            shopFilterMode === 'all'
              ? 'bg-white text-indigo-700 shadow-md font-black'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>✨</span>
          <span>সকল প্রোডাক্ট ও শপ ({compiledProducts.length})</span>
        </button>

        <button
          onClick={() => setShopFilterMode('linked_websites')}
          className={`flex-1 min-w-[150px] py-2.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            shopFilterMode === 'linked_websites'
              ? 'bg-indigo-600 text-white shadow-md font-black'
              : 'text-slate-600 hover:text-slate-900 font-bold'
          }`}
        >
          <Globe className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>🌐 লিংকড অনলাইন ওয়েবসাইট শপসমূহ ({linkedShops.length})</span>
        </button>

        <button
          onClick={() => setShopFilterMode('in_app')}
          className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            shopFilterMode === 'in_app'
              ? 'bg-white text-slate-900 shadow-md font-black'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShoppingBag className="w-4 h-4 text-blue-600" />
          <span>🛍️ ইন-অ্যাপ প্রোডাক্ট ক্যাটালগ</span>
        </button>
      </div>

      {/* Featured Linked Online Website Shops Section */}
      {linkedShops.length > 0 && (shopFilterMode === 'all' || shopFilterMode === 'linked_websites') && (
        <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950 p-5 sm:p-6 rounded-3xl text-white shadow-xl border border-indigo-700/50 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-indigo-800/80 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-xl shrink-0">
                🌐
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-black text-white">
                    লিংকড অনলাইন ই-কমার্স শপ ও ওয়েবসাইট প্রোডাক্টস
                  </h3>
                  <span className="bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                    LIVE WEBSITES
                  </span>
                </div>
                <p className="text-[11px] text-indigo-200 mt-0.5">
                  মার্চেন্টদের লিঙ্কড অফিশিয়াল অনলাইন ই-কমার্স ওয়েবসাইটের সব প্রোডাক্ট ক্যাটালগ সরাসরি লাইভ ব্রাউজ করুন এবং অর্ডার প্লেস করুন।
                </p>
              </div>
            </div>

            <span className="text-xs font-bold text-indigo-300 bg-indigo-900/60 px-3 py-1 rounded-xl border border-indigo-700/50">
              মোট লিংকড শপ: {linkedShops.length} টি
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {linkedShops.map(shop => (
              <div 
                key={shop.id}
                className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 transition-all hover:bg-white/15 flex flex-col justify-between gap-3 shadow-lg"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white/20 overflow-hidden border border-white/20 shrink-0 flex items-center justify-center font-black text-xl text-white">
                      {shop.logo ? (
                        <img src={shop.logo} alt={shop.name} className="w-full h-full object-cover" />
                      ) : (
                        shop.name.charAt(0)
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white flex items-center gap-1.5">
                        <span>{shop.name}</span>
                        <span className="bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 text-[9px] font-extrabold px-1.5 py-0.2 rounded">
                          ✓ CONNECTED
                        </span>
                      </h4>
                      <p className="text-[11px] text-indigo-200 font-mono mt-0.5 truncate max-w-[200px] sm:max-w-[250px]">
                        🔗 {shop.websiteUrl}
                      </p>
                      <p className="text-[10px] text-slate-300 mt-1 flex items-center gap-1">
                        <span>📍 {shop.address || shop.thana || 'ধানমন্ডি'}</span>
                        <span>•</span>
                        <span>📞 {shop.phone}</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedWebShopForModal(shop)}
                    className="flex-1 bg-white text-indigo-950 hover:bg-indigo-50 font-black text-xs py-2 px-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-indigo-600" />
                    <span>👁️ লাইভ ক্যাটালগ দেখুন</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedWebShopForOrder(shop);
                      setWebItemName('');
                      setWebItemUrl('');
                      setWebItemPrice(200);
                      setWebItemQty(1);
                    }}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs py-2 px-3 rounded-xl transition-all shadow-md border border-indigo-400/30 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-yellow-300" />
                    <span>🛒 প্রোডাক্ট অর্ডার করুন</span>
                  </button>

                  <a
                    href={shop.websiteUrl?.startsWith('http') ? shop.websiteUrl : `https://${shop.websiteUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-white/15 hover:bg-white/25 text-white font-bold text-xs p-2 rounded-xl border border-white/20 transition-all flex items-center justify-center cursor-pointer"
                    title="ব্রাউজারে সরাসরি খুলুন"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Smart Filters and Categories Selection Panel */}
      <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm space-y-4">
        
        {/* Search Input Bar */}
        <div className="relative">
          <span className="absolute left-3.5 top-3.5 text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="পণ্য বা নির্দিষ্ট দোকানের নাম লিখে সার্চ করুন (যেমন: মিনিকেট চাল, নাপা, বার্গার)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 font-semibold transition-all"
          />
          {search && (
            <button 
              onClick={() => setSearch('')}
              className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Business Category Selection Chips */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] text-slate-400 font-black uppercase tracking-wider flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-blue-600" />
              ক্যাটাগরি ফিল্টার করুন
            </label>
            {selectedCategory !== 'all' && (
              <button 
                onClick={() => setSelectedCategory('all')}
                className="text-[10px] font-black text-rose-500 hover:underline cursor-pointer"
              >
                ✕ সব পণ্য দেখুন
              </button>
            )}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {/* All Products button */}
            <button
              onClick={() => { setSelectedCategory('all'); setShopFilterMode('all'); }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black border whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === 'all' && shopFilterMode === 'all'
                  ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-100'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>সব পণ্য ({compiledProducts.length})</span>
            </button>

            {/* Special Online Category Chip */}
            <button
              onClick={() => { setShopFilterMode('linked_websites'); setSelectedCategory('all'); }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black border whitespace-nowrap transition-all cursor-pointer ${
                shopFilterMode === 'linked_websites'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 border-indigo-600 text-white shadow-md ring-2 ring-indigo-400/30'
                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 font-bold'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
              <span>🌐 অনলাইন ক্যাটাগরি ({linkedShops.length})</span>
            </button>

            {/* Wholesale Products Chip */}
            <button
              onClick={() => { setShopFilterMode('wholesale'); setSelectedCategory('all'); }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black border whitespace-nowrap transition-all cursor-pointer ${
                shopFilterMode === 'wholesale'
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-md ring-2 ring-emerald-400/30'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200 font-bold'
              }`}
            >
              <span>🏢</span>
              <span>পাইকারি পণ্য ({compiledProducts.filter(p => p.isWholesaleAvailable || p.business.isWholesale || p.business.category === 'wholesale').length})</span>
            </button>

            {/* List shop types of categories */}
            {categoriesList.filter(c => c.id === 'grocery' || c.id === 'pharmacy' || c.id === 'restaurant' || c.id === 'wholesale' || compiledProducts.some(p => p.business.category === c.id)).map(cat => {
              const count = compiledProducts.filter(p => p.business.category === cat.id).length;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black border whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-ping" />
                  <span>{cat.nameBangla} ({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Price Slider & Sorting Option Dropdown Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-bold text-slate-500">
              <span>মূল্য সীমা নির্ধারণ</span>
              <span className="text-blue-600 font-extrabold">৳ ০ - ৳ {priceLimit}</span>
            </div>
            <input
              type="range"
              min="10"
              max="5000"
              step="20"
              value={priceLimit}
              onChange={(e) => setPriceLimit(Number(e.target.value))}
              className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 text-xs">
            <span className="text-slate-400 font-bold">পণ্য সাজান (Sort By):</span>
            <select
              value={sortOption}
              onChange={(e: any) => setSortOption(e.target.value)}
              className="text-xs font-black border border-slate-200 rounded-xl p-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="popular">জনপ্রিয় ও ডিসকাউন্ট অফার</option>
              <option value="lowToHigh">দাম: কম থেকে বেশি</option>
              <option value="highToLow">দাম: বেশি থেকে কম</option>
            </select>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 font-bold flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100/60">
          <span>প্রাপ্ত ফলাফল: {filteredProducts.length} টি পণ্য পাওয়া গেছে</span>
          {selectedCategory !== 'all' && (
            <span>সক্রিয় ক্যাটাগরি: <strong className="text-blue-600">{getCategoryDetails(selectedCategory).name}</strong></span>
          )}
        </div>
      </div>

      {/* Product listings */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-200 rounded-3xl p-16 text-center space-y-3">
          <ShoppingBag className="w-12 h-12 text-slate-300 stroke-1 mx-auto animate-pulse" />
          <h4 className="text-sm font-black text-slate-600">কোনো পণ্য পাওয়া যায়নি!</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            আপনার অনুসন্ধান বা প্রাইস লিমিটের মধ্যে কোনো পণ্য পাওয়া যায়নি। অনুগ্রহ করে সার্চ কী-ওয়ার্ড পরিবর্তন করুন বা প্রাইস ফিল্টার বাড়িয়ে আবার চেষ্টা করুন।
          </p>
        </div>
      ) : selectedCategory === 'all' && !search.trim() && shopFilterMode !== 'linked_websites' ? (
        /* Render Category-wise separate blocks for beautiful organized layout */
        <div className="space-y-8">
          {Object.keys(groupedProducts).map(catId => {
            const { name, color } = getCategoryDetails(catId);
            const products = groupedProducts[catId];
            return (
              <div key={catId} className="space-y-3.5">
                <div className="flex items-center justify-between border-b pb-2 border-slate-100">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                    <span className="w-2.5 h-4.5 bg-blue-600 rounded-xs inline-block" />
                    {name} ({products.length} টি পণ্য)
                  </h3>
                  <button 
                    onClick={() => setSelectedCategory(catId as BusinessCategory)}
                    className="text-[10px] font-black text-blue-600 hover:text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg transition-all flex items-center gap-0.5"
                  >
                    <span>সব দেখুন</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {products.slice(0, 4).map((p) => {
                    const discountPercent = p.originalPrice && p.originalPrice > p.price
                      ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
                      : null;
                    const qtyInCart = cart[p.id]?.quantity || 0;

                    return (
                      <div 
                        key={p.id}
                        className="bg-white border border-slate-100 rounded-2xl overflow-hidden p-3.5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group relative"
                      >
                        {discountPercent && (
                          <span className="absolute top-2.5 left-2.5 z-10 bg-rose-500 text-white font-black text-[8px] px-1.5 py-0.5 rounded shadow-sm uppercase">
                            {discountPercent}% OFF
                          </span>
                        )}

                        {/* Product Image */}
                        <div className="aspect-square bg-slate-50 rounded-xl overflow-hidden relative mb-2.5">
                          {p.image ? (
                            <img 
                              src={p.image} 
                              alt={p.name} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300 text-[10px] font-bold">
                              No Image
                            </div>
                          )}
                        </div>

                        {/* Card Info body */}
                        <div className="space-y-1 flex-1 flex flex-col justify-between">
                          <div>
                            <h4 className="text-[11px] font-black text-slate-850 leading-snug line-clamp-1">
                              {p.name}
                            </h4>
                            
                            {/* Clickable Business Shop connection */}
                            <button 
                              type="button"
                              onClick={() => {
                                onSelectBusiness(p.business);
                                setTimeout(() => {
                                  document.getElementById('selected-store-view')?.scrollIntoView({ behavior: 'smooth' });
                                }, 200);
                              }}
                              className="text-[9px] font-black text-blue-600 hover:underline flex items-center gap-0.5 mt-0.5 cursor-pointer block text-left"
                            >
                              <Store className="w-2.5 h-2.5 text-blue-600 shrink-0" />
                              <span className="truncate max-w-[120px]">{p.business.name}</span>
                            </button>

                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-xs font-black text-emerald-600">৳{p.price}</span>
                              {p.originalPrice && (
                                <span className="line-through text-[9px] text-slate-400">৳{p.originalPrice}</span>
                              )}
                            </div>
                            {(p.isWholesaleAvailable || p.business?.isWholesale || p.business?.category === 'wholesale') && (
                              <div className="pt-0.5">
                                <span className="text-[9px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded-md inline-flex items-center gap-0.5">
                                  <span>🏢</span>
                                  <span>পাইকারি: ৳{p.wholesalePrice || Math.round(p.price * (1 - (p.business?.wholesaleDiscountPercentage || 10) / 100))}</span>
                                  <span className="opacity-75 font-normal">({p.wholesaleMinQty || p.business?.wholesaleMinQtyDefault || 5}+ {p.wholesaleUnit || 'পিস'})</span>
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Cart Add / Quantity Selector & Buy Now Controls */}
                          <div className="pt-2 mt-2 border-t border-slate-50 flex flex-col gap-1.5">
                            {qtyInCart > 0 ? (
                              <div className="flex items-center justify-between bg-slate-50 border border-slate-150 rounded-xl p-0.5">
                                <button 
                                  type="button"
                                  onClick={() => updateCartQty(p.id, -1)}
                                  className="w-6 h-6 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg shadow-2xs hover:bg-slate-100"
                                >
                                  -
                                </button>
                                <span className="font-extrabold text-xs text-slate-850 px-1">{qtyInCart}</span>
                                <button 
                                  type="button"
                                  onClick={() => updateCartQty(p.id, 1)}
                                  className="w-6 h-6 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg shadow-2xs hover:bg-slate-100"
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  onSelectBusiness(p.business);
                                  addToCart(p);
                                }}
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black text-[9px] py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                              >
                                <Plus className="w-3 h-3 text-emerald-400" />
                                <span>কার্টে যোগ করুন</span>
                              </button>
                            )}

                            {/* Direct Buy Now Button */}
                            <button
                              type="button"
                              onClick={() => {
                                if (p.isWebsiteProduct) {
                                  setSelectedWebShopForOrder(p.business);
                                  setWebItemName(p.name);
                                  setWebItemUrl(p.business.websiteUrl || '');
                                  setWebItemPrice(p.price);
                                  setWebItemQty(1);
                                } else {
                                  handleBuyNow(p, p.business);
                                }
                              }}
                              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black text-[8px] py-1 px-1 rounded-lg uppercase transition-all tracking-wider flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <span>📦 {p.isWebsiteProduct ? 'সরাসরি অনলাইন অর্ডার' : 'সরাসরি কিনুন (Buy Now)'}</span>
                            </button>

                            {p.isWebsiteProduct && (
                              <button
                                type="button"
                                onClick={() => setSelectedWebShopForModal(p.business)}
                                className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[8px] py-0.5 px-1 rounded border border-indigo-200 transition-all cursor-pointer flex items-center justify-center gap-1"
                              >
                                <Eye className="w-2.5 h-2.5 text-indigo-600" />
                                <span>🌐 ওয়েবসাইট ভিউ</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Render uniform grid list when filtered or searched */
        <div className="space-y-4">
          {shopFilterMode === 'linked_websites' && (
            <div className="bg-gradient-to-r from-indigo-950 via-indigo-900 to-slate-900 p-4 rounded-2xl text-white flex items-center justify-between border border-indigo-700/50 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center text-xl shrink-0 font-bold">
                  🌐
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs sm:text-sm font-black text-white">
                      অনলাইন ক্যাটাগরি - লিংকড ওয়েবসাইটের প্রোডাক্টসমূহ
                    </h3>
                    <span className="bg-emerald-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                      ONLINE WEBSITES
                    </span>
                  </div>
                  <p className="text-[11px] text-indigo-200 mt-0.5">
                    মোট {filteredProducts.length} টি প্রোডাক্ট পাওয়া গেছে। যেকোনো প্রোডাক্টে ক্লিক করে সরাসরি ই-কমার্স ওয়েবসাইট ক্যাটালগ দেখুন ও অর্ডার সম্পন্ন করুন।
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {filteredProducts.map((p) => {
            const discountPercent = p.originalPrice && p.originalPrice > p.price
              ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
              : null;
            const qtyInCart = cart[p.id]?.quantity || 0;

            return (
              <div 
                key={p.id}
                className="bg-white border border-slate-100 rounded-2xl overflow-hidden p-3.5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group relative"
              >
                {discountPercent && (
                  <span className="absolute top-2.5 left-2.5 z-10 bg-rose-500 text-white font-black text-[8px] px-1.5 py-0.5 rounded shadow-sm uppercase">
                    {discountPercent}% OFF
                  </span>
                )}

                {/* Product Image */}
                <div className="aspect-square bg-slate-50 rounded-xl overflow-hidden relative mb-2.5">
                  {p.image ? (
                    <img 
                      src={p.image} 
                      alt={p.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300 text-[10px] font-bold">
                      No Image
                    </div>
                  )}
                </div>

                {/* Card Info body */}
                <div className="space-y-1 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-[11px] font-black text-slate-850 leading-snug line-clamp-1">
                      {p.name}
                    </h4>
                    
                    {/* Clickable Business Shop connection */}
                    <button 
                      type="button"
                      onClick={() => {
                        onSelectBusiness(p.business);
                        setTimeout(() => {
                          document.getElementById('selected-store-view')?.scrollIntoView({ behavior: 'smooth' });
                        }, 200);
                      }}
                      className="text-[9px] font-black text-blue-600 hover:underline flex items-center gap-0.5 mt-0.5 cursor-pointer block text-left"
                    >
                      <Store className="w-2.5 h-2.5 text-blue-600 shrink-0" />
                      <span className="truncate max-w-[120px]">{p.business.name}</span>
                    </button>

                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-xs font-black text-emerald-600">৳{p.price}</span>
                      {p.originalPrice && (
                        <span className="line-through text-[9px] text-slate-400">৳{p.originalPrice}</span>
                      )}
                    </div>
                    {(p.isWholesaleAvailable || p.business?.isWholesale || p.business?.category === 'wholesale') && (
                      <div className="pt-0.5">
                        <span className="text-[9px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded-md inline-flex items-center gap-0.5">
                          <span>🏢</span>
                          <span>পাইকারি: ৳{p.wholesalePrice || Math.round(p.price * (1 - (p.business?.wholesaleDiscountPercentage || 10) / 100))}</span>
                          <span className="opacity-75 font-normal">({p.wholesaleMinQty || p.business?.wholesaleMinQtyDefault || 5}+ {p.wholesaleUnit || 'পিস'})</span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Cart Add / Quantity Selector & Buy Now Controls */}
                  <div className="pt-2 mt-2 border-t border-slate-50 flex flex-col gap-1.5">
                    {qtyInCart > 0 ? (
                      <div className="flex items-center justify-between bg-slate-50 border border-slate-150 rounded-xl p-0.5">
                        <button 
                          type="button"
                          onClick={() => updateCartQty(p.id, -1)}
                          className="w-6 h-6 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg shadow-2xs hover:bg-slate-100"
                        >
                          -
                        </button>
                        <span className="font-extrabold text-xs text-slate-850 px-1">{qtyInCart}</span>
                        <button 
                          type="button"
                          onClick={() => updateCartQty(p.id, 1)}
                          className="w-6 h-6 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg shadow-2xs hover:bg-slate-100"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectBusiness(p.business);
                          addToCart(p);
                        }}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black text-[9px] py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                      >
                        <Plus className="w-3 h-3 text-emerald-400" />
                        <span>কার্টে যোগ করুন</span>
                      </button>
                    )}

                    {/* Direct Buy Now Button */}
                    <button
                      type="button"
                      onClick={() => {
                        if (p.isWebsiteProduct) {
                          setSelectedWebShopForOrder(p.business);
                          setWebItemName(p.name);
                          setWebItemUrl(p.business.websiteUrl || '');
                          setWebItemPrice(p.price);
                          setWebItemQty(1);
                        } else {
                          handleBuyNow(p, p.business);
                        }
                      }}
                      className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black text-[8px] py-1 px-1 rounded-lg uppercase transition-all tracking-wider flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>📦 {p.isWebsiteProduct ? 'সরাসরি অনলাইন অর্ডার' : 'সরাসরি কিনুন (Buy Now)'}</span>
                    </button>

                    {p.isWebsiteProduct && (
                      <button
                        type="button"
                        onClick={() => setSelectedWebShopForModal(p.business)}
                        className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[8px] py-0.5 px-1 rounded border border-indigo-200 transition-all cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Eye className="w-2.5 h-2.5 text-indigo-600" />
                        <span>🌐 ওয়েবসাইট ভিউ</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        </div>
      )}

      {/* ================= MODAL 1: LIVE WEBSITE CATALOG PREVIEW ================= */}
      {selectedWebShopForModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-5xl h-[92vh] rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col">
            {/* Header bar */}
            <div className="p-3.5 sm:p-4 bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white flex items-center justify-between shrink-0 border-b border-indigo-800/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center text-xl shrink-0 font-bold">
                  🌐
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs sm:text-sm font-black text-white">
                      {selectedWebShopForModal.name} - লাইভ অনলাইন শপ
                    </h3>
                    <span className="bg-emerald-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                      CONNECTED
                    </span>
                  </div>
                  <p className="text-[10px] text-indigo-200 font-mono truncate max-w-xs sm:max-w-md">
                    {selectedWebShopForModal.websiteUrl}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedWebShopForOrder(selectedWebShopForModal);
                    setSelectedWebShopForModal(null);
                  }}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs px-3.5 py-2 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span className="hidden sm:inline">প্রোডাক্ট অর্ডার করুন</span>
                  <span className="sm:hidden">অর্ডার</span>
                </button>

                <a
                  href={selectedWebShopForModal.websiteUrl?.startsWith('http') ? selectedWebShopForModal.websiteUrl : `https://${selectedWebShopForModal.websiteUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs p-2 rounded-xl transition-all border border-white/20 cursor-pointer hidden sm:flex items-center gap-1"
                  title="নতুন ট্যাবে খুলুন"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>

                <button
                  onClick={() => setSelectedWebShopForModal(null)}
                  className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white font-black text-sm flex items-center justify-center transition-all cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Live iframe container */}
            <div className="relative flex-1 w-full bg-slate-950 overflow-hidden">
              <iframe
                src={selectedWebShopForModal.websiteUrl?.startsWith('http') ? selectedWebShopForModal.websiteUrl : `https://${selectedWebShopForModal.websiteUrl}`}
                title={`${selectedWebShopForModal.name} Website Catalog`}
                className="w-full h-full border-0"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              />
            </div>

            {/* Bottom Sticky Action Bar */}
            <div className="p-3 bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800 shrink-0">
              <div className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
                <span className="text-slate-300 font-medium">
                  পছন্দের প্রোডাক্ট খুঁজে পেয়েছেন? অফিশিয়াল ওয়েবসাইটে দাম ও নাম দেখে সরাসরি অর্ডার করুন।
                </span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => {
                    setSelectedWebShopForOrder(selectedWebShopForModal);
                    setSelectedWebShopForModal(null);
                  }}
                  className="flex-1 sm:flex-none bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-xs py-2.5 px-5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>ওয়েবসাইট প্রোডাক্ট অর্ডার ফর্ম খুলুন</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: CUSTOM WEBSITE PRODUCT ORDER FORM ================= */}
      {selectedWebShopForOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 my-auto">
            
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white flex items-center justify-between border-b border-indigo-700/60">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center text-xl shrink-0">
                  🛒
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white">
                    {selectedWebShopForOrder.name} - প্রোডাক্ট অর্ডার
                  </h3>
                  <p className="text-[10px] text-indigo-200 font-mono truncate max-w-xs">
                    🔗 {selectedWebShopForOrder.websiteUrl}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedWebShopForOrder(null)}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white font-black text-sm flex items-center justify-center transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handlePlaceWebProductOrder} className="p-5 space-y-4 text-xs font-semibold">
              <div className="bg-indigo-50 dark:bg-indigo-950/50 p-3 rounded-2xl border border-indigo-100 dark:border-indigo-900/60 text-indigo-900 dark:text-indigo-200 text-[11px] leading-relaxed flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <span>
                  দোকানের অফিশিয়াল ওয়েবসাইট থেকে যেকোনো পছন্দের পণ্যের নাম, লিংক ও মূল্য লিখে সরাসরি অর্ডার পাঠাতে পারেন। মার্চেন্ট টিম আপনার ঠিকানায় সরাসরি প্রোডাক্ট ডেলিভারি পাঠাবে!
                </span>
              </div>

              {/* Product Name */}
              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300 font-bold block">
                  পণ্যের নাম ও বিবরণ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: পুরুষদের সুতি হাফ হাতা শার্ট / লেডিস ওয়ান পিস..."
                  value={webItemName}
                  onChange={(e) => setWebItemName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                />
              </div>

              {/* Product Page URL */}
              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300 font-bold block">
                  পণ্যের পেইজ লিংক (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={webItemUrl}
                  onChange={(e) => setWebItemUrl(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white font-mono text-[11px]"
                />
              </div>

              {/* Price & Quantity Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-700 dark:text-slate-300 font-bold block">
                    আনুমানিক মূল্য (৳) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={webItemPrice}
                    onChange={(e) => setWebItemPrice(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 dark:text-slate-300 font-bold block">
                    পরিমাণ (Quantity) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    required
                    value={webItemQty}
                    onChange={(e) => setWebItemQty(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white font-bold"
                  />
                </div>
              </div>

              {/* Delivery Address */}
              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300 font-bold block">
                  ডেলিভারি ঠিকানা <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="বাড়ি/রোড নম্বর, এরিয়া, ধানমন্ডি, ঢাকা..."
                  value={webDeliveryAddress}
                  onChange={(e) => setWebDeliveryAddress(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                />
              </div>

              {/* Payment Method */}
              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300 font-bold block">
                  পেমেন্ট পদ্ধতি নির্বাচন করুন
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setWebPaymentMethod('bkash')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer font-extrabold text-xs flex flex-col items-center gap-1 ${
                      webPaymentMethod === 'bkash'
                        ? 'bg-pink-600 text-white border-pink-600 shadow-sm ring-2 ring-pink-300'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>📱 বিকাশ</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setWebPaymentMethod('nagad')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer font-extrabold text-xs flex flex-col items-center gap-1 ${
                      webPaymentMethod === 'nagad'
                        ? 'bg-orange-600 text-white border-orange-600 shadow-sm ring-2 ring-orange-300'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>📲 নগদ</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setWebPaymentMethod('rocket')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer font-extrabold text-xs flex flex-col items-center gap-1 ${
                      webPaymentMethod === 'rocket'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-sm ring-2 ring-purple-300'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>🚀 রকেট</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setWebPaymentMethod('cod')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer font-extrabold text-xs flex flex-col items-center gap-1 ${
                      webPaymentMethod === 'cod'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm ring-2 ring-slate-400'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>💵 ক্যাশ অন</span>
                  </button>
                </div>
              </div>

              {/* Additional Notes */}
              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300 font-bold block">
                  সাইজ/কালার বা অতিরিক্ত নির্দেশাবলী (নোট)
                </label>
                <input
                  type="text"
                  placeholder="যেমন: সাইজ XL, কালার লাল..."
                  value={webItemNotes}
                  onChange={(e) => setWebItemNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                />
              </div>

              {/* Total Calculation summary */}
              <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-2xl flex items-center justify-between text-slate-900 dark:text-white font-extrabold">
                <span>সর্বমোট আনুমানিক বিল:</span>
                <span className="text-sm text-indigo-600 dark:text-indigo-400 font-black">
                  ৳ {(Number(webItemPrice) || 0) * (Number(webItemQty) || 1) + (selectedWebShopForOrder.deliveryCharge || 0)}
                  <span className="text-[10px] text-slate-500 font-normal ml-1">(ডেলিভারি চার্জসহ)</span>
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedWebShopForOrder(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-black py-3 rounded-xl transition-all cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={webOrderLoading}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-black py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {webOrderLoading ? (
                    <span>অর্ডার প্রক্রিয়াধীন...</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>নিশ্চিত অর্ডার জমা দিন</span>
                    </>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Bangladeshi Payment Gateway Modal for Web Shop Order */}
      {showWebPaymentGateway && selectedWebShopForOrder && (
        <BangladeshiPaymentGatewayModal
          isOpen={showWebPaymentGateway}
          onClose={() => setShowWebPaymentGateway(false)}
          amount={(Number(webItemPrice) || 0) * (Number(webItemQty) || 1) + (selectedWebShopForOrder.deliveryCharge || 0)}
          orderTitle={`🌐 ${selectedWebShopForOrder.name} - ${webItemName}`}
          businessName={selectedWebShopForOrder.name}
          businessPhone={selectedWebShopForOrder.phone}
          userPhone={currentUser.phone}
          userName={currentUser.name}
          defaultMethod={webPaymentMethod === 'cod' ? 'bkash' : webPaymentMethod}
          onPaymentSuccess={handleWebPaymentGatewaySuccess}
        />
      )}
    </div>
  );
}
