import React, { useState } from 'react';
import { 
  Store, Plus, Trash2, Sparkles, AlertCircle, ShoppingBag, 
  Settings, DollarSign, Wallet, Star, Calendar, Clock, Image, PlusCircle, CreditCard, ChevronRight,
  BarChart2, TrendingUp, Users, CheckCircle, Clock3, Ban, Search, Mail, Phone, MapPin, FileText, RefreshCw, Upload,
  Edit, Edit2, Edit3, Copy, Tag, Package, SlidersHorizontal, Layers, Percent, Check, Eye, Share2
} from 'lucide-react';
import { Business, Product, ServiceItem, Booking, AdCampaign, User, WholesaleTier } from '../types';
import { CATEGORIES, SUBSCRIPTION_PLANS } from '../data/categories';
import { BANGLADESH_LOCATIONS, getDistrictsForDivision, getThanasForDistrict, isLocationMatch, parseLocationFromAddress, normalizeDivisionName, normalizeDistrictName, normalizeThanaName } from '../data/bangladeshLocations';
import PhotoCaptureUpload from './PhotoCaptureUpload';
import { WholesalePricingForm } from './WholesalePricingForm';
import { WholesaleBusinessManager } from './WholesaleBusinessManager';
import SellerTutorialsPage from './SellerTutorialsPage';
import { FacebookImportModal, FacebookShareModal, ExtractedProductItem, ExtractedShopDetails } from './FacebookIntegrationTools';

import { Language } from '../translations';

// Curated Bangladeshi product & service photo presets for rapid merchant listing creation
const BANGLADESH_PRODUCT_IMAGE_PRESETS = [
  { label: 'মিনিকেট চাল', category: 'মুদি', url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=400' },
  { label: 'সরিষার তেল', category: 'মুদি', url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=400' },
  { label: 'ডিম ও দুধ', category: 'ডেইরি', url: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&q=80&w=400' },
  { label: 'তাজা শাকসবজি', category: 'শাকসবজি', url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=400' },
  { label: 'আম ও ফলমূল', category: 'ফলমূল', url: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&q=80&w=400' },
  { label: 'মাছ ও মাংস', category: 'মাছ-মাংস', url: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&q=80&w=400' },
  { label: 'মিষ্টি ও দই', category: 'মিষ্টান্ন', url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=400' },
  { label: 'চা ও স্ন্যাক্স', category: 'বেকারি', url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=400' },
  { label: 'পোশাক ও শাড়ি', category: 'ফ্যাশন', url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=400' },
  { label: 'স্মার্টফোন ও গ্যাজেট', category: 'ইলেকট্রনিক্স', url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=400' },
  { label: 'ওষুধ ও ফার্মেসি', category: 'ফার্মেসি', url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=400' },
  { label: 'হার্ডওয়্যার ও টুলস', category: 'হার্ডওয়্যার', url: 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&q=80&w=400' },
];

const AI_PRODUCT_FEATURE_CHIPS = [
  '💯 ১০০% খাঁটি ও ফ্রেশ',
  '⭐ প্রিমিয়াম কোয়ালিটি',
  '⚡ দ্রুততম হোম ডেলিভারি',
  '🏷️ আকর্ষণীয় মূল্যছাড়',
  '🛡️ আসল পণ্যের শতভাগ গ্যারান্টি',
  '🌿 সম্পূর্ণ কেমিক্যালমুক্ত',
  '📦 ইনট্যাক্ট ও সিলপ্যাক',
  '🔧 দক্ষ মেকানিক ও টেকনিশিয়ান'
];

interface MerchantDashboardProps {
  currentUser: User;
  business: Business | null;
  activeBookings: Booking[];
  activeAds: AdCampaign[];
  onRegisterOrUpdateBusiness: (data: Partial<Business>) => Promise<void>;
  onUpdateItems: (products: Product[], services: ServiceItem[]) => Promise<void>;
  onUpgradeSubscription: (plan: 'free' | 'silver' | 'gold' | 'diamond' | string, amount: number, method: string) => Promise<void>;
  onAddOffer: (offerData: any) => Promise<void>;
  onUpdateOffer?: (offerId: string, offerData: any) => Promise<void>;
  onDeleteOffer?: (offerId: string) => Promise<void>;
  onCreateAdCampaign: (adData: any) => Promise<void>;
  onUpdateBookingStatus: (id: string, status: string, paymentStatus?: string) => Promise<void>;
  onRefreshDb: () => Promise<void>;
  subscriptionPlans?: any[];
  categories?: any[];
  language?: Language;
}

export default function MerchantDashboard({
  currentUser,
  business,
  activeBookings,
  activeAds,
  onRegisterOrUpdateBusiness,
  onUpdateItems,
  onUpgradeSubscription,
  onAddOffer,
  onUpdateOffer,
  onDeleteOffer,
  onCreateAdCampaign,
  onUpdateBookingStatus,
  onRefreshDb,
  subscriptionPlans = [],
  categories,
  language = 'bn'
}: MerchantDashboardProps) {
  const categoriesList = categories && categories.length > 0 ? categories : CATEGORIES;
  const [merchantSubTab, setMerchantSubTab] = useState<'dashboard' | 'orders' | 'items' | 'add_product' | 'wholesale' | 'tutorial' | 'faq' | 'free_delivery' | 'promotion' | 'profile' | 'customers' | 'reports' | 'wallet' | 'ads'>('add_product');
  const [showTopPromoBanner, setShowTopPromoBanner] = useState(true);
  const [duplicateSearchQuery, setDuplicateSearchQuery] = useState('');
  const [duplicateSearchResult, setDuplicateSearchResult] = useState<string | null>(null);
  const [promoSubmitted, setPromoSubmitted] = useState(false);
  const [wholesaleDiscountPercent, setWholesaleDiscountPercent] = useState(10);
  const [wholesaleMinQty, setWholesaleMinQty] = useState(5);
  const [freeDeliveryMinOrder, setFreeDeliveryMinOrder] = useState(500);
  
  // States for forms
  const [bizName, setBizName] = useState(business?.name || '');
  const [bizPhone, setBizPhone] = useState(business?.phone || currentUser.phone);
  const [bizWhatsapp, setBizWhatsapp] = useState(business?.whatsapp || currentUser.phone);
  const [bizWebsiteUrl, setBizWebsiteUrl] = useState(business?.websiteUrl || '');
  const [bizDesc, setBizDesc] = useState(business?.description || '');
  const [bizAddress, setBizAddress] = useState(business?.address || '');
  const [bizCategory, setBizCategory] = useState<any>(business?.category || 'grocery');
  const [bizType, setBizType] = useState<'shop' | 'service'>(business?.type || 'shop');
  const [hasHomeDelivery, setHasHomeDelivery] = useState(business?.hasHomeDelivery || false);
  const [deliveryCharge, setDeliveryCharge] = useState(business?.deliveryCharge || 0);
  const [logoUrl, setLogoUrl] = useState(business?.logo || '');
  const [bizImages, setBizImages] = useState<string[]>(business?.images || []);
  const [bizDivision, setBizDivision] = useState(business?.division || currentUser.location?.division || '');
  const [bizDistrict, setBizDistrict] = useState(business?.district || currentUser.location?.district || '');
  const [bizThana, setBizThana] = useState(business?.thana || currentUser.location?.thana || '');
  const [bizLat, setBizLat] = useState<number>(business?.location?.lat || currentUser.location?.lat || 23.75);
  const [bizLng, setBizLng] = useState<number>(business?.location?.lng || currentUser.location?.lng || 90.38);
  const [detectingGps, setDetectingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsSuccess, setGpsSuccess] = useState<string | null>(null);
  const [showWebsitePreviewModal, setShowWebsitePreviewModal] = useState(false);

  // Keep form inputs updated when business data loads asynchronously from database
  React.useEffect(() => {
    if (business) {
      setBizName(business.name || '');
      setBizPhone(business.phone || currentUser.phone);
      setBizWhatsapp(business.whatsapp || currentUser.phone);
      setBizWebsiteUrl(business.websiteUrl || '');
      setBizDesc(business.description || '');
      setBizAddress(business.address || '');
      setBizCategory(business.category || 'grocery');
      setBizType(business.type || 'shop');
      setHasHomeDelivery(business.hasHomeDelivery || false);
      setDeliveryCharge(business.deliveryCharge || 0);
      setLogoUrl(business.logo || '');
      setBizImages(business.images || (business.logo ? [business.logo] : []));
      setBizDivision(business.division || '');
      setBizDistrict(business.district || '');
      setBizThana(business.thana || '');
      if (business.location) {
        setBizLat(business.location.lat || 23.75);
        setBizLng(business.location.lng || 90.38);
      }
    }
  }, [business, currentUser]);

  const handleDetectStoreGpsLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('আপনার ব্রাউজারে জিও-লোকেশন সুবিধা নেই।');
      return;
    }
    setDetectingGps(true);
    setGpsError(null);
    setGpsSuccess(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setBizLat(latitude);
        setBizLng(longitude);

        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=bn,en`);
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const state = addr.state || addr.city || '';
            const district = addr.state_district || addr.district || addr.city || '';
            const suburb = addr.suburb || addr.neighbourhood || addr.city_district || addr.town || '';

            if (data.display_name) {
              setBizAddress(data.display_name.split(',').slice(0, 4).join(',').trim());
              const parsed = parseLocationFromAddress(data.display_name);
              if (parsed.division) setBizDivision(parsed.division);
              if (parsed.district) setBizDistrict(parsed.district);
              if (parsed.thana) setBizThana(parsed.thana);
            }

            // Fallback match division, district, thana using state, district, suburb
            if (!bizDivision) {
              for (const loc of BANGLADESH_LOCATIONS) {
                const divMatch = isLocationMatch(state, loc.division);
                if (divMatch) {
                  setBizDivision(loc.division);
                  for (const d of loc.districts) {
                    const distMatch = isLocationMatch(district, d.name);
                    if (distMatch) {
                      setBizDistrict(d.name);
                      for (const t of d.thanas) {
                        if (isLocationMatch(suburb, t)) {
                          setBizThana(t);
                          break;
                        }
                      }
                      break;
                    }
                  }
                  break;
                }
              }
            }

            setGpsSuccess(`সফলভাবে জিপিএস অবস্থান পিন করা হয়েছে (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
          } else {
            setGpsSuccess(`জিপিএস স্থানাঙ্ক সেট করা হয়েছে (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
          }
        } catch (err) {
          console.warn('Geocoding error:', err);
          setGpsSuccess(`জিপিএস স্থানাঙ্ক সেট করা হয়েছে (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
        } finally {
          setDetectingGps(false);
        }
      },
      (err) => {
        setDetectingGps(false);
        setGpsError('জিপিএস লোকেশন নেওয়া সম্ভব হয়নি। ব্রাউজারের লোকেশন পারমিশন দিন।');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // AI Prompt Builder State
  const [aiBulletPoints, setAiBulletPoints] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // New item States
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState<number>(0);
  const [newItemOriginalPrice, setNewItemOriginalPrice] = useState<number>(0);
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemImage, setNewItemImage] = useState('');
  const [newItemKeyPoints, setNewItemKeyPoints] = useState('');
  const [selectedFeatureChips, setSelectedFeatureChips] = useState<string[]>([]);
  const [isGeneratingItemDesc, setIsGeneratingItemDesc] = useState(false);
  const [aiDescGeneratedSuccess, setAiDescGeneratedSuccess] = useState(false);
  const [newItemWholesaleAvailable, setNewItemWholesaleAvailable] = useState(false);
  const [newItemWholesalePrice, setNewItemWholesalePrice] = useState<number>(0);
  const [newItemWholesaleMinQty, setNewItemWholesaleMinQty] = useState<number>(5);
  const [newItemWholesaleUnit, setNewItemWholesaleUnit] = useState<string>('পিস');
  const [newItemWholesaleTiers, setNewItemWholesaleTiers] = useState<WholesaleTier[]>([]);
  const [newItemWholesaleStock, setNewItemWholesaleStock] = useState<number>(0);

  // Edit Product / Service Modal States
  const [showEditItemModal, setShowEditItemModal] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemType, setEditingItemType] = useState<'product' | 'service'>('product');
  const [editItemName, setEditItemName] = useState('');
  const [editItemPrice, setEditItemPrice] = useState<number>(0);
  const [editItemOriginalPrice, setEditItemOriginalPrice] = useState<number>(0);
  const [editItemDesc, setEditItemDesc] = useState('');
  const [editItemImage, setEditItemImage] = useState('');
  const [editItemAvailable, setEditItemAvailable] = useState<boolean>(true);
  const [editSelectedChips, setEditSelectedChips] = useState<string[]>([]);
  const [isGeneratingEditDesc, setIsGeneratingEditDesc] = useState(false);
  const [editAiDescSuccess, setEditAiDescSuccess] = useState(false);
  const [editItemWholesaleAvailable, setEditItemWholesaleAvailable] = useState(false);
  const [editItemWholesalePrice, setEditItemWholesalePrice] = useState<number>(0);
  const [editItemWholesaleMinQty, setEditItemWholesaleMinQty] = useState<number>(5);
  const [editItemWholesaleUnit, setEditItemWholesaleUnit] = useState<string>('পিস');
  const [editItemWholesaleTiers, setEditItemWholesaleTiers] = useState<WholesaleTier[]>([]);
  const [editItemWholesaleStock, setEditItemWholesaleStock] = useState<number>(0);

  // Facebook Auto-Import & Viral Share States
  const [showFbImportModal, setShowFbImportModal] = useState(false);
  const [fbImportTarget, setFbImportTarget] = useState<'merchant_product' | 'c2c_marketplace' | 'business_page'>('merchant_product');
  const [showFbShareModal, setShowFbShareModal] = useState(false);
  const [fbShareItem, setFbShareItem] = useState<{ title: string; price: number; originalPrice?: number; image?: string } | null>(null);

  // Items search & filter state
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [itemFilterStatus, setItemFilterStatus] = useState<'all' | 'in_stock' | 'out_of_stock'>('all');

  const toggleFeatureChip = (chip: string) => {
    if (selectedFeatureChips.includes(chip)) {
      setSelectedFeatureChips(prev => prev.filter(c => c !== chip));
    } else {
      setSelectedFeatureChips(prev => [...prev, chip]);
    }
  };

  const handleGenerateAiProductDesc = async (customPoints?: string) => {
    if (!newItemName.trim()) {
      alert('দয়া করে প্রথমে পণ্যের নাম লিখুন (যেমন: মিনিকেট চাল, খাঁটি সরিষার তেল, ইত্যাদি)।');
      return;
    }
    setIsGeneratingItemDesc(true);
    setAiDescGeneratedSuccess(false);

    // Combine custom points + selected chips
    const combinedKeyPoints = [
      customPoints || newItemKeyPoints,
      ...selectedFeatureChips
    ].filter(Boolean).join(', ');

    try {
      const res = await fetch('/api/ai/generate-product-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: newItemName.trim(),
          businessName: business?.name || 'আমাদের দোকান',
          category: business?.category || 'grocery',
          type: business?.type || 'shop',
          price: newItemPrice,
          keyPoints: combinedKeyPoints || undefined,
        }),
      });
      const data = await res.json();
      if (data && data.description) {
        setNewItemDesc(data.description);
        setAiDescGeneratedSuccess(true);
        setTimeout(() => setAiDescGeneratedSuccess(false), 3500);
      }
    } catch (e) {
      console.error('AI Product desc err:', e);
      alert('AI বিবরণ তৈরিতে সামান্য বিলম্ব হচ্ছে, অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setIsGeneratingItemDesc(false);
    }
  };

  const handleProductImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setNewItemImage(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // Payment gateway modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<any>(null);
  const [paymentNumber, setPaymentNumber] = useState('');
  const [paymentPin, setPaymentPin] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'bkash' | 'nagad' | 'rocket'>('bkash');

  // Ad campaign state
  const [adPlacement, setAdPlacement] = useState<'homepage' | 'category' | 'search'>('homepage');
  const [adBanner, setAdBanner] = useState('');
  const [adBudget, setAdBudget] = useState(500);

  // Offers state
  const [offerTitle, setOfferTitle] = useState('');
  const [offerCode, setOfferCode] = useState('');
  const [offerDiscount, setOfferDiscount] = useState(10);
  const [offerExpiry, setOfferExpiry] = useState('');

  // Customer Directory States
  const [showCustModal, setShowCustModal] = useState(false);
  const [editingCustId, setEditingCustId] = useState<string | null>(null);
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custAddress, setCustAddress] = useState('');
  const [custNotes, setCustNotes] = useState('');
  const [custBalanceDue, setCustBalanceDue] = useState<number>(0);
  const [custSearchQuery, setCustSearchQuery] = useState('');

  // Product/Service Modal States
  const [showProductModal, setShowProductModal] = useState(false);

  // Calculate Merchant reports
  const totalSalesCount = activeBookings.filter(b => b.status === 'completed').length;
  const totalEarnedAmount = activeBookings
    .filter(b => b.status === 'completed')
    .reduce((sum, b) => sum + b.totalPrice, 0);
  const pendingOrdersCount = activeBookings.filter(b => b.status === 'pending').length;

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onRegisterOrUpdateBusiness({
      name: bizName,
      phone: bizPhone,
      whatsapp: bizWhatsapp,
      websiteUrl: bizWebsiteUrl.trim() || undefined,
      description: bizDesc,
      address: bizAddress,
      category: bizCategory,
      type: bizType,
      hasHomeDelivery,
      deliveryCharge,
      logo: logoUrl || undefined,
      images: bizImages.length > 0 ? bizImages : (logoUrl ? [logoUrl] : undefined),
      isOpen: business ? business.isOpen : true,
      division: bizDivision,
      district: bizDistrict,
      thana: bizThana,
      location: { lat: Number(bizLat) || 23.75, lng: Number(bizLng) || 90.38 },
    });
    alert('দোকানের প্রোফাইল ও লোকেশন তথ্য সফলভাবে আপডেট করা হয়েছে!');
  };

  const handleGenerateAiDescription = async () => {
    if (!bizName) {
      alert('দোকানের নাম আগে পূরণ করুন!');
      return;
    }
    setAiLoading(true);
    try {
      const response = await fetch('/api/ai/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: bizName,
          category: bizCategory,
          type: bizType,
          items: aiBulletPoints
        })
      });
      const data = await response.json();
      if (data.description) {
        setBizDesc(data.description);
        alert('AI সাফল্যের সাথে আপনার ব্যবসার একটি সুন্দর ও আকর্ষণীয় বর্ণনা তৈরি করেছে!');
      }
    } catch (e) {
      console.error(e);
      alert('AI বর্ণনা লোড করতে সমস্যা হয়েছে।');
    } finally {
      setAiLoading(false);
    }
  };

  // Item List manipulation
  const handleAddItem = async () => {
    if (!business || !newItemName || newItemPrice <= 0) return;
    
    // Check product limits (default to 100 if undefined)
    const limit = business.maxProductsLimit !== undefined ? business.maxProductsLimit : 100;
    const currentCount = business.type === 'shop' ? business.products.length : business.services.length;
    if (currentCount >= limit) {
      alert(`দুঃখিত! আপনার আইটেম আপলোডের সীমা (${limit} টি) অতিক্রম করেছে। আরও আপলোড করতে অ্যাডমিনের সাথে যোগাযোগ করুন।`);
      return;
    }

    const isApproved = (currentUser.role === 'admin' || business.isAutoItemApprovalAllowed === true) ? true : false;
    
    if (business.type === 'shop') {
      const newItem: Product = {
        id: `p-${Date.now()}`,
        name: newItemName,
        price: newItemPrice,
        originalPrice: newItemOriginalPrice > 0 ? newItemOriginalPrice : undefined,
        description: newItemDesc || undefined,
        image: newItemImage || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200',
        isAvailable: true,
        isApproved,
        isWholesaleAvailable: newItemWholesaleAvailable,
        wholesalePrice: newItemWholesaleAvailable && newItemWholesalePrice > 0 ? newItemWholesalePrice : undefined,
        wholesaleMinQty: newItemWholesaleAvailable ? (newItemWholesaleMinQty || 5) : undefined,
        wholesaleUnit: newItemWholesaleAvailable ? (newItemWholesaleUnit || 'পিস') : undefined,
        wholesaleTiers: newItemWholesaleAvailable && newItemWholesaleTiers.length > 0 ? newItemWholesaleTiers : undefined,
        wholesaleStock: newItemWholesaleAvailable && newItemWholesaleStock > 0 ? newItemWholesaleStock : undefined,
      };
      const updatedProducts = [...business.products, newItem];
      await onUpdateItems(updatedProducts, []);
    } else {
      const newItem: ServiceItem = {
        id: `s-${Date.now()}`,
        name: newItemName,
        charge: newItemPrice,
        description: newItemDesc || undefined,
        isAvailable: true,
        isApproved,
      };
      const updatedServices = [...business.services, newItem];
      await onUpdateItems([], updatedServices);
    }

    setNewItemName('');
    setNewItemPrice(0);
    setNewItemOriginalPrice(0);
    setNewItemDesc('');
    setNewItemImage('');
    setNewItemWholesaleAvailable(false);
    setNewItemWholesalePrice(0);
    setNewItemWholesaleMinQty(5);
    setNewItemWholesaleUnit('পিস');
    setNewItemWholesaleTiers([]);
    setNewItemWholesaleStock(0);
    setShowProductModal(false);
    
    if (currentUser.role === 'admin' || business.isAutoItemApprovalAllowed === true) {
      alert('নতুন আইটেম সফলভাবে যোগ করা হয়েছে এবং অনুমোদিত হয়েছে!');
    } else {
      alert('নতুন আইটেম সফলভাবে যোগ করা হয়েছে! অ্যাডমিন অনুমোদনের পর এটি গ্রাহকরা দেখতে পাবেন।');
    }
  };

  // Facebook Auto-Import Handlers
  const handleImportExtractedProducts = async (extracted: ExtractedProductItem[]) => {
    if (!business) return;
    const isApproved = (currentUser.role === 'admin' || business.isAutoItemApprovalAllowed === true);

    const newProducts: Product[] = extracted.map((item, idx) => ({
      id: `p-fb-${Date.now()}-${idx}`,
      name: item.name,
      price: item.price,
      originalPrice: item.originalPrice && item.originalPrice > item.price ? item.originalPrice : undefined,
      description: item.description,
      image: item.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400',
      isAvailable: true,
      isApproved,
      isWholesaleAvailable: item.isWholesaleAvailable,
      wholesalePrice: item.wholesalePrice,
      wholesaleMinQty: item.wholesaleMinQty,
    }));

    const updatedProducts = [...(business.products || []), ...newProducts];
    await onUpdateItems(updatedProducts, business.services || []);
    if (onRefreshDb) {
      await onRefreshDb();
    }
    setMerchantSubTab('items');
  };

  const handleImportShopDetails = async (details: ExtractedShopDetails) => {
    if (!business) return;
    const updatedData: Partial<Business> = {
      ...business,
      name: details.name || business.name,
      phone: details.phone || business.phone,
      whatsapp: details.whatsapp || business.whatsapp,
      address: details.address || business.address,
      description: details.description || business.description,
      category: (details.category as any) || business.category,
    };
    await onRegisterOrUpdateBusiness(updatedData);
    if (onRefreshDb) {
      await onRefreshDb();
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!business) return;
    if (confirm('আপনি কি এই পণ্য/সেবাটি নিশ্চিতভাবে ডিলিট করতে চান?')) {
      if (business.type === 'shop') {
        const filtered = business.products.filter(p => p.id !== itemId);
        await onUpdateItems(filtered, []);
      } else {
        const filtered = business.services.filter(s => s.id !== itemId);
        await onUpdateItems([], filtered);
      }
    }
  };

  // Edit Item Handlers
  const handleOpenEditProduct = (p: Product) => {
    setEditingItemId(p.id);
    setEditingItemType('product');
    setEditItemName(p.name);
    setEditItemPrice(p.price);
    setEditItemOriginalPrice(p.originalPrice || 0);
    setEditItemDesc(p.description || '');
    setEditItemImage(p.image || '');
    setEditItemAvailable(p.isAvailable !== false);
    setEditItemWholesaleAvailable(p.isWholesaleAvailable || false);
    setEditItemWholesalePrice(p.wholesalePrice || 0);
    setEditItemWholesaleMinQty(p.wholesaleMinQty || 5);
    setEditItemWholesaleUnit(p.wholesaleUnit || 'পিস');
    setEditItemWholesaleTiers(p.wholesaleTiers ? [...p.wholesaleTiers] : []);
    setEditItemWholesaleStock(p.wholesaleStock || 0);
    setEditSelectedChips([]);
    setShowEditItemModal(true);
  };

  const handleOpenEditService = (s: ServiceItem) => {
    setEditingItemId(s.id);
    setEditingItemType('service');
    setEditItemName(s.name);
    setEditItemPrice(s.charge);
    setEditItemOriginalPrice(0);
    setEditItemDesc(s.description || '');
    setEditItemImage('');
    setEditItemAvailable(s.isAvailable !== false);
    setEditSelectedChips([]);
    setShowEditItemModal(true);
  };

  const toggleEditFeatureChip = (chip: string) => {
    if (editSelectedChips.includes(chip)) {
      setEditSelectedChips(prev => prev.filter(c => c !== chip));
    } else {
      setEditSelectedChips(prev => [...prev, chip]);
    }
  };

  const handleGenerateAiEditDesc = async () => {
    if (!editItemName.trim()) {
      alert('দয়া করে প্রথমে পণ্যের নাম লিখুন।');
      return;
    }
    setIsGeneratingEditDesc(true);
    setEditAiDescSuccess(false);

    const combinedKeyPoints = editSelectedChips.join(', ');

    try {
      const res = await fetch('/api/ai/generate-product-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: editItemName.trim(),
          businessName: business?.name || 'আমাদের দোকান',
          category: business?.category || 'grocery',
          type: business?.type || 'shop',
          price: editItemPrice,
          keyPoints: combinedKeyPoints || undefined,
        }),
      });
      const data = await res.json();
      if (data && data.description) {
        setEditItemDesc(data.description);
        setEditAiDescSuccess(true);
        setTimeout(() => setEditAiDescSuccess(false), 3500);
      }
    } catch (e) {
      console.error('AI Product edit desc err:', e);
      alert('AI বিবরণ তৈরিতে সামান্য বিলম্ব হচ্ছে, অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setIsGeneratingEditDesc(false);
    }
  };

  const handleSaveEditedItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business || !editingItemId) return;
    if (!editItemName.trim()) {
      alert('পণ্যের নাম আবশ্যক!');
      return;
    }
    if (editItemPrice <= 0) {
      alert('পণ্যের মূল্য বা চার্জ ০ এর বেশি হতে হবে!');
      return;
    }

    if (editingItemType === 'product') {
      const updatedProducts = business.products.map(p => {
        if (p.id === editingItemId) {
          return {
            ...p,
            name: editItemName.trim(),
            price: Number(editItemPrice),
            originalPrice: editItemOriginalPrice > 0 ? Number(editItemOriginalPrice) : undefined,
            description: editItemDesc.trim() || undefined,
            image: editItemImage || p.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200',
            isAvailable: editItemAvailable,
            isWholesaleAvailable: editItemWholesaleAvailable,
            wholesalePrice: editItemWholesaleAvailable && editItemWholesalePrice > 0 ? Number(editItemWholesalePrice) : undefined,
            wholesaleMinQty: editItemWholesaleAvailable ? Number(editItemWholesaleMinQty || 5) : undefined,
            wholesaleUnit: editItemWholesaleAvailable ? (editItemWholesaleUnit || 'পিস') : undefined,
            wholesaleTiers: editItemWholesaleAvailable && editItemWholesaleTiers.length > 0 ? editItemWholesaleTiers : undefined,
            wholesaleStock: editItemWholesaleAvailable && editItemWholesaleStock > 0 ? Number(editItemWholesaleStock) : undefined,
          };
        }
        return p;
      });
      await onUpdateItems(updatedProducts, []);
      alert('✅ পণ্যটির সকল তথ্য ও পাইকারি সেটিংস সফলভাবে আপডেট করা হয়েছে!');
    } else {
      const updatedServices = business.services.map(s => {
        if (s.id === editingItemId) {
          return {
            ...s,
            name: editItemName.trim(),
            charge: Number(editItemPrice),
            description: editItemDesc.trim() || undefined,
            isAvailable: editItemAvailable,
          };
        }
        return s;
      });
      await onUpdateItems([], updatedServices);
      alert('✅ সেবার তথ্য সফলভাবে আপডেট করা হয়েছে!');
    }

    setShowEditItemModal(false);
    setEditingItemId(null);
  };

  const handleToggleAvailability = async (itemId: string, type: 'product' | 'service') => {
    if (!business) return;
    if (type === 'product') {
      const updated = business.products.map(p => {
        if (p.id === itemId) {
          const nextStatus = p.isAvailable === false ? true : false;
          return { ...p, isAvailable: nextStatus };
        }
        return p;
      });
      await onUpdateItems(updated, []);
    } else {
      const updated = business.services.map(s => {
        if (s.id === itemId) {
          const nextStatus = s.isAvailable === false ? true : false;
          return { ...s, isAvailable: nextStatus };
        }
        return s;
      });
      await onUpdateItems([], updated);
    }
  };

  const handleDuplicateProduct = async (p: Product) => {
    if (!business) return;
    const isApproved = (currentUser.role === 'admin' || business.isAutoItemApprovalAllowed === true) ? true : false;
    const duplicated: Product = {
      ...p,
      id: `p-${Date.now()}`,
      name: `${p.name} (কপি)`,
      isApproved,
    };
    const updated = [...business.products, duplicated];
    await onUpdateItems(updated, []);
    alert(`"${p.name}" পণ্যটি সফলভাবে ক্লোন/কপি করা হয়েছে!`);
  };

  const handleTriggerUpgrade = (plan: any) => {
    setSelectedPlanForPayment(plan);
    setShowPaymentModal(true);
  };

  const handleConfirmSubscriptionPayment = async () => {
    if (!paymentNumber || !paymentPin) {
      alert('আপনার নম্বর ও পিন নাম্বার দিন!');
      return;
    }
    await onUpgradeSubscription(selectedPlanForPayment.id, selectedPlanForPayment.price, paymentMethod);
    setShowPaymentModal(false);
    setPaymentNumber('');
    setPaymentPin('');
    alert(`সাফল্যের সাথে আপনার ব্যবসাকে ${selectedPlanForPayment.name} প্যাকেজে আপগ্রেড করা হয়েছে!`);
  };

  const handleAddOfferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerTitle || !offerCode || offerDiscount <= 0 || !offerExpiry) return;
    await onAddOffer({
      title: offerTitle.trim(),
      code: offerCode.trim().toUpperCase(),
      discountPercent: offerDiscount,
      description: `কুপন কোড ব্যবহার করে পান ${offerDiscount}% বিশেষ ছাড়!`,
      expiryDate: offerExpiry,
    });
    setOfferTitle('');
    setOfferCode('');
    setOfferDiscount(10);
    setOfferExpiry('');
    alert('নতুন ডিসকাউন্ট কুপন সফলভাবে সক্রিয় করা হয়েছে!');
    if (onRefreshDb) await onRefreshDb();
  };

  // State & Handlers for Editing and Deleting Merchant Offers
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
  const [editOfferTitle, setEditOfferTitle] = useState('');
  const [editOfferCode, setEditOfferCode] = useState('');
  const [editOfferDiscount, setEditOfferDiscount] = useState<number>(10);
  const [editOfferExpiry, setEditOfferExpiry] = useState('');
  const [editOfferDesc, setEditOfferDesc] = useState('');
  const [copiedCouponId, setCopiedCouponId] = useState<string | null>(null);
  const [isDeletingOfferId, setIsDeletingOfferId] = useState<string | null>(null);
  const [isEditingOfferModalOpen, setIsEditingOfferModalOpen] = useState(false);
  const [isSavingEditOffer, setIsSavingEditOffer] = useState(false);

  const handleOpenEditOffer = (offer: any) => {
    setEditingOfferId(offer.id);
    setEditOfferTitle(offer.title || '');
    setEditOfferCode(offer.code || '');
    setEditOfferDiscount(Number(offer.discountPercent) || 10);
    setEditOfferExpiry(offer.expiryDate || '');
    setEditOfferDesc(offer.description || '');
    setIsEditingOfferModalOpen(true);
  };

  const handleSaveEditOfferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOfferId || !editOfferTitle.trim() || !editOfferCode.trim() || editOfferDiscount <= 0 || !editOfferExpiry) return;
    setIsSavingEditOffer(true);
    try {
      if (onUpdateOffer) {
        await onUpdateOffer(editingOfferId, {
          title: editOfferTitle.trim(),
          code: editOfferCode.trim().toUpperCase(),
          discountPercent: editOfferDiscount,
          description: editOfferDesc.trim() || `কুপন কোড ব্যবহার করে পান ${editOfferDiscount}% বিশেষ ছাড়!`,
          expiryDate: editOfferExpiry
        });
      } else {
        const currentOffers = business?.offers || [];
        const updatedOffers = currentOffers.map((o: any) => o.id === editingOfferId ? {
          ...o,
          title: editOfferTitle.trim(),
          code: editOfferCode.trim().toUpperCase(),
          discountPercent: editOfferDiscount,
          description: editOfferDesc.trim() || `কুপন কোড ব্যবহার করে পান ${editOfferDiscount}% বিশেষ ছাড়!`,
          expiryDate: editOfferExpiry
        } : o);
        await onRegisterOrUpdateBusiness({ offers: updatedOffers });
      }
      setIsEditingOfferModalOpen(false);
      setEditingOfferId(null);
      alert('কুপন ও অফারের তথ্য সফলভাবে আপডেট করা হয়েছে!');
      if (onRefreshDb) await onRefreshDb();
    } catch (err) {
      console.error(err);
      alert('কুপন আপডেট করতে সমস্যা হয়েছে।');
    } finally {
      setIsSavingEditOffer(false);
    }
  };

  const handleDeleteOfferSubmit = async (offerId: string) => {
    if (!confirm('আপনি কি নিশ্চিত যে এই ডিসকাউন্ট কুপনটি ডিলিট করতে চান?')) return;
    setIsDeletingOfferId(offerId);
    try {
      if (onDeleteOffer) {
        await onDeleteOffer(offerId);
      } else {
        const currentOffers = (business?.offers || []).filter((o: any) => o.id !== offerId);
        await onRegisterOrUpdateBusiness({ offers: currentOffers });
      }
      alert('কুপন কোডটি সফলভাবে ডিলিট করা হয়েছে!');
      if (onRefreshDb) await onRefreshDb();
    } catch (err) {
      console.error(err);
      alert('কুপন ডিলিট করতে সমস্যা হয়েছে।');
    } finally {
      setIsDeletingOfferId(null);
    }
  };

  const handleCopyMerchantCoupon = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCouponId(id);
    setTimeout(() => setCopiedCouponId(null), 2500);
  };

  const handleCreateAdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adBudget < 100) {
      alert('ন্যূনতম বাজেট ১০০ টাকা হতে হবে!');
      return;
    }
    await onCreateAdCampaign({
      placement: adPlacement,
      bannerImage: adBanner || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800',
      budget: adBudget,
    });
    setAdBanner('');
    alert('বিজ্ঞাপন ক্যাম্পেইনের প্রস্তাব অ্যাডমিন প্যানেলে পাঠানো হয়েছে। অ্যাডমিন অনুমোদন দিলেই আপনার স্পন্সরড ক্যাম্পেইন শুরু হবে!');
  };

  const handleOpenAddCust = () => {
    setEditingCustId(null);
    setCustName('');
    setCustPhone('');
    setCustEmail('');
    setCustAddress('');
    setCustNotes('');
    setCustBalanceDue(0);
    setShowCustModal(true);
  };

  const handleOpenEditCust = (c: any) => {
    setEditingCustId(c.id);
    setCustName(c.name);
    setCustPhone(c.phone);
    setCustEmail(c.email || '');
    setCustAddress(c.address || '');
    setCustNotes(c.notes || '');
    setCustBalanceDue(c.balanceDue || 0);
    setShowCustModal(true);
  };

  const handleSaveCust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;
    if (!custName.trim() || !custPhone.trim()) {
      alert('কাস্টমারের নাম এবং মোবাইল নম্বর আবশ্যক!');
      return;
    }

    try {
      const url = editingCustId 
        ? `/api/businesses/${business.id}/customers/${editingCustId}`
        : `/api/businesses/${business.id}/customers`;
      
      const method = editingCustId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: custName.trim(),
          phone: custPhone.trim(),
          email: custEmail.trim(),
          address: custAddress.trim(),
          notes: custNotes.trim(),
          balanceDue: Number(custBalanceDue) || 0
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          alert(editingCustId ? 'কাস্টমারের তথ্য সফলভাবে আপডেট করা হয়েছে!' : 'নতুন কাস্টমার সফলভাবে যুক্ত করা হয়েছে!');
          setShowCustModal(false);
          await onRefreshDb();
        }
      } else {
        const err = await response.json();
        alert(err.error || 'তথ্য সংরক্ষণ করতে ব্যর্থ হয়েছে!');
      }
    } catch (err) {
      console.error(err);
      alert('সিস্টেমে ত্রুটি ঘটেছে!');
    }
  };

  const handleQuickUpdateDue = async (cust: any) => {
    if (!business) return;
    const amountStr = prompt(`"${cust.name}" এর নতুন মোট বাকি পরিমাণ টাইপ করুন (৳):`, String(cust.balanceDue));
    if (amountStr === null) return;
    const amount = Number(amountStr);
    if (isNaN(amount) || amount < 0) {
      alert('অনুগ্রহ করে সঠিক সংখ্যা দিন (০ বা তার বেশি)');
      return;
    }

    try {
      const response = await fetch(`/api/businesses/${business.id}/customers/${cust.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          balanceDue: amount
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          alert('বাকি হিসাব সফলভাবে আপডেট করা হয়েছে!');
          await onRefreshDb();
        }
      } else {
        alert('হিসাব আপডেট করতে ব্যর্থ হয়েছে!');
      }
    } catch (err) {
      console.error(err);
      alert('সিস্টেমে ত্রুটি ঘটেছে!');
    }
  };

  const handleDeleteCust = async (customerId: string) => {
    if (!business) return;
    if (confirm('আপনি কি এই কাস্টমারকে নিশ্চিতভাবে ডিলিট করতে চান? কাস্টমারের সব বাকি হিসাব ও তথ্য চিরতরে মুছে যাবে!')) {
      try {
        const response = await fetch(`/api/businesses/${business.id}/customers/${customerId}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          alert('কাস্টমার সফলভাবে মুছে ফেলা হয়েছে!');
          await onRefreshDb();
        } else {
          alert('কাস্টমার মুছতে ব্যর্থ হয়েছে!');
        }
      } catch (err) {
        console.error(err);
        alert('সিস্টেমে ত্রুটি ঘটেছে!');
      }
    }
  };

  if (business && business.isSuspended) {
    return (
      <div className="bg-rose-50/50 border border-rose-100 p-8 rounded-2xl shadow-sm text-center space-y-4 max-w-xl mx-auto my-8">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto text-3xl shadow-xs">
          🚫
        </div>
        <h3 className="text-base font-black text-rose-900">আপনার মার্চেন্ট অ্যাকাউন্টটি সাময়িকভাবে স্থগিত করা হয়েছে</h3>
        <p className="text-xs text-rose-700 leading-relaxed font-bold">
          দুঃখিত, আপনার ব্যবসা প্রতিষ্ঠানটির কার্যক্রম বা মার্চেন্ট ড্যাশবোর্ড অ্যাক্সেস অ্যাডমিন কর্তৃক স্থগিত করা হয়েছে। আপনার অ্যাকাউন্ট অনুমতি ফিরে পেতে বা সমস্যার সমাধান করতে অনুগ্রহ করে অ্যাডমিন সাপোর্টে যোগাযোগ করুন।
        </p>
        <div className="bg-white p-3 rounded-xl border border-rose-150 text-[10px] text-slate-500 font-bold font-mono">
          📧 ইমেইল সাপোর্ট: <span className="text-rose-700">info.restbazar@gmail.com</span>
        </div>
      </div>
    );
  }

  if (currentUser.role === 'merchant' && currentUser.isMerchantVerified !== true) {
    return (
      <div className="bg-amber-50/50 border border-amber-200 p-8 rounded-2xl shadow-sm text-center space-y-4 max-w-xl mx-auto my-8 text-left">
        <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto text-3xl shadow-xs animate-pulse">
          ⏳
        </div>
        <h3 className="text-lg font-black text-amber-900 text-center">স্বাগতম, পারমিশন পাওয়ার জন্য অপেক্ষা করুন</h3>
        <p className="text-xs text-amber-700 leading-relaxed font-bold text-center">
          আপনার মার্চেন্ট সাইন-আপটি সফল হয়েছে! সিস্টেমের নিরাপত্তা এবং গুণমান বজায় রাখার জন্য আমাদের টিম প্রতিটি মার্চেন্ট প্রোফাইল যাচাই করে। অ্যাডমিন অনুমোদনের পর আপনি আপনার দোকান নিবন্ধন, আইটেম আপলোড এবং গ্রাহকদের বুকিং/অর্ডার পরিচালনা করতে পারবেন।
        </p>
        <div className="bg-white p-3 rounded-xl border border-amber-150 text-[11px] text-slate-600 font-bold space-y-1.5 max-w-sm mx-auto">
          <div>🔑 অ্যাকাউন্ট ফোন নম্বর: <span className="text-indigo-600 font-mono font-black">{currentUser.phone}</span></div>
          <div>✉️ ইমেইল সাপোর্ট: <span className="text-amber-700">info.restbazar@gmail.com</span></div>
          <div>🛠️ বর্তমান স্ট্যাটাস: <span className="text-amber-600 font-black">⏳ পেন্ডিং এডমিন অনুমোদন (Pending Approval)</span></div>
        </div>
        <p className="text-[10px] text-slate-400 font-medium text-center">
          অ্যাডমিন প্যানেল (info.restbazar@gmail.com) থেকে আপনার অ্যাকাউন্টটি অনুমোদন দিলে আপনি সাথে সাথেই মার্চেন্ট ড্যাশবোর্ড ব্যবহার শুরু করতে পারবেন।
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dynamic welcome indicator based on registered status */}
      {!business ? (
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-6 rounded-2xl shadow-md text-xs space-y-3">
          <div className="flex items-center gap-2">
            <Store className="w-6 h-6 animate-bounce" />
            <h3 className="text-sm font-bold">আপনার ব্যবসাটি RB Local-এ নিবন্ধিত নেই!</h3>
          </div>
          <p className="leading-relaxed">
            আপনার কি কোনো মুদি দোকান, ওষুধের দোকান, রেস্টুরেন্ট বা বিউটি পার্লার আছে? অথবা আপনি কি একজন ইলেকট্রিশিয়ান, প্লাম্বার, ড্রাইভার, মেকানিক বা গৃহশিক্ষক? নিজে নিজেই নিজের দোকান বা পেশাদার প্রোফাইল যুক্ত করুন এবং সরাসরি হাজার হাজার স্থানীয় কাস্টমারদের সাথে কানেক্ট করুন!
          </p>
          <div className="bg-black/15 p-3 rounded-xl border border-white/10 font-medium">
            💡 নিবন্ধন করার সাথে সাথে কাস্টমাররা আপনাকে কল, চ্যাট ও বুকিং করতে পারবে এবং আপনার জন্য রয়েছে স্পন্সরড বিজ্ঞাপন ও ফ্রি কাস্টমার ড্যাশবোর্ড!
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Top Red Promo Announcement Banner matching Hatilo screenshot */}
          {showTopPromoBanner && (
            <div className="bg-gradient-to-r from-red-600 via-rose-600 to-orange-600 text-white rounded-xl p-3 shadow-md flex flex-wrap items-center justify-between gap-3 text-xs font-bold">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="p-1 bg-white/20 rounded-lg">📢</span>
                <span>আপনার প্রোডাক্ট RestBazar ফেসবুক, কটকে প্রমোশন করবে। আপনাকে কোন খরচ দিতে হবে না।</span>
                <button
                  type="button"
                  onClick={() => setMerchantSubTab('promotion')}
                  className="bg-white text-red-600 px-3 py-1 rounded-full text-[11px] font-black hover:bg-red-50 transition-colors shadow-xs cursor-pointer"
                >
                  বিস্তারিত এখানে
                </button>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-[11px] font-mono opacity-80">1/3</span>
                <button
                  type="button"
                  onClick={() => setShowTopPromoBanner(false)}
                  className="p-1 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
                  title="বন্ধ করুন"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* 2-Column Responsive Layout: Hatilo Left Sidebar + Main Content Area */}
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Left Sidebar Navigation */}
            <div className="w-full md:w-64 shrink-0 bg-white border border-slate-200/80 rounded-2xl p-3 shadow-xs space-y-1">
              <div className="px-3 py-2 border-b border-slate-100 mb-2">
                <div className="text-xs font-black text-emerald-800 tracking-tight">আমার দোকান ড্যাশবোর্ড</div>
                <div className="text-[10px] text-slate-400 truncate">{business.name}</div>
              </div>

              {/* Sidebar Menu Items */}
              {[
                { id: 'dashboard', label: '📊 ড্যাশবোর্ড (Dashboard)' },
                { id: 'orders', label: '🛒 শপ অর্ডারস (Shop Orders)', badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined },
                { id: 'items', label: '📦 আমার পণ্য (My Products)' },
                { id: 'add_product', label: '➕ পণ্য যোগ করুন (Add Product)' },
                { id: 'fb_import', label: '🌐 ফেসবুক অটো-ইমপোর্ট (FB Import)', isSpecial: true },
                { id: 'wholesale', label: '🏢 পাইকারি বিক্রি (Wholesale)' },
                { id: 'tutorial', label: '📺 ভিডিও ও সচিত্র গাইড (Guides & AI)' },
                { id: 'faq', label: '❓ সাধারণ জিজ্ঞাসা (FAQ)' },
                { id: 'free_delivery', label: '🚚 ফ্রি হোম ডেলিভারি (Free Home Delivery)' },
                { id: 'promotion', label: '📢 ফেসবুক/টিকটক প্রমোশন' },
              ].map((item) => {
                const isActive = merchantSubTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (item.id === 'fb_import') {
                        setFbImportTarget('merchant_product');
                        setShowFbImportModal(true);
                      } else {
                        setMerchantSubTab(item.id as any);
                      }
                    }}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-between ${
                      item.isSpecial
                        ? 'bg-blue-50 hover:bg-blue-100/80 text-blue-800 font-extrabold border border-blue-200'
                        : isActive
                          ? 'bg-emerald-100/90 text-emerald-900 font-extrabold border-l-4 border-emerald-600 shadow-xs'
                          : 'text-slate-700 hover:bg-slate-100/80 font-bold'
                    }`}
                  >
                    <span>{item.label}</span>
                    {item.badge !== undefined && (
                      <span className="bg-rose-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full animate-pulse">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}

              <div className="border-t border-slate-100 my-2 pt-2">
                <div className="px-3 py-1 text-[10px] font-black text-slate-400 uppercase tracking-wider">ব্যবসা ও সেটিংস</div>
                {[
                  { id: 'profile', label: '🏪 দোকান প্রোফাইল (Store Profile)' },
                  { id: 'customers', label: '👥 বাকি খাতা (Ledger)' },
                  { id: 'wallet', label: '💳 ওয়ালেট (Wallet)' },
                  { id: 'ads', label: '📢 বিজ্ঞাপন প্রচার (Ads)' },
                  { id: 'reports', label: '📈 রিপোর্ট ও বিশ্লেষণ (Reports)' },
                ].map((item) => {
                  const isActive = merchantSubTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setMerchantSubTab(item.id as any)}
                      className={`w-full text-left px-3.5 py-2 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-between ${
                        isActive
                          ? 'bg-blue-600 text-white font-extrabold shadow-sm'
                          : 'text-slate-600 hover:bg-slate-100/80 font-bold'
                      }`}
                    >
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Tab Content Container */}
            <div className="flex-1 w-full min-w-0 space-y-6">

              {/* TAB: Add Product matching Hatilo Vendor Screenshot */}
              {business && merchantSubTab === 'add_product' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-xl font-black text-slate-900">Add Product</h3>
                      <p className="text-xs text-slate-500">আপনার দোকানে নতুন পণ্য বা সেবা যুক্ত করুন ও বিক্রয় বৃদ্ধি করুন</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFbImportTarget('merchant_product');
                        setShowFbImportModal(true);
                      }}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-2 cursor-pointer transition-all shrink-0"
                    >
                      <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-black">f</span>
                      <span>ফেসবুক অটো-ইমপোর্ট</span>
                    </button>
                  </div>

                  {/* Facebook Auto-Import Hero Banner */}
                  <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-2xl p-5 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="space-y-1.5 max-w-xl">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-sm">f</span>
                        <h4 className="text-sm font-black tracking-tight">ফেসবুক পেজ বা পোস্ট থেকে ১-ক্লিকে পণ্য ইমপোর্ট</h4>
                        <span className="bg-amber-400 text-amber-950 text-[10px] font-black px-2 py-0.5 rounded-full">✨ AI Auto-Import</span>
                      </div>
                      <p className="text-xs text-blue-100 font-medium leading-relaxed">
                        আপনার ফেসবুক পেজ, গ্রুপ বা পোস্টের ক্যাপশন/লিংক দিন — আমাদের এআই স্বয়ংক্রিয়ভাবে নাম, দাম, ছবি ও সম্পূর্ণ বিবরণ তৈরি করে সরাসরি আপনার দোকানে যুক্ত করবে!
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFbImportTarget('merchant_product');
                        setShowFbImportModal(true);
                      }}
                      className="bg-white hover:bg-blue-50 text-blue-800 font-black text-xs px-5 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 cursor-pointer shrink-0"
                    >
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      <span>ফেসবুক থেকে ইমপোর্ট করুন</span>
                    </button>
                  </div>

                  {/* Green Free Slots Notice Box matching screenshot */}
                  <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 text-xs font-bold text-emerald-900 space-y-1.5 shadow-xs">
                    <div className="leading-relaxed">
                      <span className="text-emerald-950 font-black">20টি বিনামূল্যে স্লট বাকি।</span>{' '}
                      <span className="text-emerald-800">সীমার বাইরে ইচ্ছামতো পণ্য — প্রতি পণ্য ৳ 25/মাস (PAYG) — প্রতি পণ্যে মাসিক ৳ 25 (ওয়ালেট থেকে কাটা হবে)।</span>
                    </div>
                    <div className="text-[11px] font-normal text-emerald-700">
                      SEO title & meta are added by admin after you submit.
                    </div>
                  </div>

                  {/* Duplicate Product Check Card matching screenshot */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
                    <label className="block text-xs font-black text-slate-900">
                      What are you selling? <span className="text-rose-500">*</span>
                    </label>
                    <p className="text-xs text-emerald-600 font-bold">
                      টাইটেল লিখে Search বাটনে ক্লিক করুন — RestBazar-এ আগে আছে কিনা দেখুন।
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="text"
                        value={duplicateSearchQuery}
                        onChange={(e) => setDuplicateSearchQuery(e.target.value)}
                        placeholder="Brand + Model + Type — e.g. Samsung 55 Inch 4K Smart TV"
                        className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!duplicateSearchQuery.trim()) {
                            alert('অনুগ্রহ করে পণ্যের নাম বা টাইটেল লিখুন!');
                            return;
                          }
                          const found = business.products.some(p => p.name.toLowerCase().includes(duplicateSearchQuery.trim().toLowerCase()));
                          if (found) {
                            setDuplicateSearchResult('⚠️ আপনার দোকানে এই নামের একটি পণ্য ইতিমধ্যেই রয়েছে। নতুন মূল্য দিতে চাইলে পণ্য তালিকা থেকে মূল্য আপডেট করুন।');
                          } else {
                            setDuplicateSearchResult('✅ RestBazar সিস্টেমে এই নামের কোনো ডুপ্লিকেট পণ্য পাওয়া যায়নি! আপনি নিশ্চিন্তে নিচের ফর্মে পণ্যটির বিবরণ দিয়ে আপলোড করতে পারেন।');
                            setNewItemName(duplicateSearchQuery.trim());
                          }
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-3 rounded-xl transition-all shadow-xs cursor-pointer shrink-0"
                      >
                        + Search
                      </button>
                    </div>
                    {duplicateSearchResult && (
                      <div className={`p-3 rounded-xl text-xs font-bold ${
                        duplicateSearchResult.includes('⚠️') 
                          ? 'bg-amber-50 text-amber-900 border border-amber-200' 
                          : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                      }`}>
                        {duplicateSearchResult}
                      </div>
                    )}
                  </div>

                  {/* Inline Add Product Form */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
                    <h4 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                      <PlusCircle className="w-4 h-4 text-emerald-600" />
                      <span>পণ্য যোগ করুন (New Product Details)</span>
                    </h4>

                    {/* Product / Service Name */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                        <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{business.type === 'shop' ? 'পণ্যের নাম / টাইটেল' : 'সেবার নাম (Service Title)'} <span className="text-rose-500">*</span></span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={business.type === 'shop' ? "যেমন: মিনিকেট চাল (১ কেজি), প্রিমিয়াম তরল দুধ" : "যেমন: এসি লিক মেরামত, কম্পিউটার হার্ডওয়্যার ফিটিং"}
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 font-extrabold transition-all"
                      />
                    </div>

                    {/* Pricing Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{business.type === 'shop' ? 'বর্তমান বিক্রয় মূল্য (৳)' : 'সেবা চার্জ/ফি (৳)'} <span className="text-rose-500">*</span></span>
                        </label>
                        <input
                          type="number"
                          required
                          min="1"
                          placeholder="০.০০"
                          value={newItemPrice || ''}
                          onChange={(e) => setNewItemPrice(Number(e.target.value))}
                          className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 font-extrabold transition-all"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                          <span className="text-slate-400 font-mono text-[10px]">%</span>
                          <span>আগের মূল্য/ডিসকাউন্ট ছাড়া (৳)</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          placeholder="যেমন: ১৫০ (ঐচ্ছিক)"
                          value={newItemOriginalPrice || ''}
                          onChange={(e) => setNewItemOriginalPrice(Number(e.target.value))}
                          className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 font-extrabold transition-all"
                        />
                      </div>
                    </div>

                    {/* Product / Service Image Upload & Preset Selector */}
                    <div className="space-y-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
                      <PhotoCaptureUpload
                        currentImage={newItemImage}
                        onImageChange={setNewItemImage}
                        label={business.type === 'shop' ? "পণ্যের ছবি ও ক্যামেরা (Product Photo & Camera)" : "সেবার ছবি ও ক্যামেরা (Service Photo & Camera)"}
                        sublabel="ক্যামেরা দিয়ে সরাসরি পণ্যের ছবি তুলুন অথবা মেমোরি থেকে আপলোড করুন"
                        shape="rectangle"
                        aspectRatio="4:3"
                        placeholderText="পণ্যের ছবি"
                      />

                      {/* Ready-made Bangladesh Image Presets */}
                      <div className="space-y-1.5 pt-2 border-t border-slate-200">
                        <label className="text-[11px] font-extrabold text-slate-600 flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-500" />
                            <span>অথবা রেডিমেড ছবি নির্বাচন করুন (Quick Photo Presets):</span>
                          </span>
                          {newItemImage && (
                            <button
                              type="button"
                              onClick={() => setNewItemImage('')}
                              className="text-[10px] text-rose-500 hover:underline font-bold cursor-pointer"
                            >
                              ছবি রিসেট করুন
                            </button>
                          )}
                        </label>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1">
                          {BANGLADESH_PRODUCT_IMAGE_PRESETS.map((preset, idx) => {
                            const isSelected = newItemImage === preset.url;
                            return (
                              <button
                                key={`preset-tab-${idx}`}
                                type="button"
                                onClick={() => setNewItemImage(preset.url)}
                                className={`group relative rounded-xl overflow-hidden border-2 transition-all cursor-pointer aspect-[4/3] ${
                                  isSelected
                                    ? 'border-emerald-600 ring-2 ring-emerald-500/30 scale-95 shadow-sm'
                                    : 'border-slate-200 hover:border-emerald-400 opacity-80 hover:opacity-100'
                                }`}
                              >
                                <img
                                  src={preset.url}
                                  alt={preset.label}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute inset-x-0 bottom-0 bg-black/65 py-0.5 px-1 text-center">
                                  <span className="text-[9px] font-black text-white block truncate">{preset.label}</span>
                                </div>
                                {isSelected && (
                                  <div className="absolute top-1 right-1 bg-emerald-600 text-white rounded-full p-0.5 shadow">
                                    <CheckCircle className="w-3 h-3" />
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Product Description with AI Writer & Smart Chips */}
                    <div className="space-y-2 bg-emerald-50/40 p-4 rounded-2xl border border-emerald-100">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-emerald-600" />
                          <span>পণ্যের বিবরণ (Product Description)</span>
                          {aiDescGeneratedSuccess && (
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                              <CheckCircle className="w-3 h-3 text-emerald-600" />
                              এআই বিবরণ তৈরি সম্পন্ন!
                            </span>
                          )}
                        </label>

                        {/* AI Auto Writer Button */}
                        <button
                          type="button"
                          onClick={() => handleGenerateAiProductDesc()}
                          disabled={isGeneratingItemDesc}
                          className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black px-3.5 py-1.5 rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer shrink-0"
                        >
                          {isGeneratingItemDesc ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>এআই লিখছে...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>✨ এআই দিয়ে বিবরণ লিখুন (AI Auto Writer)</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Smart Feature Chips */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 block">
                          ফিচার সিলেক্ট করুন (এআই এগুলো যুক্ত করে লিখবে):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {AI_PRODUCT_FEATURE_CHIPS.map((chip, idx) => {
                            const isSelected = selectedFeatureChips.includes(chip);
                            return (
                              <button
                                key={`chip-tab-${idx}`}
                                type="button"
                                onClick={() => toggleFeatureChip(chip)}
                                className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                    : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50'
                                }`}
                              >
                                {chip}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Description Textarea */}
                      <textarea
                        rows={3}
                        placeholder="পণ্যের গুণগত মান, পরিমাণ, ফ্রেশনেস ও বৈশিষ্ট্য লিখুন অথবা ওপরের বাটনে ক্লিক করে AI দিয়ে স্বয়ংক্রিয়ভাবে লিখিয়ে নিন..."
                        value={newItemDesc}
                        onChange={(e) => setNewItemDesc(e.target.value)}
                        className="w-full text-xs bg-white border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 font-medium transition-all"
                      />
                    </div>

                    {/* Wholesale Pricing Settings for this Item */}
                    {business.type === 'shop' && (
                      <WholesalePricingForm
                        retailPrice={newItemPrice}
                        isWholesaleAvailable={newItemWholesaleAvailable}
                        onToggleWholesale={setNewItemWholesaleAvailable}
                        wholesalePrice={newItemWholesalePrice}
                        onChangeWholesalePrice={setNewItemWholesalePrice}
                        wholesaleMinQty={newItemWholesaleMinQty}
                        onChangeWholesaleMinQty={setNewItemWholesaleMinQty}
                        wholesaleUnit={newItemWholesaleUnit}
                        onChangeWholesaleUnit={setNewItemWholesaleUnit}
                        wholesaleTiers={newItemWholesaleTiers}
                        onChangeWholesaleTiers={setNewItemWholesaleTiers}
                        wholesaleStock={newItemWholesaleStock}
                        onChangeWholesaleStock={setNewItemWholesaleStock}
                        themeColor="emerald"
                      />
                    )}

                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={async () => {
                          if (!newItemName || !newItemPrice || newItemPrice <= 0) {
                            alert('পণ্যের নাম এবং মূল্য অবশ্যই দিতে হবে!');
                            return;
                          }
                          await handleAddItem();
                          alert('পণ্যটি সফলভাবে যোগ করা হয়েছে!');
                          setDuplicateSearchQuery('');
                          setDuplicateSearchResult(null);
                          setMerchantSubTab('items');
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-8 py-3 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
                      >
                        <PlusCircle className="w-4 h-4" />
                        <span>পণ্যটি স্টোরে যোগ করুন (Save Product)</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: Dashboard Summary */}
              {business && merchantSubTab === 'dashboard' && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-6 rounded-2xl shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <span className="text-[10px] uppercase font-mono tracking-widest bg-white/20 px-2 py-0.5 rounded-full font-bold">মার্চেন্ট ড্যাশবোর্ড</span>
                      <h3 className="text-xl font-black mt-1.5">{business.name}</h3>
                      <p className="text-xs text-emerald-100 mt-0.5">আপনার ব্যবসার দৈনিক বিক্রয় ও অর্ডার পরিসংখ্যান</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setMerchantSubTab('add_product')}
                        className="bg-white text-emerald-800 hover:bg-emerald-50 px-4 py-2 rounded-xl text-xs font-black shadow-sm transition-all cursor-pointer"
                      >
                        + নতুন পণ্য যোগ করুন
                      </button>
                      <button
                        onClick={() => setMerchantSubTab('orders')}
                        className="bg-emerald-800/60 hover:bg-emerald-800 text-white px-4 py-2 rounded-xl text-xs font-black border border-white/20 transition-all cursor-pointer"
                      >
                        অর্ডার দেখুন
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
                      <div className="text-[10px] font-bold text-slate-400">মোট পণ্য (Total Items)</div>
                      <div className="text-2xl font-black text-slate-800 mt-1">
                        {business.type === 'shop' ? business.products.length : business.services.length}টি
                      </div>
                      <div className="text-[10px] text-emerald-600 font-bold mt-1">সক্রিয় রয়েছে</div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
                      <div className="text-[10px] font-bold text-slate-400">বিনামূল্যে স্লট বাকি</div>
                      <div className="text-2xl font-black text-emerald-600 mt-1">20 / 20</div>
                      <div className="text-[10px] text-slate-500 font-bold mt-1">ফ্রি লিস্টিং স্লট</div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
                      <div className="text-[10px] font-bold text-slate-400">মোট বিক্রয় অর্ডার</div>
                      <div className="text-2xl font-black text-blue-600 mt-1">{totalSalesCount}টি</div>
                      <div className="text-[10px] text-slate-500 font-bold mt-1">সম্পন্ন হয়েছে</div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
                      <div className="text-[10px] font-bold text-slate-400">মোট আয় (Revenue)</div>
                      <div className="text-2xl font-black text-slate-900 mt-1">৳ {totalEarnedAmount}</div>
                      <div className="text-[10px] text-indigo-600 font-bold mt-1">সর্বমোট বিক্রয়মূল্য</div>
                    </div>
                  </div>

                  {/* Quick Shortcuts */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      onClick={() => setMerchantSubTab('promotion')}
                      className="bg-gradient-to-br from-red-500 to-rose-600 text-white p-4 rounded-2xl text-left shadow-sm hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div className="text-xs font-black uppercase tracking-wider opacity-80">ফ্রি ভিডিও প্রমোশন</div>
                      <div className="text-sm font-bold mt-1">ফেসবুক ও কটকে আপনার পণ্য ফ্রি প্রচার করুন ↗</div>
                    </button>

                    <button
                      onClick={() => setMerchantSubTab('wholesale')}
                      className="bg-gradient-to-br from-indigo-600 to-blue-700 text-white p-4 rounded-2xl text-left shadow-sm hover:shadow-md transition-all cursor-pointer"
                    >
                      <div className="text-xs font-black uppercase tracking-wider opacity-80">পাইকারি বিক্রি মোড</div>
                      <div className="text-sm font-bold mt-1">হোলসেল ও বিশেষ ছাড়ের সুবিধা চালু করুন ↗</div>
                    </button>

                    <button
                      onClick={() => setMerchantSubTab('tutorial')}
                      className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-4 rounded-2xl text-left shadow-sm hover:shadow-md transition-all cursor-pointer"
                    >
                      <div className="text-xs font-black uppercase tracking-wider opacity-80">বিক্রেতা গাইডলাইন</div>
                      <div className="text-sm font-bold mt-1">ভিডিও টিউটোরিয়াল দেখে বিক্রি বাড়ান ↗</div>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB: Wholesale (পাইকারি বিক্রি) */}
              {business && merchantSubTab === 'wholesale' && (
                <WholesaleBusinessManager
                  business={business}
                  onUpdateBusiness={async (updates) => {
                    await onRegisterOrUpdateBusiness(updates);
                  }}
                  onUpdateProducts={async (updatedProducts) => {
                    await onUpdateItems(updatedProducts, []);
                  }}
                />
              )}

              {/* TAB: Tutorial (টিউটোরিয়াল ও গাইডলাইন) */}
              {business && merchantSubTab === 'tutorial' && (
                <SellerTutorialsPage
                  business={business}
                  currentUser={currentUser}
                  onBackToDashboard={() => setMerchantSubTab('dashboard')}
                />
              )}

              {/* TAB: FAQ (সাধারণ জিজ্ঞাসা) */}
              {business && merchantSubTab === 'faq' && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-lg font-black text-slate-900">❓ বিক্রেতা সাধারণ জিজ্ঞাসা (FAQ)</h3>
                    <p className="text-xs text-slate-500">আপনার মনে হতে পারে এমন সাধারণ প্রশ্ন ও সমাধান</p>
                  </div>

                  <div className="space-y-3">
                    {[
                      { q: 'পণ্য যোগ করতে কি কোনো টাকা দিতে হবে?', a: 'প্রথম ২০টি পণ্য বা সার্ভিস সম্পূর্ণ বিনামূল্যে আপলোড করতে পারবেন। কোনো হিডেন চার্জ নেই।' },
                      { q: 'ফেসবুক বা কটকে প্রমোশন কিভাবে করা হয়?', a: 'RestBazar টিম আপনার স্টোরের বেস্ট-সেলার পণ্যের আকর্ষণীয় রিলস ও ভিডিও তৈরি করে আমাদের ফেসবুক ও কটক পেজে প্রমোশন করে।' },
                      { q: 'গ্রাহকদের অর্ডারের টাকা কিভাবে পাব?', a: 'কাস্টমাররা সরাসরি আপনার কাছে ক্যাশ অন ডেলিভারি অথবা আপনার বিকাশ/নগদ নম্বরে পেমেন্ট করতে পারবে।' },
                      { q: 'বাকি খাতার ডেটা কি হারিয়ে যাওয়ার সুযোগ আছে?', a: 'না! আপনার বাকি খাতার সব হিসাব ক্লাউডে নিরাপদ ও সুরক্ষিত থাকে।' }
                    ].map((faq, i) => (
                      <div key={i} className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 space-y-1">
                        <h4 className="text-xs font-black text-slate-900">প্রশ্ন: {faq.q}</h4>
                        <p className="text-xs text-slate-600 font-medium">উত্তর: {faq.a}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB: Free Home Delivery (ফ্রি হোম ডেলিভারি) */}
              {business && merchantSubTab === 'free_delivery' && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-lg font-black text-slate-900">🚚 ফ্রি হোম ডেলিভারি প্রোগ্রাম (Free Delivery)</h3>
                    <p className="text-xs text-slate-500">ফ্রি ডেলিভারি অফার দিলে কাস্টমারদের অর্ডার করার সম্ভাবনা ৩ গুণ বৃদ্ধি পায়</p>
                  </div>

                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-900 space-y-2">
                    <p className="font-bold">💡 কিভাবে কাজ করে?</p>
                    <p>আপনি একটি নির্দিষ্ট টাকার অর্ডারে ফ্রি হোম ডেলিভারি অফার করতে পারেন। উদাহরণস্বরূপ: ৫০০ টাকার বেশি অর্ডারে ফ্রি হোম ডেলিভারি।</p>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">সর্বনিম্ন অর্ডারের পরিমাণ (৳)</h4>
                      <p className="text-[11px] text-slate-500">এই পরিমাণের বেশি অর্ডার হলে কাস্টমার ফ্রি ডেলিভারি পাবেন</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="100"
                        value={freeDeliveryMinOrder}
                        onChange={(e) => setFreeDeliveryMinOrder(Number(e.target.value))}
                        className="w-24 text-xs bg-white border border-slate-200 rounded-lg p-2 font-extrabold text-center"
                      />
                      <button
                        onClick={() => alert(`৳ ${freeDeliveryMinOrder} টাকার ওপর ফ্রি হোম ডেলিভারি অফার চালু হয়েছে!`)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-lg"
                      >
                        চালু করুন
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: Facebook/TikTok Promotion & Viral Tools */}
              {business && merchantSubTab === 'promotion' && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
                  <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                        <span>📢 ফেসবুক ও সোশ্যাল মিডিয়া মার্কেটিং সেন্টার</span>
                        <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">Viral Tools</span>
                      </h3>
                      <p className="text-xs text-slate-500">আপনার প্রোডাক্ট ১-ক্লিকে ফেসবুকে ভাইরাল করুন এবং ফেসবুক পোস্ট থেকে সরাসরি রেস্ট বাজারে ইমপোর্ট করুন</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFbImportTarget('merchant_product');
                        setShowFbImportModal(true);
                      }}
                      className="bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-black px-4 py-2 rounded-xl border border-blue-200 shadow-xs flex items-center gap-1.5 cursor-pointer transition-all shrink-0"
                    >
                      <span className="font-serif font-black text-sm text-blue-600">f</span>
                      <span>ফেসবুক থেকে প্রোডাক্ট ইমপোর্ট</span>
                    </button>
                  </div>

                  {/* 1-Click Viral Post Generator Card */}
                  <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white p-5 rounded-2xl space-y-3 shadow-md">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-black text-sm">
                        ⚡
                      </div>
                      <h4 className="text-sm font-black">১-ক্লিকে ফেসবুক পোস্ট ও ক্যাপশন জেনারেটর (AI Marketing)</h4>
                    </div>
                    <p className="text-xs text-blue-100 leading-relaxed">
                      যেকোনো পণ্যের জন্য আকর্ষণীয় ইমোজি-যুক্ত বাংলা ফেসবুক ক্যাপশন, হ্যাশট্যাগ ও ডিরেক্ট বাই-লিংক স্বয়ংক্রিয়ভাবে তৈরি করুন এবং ফেসবুক পেজ/গ্রুপে পোস্ট করুন।
                    </p>
                    
                    {business.type === 'shop' && business.products.length > 0 && (
                      <div className="pt-2 flex flex-wrap gap-2">
                        {business.products.slice(0, 6).map((prod) => (
                          <button
                            key={prod.id}
                            type="button"
                            onClick={() => {
                              setFbShareItem({
                                title: prod.name,
                                price: prod.price,
                                originalPrice: prod.originalPrice,
                                image: prod.image
                              });
                              setShowFbShareModal(true);
                            }}
                            className="bg-white/15 hover:bg-white/30 backdrop-blur-md text-white border border-white/20 text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <Share2 className="w-3 h-3 text-blue-200" />
                            <span className="truncate max-w-[140px]">{prod.name}</span>
                            <span className="text-emerald-300 font-black">৳{prod.price}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Free Video Promotion Section */}
                  <div className="bg-gradient-to-r from-rose-500 to-red-600 text-white p-5 rounded-2xl space-y-2 shadow-sm">
                    <h4 className="text-sm font-black">🎁 কোন প্রকার খরচ ছাড়া প্রফেশনাল ভিডিও প্রমোশন!</h4>
                    <p className="text-xs text-rose-50 leading-relaxed">
                      আমাদের ক্রিয়েটিভ টিম আপনার নির্বাচিত পণ্যের ভিডিও ও ছবি দিয়ে আকর্ষণীয় রিলস ও ভিডিও তৈরি করবে এবং ফেসবুক, কটকে হাজারো ক্রেতার কাছে পৌঁছাবে।
                    </p>
                  </div>

                  <div className="border border-slate-100 rounded-xl p-5 bg-slate-50/60 space-y-4">
                    <h4 className="text-xs font-extrabold text-slate-800">অফিশিয়াল মিডিয়া প্রমোশনের জন্য আপনার পণ্য নির্বাচন করুন:</h4>
                    {business.type === 'shop' && business.products.length > 0 ? (
                      <div className="space-y-3">
                        <select className="w-full text-xs bg-white border border-slate-200 rounded-xl p-3 font-bold">
                          {business.products.map(p => (
                            <option key={p.id} value={p.id}>{p.name} — ৳ {p.price}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => {
                            setPromoSubmitted(true);
                            alert('আপনার প্রমোশন আবেদনটি RestBazar মিডিয়া টিমের কাছে সফলভাবে পাঠানো হয়েছে! শীঘ্রই ভিডিও পাবলিশ করা হবে।');
                          }}
                          className="bg-red-600 hover:bg-red-700 text-white font-black text-xs px-6 py-3 rounded-xl shadow-md cursor-pointer transition-all w-full sm:w-auto"
                        >
                          {promoSubmitted ? '✅ আবেদন পাঠানো হয়েছে' : '🚀 প্রমোশনের জন্য আবেদন করুন'}
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">আপনার দোকানে এখনো কোনো পণ্য নেই। আগে "পণ্য যোগ করুন" বা "ফেসবুক অটো-ইমপোর্ট" ট্যাব থেকে পণ্য আপলোড করুন।</p>
                    )}
                  </div>
                </div>
              )}

      {/* 1. Register or Update Form */}
      {business && merchantSubTab === 'profile' && (
        <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm flex items-center justify-between gap-4">
          <div>
            <h5 className="text-xs font-bold text-slate-800">দোকানের বর্তমান অবস্থা (Store Status)</h5>
            <p className="text-[10px] text-slate-500">গ্রাহকরা আপনার দোকানটি বর্তমানে খোলা নাকি বন্ধ দেখতে পাবেন।</p>
          </div>
          <button
            type="button"
            onClick={async () => {
              await onRegisterOrUpdateBusiness({
                ...business,
                isOpen: !business.isOpen,
              });
              alert(`আপনার দোকানটি এখন ${!business.isOpen ? 'খোলা (OPEN)' : 'বন্ধ (CLOSED)'}!`);
            }}
            className={`px-4 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-colors shadow-sm ${
              business.isOpen 
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white' 
                : 'bg-rose-500 hover:bg-rose-600 text-white'
            }`}
          >
            {business.isOpen ? '🟢 খোলা (OPEN)' : '🔴 বন্ধ (CLOSED)'}
          </button>
        </div>
      )}

      {(!business || merchantSubTab === 'profile') && (
        <form onSubmit={handleProfileSubmit} className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-4">
          <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <Store className="w-4 h-4 text-blue-500" />
            {business ? 'আপনার দোকানের প্রোফাইল এডিট করুন' : 'নতুন দোকান বা সেবাদাতা হিসেবে যুক্ত হন'}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">দোকান বা ব্যবসা প্রতিষ্ঠানের নাম (বা আপনার নিজের নাম)</label>
              <input
                type="text"
                required
                value={bizName}
                onChange={(e) => setBizName(e.target.value)}
                placeholder="যেমন: মা ফুড অ্যান্ড গ্রোসারি, রহিম মিস্ত্রি"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">মোবাইল নম্বর (যোগাযোগের জন্য)</label>
              <input
                type="text"
                required
                value={bizPhone}
                onChange={(e) => setBizPhone(e.target.value)}
                placeholder="01XXXXXXXXX"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">ক্যাটাগরি নির্বাচন (Category)</label>
              <select
                value={bizCategory}
                onChange={(e) => setBizCategory(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none"
              >
                {categoriesList.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.nameBangla}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">ব্যবসার ধরন (Type)</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setBizType('shop')}
                  className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                    bizType === 'shop'
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  🛍️ পণ্য বিক্রয়কারী দোকান (Shop)
                </button>
                <button
                  type="button"
                  onClick={() => setBizType('service')}
                  className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                    bizType === 'service'
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  🔧 দক্ষ জরুরি সেবা (Service Provider)
                </button>
              </div>
            </div>

            <div className="sm:col-span-2">
              <PhotoCaptureUpload
                currentImage={logoUrl}
                onImageChange={setLogoUrl}
                label="দোকানের অফিশিয়াল লোগো বা প্রোফাইল ছবি (Shop Logo / Profile Photo)"
                sublabel="দোকানের সাইনবোর্ড বা লোগোর লাইভ ছবি তুলুন অথবা গ্যালারি থেকে সিলেক্ট করুন"
                shape="circle"
                placeholderText="দোকান"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">হোয়াটসঅ্যাপ নম্বর (গ্রাহকদের সাথে যোগাযোগের জন্য)</label>
              <input
                type="text"
                value={bizWhatsapp}
                onChange={(e) => setBizWhatsapp(e.target.value)}
                placeholder="01XXXXXXXXX"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none"
              />
            </div>

            {/* Shop Gallery / Storefront Photos Section */}
            <div className="space-y-3 sm:col-span-2 bg-slate-50/90 p-4 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <Image className="w-4 h-4 text-emerald-600" />
                    দোকানের গ্যালারি ও সামনের ছবি (Storefront & Gallery Photos)
                  </h5>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                    দোকানের সামনের সাইনবোর্ড, তাক/শেলফ বা কাউন্টারের ছবি ক্যামেরা দিয়ে তুলে বা আপলোড করে যুক্ত করুন
                  </p>
                </div>
              </div>

              <PhotoCaptureUpload
                onImageChange={(newImg) => {
                  if (newImg) {
                    setBizImages(prev => [...prev, newImg]);
                  }
                }}
                label="নতুন শপ ছবি যুক্ত করুন (Add Store Photo)"
                sublabel="ক্যামেরা চালু করে দোকানের ছবি তুলুন অথবা ফাইল থেকে আপলোড করুন"
                shape="rectangle"
                aspectRatio="16:9"
                placeholderText="গ্যালারি"
              />

              {bizImages.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <div className="text-[11px] font-bold text-slate-700">সংযুক্ত ছবির তালিকা ({bizImages.length}টি):</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {bizImages.map((img, idx) => (
                      <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 bg-white aspect-video shadow-xs">
                        <img src={img} alt={`Shop photo ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setBizImages(bizImages.filter((_, i) => i !== idx))}
                          className="absolute top-1.5 right-1.5 p-1 bg-rose-600/90 hover:bg-rose-600 text-white rounded-lg opacity-90 group-hover:opacity-100 transition-all cursor-pointer shadow-md text-[10px]"
                          title="ছবি মুছুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1 sm:col-span-2 bg-indigo-50/70 border border-indigo-150 p-3.5 rounded-2xl">
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                  🌐 অফিশিয়াল ই-কমার্স বা শপ ওয়েবসাইট লিংক (Shop Website URL)
                  <span className="bg-indigo-200 text-indigo-800 text-[9px] font-black px-1.5 py-0.5 rounded uppercase">নতুুুন ফিউচার</span>
                </label>
                {bizWebsiteUrl && (
                  <button
                    type="button"
                    onClick={() => setShowWebsitePreviewModal(true)}
                    className="text-[10px] font-black text-indigo-700 hover:text-indigo-900 bg-white border border-indigo-200 px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer shadow-xs active:scale-95 transition-all"
                  >
                    🔍 ওয়েবসাইট লাইভ প্রিভিউ দেখুন
                  </button>
                )}
              </div>
              <input
                type="url"
                value={bizWebsiteUrl}
                onChange={(e) => setBizWebsiteUrl(e.target.value)}
                placeholder="https://myonlineshop.com অথবা ফেসবুক শপ/ই-কমার্স ওয়েবসাইট লিংক"
                className="w-full text-xs bg-white border border-indigo-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-900 font-mono"
              />
              <p className="text-[10px] text-indigo-700 font-medium leading-relaxed">
                💡 এই ওয়েবসাইট লিংকটি সেভ করলে কাস্টমাররা আপনার দোকান ভিজিট করার সাথে সাথেই সরাসরি আপনার আসল ওয়েবসাইট বা ফেসবুক শপ দেখতে এবং সেখান থেকে পণ্য ক্রয় করতে পারবে!
              </p>
            </div>
          </div>

          {/* Division, District, Thana & GPS Location Selection */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-3.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h5 className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-indigo-600" />
                দোকানের এলাকা ও জিপিএস লোকেশন (Division, District, Thana & GPS)
              </h5>
              <button
                type="button"
                onClick={handleDetectStoreGpsLocation}
                disabled={detectingGps}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${detectingGps ? 'animate-spin' : ''}`} />
                <span>{detectingGps ? 'জিপিএস দিয়ে লোকেশন খোঁজা হচ্ছে...' : '📍 অটো লাইভ জিপিএস সেটিং'}</span>
              </button>
            </div>

            {gpsSuccess && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-lg flex items-center gap-2">
                <span>✅</span>
                <span>{gpsSuccess}</span>
              </div>
            )}

            {gpsError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-lg flex items-center gap-2">
                <span>⚠️</span>
                <span>{gpsError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">বিভাগ (Division)</label>
                <select
                  required
                  value={normalizeDivisionName(bizDivision)}
                  onChange={(e) => {
                    setBizDivision(e.target.value);
                    setBizDistrict('');
                    setBizThana('');
                  }}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 font-bold cursor-pointer"
                >
                  <option value="">বিভাগ সিলেক্ট করুন</option>
                  {BANGLADESH_LOCATIONS.map((loc, idx) => (
                    <option key={`biz-div-${loc.division}-${idx}`} value={loc.division}>
                      {loc.division}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">জেলা (District)</label>
                <select
                  required
                  value={normalizeDistrictName(bizDivision, bizDistrict)}
                  onChange={(e) => {
                    setBizDistrict(e.target.value);
                    setBizThana('');
                  }}
                  disabled={!normalizeDivisionName(bizDivision)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 font-bold disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
                >
                  <option value="">{normalizeDivisionName(bizDivision) ? 'জেলা সিলেক্ট করুন' : 'আগে বিভাগ সিলেক্ট করুন'}</option>
                  {normalizeDivisionName(bizDivision) &&
                    Array.from(new Set(getDistrictsForDivision(normalizeDivisionName(bizDivision)).map((d) => d.name))).map((dName, idx) => (
                      <option key={`biz-dist-${dName}-${idx}`} value={dName}>
                        {dName}
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">থানা (Thana)</label>
                <select
                  required
                  value={normalizeThanaName(bizDivision, bizDistrict, bizThana)}
                  onChange={(e) => setBizThana(e.target.value)}
                  disabled={!normalizeDistrictName(bizDivision, bizDistrict)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 font-bold disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
                >
                  <option value="">{normalizeDistrictName(bizDivision, bizDistrict) ? 'থানা সিলেক্ট করুন' : 'আগে জেলা সিলেক্ট করুন'}</option>
                  {normalizeDistrictName(bizDivision, bizDistrict) &&
                    Array.from(new Set(getThanasForDistrict(normalizeDivisionName(bizDivision), normalizeDistrictName(bizDivision, bizDistrict)))).map((t, idx) => (
                      <option key={`biz-thana-${t}-${idx}`} value={t}>
                        {t}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* GPS Map Coordinates Inputs */}
            <div className="pt-2 border-t border-slate-200/60 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 block">অক্ষাংশ (Latitude - ম্যাপ স্থানাঙ্ক)</label>
                <input
                  type="number"
                  step="any"
                  value={bizLat}
                  onChange={(e) => setBizLat(parseFloat(e.target.value) || 23.75)}
                  placeholder="23.75"
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 focus:outline-none font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 block">দ্রাঘিমাংশ (Longitude - ম্যাপ স্থানাঙ্ক)</label>
                <input
                  type="number"
                  step="any"
                  value={bizLng}
                  onChange={(e) => setBizLng(parseFloat(e.target.value) || 90.38)}
                  placeholder="90.38"
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1">
              <span>🗺️ বর্তমান পিনকৃত স্থানাঙ্ক: {bizLat.toFixed(4)}, {bizLng.toFixed(4)}</span>
              <a
                href={`https://www.google.com/maps?q=${bizLat},${bizLng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:underline font-bold flex items-center gap-1"
              >
                গুগল ম্যাপে লোকেশন দেখুন ↗
              </a>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">ঠিকানা (পূর্ণাঙ্গ ঠিকানা লিখুন)</label>
            <input
              type="text"
              required
              value={bizAddress}
              onChange={(e) => setBizAddress(e.target.value)}
              placeholder="বাড়ি নং, রোড, ধানমন্ডি, ঢাকা"
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none"
            />
          </div>

          {/* Home delivery option */}
          {bizType === 'shop' && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <h5 className="text-xs font-bold text-slate-800">হোম ডেলিভারি সুবিধা (Home Delivery Options)</h5>
                <p className="text-[10px] text-slate-500">আপনি কি পণ্য কাস্টমারের ঠিকানায় সরাসরি পৌঁছে দেন?</p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={hasHomeDelivery}
                  onChange={(e) => setHasHomeDelivery(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                {hasHomeDelivery && (
                  <input
                    type="number"
                    value={deliveryCharge}
                    onChange={(e) => setDeliveryCharge(Number(e.target.value))}
                    placeholder="ডেলিভারি চার্জ (৳)"
                    className="w-28 text-xs bg-white border border-slate-200 rounded p-1.5 focus:outline-none text-center"
                  />
                )}
              </div>
            </div>
          )}

          {/* Gemini AI assistant description writer */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
                জাদুকরী এআই ডেসক্রিপশন জেনারেটর (Gemini Writer)
              </h5>
              <span className="bg-indigo-200 text-indigo-800 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase font-mono">BETA</span>
            </div>
            <p className="text-[10px] text-indigo-700">
              আপনার ব্যবসার আইটেম বা কিছু পয়েন্ট নিচে বাংলায় লিখুন। এআই স্বয়ংক্রিয়ভাবে একটি প্রফেশনাল ও আকর্ষণীয় বিবরণ লিখে দেবে!
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="যেমন: মিনিকেট চাল, খাঁটি সয়াবিন তেল, ৩০ মিনিটে ফাস্ট ডেলিভারি"
                value={aiBulletPoints}
                onChange={(e) => setAiBulletPoints(e.target.value)}
                className="flex-1 text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none"
              />
              <button
                type="button"
                disabled={aiLoading}
                onClick={handleGenerateAiDescription}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-lg cursor-pointer transition-colors shrink-0 disabled:opacity-50"
              >
                {aiLoading ? 'লিখছে...' : 'বর্ণনা লিখুন'}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">ব্যবসা বা দোকান বিবরণ (Business Description)</label>
            <textarea
              required
              rows={3}
              value={bizDesc}
              onChange={(e) => setBizDesc(e.target.value)}
              placeholder="আমাদের দোকানে আপনাকে স্বাগতম। এখানে উন্নত মানের নিত্যপ্রয়োজনীয় জিনিসপত্র পাওয়া যায়।"
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none resize-none"
            ></textarea>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl transition-colors text-xs cursor-pointer shadow-md shadow-blue-100"
          >
            {business ? '✓ পরিবর্তনসমূহ সংরক্ষণ করুন' : '🚀 আমার দোকান নিবন্ধন সম্পন্ন করুন'}
          </button>
        </form>
      )}

      {/* 2. Items Manager (Products / Services list) */}
      {business && merchantSubTab === 'items' && (() => {
        const totalItems = business.type === 'shop' ? business.products.length : business.services.length;
        const inStockCount = business.type === 'shop' 
          ? business.products.filter(p => p.isAvailable !== false).length 
          : business.services.filter(s => s.isAvailable !== false).length;
        const outOfStockCount = totalItems - inStockCount;
        const discountedCount = business.type === 'shop' 
          ? business.products.filter(p => p.originalPrice && p.originalPrice > p.price).length 
          : 0;

        const filteredProducts = business.type === 'shop'
          ? business.products.filter(p => {
              const query = itemSearchQuery.toLowerCase().trim();
              const matchesSearch = !query || 
                p.name.toLowerCase().includes(query) || 
                (p.description && p.description.toLowerCase().includes(query));
              if (!matchesSearch) return false;
              if (itemFilterStatus === 'in_stock') return p.isAvailable !== false;
              if (itemFilterStatus === 'out_of_stock') return p.isAvailable === false;
              return true;
            })
          : [];

        const filteredServices = business.type !== 'shop'
          ? business.services.filter(s => {
              const query = itemSearchQuery.toLowerCase().trim();
              const matchesSearch = !query || 
                s.name.toLowerCase().includes(query) || 
                (s.description && s.description.toLowerCase().includes(query));
              if (!matchesSearch) return false;
              if (itemFilterStatus === 'in_stock') return s.isAvailable !== false;
              if (itemFilterStatus === 'out_of_stock') return s.isAvailable === false;
              return true;
            })
          : [];

        return (
          <div className="space-y-6">
            {/* Summary Statistics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400">মোট আইটেম</div>
                  <div className="text-base font-black text-slate-800">{totalItems} টি</div>
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400">স্টকে আছে</div>
                  <div className="text-base font-black text-emerald-600">{inStockCount} টি</div>
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400">স্টক শেষ</div>
                  <div className="text-base font-black text-rose-600">{outOfStockCount} টি</div>
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <Percent className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400">মূল্যছাড় অফার</div>
                  <div className="text-base font-black text-purple-600">{discountedCount} টি</div>
                </div>
              </div>
            </div>

            {/* Header & Search / Filter Controls */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    📋 {business.type === 'shop' ? 'পণ্যের তালিকা ও স্টক নিয়ন্ত্রণ (Product Manager)' : 'সার্ভিস ও সেবা সমূহের তালিকা'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {business.type === 'shop' 
                      ? 'দোকানের সকল পণ্য সহজে এডিট করুন, ছবি ও বিবরণ পরিবর্তন করুন, স্টক ও মূল্য আপডেট করুন।' 
                      : 'আপনার সেবার চার্জ রেট এবং বিবরণ সহজে এডিট ও পরিচালনা করুন।'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFbImportTarget('merchant_product');
                      setShowFbImportModal(true);
                    }}
                    className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-black text-xs py-2.5 px-3.5 rounded-xl border border-blue-200 shadow-xs flex items-center gap-1.5 cursor-pointer transition-all shrink-0"
                    title="ফেসবুক পেজ বা পোস্ট থেকে সরাসরি পণ্য ইমপোর্ট করুন"
                  >
                    <span className="font-serif font-black text-sm text-blue-600">f</span>
                    <span>ফেসবুক ইমপোর্ট</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setNewItemName('');
                      setNewItemPrice(0);
                      setNewItemOriginalPrice(0);
                      setNewItemDesc('');
                      setNewItemImage('');
                      setSelectedFeatureChips([]);
                      setShowProductModal(true);
                    }}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs py-2.5 px-4 rounded-xl shadow-md shadow-emerald-100 flex items-center gap-1.5 cursor-pointer transition-all shrink-0"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>{business.type === 'shop' ? 'নতুন পণ্য যোগ করুন' : 'নতুন সেবা যোগ করুন'}</span>
                  </button>
                </div>
              </div>

              {/* Search input & Filter pills */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-slate-100">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder={business.type === 'shop' ? "পণ্য খুঁজুন (নাম বা বিবরণ দিয়ে)..." : "সেবা খুঁজুন..."}
                    value={itemSearchQuery}
                    onChange={(e) => setItemSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800"
                  />
                  {itemSearchQuery && (
                    <button
                      onClick={() => setItemSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  <button
                    type="button"
                    onClick={() => setItemFilterStatus('all')}
                    className={`text-xs font-black px-3 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                      itemFilterStatus === 'all'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    সব ({totalItems})
                  </button>
                  <button
                    type="button"
                    onClick={() => setItemFilterStatus('in_stock')}
                    className={`text-xs font-black px-3 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                      itemFilterStatus === 'in_stock'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100'
                    }`}
                  >
                    <span>🟢 স্টকে আছে</span>
                    <span>({inStockCount})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setItemFilterStatus('out_of_stock')}
                    className={`text-xs font-black px-3 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                      itemFilterStatus === 'out_of_stock'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-100'
                    }`}
                  >
                    <span>🔴 স্টক শেষ</span>
                    <span>({outOfStockCount})</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Grid/List of Products or Services */}
            <div>
              {business.type === 'shop' ? (
                filteredProducts.length === 0 ? (
                  <div className="bg-white border border-dashed border-slate-200 rounded-2xl text-center py-16 text-slate-400 space-y-4">
                    <ShoppingBag className="w-12 h-12 mx-auto text-slate-300 stroke-1 animate-pulse" />
                    <div className="space-y-1">
                      <h5 className="text-xs font-bold text-slate-700">
                        {itemSearchQuery ? 'কোনো পণ্য খুঁজে পাওয়া যায়নি!' : 'আপনার দোকানে এখনো কোনো পণ্য যুক্ত করেননি!'}
                      </h5>
                      <p className="text-[11px] text-slate-400">
                        {itemSearchQuery ? 'অন্য কোনো নাম দিয়ে সার্চ করে দেখুন।' : 'এআই ফিচার ব্যবহার করে খুব সহজেই পণ্য ও বিবরণ যুক্ত করুন।'}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowProductModal(true)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-4 rounded-xl transition-all cursor-pointer"
                    >
                      ➕ নতুন পণ্য যোগ করুন
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredProducts.map((p) => {
                      const discountPercent = p.originalPrice && p.originalPrice > p.price
                        ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
                        : null;
                      const isInStock = p.isAvailable !== false;

                      return (
                        <div 
                          key={p.id} 
                          className={`bg-white border rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group relative ${
                            isInStock ? 'border-slate-200' : 'border-rose-200 bg-rose-50/20'
                          }`}
                        >
                          {/* Discount & Stock Badges */}
                          <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1 items-start">
                            {discountPercent && (
                              <span className="bg-rose-500 text-white font-black text-[9px] px-2 py-0.5 rounded-full shadow-xs uppercase tracking-wider">
                                {discountPercent}% ছাড়
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleToggleAvailability(p.id, 'product')}
                              title="স্টক স্ট্যাটাস পরিবর্তন করতে ক্লিক করুন"
                              className={`text-[9px] font-black px-2 py-0.5 rounded-full shadow-xs cursor-pointer transition-all ${
                                isInStock 
                                  ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                                  : 'bg-rose-600 text-white hover:bg-rose-700 animate-pulse'
                              }`}
                            >
                              {isInStock ? '🟢 ইন-স্টক' : '🔴 স্টক আউট'}
                            </button>
                          </div>

                          {/* Product Image */}
                          <div className="aspect-video w-full bg-slate-50 relative overflow-hidden shrink-0 border-b border-slate-100">
                            <img 
                              src={p.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200'} 
                              alt={p.name} 
                              className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${!isInStock ? 'grayscale-50 opacity-75' : ''}`}
                              referrerPolicy="no-referrer"
                            />
                          </div>

                          {/* Product Info */}
                          <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                            <div className="space-y-1">
                              <h5 className="text-xs font-black text-slate-800 line-clamp-1 group-hover:text-emerald-700 transition-colors">
                                {p.name}
                              </h5>
                              <p className="text-[10px] text-slate-500 line-clamp-2 h-7 font-medium leading-relaxed">
                                {p.description || 'কোনো বিবরণ নেই'}
                              </p>
                            </div>

                            <div className="space-y-2.5">
                              {/* Price */}
                              <div className="flex items-baseline gap-2">
                                <span className="text-sm font-black text-emerald-600">৳{p.price}</span>
                                {p.originalPrice && p.originalPrice > p.price && (
                                  <span className="line-through text-[10px] text-slate-400 font-medium">৳{p.originalPrice}</span>
                                )}
                              </div>

                              {/* Action Buttons Toolbar */}
                              <div className="border-t border-slate-100 pt-2.5 flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditProduct(p)}
                                  className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-[11px] font-black transition-all cursor-pointer"
                                  title="সম্পূর্ণ এডিট করুন (নাম, মূল্য, ছবি, বিবরণ, স্টক)"
                                >
                                  <Edit3 className="w-3 h-3 text-blue-600" />
                                  <span>এডিট</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setFbShareItem({
                                      title: p.name,
                                      price: p.price,
                                      originalPrice: p.originalPrice,
                                      image: p.image
                                    });
                                    setShowFbShareModal(true);
                                  }}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 hover:text-blue-700 rounded-xl border border-blue-200 transition-all cursor-pointer"
                                  title="ফেসবুকে শেয়ার ও প্রমোশন করুন"
                                >
                                  <Share2 className="w-3.5 h-3.5" />
                                </button>
                                
                                <button
                                  type="button"
                                  onClick={() => handleDuplicateProduct(p)}
                                  className="p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-xl border border-slate-200 transition-all cursor-pointer"
                                  title="এই পণ্যের একটি কপি/ক্লোন তৈরি করুন"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(p.id)}
                                  className="p-1.5 text-rose-500 hover:bg-rose-50 hover:text-rose-700 rounded-xl border border-rose-100 transition-all cursor-pointer"
                                  title="পণ্যটি ডিলিট করুন"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              ) : (
                filteredServices.length === 0 ? (
                  <div className="bg-white border border-dashed border-slate-200 rounded-2xl text-center py-16 text-slate-400 space-y-4">
                    <Sparkles className="w-12 h-12 mx-auto text-slate-300 stroke-1 animate-pulse" />
                    <div className="space-y-1">
                      <h5 className="text-xs font-bold text-slate-700">কোনো সেবা বা সার্ভিস পাওয়া যায়নি!</h5>
                      <p className="text-[11px] text-slate-400">আপনার ব্যবসা প্রোফাইলে এখনো কোনো জরুরি সেবার আইটেম যোগ করেননি।</p>
                    </div>
                    <button
                      onClick={() => setShowProductModal(true)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-4 rounded-xl transition-all cursor-pointer"
                    >
                      ➕ প্রথম সেবা যোগ করুন
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredServices.map((s) => {
                      const isInStock = s.isAvailable !== false;
                      return (
                        <div 
                          key={s.id} 
                          className={`bg-white border rounded-2xl p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 group ${
                            isInStock ? 'border-slate-200' : 'border-rose-200 bg-rose-50/20'
                          }`}
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                                🛠️
                              </div>
                              <button
                                type="button"
                                onClick={() => handleToggleAvailability(s.id, 'service')}
                                className={`text-[9px] font-black px-2 py-0.5 rounded-full cursor-pointer transition-all ${
                                  isInStock ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {isInStock ? '🟢 সচল' : '🔴 বন্ধ'}
                              </button>
                            </div>
                            <div className="space-y-1">
                              <h5 className="text-xs font-black text-slate-800 line-clamp-1">{s.name}</h5>
                              <p className="text-[10px] text-slate-500 line-clamp-2 h-7 leading-relaxed">
                                {s.description || 'সেবা বা সার্ভিস এর সংক্ষিপ্ত বিবরণ নেই'}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-2.5">
                            <span className="font-extrabold text-emerald-600 text-xs block bg-emerald-50 border border-emerald-100/50 px-2.5 py-1 rounded-lg w-max">
                              ফি: ৳ {s.charge}
                            </span>

                            <div className="border-t border-slate-100 pt-2.5 flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEditService(s)}
                                className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-[11px] font-black transition-all cursor-pointer"
                              >
                                <Edit3 className="w-3 h-3 text-blue-600" />
                                <span>এডিট</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(s.id)}
                                className="p-1.5 text-rose-500 hover:bg-rose-50 hover:text-rose-700 rounded-xl border border-rose-100 transition-all cursor-pointer"
                                title="সেবা ডিলিট করুন"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              )}
            </div>
          </div>
        );
      })()}

      {/* 3. Orders Manager */}
      {business && merchantSubTab === 'orders' && (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden p-4 space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h4 className="text-sm font-bold text-slate-900">অর্ডার ও বুকিং রিকোয়েস্ট (Customer Bookings)</h4>
            <div className="flex gap-4 text-xs">
              <span className="text-slate-500">মোট বিক্রয়: <strong className="text-slate-800">৳ {totalEarnedAmount}</strong></span>
              <span className="text-slate-500">অর্ডার সংখ্যা: <strong className="text-slate-800">{totalSalesCount}টি</strong></span>
            </div>
          </div>

          {activeBookings.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">এখনো কোনো কাস্টমার বুকিং আসেনি।</div>
          ) : (
            <div className="space-y-4">
              {activeBookings.map((b) => (
                <div key={b.id} className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 flex flex-col md:flex-row justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-800">বুকিং আইডি: #{b.id}</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                        b.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : b.status === 'cancelled' ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {b.status === 'pending' ? 'পেন্ডিং' : b.status === 'accepted' ? 'গৃহীত' : b.status === 'completed' ? 'ডেলিভার্ড' : b.status === 'cancelled' ? 'বাতিলকৃত' : b.status}
                      </span>
                    </div>

                    <div className="text-xs space-y-1">
                      <p className="text-slate-700">👤 কাস্টমার: <strong className="text-slate-900">{b.userName}</strong> ({b.userPhone})</p>
                      <p className="text-slate-500">📍 ঠিকানা: {b.userAddress}</p>
                      {b.bookingTime && <p className="text-indigo-600 font-semibold">🕒 সময়সূচী: {b.bookingDate} ({b.bookingTime})</p>}
                    </div>

                    {/* Ordered Items list */}
                    <div className="bg-white p-2 rounded border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">আইটেম তালিকা:</p>
                      <ul className="divide-y divide-slate-100 mt-1">
                        {b.items.map((item: any, idx: number) => (
                          <li key={idx} className="py-1 text-[11px] text-slate-700 flex justify-between">
                            <span>{item.name} <strong className="text-slate-400">x{item.quantity}</strong></span>
                            <span className="font-semibold text-slate-900">৳ {item.price * item.quantity}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="border-t border-slate-100 pt-1.5 mt-1.5 flex justify-between text-xs font-bold text-slate-900">
                        <span>মোট মূল্য:</span>
                        <span>৳ {b.totalPrice + (b.deliveryCharge || 0)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions depending on current status */}
                  <div className="flex flex-col justify-between items-end gap-2 shrink-0">
                    <div className="text-right">
                      <span className="text-[10px] block text-slate-400">পেমেন্ট পদ্ধতি</span>
                      <span className="text-xs font-bold text-slate-800 uppercase">{b.paymentMethod}</span>
                      <span className={`block text-[10px] font-semibold ${b.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                        ({b.paymentStatus === 'paid' ? 'পেইড' : 'বাকি'})
                      </span>
                    </div>

                    <div className="flex gap-2">
                      {b.status === 'pending' && (
                        <>
                          <button
                            onClick={() => onUpdateBookingStatus(b.id, 'accepted')}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-1.5 px-3 rounded-lg cursor-pointer"
                          >
                            ✓ গ্রহণ করুন
                          </button>
                          <button
                            onClick={() => onUpdateBookingStatus(b.id, 'cancelled')}
                            className="bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-500 font-bold text-xs py-1.5 px-3 rounded-lg cursor-pointer"
                          >
                            ✕ বাতিল করুন
                          </button>
                        </>
                      )}
                      {b.status === 'accepted' && (
                        <button
                          onClick={() => onUpdateBookingStatus(b.id, 'completed', 'paid')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-1.5 px-3 rounded-lg cursor-pointer"
                        >
                          ✓ ডেলিভারি ও পেমেন্ট সম্পন্ন
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. Business Reports & Analytics */}
      {business && merchantSubTab === 'reports' && (() => {
        // Calculate some useful stats
        const completedBookings = activeBookings.filter(b => b.status === 'completed');
        const pendingCount = activeBookings.filter(b => b.status === 'pending').length;
        const acceptedCount = activeBookings.filter(b => b.status === 'accepted').length;
        const cancelledCount = activeBookings.filter(b => b.status === 'cancelled').length;
        const totalCustomersCount = Array.from(new Set(activeBookings.map(b => b.userPhone))).length;

        // Calculate product sales count
        const productSales: { [name: string]: { count: number; revenue: number } } = {};
        completedBookings.forEach(b => {
          b.items.forEach(item => {
            if (!productSales[item.name]) {
              productSales[item.name] = { count: 0, revenue: 0 };
            }
            productSales[item.name].count += item.quantity;
            productSales[item.name].revenue += item.price * item.quantity;
          });
        });

        const topProducts = Object.entries(productSales)
          .map(([name, data]) => ({ name, ...data }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        // Daily revenue for last few orders
        const recentCompletedOrders = completedBookings.slice(-5).reverse();

        return (
          <div className="space-y-6">
            <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <BarChart2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900">📊 রিপোর্ট ও ব্যবসার বিশ্লেষণ (Reports & Analytics)</h4>
                    <p className="text-xs text-slate-500">আপনার দোকানের বিক্রয়, কাস্টমার এবং প্রোডাক্ট পারফরম্যান্স বিশ্লেষণ করুন</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  লাইভ আপডেট হচ্ছে
                </div>
              </div>

              {/* Grid of Key Performance Indicators (KPIs) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">মোট আয়</span>
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                  </div>
                  <p className="text-xl font-black text-slate-900">৳ {totalEarnedAmount}</p>
                  <span className="text-[10px] text-slate-500 block">সফল ডেলিভারি {totalSalesCount}টি</span>
                </div>

                <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">মোট কাস্টমার</span>
                    <Users className="w-4 h-4 text-blue-500" />
                  </div>
                  <p className="text-xl font-black text-slate-900">{totalCustomersCount} জন</p>
                  <span className="text-[10px] text-slate-500 block">ইউনিক মোবাইল নম্বর</span>
                </div>

                <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">চলতি ও পেন্ডিং</span>
                    <Clock3 className="w-4 h-4 text-amber-500" />
                  </div>
                  <p className="text-xl font-black text-slate-900">{pendingCount + acceptedCount} টি</p>
                  <span className="text-[10px] text-slate-500 block">পেন্ডিং: {pendingCount}, চলতি: {acceptedCount}</span>
                </div>

                <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">গড় রেটিং</span>
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  </div>
                  <p className="text-xl font-black text-slate-900">{business.rating || 'N/A'}</p>
                  <span className="text-[10px] text-slate-500 block">{business.reviewsCount || 0} টি কাস্টমার রিভিউ</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Popular products list */}
              <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-4">
                <h5 className="text-xs font-bold text-slate-900 border-b pb-2 flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-indigo-500" />
                  সেরা বিক্রিত পণ্য ও সেবা (Top Selling Items)
                </h5>

                {topProducts.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">আজ কোনো সফল পণ্য বা সার্ভিস বিক্রয় হয়নি।</div>
                ) : (
                  <div className="space-y-3.5">
                    {topProducts.map((p, index) => {
                      const totalQtySold = p.count;
                      return (
                        <div key={index} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-3">
                            <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                              {index + 1}
                            </span>
                            <div>
                              <span className="font-bold text-slate-800 block">{p.name}</span>
                              <span className="text-[10px] text-slate-400">বিক্রয় পরিমাণ: {totalQtySold}টি</span>
                            </div>
                          </div>
                          <span className="font-black text-slate-950">৳ {p.revenue}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Order stats and ratios */}
              <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-4">
                <h5 className="text-xs font-bold text-slate-900 border-b pb-2 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  অর্ডার স্ট্যাটাস রিপোর্ট (Order Status Ratios)
                </h5>

                {activeBookings.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">এখনো কোনো কাস্টমার বুকিং বা অর্ডার রেকর্ড নেই।</div>
                ) : (
                  <div className="space-y-4 text-xs">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-slate-600 font-semibold">
                        <span>সফল ডেলিভারি (Completed)</span>
                        <span className="font-bold text-slate-900">{Math.round((totalSalesCount / activeBookings.length) * 100)}% ({totalSalesCount}টি)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full transition-all" style={{ width: `${(totalSalesCount / activeBookings.length) * 100}%` }}></div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-slate-600 font-semibold">
                        <span>চলতি অর্ডার (Accepted/Pending)</span>
                        <span className="font-bold text-slate-900">{Math.round(((pendingCount + acceptedCount) / activeBookings.length) * 100)}% ({pendingCount + acceptedCount}টি)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full transition-all" style={{ width: `${((pendingCount + acceptedCount) / activeBookings.length) * 100}%` }}></div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-slate-600 font-semibold">
                        <span>বাতিলকৃত অর্ডার (Cancelled)</span>
                        <span className="font-bold text-slate-900">{Math.round((cancelledCount / activeBookings.length) * 100)}% ({cancelledCount}টি)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-rose-500 h-full transition-all" style={{ width: `${(cancelledCount / activeBookings.length) * 100}%` }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Completed Bookings table */}
            <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-3">
              <h5 className="text-xs font-bold text-slate-900 border-b pb-2 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-500" />
                সাম্প্রতিক সম্পন্নকৃত কাস্টমার অর্ডার তালিকা (Recent Earnings)
              </h5>

              {recentCompletedOrders.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">এখনো কোনো অর্ডার সফলভাবে ডেলিভারি করা হয়নি।</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {recentCompletedOrders.map((b) => (
                    <div key={b.id} className="py-2.5 flex items-center justify-between text-xs gap-4">
                      <div>
                        <span className="font-bold text-slate-800">বুকিং আইডি: #{b.id}</span>
                        <span className="text-[10px] text-slate-500 block">কাস্টমার: {b.userName} ({b.userPhone})</span>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-emerald-600 block">+ ৳ {b.totalPrice}</span>
                        <span className="text-[10px] text-slate-400 block">{b.bookingDate}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* 5. Wallet & Subscription Packages */}
      {business && merchantSubTab === 'wallet' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-100 p-5 rounded-xl shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">উপলব্ধ ব্যালেন্স (Wallet Balance)</span>
                <p className="text-2xl font-black text-slate-900 mt-1">৳ {business.balance.toLocaleString()}</p>
                <span className="text-[10px] text-emerald-600 mt-1 block">নিরাপদ ও সরাসরি পেমেন্ট আয়</span>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center"><Wallet className="w-6 h-6" /></div>
            </div>

            <div className="bg-white border border-slate-100 p-5 rounded-xl shadow-sm flex items-center justify-between col-span-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">সক্রিয় প্যাকেজ</span>
                <h4 className="text-sm font-black text-slate-900 mt-1 flex items-center gap-2">
                  <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded uppercase font-bold text-xs">
                    {business.subscriptionPlan.toUpperCase()} PLAN
                  </span>
                  {business.subscriptionExpiry && (
                    <span className="text-slate-400 text-xs font-normal">
                      মেয়াদ শেষ হবে: {new Date(business.subscriptionExpiry).toLocaleDateString('bn-BD')}
                    </span>
                  )}
                </h4>
                <p className="text-[11px] text-slate-500 mt-1">সবচেয়ে বেশি বুকিং ও টপ রাঙ্কিং পেতে ডায়মন্ড বা গোল্ড প্যাকেজ বেছে নিন।</p>
              </div>
            </div>
          </div>

          {/* Subscriptions Plans List */}
          <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-4">
            <div className="text-center space-y-1 mb-6">
              <h4 className="text-sm font-bold text-slate-900">ডায়নামিক প্যাকেজ প্ল্যান ও সুবিধা (Pricing Packages)</h4>
              <p className="text-xs text-slate-500">আপনার ব্যবসা বুস্ট করুন এবং হাজার হাজার গ্রাহকদের কাছে দ্রুত পৌঁছান</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {(subscriptionPlans && subscriptionPlans.length > 0 ? subscriptionPlans : SUBSCRIPTION_PLANS).map((plan) => {
                const isActive = business.subscriptionPlan === plan.id;
                return (
                  <div key={plan.id} className={`border rounded-2xl p-4 flex flex-col justify-between relative transition-all ${plan.color} ${isActive ? 'ring-2 ring-blue-600 bg-blue-50/10' : ''}`}>
                    {isActive && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        বর্তমানে সক্রিয়
                      </span>
                    )}
                    <div className="space-y-3">
                      <div>
                        <h5 className="font-black text-xs text-slate-900">{plan.name}</h5>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-lg font-black text-slate-900">৳ {plan.price}</span>
                          <span className="text-[10px] text-slate-400">/ {plan.pricePeriod}</span>
                        </div>
                      </div>
                      <ul className="space-y-1.5 text-[11px] text-slate-600">
                        {plan.features.map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-emerald-600 font-bold">✓</span>
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    {!isActive && plan.id !== 'free' && (
                      <button
                        onClick={() => handleTriggerUpgrade(plan)}
                        className={`w-full mt-4 font-bold text-xs py-2 px-3 rounded-xl cursor-pointer ${plan.buttonStyle}`}
                      >
                        আপগ্রেড করুন
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Transaction list */}
          <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm space-y-2">
            <h4 className="text-xs font-bold text-slate-900 border-b pb-1.5">আয়-ব্যয়ের হিসাব ও স্টেটমেন্ট (Statement Log)</h4>
            {business.transactions.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">এখনো কোনো লেনদেন হিসাব সম্পন্ন হয়নি।</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {business.transactions.map((t) => (
                  <div key={t.id} className="py-2 flex items-center justify-between text-xs gap-3">
                    <div>
                      <span className="font-semibold text-slate-800">{t.description}</span>
                      <span className="text-[10px] text-slate-400 block">{new Date(t.date).toLocaleString('bn-BD')}</span>
                    </div>
                    <span className={`font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-slate-600'}`}>
                      {t.type === 'income' ? '+' : '-'} ৳ {t.amount}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. Advertising and Special Offers */}
      {business && merchantSubTab === 'ads' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Discount Offers creator */}
          {business.isOfferCreationAllowed === false ? (
            <div className="bg-slate-50 border border-slate-100 p-6 rounded-xl text-center space-y-3 flex flex-col items-center justify-center min-h-[250px]">
              <span className="text-3xl block">🔒</span>
              <h5 className="font-black text-xs text-slate-800">ডিসকাউন্ট কুপন ফিচার নিষ্ক্রিয় রয়েছে</h5>
              <p className="text-[10px] text-slate-500 font-bold leading-relaxed max-w-xs">
                দুঃখিত, আপনার অ্যাকাউন্টের জন্য কাস্টম ডিসকাউন্ট কুপন ও অফার তৈরি করার অনুমতি অ্যাডমিন দ্বারা নিষ্ক্রিয় করা হয়েছে। এটি চালু করতে অনুগ্রহ করে সিস্টেম অ্যাডমিনের সাথে যোগাযোগ করুন।
              </p>
            </div>
          ) : (
            <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm space-y-4">
              <h4 className="text-xs font-bold text-slate-900 border-b pb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-rose-500" />
                ডিসকাউন্ট কুপন ও অফার যোগ করুন (Coupon Code)
              </h4>
              <form onSubmit={handleAddOfferSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 block">অফারের শিরোনাম</label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: ১০% ফ্লাট ছাড়, ঈদ ধামাকা!"
                    value={offerTitle}
                    onChange={(e) => setOfferTitle(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded p-2 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block">কুপন কোড (Coupon Code)</label>
                    <input
                      type="text"
                      required
                      placeholder="যেমন: EID20"
                      value={offerCode}
                      onChange={(e) => setOfferCode(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded p-2 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block">ডিসকাউন্ট হার (%)</label>
                    <input
                      type="number"
                      required
                      value={offerDiscount}
                      onChange={(e) => setOfferDiscount(Number(e.target.value))}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded p-2 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 block">মেয়াদ উত্তীর্ণের তারিখ (Expiry)</label>
                  <input
                    type="date"
                    required
                    value={offerExpiry}
                    onChange={(e) => setOfferExpiry(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded p-2 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-1.5 px-3 rounded text-xs cursor-pointer transition-colors"
                >
                  ✓ অফার সক্রিয় করুন
                </button>
              </form>

              {/* Existing Merchant Coupons List */}
              <div className="pt-3 border-t border-slate-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h5 className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-rose-500" />
                    আপনার বর্তমান ডিসকাউন্ট কুপনসমূহ ({business.offers?.length || 0})
                  </h5>
                  <span className="text-[9px] text-slate-400 font-semibold">ম্যানেজ ও এডিট করুন</span>
                </div>

                {!business.offers || business.offers.length === 0 ? (
                  <div className="text-center py-4 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                    <p className="text-[10px] text-slate-400 font-medium">কোনো ডিসকাউন্ট কুপন নেই। উপরের ফর্ম দিয়ে তৈরি করুন।</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {business.offers.map((offer: any) => (
                      <div
                        key={offer.id}
                        className="border border-slate-200 bg-slate-50/50 hover:bg-white rounded-xl p-3 transition-all space-y-2 relative group hover:border-rose-200 hover:shadow-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-extrabold text-[11px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded tracking-wider">
                                {offer.code}
                              </span>
                              <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                                {offer.discountPercent}% ছাড়
                              </span>
                            </div>
                            <h6 className="font-bold text-xs text-slate-800 truncate">{offer.title}</h6>
                            {offer.description && (
                              <p className="text-[10px] text-slate-500 line-clamp-1">{offer.description}</p>
                            )}
                            <p className="text-[9px] text-slate-400 font-medium">মেয়াদ: {offer.expiryDate || 'আজীবন'}</p>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => handleCopyMerchantCoupon(offer.code, offer.id)}
                              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 transition-colors"
                              title="কুপন কোড কপি করুন"
                            >
                              {copiedCouponId === offer.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              onClick={() => handleOpenEditOffer(offer)}
                              className="p-1.5 rounded-lg border border-indigo-100 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-colors cursor-pointer"
                              title="কুপন এডিট করুন"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteOfferSubmit(offer.id)}
                              disabled={isDeletingOfferId === offer.id}
                              className="p-1.5 rounded-lg border border-rose-100 bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer disabled:opacity-50"
                              title="কুপন ডিলিট করুন"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Edit Merchant Coupon Modal */}
          {isEditingOfferModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between border-b pb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                      <Edit3 className="w-5 h-5" />
                    </span>
                    <div>
                      <h4 className="text-xs font-black text-slate-900">ডিসকাউন্ট কুপন ও অফার এডিট করুন</h4>
                      <p className="text-[10px] text-slate-400">তথ্য পরিবর্তন করে সেভ করুন</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsEditingOfferModalOpen(false)}
                    className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSaveEditOfferSubmit} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block">অফারের শিরোনাম</label>
                    <input
                      type="text"
                      required
                      value={editOfferTitle}
                      onChange={(e) => setEditOfferTitle(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded p-2 focus:outline-none focus:bg-white focus:ring-1 focus:ring-rose-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 block">কুপন কোড (Coupon Code)</label>
                      <input
                        type="text"
                        required
                        value={editOfferCode}
                        onChange={(e) => setEditOfferCode(e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded p-2 font-mono uppercase focus:outline-none focus:bg-white focus:ring-1 focus:ring-rose-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 block">ডিসকাউন্ট হার (%)</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        required
                        value={editOfferDiscount}
                        onChange={(e) => setEditOfferDiscount(Number(e.target.value))}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded p-2 focus:outline-none focus:bg-white focus:ring-1 focus:ring-rose-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block">অফারের বিবরণ (ঐচ্ছিক)</label>
                    <textarea
                      rows={2}
                      value={editOfferDesc}
                      onChange={(e) => setEditOfferDesc(e.target.value)}
                      placeholder="অফারের বিস্তারিত নিয়ম ও শর্ত..."
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded p-2 focus:outline-none focus:bg-white focus:ring-1 focus:ring-rose-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block">মেয়াদ উত্তীর্ণের তারিখ (Expiry)</label>
                    <input
                      type="date"
                      required
                      value={editOfferExpiry}
                      onChange={(e) => setEditOfferExpiry(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded p-2 focus:outline-none focus:bg-white focus:ring-1 focus:ring-rose-500"
                    />
                  </div>

                  <div className="pt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingOfferModalOpen(false)}
                      className="flex-1 py-2 px-3 rounded-lg border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50"
                    >
                      বাতিল
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingEditOffer}
                      className="flex-1 py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors shadow-sm disabled:opacity-50"
                    >
                      {isSavingEditOffer ? 'সংরক্ষণ হচ্ছে...' : 'আপডেট সম্পন্ন করুন'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Advertisement Campaign creator */}
          {business.isBannersAllowed === false ? (
            <div className="bg-slate-50 border border-slate-100 p-6 rounded-xl text-center space-y-3 flex flex-col items-center justify-center min-h-[250px]">
              <span className="text-3xl block">🔒</span>
              <h5 className="font-black text-xs text-slate-800">ব্যানার বিজ্ঞাপন ফিচার নিষ্ক্রিয় রয়েছে</h5>
              <p className="text-[10px] text-slate-500 font-bold leading-relaxed max-w-xs">
                দুঃখিত, আপনার ব্যবসা প্রতিষ্ঠানের জন্য হোমপেজ ব্যানার বিজ্ঞাপন ও স্পন্সরড প্রচারণার ফিচারটি নিষ্ক্রিয় করা আছে। এটি সচল করতে অ্যাডমিনের সাথে যোগাযোগ করুন।
              </p>
            </div>
          ) : (
            <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm space-y-4">
              <h4 className="text-xs font-bold text-slate-900 border-b pb-1.5 flex items-center gap-1.5">
                <Store className="w-4 h-4 text-blue-500" />
                হোমপেজ ও টপ ক্যাটাগরি বিজ্ঞাপন প্রস্তাব (Sponsor Ad)
              </h4>
              <p className="text-[10px] text-slate-400">
                অ্যাপ্লিকেশনের হোমপেজে বা সার্চে সবার উপরে থাকার জন্য আপনার ব্যানার ও বাজেটসহ আবেদন সাবমিট করুন।
              </p>
              <form onSubmit={handleCreateAdSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 block">প্লেসমেন্ট (Placement)</label>
                <select
                  value={adPlacement}
                  onChange={(e: any) => setAdPlacement(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded p-2 focus:outline-none"
                >
                  <option value="homepage">হোমপেজ ব্যানার স্লাইডার (Homepage Banner)</option>
                  <option value="category">ক্যাটাগরি পেজ টপ ব্যানার (Category Top)</option>
                  <option value="search">সার্চ পেজ বুস্ট (Search Boosting)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 block">ব্যানার ইমেজ বা প্রমোশন ভিডিও লিংক (Banner Image or Video URL)</label>
                <input
                  type="text"
                  placeholder="https://example.com/banner.mp4 বা ইউটিউব ভিডিও লিংক"
                  value={adBanner}
                  onChange={(e) => setAdBanner(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded p-2 focus:outline-none text-slate-900 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 block">ক্যাম্পেইন বাজেট (৳)</label>
                <input
                  type="number"
                  required
                  value={adBudget}
                  onChange={(e) => setAdBudget(Number(e.target.value))}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded p-2 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-3 rounded text-xs cursor-pointer transition-colors"
              >
                🚀 সাবমিট ক্যাম্পেইন আবেদন
              </button>
            </form>
          </div>
          )
          }
        </div>
      )}

      {/* Customers sub-tab */}
      {business && merchantSubTab === 'customers' && (
        business.isLedgerAllowed === false ? (
          <div className="bg-amber-50/50 border border-amber-100 p-8 rounded-2xl shadow-3xs text-center space-y-3 max-w-xl mx-auto my-6">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mx-auto text-xl shadow-3xs">
              🔒
            </div>
            <h3 className="text-xs font-black text-amber-900">কাস্টমার ডিরেক্টরি ও বাকি খাতা নিষ্ক্রিয়</h3>
            <p className="text-[10px] text-amber-700 leading-relaxed font-bold">
              দুঃখিত, আপনার দোকানের জন্য গ্রাহক ডিরেক্টরি ও বকেয়া হিসাব (বাকি খাতা) রাখার ফিচারটি নিষ্ক্রিয় করা হয়েছে। এই ফিচারটি পুনরায় সচল করতে অনুগ্রহ করে অ্যাডমিন সাপোর্টে যোগাযোগ করুন।
            </p>
            <span className="inline-block text-[9px] bg-white border border-amber-200 px-2.5 py-0.5 rounded-lg text-amber-800 font-black">
              Rest Bazar Business Upgrade System
            </span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header & Stats Cards */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                  👥 কাস্টমার ডিরেক্টরি ও বাকি খাতা (Customer Book)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">আপনার নিয়মিত কাস্টমারদের তালিকা পরিচালনা করুন ও বকেয়া হিসাব (বাকি খাতা) রাখুন।</p>
            </div>
            <button
              onClick={handleOpenAddCust}
              className="bg-blue-600 hover:bg-blue-700 text-white font-black text-xs py-2 px-4 rounded-xl shadow-md shadow-blue-100 flex items-center gap-1 cursor-pointer transition-all shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>নতুন কাস্টমার যোগ করুন</span>
            </button>
          </div>

          {/* Stats Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-xs flex items-center gap-3">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-bold uppercase">মোট কাস্টমার সংখ্যা</span>
                <span className="text-base font-black text-slate-900">
                  {((business.customers || []).length)} জন
                </span>
              </div>
            </div>

            <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-xs flex items-center gap-3">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-bold uppercase">মোট বাকি পাওনা পরিমাণ</span>
                <span className="text-base font-black text-rose-600">
                  ৳ {(business.customers || []).reduce((sum, c) => sum + (c.balanceDue || 0), 0)}
                </span>
              </div>
            </div>

            <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-xs flex items-center gap-3">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-bold uppercase">বকেয়ামুক্ত কাস্টমার</span>
                <span className="text-base font-black text-slate-900">
                  {(business.customers || []).filter(c => (c.balanceDue || 0) === 0).length} জন
                </span>
              </div>
            </div>
          </div>

          {/* Search bar */}
          <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-xs flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="কাস্টমারের নাম অথবা মোবাইল নম্বর দিয়ে সার্চ করুন..."
              value={custSearchQuery}
              onChange={(e) => setCustSearchQuery(e.target.value)}
              className="w-full text-xs focus:outline-none text-slate-800 bg-transparent font-medium"
            />
            {custSearchQuery && (
              <button onClick={() => setCustSearchQuery('')} className="text-slate-400 hover:text-slate-600 text-xs font-bold">
                মুছুন
              </button>
            )}
          </div>

          {/* Customer list table */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
            {!(business.customers && business.customers.length > 0) ? (
              <div className="text-center py-16 text-slate-400 space-y-3">
                <Users className="w-10 h-10 mx-auto text-slate-300 stroke-1" />
                <div className="text-xs font-medium">কোনো কাস্টমার এখনো তালিকাভুক্ত করা হয়নি।</div>
                <button
                  onClick={handleOpenAddCust}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-1.5 px-3 rounded-lg transition-all"
                >
                  প্রথম কাস্টমার যোগ করুন
                </button>
              </div>
            ) : (() => {
              const filtered = business.customers.filter(c => 
                c.name.toLowerCase().includes(custSearchQuery.toLowerCase()) ||
                c.phone.includes(custSearchQuery)
              );

              if (filtered.length === 0) {
                return (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    দুঃখিত, এই অনুসন্ধানের সাথে মিলে যাওয়া কোনো কাস্টমার পাওয়া যায়নি।
                  </div>
                );
              }

              return (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 text-[11px] font-bold">
                        <th className="p-4">কাস্টমার নাম ও বিবরণ (Details)</th>
                        <th className="p-4">ঠিকানা ও নোটস (Address)</th>
                        <th className="p-4">বাকি হিসাব (Receivables)</th>
                        <th className="p-4 text-right">কার্যক্রম (Actions)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filtered.map((cust) => (
                        <tr key={cust.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 space-y-1">
                            <span className="font-extrabold text-slate-800 text-xs block">{cust.name}</span>
                            <span className="text-[10px] text-slate-400 block font-mono">📞 {cust.phone}</span>
                            {cust.email && <span className="text-[10px] text-slate-400 block font-mono">✉️ {cust.email}</span>}
                          </td>
                          <td className="p-4 space-y-1 max-w-xs">
                            <span className="text-slate-600 block line-clamp-1">{cust.address || 'ঠিকানা দেওয়া হয়নি'}</span>
                            {cust.notes ? (
                              <span className="text-[10px] text-indigo-600 bg-indigo-50/50 px-2 py-0.5 rounded font-semibold inline-block">
                                📝 {cust.notes}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-300 italic">কোনো মন্তব্য নেই</span>
                            )}
                          </td>
                          <td className="p-4">
                            {cust.balanceDue > 0 ? (
                              <div className="space-y-1">
                                <span className="text-rose-600 font-extrabold text-xs block bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-lg w-max">
                                  ৳ {cust.balanceDue} বকেয়া
                                </span>
                                <span className="text-[9px] text-rose-400 block font-medium">⚠️ অবিলম্বে আদায়যোগ্য</span>
                              </div>
                            ) : (
                              <span className="text-emerald-600 font-bold text-[11px] block bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg w-max">
                                🟢 পরিশোধিত (No Due)
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end items-center gap-1.5">
                              <button
                                onClick={() => handleQuickUpdateDue(cust)}
                                className="bg-amber-50 hover:bg-amber-100 text-amber-700 font-black text-[10px] py-1.5 px-2.5 rounded-lg border border-amber-200 transition-colors cursor-pointer"
                                title="বাকি টাকার পরিমাণ আপডেট করুন"
                              >
                                ৳ হিসাব খাতা
                              </button>
                              <button
                                onClick={() => handleOpenEditCust(cust)}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] py-1.5 px-2.5 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                                title="কাস্টমার এডিট করুন"
                              >
                                ✏️ এডিট
                              </button>
                              <button
                                onClick={() => handleDeleteCust(cust.id)}
                                className="p-2 text-rose-500 hover:bg-rose-50 hover:text-rose-700 rounded-lg transition-colors cursor-pointer"
                                title="কাস্টমার চিরতরে মুছুন"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        </div>
      )
    )}
            </div>
          </div>
        </div>
      )}

      {/* Customer Create/Edit Modal */}
      {showCustModal && (
        <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-white border border-slate-100 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-2xl relative flex flex-col animate-scale-up">
            
            {/* Modal Header with Beautiful Gradient Background */}
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 px-6 py-5 text-white relative shrink-0">
              <button
                onClick={() => setShowCustModal(false)}
                className="absolute top-4 right-4 text-white/80 hover:text-white font-extrabold text-base p-1.5 hover:bg-white/10 rounded-full transition-all cursor-pointer"
              >
                ✕
              </button>
              
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/15 rounded-2xl backdrop-blur-md border border-white/10">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight">
                    {editingCustId ? '⚙️ কাস্টমার তথ্য সংশোধন (Edit Customer)' : '👥 নতুন কাস্টমার নিবন্ধন (Register Customer)'}
                  </h3>
                  <p className="text-[11px] text-blue-100/95 font-medium mt-0.5">
                    আপনার কাস্টমারের বিবরণ এবং বাকি খাতার হিসাব নির্ভুলভাবে নথিভুক্ত রাখুন।
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveCust} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              
              {/* Full Name Input Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                  <span>কাস্টমারের পুরো নাম <span className="text-rose-500">*</span></span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="যেমন: আবরার আহমেদ চৌধুরী"
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl py-3 pl-3 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-extrabold transition-all placeholder:text-slate-400 placeholder:font-normal"
                  />
                </div>
              </div>

              {/* Phone & Email Container */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Mobile Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-blue-600" />
                    <span>মোবাইল নম্বর <span className="text-rose-500">*</span></span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="01XXXXXXXXX"
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-mono font-extrabold transition-all"
                  />
                </div>

                {/* Email address */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span>ইমেইল এড্রেস (ঐচ্ছিক)</span>
                  </label>
                  <input
                    type="email"
                    placeholder="email@example.com"
                    value={custEmail}
                    onChange={(e) => setCustEmail(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-semibold transition-all"
                  />
                </div>
              </div>

              {/* Balance due field styled as premium ledger input */}
              <div className="bg-rose-50/40 border border-rose-100 p-4 rounded-2xl space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-extrabold text-rose-700 flex items-center gap-1.5">
                    <Wallet className="w-4 h-4 text-rose-600" />
                    <span>বাকি পরিমাণ (Initial Balance Due)</span>
                  </label>
                  <span className="text-[10px] text-rose-500 font-black uppercase tracking-wider bg-rose-100/50 px-2 py-0.5 rounded-md">বাকি খাতা</span>
                </div>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-sm font-black text-rose-600">৳</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="০.০০"
                    value={custBalanceDue || ''}
                    onChange={(e) => setCustBalanceDue(Number(e.target.value))}
                    className="w-full text-sm bg-white border border-rose-200 rounded-xl py-2.5 pl-7 pr-3 focus:outline-none focus:ring-2 focus:ring-rose-500 text-rose-700 font-extrabold transition-all"
                  />
                </div>
                <p className="text-[10px] text-slate-500 leading-normal">
                  কাস্টমারের পূর্বের কোনো বকেয়া হিসাব বা বাকি থাকলে তা এখানে এন্ট্রি করতে পারেন। এটি পরবর্তীতে যেকোনো সময় হিসাব খাতা থেকে আপডেট করা যাবে।
                </p>
              </div>

              {/* Address field */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  <span>ঠিকানা (Address)</span>
                </label>
                <input
                  type="text"
                  placeholder="যেমন: বাসা-১২, রোড-০৫, ধানমন্ডি, ঢাকা"
                  value={custAddress}
                  onChange={(e) => setCustAddress(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 transition-all font-medium"
                />
              </div>

              {/* Notes / Comments field */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>ব্যক্তিগত মন্তব্য/নোট (Customer Notes)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="যেমন: আমাদের অনেক পুরোনো বিশ্বস্ত কাস্টমার, সাধারণত প্রতি সপ্তাহের শেষে বাকি পরিশোধ করেন।"
                  value={custNotes}
                  onChange={(e) => setCustNotes(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 resize-none transition-all font-medium placeholder:italic"
                ></textarea>
              </div>

              {/* Modal Buttons with High Polish */}
              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCustModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold py-3 px-4 rounded-xl transition-all text-xs cursor-pointer text-center"
                >
                  বাতিল করুন (Cancel)
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3 px-4 rounded-xl transition-all text-xs cursor-pointer shadow-lg shadow-blue-100 flex items-center justify-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{editingCustId ? 'তথ্য আপডেট করুন' : 'নতুন কাস্টমার নিবন্ধন'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product / Service Add Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-white border border-slate-100 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-2xl relative flex flex-col animate-scale-up">
            
            {/* Modal Header with Teal/Emerald Gradient */}
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-teal-700 px-6 py-5 text-white relative shrink-0">
              <button
                onClick={() => {
                  setShowProductModal(false);
                  setNewItemName('');
                  setNewItemPrice(0);
                  setNewItemOriginalPrice(0);
                  setNewItemDesc('');
                  setNewItemImage('');
                }}
                className="absolute top-4 right-4 text-white/80 hover:text-white font-extrabold text-base p-1.5 hover:bg-white/10 rounded-full transition-all cursor-pointer"
              >
                ✕
              </button>
              
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/15 rounded-2xl backdrop-blur-md border border-white/10">
                  <PlusCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight">
                    {business.type === 'shop' ? '🛒 নতুন পণ্য যোগ করুন' : '🛠️ নতুন জরুরি সেবা যুক্ত করুন'}
                  </h3>
                  <p className="text-[11px] text-teal-100/95 font-medium mt-0.5">
                    {business.type === 'shop' 
                      ? 'ক্রেতাদের জন্য আপনার কাঙ্ক্ষিত পণ্যটি সুন্দর ছবি এবং আকর্ষণীয় মূল্য দিয়ে সাজিয়ে তুলুন।' 
                      : 'গ্রাহকদের জন্য আপনার সেবার মূল্যতালিকা ও বিবরণ যুক্ত করুন।'}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <form 
              onSubmit={(e) => { 
                e.preventDefault(); 
                handleAddItem(); 
              }} 
              className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5"
            >
              
              {/* Product / Service Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{business.type === 'shop' ? 'পণ্যের নাম' : 'সেবার নাম (Service Title)'} <span className="text-rose-500">*</span></span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={business.type === 'shop' ? "যেমন: মিনিকেট চাল (১ কেজি), প্রিমিয়াম তরল দুধ" : "যেমন: এসি লিক মেরামত, কম্পিউটার হার্ডওয়্যার ফিটিং"}
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 font-extrabold transition-all"
                />
              </div>

              {/* Pricing Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Sale Price / Charge */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{business.type === 'shop' ? 'বর্তমান বিক্রয় মূল্য (৳)' : 'সেবা চার্জ/ফি (৳)'} <span className="text-rose-500">*</span></span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="০.০০"
                    value={newItemPrice || ''}
                    onChange={(e) => setNewItemPrice(Number(e.target.value))}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 font-extrabold transition-all"
                  />
                </div>

                {/* Original Price (Optional) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                    <span className="text-slate-400 font-mono text-[10px]">%</span>
                    <span>আগের মূল্য/ডিসকাউন্ট ছাড়া (৳)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="যেমন: ১৫০ (ঐচ্ছিক)"
                    value={newItemOriginalPrice || ''}
                    onChange={(e) => setNewItemOriginalPrice(Number(e.target.value))}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 font-extrabold transition-all"
                  />
                </div>
              </div>

              {/* Product / Service Image Upload & Camera Capture */}
              <div className="space-y-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
                <PhotoCaptureUpload
                  currentImage={newItemImage}
                  onImageChange={setNewItemImage}
                  label={business.type === 'shop' ? "পণ্যের ছবি ও ক্যামেরা (Product Photo & Camera)" : "সেবার ছবি ও ক্যামেরা (Service Photo & Camera)"}
                  sublabel="পণ্যের সরাসরি ছবি তুলতে ক্যামেরা ওপেন করুন অথবা মেমোরি থেকে আপলোড করুন"
                  shape="rectangle"
                  aspectRatio="4:3"
                  placeholderText="পণ্য/সেবা"
                />

                {/* Ready-made Bangladesh Image Presets inside modal */}
                <div className="space-y-1.5 pt-2 border-t border-slate-200">
                  <label className="text-[11px] font-extrabold text-slate-600 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>অথবা রেডিমেড ছবি নির্বাচন করুন:</span>
                    </span>
                    {newItemImage && (
                      <button
                        type="button"
                        onClick={() => setNewItemImage('')}
                        className="text-[10px] text-rose-500 hover:underline font-bold cursor-pointer"
                      >
                        ছবি মুছুন
                      </button>
                    )}
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1">
                    {BANGLADESH_PRODUCT_IMAGE_PRESETS.map((preset, idx) => {
                      const isSelected = newItemImage === preset.url;
                      return (
                        <button
                          key={`modal-preset-${idx}`}
                          type="button"
                          onClick={() => setNewItemImage(preset.url)}
                          className={`group relative rounded-xl overflow-hidden border-2 transition-all cursor-pointer aspect-[4/3] ${
                            isSelected
                              ? 'border-emerald-600 ring-2 ring-emerald-500/30 scale-95 shadow-sm'
                              : 'border-slate-200 hover:border-emerald-400 opacity-80 hover:opacity-100'
                          }`}
                        >
                          <img
                            src={preset.url}
                            alt={preset.label}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-black/65 py-0.5 px-1 text-center">
                            <span className="text-[9px] font-black text-white block truncate">{preset.label}</span>
                          </div>
                          {isSelected && (
                            <div className="absolute top-1 right-1 bg-emerald-600 text-white rounded-full p-0.5 shadow">
                              <CheckCircle className="w-3 h-3" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Description with AI Generator */}
              <div className="space-y-2 bg-emerald-50/40 p-4 rounded-2xl border border-emerald-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-600" />
                    <span>সংক্ষিপ্ত বিবরণ (Item Description)</span>
                    {aiDescGeneratedSuccess && (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                        <CheckCircle className="w-3 h-3 text-emerald-600" />
                        এআই তৈরি করেছে!
                      </span>
                    )}
                  </label>
                  <button
                    type="button"
                    onClick={() => handleGenerateAiProductDesc()}
                    disabled={isGeneratingItemDesc}
                    className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-[11px] font-black px-3.5 py-1.5 rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer shrink-0"
                  >
                    {isGeneratingItemDesc ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>এআই লিখছে...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3" />
                        <span>✨ এআই দিয়ে বিবরণ লিখুন (AI Auto Writer)</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Smart Feature Chips in Modal */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 block">
                    বৈশিষ্ট্য সিলেক্ট করুন (এআই এগুলো যুক্ত করে লিখবে):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {AI_PRODUCT_FEATURE_CHIPS.map((chip, idx) => {
                      const isSelected = selectedFeatureChips.includes(chip);
                      return (
                        <button
                          key={`modal-chip-${idx}`}
                          type="button"
                          onClick={() => toggleFeatureChip(chip)}
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50'
                          }`}
                        >
                          {chip}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <textarea
                  rows={3}
                  placeholder={business.type === 'shop' ? "যেমন: এটি একটি প্রিমিয়াম গ্রেডের বাসমতি চাল। চালের দানা অত্যন্ত লম্বা ও সুবাসিত।" : "যেমন: দক্ষ মেকানিক দ্বারা সম্পূর্ণ যত্ন সহকারে সার্ভিসিং করা হয়। ১ সপ্তাহের গ্যারান্টি।"}
                  value={newItemDesc}
                  onChange={(e) => setNewItemDesc(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 resize-none transition-all font-medium"
                ></textarea>
              </div>

              {/* Wholesale Pricing for Shop Products in Modal */}
              {business.type === 'shop' && (
                <WholesalePricingForm
                  retailPrice={newItemPrice}
                  isWholesaleAvailable={newItemWholesaleAvailable}
                  onToggleWholesale={setNewItemWholesaleAvailable}
                  wholesalePrice={newItemWholesalePrice}
                  onChangeWholesalePrice={setNewItemWholesalePrice}
                  wholesaleMinQty={newItemWholesaleMinQty}
                  onChangeWholesaleMinQty={setNewItemWholesaleMinQty}
                  wholesaleUnit={newItemWholesaleUnit}
                  onChangeWholesaleUnit={setNewItemWholesaleUnit}
                  wholesaleTiers={newItemWholesaleTiers}
                  onChangeWholesaleTiers={setNewItemWholesaleTiers}
                  wholesaleStock={newItemWholesaleStock}
                  onChangeWholesaleStock={setNewItemWholesaleStock}
                  themeColor="emerald"
                />
              )}

              {/* Actions */}
              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowProductModal(false);
                    setNewItemName('');
                    setNewItemPrice(0);
                    setNewItemOriginalPrice(0);
                    setNewItemDesc('');
                    setNewItemImage('');
                  }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold py-3 px-4 rounded-xl transition-all text-xs cursor-pointer text-center"
                >
                  বাতিল করুন (Cancel)
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 px-4 rounded-xl transition-all text-xs cursor-pointer shadow-lg shadow-emerald-100 flex items-center justify-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>তালিকায় যোগ করুন (Add to List)</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Edit Product / Service Modal */}
      {showEditItemModal && business && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden animate-scale-up my-auto">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center font-bold text-white shadow-xs">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">
                    {editingItemType === 'product' ? 'পণ্য এডিট করুন (Edit Product)' : 'সেবা এডিট করুন (Edit Service)'}
                  </h4>
                  <p className="text-[10px] text-blue-100 font-medium">
                    সকল তথ্য পরিবর্তন ও এআই দিয়ে বিবরণ হালনাগাদ করুন
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditItemModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs font-bold transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Form Content */}
            <form 
              onSubmit={handleSaveEditedItem} 
              className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1"
            >
              {/* Item Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
                  <span>{editingItemType === 'product' ? 'পণ্যের নাম' : 'সেবার নাম (Service Title)'} <span className="text-rose-500">*</span></span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={editingItemType === 'product' ? "যেমন: মিনিকেট চাল (১ কেজি), প্রিমিয়াম তরল দুধ" : "যেমন: এসি লিক মেরামত, কম্পিউটার হার্ডওয়্যার ফিটিং"}
                  value={editItemName}
                  onChange={(e) => setEditItemName(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-extrabold transition-all"
                />
              </div>

              {/* Pricing Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Sale Price / Charge */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{editingItemType === 'product' ? 'বিক্রয় মূল্য (৳)' : 'সেবা চার্জ/ফি (৳)'} <span className="text-rose-500">*</span></span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="০.০০"
                    value={editItemPrice || ''}
                    onChange={(e) => setEditItemPrice(Number(e.target.value))}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-extrabold transition-all"
                  />
                </div>

                {/* Original Price (Optional) */}
                {editingItemType === 'product' ? (
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="text-slate-400 font-mono text-[10px]">%</span>
                        <span>আগের নিয়মিত মূল্য (৳ - ঐচ্ছিক)</span>
                      </span>
                      {editItemOriginalPrice > editItemPrice && editItemPrice > 0 && (
                        <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                          {Math.round(((editItemOriginalPrice - editItemPrice) / editItemOriginalPrice) * 100)}% ছাড়!
                        </span>
                      )}
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="ছাড় দেখাতে নিয়মিত মূল্য লিখুন"
                      value={editItemOriginalPrice || ''}
                      onChange={(e) => setEditItemOriginalPrice(Number(e.target.value))}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-bold transition-all"
                    />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 block">স্ট্যাটাস (Status)</label>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      <span>অনলাইন বুকিংয়ের জন্য সক্রিয়</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Stock Status Switch */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-4">
                <div>
                  <h5 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-slate-600" />
                    <span>স্টক স্ট্যাটাস (Availability Status)</span>
                  </h5>
                  <p className="text-[10px] text-slate-500">
                    স্টক শেষ হলে কাস্টমাররা এটি অর্ডার করতে পারবে না।
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditItemAvailable(!editItemAvailable)}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs flex items-center gap-1.5 ${
                    editItemAvailable 
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                      : 'bg-rose-600 hover:bg-rose-700 text-white'
                  }`}
                >
                  {editItemAvailable ? '🟢 স্টকে আছে (In Stock)' : '🔴 স্টক আউট (Out of Stock)'}
                </button>
              </div>

              {/* Product Image Section */}
              {editingItemType === 'product' && (
                <div className="space-y-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <Image className="w-3.5 h-3.5 text-blue-600" />
                      <span>পণ্যের ছবি (Product Photo)</span>
                    </label>
                    {editItemImage && (
                      <button
                        type="button"
                        onClick={() => setEditItemImage('')}
                        className="text-[10px] font-bold text-rose-600 hover:underline cursor-pointer"
                      >
                        ছবি সরান (Remove)
                      </button>
                    )}
                  </div>

                  {/* Photo Preview & Capture Uploader */}
                  <PhotoCaptureUpload
                    currentImage={editItemImage}
                    onImageChange={setEditItemImage}
                    label="পণ্যের ছবি ও ক্যামেরা (Product Photo & Camera)"
                    sublabel="পণ্যের সরাসরি ছবি তুলতে ক্যামেরা ওপেন করুন অথবা মেমোরি থেকে আপলোড করুন"
                    shape="rectangle"
                    aspectRatio="4:3"
                    placeholderText="পণ্য ছবি"
                  />

                  {/* Bangladeshi Product Presets Gallery */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-200/60">
                    <span className="text-[11px] font-bold text-slate-600 block">
                      বা রেডিমেড ছবি সিলেক্ট করুন (One-Click Preset Photos):
                    </span>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {BANGLADESH_PRODUCT_IMAGE_PRESETS.map((preset, idx) => (
                        <button
                          key={`edit-preset-${idx}`}
                          type="button"
                          onClick={() => setEditItemImage(preset.url)}
                          className={`group relative rounded-xl overflow-hidden border p-1 bg-white hover:border-blue-500 transition-all cursor-pointer text-left flex flex-col items-center gap-1 ${
                            editItemImage === preset.url ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50/30' : 'border-slate-200'
                          }`}
                        >
                          <div className="w-full aspect-square rounded-lg overflow-hidden bg-slate-100">
                            <img 
                              src={preset.url} 
                              alt={preset.label} 
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <span className="text-[9px] font-black text-slate-700 truncate w-full text-center">
                            {preset.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Description with AI Generator */}
              <div className="space-y-2 bg-blue-50/40 p-4 rounded-2xl border border-blue-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>সংক্ষিপ্ত বিবরণ (Item Description)</span>
                    {editAiDescSuccess && (
                      <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                        <CheckCircle className="w-3 h-3 text-blue-600" />
                        এআই তৈরি করেছে!
                      </span>
                    )}
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateAiEditDesc}
                    disabled={isGeneratingEditDesc}
                    className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-[11px] font-black px-3.5 py-1.5 rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer shrink-0"
                  >
                    {isGeneratingEditDesc ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>এআই লিখছে...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3" />
                        <span>✨ এআই দিয়ে বিবরণ লিখুন (AI Auto Writer)</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Smart Feature Chips in Edit Modal */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 block">
                    বৈশিষ্ট্য সিলেক্ট করুন (এআই এগুলো যুক্ত করে লিখবে):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {AI_PRODUCT_FEATURE_CHIPS.map((chip, idx) => {
                      const isSelected = editSelectedChips.includes(chip);
                      return (
                        <button
                          key={`edit-chip-${idx}`}
                          type="button"
                          onClick={() => toggleEditFeatureChip(chip)}
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50/50'
                          }`}
                        >
                          {chip}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <textarea
                  rows={3}
                  placeholder={editingItemType === 'product' ? "যেমন: এটি একটি প্রিমিয়াম গ্রেডের বাসমতি চাল। চালের দানা অত্যন্ত লম্বা ও সুবাসিত।" : "যেমন: দক্ষ মেকানিক দ্বারা সম্পূর্ণ যত্ন সহকারে সার্ভিসিং করা হয়। ১ সপ্তাহের গ্যারান্টি।"}
                  value={editItemDesc}
                  onChange={(e) => setEditItemDesc(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 resize-none transition-all font-medium"
                ></textarea>
              </div>

              {/* Wholesale Pricing for Edited Product */}
              {editingItemType === 'product' && (
                <WholesalePricingForm
                  retailPrice={editItemPrice}
                  isWholesaleAvailable={editItemWholesaleAvailable}
                  onToggleWholesale={setEditItemWholesaleAvailable}
                  wholesalePrice={editItemWholesalePrice}
                  onChangeWholesalePrice={setEditItemWholesalePrice}
                  wholesaleMinQty={editItemWholesaleMinQty}
                  onChangeWholesaleMinQty={setEditItemWholesaleMinQty}
                  wholesaleUnit={editItemWholesaleUnit}
                  onChangeWholesaleUnit={setEditItemWholesaleUnit}
                  wholesaleTiers={editItemWholesaleTiers}
                  onChangeWholesaleTiers={setEditItemWholesaleTiers}
                  wholesaleStock={editItemWholesaleStock}
                  onChangeWholesaleStock={setEditItemWholesaleStock}
                  themeColor="blue"
                />
              )}

              {/* Actions */}
              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditItemModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold py-3 px-4 rounded-xl transition-all text-xs cursor-pointer text-center"
                >
                  বাতিল (Cancel)
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold py-3 px-4 rounded-xl transition-all text-xs cursor-pointer shadow-lg shadow-blue-100 flex items-center justify-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>পরিবর্তন সংরক্ষণ করুন (Save Changes)</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 6. Payment Gateway checkout simulator */}
      {showPaymentModal && selectedPlanForPayment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl border border-slate-100 animate-scale-up">
            {/* Gateway Brand selector */}
            <div className="p-4 text-white text-center flex flex-col items-center justify-center space-y-1 bg-gradient-to-r from-pink-500 via-rose-500 to-red-500">
              <CreditCard className="w-8 h-8 animate-pulse mb-1" />
              <h4 className="text-xs font-bold uppercase">নিরাপদ মার্চেন্ট পেমেন্ট গেটওয়ে</h4>
              <p className="text-[10px] opacity-95">প্যাকেজ: {selectedPlanForPayment.name}</p>
              <p className="text-sm font-black">টাকার পরিমাণ: ৳ {selectedPlanForPayment.price}</p>
            </div>

            <div className="p-4 space-y-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('bkash')}
                  className={`flex-1 py-2 px-3 border rounded-lg text-xs font-black cursor-pointer text-center ${paymentMethod === 'bkash' ? 'bg-pink-50 border-pink-500 text-pink-600 ring-1 ring-pink-500' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
                >
                  bKash (বিকাশ)
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('nagad')}
                  className={`flex-1 py-2 px-3 border rounded-lg text-xs font-black cursor-pointer text-center ${paymentMethod === 'nagad' ? 'bg-orange-50 border-orange-500 text-orange-600 ring-1 ring-orange-500' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
                >
                  Nagad (নগদ)
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('rocket')}
                  className={`flex-1 py-2 px-3 border rounded-lg text-xs font-black cursor-pointer text-center ${paymentMethod === 'rocket' ? 'bg-purple-50 border-purple-500 text-purple-600 ring-1 ring-purple-500' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
                >
                  Rocket (রকেট)
                </button>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 block">আপনার ওয়ালেট নম্বর দিন</label>
                  <input
                    type="text"
                    required
                    placeholder="01XXXXXXXXX"
                    value={paymentNumber}
                    onChange={(e) => setPaymentNumber(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded p-2 focus:outline-none font-mono text-center"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 block">৪/৫ সংখ্যার পিন কোড দিন (Pin)</label>
                  <input
                    type="password"
                    required
                    maxLength={5}
                    placeholder="••••"
                    value={paymentPin}
                    onChange={(e) => setPaymentPin(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded p-2 focus:outline-none font-mono text-center"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleConfirmSubscriptionPayment}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 px-4 rounded-xl text-xs cursor-pointer"
                >
                  ✓ পেমেন্ট কনফার্ম করুন
                </button>
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2 px-4 rounded-xl text-xs cursor-pointer"
                >
                  বাতিল
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Merchant Live Website Preview Modal */}
      {showWebsitePreviewModal && bizWebsiteUrl && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 text-left animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center gap-3 shrink-0">
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="p-2 bg-indigo-600 text-white rounded-xl text-sm">🌐</span>
                <div className="truncate">
                  <h3 className="text-sm font-black text-white truncate">
                    {bizName} - ওয়েবসাইট প্রিভিউ লাইভ ভিউ
                  </h3>
                  <a 
                    href={bizWebsiteUrl.startsWith('http') ? bizWebsiteUrl : `https://${bizWebsiteUrl}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-[10px] text-indigo-300 font-mono hover:underline truncate block"
                  >
                    {bizWebsiteUrl}
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={bizWebsiteUrl.startsWith('http') ? bizWebsiteUrl : `https://${bizWebsiteUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 shadow-sm"
                >
                  <span>নতুন ট্যাবে খুলুন ↗</span>
                </a>
                <button
                  onClick={() => setShowWebsitePreviewModal(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm font-bold transition-all cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Embedded Iframe Preview */}
            <div className="flex-1 bg-slate-100 relative overflow-hidden">
              <iframe
                src={bizWebsiteUrl.startsWith('http') ? bizWebsiteUrl : `https://${bizWebsiteUrl}`}
                title="Website Preview"
                className="w-full h-full border-0"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              />
              <div className="absolute bottom-2 right-2 bg-slate-900/80 text-white text-[9px] font-mono px-2.5 py-1 rounded-full pointer-events-none backdrop-blur-sm">
                Interactive Live Preview Mode
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Facebook Auto-Import Modal */}
      {showFbImportModal && (
        <FacebookImportModal
          isOpen={showFbImportModal}
          onClose={() => setShowFbImportModal(false)}
          targetType={fbImportTarget}
          shopCategory={business?.category}
          onImportProducts={handleImportExtractedProducts}
          onImportShopDetails={handleImportShopDetails}
        />
      )}

      {/* Facebook Viral Share Modal */}
      {showFbShareModal && fbShareItem && (
        <FacebookShareModal
          isOpen={showFbShareModal}
          onClose={() => {
            setShowFbShareModal(false);
            setFbShareItem(null);
          }}
          productTitle={fbShareItem.title}
          productPrice={fbShareItem.price}
          originalPrice={fbShareItem.originalPrice}
          productImage={fbShareItem.image}
          shopName={business?.name || 'RestBazar Verified Shop'}
          shopPhone={business?.phone || currentUser.phone}
          shopAddress={business?.address}
        />
      )}
    </div>
  );
}
