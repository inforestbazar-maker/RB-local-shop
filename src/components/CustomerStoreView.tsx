import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingBag, Search, Star, Phone, MessageSquare, Plus, Minus, Trash2, Heart, X, 
  Filter, Sparkles, Clock, Check, CheckCircle2, ArrowRight, MapPin, User, 
  CreditCard, Wallet, Languages, Moon, Sun, RefreshCw, SlidersHorizontal, 
  ThumbsUp, ChevronRight, Info, Calendar, Bell, Percent, Truck, Lock, ShieldCheck, 
  MessageCircle, HelpCircle, FileText, Tag, ArrowLeftRight, Share2
} from 'lucide-react';
import { Business, Product, ServiceItem, Booking, Review, Offer, User as UserType } from '../types';
import { getEffectiveProductPrice } from '../utils/wholesaleUtils';
import { FacebookShareModal } from './FacebookIntegrationTools';
import { BangladeshiPaymentGatewayModal, PaymentGatewayDetails } from './BangladeshiPaymentGatewayModal';

interface CustomerStoreViewProps {
  currentUser: UserType;
  business: Business;
  cart: { [productId: string]: { product: Product; quantity: number } };
  addToCart: (product: Product) => void;
  updateCartQty: (productId: string, delta: number) => void;
  setCart: React.Dispatch<React.SetStateAction<{ [productId: string]: { product: Product; quantity: number } }>>;
  onBack: () => void;
  onRefreshDb: () => void;
  triggerChatWithBusiness: (biz: Business) => void;
  onSwitchRole?: (role: 'user' | 'merchant' | 'admin') => Promise<void>;
  language?: 'bn' | 'en';
}

// Translations dictionary for Bangla & English (Language Toggle)
const T = {
  bn: {
    back: 'ফিরে যান',
    searchPlaceholder: 'পণ্য বা সার্ভিস খুঁজুন...',
    featured: '🔥 স্পেশাল অফার ও ফিচার্ড আইটেম',
    categories: 'ক্যাটাগরি সমূহ',
    all: 'সব পণ্য',
    newArrivals: '✨ নতুন কালেকশন (New Arrivals)',
    bestSellers: '🏆 সেরা বিক্রিত পণ্য (Best Sellers)',
    flashSale: '⚡ ফ্ল্যাশ সেল (সীমিত সময় অফার!)',
    timeLeft: 'সময় বাকি:',
    addToCart: 'কার্ট-এ যোগ করুন',
    inStock: 'স্টকে আছে',
    outOfStock: 'স্টক শেষ',
    onlyLeft: 'মাত্র অবশিষ্ট আছে',
    buyNow: '📦 সরাসরি অর্ডার করুন (Buy Now)',
    whatsappOrder: '📱 হোয়াটসঅ্যাপ অর্ডার',
    variants: 'প্যাক সাইজ / ওজন নির্বাচন করুন:',
    relatedProducts: 'সংশ্লিষ্ট অন্যান্য পণ্য (Related)',
    compare: 'তুলনা করুন',
    cartTitle: '🛍️ আপনার শপিং কার্ট',
    checkout: 'অর্ডার নিশ্চিত করুন (Checkout)',
    address: 'ডেলিভারি ঠিকানা লিখুন:',
    payment: 'পেমেন্ট মাধ্যম:',
    cod: 'ক্যাশ অন ডেলিভারি (COD)',
    mfs: 'মোবাইল ব্যাংকিং (বিকাশ/নগদ)',
    card: 'কার্ড পেমেন্ট (ভিসা/মাস্টারকার্ড)',
    placeOrder: 'অর্ডার প্লেস করুন (৳ ',
    couponCode: 'কুপন কোড লিখুন',
    apply: 'প্রয়োগ করুন',
    discount: 'ডিসকাউন্ট ছাড়',
    deliveryCharge: 'ডেলিভারি চার্জ',
    total: 'সর্বমোট মূল্য',
    wishlist: 'পছন্দের তালিকা (Wishlist)',
    compareTitle: '🔄 পণ্য তুলনা (Compare Products)',
    noCompare: 'তুলনা করার জন্য অন্তত ২টি পণ্য যুক্ত করুন।',
    compareAdd: 'তুলনায় যোগ করুন',
    reviews: 'গ্রাহক রেটিং ও রিভিউ',
    writeReview: 'রিভিউ লিখুন',
    rating: 'রেটিং দিন:',
    comment: 'আপনার মূল্যবান মন্তব্য লিখুন...',
    submitReview: 'রিভিউ সাবমিট করুন',
    support: 'সাহায্য ও সাপোর্ট',
    faq: 'সচরাচর জিজ্ঞাসিত প্রশ্ন (FAQ)',
    returnPolicy: 'রিটার্ন ও রিফান্ড পলিসি',
    deliveryCheck: 'ডেলিভারি এরিয়া চেক করুন',
    deliveryCheckPlace: 'আপনার জেলা/এরিয়ার নাম লিখুন (যেমন: ধানমন্ডি)',
    deliverySuccess: '✅ অভিনন্দন! আমাদের ডেলিভারি টিম এই এরিয়াতে হোম ডেলিভারি প্রদান করে।',
    deliveryFail: '❌ দুঃখিত, এই এলাকায় আমাদের সরাসরি হোম ডেলিভারি এখনও চালু হয়নি।',
    recentlyViewed: 'সবশেষ দেখেছেন',
    specs: 'পণ্যের বিবরণ ও পুষ্টিমান:',
    selectVariant: 'দয়া করে একটি ভ্যারিয়েন্ট সিলেক্ট করুন',
    notifications: 'স্টোর নোটিফিকেশন',
    theme: 'ডার্ক মোড',
    chat: 'লাইভ চ্যাট',
    contact: 'যোগাযোগ',
    orderHistory: 'অর্ডার হিস্টোরি ট্র্যাক',
    orderTrackTitle: '📦 লাইভ অর্ডার ট্র্যাকিং',
    orderNotFound: 'কোনো চলমান অর্ডার পাওয়া যায়নি।'
  },
  en: {
    back: 'Back',
    searchPlaceholder: 'Search products or services...',
    featured: '🔥 Featured & Special Offers',
    categories: 'Categories',
    all: 'All Products',
    newArrivals: '✨ New Arrivals',
    bestSellers: '🏆 Best Selling Products',
    flashSale: '⚡ Flash Sale (Limited Time Offer!)',
    timeLeft: 'Time Left:',
    addToCart: 'Add to Cart',
    inStock: 'In Stock',
    outOfStock: 'Out of Stock',
    onlyLeft: 'Only left',
    buyNow: '📦 Direct Buy Now',
    whatsappOrder: '📱 WhatsApp Order',
    variants: 'Select Pack Size / Weight:',
    relatedProducts: 'Related Products',
    compare: 'Compare',
    cartTitle: '🛍️ Your Shopping Cart',
    checkout: 'Checkout / Confirm Order',
    address: 'Delivery Address:',
    payment: 'Payment Method:',
    cod: 'Cash on Delivery (COD)',
    mfs: 'Mobile Banking (bKash/Nagad)',
    card: 'Card Payment (Visa/Mastercard)',
    placeOrder: 'Place Order (৳ ',
    couponCode: 'Enter Coupon Code',
    apply: 'Apply',
    discount: 'Discount Discount',
    deliveryCharge: 'Delivery Charge',
    total: 'Total Price',
    wishlist: 'Wishlist',
    compareTitle: '🔄 Product Comparison',
    noCompare: 'Add at least 2 products to compare.',
    compareAdd: 'Add to Compare',
    reviews: 'Reviews & Ratings',
    writeReview: 'Write a Review',
    rating: 'Give Rating:',
    comment: 'Write your review comments...',
    submitReview: 'Submit Review',
    support: 'Help & Support',
    faq: 'Frequently Asked Questions (FAQ)',
    returnPolicy: 'Return & Refund Policy',
    deliveryCheck: 'Check Delivery Area',
    deliveryCheckPlace: 'Enter your area (e.g. Dhanmondi)',
    deliverySuccess: '✅ Congratulations! We deliver to this area.',
    deliveryFail: '❌ Sorry, home delivery is not yet active in this area.',
    recentlyViewed: 'Recently Viewed',
    specs: 'Specifications & Quality:',
    selectVariant: 'Please select a variant',
    notifications: 'Store Notifications',
    theme: 'Dark Mode',
    chat: 'Live Chat',
    contact: 'Contact Info',
    orderHistory: 'Track Orders',
    orderTrackTitle: '📦 Live Order Tracking',
    orderNotFound: 'No active orders found.'
  }
};

const getProductCategory = (p: Product) => {
  const name = p.name.toLowerCase();
  if (name.includes('চাল') || name.includes('rice')) {
    return 'Rice / চাল';
  }
  if (name.includes('তেল') || name.includes('oil')) {
    return 'Oil / তেল';
  }
  if (name.includes('দুধ') || name.includes('milk') || name.includes('ঘি') || name.includes('butter') || name.includes('doi') || name.includes('curd')) {
    return 'Dairy / দুগ্ধজাত';
  }
  if (name.includes('ডাল') || name.includes('lentil') || name.includes('pulse')) {
    return 'Pulse / ডাল';
  }
  if (name.includes('মশলা') || name.includes('spices') || name.includes('হলুদ') || name.includes('মরিচ') || name.includes('জিরা') || name.includes('লবণ') || name.includes('salt') || name.includes('sugar') || name.includes('চিনি')) {
    return 'Spices / মসলা ও প্রয়োজনীয়';
  }
  return 'Grocery / অন্যান্য মুদি';
};

export default function CustomerStoreView({
  currentUser,
  business,
  cart,
  addToCart: propAddToCart,
  updateCartQty,
  setCart,
  onBack,
  onRefreshDb,
  triggerChatWithBusiness,
  onSwitchRole,
  language
}: CustomerStoreViewProps) {
  
  const isWholesaleShop = business.category === 'wholesale' || business.isWholesale === true;
  const isVerifiedMerchantOrAdmin = currentUser?.role === 'admin' || (currentUser?.role === 'merchant' && currentUser?.isMerchantVerified === true);
  const isAccessDeniedForWholesale = isWholesaleShop && !isVerifiedMerchantOrAdmin;

  // Custom States
  const [lang, setLang] = useState<'bn' | 'en'>(() => {
    return language || (localStorage.getItem('rb_language') as 'bn' | 'en') || 'bn';
  });

  useEffect(() => {
    if (language) {
      setLang(language);
    }
  }, [language]);

  const addToCart = (p: Product) => {
    if (isAccessDeniedForWholesale) {
      if (currentUser?.role === 'merchant') {
        alert(lang === 'bn'
          ? 'দুঃখিত, আপনার মার্চেন্ট অ্যাকাউন্টটি এখনও ভেরিফাইড নয়! পাইকারি পণ্য কিনতে অ্যাডমিন কর্তৃক ট্রেড লাইসেন্স ভেরিফিকেশন সম্পন্ন হওয়া আবশ্যক।'
          : 'Sorry, your Merchant account is not verified yet. Active Trade License verification is required by Admin for wholesale purchases.');
      } else {
        alert(lang === 'bn' 
          ? 'দুঃখিত, এটি একটি পাইকারি দোকান! এখান থেকে পণ্য ক্রয় করতে দয়া করে আপনার অ্যাকাউন্টটি "মার্চেন্ট" (খুচরা বিক্রেতা) রোলে রূপান্তর করুন এবং ট্রেড লাইসেন্স সাবমিট করুন।' 
          : 'Sorry, this is a wholesale-only shop. To purchase, please upgrade to Merchant and submit your Business Trade License for verification.');
      }
      return;
    }
    propAddToCart(p);
  };

  // Custom States
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('store_dark_mode') === 'true';
  });
  const [search, setSearch] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<number>(5000);
  const [sortOption, setSortOption] = useState<'lowToHigh' | 'highToLow' | 'popular' | 'newest'>('popular');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Popups & Sidebar Panel Drawers
  const [activeTab, setActiveTab] = useState<'shop' | 'wishlist' | 'track' | 'account' | 'support'>('shop');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [wishlist, setWishlist] = useState<string[]>(() => {
    return JSON.parse(localStorage.getItem(`rb_wishlist_${business.id}`) || '[]');
  });
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showWebsiteViewModal, setShowWebsiteViewModal] = useState(false);
  const [catalogViewMode, setCatalogViewMode] = useState<'both' | 'website' | 'app'>('both');
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  
  // Checkout & Coupon Info
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [address, setAddress] = useState(currentUser.location?.address || '');
  const [notes, setNotes] = useState('');
  const [checkoutPayment, setCheckoutPayment] = useState<'cod' | 'bkash' | 'nagad' | 'rocket'>('cod');
  const [couponCodeText, setCouponCodeText] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [showStorePaymentGateway, setShowStorePaymentGateway] = useState(false);
  
  // Custom MFS Payment States
  const [mfsStep, setMfsStep] = useState<'phone' | 'otp' | 'pin' | 'done'>('phone');
  const [mfsPhone, setMfsPhone] = useState(currentUser.phone);
  const [mfsOtp, setMfsOtp] = useState('');
  const [mfsPin, setMfsPin] = useState('');

  // Delivery radius district checker
  const [deliveryAreaQuery, setDeliveryAreaQuery] = useState('');
  const [deliveryCheckResult, setDeliveryCheckResult] = useState<'yes' | 'no' | null>(null);

  // Trade license inputs
  const [tradeLicenseInput, setTradeLicenseInput] = useState(currentUser?.tradeLicenseNo || '');
  const [tradeLicenseImgInput, setTradeLicenseImgInput] = useState(currentUser?.tradeLicenseImage || '');
  const [isSubmittingLicense, setIsSubmittingLicense] = useState(false);

  // Facebook Viral Share Modal State
  const [showFbShareModal, setShowFbShareModal] = useState(false);
  const [fbShareItem, setFbShareItem] = useState<{ title: string; price: number; originalPrice?: number; image?: string } | null>(null);

  const handleSubmitTradeLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      alert(lang === 'bn' ? 'দয়া করে প্রথমে লগইন করুন।' : 'Please login first.');
      return;
    }
    if (!tradeLicenseInput.trim()) {
      alert(lang === 'bn' ? 'দয়া করে ট্রেড লাইসেন্স নম্বর প্রদান করুন।' : 'Please enter your trade license number.');
      return;
    }
    setIsSubmittingLicense(true);
    try {
      const response = await fetch(`/api/users/${currentUser.phone}/submit-trade-license`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tradeLicenseNo: tradeLicenseInput.trim(),
          tradeLicenseImage: tradeLicenseImgInput.trim() || 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&q=80&w=300'
        })
      });
      if (response.ok) {
        alert(lang === 'bn' 
          ? 'আপনার ট্রেড লাইসেন্স আবেদন সফলভাবে জমা দেওয়া হয়েছে! অ্যাডমিন ভেরিফিকেশনের পর আপনি পাইকারি কেনাকাটা করতে পারবেন।' 
          : 'Trade license submitted successfully! You will be able to purchase after admin verification.');
        if (onRefreshDb) {
          await onRefreshDb();
        }
      } else {
        const err = await response.json();
        alert(err.error || 'আবেদন জমা দিতে ব্যর্থ হয়েছে!');
      }
    } catch (e) {
      console.error(e);
      alert('সিস্টেমে সমস্যা হয়েছে, দয়া করে আবার চেষ্টা করুন।');
    } finally {
      setIsSubmittingLicense(false);
    }
  };

  // Live order tracker based on real DB bookings
  const [liveOrders, setLiveOrders] = useState<Booking[]>([]);

  // Flash Sale Timer countdown (ticks down to 8 hours from start)
  const [flashSaleSeconds, setFlashSaleSeconds] = useState(28800);

  // Review states
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  // Variant selection for details modal
  const [selectedVariant, setSelectedVariant] = useState<string>('1kg');

  // Multi-image selection index
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  // Search Suggestions State
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Static FAQ List
  const FAQS = [
    { q: 'অর্ডার করার কতক্ষণ পর ডেলিভারি পাওয়া যাবে?', a: 'সাধারণত আমাদের স্ট্যান্ডার্ড ডেলিভারি ১ থেকে ৩ ঘণ্টার মধ্যে এবং এক্সপ্রেস ডেলিভারি মাত্র ৩০-৪৫ মিনিটে সম্পন্ন হয়।' },
    { q: 'পণ্য পছন্দ না হলে কি রিটার্ন করা সম্ভব?', a: 'হ্যাঁ, ডেলিভারি পাওয়ার সময় পণ্য চেক করে ত্রুটি থাকলে সরাসরি ডেলিভারি ম্যানের কাছে ফেরত দিতে পারবেন।' },
    { q: 'বিকাশ পেমেন্টে অতিরিক্ত চার্জ কাটা হবে কি?', a: 'না, বিকাশ বা নগদ মোবাইল ব্যাংকিং পেমেন্টে কাস্টমারের জন্য কোনো অতিরিক্ত সেন্ড-মানি বা ট্রানজেকশন চার্জ কাটা হবে না।' },
    { q: 'হোম ডেলিভারি চার্জ কত?', a: `এই দোকানের জন্য নির্ধারিত ডেলিভারি চার্জ ৳${business.deliveryCharge || 0}।` }
  ];

  // Sync dark mode to DOM & local storage
  useEffect(() => {
    localStorage.setItem('store_dark_mode', String(darkMode));
  }, [darkMode]);

  // Sync wishlist to localStorage
  useEffect(() => {
    localStorage.setItem(`rb_wishlist_${business.id}`, JSON.stringify(wishlist));
  }, [wishlist, business.id]);

  // Countdown timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setFlashSaleSeconds(prev => {
        if (prev <= 1) return 28800; // Reset after 8 hours
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch orders matching this business and user to display in Live Tracking
  useEffect(() => {
    const fetchLiveOrders = async () => {
      try {
        const response = await fetch('/api/db');
        if (response.ok) {
          const data = await response.json();
          const matches = (data.bookings || []).filter(
            (b: Booking) => b.businessId === business.id && b.userPhone === currentUser.phone
          );
          setLiveOrders(matches);
        }
      } catch (err) {
        console.error('Error fetching live tracking orders:', err);
      }
    };
    fetchLiveOrders();
    const poll = setInterval(fetchLiveOrders, 8000); // Poll tracking every 8s
    return () => clearInterval(poll);
  }, [business.id, currentUser.phone]);

  const toggleLanguage = () => {
    setLang(prev => prev === 'bn' ? 'en' : 'bn');
  };

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  const handleToggleWishlist = (productId: string) => {
    setWishlist(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  const handleAddRecentlyViewed = (product: Product) => {
    setRecentlyViewed(prev => {
      const filtered = prev.filter(p => p.id !== product.id);
      return [product, ...filtered].slice(0, 5); // Keep up to 5 recently viewed
    });
  };

  const handleOpenProductDetails = (product: Product) => {
    setSelectedProduct(product);
    handleAddRecentlyViewed(product);
    setActiveImageIdx(0);
    setSelectedVariant('1kg');
  };

  // Dynamically group products into tags/subcategories
  const storeSubCategories = useMemo(() => {
    const subcats = new Set<string>();
    subcats.add('all');
    business.products.forEach(p => {
      subcats.add(getProductCategory(p));
    });
    return Array.from(subcats);
  }, [business.products]);

  // Filtered and Sorted products list
  const filteredProducts = useMemo(() => {
    let list = [...business.products];

    // Subcategory check
    if (selectedSubCategory !== 'all') {
      list = list.filter(p => getProductCategory(p) === selectedSubCategory);
    }

    // Search query check
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q));
    }

    // Price range check
    list = list.filter(p => p.price <= priceRange);

    // Sorting
    if (sortOption === 'lowToHigh') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortOption === 'highToLow') {
      list.sort((a, b) => b.price - a.price);
    } else if (sortOption === 'newest') {
      list.sort((a, b) => b.id.localeCompare(a.id));
    } else {
      // popular sorting mock (use discount as a proxy for hot deals!)
      list.sort((a, b) => {
        const discountA = a.originalPrice ? (a.originalPrice - a.price) : 0;
        const discountB = b.originalPrice ? (b.originalPrice - b.price) : 0;
        return discountB - discountA;
      });
    }

    return list;
  }, [business.products, selectedSubCategory, search, priceRange, sortOption]);

  // Group products by category for landing view
  const groupedProducts = useMemo(() => {
    const groups: { [category: string]: Product[] } = {};
    filteredProducts.forEach(p => {
      const cat = getProductCategory(p);
      if (!groups[cat]) {
        groups[cat] = [];
      }
      groups[cat].push(p);
    });
    return groups;
  }, [filteredProducts]);

  // Autocomplete Suggestions
  const searchSuggestions = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return business.products
      .filter(p => p.name.toLowerCase().includes(q))
      .slice(0, 5);
  }, [business.products, search]);

  // Calculate cart subtotal and final prices with wholesale logic
  const cartItems = Object.values(cart);
  const cartItemCalculations = useMemo(() => {
    return cartItems.map(item => {
      const priceCalc = getEffectiveProductPrice(
        item.product,
        item.quantity,
        business,
        isVerifiedMerchantOrAdmin
      );
      return {
        ...item,
        ...priceCalc,
      };
    });
  }, [cartItems, business, isVerifiedMerchantOrAdmin]);

  const cartSubtotal = cartItemCalculations.reduce((sum, item) => sum + item.totalPrice, 0);
  const totalWholesaleSavings = cartItemCalculations.reduce((sum, item) => sum + item.wholesaleDiscountSavings, 0);
  const cartDiscount = Math.floor(cartSubtotal * (discountPercent / 100));
  const deliveryCharge = business.deliveryCharge || 0;
  const cartTotal = Math.max(0, cartSubtotal - cartDiscount + deliveryCharge);

  // Handle coupon application
  const handleApplyCoupon = () => {
    if (!couponCodeText.trim()) return;
    const match = business.offers.find(
      o => o.code.toUpperCase() === couponCodeText.trim().toUpperCase()
    );
    if (match) {
      setDiscountPercent(match.discountPercent);
      alert(lang === 'bn' 
        ? `✅ কুপন কোড '${match.code}' সফলভাবে প্রযুক্ত হয়েছে! আপনি ${match.discountPercent}% ডিসকাউন্ট পেয়েছেন।` 
        : `✅ Coupon code '${match.code}' applied! You got ${match.discountPercent}% discount.`
      );
    } else {
      alert(lang === 'bn' 
        ? '❌ দুঃখিত, এই কুপন কোডটি সঠিক নয় বা মেয়াদোত্তীর্ণ!' 
        : '❌ Sorry, this coupon code is invalid or expired!'
      );
      setDiscountPercent(0);
    }
  };

  // Submit direct Checkout booking / order placing
  const handlePlaceOrder = async () => {
    if (!currentUser) return;
    if (!address.trim()) {
      alert(lang === 'bn' ? 'অনুগ্রহ করে ডেলিভারি ঠিকানা প্রদান করুন!' : 'Please enter your delivery address!');
      return;
    }

    if (cartItems.length === 0) {
      alert(lang === 'bn' ? 'আপনার শপিং কার্ট খালি আছে!' : 'Your shopping cart is empty!');
      return;
    }

    // If bKash, Nagad, or Rocket selected -> Open Live Payment Gateway!
    if (checkoutPayment === 'bkash' || checkoutPayment === 'nagad' || checkoutPayment === 'rocket') {
      setShowStorePaymentGateway(true);
      return;
    }

    const itemsPayload = cartItemCalculations.map(item => ({
      id: item.product.id,
      name: item.product.name,
      quantity: item.quantity,
      price: item.unitPrice,
      regularPrice: item.product.price,
      isWholesaleApplied: item.isWholesaleApplied,
      wholesaleDiscountSavings: item.wholesaleDiscountSavings
    }));

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: business.id,
          businessName: business.name,
          businessPhone: business.phone,
          businessCategory: business.category,
          userPhone: currentUser.phone,
          userName: currentUser.name,
          userAddress: address,
          type: 'order',
          items: itemsPayload,
          totalPrice: cartTotal,
          deliveryCharge,
          paymentMethod: 'cod',
          paymentStatus: 'pending',
          notes: notes
        })
      });

      if (response.ok) {
        alert(lang === 'bn' 
          ? '🎉 অভিনন্দন! আপনার ক্যাশ অন ডেলিভারি অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে। অর্ডার আইডি ট্র্যাক করতে পারবেন।' 
          : '🎉 Congratulations! Your Cash on Delivery order has been placed successfully.'
        );
        setCart({});
        setShowCheckoutModal(false);
        setShowCartDrawer(false);
        setAddress(currentUser.location?.address || '');
        setNotes('');
        setCouponCodeText('');
        setDiscountPercent(0);
        onRefreshDb();
        setActiveTab('track'); // Switch user to live tracking
      } else {
        const errorMsg = await response.text();
        alert('ত্রুটি: ' + errorMsg);
      }
    } catch (err) {
      console.error('Error placing checkout order:', err);
      alert('সিস্টেমে ত্রুটি ঘটেছে!');
    }
  };

  // Payment Gateway callback for Store Checkout
  const handleStorePaymentSuccess = async (details: PaymentGatewayDetails) => {
    const itemsPayload = cartItemCalculations.map(item => ({
      id: item.product.id,
      name: item.product.name,
      quantity: item.quantity,
      price: item.unitPrice,
      regularPrice: item.product.price,
      isWholesaleApplied: item.isWholesaleApplied,
      wholesaleDiscountSavings: item.wholesaleDiscountSavings
    }));

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: business.id,
          businessName: business.name,
          businessPhone: business.phone,
          businessCategory: business.category,
          userPhone: currentUser.phone,
          userName: currentUser.name,
          userAddress: address,
          type: 'order',
          items: itemsPayload,
          totalPrice: cartTotal,
          deliveryCharge,
          paymentMethod: details.method,
          paymentStatus: 'paid',
          trxId: details.trxId,
          notes: notes
        })
      });

      if (response.ok) {
        setCart({});
        setShowCheckoutModal(false);
        setShowCartDrawer(false);
        setAddress(currentUser.location?.address || '');
        setNotes('');
        setCouponCodeText('');
        setDiscountPercent(0);
        setShowStorePaymentGateway(false);
        onRefreshDb();
        setActiveTab('track');
      }
    } catch (err) {
      console.error('Error placing store order via payment gateway:', err);
    }
  };

  // Quick Direct Direct Buy Now Bypassing Normal Cart flow
  const handleDirectBuyNow = (product: Product) => {
    if (isAccessDeniedForWholesale) {
      if (currentUser?.role === 'merchant') {
        alert(lang === 'bn'
          ? 'দুঃখিত, আপনার মার্চেন্ট অ্যাকাউন্টটি এখনও ভেরিফাইড নয়! পাইকারি পণ্য কিনতে অ্যাডমিন কর্তৃক ট্রেড লাইসেন্স ভেরিফিকেশন সম্পন্ন হওয়া আবশ্যক।'
          : 'Sorry, your Merchant account is not verified yet. Active Trade License verification is required by Admin for wholesale purchases.');
      } else {
        alert(lang === 'bn' 
          ? 'দুঃখিত, এটি একটি পাইকারি দোকান! এখান থেকে পণ্য ক্রয় করতে দয়া করে আপনার অ্যাকাউন্টটি "মার্চেন্ট" (খুচরা বিক্রেতা) রোলে রূপান্তর করুন এবং ট্রেড লাইসেন্স সাবমিট করুন।' 
          : 'Sorry, this is a wholesale-only shop. To purchase, please upgrade to Merchant and submit your Business Trade License for verification.');
      }
      return;
    }
    // Reset cart and add this product
    setCart({
      [product.id]: { product, quantity: 1 }
    });
    setSelectedProduct(null);
    setShowCheckoutModal(true);
  };

  // Compare products selection control
  const handleToggleCompare = (productId: string) => {
    setCompareIds(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        if (prev.length >= 3) {
          alert(lang === 'bn' ? 'সর্বোচ্চ ৩টি পণ্য একসাথে তুলনা করা যাবে।' : 'You can compare up to 3 products.');
          return prev;
        }
        return [...prev, productId];
      }
    });
  };

  // Live reviews addition updating rating dynamically
  const handleAddReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;
    try {
      const response = await fetch(`/api/businesses/${business.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: currentUser.name,
          userPhone: currentUser.phone,
          rating: reviewRating,
          comment: reviewComment
        })
      });

      if (response.ok) {
        alert(lang === 'bn' ? 'ধন্যবাদ! আপনার রিভিওটি সফলভাবে প্রকাশ করা হয়েছে।' : 'Thank you! Your review has been submitted.');
        setReviewComment('');
        setReviewRating(5);
        onRefreshDb();
      } else {
        alert('রিভিউ প্রকাশ ব্যর্থ হয়েছে।');
      }
    } catch (err) {
      console.error('Failed to submit review:', err);
    }
  };

  // Zip/District checker logic
  const handleAreaCheck = () => {
    if (!deliveryAreaQuery.trim()) return;
    const clean = deliveryAreaQuery.toLowerCase();
    // Simple logic matching business address keywords
    const bizAddressClean = business.address.toLowerCase();
    if (bizAddressClean.includes(clean) || clean.includes('dhaka') || clean.includes('ঢাকা') || clean.includes('ধানমন্ডি') || clean.includes('dhanmondi')) {
      setDeliveryCheckResult('yes');
    } else {
      setDeliveryCheckResult('no');
    }
  };

  // Convert Flash Sale seconds to ticking text: hh:mm:ss
  const formatTimer = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`rounded-3xl border transition-all duration-300 overflow-hidden ${
      darkMode 
        ? 'bg-slate-950 border-slate-800 text-slate-100' 
        : 'bg-white border-slate-100 text-slate-900'
    }`}>
      
      {/* 1. Header with Brand, Quick Switches (Darkmode & Language) & Cart Trigger */}
      <header className={`px-5 py-4 border-b flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0 ${
        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50/70 border-slate-100'
      }`}>
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className={`p-2 rounded-xl text-xs font-black flex items-center gap-1 transition-all ${
              darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-white hover:bg-slate-100 border text-slate-700 shadow-xs'
            }`}
          >
            ◀ {lang === 'bn' ? T.bn.back : T.en.back}
          </button>
          
          <div className="flex items-center gap-2">
            {business.logo ? (
              <img src={business.logo} alt="" className="w-10 h-10 rounded-full border border-slate-200 object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black text-sm">
                {business.name.substring(0,2)}
              </div>
            )}
            <div>
              <h1 className="text-sm font-black flex items-center gap-1.5 leading-none">
                {business.name}
                <span className="text-xs text-amber-500">★ {business.rating}</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-bold tracking-wide uppercase mt-1">
                {business.type === 'shop' ? 'Premium Store' : 'Emergency Service provider'}
              </p>
            </div>
          </div>
        </div>

        {/* Header Controls Container */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Notifications alert indicator */}
          <div className="relative p-2 rounded-xl bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400">
            <Bell className="w-4 h-4 animate-bounce" />
            <span className="absolute -top-1 -right-1 bg-rose-500 text-white font-bold text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center">1</span>
          </div>

          {/* Compare products launcher if elements added */}
          {compareIds.length > 0 && (
            <button
              onClick={() => setShowCompareModal(true)}
              className="px-3 py-1.5 rounded-xl bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 text-[10px] font-black flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'তুলনা করুন' : 'Compare'} ({compareIds.length})</span>
            </button>
          )}

          {/* External Website button if configured by vendor */}
          {business.websiteUrl && (
            <button
              onClick={() => setShowWebsiteViewModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs py-2 px-3 rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-200 dark:shadow-none cursor-pointer transition-all active:scale-95"
              title={lang === 'bn' ? 'মার্চেন্টের অফিশিয়াল ওয়েবসাইট দেখুন' : 'Visit Store Website'}
            >
              <span>🌐</span>
              <span className="hidden sm:inline">{lang === 'bn' ? 'শপ ওয়েবসাইট' : 'Store Website'}</span>
            </button>
          )}

          {/* Facebook Share Store Button */}
          <button
            onClick={() => {
              setFbShareItem({
                title: `${business.name} — ${business.category || 'দোকান'}`,
                price: business.products?.[0]?.price || 0,
                image: business.logo || business.images?.[0],
              });
              setShowFbShareModal(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-black text-xs py-2 px-3 rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-200 dark:shadow-none cursor-pointer transition-all active:scale-95"
            title={lang === 'bn' ? 'ফেসবুকে শেয়ার করুন' : 'Share on Facebook'}
          >
            <span className="font-serif font-black text-sm">f</span>
            <span className="hidden sm:inline">{lang === 'bn' ? 'ফেসবুকে শেয়ার' : 'Share'}</span>
          </button>

          {/* Dark Mode toggle icon button */}
          <button 
            onClick={toggleDarkMode}
            className={`p-2 rounded-xl transition-all ${
              darkMode ? 'bg-slate-800 text-amber-400 hover:bg-slate-700' : 'bg-white border text-slate-600 hover:bg-slate-100 shadow-xs'
            }`}
            title={lang === 'bn' ? T.bn.theme : T.en.theme}
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Language translation dictionary toggle */}
          <button 
            onClick={toggleLanguage}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
              darkMode ? 'bg-slate-800 text-indigo-400 hover:bg-slate-700' : 'bg-white border text-indigo-600 hover:bg-slate-100 shadow-xs'
            }`}
          >
            <Languages className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'EN' : 'বাংলা'}</span>
          </button>

          {/* Shopping Cart button trigger */}
          <button 
            onClick={() => setShowCartDrawer(true)}
            className="bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-extrabold text-xs py-2 px-3.5 rounded-xl flex items-center gap-1.5 shadow-md relative"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">{lang === 'bn' ? 'কার্ট' : 'Cart'}</span>
            <span className="bg-white text-slate-900 dark:text-white dark:bg-blue-800 font-black text-[10px] px-1.5 py-0.5 rounded-full ml-1">
              {cartItems.reduce((acc, item) => acc + item.quantity, 0)}
            </span>
          </button>
        </div>
      </header>

      {/* 2. Secondary Mini Tabs Navigation */}
      <nav className={`flex border-b text-xs font-extrabold overflow-x-auto divide-x ${
        darkMode ? 'border-slate-800 bg-slate-900 divide-slate-800' : 'border-slate-100 bg-white divide-slate-100'
      }`}>
        <button
          onClick={() => { setActiveTab('shop'); setCatalogViewMode('both'); }}
          className={`flex-1 min-w-[90px] py-3 text-center transition-all ${
            activeTab === 'shop' && catalogViewMode !== 'website'
              ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 bg-slate-50/40 dark:bg-slate-800/20 font-bold' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          🏪 {lang === 'bn' ? 'দোকান' : 'Store'}
        </button>
        {business.websiteUrl && (
          <button
            onClick={() => { setActiveTab('shop'); setCatalogViewMode('website'); }}
            className={`flex-1 min-w-[130px] py-3 text-center transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'shop' && catalogViewMode === 'website'
                ? 'text-indigo-600 border-b-2 border-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/30 font-black' 
                : 'text-slate-500 hover:text-slate-800 font-bold'
            }`}
          >
            <span>🌐</span>
            <span>{lang === 'bn' ? 'অনলাইন ওয়েবসাইট প্রোডাক্টস' : 'Web Catalog'}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </button>
        )}
        <button
          onClick={() => setActiveTab('wishlist')}
          className={`flex-1 min-w-[90px] py-3 text-center transition-all ${
            activeTab === 'wishlist' 
              ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 bg-slate-50/40 dark:bg-slate-800/20' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          ❤️ {lang === 'bn' ? T.bn.wishlist : T.en.wishlist} ({wishlist.length})
        </button>
        <button
          onClick={() => setActiveTab('track')}
          className={`flex-1 min-w-[90px] py-3 text-center transition-all ${
            activeTab === 'track' 
              ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 bg-slate-50/40 dark:bg-slate-800/20' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          📦 {lang === 'bn' ? T.bn.orderHistory : T.en.orderHistory}
        </button>
        <button
          onClick={() => setActiveTab('account')}
          className={`flex-1 min-w-[110px] py-3 text-center transition-all ${
            activeTab === 'account' 
              ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 bg-slate-50/40 dark:bg-slate-800/20' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          👤 {lang === 'bn' ? 'আমার অ্যাকাউন্ট' : 'My Account'}
        </button>
        <button
          onClick={() => setActiveTab('support')}
          className={`flex-1 min-w-[90px] py-3 text-center transition-all ${
            activeTab === 'support' 
              ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 bg-slate-50/40 dark:bg-slate-800/20' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          💬 {lang === 'bn' ? T.bn.support : T.en.support}
        </button>
      </nav>

      {/* 3. Main Dashboard Body rendering based on selected Secondary Tab */}
      <main className="p-5 space-y-6">

        {isWholesaleShop && (
          <div className="space-y-4">
            {isVerifiedMerchantOrAdmin ? (
              <div className="p-4 rounded-2xl border flex flex-col md:flex-row justify-between items-center gap-4 bg-emerald-50/70 border-emerald-100 text-emerald-900 dark:bg-emerald-950/20 dark:border-emerald-900/50 dark:text-emerald-300">
                <div className="flex items-start gap-3">
                  <span className="text-2xl mt-0.5">✅</span>
                  <div>
                    <h4 className="font-extrabold text-xs sm:text-sm">
                      {lang === 'bn' ? 'অনুমোদিত পাইকারি ক্রেতা (ভেরিফাইড মার্চেন্ট)' : 'Authorized Wholesale Buyer (Verified Merchant)'}
                    </h4>
                    <p className="text-[10px] mt-1 opacity-90 leading-relaxed max-w-2xl">
                      {lang === 'bn'
                        ? `আপনার মার্চেন্ট প্রোফাইলটি সফলভাবে ভেরিফাইড করা হয়েছে (ট্রেড লাইসেন্স নম্বর: ${currentUser?.tradeLicenseNo || 'N/A'})। আপনি এখন এই পাইকারি দোকান থেকে কেনাকাটা করতে পারবেন।`
                        : `Your Merchant Profile is verified (Trade License No: ${currentUser?.tradeLicenseNo || 'N/A'}). You are authorized to make wholesale purchases.`}
                    </p>
                  </div>
                </div>
              </div>
            ) : currentUser?.tradeLicenseStatus === 'rejected' ? (
              <div className="p-5 rounded-2xl border bg-rose-50 border-rose-200 text-rose-950 dark:bg-rose-950/20 dark:border-rose-900/50 dark:text-rose-300 space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-2xl mt-0.5">❌</span>
                  <div className="flex-1">
                    <h4 className="font-extrabold text-xs sm:text-sm text-rose-800 dark:text-rose-400">
                      {lang === 'bn' ? 'ট্রেড লাইসেন্স ভেরিফিকেশন আবেদন প্রত্যাখ্যান করা হয়েছে' : 'Trade License Verification Rejected'}
                    </h4>
                    <p className="text-[11px] mt-1 font-bold text-rose-700 dark:text-rose-400">
                      {lang === 'bn' ? 'কারণ: ' : 'Reason: '}
                      <span className="underline font-normal text-rose-600 dark:text-rose-300">{currentUser?.tradeLicenseRejectReason || (lang === 'bn' ? 'নথি সঠিক নয় বা অস্পষ্ট।' : 'Documents invalid or unclear.')}</span>
                    </p>
                    <p className="text-[10px] mt-1 opacity-90 leading-relaxed max-w-2xl text-slate-500">
                      {lang === 'bn'
                        ? 'অনুগ্রহ করে নিচে সঠিক ট্রেড লাইসেন্স নম্বর ও স্পষ্ট ডকুমেন্টের লিংক প্রদান করে পুনরায় আবেদন করুন।'
                        : 'Please provide correct trade license information below and submit again.'}
                    </p>
                  </div>
                </div>
                
                {/* Form to resubmit trade license */}
                <form onSubmit={handleSubmitTradeLicense} className="bg-white/50 dark:bg-slate-900/40 p-4 rounded-xl border border-rose-200/50 space-y-3 max-w-xl">
                  <h5 className="text-[11px] font-bold text-rose-800 dark:text-rose-300">
                    {lang === 'bn' ? 'নতুন করে আবেদন জমা দিন:' : 'Submit a New Request:'}
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block">{lang === 'bn' ? 'ট্রেড লাইসেন্স নম্বর' : 'Trade License Number'}</label>
                      <input
                        type="text"
                        value={tradeLicenseInput}
                        onChange={(e) => setTradeLicenseInput(e.target.value)}
                        placeholder="e.g. TR-98271A"
                        className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-rose-500 text-slate-800"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block">{lang === 'bn' ? 'ট্রেড লাইসেন্স কপি লিংক (ঐচ্ছিক)' : 'Trade License Doc Link (Optional)'}</label>
                      <input
                        type="text"
                        value={tradeLicenseImgInput}
                        onChange={(e) => setTradeLicenseImgInput(e.target.value)}
                        placeholder="https://example.com/doc.jpg"
                        className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-rose-500 text-slate-800"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmittingLicense}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[10px] py-2 px-4 rounded-lg transition-all shadow-sm cursor-pointer"
                  >
                    {isSubmittingLicense ? (lang === 'bn' ? 'জমা হচ্ছে...' : 'Submitting...') : (lang === 'bn' ? 'আবেদন পুনরায় জমা দিন' : 'Resubmit Request')}
                  </button>
                </form>
              </div>
            ) : currentUser?.role === 'merchant' && currentUser?.tradeLicenseNo ? (
              <div className="p-5 rounded-2xl border bg-amber-50/80 border-amber-200 text-amber-900 dark:bg-amber-950/20 dark:border-amber-900/50 dark:text-amber-300 space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-2xl mt-0.5">⏳</span>
                  <div className="flex-1">
                    <h4 className="font-extrabold text-xs sm:text-sm text-amber-800 dark:text-amber-400">
                      {lang === 'bn' ? 'ট্রেড লাইসেন্স ভেরিফিকেশন অপেক্ষমান' : 'Trade License Verification Pending'}
                    </h4>
                    <p className="text-[11px] mt-1 opacity-90 leading-relaxed max-w-2xl">
                      {lang === 'bn'
                        ? `আপনার ট্রেড লাইসেন্স (নম্বর: ${currentUser?.tradeLicenseNo}) বর্তমানে অ্যাডমিন রিভিউর জন্য অপেক্ষমান রয়েছে। ভেরিফিকেশন সফল হলে আপনি পাইকারি মূল্যে অর্ডার করতে পারবেন।`
                        : `Your Trade License (No: ${currentUser?.tradeLicenseNo}) is pending administrative review. Once approved, you can purchase from wholesale suppliers.`}
                    </p>
                  </div>
                </div>
                
                {/* Form to update trade license if they want to correct it */}
                <form onSubmit={handleSubmitTradeLicense} className="bg-white/50 dark:bg-slate-900/40 p-4 rounded-xl border border-amber-200/50 space-y-3 max-w-xl">
                  <h5 className="text-[11px] font-bold text-amber-800 dark:text-amber-300">
                    {lang === 'bn' ? 'আবেদন সংশোধন করুন (যদি প্রয়োজন হয়):' : 'Modify Submission (if needed):'}
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block">{lang === 'bn' ? 'ট্রেড লাইসেন্স নম্বর' : 'Trade License Number'}</label>
                      <input
                        type="text"
                        value={tradeLicenseInput}
                        onChange={(e) => setTradeLicenseInput(e.target.value)}
                        placeholder="e.g. TR-98271A"
                        className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block">{lang === 'bn' ? 'ট্রেড লাইসেন্স কপি লিংক (ঐচ্ছিক)' : 'Trade License Doc Link (Optional)'}</label>
                      <input
                        type="text"
                        value={tradeLicenseImgInput}
                        onChange={(e) => setTradeLicenseImgInput(e.target.value)}
                        placeholder="https://example.com/doc.jpg"
                        className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmittingLicense}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-[10px] py-2 px-4 rounded-lg transition-all shadow-sm"
                  >
                    {isSubmittingLicense ? (lang === 'bn' ? 'জমা হচ্ছে...' : 'Submitting...') : (lang === 'bn' ? 'আবেদন পুনরায় জমা দিন' : 'Resubmit Request')}
                  </button>
                </form>
              </div>
            ) : (
              <div className="p-5 rounded-2xl border bg-rose-50/70 border-rose-100 text-rose-900 dark:bg-rose-950/20 dark:border-rose-900/50 dark:text-rose-300 space-y-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl mt-0.5">⚠️</span>
                  <div>
                    <h4 className="font-extrabold text-xs sm:text-sm text-rose-800 dark:text-rose-400">
                      {lang === 'bn' ? 'পাইকারি ক্রয়ের জন্য ট্রেড লাইসেন্স ভেরিফিকেশন আবশ্যক' : 'Trade License Verification Required for Wholesale'}
                    </h4>
                    <p className="text-[11px] mt-1 opacity-90 leading-relaxed max-w-2xl">
                      {lang === 'bn'
                        ? 'এটি একটি পাইকারি দোকান (Wholesale Shop)। এখান থেকে পণ্য ক্রয় করতে হলে আপনার একটি বৈধ বিজনেস ট্রেড লাইসেন্স থাকতে হবে এবং ভেরিফাইড মার্চেন্ট স্ট্যাটাস থাকতে হবে।'
                        : 'This is a wholesale-only store. To purchase items, you must provide a valid Business Trade License and have a verified Merchant status.'}
                    </p>
                  </div>
                </div>

                <div className="bg-white/50 dark:bg-slate-900/40 p-4 rounded-xl border border-rose-200/50 space-y-3 max-w-xl">
                  <h5 className="text-xs font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                    🏪 {lang === 'bn' ? 'ট্রেড লাইসেন্স সাবমিট করে মার্চেন্ট ভেরিফিকেশন রিকোয়েস্ট করুন' : 'Submit Trade License & Request Verification'}
                  </h5>
                  
                  <form onSubmit={handleSubmitTradeLicense} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block">
                          {lang === 'bn' ? 'ট্রেড লাইসেন্স নম্বর (আবশ্যক)' : 'Trade License Number (Required)'}
                        </label>
                        <input
                          type="text"
                          required
                          value={tradeLicenseInput}
                          onChange={(e) => setTradeLicenseInput(e.target.value)}
                          placeholder="e.g. TR-98271A"
                          className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-rose-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block">
                          {lang === 'bn' ? 'লাইসেন্স ডকুমেন্ট / ছবি লিংক (ঐচ্ছিক)' : 'License Document/Image URL (Optional)'}
                        </label>
                        <input
                          type="text"
                          value={tradeLicenseImgInput}
                          onChange={(e) => setTradeLicenseImgInput(e.target.value)}
                          placeholder="https://example.com/license.jpg"
                          className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-rose-500"
                        />
                      </div>
                    </div>
                    
                    <button
                      type="submit"
                      disabled={isSubmittingLicense}
                      className="w-full sm:w-auto bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs py-2 px-5 rounded-xl transition-all shadow-md cursor-pointer"
                    >
                      {isSubmittingLicense ? (lang === 'bn' ? 'আবেদন জমা হচ্ছে...' : 'Submitting...') : (lang === 'bn' ? '🎯 ট্রেড লাইসেন্স সাবমিট করুন' : '🎯 Submit Trade License')}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* ==================== TAB 1: SHOPPING EXPERIENCE ==================== */}
        {activeTab === 'shop' && (
          <>
            {/* Merchant Website Callout Banner & View Mode Switcher */}
            {business.websiteUrl && (
              <div className="space-y-3">
                <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-4 sm:p-5 rounded-2xl text-white shadow-lg relative overflow-hidden border border-indigo-700/50">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center text-2xl shrink-0 shadow-inner">
                        🌐
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm sm:text-base font-black text-white">
                            {business.name} - অফিশিয়াল লিঙ্কড অনলাইন শপ
                          </h3>
                          <span className="bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                            LIVE CONNECTED
                          </span>
                        </div>
                        <p className="text-[11px] text-indigo-200 mt-0.5 font-mono truncate max-w-md">
                          {business.websiteUrl}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                      <button
                        onClick={() => setShowWebsiteViewModal(true)}
                        className="flex-1 sm:flex-none bg-white text-indigo-950 hover:bg-indigo-50 font-black text-xs py-2.5 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>👁️ ফুলস্ক্রিন পপআপ মোড</span>
                      </button>
                      <a
                        href={business.websiteUrl.startsWith('http') ? business.websiteUrl : `https://${business.websiteUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-indigo-600/80 hover:bg-indigo-600 text-white font-bold text-xs py-2.5 px-3 rounded-xl transition-all border border-indigo-400/30 flex items-center justify-center cursor-pointer"
                        title="নতুন ট্যাবে খুলুন"
                      >
                        ↗
                      </a>
                    </div>
                  </div>
                </div>

                {/* Sub-mode view selector buttons */}
                <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl flex flex-wrap items-center justify-between text-xs font-bold gap-1.5">
                  <button
                    onClick={() => setCatalogViewMode('both')}
                    className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      catalogViewMode === 'both'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-black'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                    }`}
                  >
                    <span>✨</span>
                    <span>সবগুলো একসাথে (ওয়েবসাইট ও অ্যাপ)</span>
                  </button>
                  <button
                    onClick={() => setCatalogViewMode('website')}
                    className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      catalogViewMode === 'website'
                        ? 'bg-indigo-600 text-white shadow-xs font-black'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                    }`}
                  >
                    <span>🌐</span>
                    <span>যুক্তকৃত অনলাইন প্রোডাক্টস</span>
                  </button>
                  <button
                    onClick={() => setCatalogViewMode('app')}
                    className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      catalogViewMode === 'app'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-black'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                    }`}
                  >
                    <span>🛍️</span>
                    <span>ইন-অ্যাপ প্রোডাক্টস ({filteredProducts.length})</span>
                  </button>
                </div>
              </div>
            )}

            {/* Direct Embedded Live Web Catalog View on Store Page */}
            {business.websiteUrl && (catalogViewMode === 'both' || catalogViewMode === 'website') && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden my-4 transition-all">
                <div className="p-4 bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center text-xl shrink-0 shadow-inner">
                      🌐
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs sm:text-sm font-black text-white">
                          {business.name} - অ্যাড করা অনলাইন শপ ও প্রোডাক্টসমূহ
                        </h3>
                        <span className="bg-emerald-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                          LIVE LINKED PRODUCTS
                        </span>
                      </div>
                      <p className="text-[10px] text-indigo-200 font-mono mt-0.5 truncate max-w-sm sm:max-w-md">
                        {business.websiteUrl}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                    <button
                      onClick={() => setShowWebsiteViewModal(true)}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                    >
                      <span>👁️ ফুলস্ক্রিন দেখুন</span>
                    </button>
                    <a
                      href={business.websiteUrl.startsWith('http') ? business.websiteUrl : `https://${business.websiteUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all border border-white/20 flex items-center gap-1 cursor-pointer"
                    >
                      <span>ব্রাউজারে খুলুন ↗</span>
                    </a>
                  </div>
                </div>

                {/* Direct Embedded Web Iframe */}
                <div className="relative w-full h-[520px] sm:h-[650px] bg-slate-950">
                  <iframe
                    src={business.websiteUrl.startsWith('http') ? business.websiteUrl : `https://${business.websiteUrl}`}
                    title={`${business.name} Direct Website Products`}
                    className="w-full h-full border-0"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                  />
                  <div className="absolute bottom-3 left-3 right-3 bg-slate-900/90 text-white text-[11px] px-3.5 py-2 rounded-xl shadow-lg backdrop-blur-md flex items-center justify-between border border-white/10 pointer-events-none">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="font-medium text-slate-200">
                        {lang === 'bn' ? 'দোকানের লিংক থেকে সরাসরি অনলাইন প্রোডাক্ট ক্যাটালগ দেখা যাচ্ছে' : 'Live Website Product Catalog'}
                      </span>
                    </span>
                    <span className="text-[10px] text-indigo-300 font-mono hidden sm:inline">{business.websiteUrl}</span>
                  </div>
                </div>
              </div>
            )}
            {/* Banner of Active Shop Promotions */}
            {business.offers.length > 0 && (
              <div className="bg-gradient-to-r from-rose-500 to-indigo-600 p-5 rounded-2xl text-white shadow-md relative overflow-hidden">
                <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-white/10 rounded-full blur-xl" />
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
                  <div className="space-y-1">
                    <span className="bg-white/20 text-[9px] font-black tracking-widest uppercase px-2.5 py-0.5 rounded-full border border-white/10">
                      ⚡ {lang === 'bn' ? 'সচল কুপন অফার' : 'Active Coupons'}
                    </span>
                    <h2 className="text-sm font-black tracking-tight mt-1">
                      {business.offers[0].title}
                    </h2>
                    <p className="text-[11px] text-indigo-100 font-medium leading-relaxed max-w-md">
                      {business.offers[0].description} • {lang === 'bn' ? 'কুপন কোড ব্যবহার করে চেকআউটে ছাড় পান।' : 'Use promo code at checkout.'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setCouponCodeText(business.offers[0].code);
                      alert(lang === 'bn' ? `কুপন কোড '${business.offers[0].code}' কপি করা হয়েছে!` : `Copied promo code: ${business.offers[0].code}`);
                    }}
                    className="bg-white hover:bg-slate-100 text-slate-900 font-black text-xs py-2 px-4 rounded-xl cursor-pointer transition-all flex items-center gap-1 shrink-0"
                  >
                    <Tag className="w-3.5 h-3.5 text-rose-500" />
                    <span>{lang === 'bn' ? 'কপি কোড:' : 'Copy Code:'} {business.offers[0].code}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Premium Flash Sale Countdown Container */}
            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500 text-white rounded-xl">
                  <Clock className="w-5 h-5 animate-spin" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">
                    {lang === 'bn' ? T.bn.flashSale : T.en.flashSale}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {lang === 'bn' ? 'স্পেশাল ছাড়ের পণ্যে স্টক ফুরিয়ে যাওয়ার আগেই লুফে নিন।' : 'Hot discount deals on daily goods.'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-amber-500 text-white font-mono font-black text-xs py-1.5 px-3.5 rounded-xl">
                <span>{lang === 'bn' ? T.bn.timeLeft : T.en.timeLeft}</span>
                <span>{formatTimer(flashSaleSeconds)}</span>
              </div>
            </div>

            {/* Smart Search Bar, Auto-complete Suggestions and Filters */}
            <div className="space-y-3 relative">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3.5 top-3 text-slate-400">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder={lang === 'bn' ? T.bn.searchPlaceholder : T.en.searchPlaceholder}
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    className={`w-full text-xs pl-9.5 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                      darkMode ? 'bg-slate-900 border border-slate-800 text-slate-100' : 'bg-slate-50 border border-slate-200 text-slate-900'
                    }`}
                  />
                  {search && (
                    <button 
                      onClick={() => { setSearch(''); setShowSuggestions(false); }}
                      className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex border rounded-xl overflow-hidden shrink-0">
                  <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-2.5 transition-all ${
                      viewMode === 'grid' 
                        ? 'bg-blue-600 text-white' 
                        : (darkMode ? 'bg-slate-900 text-slate-400' : 'bg-white text-slate-500')
                    }`}
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setViewMode('list')}
                    className={`p-2.5 transition-all ${
                      viewMode === 'list' 
                        ? 'bg-blue-600 text-white' 
                        : (darkMode ? 'bg-slate-900 text-slate-400' : 'bg-white text-slate-500')
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Autocomplete suggestions popup overlay */}
              {showSuggestions && searchSuggestions.length > 0 && (
                <div className={`absolute left-0 right-0 top-12 z-20 border rounded-2xl shadow-xl overflow-hidden ${
                  darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-100 text-slate-900'
                }`}>
                  <div className="p-2 border-b text-[10px] text-slate-400 uppercase font-black">
                    {lang === 'bn' ? 'অনুসন্ধান সাজেশন' : 'Search Suggestions'}
                  </div>
                  {searchSuggestions.map(p => (
                    <div 
                      key={p.id}
                      onClick={() => {
                        handleOpenProductDetails(p);
                        setShowSuggestions(false);
                      }}
                      className={`p-3 text-xs flex items-center justify-between cursor-pointer transition-all ${
                        darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-50'
                      }`}
                    >
                      <span className="font-bold">{p.name}</span>
                      <span className="text-emerald-500 font-extrabold">৳{p.price}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Interactive Filters: Price range & Category Chips */}
            <div className="space-y-4">
              {/* Category Chips Scroller */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">
                  {lang === 'bn' ? T.bn.categories : T.en.categories}
                </span>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                  {storeSubCategories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedSubCategory(cat)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                        selectedSubCategory === cat
                          ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                          : (darkMode ? 'bg-slate-900 text-slate-300 hover:bg-slate-800' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')
                      }`}
                    >
                      {cat === 'all' ? (lang === 'bn' ? T.bn.all : T.en.all) : cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price range selector slider */}
              <div className="bg-slate-50/50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                  <span>{lang === 'bn' ? 'মূল্য সীমা ফিল্টার' : 'Price Limit'}</span>
                  <span className="text-blue-600 dark:text-blue-400 font-black">৳ ০ - ৳ {priceRange}</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="5000"
                  step="20"
                  value={priceRange}
                  onChange={(e) => setPriceRange(Number(e.target.value))}
                  className="w-full accent-blue-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                />
              </div>

              {/* Sort selector dropdown */}
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>{lang === 'bn' ? `পণ্য সংখ্যা: ${filteredProducts.length}টি` : `${filteredProducts.length} items found`}</span>
                <div className="flex items-center gap-1">
                  <span>{lang === 'bn' ? 'সাজান:' : 'Sort:'}</span>
                  <select
                    value={sortOption}
                    onChange={(e: any) => setSortOption(e.target.value)}
                    className={`text-xs font-bold border rounded-lg p-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  >
                    <option value="popular">{lang === 'bn' ? 'জনপ্রিয়' : 'Popular'}</option>
                    <option value="lowToHigh">{lang === 'bn' ? 'দাম: কম থেকে বেশি' : 'Price: Low to High'}</option>
                    <option value="highToLow">{lang === 'bn' ? 'দাম: বেশি থেকে কম' : 'Price: High to Low'}</option>
                    <option value="newest">{lang === 'bn' ? 'নতুন পণ্য' : 'New Arrivals'}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Product Display Block (supports both GRID and LIST views) */}
            {filteredProducts.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl space-y-3">
                <ShoppingBag className="w-12 h-12 text-slate-300 stroke-1 mx-auto animate-pulse" />
                <h5 className="text-xs font-bold text-slate-500">কোনো পণ্য পাওয়া যায়নি!</h5>
                <p className="text-[10px] text-slate-400">ফিল্টার রিমুভ করে বা অন্য কি-ওয়ার্ড লিখে পুনরায় অনুসন্ধান করুন।</p>
              </div>
            ) : (
              selectedSubCategory === 'all' ? (
                /* Grouped Categorized View */
                <div className="space-y-8">
                  {storeSubCategories.filter(cat => cat !== 'all' && (groupedProducts[cat]?.length || 0) > 0).map((cat) => (
                    <div key={cat} className="space-y-4">
                      <div className="pt-2 pb-1 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                        <h3 className="text-[11px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide flex items-center gap-2">
                          <span className="w-2 h-4 bg-blue-600 dark:bg-blue-500 rounded-sm inline-block"></span>
                          {cat}
                        </h3>
                        <span className="text-[9px] font-bold text-slate-400">({groupedProducts[cat].length} টি পণ্য)</span>
                      </div>

                      {viewMode === 'grid' ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {groupedProducts[cat].map((p) => {
                            const discountPercent = p.originalPrice && p.originalPrice > p.price
                              ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
                              : null;
                            const isFav = wishlist.includes(p.id);
                            const isInCompare = compareIds.includes(p.id);
                            const qtyInCart = cart[p.id]?.quantity || 0;

                            return (
                              <div 
                                key={p.id}
                                className={`border rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group relative ${
                                  darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
                                }`}
                              >
                                {/* Wishlist triggers */}
                                <button
                                  onClick={() => handleToggleWishlist(p.id)}
                                  className={`absolute top-2.5 right-2.5 z-10 p-1.5 rounded-full backdrop-blur-md shadow-xs transition-colors cursor-pointer ${
                                    isFav ? 'bg-rose-500 text-white' : 'bg-white/70 text-slate-500 hover:text-rose-500'
                                  }`}
                                >
                                  <Heart className="w-3.5 h-3.5 fill-current" />
                                </button>

                                {/* Compare toggle badge */}
                                <button
                                  onClick={() => handleToggleCompare(p.id)}
                                  className={`absolute top-2.5 left-2.5 z-10 p-1 rounded-full text-[9px] font-black uppercase flex items-center gap-1 backdrop-blur-md ${
                                    isInCompare ? 'bg-orange-500 text-white' : 'bg-slate-950/40 text-slate-200'
                                  }`}
                                >
                                  <ArrowLeftRight className="w-3 h-3" />
                                </button>

                                {/* Discount Badge */}
                                {discountPercent && (
                                  <span className="absolute top-11 left-2.5 z-10 bg-rose-500 text-white font-black text-[9px] px-2 py-0.5 rounded-md uppercase tracking-wider">
                                    {discountPercent}% OFF
                                  </span>
                                )}

                                {/* Product Image click opens detail page */}
                                <div 
                                  onClick={() => handleOpenProductDetails(p)}
                                  className="aspect-square bg-slate-100 dark:bg-slate-800 overflow-hidden relative cursor-pointer border-b dark:border-slate-800"
                                >
                                  {p.image ? (
                                    <img 
                                      src={p.image} 
                                      alt={p.name} 
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                                      referrerPolicy="no-referrer"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600 font-bold text-xs">
                                      No Image
                                    </div>
                                  )}
                                </div>

                                {/* Card Body */}
                                <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3.5">
                                  <div className="space-y-1 cursor-pointer" onClick={() => handleOpenProductDetails(p)}>
                                    <h5 className="text-[11px] font-black leading-snug line-clamp-1 text-slate-800 dark:text-slate-200">
                                      {p.name}
                                    </h5>
                                    <p className="text-[10px] text-slate-400 line-clamp-1">{p.description || 'Premium grade'}</p>
                                    <div className="flex items-center gap-1.5 pt-0.5">
                                      <span className="text-xs font-black text-emerald-600">৳ {p.price}</span>
                                      {p.originalPrice && <span className="line-through text-[9px] text-slate-400">৳ {p.originalPrice}</span>}
                                    </div>
                                    {(p.isWholesaleAvailable || isWholesaleShop) && (
                                      <div className="pt-0.5">
                                        <span className="text-[9px] font-black bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-1.5 py-0.5 rounded-md inline-flex items-center gap-0.5">
                                          <span>🏢</span>
                                          <span>পাইকারি: ৳{p.wholesalePrice || Math.round(p.price * (1 - (business.wholesaleDiscountPercentage || 10) / 100))}</span>
                                          <span className="opacity-75 font-normal">({p.wholesaleMinQty || business.wholesaleMinQtyDefault || 5}+ {p.wholesaleUnit || 'পিস'})</span>
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Incremental Cart triggers */}
                                  <div className="space-y-1.5 pt-1.5 border-t dark:border-slate-800/50">
                                    {qtyInCart > 0 ? (
                                      <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl p-1">
                                        <button 
                                          onClick={() => updateCartQty(p.id, -1)}
                                          className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center text-xs shadow-xs hover:bg-slate-100"
                                        >
                                          -
                                        </button>
                                        <span className="font-bold text-xs text-slate-800 dark:text-slate-200 px-2">{qtyInCart}</span>
                                        <button 
                                          onClick={() => updateCartQty(p.id, 1)}
                                          className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center text-xs shadow-xs hover:bg-slate-100"
                                        >
                                          +
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => addToCart(p)}
                                        className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-extrabold text-[10px] py-1.5 px-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                                      >
                                        <Plus className="w-3 h-3" />
                                        <span>{lang === 'bn' ? T.bn.addToCart : T.en.addToCart}</span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {groupedProducts[cat].map((p) => {
                            const isFav = wishlist.includes(p.id);
                            const qtyInCart = cart[p.id]?.quantity || 0;
                            return (
                              <div 
                                key={p.id}
                                className={`p-3 border rounded-2xl flex items-center gap-4 hover:shadow-md transition-all ${
                                  darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
                                }`}
                              >
                                <div 
                                  onClick={() => handleOpenProductDetails(p)}
                                  className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 cursor-pointer"
                                >
                                  <img src={p.image} alt="" className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h5 onClick={() => handleOpenProductDetails(p)} className="text-xs font-black text-slate-800 dark:text-slate-200 truncate cursor-pointer">{p.name}</h5>
                                  <p className="text-[10px] text-slate-400 line-clamp-1">{p.description}</p>
                                  <span className="text-xs font-extrabold text-emerald-600 block mt-1">৳ {p.price}</span>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  <button
                                    onClick={() => handleToggleWishlist(p.id)}
                                    className={`p-1.5 rounded-full ${isFav ? 'text-rose-500' : 'text-slate-300'}`}
                                  >
                                    <Heart className="w-4 h-4 fill-current" />
                                  </button>
                                  
                                  {qtyInCart > 0 ? (
                                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg p-0.5">
                                      <button onClick={() => updateCartQty(p.id, -1)} className="w-5 h-5 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded">-</button>
                                      <span className="text-xs font-bold dark:text-slate-200">{qtyInCart}</span>
                                      <button onClick={() => updateCartQty(p.id, 1)} className="w-5 h-5 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded">+</button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => addToCart(p)}
                                      className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] rounded-lg"
                                    >
                                      + {lang === 'bn' ? 'কার্ট' : 'Add'}
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                /* Specific Subcategory View */
                viewMode === 'grid' ? (
                  /* Grid View Style */
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredProducts.map((p) => {
                      const discountPercent = p.originalPrice && p.originalPrice > p.price
                        ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
                        : null;
                      const isFav = wishlist.includes(p.id);
                      const isInCompare = compareIds.includes(p.id);
                      const qtyInCart = cart[p.id]?.quantity || 0;

                      return (
                        <div 
                          key={p.id}
                          className={`border rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group relative ${
                            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
                          }`}
                        >
                          {/* Wishlist triggers */}
                          <button
                            onClick={() => handleToggleWishlist(p.id)}
                            className={`absolute top-2.5 right-2.5 z-10 p-1.5 rounded-full backdrop-blur-md shadow-xs transition-colors cursor-pointer ${
                              isFav ? 'bg-rose-500 text-white' : 'bg-white/70 text-slate-500 hover:text-rose-500'
                            }`}
                          >
                            <Heart className="w-3.5 h-3.5 fill-current" />
                          </button>

                          {/* Compare toggle badge */}
                          <button
                            onClick={() => handleToggleCompare(p.id)}
                            className={`absolute top-2.5 left-2.5 z-10 p-1 rounded-full text-[9px] font-black uppercase flex items-center gap-1 backdrop-blur-md ${
                              isInCompare ? 'bg-orange-500 text-white' : 'bg-slate-950/40 text-slate-200'
                            }`}
                          >
                            <ArrowLeftRight className="w-3 h-3" />
                          </button>

                          {/* Discount Badge */}
                          {discountPercent && (
                            <span className="absolute top-11 left-2.5 z-10 bg-rose-500 text-white font-black text-[9px] px-2 py-0.5 rounded-md uppercase tracking-wider">
                              {discountPercent}% OFF
                            </span>
                          )}

                          {/* Product Image click opens detail page */}
                          <div 
                            onClick={() => handleOpenProductDetails(p)}
                            className="aspect-square bg-slate-100 dark:bg-slate-800 overflow-hidden relative cursor-pointer border-b dark:border-slate-800"
                          >
                            {p.image ? (
                              <img 
                                src={p.image} 
                                alt={p.name} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600 font-bold text-xs">
                                No Image
                              </div>
                            )}
                          </div>

                          {/* Card Body */}
                          <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3.5">
                            <div className="space-y-1 cursor-pointer" onClick={() => handleOpenProductDetails(p)}>
                              <h5 className="text-[11px] font-black leading-snug line-clamp-1 text-slate-800 dark:text-slate-200">
                                {p.name}
                              </h5>
                              <p className="text-[10px] text-slate-400 line-clamp-1">{p.description || 'Premium grade'}</p>
                              <div className="flex items-center gap-1.5 pt-0.5">
                                <span className="text-xs font-black text-emerald-600">৳ {p.price}</span>
                                {p.originalPrice && <span className="line-through text-[9px] text-slate-400">৳ {p.originalPrice}</span>}
                              </div>
                              {(p.isWholesaleAvailable || isWholesaleShop) && (
                                <div className="pt-0.5">
                                  <span className="text-[9px] font-black bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-1.5 py-0.5 rounded-md inline-flex items-center gap-0.5">
                                    <span>🏢</span>
                                    <span>পাইকারি: ৳{p.wholesalePrice || Math.round(p.price * (1 - (business.wholesaleDiscountPercentage || 10) / 100))}</span>
                                    <span className="opacity-75 font-normal">({p.wholesaleMinQty || business.wholesaleMinQtyDefault || 5}+ {p.wholesaleUnit || 'পিস'})</span>
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Incremental Cart triggers */}
                            <div className="space-y-1.5 pt-1.5 border-t dark:border-slate-800/50">
                              {qtyInCart > 0 ? (
                                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl p-1">
                                  <button 
                                    onClick={() => updateCartQty(p.id, -1)}
                                    className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center text-xs shadow-xs hover:bg-slate-100"
                                  >
                                    -
                                  </button>
                                  <span className="font-bold text-xs text-slate-800 dark:text-slate-200 px-2">{qtyInCart}</span>
                                  <button 
                                    onClick={() => updateCartQty(p.id, 1)}
                                    className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center text-xs shadow-xs hover:bg-slate-100"
                                  >
                                    +
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => addToCart(p)}
                                  className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-extrabold text-[10px] py-1.5 px-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>{lang === 'bn' ? T.bn.addToCart : T.en.addToCart}</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* List View Style */
                  <div className="space-y-3">
                    {filteredProducts.map((p) => {
                      const isFav = wishlist.includes(p.id);
                      const qtyInCart = cart[p.id]?.quantity || 0;
                      return (
                        <div 
                          key={p.id}
                          className={`p-3 border rounded-2xl flex items-center gap-4 hover:shadow-md transition-all ${
                            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
                          }`}
                        >
                          <div 
                            onClick={() => handleOpenProductDetails(p)}
                            className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 cursor-pointer"
                          >
                            <img src={p.image} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 onClick={() => handleOpenProductDetails(p)} className="text-xs font-black text-slate-800 dark:text-slate-200 truncate cursor-pointer">{p.name}</h5>
                            <p className="text-[10px] text-slate-400 line-clamp-1">{p.description}</p>
                            <span className="text-xs font-extrabold text-emerald-600 block mt-1">৳ {p.price}</span>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <button
                              onClick={() => handleToggleWishlist(p.id)}
                              className={`p-1.5 rounded-full ${isFav ? 'text-rose-500' : 'text-slate-300'}`}
                            >
                              <Heart className="w-4 h-4 fill-current" />
                            </button>
                            
                            {qtyInCart > 0 ? (
                              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg p-0.5">
                                <button onClick={() => updateCartQty(p.id, -1)} className="w-5 h-5 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded">-</button>
                                <span className="text-xs font-bold dark:text-slate-200">{qtyInCart}</span>
                                <button onClick={() => updateCartQty(p.id, 1)} className="w-5 h-5 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded">+</button>
                              </div>
                            ) : (
                              <button
                                onClick={() => addToCart(p)}
                                className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] rounded-lg"
                              >
                                + {lang === 'bn' ? 'কার্ট' : 'Add'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              )
            )}

            {/* Delivery Area check panel inside store */}
            <div className={`p-5 rounded-3xl border ${
              darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50/50 border-slate-150'
            }`}>
              <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-blue-600" />
                <span>{lang === 'bn' ? T.bn.deliveryCheck : T.en.deliveryCheck}</span>
              </h4>
              <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                {lang === 'bn' ? 'আপনার এলাকায় আমরা হোম ডেলিভারি দিচ্ছি কি না তা চেক করুন।' : 'Check if we can deliver to your area.'}
              </p>
              
              <div className="flex gap-2 mt-3">
                <input
                  type="text"
                  placeholder={lang === 'bn' ? T.bn.deliveryCheckPlace : T.en.deliveryCheckPlace}
                  value={deliveryAreaQuery}
                  onChange={(e) => setDeliveryAreaQuery(e.target.value)}
                  className={`text-xs p-2.5 rounded-xl flex-1 focus:outline-none ${
                    darkMode ? 'bg-slate-800 text-white border border-slate-700' : 'bg-white text-slate-900 border border-slate-200'
                  }`}
                />
                <button
                  onClick={handleAreaCheck}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 rounded-xl cursor-pointer"
                >
                  {lang === 'bn' ? 'চেক করুন' : 'Check'}
                </button>
              </div>

              {deliveryCheckResult && (
                <div className="mt-3.5 text-[11px] font-bold">
                  {deliveryCheckResult === 'yes' ? (
                    <span className="text-emerald-600">{lang === 'bn' ? T.bn.deliverySuccess : T.en.deliverySuccess}</span>
                  ) : (
                    <span className="text-rose-500">{lang === 'bn' ? T.bn.deliveryFail : T.en.deliveryFail}</span>
                  )}
                </div>
              )}
            </div>

            {/* Frequently Asked Questions accordion */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-indigo-600" />
                <span>{lang === 'bn' ? T.bn.faq : T.en.faq}</span>
              </h4>
              <div className="space-y-2">
                {FAQS.map((faq, idx) => (
                  <details 
                    key={idx} 
                    className={`p-3.5 rounded-2xl border transition-all [&_summary::-webkit-details-marker]:hidden ${
                      darkMode ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-100 text-slate-800'
                    }`}
                  >
                    <summary className="font-bold text-xs cursor-pointer focus:outline-none flex justify-between items-center">
                      <span>{faq.q}</span>
                      <span className="text-slate-400 font-black">+</span>
                    </summary>
                    <p className="text-[11px] text-slate-400 mt-2 leading-relaxed font-medium">
                      {faq.a}
                    </p>
                  </details>
                ))}
              </div>
            </div>

            {/* Recently Viewed Products */}
            {recentlyViewed.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-wider">
                  ⏱️ {lang === 'bn' ? T.bn.recentlyViewed : T.en.recentlyViewed}
                </h4>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {recentlyViewed.map(p => (
                    <div 
                      key={p.id}
                      onClick={() => handleOpenProductDetails(p)}
                      className={`p-2 border rounded-xl flex items-center gap-2 shrink-0 max-w-[150px] cursor-pointer ${
                        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-100'
                      }`}
                    >
                      <img src={p.image} alt="" className="w-8 h-8 rounded object-cover" />
                      <span className="text-[10px] font-black truncate text-slate-700 dark:text-slate-300">{p.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ==================== TAB 2: WISHLIST VIEW ==================== */}
        {activeTab === 'wishlist' && (
          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-rose-500 fill-current" />
              <span>{lang === 'bn' ? T.bn.wishlist : T.en.wishlist}</span>
            </h3>

            {wishlist.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl space-y-3">
                <Heart className="w-10 h-10 text-slate-300 stroke-1 mx-auto" />
                <p className="text-xs text-slate-400">আপনার পছন্দের তালিকায় কোনো পণ্য সংরক্ষিত নেই।</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {business.products
                  .filter(p => wishlist.includes(p.id))
                  .map(p => (
                    <div 
                      key={p.id}
                      className={`p-3 border rounded-2xl flex items-center gap-4 ${
                        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
                      }`}
                    >
                      <img src={p.image} alt="" className="w-12 h-12 rounded-xl object-cover" />
                      <div className="flex-1 min-w-0 text-xs">
                        <h5 className="font-bold text-slate-800 dark:text-slate-200 truncate">{p.name}</h5>
                        <p className="text-emerald-600 font-extrabold mt-0.5">৳ {p.price}</p>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <button
                          onClick={() => {
                            addToCart(p);
                            alert(lang === 'bn' ? 'কার্টে যুক্ত করা হয়েছে!' : 'Added to Cart!');
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[10px] py-1 px-3 rounded-lg"
                        >
                          কার্ট
                        </button>
                        <button
                          onClick={() => handleToggleWishlist(p.id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 3: ORDER HISTORY / LIVE ORDER TRACKING ==================== */}
        {activeTab === 'track' && (
          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{lang === 'bn' ? T.bn.orderTrackTitle : T.en.orderTrackTitle}</span>
            </h3>

            {liveOrders.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl space-y-3">
                <Truck className="w-10 h-10 text-slate-300 stroke-1 mx-auto" />
                <p className="text-xs text-slate-400">{lang === 'bn' ? T.bn.orderNotFound : T.en.orderNotFound}</p>
              </div>
            ) : (
              <div className="space-y-5">
                {liveOrders.slice().reverse().map(order => {
                  const statusSteps = ['pending', 'accepted', 'processing', 'completed'];
                  const currentIdx = statusSteps.indexOf(order.status);
                  
                  return (
                    <div 
                      key={order.id} 
                      className={`p-5 border rounded-2xl space-y-4 ${
                        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50/50 border-slate-100'
                      }`}
                    >
                      <div className="flex justify-between items-center text-xs">
                        <div>
                          <span className="font-extrabold text-slate-800 dark:text-slate-200">অর্ডার আইডি: #{order.id}</span>
                          <p className="text-[10px] text-slate-400 mt-0.5">{new Date(order.createdAt).toLocaleString('bn-BD')}</p>
                        </div>
                        <span className="text-xs font-black text-blue-600">৳ {order.totalPrice}</span>
                      </div>

                      {/* Visual Stepper tracker bar */}
                      <div className="grid grid-cols-4 gap-2 pt-2 relative">
                        {statusSteps.map((step, idx) => {
                          const isActive = idx <= currentIdx;
                          const isCurrent = idx === currentIdx;
                          const stepLabel = 
                            step === 'pending' ? 'পেন্ডিং' : 
                            step === 'accepted' ? 'গৃহীত' : 
                            step === 'processing' ? 'প্যাকিং' : 'ডেলিভারি';

                          return (
                            <div key={step} className="flex flex-col items-center text-center space-y-1">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                                isCurrent 
                                  ? 'bg-amber-500 text-white ring-4 ring-amber-100 animate-pulse' 
                                  : (isActive ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400 dark:bg-slate-800')
                              }`}>
                                {isActive ? '✓' : idx + 1}
                              </div>
                              <span className={`text-[9px] font-black uppercase tracking-tight ${
                                isActive ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'
                              }`}>
                                {stepLabel}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Item list briefly */}
                      <div className={`p-3 rounded-xl text-xs space-y-1 border ${
                        darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-100'
                      }`}>
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-[11px]">
                            <span className="font-bold text-slate-500">{item.name} x{item.quantity}</span>
                            <span className="font-black text-slate-800 dark:text-slate-300">৳{item.price * item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 4: CUSTOMER ACCOUNT INFO ==================== */}
        {activeTab === 'account' && (
          <div className="space-y-5">
            <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-4 h-4 text-blue-600" />
              <span>গ্রাহক প্রোফাইল ও অ্যাকাউন্ট বুক (Customer Account)</span>
            </h3>

            {/* Account card and fields */}
            <div className={`p-5 rounded-2xl border space-y-4 ${
              darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
            }`}>
              <div className="flex items-center gap-3 border-b pb-3 dark:border-slate-800">
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black text-lg">
                  {currentUser.name.substring(0, 2)}
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">{currentUser.name}</h4>
                  <p className="text-[10px] text-slate-400 font-mono">{currentUser.phone}</p>
                </div>
              </div>

              {/* Address Book */}
              <div className="space-y-2 text-xs">
                <span className="font-extrabold text-slate-400 uppercase tracking-wider text-[9px] block">আমার ঠিকানা খাতা:</span>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-[11px] text-slate-700 dark:text-slate-200">ডিফল্ট ঠিকানা (Default Address)</span>
                    <p className="text-slate-500 text-[10px] mt-0.5">{address || 'ঠিকানা সেট করা হয়নি'}</p>
                  </div>
                </div>
              </div>

              {/* Saved payment methods mock */}
              <div className="space-y-2 text-xs">
                <span className="font-extrabold text-slate-400 uppercase tracking-wider text-[9px] block">সংরক্ষিত পেমেন্ট মেথড:</span>
                <div className="flex items-center gap-2 border dark:border-slate-800 p-3 rounded-xl text-[11px] text-slate-600 dark:text-slate-400 font-bold">
                  <Wallet className="w-4 h-4 text-emerald-600" />
                  <span>bKash Account: {currentUser.phone.substring(0, 4)}*****{currentUser.phone.substring(currentUser.phone.length - 2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 5: SUPPORT & POLICIES ==================== */}
        {activeTab === 'support' && (
          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              <span>সাহায্য ও সাপোর্ট সেন্টার (Support Center)</span>
            </h3>

            {/* Support Actions Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => triggerChatWithBusiness(business)}
                className="p-4 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 font-black text-xs flex items-center gap-2 cursor-pointer text-left"
              >
                <MessageCircle className="w-5 h-5 text-indigo-600" />
                <div>
                  <span className="block">সরাসরি চ্যাট মেসেজ করুন</span>
                  <p className="text-[10px] text-indigo-500/80 font-normal mt-0.5">মার্চেন্টের সাথে সরাসরি কথা বলুন</p>
                </div>
              </button>

              <a
                href={`tel:${business.phone}`}
                className="p-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 font-black text-xs flex items-center gap-2 cursor-pointer text-left"
              >
                <Phone className="w-5 h-5 text-emerald-600" />
                <div>
                  <span className="block">হেল্পলাইন নম্বরে কল দিন</span>
                  <p className="text-[10px] text-emerald-500/80 font-normal mt-0.5">২৪/৭ কাস্টমার কল সাপোর্ট</p>
                </div>
              </a>
            </div>

            {/* Return & Refund Policy Description */}
            <div className={`p-4 rounded-2xl border space-y-2 text-xs ${
              darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50/50 border-slate-150'
            }`}>
              <h4 className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>রিটার্ন ও রিফান্ড পলিসি (Return Policy)</span>
              </h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                ডেলিভারি ম্যানের কাছ থেকে চেক করার সময় যদি পণ্যে পচন, মেয়াদোত্তীর্ণ বা নিম্নমান পাওয়া যায়, তবে ডেলিভারি চার্জ ব্যতীত সরাসরি সাথে সাথেই পণ্য রিটার্ন করতে পারবেন। মূল্য পরিশোধ করা হয়ে থাকলে ২৪ ঘণ্টার মধ্যে বিকাশ/নগদ মাধ্যমে রিফান্ড সফলভাবে রি-ডিউ করা হবে।
              </p>
            </div>
          </div>
        )}

      </main>

      {/* ==================== POPUP 1: PRODUCT DETAILS MODAL ==================== */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`border rounded-3xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative animate-scale-up ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900'
          }`}>
            {/* Modal Header */}
            <div className="p-4 border-b dark:border-slate-800 flex justify-between items-center shrink-0">
              <span className="bg-indigo-50 dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 font-black text-[10px] px-2 py-0.5 rounded-md uppercase">
                {lang === 'bn' ? 'পণ্য বিবরণ' : 'Details'}
              </span>
              <button 
                onClick={() => setSelectedProduct(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1">
              
              {/* Image Gallery carousel list with mock alternate views */}
              <div className="space-y-2">
                <div className="aspect-video w-full bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden relative border dark:border-slate-800">
                  <img 
                    src={activeImageIdx === 0 ? selectedProduct.image : 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400'} 
                    alt="" 
                    className="w-full h-full object-cover" 
                  />
                  <span className="absolute bottom-3 right-3 bg-slate-900/60 text-white font-mono text-[9px] px-2 py-0.5 rounded-full">
                    View {activeImageIdx + 1}/2
                  </span>
                </div>
                {/* Thumbnails to simulate multi-image gallery selection */}
                <div className="flex gap-2 justify-center">
                  <button 
                    onClick={() => setActiveImageIdx(0)}
                    className={`w-12 h-12 rounded-lg border overflow-hidden p-0.5 transition-all ${activeImageIdx === 0 ? 'border-blue-600 scale-95 ring-2 ring-blue-100' : 'border-slate-200'}`}
                  >
                    <img src={selectedProduct.image} alt="" className="w-full h-full object-cover rounded-md" />
                  </button>
                  <button 
                    onClick={() => setActiveImageIdx(1)}
                    className={`w-12 h-12 rounded-lg border overflow-hidden p-0.5 transition-all ${activeImageIdx === 1 ? 'border-blue-600 scale-95 ring-2 ring-blue-100' : 'border-slate-200'}`}
                  >
                    <img src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400" alt="" className="w-full h-full object-cover rounded-md" />
                  </button>
                </div>
              </div>

              {/* Title & price content */}
              <div className="space-y-1">
                <div className="flex justify-between items-start gap-4">
                  <h4 className="text-sm font-black leading-snug">{selectedProduct.name}</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 shrink-0">
                    {lang === 'bn' ? T.bn.inStock : T.en.inStock} (৫ কেজি)
                  </span>
                </div>
                <div className="flex items-baseline gap-2 pt-1">
                  <span className="text-sm font-black text-emerald-600">৳ {selectedProduct.price}</span>
                  {selectedProduct.originalPrice && (
                    <span className="line-through text-xs text-slate-400 font-medium">৳ {selectedProduct.originalPrice}</span>
                  )}
                </div>

                {/* Wholesale info banner in product modal */}
                {(selectedProduct.isWholesaleAvailable || isWholesaleShop) && (
                  <div className="mt-2 p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-black text-indigo-900 dark:text-indigo-200">
                        <span>🏢 পাইকারি রেট:</span>
                        <span className="text-sm text-indigo-600 dark:text-indigo-400 font-black">
                          ৳ {selectedProduct.wholesalePrice || Math.round(selectedProduct.price * (1 - (business.wholesaleDiscountPercentage || 10) / 100))}
                        </span>
                        <span className="text-[10px] font-normal text-indigo-700 dark:text-indigo-300">
                          /{selectedProduct.wholesaleUnit || 'পিস'}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
                        মিনিমাম: {selectedProduct.wholesaleMinQty || business.wholesaleMinQtyDefault || 5} {selectedProduct.wholesaleUnit || 'পিস'}
                      </span>
                    </div>

                    {selectedProduct.wholesaleTiers && selectedProduct.wholesaleTiers.length > 0 && (
                      <div className="pt-1.5 border-t border-indigo-200/50 dark:border-indigo-800/40">
                        <span className="text-[9px] font-black uppercase tracking-wider text-indigo-800 dark:text-indigo-300 block mb-1">
                          📊 পরিমাণ অনুযায়ী বিশেষ পাইকারি ছাড় (Tier Pricing):
                        </span>
                        <div className="grid grid-cols-2 gap-1.5">
                          {selectedProduct.wholesaleTiers.map((tier, idx) => (
                            <div key={idx} className="bg-white/80 dark:bg-slate-900/60 p-1.5 rounded-lg border border-indigo-100 dark:border-indigo-900 flex justify-between items-center text-[10px]">
                              <span className="font-bold text-slate-700 dark:text-slate-300">{tier.minQty}+ {selectedProduct.wholesaleUnit || 'পিস'}:</span>
                              <span className="font-black text-emerald-600 dark:text-emerald-400">৳ {tier.price}/{selectedProduct.wholesaleUnit || 'পিস'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Product variants options select size / weight */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">
                  {lang === 'bn' ? T.bn.variants : T.en.variants}
                </span>
                <div className="flex gap-2">
                  {['500g', '1kg', '2kg', '5kg'].map(v => (
                    <button
                      key={v}
                      onClick={() => setSelectedVariant(v)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                        selectedVariant === v
                          ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                          : (darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Detailed specs description block */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">
                  {lang === 'bn' ? T.bn.specs : T.en.specs}
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  {selectedProduct.description || '১০০% বিশুদ্ধ এবং স্বাস্থ্যকর প্রক্রিয়ায় প্যাকেটজাত ও সংরক্ষিত করা পণ্য। কোনো কৃত্রিম প্রিজারভেটিভ বা কেমিক্যাল ব্যবহার করা হয়নি। দৈনিক রান্নায় বা খাদ্য তালিকায় পুষ্টি বাড়াতে অত্যন্ত কার্যকরী।'}
                </p>
              </div>

              {/* Related Products list */}
              <div className="space-y-2 border-t pt-4 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">
                  {lang === 'bn' ? T.bn.relatedProducts : T.en.relatedProducts}
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {business.products
                    .filter(p => p.id !== selectedProduct.id)
                    .slice(0, 3)
                    .map(item => (
                      <div 
                        key={item.id} 
                        onClick={() => handleOpenProductDetails(item)}
                        className={`p-2 border rounded-xl text-center space-y-1 cursor-pointer hover:shadow-xs ${
                          darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'
                        }`}
                      >
                        <img src={item.image} alt="" className="w-10 h-10 object-cover rounded mx-auto" />
                        <p className="text-[9px] font-bold truncate">{item.name}</p>
                        <span className="text-[9px] font-black text-emerald-600 block">৳ {item.price}</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Product Direct Actions */}
              <div className="space-y-2 pt-3">
                <button
                  onClick={() => {
                    addToCart(selectedProduct);
                    setSelectedProduct(null);
                    setShowCartDrawer(true);
                  }}
                  className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-extrabold text-xs py-3 rounded-xl cursor-pointer shadow-sm transition-all flex items-center justify-center gap-1.5"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{lang === 'bn' ? T.bn.addToCart : T.en.addToCart}</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleDirectBuyNow(selectedProduct)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-2.5 rounded-xl cursor-pointer transition-all"
                  >
                    {lang === 'bn' ? T.bn.buyNow : T.en.buyNow}
                  </button>
                  <a
                    href={`https://wa.me/${business.whatsapp || business.phone}?text=Hello, I want to order ${selectedProduct.name} for ৳${selectedProduct.price} from your shop via Rest Bazar!`}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5"
                  >
                    <MessageCircle className="w-4 h-4 fill-current" />
                    <span>WhatsApp Order</span>
                  </a>
                </div>
              </div>

              {/* Reviews submission inside product detail */}
              <form onSubmit={handleAddReviewSubmit} className="border-t pt-4 space-y-3 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">
                  {lang === 'bn' ? T.bn.writeReview : T.en.writeReview}
                </span>
                
                <div className="flex items-center gap-1">
                  <span>{lang === 'bn' ? T.bn.rating : T.en.rating}</span>
                  {[1, 2, 3, 4, 5].map(num => (
                    <button 
                      key={num} 
                      type="button" 
                      onClick={() => setReviewRating(num)}
                      className="text-amber-500 hover:scale-110"
                    >
                      ★{num <= reviewRating ? '★' : '☆'}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={2}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder={lang === 'bn' ? T.bn.comment : T.en.comment}
                  className={`w-full text-xs p-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border border-slate-200 text-slate-950'
                  }`}
                  required
                />
                
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] py-1.5 px-3 rounded-lg"
                >
                  {lang === 'bn' ? T.bn.submitReview : T.en.submitReview}
                </button>
              </form>

            </div>
          </div>
        </div>
      )}

      {/* ==================== POPUP 2: SHOPPING CART SLIDE DRAWER ==================== */}
      {showCartDrawer && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex justify-end">
          <div className={`w-full max-w-md h-full flex flex-col justify-between shadow-2xl relative animate-slide-left ${
            darkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'
          }`}>
            {/* Header */}
            <div className="p-4 border-b dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-blue-600" />
                <span>{lang === 'bn' ? T.bn.cartTitle : T.en.cartTitle}</span>
              </h3>
              <button 
                onClick={() => setShowCartDrawer(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            {/* Cart list container */}
            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              {cartItemCalculations.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <ShoppingBag className="w-12 h-12 text-slate-300 stroke-1 mx-auto" />
                  <p className="text-xs text-slate-400">আপনার কার্ট একদম খালি রয়েছে!</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {cartItemCalculations.map((item) => (
                    <div key={item.product.id} className="py-3.5 flex items-center gap-3">
                      <img src={item.product.image} alt="" className="w-12 h-12 object-cover rounded-xl border dark:border-slate-800 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h5 className="text-xs font-black truncate">{item.product.name}</h5>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs font-black text-slate-900 dark:text-slate-100">৳ {item.totalPrice}</span>
                          <span className="text-[10px] text-slate-400 font-bold">(৳{item.unitPrice}/{item.product.wholesaleUnit || 'টি'})</span>
                        </div>
                        {item.isWholesaleApplied && (
                          <div className="mt-1 flex flex-wrap items-center gap-1">
                            <span className="text-[9px] font-black bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.2 rounded inline-flex items-center gap-0.5">
                              <span>🏢 পাইকারি রেট</span>
                              {item.tierApplied && <span>({item.tierApplied.minQty}+ টিয়ার)</span>}
                            </span>
                            {item.wholesaleDiscountSavings > 0 && (
                              <span className="text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400">
                                ৳{item.wholesaleDiscountSavings} সাশ্রয়
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-lg p-0.5 shrink-0">
                        <button 
                          onClick={() => updateCartQty(item.product.id, -1)}
                          className="w-5 h-5 bg-white dark:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 rounded cursor-pointer"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold px-1.5">{item.quantity}</span>
                        <button 
                          onClick={() => updateCartQty(item.product.id, 1)}
                          className="w-5 h-5 bg-white dark:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 rounded cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Coupons and totals wrapper */}
            {cartItemCalculations.length > 0 && (
              <div className="p-5 border-t dark:border-slate-800 space-y-4 shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
                
                {/* Coupon check container */}
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder={lang === 'bn' ? T.bn.couponCode : T.en.couponCode}
                    value={couponCodeText}
                    onChange={(e) => setCouponCodeText(e.target.value)}
                    className={`text-xs p-2 rounded-lg flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500 border ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                    }`}
                  />
                  <button
                    onClick={handleApplyCoupon}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[10px] px-3 rounded-lg cursor-pointer"
                  >
                    {lang === 'bn' ? T.bn.apply : T.en.apply}
                  </button>
                </div>

                {/* Pricing Summary */}
                <div className="space-y-1.5 text-xs text-slate-500">
                  <div className="flex justify-between">
                    <span>{lang === 'bn' ? 'সাবটোটাল মূল্য' : 'Subtotal'}</span>
                    <span className="font-bold">৳ {cartSubtotal}</span>
                  </div>
                  {totalWholesaleSavings > 0 && (
                    <div className="flex justify-between text-indigo-600 dark:text-indigo-400 font-bold">
                      <span>🏢 পাইকারি মোট সাশ্রয়:</span>
                      <span className="font-extrabold">- ৳ {totalWholesaleSavings}</span>
                    </div>
                  )}
                  {cartDiscount > 0 && (
                    <div className="flex justify-between text-rose-500">
                      <span>{lang === 'bn' ? 'কুপন ডিসকাউন্ট' : 'Discount'} ({discountPercent}%)</span>
                      <span className="font-extrabold">- ৳ {cartDiscount}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>{lang === 'bn' ? T.bn.deliveryCharge : T.en.deliveryCharge}</span>
                    <span className="font-bold">৳ {deliveryCharge}</span>
                  </div>
                  <div className="border-t pt-2 mt-1.5 flex justify-between text-slate-800 dark:text-slate-100 font-black text-sm">
                    <span>{lang === 'bn' ? T.bn.total : T.en.total}</span>
                    <span className="text-blue-600 dark:text-blue-400">৳ {cartTotal}</span>
                  </div>
                </div>

                {/* Minimum wholesale order warning if applicable */}
                {isWholesaleShop && business.wholesaleMinOrderAmount && cartSubtotal < business.wholesaleMinOrderAmount && (
                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 text-[10px] leading-relaxed">
                    ⚠️ পাইকারি অর্ডারের জন্য ন্যূনতম অর্ডার মূল্য ৳{business.wholesaleMinOrderAmount} হতে হবে (বর্তমান সাবটোটাল: ৳{cartSubtotal})।
                  </div>
                )}

                {/* Checkout Trigger */}
                <button
                  onClick={() => {
                    if (isWholesaleShop && business.wholesaleMinOrderAmount && cartSubtotal < business.wholesaleMinOrderAmount) {
                      alert(`এই পাইকারি দোকানের ন্যূনতম অর্ডারের পরিমাণ ৳${business.wholesaleMinOrderAmount}। অনুগ্রহ করে আরও কিছু পণ্য যোগ করুন।`);
                      return;
                    }
                    setShowCartDrawer(false);
                    setShowCheckoutModal(true);
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3 rounded-xl cursor-pointer text-xs transition-all flex items-center justify-center gap-1.5"
                >
                  <span>{lang === 'bn' ? T.bn.checkout : T.en.checkout}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== POPUP 3: CHECKOUT MODAL ==================== */}
      {showCheckoutModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`border rounded-3xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative animate-scale-up ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900'
          }`}>
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b dark:border-slate-800 flex justify-between items-center shrink-0">
              <span className="bg-indigo-50 dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 font-black text-[10px] px-2 py-0.5 rounded-md uppercase">
                {lang === 'bn' ? 'নিরাপদ চেকআউট' : 'Secure Checkout'}
              </span>
              <button 
                onClick={() => {
                  setShowCheckoutModal(false);
                  setMfsStep('phone');
                }}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            {/* Scrollable form body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              
              {/* Delivery Address Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-600 dark:text-slate-400 block">
                  {lang === 'bn' ? T.bn.address : T.en.address} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="যেমন: বাসা-১২, রোড-০৫, ধানমন্ডি, ঢাকা"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className={`w-full text-xs p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 border ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-250 text-slate-950'
                  }`}
                  required
                />
              </div>

              {/* Order Notes Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-600 dark:text-slate-400 block">অর্ডার নোট বা বিশেষ নির্দেশনা (ঐচ্ছিক)</label>
                <textarea
                  rows={2}
                  placeholder="যেমন: ১ তলার গেটের সামনে রেখে কল দিবেন।"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className={`w-full text-xs p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 border resize-none ${
                    darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border border-slate-250 text-slate-950'
                  }`}
                />
              </div>

              {/* Payment Methods Selection Row */}
              <div className="space-y-2">
                <span className="text-xs font-extrabold text-slate-600 dark:text-slate-400 block">
                  {lang === 'bn' ? 'পেমেন্ট মেথড নির্বাচন করুন:' : 'Select Payment Method:'}
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setCheckoutPayment('bkash')}
                    className={`p-3 rounded-2xl border text-xs font-black flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      checkoutPayment === 'bkash'
                        ? 'bg-pink-50 dark:bg-pink-950/40 border-[#D12053] text-[#D12053] ring-2 ring-pink-300 dark:ring-pink-900/30'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-[#D12053]" />
                    <span>বিকাশ (bKash)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCheckoutPayment('nagad')}
                    className={`p-3 rounded-2xl border text-xs font-black flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      checkoutPayment === 'nagad'
                        ? 'bg-orange-50 dark:bg-orange-950/40 border-[#F7941D] text-[#F7941D] ring-2 ring-orange-300 dark:ring-orange-900/30'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-[#F7941D]" />
                    <span>নগদ (Nagad)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCheckoutPayment('rocket')}
                    className={`p-3 rounded-2xl border text-xs font-black flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      checkoutPayment === 'rocket'
                        ? 'bg-purple-50 dark:bg-purple-950/40 border-[#8C3494] text-[#8C3494] ring-2 ring-purple-300 dark:ring-purple-900/30'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-[#8C3494]" />
                    <span>রকেট (Rocket)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCheckoutPayment('cod')}
                    className={`p-3 rounded-2xl border text-xs font-black flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      checkoutPayment === 'cod'
                        ? 'bg-slate-900 text-white border-slate-900 ring-2 ring-slate-400'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <Truck className="w-4 h-4" />
                    <span>ক্যাশ অন ডেলিভারি</span>
                  </button>
                </div>
              </div>

              {/* Order total info review column */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded-2xl text-xs space-y-1.5">
                <span className="font-black text-slate-400 uppercase tracking-wide text-[9px]">বিলিং রিক্যাপ:</span>
                <div className="flex justify-between">
                  <span>পণ্য উপমোট মূল্য:</span>
                  <span className="font-bold">৳ {cartSubtotal}</span>
                </div>
                {totalWholesaleSavings > 0 && (
                  <div className="flex justify-between text-indigo-600 dark:text-indigo-400 font-bold">
                    <span>🏢 পাইকারি সাশ্রয়:</span>
                    <span className="font-extrabold">- ৳ {totalWholesaleSavings}</span>
                  </div>
                )}
                {cartDiscount > 0 && (
                  <div className="flex justify-between text-rose-500">
                    <span>কুপন ছাড়:</span>
                    <span className="font-extrabold">- ৳ {cartDiscount}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>ডেলিভারি খরচ:</span>
                  <span className="font-bold">৳ {deliveryCharge}</span>
                </div>
                <div className="border-t pt-2 mt-1.5 flex justify-between font-black text-slate-900 dark:text-slate-100 text-sm">
                  <span>পরিশোধযোগ্য সর্বমোট:</span>
                  <span className="text-blue-600 dark:text-blue-400">৳ {cartTotal}</span>
                </div>
              </div>

            </div>

            {/* Modal Bottom Sticky action footer */}
            <div className="p-4 border-t dark:border-slate-800 flex gap-3 shrink-0">
              <button
                onClick={() => {
                  setShowCheckoutModal(false);
                  setMfsStep('phone');
                }}
                className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-extrabold py-3 rounded-xl text-xs cursor-pointer text-center"
              >
                বাতিল করুন
              </button>
              <button
                onClick={handlePlaceOrder}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold py-3 rounded-xl text-xs cursor-pointer shadow-lg shadow-emerald-100 dark:shadow-none flex items-center justify-center gap-1"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {checkoutPayment === 'cod' 
                    ? `অর্ডার করুন (৳ ${cartTotal})` 
                    : `✓ ${checkoutPayment === 'bkash' ? 'বিকাশ' : checkoutPayment === 'nagad' ? 'নগদ' : 'রকেট'} পেমেন্ট সম্পন্ন করুন`}
                </span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ==================== POPUP 4: PRODUCT COMPARE MODAL ==================== */}
      {showCompareModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`border rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative animate-scale-up ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900'
          }`}>
            <div className="p-4 border-b dark:border-slate-800 flex justify-between items-center shrink-0">
              <h3 className="text-xs font-black uppercase tracking-wide flex items-center gap-1.5">
                <ArrowLeftRight className="w-4 h-4 text-orange-600" />
                <span>{lang === 'bn' ? T.bn.compareTitle : T.en.compareTitle}</span>
              </h3>
              <button 
                onClick={() => setShowCompareModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {compareIds.length < 2 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  {lang === 'bn' ? T.bn.noCompare : T.en.noCompare}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4 text-xs divide-x dark:divide-slate-800">
                  {business.products
                    .filter(p => compareIds.includes(p.id))
                    .map(p => (
                      <div key={p.id} className="px-3 space-y-4">
                        <img src={p.image} alt="" className="w-full h-24 object-cover rounded-xl border dark:border-slate-800" />
                        <div>
                          <h5 className="font-black text-slate-800 dark:text-slate-200 leading-snug">{p.name}</h5>
                          <span className="text-xs font-black text-emerald-600 block mt-1">৳ {p.price}</span>
                        </div>
                        <div className="space-y-1 text-[11px] text-slate-500">
                          <span className="font-extrabold block text-[9px] uppercase tracking-wider text-slate-400">বিবরণ (About):</span>
                          <p className="line-clamp-4">{p.description || '১০০% অরজিনাল পণ্য'}</p>
                        </div>
                        <div className="pt-2">
                          <button
                            onClick={() => {
                              addToCart(p);
                              alert('কার্টে যোগ করা হয়েছে!');
                            }}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-1.5 rounded-lg text-[10px]"
                          >
                            কার্ট-এ যোগ
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t dark:border-slate-800 flex justify-end shrink-0">
              <button 
                onClick={() => setCompareIds([])}
                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-extrabold text-xs py-2 px-4 rounded-xl"
              >
                তুলনা তালিকা পরিষ্কার করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Store Website View Modal */}
      {showWebsiteViewModal && business.websiteUrl && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 text-left animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-5xl h-[88vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
            {/* Modal Topbar */}
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center gap-3 shrink-0">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <span className="p-2 bg-indigo-600 text-white rounded-xl text-base shadow-sm">🌐</span>
                <div className="truncate">
                  <h3 className="text-sm font-black text-white truncate">
                    {business.name} - অফিশিয়াল ই-কমার্স লাইভ শপ
                  </h3>
                  <a
                    href={business.websiteUrl.startsWith('http') ? business.websiteUrl : `https://${business.websiteUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-indigo-300 font-mono hover:underline truncate block"
                  >
                    {business.websiteUrl}
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={business.websiteUrl.startsWith('http') ? business.websiteUrl : `https://${business.websiteUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black px-3.5 py-2 rounded-xl transition-all shadow-md flex items-center gap-1"
                >
                  <span>ব্রাউজারে খুলুন ↗</span>
                </a>
                <button
                  onClick={() => setShowWebsiteViewModal(false)}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm font-bold transition-all cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Embedded Iframe */}
            <div className="flex-1 bg-slate-100 dark:bg-slate-950 relative overflow-hidden">
              <iframe
                src={business.websiteUrl.startsWith('http') ? business.websiteUrl : `https://${business.websiteUrl}`}
                title={`${business.name} External Website`}
                className="w-full h-full border-0"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              />
              <div className="absolute bottom-3 right-3 bg-slate-900/90 text-white text-[10px] font-mono px-3 py-1.5 rounded-full shadow-lg backdrop-blur-md pointer-events-none flex items-center gap-1.5 border border-white/10">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Shop Web View
              </div>
            </div>
          </div>
        </div>
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
          shopName={business.name}
          shopPhone={business.phone}
          shopAddress={business.address}
        />
      )}

      {/* Bangladeshi Payment Gateway Modal for bKash, Nagad, Rocket */}
      {showStorePaymentGateway && (
        <BangladeshiPaymentGatewayModal
          isOpen={showStorePaymentGateway}
          onClose={() => setShowStorePaymentGateway(false)}
          amount={cartTotal}
          orderTitle={`${business.name} পণ্য অর্ডার`}
          businessName={business.name}
          businessPhone={business.phone}
          userPhone={currentUser?.phone || ''}
          userName={currentUser?.name || ''}
          defaultMethod={checkoutPayment === 'cod' ? 'bkash' : (checkoutPayment as 'bkash' | 'nagad' | 'rocket')}
          onPaymentSuccess={handleStorePaymentSuccess}
        />
      )}

    </div>
  );
}
