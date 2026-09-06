import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, Search, Phone, MessageSquare, Trash2, CheckCircle, Tag, Sparkles, 
  MapPin, ShoppingBag, Info, ShieldCheck, Heart, Share2, Eye, RefreshCw, X, Compass,
  DollarSign, SlidersHorizontal, Filter, ArrowUpDown, Check, Edit3, AlertTriangle,
  ChevronRight, ChevronDown, ExternalLink, Upload, Camera, TrendingUp, Clock,
  ShieldAlert, Layers, Send, Zap, Award, CheckCircle2, Copy
} from 'lucide-react';
import { User, CustomerProduct, CustomerProductOffer } from '../types';
import { 
  BANGLADESH_LOCATIONS, 
  getDistrictsForDivision, 
  getThanasForDistrict, 
  normalizeDivisionName, 
  normalizeDistrictName, 
  normalizeThanaName 
} from '../data/bangladeshLocations';

import { Language } from '../translations';

interface CustomerMarketplaceProps {
  currentUser: User;
  customerProducts: CustomerProduct[];
  onAddProduct: (product: Omit<CustomerProduct, 'id' | 'createdAt'>) => Promise<boolean>;
  onUpdateProduct?: (id: string, product: Partial<CustomerProduct>) => Promise<boolean>;
  onDeleteProduct: (id: string) => Promise<boolean>;
  onToggleAvailability: (id: string) => Promise<boolean>;
  onSubmitOffer?: (productId: string, offer: { buyerPhone: string; buyerName: string; offerPrice: number; message?: string }) => Promise<boolean>;
  onUpdateOfferStatus?: (productId: string, offerId: string, status: 'accepted' | 'declined') => Promise<boolean>;
  onRecordView?: (productId: string) => Promise<void>;
  onOpenChat: (phone: string, name: string) => void;
  language?: Language;
}

const CATEGORY_LABELS_BN: { [key: string]: string } = {
  electronics: 'ইলেকট্রনিক্স ও গ্যাজেট',
  furniture: 'আসবাবপত্র ও ফার্নিচার',
  books: 'বই ও শিক্ষা সামগ্রী',
  fashion: 'ফ্যাশন ও লাইফস্টাইল',
  home: 'গৃহস্থালি ও কিচেন সামগ্রী',
  hobbies: 'খেলাধুলা, সাইকেল ও শখ',
  vehicles: 'মোটরবাইক ও যানবাহন',
  other: 'অন্যান্য অব্যবহৃত জিনিস'
};

const CATEGORY_ICONS: { [key: string]: string } = {
  electronics: '📱',
  furniture: '🪑',
  books: '📚',
  fashion: '👗',
  home: '🏠',
  hobbies: '🚲',
  vehicles: '🛵',
  other: '📦'
};

const CATEGORY_COLORS: { [key: string]: string } = {
  electronics: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  furniture: 'bg-amber-50 text-amber-800 border-amber-200',
  books: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  fashion: 'bg-pink-50 text-pink-700 border-pink-200',
  home: 'bg-blue-50 text-blue-700 border-blue-200',
  hobbies: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  vehicles: 'bg-purple-50 text-purple-700 border-purple-200',
  other: 'bg-slate-50 text-slate-700 border-slate-200'
};

const CONDITION_LABELS: { [key: string]: string } = {
  new: 'একদম নতুন (Intact)',
  like_new: 'নতুনের মতো (Like New)',
  used: 'ব্যবহৃত (Used)',
  fair: 'কিছুটা ত্রুটিযুক্ত / পার্টস (Fair)'
};

const CONDITION_COLORS: { [key: string]: string } = {
  new: 'bg-purple-600 text-white',
  like_new: 'bg-emerald-600 text-white',
  used: 'bg-blue-600 text-white',
  fair: 'bg-amber-600 text-white'
};

const DELIVERY_LABELS: { [key: string]: string } = {
  pickup_only: 'সরাসরি দেখা করে নেওয়া (Self Pickup)',
  delivery_available: 'কুরিয়ার / হোম ডেলিভারি সম্ভব',
  free_delivery: 'ফ্রি হোম ডেলিভারি'
};

// Curated high-res presets for one-click photo selection
const IMAGE_PRESETS = [
  { label: 'স্মার্টফোন', category: 'electronics', url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=600' },
  { label: 'ল্যাপটপ', category: 'electronics', url: 'https://images.unsplash.com/photo-1496181130204-755241524eab?auto=format&fit=crop&q=80&w=600' },
  { label: 'হেডফোন', category: 'electronics', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=600' },
  { label: 'চেয়ার / ফার্নিচার', category: 'furniture', url: 'https://images.unsplash.com/photo-1505797149-43b0069ec26b?auto=format&fit=crop&q=80&w=600' },
  { label: 'বইয়ের সেট', category: 'books', url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600' },
  { label: 'সাইকেল', category: 'hobbies', url: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=600' },
  { label: 'ঘড়ি / ওয়াচ', category: 'fashion', url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600' },
  { label: 'ক্যামেরা', category: 'electronics', url: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&q=80&w=600' },
  { label: 'হোম অ্যাপ্লায়েন্স', category: 'home', url: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&q=80&w=600' },
  { label: 'মোটরসাইকেল / স্কুটার', category: 'vehicles', url: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=600' }
];

export default function CustomerMarketplace({
  currentUser,
  customerProducts = [],
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onToggleAvailability,
  onSubmitOffer,
  onUpdateOfferStatus,
  onRecordView,
  onOpenChat,
  language = 'bn'
}: CustomerMarketplaceProps) {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'explore' | 'my_listings' | 'saved'>('explore');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCondition, setSelectedCondition] = useState<string>('all');
  const [selectedDivision, setSelectedDivision] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedDelivery, setSelectedDelivery] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<number>(100000);
  const [onlyNegotiable, setOnlyNegotiable] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'price_low' | 'price_high' | 'popular'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [selectedProductForDetails, setSelectedProductForDetails] = useState<CustomerProduct | null>(null);
  const [showPriceEstimatorModal, setShowPriceEstimatorModal] = useState(false);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [showOfferModalForProduct, setShowOfferModalForProduct] = useState<CustomerProduct | null>(null);

  // Offer submission form state
  const [offerPrice, setOfferPrice] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);

  // Listing Form State
  const [formName, setFormName] = useState('');
  const [formBrand, setFormBrand] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formOriginalPrice, setFormOriginalPrice] = useState('');
  const [formIsNegotiable, setFormIsNegotiable] = useState(true);
  const [formCategory, setFormCategory] = useState<CustomerProduct['category']>('electronics');
  const [formCondition, setFormCondition] = useState<CustomerProduct['condition']>('used');
  const [formUsedDuration, setFormUsedDuration] = useState('');
  const [formWarrantyInfo, setFormWarrantyInfo] = useState('');
  const [formDeliveryType, setFormDeliveryType] = useState<CustomerProduct['deliveryType']>('pickup_only');
  const [formAddress, setFormAddress] = useState(currentUser?.location?.address || '');
  const [formDivision, setFormDivision] = useState(currentUser?.location?.division || 'ঢাকা');
  const [formDistrict, setFormDistrict] = useState(currentUser?.location?.district || 'ঢাকা');
  const [formThana, setFormThana] = useState(currentUser?.location?.thana || 'ধানমন্ডি');
  const [formDescription, setFormDescription] = useState('');
  const [formImages, setFormImages] = useState<string[]>([IMAGE_PRESETS[0].url]);
  const [customImageUrlInput, setCustomImageUrlInput] = useState('');
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  // AI Helper States
  const [isGeneratingAiListing, setIsGeneratingAiListing] = useState(false);
  const [isEstimatingPrice, setIsEstimatingPrice] = useState(false);
  const [estimatorName, setEstimatorName] = useState('');
  const [estimatorCategory, setEstimatorCategory] = useState('electronics');
  const [estimatorCondition, setEstimatorCondition] = useState('used');
  const [estimatorOriginalPrice, setEstimatorOriginalPrice] = useState('');
  const [estimatorDuration, setEstimatorDuration] = useState('');
  const [estimatorResult, setEstimatorResult] = useState<any>(null);

  // Saved / Wishlist Items
  const [savedProductIds, setSavedProductIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('rb_c2c_saved_items');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleSaveProduct = (productId: string) => {
    setSavedProductIds(prev => {
      const updated = prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId];
      localStorage.setItem('rb_c2c_saved_items', JSON.stringify(updated));
      return updated;
    });
  };

  // Open Product Details & Record View
  const handleOpenProductDetails = (product: CustomerProduct) => {
    setSelectedProductForDetails(product);
    if (onRecordView) {
      onRecordView(product.id);
    }
  };

  // Populate Edit Form
  const handleStartEdit = (product: CustomerProduct) => {
    setEditingProductId(product.id);
    setFormName(product.name);
    setFormBrand(product.brand || '');
    setFormPrice(String(product.price));
    setFormOriginalPrice(product.originalPrice ? String(product.originalPrice) : '');
    setFormIsNegotiable(product.isNegotiable ?? true);
    setFormCategory(product.category);
    setFormCondition(product.condition);
    setFormUsedDuration(product.usedDuration || '');
    setFormWarrantyInfo(product.warrantyInfo || '');
    setFormDeliveryType(product.deliveryType || 'pickup_only');
    setFormAddress(product.sellerAddress || '');
    setFormDivision(product.division || 'ঢাকা');
    setFormDistrict(product.district || 'ঢাকা');
    setFormThana(product.thana || 'ধানমন্ডি');
    setFormDescription(product.description || '');
    setFormImages(product.images && product.images.length > 0 ? product.images : [product.image || IMAGE_PRESETS[0].url]);
    setShowAddModal(true);
  };

  // Reset form
  const handleResetForm = () => {
    setEditingProductId(null);
    setFormName('');
    setFormBrand('');
    setFormPrice('');
    setFormOriginalPrice('');
    setFormIsNegotiable(true);
    setFormCategory('electronics');
    setFormCondition('used');
    setFormUsedDuration('');
    setFormWarrantyInfo('');
    setFormDeliveryType('pickup_only');
    setFormAddress(currentUser?.location?.address || '');
    setFormDivision(currentUser?.location?.division || 'ঢাকা');
    setFormDistrict(currentUser?.location?.district || 'ঢাকা');
    setFormThana(currentUser?.location?.thana || 'ধানমন্ডি');
    setFormDescription('');
    setFormImages([IMAGE_PRESETS[0].url]);
    setCustomImageUrlInput('');
  };

  // Image Upload handler (File input converted to Data URL)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onload = (uploadEvent) => {
          if (uploadEvent.target?.result) {
            setFormImages(prev => [uploadEvent.target!.result as string, ...prev]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // Add custom URL to images
  const handleAddImageUrl = () => {
    if (customImageUrlInput.trim()) {
      setFormImages(prev => [...prev, customImageUrlInput.trim()]);
      setCustomImageUrlInput('');
    }
  };

  // Remove an image from form
  const handleRemoveImage = (indexToRemove: number) => {
    setFormImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // AI Instant Listing Generator
  const handleGenerateAiListing = async () => {
    if (!formName.trim()) {
      alert('দয়া করে প্রথমে পণ্যের নাম উল্লেখ করুন (যেমন: OnePlus 9 Pro, Walton রিফ্রিজারেটর, বা রিডিং টেবিল)');
      return;
    }
    setIsGeneratingAiListing(true);
    try {
      const res = await fetch('/api/ai/generate-c2c-listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: formName.trim(),
          brand: formBrand.trim(),
          category: formCategory,
          condition: formCondition,
          askingPrice: formPrice ? Number(formPrice) : undefined,
          originalPrice: formOriginalPrice ? Number(formOriginalPrice) : undefined,
          usedDuration: formUsedDuration.trim(),
          warrantyInfo: formWarrantyInfo.trim(),
          pickupLocation: `${formThana || ''}, ${formDistrict || formDivision || 'ঢাকা'}`
        })
      });
      const data = await res.json();
      if (data && data.description) {
        setFormDescription(data.description);
        if (data.title && !editingProductId) {
          setFormName(data.title);
        }
      }
    } catch (e) {
      console.error('Marketplace AI error:', e);
      alert('AI বিবরণ তৈরিতে সাময়িক সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setIsGeneratingAiListing(false);
    }
  };

  // AI Price Estimator Request
  const handleRunPriceEstimator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!estimatorName.trim()) {
      alert('দয়া করে পণ্যের নাম লিখুন।');
      return;
    }
    setIsEstimatingPrice(true);
    try {
      const res = await fetch('/api/ai/estimate-resale-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: estimatorName.trim(),
          category: estimatorCategory,
          condition: estimatorCondition,
          originalPrice: Number(estimatorOriginalPrice) || 0,
          usedDuration: estimatorDuration.trim()
        })
      });
      const data = await res.json();
      setEstimatorResult(data);
    } catch (err) {
      console.error('Price estimation error:', err);
      alert('দাম পরিমাপ করতে সমস্যা হয়েছে।');
    } finally {
      setIsEstimatingPrice(false);
    }
  };

  // Submit Listing Form (Create or Edit)
  const handleSubmitListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPrice || !formDescription.trim()) {
      alert('অনুগ্রহ করে পণ্যের নাম, বিক্রয় মূল্য এবং বিবরণ প্রদান করুন।');
      return;
    }

    setIsSubmittingForm(true);
    const mainImage = formImages[0] || IMAGE_PRESETS[0].url;

    if (editingProductId && onUpdateProduct) {
      const success = await onUpdateProduct(editingProductId, {
        name: formName.trim(),
        brand: formBrand.trim() || undefined,
        price: Number(formPrice),
        originalPrice: formOriginalPrice ? Number(formOriginalPrice) : undefined,
        isNegotiable: formIsNegotiable,
        description: formDescription.trim(),
        category: formCategory,
        condition: formCondition,
        usedDuration: formUsedDuration.trim() || undefined,
        warrantyInfo: formWarrantyInfo.trim() || undefined,
        deliveryType: formDeliveryType,
        sellerAddress: formAddress.trim(),
        division: formDivision,
        district: formDistrict,
        thana: formThana,
        image: mainImage,
        images: formImages
      });
      setIsSubmittingForm(false);
      if (success) {
        alert('বিজ্ঞাপনটি সফলভাবে আপডেট হয়েছে!');
        setShowAddModal(false);
        handleResetForm();
      } else {
        alert('আপডেট করতে ব্যর্থ হয়েছে। আবার চেষ্টা করুন।');
      }
    } else {
      const success = await onAddProduct({
        sellerPhone: currentUser.phone,
        sellerName: currentUser.name,
        sellerAddress: formAddress.trim(),
        division: formDivision,
        district: formDistrict,
        thana: formThana,
        name: formName.trim(),
        brand: formBrand.trim() || undefined,
        price: Number(formPrice),
        originalPrice: formOriginalPrice ? Number(formOriginalPrice) : undefined,
        isNegotiable: formIsNegotiable,
        description: formDescription.trim(),
        category: formCategory,
        condition: formCondition,
        usedDuration: formUsedDuration.trim() || undefined,
        warrantyInfo: formWarrantyInfo.trim() || undefined,
        deliveryType: formDeliveryType,
        image: mainImage,
        images: formImages,
        isAvailable: true,
        views: 1,
        isBoosted: false,
        offers: []
      });
      setIsSubmittingForm(false);
      if (success) {
        alert('আপনার পণ্যটি বিক্রয়ের জন্য সফলভাবে তালিকাভুক্ত হয়েছে!');
        setShowAddModal(false);
        handleResetForm();
        setActiveTab('my_listings');
      } else {
        alert('পণ্য তালিকাভুক্ত করতে ব্যর্থ হয়েছে। আবার চেষ্টা করুন।');
      }
    }
  };

  // Submit Offer
  const handleSubmitOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showOfferModalForProduct || !offerPrice) {
      alert('দয়া করে আপনার প্রস্তাবিত মূল্য লিখুন।');
      return;
    }
    if (onSubmitOffer) {
      setIsSubmittingOffer(true);
      const success = await onSubmitOffer(showOfferModalForProduct.id, {
        buyerPhone: currentUser.phone,
        buyerName: currentUser.name,
        offerPrice: Number(offerPrice),
        message: offerMessage.trim()
      });
      setIsSubmittingOffer(false);
      if (success) {
        alert('আপনার অফারটি বিক্রেতার কাছে সফলভাবে পাঠানো হয়েছে!');
        setShowOfferModalForProduct(null);
        setOfferPrice('');
        setOfferMessage('');
      } else {
        alert('অফার পাঠাতে সমস্যা হয়েছে।');
      }
    }
  };

  // Filtered and Sorted Products List
  const filteredProducts = useMemo(() => {
    let result = [...customerProducts];

    // Tabs filter
    if (activeTab === 'my_listings') {
      result = result.filter(p => p.sellerPhone === currentUser.phone);
    } else if (activeTab === 'saved') {
      result = result.filter(p => savedProductIds.includes(p.id));
    }

    // Category
    if (selectedCategory !== 'all') {
      result = result.filter(p => p.category === selectedCategory);
    }

    // Condition
    if (selectedCondition !== 'all') {
      result = result.filter(p => p.condition === selectedCondition);
    }

    // Division / District
    if (selectedDivision) {
      result = result.filter(p => (p.division || '').toLowerCase().includes(selectedDivision.toLowerCase()) || (p.sellerAddress || '').toLowerCase().includes(selectedDivision.toLowerCase()));
    }
    if (selectedDistrict) {
      result = result.filter(p => (p.district || '').toLowerCase().includes(selectedDistrict.toLowerCase()) || (p.sellerAddress || '').toLowerCase().includes(selectedDistrict.toLowerCase()));
    }

    // Delivery Type
    if (selectedDelivery !== 'all') {
      result = result.filter(p => p.deliveryType === selectedDelivery);
    }

    // Negotiable Only
    if (onlyNegotiable) {
      result = result.filter(p => p.isNegotiable !== false);
    }

    // Max Price
    result = result.filter(p => p.price <= priceRange);

    // Search Query (name, brand, description, location)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) ||
        (p.brand || '').toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.sellerAddress || '').toLowerCase().includes(q) ||
        (p.thana || '').toLowerCase().includes(q) ||
        (p.district || '').toLowerCase().includes(q)
      );
    }

    // Sorting
    result.sort((a, b) => {
      if (a.isBoosted && !b.isBoosted) return -1;
      if (!a.isBoosted && b.isBoosted) return 1;

      if (sortBy === 'price_low') return a.price - b.price;
      if (sortBy === 'price_high') return b.price - a.price;
      if (sortBy === 'popular') return (b.views || 0) - (a.views || 0);
      // default newest
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return result;
  }, [customerProducts, activeTab, savedProductIds, selectedCategory, selectedCondition, selectedDivision, selectedDistrict, selectedDelivery, onlyNegotiable, priceRange, searchQuery, sortBy, currentUser]);

  // Statistics for My Listings
  const myListings = useMemo(() => {
    return customerProducts.filter(p => p.sellerPhone === currentUser.phone);
  }, [customerProducts, currentUser]);

  const totalMyViews = useMemo(() => {
    return myListings.reduce((acc, p) => acc + (p.views || 0), 0);
  }, [myListings]);

  const totalMyOffers = useMemo(() => {
    return myListings.reduce((acc, p) => acc + (p.offers?.length || 0), 0);
  }, [myListings]);

  return (
    <div className="space-y-6">
      
      {/* 🚀 Top Banner & Hero Section */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-800 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 top-0 -translate-y-12 w-64 h-64 bg-cyan-400/15 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-white/20 text-[10px] font-black tracking-wider uppercase px-3 py-1 rounded-full border border-white/20 flex items-center gap-1.5 backdrop-blur-xs">
                <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
                কাস্টমার রিসেল ও সেকেন্ডহ্যান্ড মার্কেটপ্লেস (C2C)
              </span>
              <span className="bg-emerald-500/30 text-emerald-200 text-[10px] font-black px-2.5 py-1 rounded-full border border-emerald-400/30">
                🎉 ১০০% ফ্রি ও জিরো কমিশন
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight leading-snug">
              আপনার অব্যবহৃত জিনিসপত্র সরাসরি কাস্টমারদের কাছে বিক্রি করুন
            </h1>

            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-medium">
              বাসার পুরনো স্মার্টফোন, ল্যাপটপ, রিডিং টেবিল, বই, সাইকেল বা ফার্নিচার নিরাপদে বিক্রি করুন। কোনো মধ্যস্বত্বভোগী বা হিডেন চার্জ ছাড়াই সরাসরি স্থানীয় ক্রেতাদের সাথে চ্যাট ও ফোনে যোগাযোগ করুন।
            </p>

            {/* Quick Action Badges */}
            <div className="flex flex-wrap gap-2.5 pt-1">
              <button
                onClick={() => setShowPriceEstimatorModal(true)}
                className="bg-white/10 hover:bg-white/20 text-white text-[11px] font-black px-3 py-1.5 rounded-xl border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-xs"
              >
                <DollarSign className="w-3.5 h-3.5 text-yellow-300" />
                <span>✨ এআই দিয়ে বাজারদর যাচাই করুন</span>
              </button>

              <button
                onClick={() => setShowSafetyModal(true)}
                className="bg-white/10 hover:bg-white/20 text-white text-[11px] font-black px-3 py-1.5 rounded-xl border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-xs"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                <span>নিরাপদ কেনাবেচার নিয়মাবলী</span>
              </button>
            </div>
          </div>
          
          {/* Post Free Ad CTA */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 w-full sm:w-auto shrink-0">
            <button
              onClick={() => {
                handleResetForm();
                setShowAddModal(true);
              }}
              className="bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm px-6 py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-xl hover:shadow-yellow-500/20 hover:scale-[1.02] transition-all cursor-pointer"
            >
              <Plus className="w-5 h-5 stroke-[3px]" />
              <span>ফ্রি বিজ্ঞাপন পোস্ট করুন</span>
            </button>

            <button
              onClick={() => setActiveTab('my_listings')}
              className="bg-emerald-950/60 hover:bg-emerald-950/80 text-emerald-100 font-bold text-xs px-4 py-2.5 rounded-xl border border-emerald-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 text-emerald-400" />
              <span>আমার বিজ্ঞাপন ({myListings.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* 🧭 Navigation Tab Bar */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-xs p-1.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('explore')}
            className={`flex items-center gap-2 px-5 py-2.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
              activeTab === 'explore'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>বাজারের সকল পণ্য ({customerProducts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('my_listings')}
            className={`flex items-center gap-2 px-5 py-2.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
              activeTab === 'my_listings'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>আমার লিস্টিং ও অফার ({myListings.length})</span>
            {totalMyOffers > 0 && (
              <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full animate-bounce">
                {totalMyOffers}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('saved')}
            className={`flex items-center gap-2 px-5 py-2.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
              activeTab === 'saved'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500/20" />
            <span>সংরক্ষিত পণ্য ({savedProductIds.length})</span>
          </button>
        </div>

        {/* View mode toggle */}
        {activeTab === 'explore' && (
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'grid' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500'
              }`}
              title="গ্রিড ভিউ"
            >
              <Layers className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'list' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500'
              }`}
              title="লিস্ট ভিউ"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* 📊 My Listings Dashboard Overview Cards (When on My Listings Tab) */}
      {activeTab === 'my_listings' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-xs space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">মোট বিজ্ঞাপন</span>
            <div className="flex items-center justify-between">
              <span className="text-xl font-black text-slate-900">{myListings.length} টি</span>
              <ShoppingBag className="w-5 h-5 text-emerald-600" />
            </div>
          </div>

          <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-xs space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">সচল বিক্রয়</span>
            <div className="flex items-center justify-between">
              <span className="text-xl font-black text-emerald-600">{myListings.filter(p => p.isAvailable).length} টি</span>
              <CheckCircle className="w-5 h-5 text-emerald-500" />
            </div>
          </div>

          <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-xs space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">মোট ভিউ সংখ্যা</span>
            <div className="flex items-center justify-between">
              <span className="text-xl font-black text-blue-600">{totalMyViews} বার</span>
              <Eye className="w-5 h-5 text-blue-500" />
            </div>
          </div>

          <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-xs space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">প্রাপ্ত দাম প্রস্তাব (Offers)</span>
            <div className="flex items-center justify-between">
              <span className="text-xl font-black text-purple-600">{totalMyOffers} টি</span>
              <Tag className="w-5 h-5 text-purple-500" />
            </div>
          </div>
        </div>
      )}

      {/* 🔍 Search & Filter Bar (Explore & Saved Tabs) */}
      {(activeTab === 'explore' || activeTab === 'saved') && (
        <div className="bg-white border border-slate-100 p-4 sm:p-5 rounded-3xl shadow-xs space-y-4">
          
          {/* Main Search Input & Category Pills */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <span className="absolute left-4 top-3.5 text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="যেমন: OnePlus 9 Pro, রিডিং টেবিল, সাইকেল, বিসিএস বই বা ধানমন্ডি..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 font-semibold"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Sort Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 shrink-0 flex items-center gap-1">
                <ArrowUpDown className="w-3.5 h-3.5" /> সাজান:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-xs font-extrabold p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 text-slate-800 cursor-pointer"
              >
                <option value="newest">নতুন বিজ্ঞাপন প্রথমে</option>
                <option value="price_low">কম দাম থেকে বেশি</option>
                <option value="price_high">বেশি দাম থেকে কম</option>
                <option value="popular">সর্বাধিক ভিউ / জনপ্রিয়</option>
              </select>
            </div>
          </div>

          {/* Category Horizontal Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`text-xs font-black px-3.5 py-1.5 rounded-xl border whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              🛍️ সব ক্যাটাগরি ({customerProducts.length})
            </button>
            {Object.keys(CATEGORY_LABELS_BN).map(catKey => {
              const count = customerProducts.filter(p => p.category === catKey).length;
              return (
                <button
                  key={catKey}
                  onClick={() => setSelectedCategory(catKey)}
                  className={`text-xs font-black px-3.5 py-1.5 rounded-xl border whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedCategory === catKey
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>{CATEGORY_ICONS[catKey]}</span>
                  <span>{CATEGORY_LABELS_BN[catKey]}</span>
                  <span className="text-[10px] opacity-70">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Deep Filters Row (Location, Condition, Delivery, Price) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
            
            {/* Division Filter */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">বিভাগ</label>
              <select
                value={selectedDivision}
                onChange={(e) => {
                  setSelectedDivision(e.target.value);
                  setSelectedDistrict('');
                }}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="">সারা বাংলাদেশ (সব বিভাগ)</option>
                {BANGLADESH_LOCATIONS.map((loc, idx) => (
                  <option key={`div-flt-${loc.division}-${idx}`} value={loc.division}>
                    {loc.division}
                  </option>
                ))}
              </select>
            </div>

            {/* Condition Filter */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">কন্ডিশন</label>
              <select
                value={selectedCondition}
                onChange={(e) => setSelectedCondition(e.target.value)}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="all">সব কন্ডিশন</option>
                <option value="new">ব্র্যান্ড নিউ (Intact)</option>
                <option value="like_new">নতুনের মতো (Like New)</option>
                <option value="used">ব্যবহৃত (Used)</option>
                <option value="fair">কিছুটা ত্রুটিযুক্ত (Fair)</option>
              </select>
            </div>

            {/* Delivery Filter */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">ডেলিভারি সুবিধা</label>
              <select
                value={selectedDelivery}
                onChange={(e) => setSelectedDelivery(e.target.value)}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="all">সব ধরনের ডেলিভারি</option>
                <option value="pickup_only">সরাসরি দেখা করে নেওয়া</option>
                <option value="delivery_available">কুরিয়ার / হোম ডেলিভারি</option>
                <option value="free_delivery">ফ্রি ডেলিভারি</option>
              </select>
            </div>

            {/* Price Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-black text-slate-400">
                <span>সর্বোচ্চ দাম:</span>
                <span className="text-emerald-600 font-black">৳{priceRange.toLocaleString('bn-BD')}</span>
              </div>
              <input
                type="range"
                min="500"
                max="150000"
                step="1000"
                value={priceRange}
                onChange={(e) => setPriceRange(Number(e.target.value))}
                className="w-full accent-emerald-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* 📦 Product Grid / List Section */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-200 rounded-3xl p-16 text-center space-y-4">
          <ShoppingBag className="w-14 h-14 text-slate-300 stroke-1 mx-auto animate-pulse" />
          <div className="space-y-1 max-w-md mx-auto">
            <h4 className="text-sm sm:text-base font-black text-slate-700">কোনো অব্যবহৃত পণ্য পাওয়া যায়নি!</h4>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              {activeTab === 'my_listings'
                ? 'আপনি এখনো বিক্রয়ের জন্য কোনো বিজ্ঞাপন দেননি। উপরের "ফ্রি বিজ্ঞাপন পোস্ট করুন" বাটনে ক্লিক করে আজই বিজ্ঞাপন দিন।'
                : activeTab === 'saved'
                ? 'আপনার ফেভারিট বা সংরক্ষিত তালিকায় কোনো পণ্য নেই। পণ্যের হার্ট আইকনে ক্লিক করে সংরক্ষণ করুন।'
                : 'আপনার অনুসন্ধান বা ফিল্টারের সাথে মিলে এমন কোনো পণ্য এই মুহূর্তে নেই। ফিল্টার রিসেট করে আবার চেষ্টা করুন।'}
            </p>
          </div>
          {activeTab !== 'my_listings' && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedCondition('all');
                setSelectedDivision('');
                setSelectedDistrict('');
                setSelectedDelivery('all');
                setPriceRange(100000);
              }}
              className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-black rounded-xl transition-all cursor-pointer"
            >
              ফিল্টার রিসেট করুন
            </button>
          )}
        </div>
      ) : (
        <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" : "space-y-4"}>
          {filteredProducts.map((product) => {
            const isOwner = product.sellerPhone === currentUser.phone;
            const isSaved = savedProductIds.includes(product.id);
            const discountPercent = product.originalPrice && product.originalPrice > product.price
              ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
              : null;
            const savingsAmount = product.originalPrice && product.originalPrice > product.price
              ? product.originalPrice - product.price
              : null;

            return (
              <div
                key={product.id}
                className={`bg-white border rounded-3xl overflow-hidden shadow-xs hover:shadow-lg transition-all duration-200 flex ${
                  viewMode === 'list' ? 'flex-col sm:flex-row' : 'flex-col justify-between'
                } relative group ${
                  !product.isAvailable ? 'border-red-200 bg-slate-50/50' : product.isBoosted ? 'border-amber-300 ring-2 ring-amber-400/20' : 'border-slate-100 hover:border-emerald-500/30'
                }`}
              >
                {/* Image Container with Badges */}
                <div className={`relative overflow-hidden shrink-0 ${viewMode === 'list' ? 'sm:w-64 aspect-[4/3] sm:aspect-auto' : 'aspect-[4/3] bg-slate-50'}`}>
                  <img
                    src={product.image || IMAGE_PRESETS[0].url}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />

                  {/* Badges Overlay */}
                  <div className="absolute top-3 inset-x-3 flex justify-between items-start pointer-events-none z-10">
                    <div className="flex flex-col gap-1">
                      {product.isBoosted && (
                        <span className="bg-amber-500 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-md shadow-sm flex items-center gap-1 w-fit">
                          <Zap className="w-2.5 h-2.5 fill-slate-950" />
                          ফিচার্ড বিজ্ঞাপন
                        </span>
                      )}
                      {discountPercent && (
                        <span className="bg-rose-500 text-white font-black text-[9px] px-2 py-0.5 rounded-md shadow-sm w-fit">
                          {discountPercent}% ছাড় (৳{savingsAmount?.toLocaleString('bn-BD')} সাশ্রয়)
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-md shadow-sm ${CONDITION_COLORS[product.condition] || 'bg-blue-600 text-white'}`}>
                        {CONDITION_LABELS[product.condition] || 'ব্যবহৃত'}
                      </span>
                    </div>
                  </div>

                  {/* Favorite Heart Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSaveProduct(product.id);
                    }}
                    className={`absolute bottom-3 right-3 p-2 rounded-full backdrop-blur-md transition-all cursor-pointer z-10 ${
                      isSaved ? 'bg-rose-500 text-white shadow-md' : 'bg-black/40 hover:bg-black/60 text-white'
                    }`}
                    title={isSaved ? 'সংরক্ষণ বাতিল করুন' : 'পছন্দের তালিকায় রাখুন'}
                  >
                    <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-white' : ''}`} />
                  </button>

                  {/* Sold out overlay */}
                  {!product.isAvailable && (
                    <div className="absolute inset-0 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center z-20">
                      <span className="bg-rose-600 text-white font-black text-xs px-4 py-2 rounded-2xl shadow-xl flex items-center gap-1.5">
                        <Check className="w-4 h-4 stroke-[3px]" />
                        🤝 বিক্রিত সম্পন্ন (Sold Out)
                      </span>
                    </div>
                  )}
                </div>

                {/* Body Content */}
                <div className="p-4 sm:p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    
                    {/* Category & Date Row */}
                    <div className="flex items-center justify-between text-[10px]">
                      <span className={`font-black px-2.5 py-0.5 rounded-lg border ${CATEGORY_COLORS[product.category] || 'bg-slate-50 text-slate-700'}`}>
                        {CATEGORY_ICONS[product.category]} {CATEGORY_LABELS_BN[product.category] || 'অন্যান্য'}
                      </span>

                      <span className="text-slate-400 font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(product.createdAt).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>

                    {/* Product Title */}
                    <h3 
                      onClick={() => handleOpenProductDetails(product)}
                      className="text-sm font-black text-slate-900 leading-snug line-clamp-2 hover:text-emerald-600 transition-colors cursor-pointer"
                    >
                      {product.name}
                    </h3>

                    {/* Price & Bargain Badge */}
                    <div className="flex items-baseline justify-between flex-wrap gap-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-black text-emerald-600">৳{product.price.toLocaleString('bn-BD')}</span>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <span className="line-through text-xs text-slate-400 font-semibold">
                            ৳{product.originalPrice.toLocaleString('bn-BD')}
                          </span>
                        )}
                      </div>

                      {product.isNegotiable ? (
                        <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          💬 দামাদামিযোগ্য
                        </span>
                      ) : (
                        <span className="text-[10px] font-black text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                          🔒 ফিক্সড প্রাইস
                        </span>
                      )}
                    </div>

                    {/* Location Badge */}
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">
                        {[product.thana, product.district || product.division || product.sellerAddress].filter(Boolean).join(', ') || 'ঢাকা'}
                      </span>
                    </div>

                    {/* Short Description */}
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-normal">
                      {product.description}
                    </p>
                  </div>

                  {/* Bottom Action Footer */}
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    
                    {/* Views & Inquiries Bar */}
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold px-1">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3 text-slate-400" />
                        {product.views || 1} বার দেখা হয়েছে
                      </span>
                      {product.offers && product.offers.length > 0 && (
                        <span className="text-purple-600 font-black flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          {product.offers.length} টি প্রস্তাব এসেছে
                        </span>
                      )}
                    </div>

                    {/* Owner Management Controls vs Buyer Action Controls */}
                    {isOwner ? (
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          type="button"
                          onClick={() => onToggleAvailability(product.id)}
                          className={`py-2 text-[10px] font-black rounded-xl transition-all cursor-pointer text-center ${
                            product.isAvailable ? 'bg-slate-800 hover:bg-slate-900 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          }`}
                        >
                          {product.isAvailable ? '🤝 বিক্রি শেষ' : '🔄 সচল করুন'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStartEdit(product)}
                          className="py-2 text-[10px] font-black rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-all cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>এডিট</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (confirm('আপনি কি নিশ্চিত যে এই বিজ্ঞাপনটি স্থায়ীভাবে মুছে ফেলতে চান?')) {
                              onDeleteProduct(product.id);
                            }
                          }}
                          className="py-2 text-[10px] font-black rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-all cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>ডিলিট</span>
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-1.5">
                        {/* Details Modal Trigger */}
                        <button
                          type="button"
                          onClick={() => handleOpenProductDetails(product)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-[11px] py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>বিস্তারিত</span>
                        </button>

                        {/* Send Message */}
                        <button
                          type="button"
                          onClick={() => onOpenChat(product.sellerPhone, product.sellerName)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>চ্যাট</span>
                        </button>

                        {/* Make Offer / Call */}
                        {product.isNegotiable ? (
                          <button
                            type="button"
                            onClick={() => setShowOfferModalForProduct(product)}
                            className="bg-purple-600 hover:bg-purple-700 text-white font-black text-[11px] py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                          >
                            <Tag className="w-3.5 h-3.5" />
                            <span>দাম প্রস্তাব</span>
                          </button>
                        ) : (
                          <a
                            href={`tel:${product.sellerPhone}`}
                            className="bg-slate-900 hover:bg-slate-800 text-white font-black text-[11px] py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 text-center"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>কল দিন</span>
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📝 CREATE / EDIT PRODUCT LISTING MODAL */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-8">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-4 border-slate-100">
              <div className="space-y-0.5">
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">
                  {editingProductId ? 'বিজ্ঞাপন সম্পাদনা' : 'নতুন বিজ্ঞাপন প্রকাশ'}
                </span>
                <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-emerald-600" />
                  {editingProductId ? 'আপনার পণ্যের তথ্য আপডেট করুন' : 'আপনার অব্যবহৃত বা ব্যবহৃত পণ্য বিক্রয় করুন'}
                </h2>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitListing} className="space-y-5">
              
              {/* Basic Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Product Name */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider block">
                    পণ্যের নাম ও মডেল *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: ব্যবহৃত OnePlus 9 Pro (8/256GB), রিডিং টেবিল, বা অনার্স ৩য় বর্ষের বই"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 font-semibold"
                  />
                </div>

                {/* Brand */}
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider block">
                    ব্র্যান্ড / প্রস্তুতকারক <span className="text-slate-400 font-normal">(যদি থাকে)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: Apple, Samsung, Walton, Otobi, Core"
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 font-semibold"
                  />
                </div>

                {/* Category */}
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider block">ক্যাটাগরি *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 text-slate-900 font-bold cursor-pointer"
                  >
                    {Object.keys(CATEGORY_LABELS_BN).map(key => (
                      <option key={key} value={key}>{CATEGORY_LABELS_BN[key]}</option>
                    ))}
                  </select>
                </div>

                {/* Asking Price */}
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider block">বিক্রয় মূল্য (৳) *</label>
                  <input
                    type="number"
                    required
                    placeholder="কত টাকায় বিক্রি করতে চান"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 font-bold"
                  />
                </div>

                {/* Original Price */}
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider block">
                    প্রকৃত কেনা দাম (৳) <span className="text-slate-400 font-normal">(ঐচ্ছিক - ছাড় দেখানোর জন্য)</span>
                  </label>
                  <input
                    type="number"
                    placeholder="পূর্বে কেনার দাম কত ছিল"
                    value={formOriginalPrice}
                    onChange={(e) => setFormOriginalPrice(e.target.value)}
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 font-semibold"
                  />
                </div>

                {/* Condition */}
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider block">পণ্যের কন্ডিশন *</label>
                  <select
                    value={formCondition}
                    onChange={(e) => setFormCondition(e.target.value as any)}
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold cursor-pointer"
                  >
                    <option value="new">একদম নতুন (Intact)</option>
                    <option value="like_new">নতুনের মতো (Like New)</option>
                    <option value="used">ব্যবহৃত (Used)</option>
                    <option value="fair">কিছুটা ত্রুটিযুক্ত / পার্টস (Fair)</option>
                  </select>
                </div>

                {/* Price Negotiable Toggle */}
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider block">দামাদামি করার সুযোগ</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormIsNegotiable(true)}
                      className={`p-2.5 text-xs font-black rounded-xl border transition-all cursor-pointer ${
                        formIsNegotiable ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs' : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      💬 আলোচনা সাপেক্ষ (Yes)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormIsNegotiable(false)}
                      className={`p-2.5 text-xs font-black rounded-xl border transition-all cursor-pointer ${
                        !formIsNegotiable ? 'bg-slate-900 border-slate-900 text-white shadow-xs' : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      🔒 একদাম / ফিক্সড প্রাইস
                    </button>
                  </div>
                </div>

                {/* Used Duration */}
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider block">
                    কতদিন ব্যবহার করেছেন
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: ৩ মাস, ১ বছর, অথবা একদম নতুন"
                    value={formUsedDuration}
                    onChange={(e) => setFormUsedDuration(e.target.value)}
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 text-slate-900 font-semibold"
                  />
                </div>

                {/* Warranty Info */}
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider block">
                    ওয়ারেন্টি বা মেমোর তথ্য
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: অফিসিয়াল ওয়ারেন্টি বাকি ৬ মাস / ক্যাশ মেমো আছে"
                    value={formWarrantyInfo}
                    onChange={(e) => setFormWarrantyInfo(e.target.value)}
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 text-slate-900 font-semibold"
                  />
                </div>

                {/* Delivery Type */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider block">ডেলিভারি ও নেওয়ার পদ্ধতি</label>
                  <select
                    value={formDeliveryType}
                    onChange={(e) => setFormDeliveryType(e.target.value as any)}
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold cursor-pointer"
                  >
                    <option value="pickup_only">সরাসরি দেখা করে নেওয়া (Self Pickup)</option>
                    <option value="delivery_available">কুরিয়ার বা হোম ডেলিভারি সুবিধা আছে</option>
                    <option value="free_delivery">ফ্রি হোম ডেলিভারি দেওয়া হবে</option>
                  </select>
                </div>
              </div>

              {/* Geographic Location Selector */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider block">
                  আপনার অবস্থান ও ঠিকানা *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <select
                    required
                    value={normalizeDivisionName(formDivision)}
                    onChange={(e) => {
                      setFormDivision(e.target.value);
                      setFormDistrict('');
                      setFormThana('');
                    }}
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold cursor-pointer"
                  >
                    <option value="">বিভাগ নির্বাচন করুন</option>
                    {BANGLADESH_LOCATIONS.map((loc, idx) => (
                      <option key={`mkt-div-${loc.division}-${idx}`} value={loc.division}>
                        {loc.division}
                      </option>
                    ))}
                  </select>

                  <select
                    required
                    value={normalizeDistrictName(formDivision, formDistrict)}
                    onChange={(e) => {
                      setFormDistrict(e.target.value);
                      setFormThana('');
                    }}
                    disabled={!normalizeDivisionName(formDivision)}
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold cursor-pointer disabled:opacity-60"
                  >
                    <option value="">{normalizeDivisionName(formDivision) ? 'জেলা নির্বাচন করুন' : 'আগে বিভাগ'}</option>
                    {normalizeDivisionName(formDivision) &&
                      Array.from(new Set(getDistrictsForDivision(normalizeDivisionName(formDivision)).map((d) => d.name))).map((dName, idx) => (
                        <option key={`mkt-dist-${dName}-${idx}`} value={dName}>
                          {dName}
                        </option>
                      ))}
                  </select>

                  <select
                    required
                    value={normalizeThanaName(formDivision, formDistrict, formThana)}
                    onChange={(e) => setFormThana(e.target.value)}
                    disabled={!normalizeDistrictName(formDivision, formDistrict)}
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold cursor-pointer disabled:opacity-60"
                  >
                    <option value="">{normalizeDistrictName(formDivision, formDistrict) ? 'থানা নির্বাচন করুন' : 'আগে জেলা'}</option>
                    {normalizeDistrictName(formDivision, formDistrict) &&
                      Array.from(new Set(getThanasForDistrict(normalizeDivisionName(formDivision), normalizeDistrictName(formDivision, formDistrict)))).map((t, idx) => (
                        <option key={`mkt-thana-${t}-${idx}`} value={t}>
                          {t}
                        </option>
                      ))}
                  </select>
                </div>

                <input
                  type="text"
                  placeholder="বিস্তারিত ঠিকানা (যেমন: রোড ১৫/এ, ধানমন্ডি বা বাসার কাছে ল্যান্ডমার্ক)"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 text-slate-900 font-semibold mt-2"
                />
              </div>

              {/* Photo Upload & Presets */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider block">
                    পণ্যের ছবি যুক্ত করুন (ক্যামেরা/ফাইল বা প্রিসেট) *
                  </label>
                  <label className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-black px-3 py-1 rounded-lg cursor-pointer flex items-center gap-1.5 border border-emerald-200">
                    <Camera className="w-3.5 h-3.5" />
                    <span>ছবি আপলোড করুন</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Selected images preview list */}
                {formImages.length > 0 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {formImages.map((imgUrl, idx) => (
                      <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-emerald-500 shrink-0 group">
                        <img src={imgUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          <X className="w-4 h-4 text-rose-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quick Presets */}
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block">অথবা নিচের রেডিমেড ছবি থেকে একটি বেছে নিন:</span>
                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                    {IMAGE_PRESETS.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFormImages([p.url])}
                        className="aspect-square rounded-lg overflow-hidden border relative group transition-all cursor-pointer hover:border-emerald-500"
                        title={p.label}
                      >
                        <img src={p.url} alt={p.label} className="w-full h-full object-cover" />
                        <div className="absolute inset-x-0 bottom-0 bg-black/70 text-[7px] font-bold text-white text-center py-0.5 truncate px-0.5">
                          {p.label}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom URL input */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="অথবা অনলাইন ছবির লিঙ্ক (URL) পেস্ট করুন..."
                    value={customImageUrlInput}
                    onChange={(e) => setCustomImageUrlInput(e.target.value)}
                    className="flex-1 text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 text-slate-700"
                  />
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-black rounded-xl cursor-pointer"
                  >
                    যোগ করুন
                  </button>
                </div>
              </div>

              {/* Description & AI Generator */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider block">
                    পণ্যের বিস্তারিত বিবরণ *
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateAiListing}
                    disabled={isGeneratingAiListing}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-[11px] font-black px-3.5 py-1.5 rounded-xl shadow-xs transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    {isGeneratingAiListing ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>এআই বিবরণ লিখছে...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                        <span>✨ এআই দিয়ে আকর্ষণীয় বিবরণ লিখুন</span>
                      </>
                    )}
                  </button>
                </div>

                <textarea
                  required
                  rows={4}
                  placeholder="পণ্যটি কতদিন ব্যবহার করেছেন, কোনো স্ক্র্যাচ বা সমস্যা আছে কি না, সাথে কি কি এক্সেসরিজ বা বক্স আছে এবং কেন বিক্রি করছেন বিস্তারিত লিখুন..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 font-semibold"
                />
              </div>

              {/* Safety notice */}
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl flex items-start gap-2.5 text-[11px] text-emerald-800 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>নিরাপত্তা বার্তা:</strong> আপনার বিজ্ঞাপন প্রকাশের সাথে সাথে স্থানীয় ক্রেতারা সরাসরি আপনার ফোন ও ইন-অ্যাপ মেসেজে যোগাযোগ করতে পারবেন। লেনদেনের পূর্বে কখনো অগ্রিম টাকা পাঠাবেন না বা চাইবেন না।
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl transition-all cursor-pointer"
                >
                  বাতিল করুন
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingForm}
                  className="px-7 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmittingForm ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>সংরক্ষণ হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>{editingProductId ? 'আপডেট সম্পন্ন করুন' : 'বিজ্ঞাপন প্রকাশ করুন'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🔍 PRODUCT DETAIL & INTERACTION MODAL */}
      {/* ========================================================================= */}
      {selectedProductForDetails && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-8">
            
            {/* Header with close */}
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-lg border ${CATEGORY_COLORS[selectedProductForDetails.category]}`}>
                  {CATEGORY_ICONS[selectedProductForDetails.category]} {CATEGORY_LABELS_BN[selectedProductForDetails.category]}
                </span>
                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-lg ${CONDITION_COLORS[selectedProductForDetails.condition]}`}>
                  {CONDITION_LABELS[selectedProductForDetails.condition]}
                </span>
              </div>
              <button
                onClick={() => setSelectedProductForDetails(null)}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Image Gallery */}
            <div className="space-y-2">
              <div className="aspect-[16/9] bg-slate-100 rounded-2xl overflow-hidden relative">
                <img
                  src={selectedProductForDetails.image || IMAGE_PRESETS[0].url}
                  alt={selectedProductForDetails.name}
                  className="w-full h-full object-cover"
                />
                {!selectedProductForDetails.isAvailable && (
                  <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center">
                    <span className="bg-rose-600 text-white font-black text-sm px-4 py-2 rounded-2xl">
                      🤝 পণ্যটি ইতিমধ্যে বিক্রি সম্পন্ন হয়েছে
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Title & Price Breakdown */}
            <div className="space-y-2">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 leading-snug">
                {selectedProductForDetails.name}
              </h2>

              <div className="flex items-baseline justify-between p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl">
                <div>
                  <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider block">বিক্রয় মূল্য</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-emerald-700">৳{selectedProductForDetails.price.toLocaleString('bn-BD')}</span>
                    {selectedProductForDetails.originalPrice && (
                      <span className="line-through text-sm text-slate-400 font-semibold">
                        ৳{selectedProductForDetails.originalPrice.toLocaleString('bn-BD')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-black text-emerald-800 block">
                    {selectedProductForDetails.isNegotiable ? '💬 আলোচনা সাপেক্ষ' : '🔒 ফিক্সড রেট'}
                  </span>
                  {selectedProductForDetails.originalPrice && selectedProductForDetails.originalPrice > selectedProductForDetails.price && (
                    <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                      ৳{(selectedProductForDetails.originalPrice - selectedProductForDetails.price).toLocaleString('bn-BD')} সাশ্রয়
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[9px] font-black text-slate-400 block uppercase">কন্ডিশন</span>
                <span className="font-extrabold text-slate-800">{CONDITION_LABELS[selectedProductForDetails.condition]}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[9px] font-black text-slate-400 block uppercase">ব্যবহারের সময়</span>
                <span className="font-extrabold text-slate-800">{selectedProductForDetails.usedDuration || 'কয়েক মাস'}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[9px] font-black text-slate-400 block uppercase">ওয়ারেন্টি</span>
                <span className="font-extrabold text-slate-800">{selectedProductForDetails.warrantyInfo || 'নাই'}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[9px] font-black text-slate-400 block uppercase">ডেলিভারি</span>
                <span className="font-extrabold text-slate-800 truncate block">{DELIVERY_LABELS[selectedProductForDetails.deliveryType || 'pickup_only']}</span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">পণ্যের বিবরণ:</h4>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">
                {selectedProductForDetails.description}
              </div>
            </div>

            {/* Seller Information Card */}
            <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="space-y-0.5">
                <span className="text-[9px] font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> যাচাইকৃত গ্রাহক বিক্রেতা
                </span>
                <h4 className="text-sm font-black">{selectedProductForDetails.sellerName}</h4>
                <p className="text-[11px] text-slate-300 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-emerald-400" />
                  {[selectedProductForDetails.thana, selectedProductForDetails.district || selectedProductForDetails.division || selectedProductForDetails.sellerAddress].filter(Boolean).join(', ') || 'ঢাকা'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProductForDetails(null);
                    onOpenChat(selectedProductForDetails.sellerPhone, selectedProductForDetails.sellerName);
                  }}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>চ্যাট করুন</span>
                </button>

                <a
                  href={`tel:${selectedProductForDetails.sellerPhone}`}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-white text-slate-950 hover:bg-slate-100 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 text-center"
                >
                  <Phone className="w-4 h-4 text-emerald-600" />
                  <span>কল দিন</span>
                </a>
              </div>
            </div>

            {/* Offer button if negotiable */}
            {selectedProductForDetails.isNegotiable && (
              <button
                onClick={() => {
                  const p = selectedProductForDetails;
                  setSelectedProductForDetails(null);
                  setShowOfferModalForProduct(p);
                }}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md"
              >
                <Tag className="w-4 h-4" />
                <span>বিক্রেতার কাছে সরাসরি দাম প্রস্তাব পাঠান (Make an Offer)</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🏷️ MAKE AN OFFER / BARGAINING MODAL */}
      {/* ========================================================================= */}
      {showOfferModalForProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Tag className="w-4 h-4 text-purple-600" />
                দাম প্রস্তাব পাঠান (Bargaining Offer)
              </h3>
              <button
                onClick={() => setShowOfferModalForProduct(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Product summary */}
            <div className="bg-purple-50/60 border border-purple-100 p-3 rounded-2xl space-y-1">
              <span className="text-[10px] font-black text-purple-700 block">{showOfferModalForProduct.name}</span>
              <div className="flex items-baseline gap-2">
                <span className="text-xs text-slate-500 font-bold">বিক্রেতার চাওয়া মূল্য:</span>
                <span className="text-sm font-black text-purple-900">৳{showOfferModalForProduct.price.toLocaleString('bn-BD')}</span>
              </div>
            </div>

            <form onSubmit={handleSubmitOffer} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-600 uppercase tracking-wider block">
                  আপনার প্রস্তাবিত ক্রয় মূল্য (৳) *
                </label>
                <input
                  type="number"
                  required
                  placeholder="যেমন: ২৫০০০"
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(e.target.value)}
                  className="w-full text-sm p-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-900 focus:outline-none focus:border-purple-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-600 uppercase tracking-wider block">
                  বিক্রেতার জন্য বিশেষ বার্তা <span className="text-slate-400 font-normal">(ঐচ্ছিক)</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="যেমন: ভাইয়া আমি আজকেই এসে ক্যাশ টাকায় নিয়ে যাব। রাখা যাবে?"
                  value={offerMessage}
                  onChange={(e) => setOfferMessage(e.target.value)}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-purple-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOfferModalForProduct(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingOffer}
                  className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-black rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmittingOffer ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>প্রস্তাব পাঠিয়ে দিন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 💡 AI FAIR RESALE PRICE ESTIMATOR & MARKET VALUATION MODAL */}
      {/* ========================================================================= */}
      {showPriceEstimatorModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-8">
            
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <div className="space-y-0.5">
                <span className="text-[9px] font-black text-amber-600 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> এআই বাজারদর ও সেকেন্ডহ্যান্ড ক্যালকুলেটর
                </span>
                <h3 className="text-base font-black text-slate-900">
                  সঠিক রিসেল বা বিক্রয় মূল্য যাচাই করুন
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowPriceEstimatorModal(false);
                  setEstimatorResult(null);
                }}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRunPriceEstimator} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider block">
                  পণ্যের নাম ও মডেল *
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: iPhone 12 (128GB), Walton 1.5 Ton AC, রিডিং টেবিল"
                  value={estimatorName}
                  onChange={(e) => setEstimatorName(e.target.value)}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider block">ক্যাটাগরি</label>
                  <select
                    value={estimatorCategory}
                    onChange={(e) => setEstimatorCategory(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold cursor-pointer"
                  >
                    {Object.keys(CATEGORY_LABELS_BN).map(k => (
                      <option key={k} value={k}>{CATEGORY_LABELS_BN[k]}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider block">কন্ডিশন</label>
                  <select
                    value={estimatorCondition}
                    onChange={(e) => setEstimatorCondition(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold cursor-pointer"
                  >
                    <option value="like_new">নতুনের মতো (Like New)</option>
                    <option value="used">ব্যবহৃত (Used)</option>
                    <option value="fair">কিছুটা পুরানো (Fair)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider block">আগে কেনার দাম (৳)</label>
                  <input
                    type="number"
                    placeholder="যেমন: ৪৫০০০"
                    value={estimatorOriginalPrice}
                    onChange={(e) => setEstimatorOriginalPrice(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider block">কতদিন ব্যবহার হয়েছে</label>
                  <input
                    type="text"
                    placeholder="যেমন: ৬ মাস, ১ বছর"
                    value={estimatorDuration}
                    onChange={(e) => setEstimatorDuration(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isEstimatingPrice}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isEstimatingPrice ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>এআই হিসাব করছে...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-yellow-300" />
                    <span>এআই দিয়ে বাজারদর হিসাব করুন</span>
                  </>
                )}
              </button>
            </form>

            {/* Estimation Result */}
            {estimatorResult && (
              <div className="bg-emerald-50/80 border border-emerald-200 p-4 rounded-2xl space-y-3 animate-in fade-in duration-300">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider block">
                    প্রস্তাবিত যুক্তিসঙ্গত বিক্রয়মূল্য:
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-emerald-700">
                      ৳{estimatorResult.recommendedPrice?.toLocaleString('bn-BD')}
                    </span>
                    <span className="text-xs text-slate-500 font-bold">
                      (পরিসীমা: ৳{estimatorResult.estimatedMinPrice?.toLocaleString('bn-BD')} - ৳{estimatorResult.estimatedMaxPrice?.toLocaleString('bn-BD')})
                    </span>
                  </div>
                </div>

                <p className="text-xs text-emerald-950 leading-relaxed font-medium bg-white/70 p-2.5 rounded-xl border border-emerald-100">
                  {estimatorResult.valuationSummary}
                </p>

                {estimatorResult.fastSellingTips && estimatorResult.fastSellingTips.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-emerald-800 uppercase block">💡 দ্রুত বিক্রির টিপস:</span>
                    <ul className="text-[11px] text-emerald-900 space-y-1 list-disc list-inside">
                      {estimatorResult.fastSellingTips.map((tip: string, idx: number) => (
                        <li key={idx}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <button
                  onClick={() => {
                    setFormName(estimatorName);
                    setFormCategory(estimatorCategory as any);
                    setFormCondition(estimatorCondition as any);
                    setFormOriginalPrice(estimatorOriginalPrice);
                    setFormPrice(String(estimatorResult.recommendedPrice || ''));
                    setFormUsedDuration(estimatorDuration);
                    setShowPriceEstimatorModal(false);
                    setShowAddModal(true);
                  }}
                  className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>এই দামে এখনই বিজ্ঞাপন পোস্ট করুন</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🛡️ SAFETY & SCAM PREVENTION MODAL */}
      {/* ========================================================================= */}
      {showSafetyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                নিরাপদে সেকেন্ডহ্যান্ড কেনাবেচার ৫টি মূল নিয়ম
              </h3>
              <button
                onClick={() => setShowSafetyModal(false)}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700 leading-relaxed font-medium">
              <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <span className="bg-emerald-600 text-white font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">১</span>
                <p><strong>পাবলিক প্লেসে দেখা করুন:</strong> কেনাবেচার সময় জনবহুল জায়গায় (যেমন: শপিং মল, রেস্টুরেন্ট বা চেনা বাসস্ট্যান্ড) সরাসরি দেখা করুন।</p>
              </div>

              <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <span className="bg-emerald-600 text-white font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">২</span>
                <p><strong>কখনো অগ্রিম টাকা দেবেন না:</strong> পণ্য হাতে পেয়ে নিজে চালিয়ে ও পরখ করে দেখে নেওয়ার আগে বিকাশ বা নগদে কোনো অগ্রিম পেমেন্ট করবেন না।</p>
              </div>

              <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <span className="bg-emerald-600 text-white font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">৩</span>
                <p><strong>ইলেকট্রনিক্স ডিভাইসের আইএমইআই (IMEI) ও বক্স চেক করুন:</strong> ফোন বা ল্যাপটপ কেনার সময় অরিজিনাল ক্যাশ মেমো বা বক্স যাচাই করে নিন।</p>
              </div>

              <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <span className="bg-emerald-600 text-white font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">৪</span>
                <p><strong>অতিরিক্ত অস্বাভাবিক কম দামে সতর্ক থাকুন:</strong> বাজারদরের চেয়ে অবিশ্বাস্য কম দামের লোভনীয় বিজ্ঞাপনে সন্দেহ থাকলে সতর্ক থাকুন।</p>
              </div>

              <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <span className="bg-emerald-600 text-white font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">৫</span>
                <p><strong>ইন-অ্যাপ চ্যাট বা কল ব্যবহার করুন:</strong> কোনো সন্দেহজনক বিক্রেতা বা ক্রেতা দেখলে সাথে সাথে সাপোর্ট বা চ্যাটে জানান।</p>
              </div>
            </div>

            <button
              onClick={() => setShowSafetyModal(false)}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-xl transition-all cursor-pointer"
            >
              আমি বুঝতে পেরেছি, ধন্যবাদ
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
