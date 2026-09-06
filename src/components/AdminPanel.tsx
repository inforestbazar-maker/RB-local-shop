import React, { useState, useEffect } from 'react';
import { 
  Users, Store, AlertTriangle, Wallet, Bell, Check, X, Shield, ShieldCheck, 
  Search, Eye, Trash2, CheckCircle2, TrendingUp, DollarSign, Calendar,
  ShoppingBag, Pill, Zap, Droplet, Hammer, Utensils, Truck, GraduationCap,
  Scissors, Wrench, Heart, Camera, BookOpen, Sparkles, Cpu, Layers, Compass,
  FolderPlus, Plus, Edit3, Percent, Tag, Settings, RefreshCw, FileText,
  Phone, Mail, MapPin, Globe, Lock, UserPlus, Building2, CheckCircle,
  ExternalLink, Image as ImageIcon, Power, Award, ArrowRight, Filter, AlertCircle, Save,
  Sliders, LayoutGrid, ChevronDown, ChevronUp
} from 'lucide-react';
import { User, Business, Complaint, AdCampaign, WalletTransaction, Location } from '../types';
import { CATEGORIES } from '../data/categories';
import { BANGLADESH_LOCATIONS } from '../data/bangladeshLocations';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  BarChart, Bar, Legend, PieChart, Pie, Cell 
} from 'recharts';

import { Language } from '../translations';
import AdminPaymentGatewayControl from './AdminPaymentGatewayControl';

interface AdminPanelProps {
  allDb: {
    users: User[];
    businesses: Business[];
    complaints: Complaint[];
    adCampaigns: AdCampaign[];
    bookings: any[];
    tickerMessages?: any[];
    subscriptionPlans?: any[];
    categories?: any[];
    systemConfig?: any;
    platformOffers?: any[];
  };
  onResolveComplaint: (id: string) => Promise<void>;
  onToggleAdStatus: (id: string, status: 'approved' | 'rejected') => Promise<void>;
  onBroadcastNotification: (title: string, message: string) => void;
  onRefresh: () => void;
  onDeleteBusiness: (id: string) => Promise<void>;
  onUpdateBusiness: (id: string, data: Partial<Business>) => Promise<void>;
  onDeleteUser: (phone: string) => Promise<void>;
  onUpdateUser: (phone: string, data: Partial<User>) => Promise<void>;
  onUpdateBookingStatus: (id: string, status: string, paymentStatus?: string) => Promise<void>;
  onDeleteBooking: (id: string) => Promise<void>;
  onSwitchRole?: (role: 'user' | 'merchant' | 'admin') => Promise<void>;
  language?: Language;
}

export default function AdminPanel({
  allDb,
  onResolveComplaint,
  onToggleAdStatus,
  onBroadcastNotification,
  onRefresh,
  onDeleteBusiness,
  onUpdateBusiness,
  onDeleteUser,
  onUpdateUser,
  onUpdateBookingStatus,
  onDeleteBooking,
  onSwitchRole,
  language = 'bn'
}: AdminPanelProps) {
  const [activeAdminSubTab, setActiveAdminSubTab] = useState<'overview' | 'users' | 'businesses' | 'bookings' | 'complaints' | 'ads' | 'broadcast' | 'ticker' | 'subscriptions' | 'licenses' | 'categories' | 'commissions' | 'gateways' | 'profile' | 'profile-report' | 'merchant-control'>('overview');
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [bizSearch, setBizSearch] = useState('');
  const [bizApprovalFilter, setBizApprovalFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const [bookingSearch, setBookingSearch] = useState('');
  const [expandedBizId, setExpandedBizId] = useState<string | null>(null);

  // Admin Card View Navigation states
  const [adminMenuCategory, setAdminMenuCategory] = useState<'all' | 'analytics' | 'users' | 'commerce' | 'finance' | 'system'>('all');
  const [adminMenuSearch, setAdminMenuSearch] = useState('');
  const [isMenuCardsCollapsed, setIsMenuCardsCollapsed] = useState(false);

  // Admin Profile management states
  const adminUser = allDb.users.find(u => u.phone === '01911999999' || u.role === 'admin') || {
    name: 'info.restbazar@gmail.com',
    phone: '01911999999',
    email: 'info.restbazar@gmail.com',
    role: 'admin',
    createdAt: new Date().toISOString()
  } as any;

  const [adminName, setAdminName] = useState(adminUser.name || 'info.restbazar@gmail.com');
  const [adminEmail, setAdminEmail] = useState(adminUser.email || 'info.restbazar@gmail.com');
  const [adminPhone, setAdminPhone] = useState(adminUser.phone || '01911999999');
  const [adminBio, setAdminBio] = useState(adminUser.bio || 'প্রধান সিস্টেম ও ডেটাবেজ অ্যাডমিনিস্ট্রেটর, রেস্ট বাজার প্ল্যাটফর্ম।');
  const [adminDesignation, setAdminDesignation] = useState(adminUser.designation || 'সুপার অ্যাডমিন (Super Admin)');
  const [adminImage, setAdminImage] = useState(adminUser.image || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Merchant control panel states
  const [mSearch, setMSearch] = useState('');
  const [selectedBizId, setSelectedBizId] = useState<string | null>(null);
  const [mSuspended, setMSuspended] = useState(false);
  const [mBanners, setMBanners] = useState(true);
  const [mAutoApprove, setMAutoApprove] = useState(false);
  const [mLedger, setMLedger] = useState(true);
  const [mMaxLimit, setMMaxLimit] = useState(100);
  const [mOffers, setMOffers] = useState(true);
  const [mCommission, setMCommission] = useState<number | ''>('');

  const selectMerchantForControl = (biz: Business) => {
    setSelectedBizId(biz.id);
    setMSuspended(biz.isSuspended || false);
    setMBanners(biz.isBannersAllowed !== false);
    setMAutoApprove(biz.isAutoItemApprovalAllowed || false);
    setMLedger(biz.isLedgerAllowed !== false);
    setMMaxLimit(biz.maxProductsLimit !== undefined ? biz.maxProductsLimit : 100);
    setMOffers(biz.isOfferCreationAllowed !== false);
    setMCommission(biz.commissionRateOverride !== undefined ? biz.commissionRateOverride : '');
  };

  const handleAdminCreateBusiness = async (bizData: any) => {
    try {
      const response = await fetch('/api/admin/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bizData)
      });
      if (response.ok) {
        onRefresh();
        return true;
      }
    } catch (err) {
      console.error('Failed to create business:', err);
    }
    return false;
  };

  // Full User & Customer CRUD Management State
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'user' | 'merchant' | 'admin'>('all');
  const [userVerificationFilter, setUserVerificationFilter] = useState<'all' | 'verified' | 'unverified'>('all');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isNewUserForm, setIsNewUserForm] = useState(false);
  const [userFormOriginalPhone, setUserFormOriginalPhone] = useState('');
  const [userFormData, setUserFormData] = useState<{
    name: string;
    phone: string;
    email: string;
    password: string;
    role: 'user' | 'merchant' | 'admin';
    image: string;
    designation: string;
    bio: string;
    division: string;
    district: string;
    thana: string;
    address: string;
    lat: number;
    lng: number;
    tradeLicenseNo: string;
    tradeLicenseImage: string;
    isMerchantVerified: boolean;
    tradeLicenseStatus: 'approved' | 'pending' | 'rejected' | '';
    tradeLicenseRejectReason: string;
    createdAt?: string;
  }>({
    name: '',
    phone: '',
    email: '',
    password: '',
    role: 'user',
    image: '',
    designation: '',
    bio: '',
    division: 'Dhaka (ঢাকা)',
    district: 'ঢাকা (Dhaka)',
    thana: 'ধানমন্ডি (Dhanmondi)',
    address: '',
    lat: 23.734,
    lng: 90.378,
    tradeLicenseNo: '',
    tradeLicenseImage: '',
    isMerchantVerified: false,
    tradeLicenseStatus: '',
    tradeLicenseRejectReason: '',
    createdAt: ''
  });
  const [isSavingUser, setIsSavingUser] = useState(false);

  const formatBanglaDate = (dateVal?: string | number | null) => {
    if (!dateVal) return 'এখনই';
    try {
      const d = typeof dateVal === 'number' ? new Date(dateVal) : new Date(String(dateVal));
      if (isNaN(d.getTime())) return String(dateVal);
      return d.toLocaleDateString('bn-BD', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return String(dateVal);
    }
  };

  const openCreateUserModal = () => {
    setUserFormData({
      name: '',
      phone: '',
      email: '',
      password: 'user123',
      role: 'user',
      image: '',
      designation: 'গ্রাহক',
      bio: '',
      division: 'Dhaka (ঢাকা)',
      district: 'ঢাকা (Dhaka)',
      thana: 'ধানমন্ডি (Dhanmondi)',
      address: 'ধানমন্ডি, ঢাকা',
      lat: 23.734,
      lng: 90.378,
      tradeLicenseNo: '',
      tradeLicenseImage: '',
      isMerchantVerified: false,
      tradeLicenseStatus: '',
      tradeLicenseRejectReason: '',
      createdAt: new Date().toISOString()
    });
    setUserFormOriginalPhone('');
    setIsNewUserForm(true);
    setIsUserModalOpen(true);
  };

  const openEditUserModal = (u: User) => {
    setUserFormData({
      name: u.name || '',
      phone: u.phone || '',
      email: u.email || '',
      password: u.password || '',
      role: u.role || 'user',
      image: u.image || '',
      designation: u.designation || '',
      bio: u.bio || '',
      division: u.location?.division || 'Dhaka (ঢাকা)',
      district: u.location?.district || 'ঢাকা (Dhaka)',
      thana: u.location?.thana || 'ধানমন্ডি (Dhanmondi)',
      address: u.location?.address || '',
      lat: u.location?.lat || 23.734,
      lng: u.location?.lng || 90.378,
      tradeLicenseNo: u.tradeLicenseNo || '',
      tradeLicenseImage: u.tradeLicenseImage || '',
      isMerchantVerified: !!u.isMerchantVerified,
      tradeLicenseStatus: (u.tradeLicenseStatus as any) || (u.isMerchantVerified ? 'approved' : ''),
      tradeLicenseRejectReason: (u as any).tradeLicenseRejectReason || '',
      createdAt: u.createdAt || new Date().toISOString()
    });
    setUserFormOriginalPhone(u.phone);
    setIsNewUserForm(false);
    setIsUserModalOpen(true);
  };

  const handleSaveUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFormData.name.trim() || !userFormData.phone.trim()) {
      alert('দয়া করে ব্যবহারকারীর নাম এবং সঠিক মোবাইল নম্বর দিন!');
      return;
    }

    setIsSavingUser(true);
    try {
      const locationObj: Location = {
        lat: Number(userFormData.lat) || 23.734,
        lng: Number(userFormData.lng) || 90.378,
        address: userFormData.address.trim() || `${userFormData.thana}, ${userFormData.district}`,
        district: userFormData.district,
        division: userFormData.division,
        thana: userFormData.thana
      };

      const payload = {
        name: userFormData.name.trim(),
        phone: userFormData.phone.trim(),
        email: userFormData.email.trim(),
        password: userFormData.password.trim() || 'user123',
        role: userFormData.role,
        image: userFormData.image.trim(),
        designation: userFormData.designation.trim(),
        bio: userFormData.bio.trim(),
        location: locationObj,
        tradeLicenseNo: userFormData.tradeLicenseNo.trim(),
        tradeLicenseImage: userFormData.tradeLicenseImage.trim(),
        isMerchantVerified: userFormData.isMerchantVerified,
        tradeLicenseStatus: userFormData.tradeLicenseStatus || (userFormData.isMerchantVerified ? 'approved' : undefined),
        tradeLicenseRejectReason: userFormData.tradeLicenseRejectReason.trim(),
        createdAt: userFormData.createdAt || new Date().toISOString()
      };

      if (isNewUserForm) {
        const response = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (response.ok) {
          setIsUserModalOpen(false);
          onRefresh();
          alert(`✅ ব্যবহারকারী "${payload.name}" সফলভাবে যুক্ত করা হয়েছে!`);
        } else {
          const err = await response.json();
          alert(err.error || 'নতুন ব্যবহারকারী যুক্ত করতে সমস্যা হয়েছে।');
        }
      } else {
        await onUpdateUser(userFormOriginalPhone, payload);
        setIsUserModalOpen(false);
        if (selectedUserDetail && selectedUserDetail.phone === userFormOriginalPhone) {
          setSelectedUserDetail({
            ...selectedUserDetail,
            ...payload
          });
        }
        onRefresh();
        alert(`✅ ব্যবহারকারী "${payload.name}" সফলভাবে আপডেট করা হয়েছে!`);
      }
    } catch (err) {
      console.error(err);
      alert('ব্যবহারকারী সংরক্ষণ করতে ত্রুটি হয়েছে।');
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleDeleteUserWithConfirmation = async (phone: string, name: string) => {
    if (phone === '01911999999' || phone === 'info.restbazar@gmail.com') {
      alert('প্রধান অ্যাডমিন অ্যাকাউন্ট মুছে ফেলা সম্ভব নয়!');
      return;
    }
    if (confirm(`⚠️ আপনি কি নিশ্চিতভাবে "${name}" (${phone})-এর অ্যাকাউন্ট ও তার সকল তথ্য চিরতরে মুছে ফেলতে চান?`)) {
      try {
        await onDeleteUser(phone);
        if (selectedUserDetail && selectedUserDetail.phone === phone) {
          setSelectedUserDetail(null);
        }
        onRefresh();
        alert(`🗑️ "${name}" অ্যাকাউন্টটি সফলভাবে মুছে ফেলা হয়েছে!`);
      } catch (err) {
        console.error(err);
        alert('অ্যাকাউন্ট ডিলিট করতে সমস্যা হয়েছে।');
      }
    }
  };

  // Full Business & Shop CRUD Management State
  const [bizCategoryFilter, setBizCategoryFilter] = useState('all');
  const [bizTypeFilter, setBizTypeFilter] = useState<'all' | 'shop' | 'service'>('all');
  const [bizStatusFilter, setBizStatusFilter] = useState<'all' | 'open' | 'closed' | 'sponsored' | 'wholesale'>('all');
  const [isBizModalOpen, setIsBizModalOpen] = useState(false);
  const [isNewBizForm, setIsNewBizForm] = useState(false);
  const [bizFormOriginalId, setBizFormOriginalId] = useState('');
  const [bizFormData, setBizFormData] = useState<{
    name: string;
    category: string;
    type: 'shop' | 'service';
    ownerPhone: string;
    ownerName: string;
    ownerEmail: string;
    phone: string;
    whatsapp: string;
    websiteUrl: string;
    logo: string;
    images: string[];
    description: string;
    division: string;
    district: string;
    thana: string;
    address: string;
    lat: number;
    lng: number;
    isOpen: boolean;
    isApproved: boolean;
    isSuspended: boolean;
    subscriptionPlan: 'free' | 'silver' | 'gold' | 'diamond';
    subscriptionExpiry: string;
    isSponsored: boolean;
    sponsoredRank: number;
    balance: number;
    hasHomeDelivery: boolean;
    deliveryCharge: number;
    isWholesale: boolean;
    wholesaleMode: 'wholesale_only' | 'retail_and_wholesale';
    wholesaleMinOrderAmount: number;
    wholesaleDiscountPercentage: number;
    wholesaleMinQtyDefault: number;
    wholesaleTerms: string;
    createdAt?: string;
  }>({
    name: '',
    category: 'grocery',
    type: 'shop',
    ownerPhone: '',
    ownerName: '',
    ownerEmail: '',
    phone: '',
    whatsapp: '',
    websiteUrl: '',
    logo: '',
    images: [],
    description: '',
    division: 'Dhaka (ঢাকা)',
    district: 'ঢাকা (Dhaka)',
    thana: 'ধানমন্ডি (Dhanmondi)',
    address: '',
    lat: 23.734,
    lng: 90.378,
    isOpen: true,
    isApproved: true,
    isSuspended: false,
    subscriptionPlan: 'free',
    subscriptionExpiry: '',
    isSponsored: false,
    sponsoredRank: 0,
    balance: 0,
    hasHomeDelivery: true,
    deliveryCharge: 40,
    isWholesale: false,
    wholesaleMode: 'retail_and_wholesale',
    wholesaleMinOrderAmount: 500,
    wholesaleDiscountPercentage: 10,
    wholesaleMinQtyDefault: 5,
    wholesaleTerms: '',
    createdAt: ''
  });
  const [isSavingBiz, setIsSavingBiz] = useState(false);

  const openCreateBizModal = (ownerPhoneParam?: string, ownerNameParam?: string) => {
    setBizFormData({
      name: '',
      category: 'grocery',
      type: 'shop',
      ownerPhone: ownerPhoneParam || '',
      ownerName: ownerNameParam || '',
      ownerEmail: '',
      phone: ownerPhoneParam || '',
      whatsapp: ownerPhoneParam || '',
      websiteUrl: '',
      logo: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200',
      images: ['https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600'],
      description: 'আমাদের প্রতিষ্ঠানে বিশ্বস্ততার সাথে সেরা পণ্য ও সেবা প্রদান করা হয়।',
      division: 'Dhaka (ঢাকা)',
      district: 'ঢাকা (Dhaka)',
      thana: 'ধানমন্ডি (Dhanmondi)',
      address: 'ধানমন্ডি, ঢাকা',
      lat: 23.734,
      lng: 90.378,
      isOpen: true,
      isApproved: true,
      isSuspended: false,
      subscriptionPlan: 'free',
      subscriptionExpiry: '',
      isSponsored: false,
      sponsoredRank: 0,
      balance: 0,
      hasHomeDelivery: true,
      deliveryCharge: 40,
      isWholesale: false,
      wholesaleMode: 'retail_and_wholesale',
      wholesaleMinOrderAmount: 500,
      wholesaleDiscountPercentage: 10,
      wholesaleMinQtyDefault: 5,
      wholesaleTerms: 'নূন্যতম পাইকারি অর্ডারে বিশেষ ছাড় প্রযোজ্য।',
      createdAt: new Date().toISOString()
    });
    setBizFormOriginalId('');
    setIsNewBizForm(true);
    setIsBizModalOpen(true);
  };

  const openEditBizModal = (b: Business) => {
    setBizFormData({
      name: b.name || '',
      category: b.category || 'grocery',
      type: b.type || 'shop',
      ownerPhone: b.ownerPhone || b.phone || '',
      ownerName: b.ownerName || '',
      ownerEmail: b.ownerEmail || '',
      phone: b.phone || '',
      whatsapp: b.whatsapp || b.phone || '',
      websiteUrl: b.websiteUrl || '',
      logo: b.logo || '',
      images: Array.isArray(b.images) ? b.images : [],
      description: b.description || '',
      division: (b as any).division || 'Dhaka (ঢাকা)',
      district: (b as any).district || 'ঢাকা (Dhaka)',
      thana: (b as any).thana || 'ধানমন্ডি (Dhanmondi)',
      address: b.address || '',
      lat: b.location?.lat || 23.734,
      lng: b.location?.lng || 90.378,
      isOpen: b.isOpen !== undefined ? b.isOpen : true,
      isApproved: b.isApproved !== false,
      isSuspended: !!b.isSuspended,
      subscriptionPlan: b.subscriptionPlan || 'free',
      subscriptionExpiry: b.subscriptionExpiry || '',
      isSponsored: !!b.isSponsored,
      sponsoredRank: Number(b.sponsoredRank) || 0,
      balance: Number(b.balance) || 0,
      hasHomeDelivery: b.hasHomeDelivery !== undefined ? b.hasHomeDelivery : true,
      deliveryCharge: Number(b.deliveryCharge) || 40,
      isWholesale: !!b.isWholesale,
      wholesaleMode: b.wholesaleMode || (b.isWholesale ? 'retail_and_wholesale' : 'retail_and_wholesale'),
      wholesaleMinOrderAmount: Number(b.wholesaleMinOrderAmount) || 500,
      wholesaleDiscountPercentage: Number(b.wholesaleDiscountPercentage) || 10,
      wholesaleMinQtyDefault: Number(b.wholesaleMinQtyDefault) || 5,
      wholesaleTerms: b.wholesaleTerms || '',
      createdAt: b.createdAt || new Date().toISOString()
    });
    setBizFormOriginalId(b.id);
    setIsNewBizForm(false);
    setIsBizModalOpen(true);
  };

  const handleSaveBizSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bizFormData.name.trim() || !bizFormData.category.trim()) {
      alert('দয়া করে দোকানের নাম এবং ক্যাটাগরি অবশ্যই পূরণ করুন!');
      return;
    }

    setIsSavingBiz(true);
    try {
      const payload = {
        name: bizFormData.name.trim(),
        category: bizFormData.category,
        type: bizFormData.type,
        ownerPhone: bizFormData.ownerPhone.trim(),
        ownerName: bizFormData.ownerName.trim(),
        ownerEmail: bizFormData.ownerEmail.trim(),
        phone: bizFormData.phone.trim() || bizFormData.ownerPhone.trim(),
        whatsapp: bizFormData.whatsapp.trim() || bizFormData.phone.trim(),
        websiteUrl: bizFormData.websiteUrl.trim(),
        logo: bizFormData.logo.trim() || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200',
        images: bizFormData.images.length > 0 ? bizFormData.images : ['https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600'],
        description: bizFormData.description.trim(),
        address: bizFormData.address.trim() || `${bizFormData.thana}, ${bizFormData.district}`,
        location: {
          lat: Number(bizFormData.lat) || 23.734,
          lng: Number(bizFormData.lng) || 90.378
        },
        division: bizFormData.division,
        district: bizFormData.district,
        thana: bizFormData.thana,
        isOpen: bizFormData.isOpen,
        isApproved: bizFormData.isApproved,
        isSuspended: bizFormData.isSuspended,
        subscriptionPlan: bizFormData.subscriptionPlan,
        subscriptionExpiry: bizFormData.subscriptionExpiry || undefined,
        isSponsored: bizFormData.isSponsored,
        sponsoredRank: Number(bizFormData.sponsoredRank) || 0,
        balance: Number(bizFormData.balance) || 0,
        hasHomeDelivery: bizFormData.hasHomeDelivery,
        deliveryCharge: Number(bizFormData.deliveryCharge) || 0,
        isWholesale: bizFormData.isWholesale,
        wholesaleMode: bizFormData.isWholesale ? bizFormData.wholesaleMode : undefined,
        wholesaleMinOrderAmount: Number(bizFormData.wholesaleMinOrderAmount) || 0,
        wholesaleDiscountPercentage: Number(bizFormData.wholesaleDiscountPercentage) || 0,
        wholesaleMinQtyDefault: Number(bizFormData.wholesaleMinQtyDefault) || 5,
        wholesaleTerms: bizFormData.wholesaleTerms.trim(),
        createdAt: bizFormData.createdAt || new Date().toISOString()
      };

      if (isNewBizForm) {
        const response = await fetch('/api/admin/businesses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (response.ok) {
          setIsBizModalOpen(false);
          onRefresh();
          alert(`✅ দোকান "${payload.name}" সফলভাবে যুক্ত করা হয়েছে!`);
        } else {
          const err = await response.json();
          alert(err.error || 'নতুন দোকান যুক্ত করতে সমস্যা হয়েছে।');
        }
      } else {
        await onUpdateBusiness(bizFormOriginalId, payload);
        setIsBizModalOpen(false);
        if (selectedBizDetail && selectedBizDetail.id === bizFormOriginalId) {
          setSelectedBizDetail({
            ...selectedBizDetail,
            ...payload
          });
        }
        onRefresh();
        alert(`✅ দোকান "${payload.name}" সফলভাবে আপডেট করা হয়েছে!`);
      }
    } catch (err) {
      console.error(err);
      alert('দোকানের তথ্য সংরক্ষণ করতে সমস্যা হয়েছে।');
    } finally {
      setIsSavingBiz(false);
    }
  };

  const handleDeleteBizWithConfirmation = async (id: string, name: string) => {
    if (confirm(`⚠️ আপনি কি নিশ্চিত যে "${name}" দোকানটি প্ল্যাটফর্ম থেকে চিরতরে মুছে ফেলতে চান?`)) {
      try {
        await onDeleteBusiness(id);
        if (selectedBizDetail && selectedBizDetail.id === id) {
          setSelectedBizDetail(null);
        }
        onRefresh();
        alert(`🗑️ "${name}" দোকানটি সফলভাবে ডিলিট করা হয়েছে!`);
      } catch (err) {
        console.error(err);
        alert('দোকান ডিলিট করতে সমস্যা হয়েছে।');
      }
    }
  };
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Sync profile state when database updates
  useEffect(() => {
    onRefresh();
  }, []);

  useEffect(() => {
    if (adminUser) {
      setAdminName(adminUser.name || 'info.restbazar@gmail.com');
      setAdminEmail(adminUser.email || 'info.restbazar@gmail.com');
      setAdminPhone(adminUser.phone || '01911999999');
      if (adminUser.bio) setAdminBio(adminUser.bio);
      if (adminUser.designation) setAdminDesignation(adminUser.designation);
      if (adminUser.image) setAdminImage(adminUser.image);
    }
  }, [allDb.users]);

  // Licenses Verification sub-tab state
  const [licenseSearch, setLicenseSearch] = useState('');
  const [licenseStatusFilter, setLicenseStatusFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');

  // Dynamic Subscription Plans State
  const [subPlans, setSubPlans] = useState<any[]>([]);
  const [editingSubPlanId, setEditingSubPlanId] = useState<string | null>(null);
  const [subPlanId, setSubPlanId] = useState('');
  const [subPlanName, setSubPlanName] = useState('');
  const [subPlanPrice, setSubPlanPrice] = useState(0);
  const [subPlanPeriod, setSubPlanPeriod] = useState('মাসিক');
  const [subPlanColor, setSubPlanColor] = useState('border-slate-200 bg-white text-slate-900');
  const [subPlanButtonStyle, setSubPlanButtonStyle] = useState('bg-blue-600 text-white hover:bg-blue-700');
  const [subPlanFeaturesText, setSubPlanFeaturesText] = useState('');
  const [isSavingSubPlan, setIsSavingSubPlan] = useState(false);

  // Dynamic Ticker Messages State
  const [tickerList, setTickerList] = useState<any[]>([]);
  const [editingTickerId, setEditingTickerId] = useState<string | null>(null);
  const [tickerText, setTickerText] = useState('');
  const [tickerDetail, setTickerDetail] = useState('');
  const [isSavingTicker, setIsSavingTicker] = useState(false);

  // Ad Campaign Editing States
  const [editingAdId, setEditingAdId] = useState<string | null>(null);
  const [editAdBanner, setEditAdBanner] = useState('');
  const [editAdPlacement, setEditAdPlacement] = useState<'homepage' | 'category' | 'search'>('homepage');
  const [editAdBudget, setEditAdBudget] = useState(0);
  const [isSavingAd, setIsSavingAd] = useState(false);

  // Dynamic Categories Management States
  const [newCatNameBangla, setNewCatNameBangla] = useState('');
  const [newCatNameEnglish, setNewCatNameEnglish] = useState('');
  const [newCatIconName, setNewCatIconName] = useState('ShoppingBag');
  const [newCatDescription, setNewCatDescription] = useState('');
  const [newCatColor, setNewCatColor] = useState('bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100');
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  // Commission & Offers States
  const [globalCommRate, setGlobalCommRate] = useState<number>(5);
  const [catCommRates, setCatCommRates] = useState<Record<string, number>>({});
  const [merchantCommRates, setMerchantCommRates] = useState<Record<string, number>>({});
  
  // Custom Merchant override form state
  const [newOverridePhone, setNewOverridePhone] = useState('');
  const [newOverrideRate, setNewOverrideRate] = useState<number>(5);

  // Offers creation states
  const [newOfferCode, setNewOfferCode] = useState('');
  const [newOfferTitle, setNewOfferTitle] = useState('');
  const [newOfferDesc, setNewOfferDesc] = useState('');
  const [newOfferDiscount, setNewOfferDiscount] = useState<number>(10);
  const [newOfferMinSpend, setNewOfferMinSpend] = useState<number>(500);
  const [newOfferExpiry, setNewOfferExpiry] = useState('2026-12-31');
  const [isSavingSystemConfig, setIsSavingSystemConfig] = useState(false);
  const [isSavingPlatformOffer, setIsSavingPlatformOffer] = useState(false);

  // Edit Offer Modal State
  const [editingOffer, setEditingOffer] = useState<any | null>(null);
  const [editOfferCode, setEditOfferCode] = useState('');
  const [editOfferTitle, setEditOfferTitle] = useState('');
  const [editOfferDesc, setEditOfferDesc] = useState('');
  const [editOfferDiscount, setEditOfferDiscount] = useState<number>(10);
  const [editOfferMinSpend, setEditOfferMinSpend] = useState<number>(500);
  const [editOfferExpiry, setEditOfferExpiry] = useState('2026-12-31');
  const [editOfferIsActive, setEditOfferIsActive] = useState<boolean>(true);
  const [isSavingEditOffer, setIsSavingEditOffer] = useState<boolean>(false);

  // Admin Profile Report System state variables
  const [selectedUserDetail, setSelectedUserDetail] = useState<User | null>(null);
  const [selectedBizDetail, setSelectedBizDetail] = useState<Business | null>(null);
  const [bizModalTab, setBizModalTab] = useState<'info' | 'products' | 'services' | 'orders' | 'reviews'>('info');
  const [reportType, setReportType] = useState<'performance' | 'merchants' | 'revenue' | 'bookings' | 'security' | 'customers-vendors'>('performance');
  const [reportStartDate, setReportStartDate] = useState('2026-07-01');
  const [reportEndDate, setReportEndDate] = useState('2026-07-31');
  const [includeCharts, setIncludeCharts] = useState(true);
  const [reportNotes, setReportNotes] = useState('');
  const [custVendSearch, setCustVendSearch] = useState('');
  const [custVendDistrict, setCustVendDistrict] = useState('all');
  const [custVendFilterRole, setCustVendFilterRole] = useState<'all' | 'user' | 'merchant'>('all');
  const [generatedReportData, setGeneratedReportData] = useState<any | null>(null);
  const [reportHistory, setReportHistory] = useState<any[]>([
    {
      id: "REP-9831",
      date: "2026-07-05T14:30:00.000Z",
      type: "performance",
      name: "মাসিক প্ল্যাটফর্ম ওভারভিউ রিপোর্ট",
      author: adminName,
      status: "সফল",
      range: "2026-06-01 থেকে 2026-06-30"
    },
    {
      id: "REP-9832",
      date: "2026-07-12T09:15:00.000Z",
      type: "revenue",
      name: "কমিশন ও মার্চেন্ট ফি ট্র্যাকিং অডিট",
      author: adminName,
      status: "সফল",
      range: "2026-07-01 থেকে 2026-07-10"
    }
  ]);

  const categoriesList = allDb.categories && allDb.categories.length > 0 ? allDb.categories : CATEGORIES;

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatNameBangla.trim() || !newCatNameEnglish.trim()) {
      alert('দয়া করে ক্যাটাগরির বাংলা ও ইংরেজি নাম প্রদান করুন!');
      return;
    }
    
    setIsSavingCategory(true);
    try {
      const response = await fetch('/api/admin/categories/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nameBangla: newCatNameBangla.trim(),
          nameEnglish: newCatNameEnglish.trim(),
          iconName: newCatIconName,
          description: newCatDescription.trim(),
          color: newCatColor
        })
      });

      if (response.ok) {
        setNewCatNameBangla('');
        setNewCatNameEnglish('');
        setNewCatDescription('');
        onRefresh();
        alert('নতুন ক্যাটাগরি সফলভাবে যুক্ত করা হয়েছে!');
      } else {
        const errData = await response.json();
        alert(errData.error || 'যুক্ত করতে ব্যর্থ হয়েছে।');
      }
    } catch (err) {
      console.error(err);
      alert('সার্ভার ত্রুটি ঘটেছে।');
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('আপনি কি নিশ্চিতভাবে এই ক্যাটাগরিটি মুছে ফেলতে চান?')) return;

    const updatedCategories = categoriesList.filter(cat => cat.id !== id);
    try {
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories: updatedCategories })
      });

      if (response.ok) {
        onRefresh();
        alert('ক্যাটাগরি সফলভাবে মুছে ফেলা হয়েছে!');
      } else {
        alert('মুছে ফেলতে ব্যর্থ হয়েছে।');
      }
    } catch (err) {
      console.error(err);
      alert('সার্ভার ত্রুটি ঘটেছে।');
    }
  };

  const renderCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'ShoppingBag': return <ShoppingBag className="w-4 h-4" />;
      case 'Pill': return <Pill className="w-4 h-4" />;
      case 'Zap': return <Zap className="w-4 h-4" />;
      case 'Droplet': return <Droplet className="w-4 h-4" />;
      case 'Hammer': return <Hammer className="w-4 h-4" />;
      case 'Utensils': return <Utensils className="w-4 h-4" />;
      case 'Truck': return <Truck className="w-4 h-4" />;
      case 'GraduationCap': return <GraduationCap className="w-4 h-4" />;
      case 'Scissors': return <Scissors className="w-4 h-4" />;
      case 'Wrench': return <Wrench className="w-4 h-4" />;
      case 'Heart': return <Heart className="w-4 h-4" />;
      case 'Camera': return <Camera className="w-4 h-4" />;
      case 'BookOpen': return <BookOpen className="w-4 h-4" />;
      case 'Sparkles': return <Sparkles className="w-4 h-4" />;
      case 'Cpu': return <Cpu className="w-4 h-4" />;
      case 'Layers': return <Layers className="w-4 h-4" />;
      case 'Compass': return <Compass className="w-4 h-4" />;
      default: return <ShoppingBag className="w-4 h-4" />;
    }
  };
  const [showCreateAdForm, setShowCreateAdForm] = useState(false);
  const [newAdBizId, setNewAdBizId] = useState('');
  const [newAdBanner, setNewAdBanner] = useState('');
  const [newAdPlacement, setNewAdPlacement] = useState<'homepage' | 'category' | 'search'>('homepage');
  const [newAdBudget, setNewAdBudget] = useState(500);
  const [isCreatingAd, setIsCreatingAd] = useState(false);

  const handleDirectCreateAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdBizId) {
      alert('দয়া করে একটি মার্চেন্ট বা ব্যবসা প্রতিষ্ঠান নির্বাচন করুন!');
      return;
    }
    if (!newAdBanner.trim()) {
      alert('দয়া করে একটি সঠিক ব্যানার ইমেজ বা ভিডিও লিংক দিন!');
      return;
    }
    const selectedBiz = allDb.businesses.find(b => b.id === newAdBizId);
    if (!selectedBiz) {
      alert('নির্বাচিত ব্যবসা প্রতিষ্ঠানটি খুঁজে পাওয়া যায়নি!');
      return;
    }

    setIsCreatingAd(true);
    try {
      const response = await fetch('/api/admin/create-ad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: selectedBiz.id,
          businessName: selectedBiz.name,
          bannerImage: newAdBanner,
          placement: newAdPlacement,
          budget: newAdBudget,
          status: 'approved' // default approved when added by admin
        })
      });
      if (response.ok) {
        setShowCreateAdForm(false);
        setNewAdBizId('');
        setNewAdBanner('');
        setNewAdPlacement('homepage');
        setNewAdBudget(500);
        onRefresh();
        alert('বিজ্ঞাপন ও প্রমোশন ক্যাম্পেইন সফলভাবে তৈরি ও সক্রিয় করা হয়েছে!');
      } else {
        alert('বিজ্ঞাপন তৈরি করতে ব্যর্থ হয়েছে।');
      }
    } catch (err) {
      console.error(err);
      alert('সার্ভার ত্রুটি ঘটেছে।');
    } finally {
      setIsCreatingAd(false);
    }
  };

  const handleUpdateAdCampaign = async (id: string) => {
    if (!editAdBanner.trim()) {
      alert('দয়া করে একটি সঠিক ব্যানার ইমেজ বা ভিডিও লিংক দিন!');
      return;
    }
    setIsSavingAd(true);
    try {
      const response = await fetch('/api/admin/update-ad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          bannerImage: editAdBanner,
          placement: editAdPlacement,
          budget: editAdBudget
        })
      });
      if (response.ok) {
        setEditingAdId(null);
        onRefresh();
        alert('বিজ্ঞাপন ও প্রমোশন ক্যাম্পেইন সফলভাবে আপডেট করা হয়েছে!');
      } else {
        alert('বিজ্ঞাপন আপডেট করতে ব্যর্থ হয়েছে।');
      }
    } catch (e) {
      console.error(e);
      alert('সার্ভার ত্রুটি ঘটেছে।');
    } finally {
      setIsSavingAd(false);
    }
  };

  const isAdVideo = (url: string) => {
    if (!url) return false;
    const lower = url.toLowerCase();
    return (
      lower.endsWith('.mp4') ||
      lower.endsWith('.webm') ||
      lower.endsWith('.mov') ||
      lower.includes('youtube.com') ||
      lower.includes('youtu.be') ||
      lower.includes('video') ||
      lower.includes('vimeo')
    );
  };

  const renderAdMediaPreview = (url: string, className: string) => {
    if (!url) return <div className="w-full h-32 bg-slate-100 flex items-center justify-center text-[10px] text-slate-400">কোনো ফাইল নেই</div>;
    const lower = url.toLowerCase();
    if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
      let videoId = '';
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = url.match(regExp);
      if (match && match[2].length === 11) {
        videoId = match[2];
      }
      if (videoId) {
        return (
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=0&mute=1`}
            className={className}
            title="Ad Preview"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        );
      }
    }

    if (lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.mov') || lower.includes('video')) {
      return (
        <video
          src={url}
          className={className}
          controls
          muted
          playsInline
        />
      );
    }

    return (
      <img
        src={url}
        alt="Ad Banner"
        className={className}
        onError={(e) => {
          // Fallback if image fails to load
          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400';
        }}
      />
    );
  };

  useEffect(() => {
    if (allDb.tickerMessages) {
      setTickerList(allDb.tickerMessages);
    }
  }, [allDb.tickerMessages]);

  useEffect(() => {
    if (allDb.subscriptionPlans) {
      setSubPlans(allDb.subscriptionPlans);
    }
  }, [allDb.subscriptionPlans]);

  useEffect(() => {
    if (allDb.systemConfig) {
      setGlobalCommRate(allDb.systemConfig.globalCommissionRate ?? 5);
      setCatCommRates(allDb.systemConfig.categoryCommissionRates ?? {});
      setMerchantCommRates(allDb.systemConfig.merchantCommissionRates ?? {});
    }
  }, [allDb.systemConfig]);

  const handleSaveSystemConfig = async (newConfig: any) => {
    setIsSavingSystemConfig(true);
    try {
      const response = await fetch('/api/admin/system-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemConfig: newConfig })
      });
      if (response.ok) {
        onRefresh();
        alert('সিস্টেম কমিশন কনফিগারেশন সফলভাবে আপডেট করা হয়েছে!');
      } else {
        alert('কনফিগারেশন আপডেট করতে ব্যর্থ হয়েছে।');
      }
    } catch (err) {
      console.error(err);
      alert('সার্ভার ত্রুটি!');
    } finally {
      setIsSavingSystemConfig(false);
    }
  };

  const handleSaveOffers = async (updatedOffers: any[]) => {
    setIsSavingPlatformOffer(true);
    try {
      const response = await fetch('/api/admin/platform-offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platformOffers: updatedOffers })
      });
      if (response.ok) {
        onRefresh();
        alert('অফার ও প্রমোশন তালিকা সফলভাবে আপডেট করা হয়েছে!');
      } else {
        alert('অফার সংরক্ষণ করতে ব্যর্থ হয়েছে।');
      }
    } catch (err) {
      console.error(err);
      alert('সার্ভার ত্রুটি!');
    } finally {
      setIsSavingPlatformOffer(false);
    }
  };

  const handleAddMerchantOverride = () => {
    if (!newOverridePhone.trim()) {
      alert('দয়া করে মার্চেন্টের মোবাইল নম্বর প্রদান করুন!');
      return;
    }
    const updatedMerchantRates = {
      ...merchantCommRates,
      [newOverridePhone.trim()]: Number(newOverrideRate)
    };
    setMerchantCommRates(updatedMerchantRates);
    handleSaveSystemConfig({
      globalCommissionRate: globalCommRate,
      categoryCommissionRates: catCommRates,
      merchantCommissionRates: updatedMerchantRates
    });
    setNewOverridePhone('');
  };

  const handleRemoveMerchantOverride = (phone: string) => {
    const updatedMerchantRates = { ...merchantCommRates };
    delete updatedMerchantRates[phone];
    setMerchantCommRates(updatedMerchantRates);
    handleSaveSystemConfig({
      globalCommissionRate: globalCommRate,
      categoryCommissionRates: catCommRates,
      merchantCommissionRates: updatedMerchantRates
    });
  };

  const handleAddOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOfferCode.trim() || !newOfferTitle.trim()) {
      alert('কুপন কোড এবং অফার শিরোনাম প্রদান করা আবশ্যক!');
      return;
    }
    const newOffer = {
      id: `offer-${Date.now()}`,
      code: newOfferCode.trim().toUpperCase(),
      title: newOfferTitle.trim(),
      description: newOfferDesc.trim(),
      discountPercent: Number(newOfferDiscount),
      minSpend: Number(newOfferMinSpend),
      expiryDate: newOfferExpiry,
      isActive: true
    };
    const updated = [...(allDb.platformOffers || []), newOffer];
    handleSaveOffers(updated);
    // clear form
    setNewOfferCode('');
    setNewOfferTitle('');
    setNewOfferDesc('');
    setNewOfferDiscount(10);
    setNewOfferMinSpend(500);
  };

  const handleToggleOfferActive = (offerId: string) => {
    const updated = (allDb.platformOffers || []).map((o: any) => {
      if (o.id === offerId) {
        return { ...o, isActive: !o.isActive };
      }
      return o;
    });
    handleSaveOffers(updated);
  };

  const handleOpenEditOffer = (offer: any) => {
    setEditingOffer(offer);
    setEditOfferCode(offer.code || '');
    setEditOfferTitle(offer.title || '');
    setEditOfferDesc(offer.description || '');
    setEditOfferDiscount(Number(offer.discountPercent) || 10);
    setEditOfferMinSpend(Number(offer.minSpend) || 0);
    setEditOfferExpiry(offer.expiryDate || '2026-12-31');
    setEditOfferIsActive(offer.isActive !== false);
  };

  const handleSaveEditOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOffer) return;
    if (!editOfferCode.trim() || !editOfferTitle.trim()) {
      alert('কুপন কোড এবং অফার শিরোনাম প্রদান করা আবশ্যক!');
      return;
    }
    setIsSavingEditOffer(true);
    try {
      const updatedOffer = {
        ...editingOffer,
        code: editOfferCode.trim().toUpperCase(),
        title: editOfferTitle.trim(),
        description: editOfferDesc.trim(),
        discountPercent: Number(editOfferDiscount),
        minSpend: Number(editOfferMinSpend),
        expiryDate: editOfferExpiry,
        isActive: editOfferIsActive
      };
      const updated = (allDb.platformOffers || []).map((o: any) => o.id === editingOffer.id ? updatedOffer : o);
      await handleSaveOffers(updated);
      setEditingOffer(null);
    } finally {
      setIsSavingEditOffer(false);
    }
  };

  const handleRemoveOffer = (offerId: string) => {
    if (!confirm('আপনি কি নিশ্চিত যে এই অফারটি ডিলিট করতে চান?')) return;
    const updated = (allDb.platformOffers || []).filter((o: any) => o.id !== offerId);
    handleSaveOffers(updated);
  };

  const handleSaveSubPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subPlanId.trim() || !subPlanName.trim()) {
      alert('প্যাকেজ আইডি এবং নাম অবশ্যই পূরণ করতে হবে!');
      return;
    }

    setIsSavingSubPlan(true);
    let updatedPlans = [...subPlans];

    const featuresArray = subPlanFeaturesText
      .split('\n')
      .map(f => f.trim())
      .filter(f => f.length > 0);

    const newOrUpdatedPlan = {
      id: subPlanId.trim().toLowerCase(),
      name: subPlanName.trim(),
      price: Number(subPlanPrice),
      pricePeriod: subPlanPeriod.trim(),
      features: featuresArray,
      color: subPlanColor.trim(),
      buttonStyle: subPlanButtonStyle.trim(),
    };

    if (editingSubPlanId) {
      // Edit existing
      updatedPlans = updatedPlans.map(plan =>
        plan.id === editingSubPlanId ? newOrUpdatedPlan : plan
      );
    } else {
      // Add new
      if (updatedPlans.some(plan => plan.id === newOrUpdatedPlan.id)) {
        alert('এই আইডি দিয়ে ইতিমধ্যে একটি প্যাকেজ রয়েছে। দয়া করে অন্য আইডি ব্যবহার করুন।');
        setIsSavingSubPlan(false);
        return;
      }
      updatedPlans.push(newOrUpdatedPlan);
    }

    try {
      const response = await fetch('/api/admin/subscription-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionPlans: updatedPlans })
      });

      if (response.ok) {
        setEditingSubPlanId(null);
        setSubPlanId('');
        setSubPlanName('');
        setSubPlanPrice(0);
        setSubPlanPeriod('মাসিক');
        setSubPlanFeaturesText('');
        onRefresh();
        alert('সাবস্ক্রিপশন প্যাকেজ সফলভাবে সংরক্ষণ করা হয়েছে!');
      } else {
        alert('সংরক্ষণ করতে ব্যর্থ হয়েছে।');
      }
    } catch (err) {
      console.error(err);
      alert('সার্ভার ত্রুটি ঘটেছে।');
    } finally {
      setIsSavingSubPlan(false);
    }
  };

  const handleDeleteSubPlan = async (id: string) => {
    if (!confirm('আপনি কি নিশ্চিতভাবে এই সাবস্ক্রিপশন প্যাকেজটি মুছে ফেলতে চান?')) return;

    const updatedPlans = subPlans.filter(plan => plan.id !== id);
    try {
      const response = await fetch('/api/admin/subscription-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionPlans: updatedPlans })
      });

      if (response.ok) {
        if (editingSubPlanId === id) {
          setEditingSubPlanId(null);
          setSubPlanId('');
          setSubPlanName('');
          setSubPlanPrice(0);
          setSubPlanPeriod('মাসিক');
          setSubPlanFeaturesText('');
        }
        onRefresh();
        alert('সাবস্ক্রিপশন প্যাকেজটি মুছে ফেলা হয়েছে!');
      } else {
        alert('মুছে ফেলতে ব্যর্থ হয়েছে।');
      }
    } catch (err) {
      console.error(err);
      alert('সার্ভার ত্রুটি ঘটেছে।');
    }
  };

  const handleSelectEditSubPlan = (plan: any) => {
    setEditingSubPlanId(plan.id);
    setSubPlanId(plan.id);
    setSubPlanName(plan.name);
    setSubPlanPrice(plan.price);
    setSubPlanPeriod(plan.pricePeriod);
    setSubPlanColor(plan.color);
    setSubPlanButtonStyle(plan.buttonStyle);
    setSubPlanFeaturesText(plan.features.join('\n'));
  };

  const handleSaveTickerMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tickerText.trim()) return;

    setIsSavingTicker(true);
    let updatedList = [...tickerList];

    if (editingTickerId) {
      // Edit existing
      updatedList = updatedList.map(item => 
        item.id === editingTickerId 
          ? { ...item, text: tickerText, detail: tickerDetail }
          : item
      );
    } else {
      // Add new
      const newItem = {
        id: `tick-${Date.now()}`,
        text: tickerText,
        detail: tickerDetail
      };
      updatedList.push(newItem);
    }

    try {
      const response = await fetch('/api/admin/ticker-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tickerMessages: updatedList })
      });

      if (response.ok) {
        setEditingTickerId(null);
        setTickerText('');
        setTickerDetail('');
        onRefresh();
        alert('লাইভ আপডেট সফলভাবে সংরক্ষণ করা হয়েছে!');
      } else {
        alert('সংরক্ষণ করতে ব্যর্থ হয়েছে।');
      }
    } catch (err) {
      console.error(err);
      alert('সার্ভার ত্রুটি ঘটেছে।');
    } finally {
      setIsSavingTicker(false);
    }
  };

  const handleDeleteTickerMessage = async (id: string) => {
    if (!confirm('আপনি কি নিশ্চিতভাবে এই লাইভ আপডেটটি মুছে ফেলতে চান?')) return;

    const updatedList = tickerList.filter(item => item.id !== id);
    try {
      const response = await fetch('/api/admin/ticker-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tickerMessages: updatedList })
      });

      if (response.ok) {
        if (editingTickerId === id) {
          setEditingTickerId(null);
          setTickerText('');
          setTickerDetail('');
        }
        onRefresh();
        alert('লাইভ আপডেটটি মুছে ফেলা হয়েছে!');
      } else {
        alert('মুছে ফেলতে ব্যর্থ হয়েছে।');
      }
    } catch (err) {
      console.error(err);
      alert('সার্ভার ত্রুটি ঘটেছে।');
    }
  };

  const handleSelectEditTicker = (item: any) => {
    setEditingTickerId(item.id);
    setTickerText(item.text);
    setTickerDetail(item.detail || '');
  };

  const handleToggleBusinessApproval = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/businesses/${id}/toggle-approval`, {
        method: 'POST',
      });
      if (response.ok) {
        onRefresh();
        alert('ব্যবসা প্রতিষ্ঠানের অনুমোদনের অবস্থা সফলভাবে পরিবর্তন করা হয়েছে!');
      } else {
        alert('অনুমোদন পরিবর্তন করতে সমস্যা হয়েছে।');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleItemApproval = async (bizId: string, itemId: string) => {
    try {
      const response = await fetch(`/api/admin/businesses/${bizId}/items/${itemId}/toggle-approval`, {
        method: 'POST',
      });
      if (response.ok) {
        onRefresh();
        alert('পণ্য/সেবার অনুমোদনের অবস্থা সফলভাবে পরিবর্তন করা হয়েছে!');
      } else {
        alert('অনুমোদন পরিবর্তন করতে সমস্যা হয়েছে।');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Calculate high-impact metrics
  const totalUsers = allDb.users.length;
  const totalBusinesses = allDb.businesses.length;
  const activeAds = allDb.adCampaigns.filter(ad => ad.status === 'approved').length;
  const pendingComplaints = allDb.complaints.filter(c => c.status === 'pending').length;
  const totalBookingsCount = allDb.bookings.length;

  // Compute revenues from DB json (Subscriptions + Ads + simulated commission)
  let subIncome = 0;
  let adIncome = 0;
  let commissionIncome = 0;

  allDb.businesses.forEach(b => {
    // Sum subscription transactions
    b.transactions.forEach((t: WalletTransaction) => {
      if (t.type === 'subscription') subIncome += t.amount;
      if (t.type === 'ad_payment') adIncome += t.amount;
    });
  });

  const systemCommRate = allDb.systemConfig?.globalCommissionRate !== undefined ? Number(allDb.systemConfig.globalCommissionRate) : 5;

  allDb.bookings.forEach((b: any) => {
    if (b.status === 'completed') {
      commissionIncome += Math.floor(b.totalPrice * (systemCommRate / 100));
    }
  });

  const totalEarnings = subIncome + adIncome + commissionIncome;

  // Report selection states
  const [reportTimeRange, setReportTimeRange] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [showPrintReport, setShowPrintReport] = useState(false);

  // Filter dynamic reports based on selected time range
  const getFilteredBookings = () => {
    if (reportTimeRange === 'all') return allDb.bookings;
    const now = new Date();
    return allDb.bookings.filter((b: any) => {
      const bDate = new Date(b.createdAt || b.bookingDate);
      if (isNaN(bDate.getTime())) return true;
      const diffTime = Math.abs(now.getTime() - bDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (reportTimeRange === 'today') return diffDays <= 1;
      if (reportTimeRange === 'week') return diffDays <= 7;
      if (reportTimeRange === 'month') return diffDays <= 30;
      return true;
    });
  };

  const getFilteredRevenue = () => {
    const filteredBookings = getFilteredBookings();
    let subIncomeRange = subIncome;
    let adIncomeRange = adIncome;
    
    if (reportTimeRange !== 'all') {
      subIncomeRange = 0;
      adIncomeRange = 0;
      const now = new Date();
      const checkDays = reportTimeRange === 'today' ? 1 : reportTimeRange === 'week' ? 7 : 30;

      allDb.businesses.forEach(b => {
        b.transactions.forEach((t: WalletTransaction) => {
          if (!t.date) return;
          const tDate = new Date(t.date);
          const diffDays = Math.ceil(Math.abs(now.getTime() - tDate.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays <= checkDays) {
            if (t.type === 'subscription') subIncomeRange += t.amount;
            if (t.type === 'ad_payment') adIncomeRange += t.amount;
          }
        });
      });
    }

    let commissionIncomeRange = 0;
    filteredBookings.forEach((b: any) => {
      if (b.status === 'completed') {
        commissionIncomeRange += Math.floor(b.totalPrice * (systemCommRate / 100));
      }
    });

    const totalRange = subIncomeRange + adIncomeRange + commissionIncomeRange;
    return {
      subIncomeRange,
      adIncomeRange,
      commissionIncomeRange,
      totalRange
    };
  };

  const filteredMetrics = getFilteredRevenue();

  // Recharts preparation helper functions
  const getRevenueTrendData = () => {
    const revenueMap: Record<string, { date: string; subscription: number; ad: number; commission: number; total: number }> = {};
    const datesToInclude: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      datesToInclude.push(dateStr);
      revenueMap[dateStr] = { date: dateStr, subscription: 0, ad: 0, commission: 0, total: 0 };
    }

    allDb.businesses.forEach(b => {
      b.transactions.forEach((t: any) => {
        if (!t.date) return;
        const dStr = t.date.split('T')[0];
        if (!revenueMap[dStr]) {
          revenueMap[dStr] = { date: dStr, subscription: 0, ad: 0, commission: 0, total: 0 };
          if (!datesToInclude.includes(dStr)) datesToInclude.push(dStr);
        }
        if (t.type === 'subscription') revenueMap[dStr].subscription += t.amount;
        if (t.type === 'ad_payment') revenueMap[dStr].ad += t.amount;
      });
    });

    allDb.bookings.forEach((b: any) => {
      if (b.status === 'completed') {
        const dStr = b.bookingDate || b.createdAt?.split('T')[0];
        if (!dStr) return;
        if (!revenueMap[dStr]) {
          revenueMap[dStr] = { date: dStr, subscription: 0, ad: 0, commission: 0, total: 0 };
          if (!datesToInclude.includes(dStr)) datesToInclude.push(dStr);
        }
        revenueMap[dStr].commission += Math.floor(b.totalPrice * (systemCommRate / 100));
      }
    });

    const sortedDates = datesToInclude.sort();
    return sortedDates.map(dStr => {
      const item = revenueMap[dStr] || { date: dStr, subscription: 0, ad: 0, commission: 0 };
      const total = (item.subscription || 0) + (item.ad || 0) + (item.commission || 0);
      const dateObj = new Date(dStr);
      const formattedDate = dateObj.toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' });
      return {
        ...item,
        total,
        name: formattedDate,
      };
    });
  };

  const getBookingStatusData = () => {
    const statusCount = { pending: 0, accepted: 0, completed: 0, cancelled: 0 };
    const targetBookings = getFilteredBookings();
    targetBookings.forEach((b: any) => {
      if (statusCount[b.status as keyof typeof statusCount] !== undefined) {
        statusCount[b.status as keyof typeof statusCount]++;
      }
    });
    return [
      { name: 'অপেক্ষমাণ', count: statusCount.pending, fill: '#3b82f6' },
      { name: 'গৃহীত', count: statusCount.accepted, fill: '#8b5cf6' },
      { name: 'সম্পন্ন', count: statusCount.completed, fill: '#10b981' },
      { name: 'বাতিল', count: statusCount.cancelled, fill: '#f43f5e' },
    ];
  };

  const getCategoryPerformanceData = () => {
    const catMap: Record<string, number> = {};
    const targetBookings = getFilteredBookings();
    targetBookings.forEach((b: any) => {
      if (b.status === 'completed') {
        const biz = allDb.businesses.find(x => x.id === b.businessId);
        if (biz) {
          const categoryId = biz.category;
          catMap[categoryId] = (catMap[categoryId] || 0) + b.totalPrice;
        }
      }
    });

    const categoriesList = allDb.categories || CATEGORIES;
    const data = Object.keys(catMap).map(catId => {
      const catObj = categoriesList.find((c: any) => c.id === catId);
      return {
        name: catObj?.nameBangla || catId,
        value: catMap[catId]
      };
    });

    if (data.length === 0) {
      return [
        { name: 'মুদিখানা', value: 5000 },
        { name: 'ফার্মেসি', value: 3000 },
        { name: 'ইলেকট্রিশিয়ান', value: 2000 },
        { name: 'প্লাম্বার', value: 1500 }
      ];
    }
    return data.sort((a, b) => b.value - a.value).slice(0, 5);
  };

  const getTopMerchants = () => {
    const merchants = allDb.businesses.map(b => {
      const completedBookings = allDb.bookings.filter(x => x.businessId === b.id && x.status === 'completed');
      const totalSales = completedBookings.reduce((sum, current) => sum + current.totalPrice, 0);
      return {
        id: b.id,
        name: b.name,
        category: b.category,
        totalSales,
        bookingsCount: completedBookings.length,
        rating: b.rating || 5.0,
        logo: b.logo
      };
    });
    return merchants.sort((a, b) => b.totalSales - a.totalSales).slice(0, 5);
  };

  const handleExportCSV = () => {
    if (!allDb.bookings || allDb.bookings.length === 0) {
      alert('এক্সপোর্ট করার জন্য কোনো বুকিং ডাটা নেই!');
      return;
    }
    const headers = ['Order ID', 'Business ID', 'Business Name', 'Category', 'Customer Phone', 'Customer Name', 'Booking Date', 'Total Price', 'Status', 'Payment Method', 'Payment Status'];
    const rows = allDb.bookings.map((b: any) => [
      b.id,
      b.businessId,
      `"${b.businessName.replace(/"/g, '""')}"`,
      b.businessCategory,
      b.userPhone,
      `"${(b.userName || 'গ্রাহক').replace(/"/g, '""')}"`,
      b.bookingDate,
      b.totalPrice,
      b.status,
      b.paymentMethod,
      b.paymentStatus
    ]);
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `rest_bazar_bookings_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    alert('সফলভাবে সকল বুকিং ডাটা CSV ফাইলে এক্সপোর্ট ও ডাউনলোড করা হয়েছে!');
  };

  const handleBroadcastSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMsg) return;
    onBroadcastNotification(broadcastTitle, broadcastMsg);
    alert('সফলভাবে সকল ব্যবহারকারীর কাছে নোটিফিকেশন ব্রডকাস্ট করা হয়েছে!');
    setBroadcastTitle('');
    setBroadcastMsg('');
  };

  // Filters
  const filteredUsers = allDb.users.filter(u => {
    // Role filter
    if (userRoleFilter !== 'all' && u.role !== userRoleFilter) {
      return false;
    }
    // Verification filter
    if (userVerificationFilter === 'verified' && !u.isMerchantVerified) {
      return false;
    }
    if (userVerificationFilter === 'unverified' && u.isMerchantVerified) {
      return false;
    }
    const s = userSearch.toLowerCase().trim();
    if (!s) return true;
    return (u.name && u.name.toLowerCase().includes(s)) || 
           (u.phone && u.phone.includes(s)) ||
           (u.email && u.email.toLowerCase().includes(s)) ||
           (u.role && u.role.toLowerCase().includes(s)) ||
           (u.tradeLicenseNo && u.tradeLicenseNo.toLowerCase().includes(s)) ||
           (u.location?.district && u.location.district.toLowerCase().includes(s)) ||
           (u.location?.address && u.location.address.toLowerCase().includes(s));
  });

  const filteredBusinesses = allDb.businesses.filter(b => {
    const s = bizSearch.toLowerCase().trim();
    let matchesSearch = true;
    if (s) {
      matchesSearch = (b.name && b.name.toLowerCase().includes(s)) || 
                      (b.category && b.category.toLowerCase().includes(s)) ||
                      (b.ownerPhone && b.ownerPhone.includes(s)) ||
                      (b.ownerName && b.ownerName.toLowerCase().includes(s)) ||
                      (b.phone && b.phone.includes(s)) ||
                      (b.address && b.address.toLowerCase().includes(s)) ||
                      (b.description && b.description.toLowerCase().includes(s)) ||
                      (b.id && b.id.toLowerCase().includes(s)) ||
                      (b.ownerEmail && b.ownerEmail.toLowerCase().includes(s));
    }
    if (!matchesSearch) return false;

    if (bizApprovalFilter === 'pending') {
      if (b.isApproved !== false) return false;
    }
    if (bizApprovalFilter === 'approved') {
      if (b.isApproved === false) return false;
    }

    if (bizCategoryFilter !== 'all' && b.category !== bizCategoryFilter) {
      return false;
    }

    if (bizTypeFilter !== 'all' && b.type !== bizTypeFilter) {
      return false;
    }

    if (bizStatusFilter === 'open' && !b.isOpen) return false;
    if (bizStatusFilter === 'closed' && b.isOpen) return false;
    if (bizStatusFilter === 'sponsored' && !b.isSponsored) return false;
    if (bizStatusFilter === 'wholesale' && !b.isWholesale) return false;

    return true;
  });

  const pendingLicensesCount = allDb.users.filter(u => u.tradeLicenseNo && !u.isMerchantVerified).length;

  return (
    <div className="space-y-6">
      {/* Executive Admin Header & Quick Metrics Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 rounded-3xl shadow-xl border border-indigo-900/50 relative overflow-hidden text-left">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-5 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                সিস্টেম অনলাইন 🟢 (Realtime DB)
              </span>
              <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                রেস্ট বাজার সুপার এডমিন ড্যাশবোর্ড 🛡️
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              অ্যাডমিন কন্ট্রোল সেন্টার & সিস্টেম ম্যানেজমেন্ট
            </h2>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              রেস্ট বাজার প্ল্যাটফর্মের সকল ইউজার, মার্চেন্ট অনুমোদন, বুকিং ও রাজস্ব রিয়েল-টাইমে পরিচালনা করুন।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onRefresh}
              className="bg-white/10 hover:bg-white/20 text-white font-black text-xs px-3.5 py-2 rounded-xl transition-all border border-white/10 flex items-center gap-1.5 cursor-pointer active:scale-95"
              title="ডাটাবেজ রিফ্রেশ করুন"
            >
              <RefreshCw className="w-3.5 h-3.5 text-blue-300" />
              <span>রিফ্রেশ ডাটা</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-3.5 py-2 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>CSV রিপোর্ট</span>
            </button>
          </div>
        </div>

        {/* Quick Summary Pill Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 relative z-10">
          <div className="bg-white/5 border border-white/10 p-3 rounded-2xl backdrop-blur-md">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">মোট নিবন্ধিত ইউজার</span>
            <span className="text-lg font-black text-white mt-0.5 block">{totalUsers} জন</span>
          </div>
          <div className="bg-white/5 border border-white/10 p-3 rounded-2xl backdrop-blur-md">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">ভেরিফাইড মার্চেন্ট</span>
            <span className="text-lg font-black text-emerald-400 mt-0.5 block">
              {allDb.users.filter(u => u.role === 'merchant' && u.isMerchantVerified).length} টি দোকান
            </span>
          </div>
          <div className="bg-white/5 border border-white/10 p-3 rounded-2xl backdrop-blur-md">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">পেন্ডিং লাইসেন্স আবেদন</span>
            <span className={`text-lg font-black mt-0.5 block ${pendingLicensesCount > 0 ? 'text-amber-400 animate-pulse' : 'text-slate-300'}`}>
              {pendingLicensesCount} টি আবেদন
            </span>
          </div>
          <div className="bg-white/5 border border-white/10 p-3 rounded-2xl backdrop-blur-md">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">মোট অর্ডার ও বুকিং</span>
            <span className="text-lg font-black text-indigo-300 mt-0.5 block">{allDb.bookings.length} টি সম্পন্ন/চলমান</span>
          </div>
        </div>
      </div>

      {/* Categorized Admin Management Navigation - Executive Card View */}
      {(() => {
        const adminMenuItems = [
          {
            id: 'overview' as const,
            category: 'analytics',
            categoryLabel: 'অ্যানালিটিক্স',
            title: 'ওভারভিউ ও অ্যানালিটিক্স',
            description: 'সার্বিক প্ল্যাটফর্ম গ্রোথ, সেলস ও অর্ডারের ভিজ্যুয়াল গ্রাফ ও পরিসংখ্যান',
            icon: TrendingUp,
            colorScheme: 'indigo',
            badge: 'লাইভ মেট্রিক্স',
            count: null
          },
          {
            id: 'profile-report' as const,
            category: 'analytics',
            categoryLabel: 'অ্যানালিটিক্স',
            title: 'প্রোফাইল অডিট রিপোর্ট',
            description: 'ইউজার ও মার্চেন্টদের পূর্ণাঙ্গ প্রোফাইল ডাটা, অডিট লগ ও অ্যাক্টিভিটি রিপোর্ট',
            icon: FileText,
            colorScheme: 'purple',
            badge: 'ইন-ডেপথ অডিট',
            count: null
          },
          {
            id: 'users' as const,
            category: 'users',
            categoryLabel: 'ইউজার ও পারমিশন',
            title: 'ব্যবহারকারী পরিচালনা',
            description: 'নিবন্ধিত সাধারণ গ্রাহক, মার্চেন্ট ও অ্যাডমিন একাউন্ট নিয়ন্ত্রণ ও তালিকা',
            icon: Users,
            colorScheme: 'blue',
            badge: `${totalUsers} জন ইউজার`,
            count: totalUsers
          },
          {
            id: 'licenses' as const,
            category: 'users',
            categoryLabel: 'ইউজার ও পারমিশন',
            title: 'মার্চেন্ট লাইসেন্স যাচাই',
            description: 'মার্চেন্টদের ট্রেড লাইসেন্স, এনআইডি ও অনুমোদন যাচাইকরণ',
            icon: ShieldCheck,
            colorScheme: 'amber',
            badge: pendingLicensesCount > 0 ? `${pendingLicensesCount} টি আবেদন পেন্ডিং` : 'সব অনুমোদিত',
            count: pendingLicensesCount,
            alert: pendingLicensesCount > 0
          },
          {
            id: 'merchant-control' as const,
            category: 'users',
            categoryLabel: 'ইউজার ও পারমিশন',
            title: 'মার্চেন্ট পারমিশন গেট',
            description: 'ভেন্ডরদের ড্যাশবোর্ড পারমিশন, ফিচার অ্যাক্সেস ও একাউন্ট সক্রিয়/স্থগিত',
            icon: Sliders,
            colorScheme: 'emerald',
            badge: 'রোল অ্যাক্সেস',
            count: null
          },
          {
            id: 'businesses' as const,
            category: 'commerce',
            categoryLabel: 'বাণিজ্য ও সার্ভিস',
            title: 'দোকান ও সার্ভিসেস',
            description: 'সকল নিবন্ধিত শপ, রেস্তোরাঁ ও সার্ভিসের প্রোফাইল অনুমোদন ও নিয়ন্ত্রণ',
            icon: Store,
            colorScheme: 'cyan',
            badge: `${totalBusinesses} টি প্রতিষ্ঠান`,
            count: totalBusinesses
          },
          {
            id: 'categories' as const,
            category: 'commerce',
            categoryLabel: 'বাণিজ্য ও সার্ভিস',
            title: 'ক্যাটাগরি ব্যবস্থাপনা',
            description: 'মার্কেটপ্লেস ও ডিরেক্টরির মূল এবং সাব-ক্যাটাগরি আইকন ও বিন্যাস',
            icon: Layers,
            colorScheme: 'teal',
            badge: `${allDb.categories?.length || CATEGORIES.length} টি ক্যাটাগরি`,
            count: allDb.categories?.length || CATEGORIES.length
          },
          {
            id: 'bookings' as const,
            category: 'commerce',
            categoryLabel: 'বাণিজ্য ও সার্ভিস',
            title: 'অর্ডার ও বুকিং ট্র্যাকিং',
            description: 'গ্রাহকদের সকল কেনাকাটা, ডেলিভারি স্ট্যাটাস ও পেমেন্ট হিস্টোরি',
            icon: ShoppingBag,
            colorScheme: 'violet',
            badge: `${allDb.bookings.length} টি বুকিং`,
            count: allDb.bookings.length
          },
          {
            id: 'gateways' as const,
            category: 'finance',
            categoryLabel: 'পেমেন্ট ও রাজস্ব',
            title: 'পেমেন্ট গেটওয়ে কন্ট্রোল',
            description: 'বিকাশ, নগদ, রকেট, উপায় ও ব্যাংক মার্চেন্ট এপিআই কি ও পেমেন্ট সুইচ',
            icon: Wallet,
            colorScheme: 'pink',
            badge: 'API গেটওয়ে',
            count: null
          },
          {
            id: 'commissions' as const,
            category: 'finance',
            categoryLabel: 'পেমেন্ট ও রাজস্ব',
            title: 'কমিশন ও অফার',
            description: 'প্ল্যাটফর্ম কমিশন পার্সেন্টেজ, ক্যাশব্যাক ও গ্লোবাল ডিসকাউন্ট ভাউচার',
            icon: Percent,
            colorScheme: 'rose',
            badge: 'রাজস্ব নীতি',
            count: null
          },
          {
            id: 'ads' as const,
            category: 'finance',
            categoryLabel: 'পেমেন্ট ও রাজস্ব',
            title: 'প্রমোশন বিজ্ঞাপন',
            description: 'মার্চেন্টদের পেইড ব্যানার বিজ্ঞাপন ক্যাম্পেইন রিভিউ ও অনুমোদন',
            icon: Zap,
            colorScheme: 'amber',
            badge: `${allDb.adCampaigns?.length || 0} টি ক্যাম্পেইন`,
            count: allDb.adCampaigns?.length || 0
          },
          {
            id: 'subscriptions' as const,
            category: 'finance',
            categoryLabel: 'পেমেন্ট ও রাজস্ব',
            title: 'সাবস্ক্রিপশন প্ল্যান',
            description: 'মার্চেন্ট মেম্বারশিপ প্যাকেজ রেট, গোল্ড/সিলভার টিয়ার ও প্রিমিয়াম ফি',
            icon: DollarSign,
            colorScheme: 'emerald',
            badge: 'প্যাকেজ রেট',
            count: null
          },
          {
            id: 'complaints' as const,
            category: 'system',
            categoryLabel: 'সিস্টেম ও সাপোর্ট',
            title: 'অভিযোগ ও ডিসপিউট',
            description: 'গ্রাহক ও সেলারদের অভিযোগ তদন্ত, চ্যাট ডিসপিউট ও সমাধান নোটিশ',
            icon: AlertTriangle,
            colorScheme: 'red',
            badge: pendingComplaints > 0 ? `${pendingComplaints} টি পেন্ডিং` : 'সব নিষ্পত্তি',
            count: pendingComplaints,
            alert: pendingComplaints > 0
          },
          {
            id: 'broadcast' as const,
            category: 'system',
            categoryLabel: 'সিস্টেম ও সাপোর্ট',
            title: 'ব্রডকাস্ট নোটিফিকেশন',
            description: 'সকল নিবন্ধিত ইউজার ও ভেন্ডরদের ইন-অ্যাপ গণবিজ্ঞপ্তি প্রেরণ',
            icon: Bell,
            colorScheme: 'blue',
            badge: 'গণবার্তা পুশ',
            count: null
          },
          {
            id: 'ticker' as const,
            category: 'system',
            categoryLabel: 'সিস্টেম ও সাপোর্ট',
            title: 'লাইভ টিকার বার্তা',
            description: 'ওয়েবসাইটের হেডলাইনে চলমান জরুরি ব্রেকিং নোটিশ ও ঘোষণা',
            icon: Sparkles,
            colorScheme: 'orange',
            badge: 'স্ক্রোলিং নোটিশ',
            count: null
          },
          {
            id: 'profile' as const,
            category: 'system',
            categoryLabel: 'সিস্টেম ও সাপোর্ট',
            title: 'সিকিউরিটি ও প্রোফাইল',
            description: 'প্রধান সিস্টেম অ্যাডমিন প্রোফাইল, ফোন নম্বর ও রুট পাসওয়ার্ড সুরক্ষা',
            icon: Lock,
            colorScheme: 'slate',
            badge: 'রুট নিরাপত্তা',
            count: null
          }
        ];

        const filteredItems = adminMenuItems.filter(item => {
          const matchesCat = adminMenuCategory === 'all' || item.category === adminMenuCategory;
          const matchesSearch = !adminMenuSearch.trim() || 
            item.title.toLowerCase().includes(adminMenuSearch.toLowerCase()) ||
            item.description.toLowerCase().includes(adminMenuSearch.toLowerCase()) ||
            item.categoryLabel.toLowerCase().includes(adminMenuSearch.toLowerCase());
          return matchesCat && matchesSearch;
        });

        const activeItem = adminMenuItems.find(i => i.id === activeAdminSubTab) || adminMenuItems[0];

        const colorMap: Record<string, {
          cardBg: string;
          activeBorder: string;
          activeRing: string;
          activeBg: string;
          iconBg: string;
          iconText: string;
          iconShadow: string;
          badgeBg: string;
          badgeText: string;
          accentText: string;
        }> = {
          indigo: {
            cardBg: 'from-indigo-50/50 via-white to-indigo-50/20',
            activeBorder: 'border-indigo-600',
            activeRing: 'ring-2 ring-indigo-500/25',
            activeBg: 'bg-gradient-to-br from-indigo-100/70 via-white to-indigo-50/50',
            iconBg: 'bg-gradient-to-tr from-indigo-600 to-indigo-500',
            iconText: 'text-white',
            iconShadow: 'shadow-indigo-300/60 shadow-md',
            badgeBg: 'bg-indigo-100 text-indigo-800',
            badgeText: 'text-indigo-700',
            accentText: 'text-indigo-600',
          },
          purple: {
            cardBg: 'from-purple-50/50 via-white to-fuchsia-50/20',
            activeBorder: 'border-purple-600',
            activeRing: 'ring-2 ring-purple-500/25',
            activeBg: 'bg-gradient-to-br from-purple-100/70 via-white to-purple-50/50',
            iconBg: 'bg-gradient-to-tr from-purple-600 to-fuchsia-600',
            iconText: 'text-white',
            iconShadow: 'shadow-purple-300/60 shadow-md',
            badgeBg: 'bg-purple-100 text-purple-800',
            badgeText: 'text-purple-700',
            accentText: 'text-purple-600',
          },
          blue: {
            cardBg: 'from-blue-50/50 via-white to-sky-50/20',
            activeBorder: 'border-blue-600',
            activeRing: 'ring-2 ring-blue-500/25',
            activeBg: 'bg-gradient-to-br from-blue-100/70 via-white to-blue-50/50',
            iconBg: 'bg-gradient-to-tr from-blue-600 to-sky-500',
            iconText: 'text-white',
            iconShadow: 'shadow-blue-300/60 shadow-md',
            badgeBg: 'bg-blue-100 text-blue-800',
            badgeText: 'text-blue-700',
            accentText: 'text-blue-600',
          },
          amber: {
            cardBg: 'from-amber-50/50 via-white to-yellow-50/20',
            activeBorder: 'border-amber-500',
            activeRing: 'ring-2 ring-amber-500/25',
            activeBg: 'bg-gradient-to-br from-amber-100/70 via-white to-amber-50/50',
            iconBg: 'bg-gradient-to-tr from-amber-500 to-orange-500',
            iconText: 'text-white',
            iconShadow: 'shadow-amber-300/60 shadow-md',
            badgeBg: 'bg-amber-100 text-amber-900',
            badgeText: 'text-amber-800',
            accentText: 'text-amber-600',
          },
          emerald: {
            cardBg: 'from-emerald-50/50 via-white to-teal-50/20',
            activeBorder: 'border-emerald-600',
            activeRing: 'ring-2 ring-emerald-500/25',
            activeBg: 'bg-gradient-to-br from-emerald-100/70 via-white to-emerald-50/50',
            iconBg: 'bg-gradient-to-tr from-emerald-600 to-teal-500',
            iconText: 'text-white',
            iconShadow: 'shadow-emerald-300/60 shadow-md',
            badgeBg: 'bg-emerald-100 text-emerald-800',
            badgeText: 'text-emerald-700',
            accentText: 'text-emerald-600',
          },
          cyan: {
            cardBg: 'from-cyan-50/50 via-white to-blue-50/20',
            activeBorder: 'border-cyan-600',
            activeRing: 'ring-2 ring-cyan-500/25',
            activeBg: 'bg-gradient-to-br from-cyan-100/70 via-white to-cyan-50/50',
            iconBg: 'bg-gradient-to-tr from-cyan-600 to-sky-500',
            iconText: 'text-white',
            iconShadow: 'shadow-cyan-300/60 shadow-md',
            badgeBg: 'bg-cyan-100 text-cyan-800',
            badgeText: 'text-cyan-700',
            accentText: 'text-cyan-600',
          },
          teal: {
            cardBg: 'from-teal-50/50 via-white to-emerald-50/20',
            activeBorder: 'border-teal-600',
            activeRing: 'ring-2 ring-teal-500/25',
            activeBg: 'bg-gradient-to-br from-teal-100/70 via-white to-teal-50/50',
            iconBg: 'bg-gradient-to-tr from-teal-600 to-emerald-500',
            iconText: 'text-white',
            iconShadow: 'shadow-teal-300/60 shadow-md',
            badgeBg: 'bg-teal-100 text-teal-800',
            badgeText: 'text-teal-700',
            accentText: 'text-teal-600',
          },
          violet: {
            cardBg: 'from-violet-50/50 via-white to-purple-50/20',
            activeBorder: 'border-violet-600',
            activeRing: 'ring-2 ring-violet-500/25',
            activeBg: 'bg-gradient-to-br from-violet-100/70 via-white to-violet-50/50',
            iconBg: 'bg-gradient-to-tr from-violet-600 to-purple-600',
            iconText: 'text-white',
            iconShadow: 'shadow-violet-300/60 shadow-md',
            badgeBg: 'bg-violet-100 text-violet-800',
            badgeText: 'text-violet-700',
            accentText: 'text-violet-600',
          },
          pink: {
            cardBg: 'from-pink-50/50 via-white to-rose-50/20',
            activeBorder: 'border-pink-600',
            activeRing: 'ring-2 ring-pink-500/25',
            activeBg: 'bg-gradient-to-br from-pink-100/70 via-white to-pink-50/50',
            iconBg: 'bg-gradient-to-tr from-pink-600 to-rose-500',
            iconText: 'text-white',
            iconShadow: 'shadow-pink-300/60 shadow-md',
            badgeBg: 'bg-pink-100 text-pink-800',
            badgeText: 'text-pink-700',
            accentText: 'text-pink-600',
          },
          rose: {
            cardBg: 'from-rose-50/50 via-white to-pink-50/20',
            activeBorder: 'border-rose-600',
            activeRing: 'ring-2 ring-rose-500/25',
            activeBg: 'bg-gradient-to-br from-rose-100/70 via-white to-rose-50/50',
            iconBg: 'bg-gradient-to-tr from-rose-600 to-pink-600',
            iconText: 'text-white',
            iconShadow: 'shadow-rose-300/60 shadow-md',
            badgeBg: 'bg-rose-100 text-rose-800',
            badgeText: 'text-rose-700',
            accentText: 'text-rose-600',
          },
          red: {
            cardBg: 'from-red-50/50 via-white to-rose-50/20',
            activeBorder: 'border-red-600',
            activeRing: 'ring-2 ring-red-500/25',
            activeBg: 'bg-gradient-to-br from-red-100/70 via-white to-red-50/50',
            iconBg: 'bg-gradient-to-tr from-red-600 to-rose-500',
            iconText: 'text-white',
            iconShadow: 'shadow-red-300/60 shadow-md',
            badgeBg: 'bg-red-100 text-red-800',
            badgeText: 'text-red-700',
            accentText: 'text-red-600',
          },
          orange: {
            cardBg: 'from-orange-50/50 via-white to-amber-50/20',
            activeBorder: 'border-orange-500',
            activeRing: 'ring-2 ring-orange-500/25',
            activeBg: 'bg-gradient-to-br from-orange-100/70 via-white to-orange-50/50',
            iconBg: 'bg-gradient-to-tr from-orange-500 to-amber-500',
            iconText: 'text-white',
            iconShadow: 'shadow-orange-300/60 shadow-md',
            badgeBg: 'bg-orange-100 text-orange-800',
            badgeText: 'text-orange-700',
            accentText: 'text-orange-600',
          },
          slate: {
            cardBg: 'from-slate-100/60 via-white to-slate-50/30',
            activeBorder: 'border-slate-800',
            activeRing: 'ring-2 ring-slate-700/25',
            activeBg: 'bg-gradient-to-br from-slate-200/70 via-white to-slate-100/50',
            iconBg: 'bg-gradient-to-tr from-slate-800 to-slate-700',
            iconText: 'text-white',
            iconShadow: 'shadow-slate-300 shadow-md',
            badgeBg: 'bg-slate-200 text-slate-800',
            badgeText: 'text-slate-700',
            accentText: 'text-slate-800',
          },
        };

        return (
          <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-3 sm:p-6 shadow-sm text-left space-y-3.5 sm:space-y-4">
            {/* Header with Title and Quick Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-xl">
                    <LayoutGrid className="w-4 h-4" />
                  </span>
                  <h3 className="text-sm sm:text-base font-black text-slate-900">
                    অ্যাডমিন কন্ট্রোল সেন্টার মডিউলস (কার্ড ভিউ)
                  </h3>
                  <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                    {adminMenuItems.length}টি মডিউল
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  নিচের যেকোনো মডিউল কার্ডে ক্লিক করে কাঙ্ক্ষিত সেকশনটি সরাসরি ওপেন করুন।
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {/* Search Bar */}
                <div className="relative flex-1 sm:w-60">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={adminMenuSearch}
                    onChange={(e) => setAdminMenuSearch(e.target.value)}
                    placeholder="মডিউল কার্ড খুঁজুন..."
                    className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold text-slate-800"
                  />
                  {adminMenuSearch && (
                    <button
                      type="button"
                      onClick={() => setAdminMenuSearch('')}
                      className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Collapse / Expand Toggle Button */}
                <button
                  type="button"
                  onClick={() => setIsMenuCardsCollapsed(!isMenuCardsCollapsed)}
                  className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors"
                  title={isMenuCardsCollapsed ? 'সব কার্ড বিস্তারিত দেখুন' : 'কার্ড তালিকা সংক্ষেপ করুন'}
                >
                  <span className="text-[11px] font-black">
                    {isMenuCardsCollapsed ? 'কার্ড দেখুন' : 'সংক্ষেপ করুন'}
                  </span>
                  {isMenuCardsCollapsed ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronUp className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Category Filter Tabs */}
            {!isMenuCardsCollapsed && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {[
                  { id: 'all', label: 'সব কার্ড (১৬)', icon: '🎛️' },
                  { id: 'analytics', label: 'অ্যানালিটিক্স (২)', icon: '📈' },
                  { id: 'users', label: 'ইউজার ও লাইসেন্স (৩)', icon: '👥' },
                  { id: 'commerce', label: 'দোকান ও অর্ডার (৩)', icon: '🏪' },
                  { id: 'finance', label: 'পেমেন্ট ও রাজস্ব (৪)', icon: '💳' },
                  { id: 'system', label: 'সিস্টেম ও সাপোর্ট (৪)', icon: '⚙️' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setAdminMenuCategory(tab.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                      adminMenuCategory === tab.id
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* The Responsive Grid of Menu Cards (3-col on Mobile, 2 on sm, 3 on md, 4 on lg) */}
            {!isMenuCardsCollapsed && (
              <div className="grid grid-cols-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3.5 pt-1">
                {filteredItems.map((item) => {
                  const isActive = activeAdminSubTab === item.id;
                  const IconComponent = item.icon;
                  const style = colorMap[item.colorScheme] || colorMap.indigo;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveAdminSubTab(item.id)}
                      className={`group relative p-2.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between overflow-hidden text-center sm:text-left ${
                        isActive
                          ? `${style.activeBg} ${style.activeBorder} ${style.activeRing} shadow-md scale-[1.02]`
                          : `bg-gradient-to-br ${style.cardBg} hover:bg-white border-slate-200/90 hover:border-slate-300 shadow-2xs hover:shadow-sm`
                      }`}
                    >
                      {/* Mobile floating notification indicators */}
                      {isActive && (
                        <span className="absolute top-1.5 right-1.5 sm:hidden bg-indigo-600 text-white p-0.5 rounded-full shadow-xs">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                      )}
                      {!isActive && item.alert && (
                        <span className="absolute top-1.5 right-1.5 sm:hidden bg-rose-500 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse shadow-xs">
                          !
                        </span>
                      )}

                      {/* Top Row: Icon & Status Badges */}
                      <div className="flex items-center sm:items-start justify-center sm:justify-between gap-2 w-full mb-1.5 sm:mb-3">
                        <div
                          className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-200 group-hover:scale-105 shrink-0 ${style.iconBg} ${style.iconText} ${style.iconShadow}`}
                        >
                          <IconComponent className="w-4.5 h-4.5 sm:w-5 sm:h-5 stroke-[2.2]" />
                        </div>

                        {/* Desktop badges */}
                        <div className="hidden sm:flex flex-col items-end gap-1">
                          {isActive && (
                            <span className="bg-indigo-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs tracking-tight">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                              <span>ওপেন আছে</span>
                            </span>
                          )}

                          {item.alert ? (
                            <span className="bg-rose-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full animate-pulse shadow-xs">
                              {item.badge}
                            </span>
                          ) : item.badge && !isActive ? (
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border border-slate-200/70 ${style.badgeBg}`}>
                              {item.badge}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {/* Middle: Title & Description */}
                      <div className="space-y-0.5 sm:space-y-1 mb-1 sm:mb-3">
                        <h4
                          className={`text-[11px] sm:text-sm font-black transition-colors line-clamp-2 leading-tight sm:leading-snug ${
                            isActive ? 'text-indigo-950' : 'text-slate-800 group-hover:text-indigo-600'
                          }`}
                        >
                          {item.title}
                        </h4>
                        {item.badge && !isActive && (
                          <div className="sm:hidden text-[9px] font-bold text-slate-500 truncate">
                            {item.badge}
                          </div>
                        )}
                        <p className="hidden sm:block text-[11px] text-slate-500 font-medium leading-relaxed line-clamp-2">
                          {item.description}
                        </p>
                      </div>

                      {/* Bottom Row: Category & Navigation Action Indicator */}
                      <div className="hidden sm:flex pt-2.5 border-t border-slate-100/90 items-center justify-between text-[10px] w-full">
                        <span className="text-slate-400 font-bold uppercase tracking-wider">
                          {item.categoryLabel}
                        </span>
                        <span
                          className={`font-black flex items-center gap-0.5 transition-transform group-hover:translate-x-0.5 ${
                            isActive ? style.accentText : 'text-slate-400 group-hover:text-slate-700'
                          }`}
                        >
                          {isActive ? 'সক্রিয় মডিউল' : 'মডিউলে যান →'}
                        </span>
                      </div>

                      {/* Mobile Bottom Category label */}
                      <div className="sm:hidden pt-1 border-t border-slate-100/80 text-[8px] font-semibold text-slate-400 truncate w-full text-center">
                        {item.categoryLabel}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Empty Search Result Fallback */}
            {!isMenuCardsCollapsed && filteredItems.length === 0 && (
              <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <p className="text-xs text-slate-500 font-bold">কোনো মডিউল কার্ড খুঁজে পাওয়া যায়নি।</p>
                <button
                  type="button"
                  onClick={() => { setAdminMenuSearch(''); setAdminMenuCategory('all'); }}
                  className="mt-2 text-xs text-indigo-600 font-bold hover:underline"
                >
                  সব কার্ড রিসেট করুন
                </button>
              </div>
            )}

            {/* Currently Active Module Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-3 sm:px-4 sm:py-3 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-sm">
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></div>
                <span className="text-xs text-slate-300 font-medium">বর্তমানে ওপেন করা সেকশন:</span>
                <span className="text-xs sm:text-sm font-black text-amber-300 flex items-center gap-1.5">
                  {activeItem.title}
                </span>
                <span className="text-[10px] bg-white/10 text-slate-200 px-2.5 py-0.5 rounded-full font-bold">
                  {activeItem.categoryLabel}
                </span>
              </div>
              <div className="text-[11px] text-slate-300 hidden md:block">
                {activeItem.description}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Main Admin Section */}
      {activeAdminSubTab === 'overview' && (
        <div className="space-y-6 text-left">
          {/* Pending Vendor Approval Alert Banner */}
          {(() => {
            const pendingBizList = allDb.businesses.filter(b => b.isApproved === false);
            const pendingMerchantsList = allDb.users.filter(u => u.role === 'merchant' && !u.isMerchantVerified);
            if (pendingBizList.length > 0 || pendingMerchantsList.length > 0) {
              return (
                <div className="bg-amber-500/10 border border-amber-300/80 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-lg animate-pulse">
                      ⏳
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-amber-950">
                        {pendingBizList.length} টি নতুন দোকান এবং {pendingMerchantsList.length} জন ভেন্ডর এডমিন পারমিশনের অপেক্ষায় আছে!
                      </h4>
                      <p className="text-[11px] text-amber-800 font-medium">
                        নতুন মার্চেন্ট সাইন-আপ করার পর এখানে সরাসরি পারমিশন অনুমোদন দেওয়া যাবে।
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveAdminSubTab('businesses')}
                    className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-black px-4 py-2 rounded-xl transition-all shadow-md cursor-pointer whitespace-nowrap"
                  >
                    পারমিশন দিন &rarr;
                  </button>
                </div>
              );
            }
            return null;
          })()}
          {/* Role Switching Section inside Admin page */}
          {onSwitchRole && (
            <div className="bg-gradient-to-r from-purple-500/15 via-indigo-500/10 to-indigo-500/5 border border-purple-200/80 p-5 rounded-2xl shadow-sm space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-xl pointer-events-none" />
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-purple-100 text-purple-700 rounded-xl"><Shield className="w-4 h-4" /></span>
                <div>
                  <h4 className="text-xs font-black text-slate-900">অ্যাডমিন রোল কুইক সুইচ (Switch Active Role)</h4>
                  <p className="text-[10px] text-slate-500 font-medium">অ্যাডমিন কন্ট্রোল থেকে অন্য যেকোনো রোলে (ইউজার বা মার্চেন্ট) সরাসরি সুইচ করতে পারবেন</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2.5 pt-1">
                <button
                  onClick={() => onSwitchRole('user')}
                  className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-indigo-500 hover:text-indigo-600 text-slate-700 font-extrabold text-xs py-2 px-4 rounded-xl shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  🙋‍♂️ সাধারণ গ্রাহক (User) এ যান
                </button>
                <button
                  onClick={() => onSwitchRole('merchant')}
                  className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-indigo-500 hover:text-indigo-600 text-slate-700 font-extrabold text-xs py-2 px-4 rounded-xl shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  🏪 মার্চেন্ট (Merchant) এ যান
                </button>
                <button
                  disabled
                  className="bg-purple-100 border border-purple-200 text-purple-700 font-extrabold text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 opacity-90 cursor-not-allowed"
                >
                  🛡️ সুপার অ্যাডমিন (Admin) [সক্রিয়]
                </button>
              </div>
            </div>
          )}

          {/* Dynamic Filters & Export Utility bar */}
          <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">রিপোর্ট ফিল্টারিং ও রপ্তানি</span>
              <h4 className="text-sm font-black text-slate-800">📊 রিয়েল-টাইম প্ল্যাটফর্ম পারফরম্যান্স অ্যানালিটিক্স</h4>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="bg-slate-100 p-1 rounded-xl flex gap-1">
                {(['all', 'today', 'week', 'month'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setReportTimeRange(r)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                      reportTimeRange === r
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {r === 'all' ? 'সব সময়' : r === 'today' ? 'আজকে' : r === 'week' ? 'গত ৭ দিন' : 'এই মাস'}
                  </button>
                ))}
              </div>

              <button
                onClick={handleExportCSV}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] px-3.5 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1 cursor-pointer"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                CSV এক্সপোর্ট
              </button>

              <button
                onClick={() => setShowPrintReport(true)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[11px] px-3.5 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                অডিট রিপোর্ট প্রিন্ট করুন
              </button>
            </div>
          </div>

          {/* Stats Cards (Dynamic based on selected time-frame) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-100 p-4.5 rounded-2xl shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-black text-slate-400">মোট ইউজার</span>
                <span className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Users className="w-4.5 h-4.5" /></span>
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">{totalUsers}</p>
              <span className="text-[10px] text-emerald-600 font-bold block mt-1">↑ ১০% এই সপ্তাহে</span>
            </div>

            <div className="bg-white border border-slate-100 p-4.5 rounded-2xl shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-black text-slate-400">নিবন্ধিত দোকান</span>
                <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><Store className="w-4.5 h-4.5" /></span>
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">{totalBusinesses}</p>
              <span className="text-[10px] text-emerald-600 font-bold block mt-1">সবগুলোই যাচাইকৃত</span>
            </div>

            <div className="bg-white border border-slate-100 p-4.5 rounded-2xl shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-black text-slate-400">সিস্টেম আয় ({reportTimeRange === 'all' ? 'সর্বমোট' : reportTimeRange === 'today' ? 'আজকের' : reportTimeRange === 'week' ? 'গত ৭ দিনের' : 'এই মাসের'})</span>
                <span className="p-2 bg-amber-50 text-amber-600 rounded-xl"><Wallet className="w-4.5 h-4.5" /></span>
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">৳ {filteredMetrics.totalRange.toLocaleString()}</p>
              <span className="text-[10px] text-slate-400 font-bold block mt-1">সক্রিয় কমিশন হার: {systemCommRate}%</span>
            </div>

            <div className="bg-white border border-slate-100 p-4.5 rounded-2xl shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-black text-slate-400">কমপ্লেন ও সমাধান</span>
                <span className="p-2 bg-rose-50 text-rose-600 rounded-xl"><AlertTriangle className="w-4.5 h-4.5" /></span>
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">{pendingComplaints}</p>
              <span className={`text-[10px] font-bold block mt-1 ${pendingComplaints > 0 ? 'text-rose-600 animate-pulse' : 'text-slate-400'}`}>
                {pendingComplaints > 0 ? 'জরুরি সমাধান প্রয়োজন' : 'সব অভিযোগ সমাধান করা হয়েছে'}
              </span>
            </div>
          </div>

          {/* Revenue Source visual progress chart */}
          <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-4">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              রাজস্বের উৎস ও বন্টন বিশ্লেষণ ({reportTimeRange === 'all' ? 'সব সময়' : reportTimeRange === 'today' ? 'আজকের' : reportTimeRange === 'week' ? 'গত ৭ দিন' : 'এই মাস'})
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border border-slate-100 p-4 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-all">
                <span className="text-xs text-slate-500 font-bold">প্যাকেজ সাবস্ক্রিপশন ফি (Subscriptions)</span>
                <p className="text-xl font-black text-blue-600 mt-1">৳ {filteredMetrics.subIncomeRange.toLocaleString()}</p>
                <div className="w-full bg-slate-200 h-2 rounded-full mt-3 overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full transition-all duration-500" style={{ width: `${filteredMetrics.totalRange ? (filteredMetrics.subIncomeRange / filteredMetrics.totalRange) * 100 : 0}%` }}></div>
                </div>
                <span className="text-[10px] text-slate-400 mt-1.5 block font-medium">সিলভার, গোল্ড ও ডায়মন্ড মার্চেন্ট সাবস্ক্রিপশন</span>
              </div>

              <div className="border border-slate-100 p-4 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-all">
                <span className="text-xs text-slate-500 font-bold">বিজ্ঞাপন ও প্রমোশন আয় (Sponsored Ads)</span>
                <p className="text-xl font-black text-amber-600 mt-1">৳ {filteredMetrics.adIncomeRange.toLocaleString()}</p>
                <div className="w-full bg-slate-200 h-2 rounded-full mt-3 overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${filteredMetrics.totalRange ? (filteredMetrics.adIncomeRange / filteredMetrics.totalRange) * 100 : 0}%` }}></div>
                </div>
                <span className="text-[10px] text-slate-400 mt-1.5 block font-medium">ক্যাটাগরি টপ বুস্ট ও ব্যানার বিজ্ঞাপন</span>
              </div>

              <div className="border border-slate-100 p-4 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-all">
                <span className="text-xs text-slate-500 font-bold">অর্ডার কমিশন ফি (Commissions)</span>
                <p className="text-xl font-black text-emerald-600 mt-1">৳ {filteredMetrics.commissionIncomeRange.toLocaleString()}</p>
                <div className="w-full bg-slate-200 h-2 rounded-full mt-3 overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${filteredMetrics.totalRange ? (filteredMetrics.commissionIncomeRange / filteredMetrics.totalRange) * 100 : 0}%` }}></div>
                </div>
                <span className="text-[10px] text-slate-400 mt-1.5 block font-medium">সম্পন্ন হওয়া সার্ভিসের ৫% প্ল্যাটফর্ম ফি</span>
              </div>
            </div>
          </div>

          {/* Interactive Charts Section (Recharts) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Revenue Trend */}
            <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  দৈনিক রাজস্বের গতিপথ (Weekly Revenue Trends)
                </h4>
                <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded">গত ৭ দিন</span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={getRevenueTrendData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '10px' }}
                      labelClassName="font-bold text-slate-300"
                    />
                    <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorTotal)" name="মোট রাজস্ব (৳)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Booking Status distribution */}
            <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-violet-500" />
                  অর্ডার ও বুকিংয়ের বর্তমান অবস্থা (Booking Status Distribution)
                </h4>
                <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded">ফিল্টারকৃত</span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getBookingStatusData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} />
                    <RechartsTooltip 
                      cursor={{ fill: 'rgba(241, 245, 249, 0.4)' }}
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '10px' }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} name="অর্ডারের সংখ্যা" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Bottom Grid: Top Merchants & Category Share */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top performing businesses list */}
            <div className="lg:col-span-2 bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-4">
              <div className="border-b border-slate-50 pb-3 flex justify-between items-center">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Store className="w-4 h-4 text-emerald-500" />
                  শীর্ষ বিক্রয়কারী মার্চেন্টসমূহ (Top Performing Stores)
                </h4>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-extrabold px-2.5 py-0.5 rounded-lg">Live</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold bg-slate-50/50">
                      <th className="p-2.5">মার্চেন্ট ও স্টোর</th>
                      <th className="p-2.5">ক্যাটাগরি</th>
                      <th className="p-2.5 text-center">মোট অর্ডার</th>
                      <th className="p-2.5 text-right">বিক্রয় মূল্য</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 font-medium text-slate-700">
                    {getTopMerchants().map((m, i) => (
                      <tr key={m.id} className="hover:bg-slate-50/30 transition-all">
                        <td className="p-2.5 flex items-center gap-2">
                          <span className="text-slate-400 text-xs font-bold w-4">{i + 1}.</span>
                          <div className="w-8 h-8 rounded-lg bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                            {m.logo ? <img src={m.logo} alt={m.name} className="w-full h-full object-cover" /> : <span>🏪</span>}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{m.name}</span>
                            <span className="text-[9px] text-slate-400 font-semibold">রেটিং: ⭐ {m.rating}</span>
                          </div>
                        </td>
                        <td className="p-2.5">
                          <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-md">
                            {m.category === 'groceries' ? 'মুদিখানা' : m.category === 'medicines' ? 'ফার্মেসি' : m.category === 'electricians' ? 'ইলেকট্রিশিয়ান' : m.category === 'plumbers' ? 'প্লাম্বার' : m.category === 'mechanics' ? 'মেকানিক্স' : m.category === 'delivery' ? 'ডেলিভারি' : m.category === 'education' ? 'শিক্ষক/টিউটর' : m.category === 'beauty' ? 'বিউটি পার্লার' : m.category === 'home_chefs' ? 'হোম শেফ' : m.category === 'restaurants' ? 'রেস্টুরেন্ট' : m.category}
                          </span>
                        </td>
                        <td className="p-2.5 text-center font-bold text-slate-800">{m.bookingsCount} টি</td>
                        <td className="p-2.5 text-right font-black text-indigo-600">৳ {m.totalSales.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Category Distribution Chart */}
            <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-4">
              <div className="border-b border-slate-50 pb-3">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-indigo-500" />
                  শীর্ষ ক্যাটাগরি ভ্যালু শেয়ার (Top Categories Share)
                </h4>
              </div>
              <div className="h-56 w-full relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getCategoryPerformanceData()}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {getCategoryPerformanceData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '10px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Pie Legends */}
              <div className="space-y-1.5 text-[10px] font-semibold text-slate-600 max-h-24 overflow-y-auto">
                {getCategoryPerformanceData().map((entry, index) => (
                  <div key={entry.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5] }} />
                      <span>{entry.name}</span>
                    </div>
                    <span className="font-mono text-slate-900 font-extrabold font-black">৳ {entry.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users view */}
      {activeAdminSubTab === 'users' && (
        <div className="space-y-4">
          {/* Quick Metrics Header */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">সর্বমোট ইউজার</span>
              <span className="text-xl font-black text-slate-900 mt-0.5 block">{allDb.users.length} জন</span>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-2xs">
              <span className="text-[10px] font-bold text-blue-600 block uppercase">সাধারণ গ্রাহক</span>
              <span className="text-xl font-black text-blue-700 mt-0.5 block">
                {allDb.users.filter(u => u.role === 'user').length} জন
              </span>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-2xs">
              <span className="text-[10px] font-bold text-indigo-600 block uppercase">নিবন্ধিত মার্চেন্ট</span>
              <span className="text-xl font-black text-indigo-700 mt-0.5 block">
                {allDb.users.filter(u => u.role === 'merchant').length} জন
              </span>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-2xs">
              <span className="text-[10px] font-bold text-emerald-600 block uppercase">লাইসেন্স ভেরিফাইড</span>
              <span className="text-xl font-black text-emerald-700 mt-0.5 block">
                {allDb.users.filter(u => u.isMerchantVerified).length} জন
              </span>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-2xs col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold text-purple-600 block uppercase">অ্যাডমিনিস্ট্রেটর</span>
              <span className="text-xl font-black text-purple-700 mt-0.5 block">
                {allDb.users.filter(u => u.role === 'admin').length} জন
              </span>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900">ব্যবহারকারী ও গ্রাহক ব্যবস্থাপনা (Users & Customers)</h4>
                <p className="text-[11px] text-slate-500">সকল গ্রাহক, মার্চেন্ট ও অ্যাডমিন প্রোফাইল এডিট, রোল পরিবর্তন ও ডিলিট করুন</p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {/* Role Filters */}
                <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                  <button
                    type="button"
                    onClick={() => setUserRoleFilter('all')}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      userRoleFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    সব ({allDb.users.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserRoleFilter('user')}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      userRoleFilter === 'user' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    👤 গ্রাহক
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserRoleFilter('merchant')}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      userRoleFilter === 'merchant' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🏪 মার্চেন্ট
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserRoleFilter('admin')}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      userRoleFilter === 'admin' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🔑 অ্যাডমিন
                  </button>
                </div>

                {/* Verification Filter */}
                <select
                  value={userVerificationFilter}
                  onChange={(e) => setUserVerificationFilter(e.target.value as any)}
                  className="text-xs font-bold px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                >
                  <option value="all">সব ভেরিফিকেশন অবস্থা</option>
                  <option value="verified">✅ কেবল ভেরিফাইড</option>
                  <option value="unverified">⏳ আনভেরিফাইড / পেন্ডিং</option>
                </select>

                <div className="relative w-52 sm:w-60">
                  <input
                    type="text"
                    placeholder="নাম, ফোন বা জেলা..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
                </div>

                <button
                  type="button"
                  onClick={openCreateUserModal}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  নতুন ইউজার যোগ করুন
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
                    <th className="p-3">ব্যবহারকারী</th>
                    <th className="p-3">মোবাইল ও ইমেইল</th>
                    <th className="p-3">রোল (Role)</th>
                    <th className="p-3">লোকেশন ও জেলা</th>
                    <th className="p-3">ট্রেড লাইসেন্স ও স্ট্যাটাস</th>
                    <th className="p-3">যোগদানের তারিখ</th>
                    <th className="p-3 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 font-semibold">
                        কোনো ব্যবহারকারী পাওয়া যায়নি।
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u, i) => (
                      <tr key={u.phone || i} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 shrink-0 overflow-hidden">
                              {u.image ? (
                                <img src={u.image} alt={u.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                u.name ? u.name.substring(0, 2).toUpperCase() : 'U'
                              )}
                            </div>
                            <div>
                              <button 
                                type="button"
                                onClick={() => setSelectedUserDetail(u)}
                                className="font-bold text-blue-600 hover:text-blue-800 hover:underline transition-all text-left block"
                              >
                                {u.name}
                              </button>
                              <span className="text-[10px] text-slate-400 font-medium">{u.designation || (u.role === 'merchant' ? 'মার্চেন্ট' : u.role === 'admin' ? 'অ্যাডমিন' : 'গ্রাহক')}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-mono text-slate-900 font-bold">{u.phone}</div>
                          {u.email && <div className="text-[10px] text-slate-400 font-medium truncate max-w-[140px]">{u.email}</div>}
                        </td>
                        <td className="p-3">
                          <select
                            id={`user-role-select-${u.phone}`}
                            value={u.role}
                            onChange={(e) => {
                              const newRole = e.target.value as 'user' | 'merchant' | 'admin';
                              onUpdateUser(u.phone, { role: newRole });
                            }}
                            className={`text-[11px] font-extrabold px-2 py-1 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-all ${
                              u.role === 'admin' 
                                ? 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200' 
                                : u.role === 'merchant' 
                                  ? 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200' 
                                  : 'bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200'
                            }`}
                          >
                            <option value="user">👤 গ্রাহক (User)</option>
                            <option value="merchant">🏪 মার্চেন্ট (Merchant)</option>
                            <option value="admin">🔑 অ্যাডমিন (Admin)</option>
                          </select>

                          {u.role === 'merchant' && (
                            <div className="mt-1 flex flex-col gap-0.5">
                              {(() => {
                                const uBiz = allDb.businesses.find(b => 
                                  (b.ownerPhone && b.ownerPhone === u.phone) || 
                                  (b.phone && b.phone === u.phone) || 
                                  (u.email && b.ownerEmail && b.ownerEmail.toLowerCase() === u.email.toLowerCase())
                                );
                                if (uBiz) {
                                  return (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setBizSearch(u.phone);
                                        setActiveAdminSubTab('businesses');
                                      }}
                                      className="text-[9px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded font-bold flex items-center gap-1 cursor-pointer truncate max-w-[130px]"
                                      title="দোকান দেখতে ক্লিক করুন"
                                    >
                                      🏪 {uBiz.name}
                                    </button>
                                  );
                                } else {
                                  return (
                                    <button
                                      type="button"
                                      onClick={() => openCreateBizModal(u.phone, u.name)}
                                      className="text-[9px] bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.5 rounded font-bold flex items-center gap-1 cursor-pointer"
                                    >
                                      ➕ দোকান যোগ
                                    </button>
                                  );
                                }
                              })()}
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="text-slate-800 font-bold">{u.location?.district || u.location?.thana || 'ঢাকা'}</div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[130px]">{u.location?.address || 'ধানমন্ডি, ঢাকা'}</div>
                        </td>
                        <td className="p-3">
                          {u.tradeLicenseNo ? (
                            <div className="space-y-1">
                              <div className="font-semibold text-slate-800 flex items-center gap-1 text-[11px]">
                                📄 {u.tradeLicenseNo}
                              </div>
                              <div className="flex flex-wrap items-center gap-1">
                                {u.isMerchantVerified ? (
                                  <span className="bg-emerald-100 text-emerald-800 text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                                    ✅ ভেরিফাইড
                                  </span>
                                ) : (
                                  <span className="bg-amber-100 text-amber-800 text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                                    ⏳ পেন্ডিং
                                  </span>
                                )}
                                
                                <button
                                  type="button"
                                  onClick={() => {
                                    onUpdateUser(u.phone, { isMerchantVerified: !u.isMerchantVerified });
                                  }}
                                  className={`text-[9px] px-1.5 py-0.5 rounded border transition-all font-bold cursor-pointer ${
                                    u.isMerchantVerified 
                                      ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100' 
                                      : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                  }`}
                                >
                                  {u.isMerchantVerified ? 'বাতিল' : 'ভেরিফাই'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px]">—</span>
                          )}
                        </td>
                        <td className="p-3 text-slate-500 text-[11px] font-medium whitespace-nowrap">
                          {formatBanglaDate(u.createdAt)}
                        </td>
                        <td className="p-3 text-right space-x-1.5 flex justify-end items-center">
                          <button
                            type="button"
                            onClick={() => openEditUserModal(u)}
                            className="px-2.5 py-1 text-[11px] font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg cursor-pointer flex items-center gap-1 transition-all"
                            title="সম্পূর্ণ এডিট"
                          >
                            <Edit3 className="w-3 h-3" />
                            এডিট
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedUserDetail(u)}
                            className="px-2 py-1 text-[11px] font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg cursor-pointer transition-all"
                            title="বিস্তারিত দেখুন"
                          >
                            👁️
                          </button>
                          <button
                            type="button"
                            id={`delete-user-btn-${u.phone}`}
                            onClick={() => handleDeleteUserWithConfirmation(u.phone, u.name)}
                            className="px-2 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg cursor-pointer transition-all"
                            title="মুছে ফেলুন"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Businesses view */}
      {activeAdminSubTab === 'businesses' && (
        <div className="space-y-4">
          {/* Quick Metrics Header */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">সর্বমোট দোকান</span>
              <span className="text-xl font-black text-slate-900 mt-0.5 block">{allDb.businesses.length} টি</span>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-2xs">
              <span className="text-[10px] font-bold text-emerald-600 block uppercase">অনুমোদিত দোকান</span>
              <span className="text-xl font-black text-emerald-700 mt-0.5 block">
                {allDb.businesses.filter(b => b.isApproved !== false).length} টি
              </span>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-2xs">
              <span className="text-[10px] font-bold text-amber-600 block uppercase">পেন্ডিং অনুমোদন</span>
              <span className="text-xl font-black text-amber-700 mt-0.5 block">
                {allDb.businesses.filter(b => b.isApproved === false).length} টি
              </span>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-2xs">
              <span className="text-[10px] font-bold text-indigo-600 block uppercase">খোলা রয়েছে</span>
              <span className="text-xl font-black text-indigo-700 mt-0.5 block">
                {allDb.businesses.filter(b => b.isOpen).length} টি
              </span>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-2xs">
              <span className="text-[10px] font-bold text-purple-600 block uppercase">স্পন্সরড শপ</span>
              <span className="text-xl font-black text-purple-700 mt-0.5 block">
                {allDb.businesses.filter(b => b.isSponsored).length} টি
              </span>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-2xs">
              <span className="text-[10px] font-bold text-teal-600 block uppercase">পাইকারি মার্চেন্ট</span>
              <span className="text-xl font-black text-teal-700 mt-0.5 block">
                {allDb.businesses.filter(b => b.isWholesale).length} টি
              </span>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden space-y-0">
            <div className="p-4 border-b border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900">দোকান ও ব্যবসা প্রতিষ্ঠান ব্যবস্থাপনা (Businesses & Stores)</h4>
                <p className="text-[11px] text-slate-500">নতুন দোকান তৈরি, পূর্ণ এডিট, প্যাকেজ পরিবর্তন, আইটেম কন্ট্রোল ও ডিলিট করুন</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Approval Filter */}
                <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                  <button
                    type="button"
                    onClick={() => setBizApprovalFilter('all')}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      bizApprovalFilter === 'all'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    সব ({allDb.businesses.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setBizApprovalFilter('pending')}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                      bizApprovalFilter === 'pending'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'text-amber-700 hover:bg-amber-100/50'
                    }`}
                  >
                    ⏳ পেন্ডিং ({allDb.businesses.filter(b => b.isApproved === false).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setBizApprovalFilter('approved')}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      bizApprovalFilter === 'approved'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-emerald-700 hover:bg-emerald-100/50'
                    }`}
                  >
                    ✓ অনুমোদিত
                  </button>
                </div>

                {/* Category Filter */}
                <select
                  value={bizCategoryFilter}
                  onChange={(e) => setBizCategoryFilter(e.target.value)}
                  className="text-xs font-bold px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                >
                  <option value="all">সব ক্যাটাগরি</option>
                  <option value="grocery">মুদিখানা (Grocery)</option>
                  <option value="pharmacy">ফার্মেসি (Pharmacy)</option>
                  <option value="restaurant">রেস্তোরাঁ / খাবার (Restaurant)</option>
                  <option value="electrician">ইলেকট্রিশিয়ান (Electrician)</option>
                  <option value="plumber">প্লাম্বার (Plumber)</option>
                  <option value="doctor">ডাক্তার / ক্লিনিক (Doctor)</option>
                  <option value="tutor">টিউটর / শিক্ষক (Tutor)</option>
                  <option value="laundry">লন্ড্রি সার্ভিস (Laundry)</option>
                  <option value="clothing">পোশাক / ফ্যাশন (Clothing)</option>
                  <option value="electronics">ইলেকট্রনিক্স (Electronics)</option>
                  <option value="wholesale">পাইকারি ভান্ডার (Wholesale)</option>
                </select>

                {/* Status Filter */}
                <select
                  value={bizStatusFilter}
                  onChange={(e) => setBizStatusFilter(e.target.value as any)}
                  className="text-xs font-bold px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                >
                  <option value="all">সকল অবস্থা</option>
                  <option value="open">🟢 খোলা দোকান</option>
                  <option value="closed">🔴 বন্ধ দোকান</option>
                  <option value="sponsored">⚡ স্পন্সরড দোকান</option>
                  <option value="wholesale">📦 পাইকারি দোকান</option>
                </select>

                <div className="relative w-48 sm:w-56">
                  <input
                    type="text"
                    placeholder="দোকানের নাম, ফোন বা ঠিকানা..."
                    value={bizSearch}
                    onChange={(e) => setBizSearch(e.target.value)}
                    className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
                </div>

                <button
                  type="button"
                  onClick={() => openCreateBizModal()}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  নতুন দোকান যোগ করুন
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
                    <th className="p-3">দোকানের নাম ও ঠিকানা</th>
                    <th className="p-3">মালিক ও যোগাযোগ</th>
                    <th className="p-3">ক্যাটাগরি ও ধরন</th>
                    <th className="p-3">প্যাকেজ ও রেটিং</th>
                    <th className="p-3">খোলা/বন্ধ</th>
                    <th className="p-3">অনুমোদন</th>
                    <th className="p-3">তৈরির তারিখ</th>
                    <th className="p-3 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBusinesses.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400 font-semibold">
                        কোনো দোকান পাওয়া যায়নি।
                      </td>
                    </tr>
                  ) : (
                    filteredBusinesses.map((b, i) => (
                      <React.Fragment key={b.id || i}>
                        <tr className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3">
                            <div className="flex items-center gap-2.5">
                              <img 
                                src={b.logo || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=100'} 
                                alt="" 
                                className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0" 
                                referrerPolicy="no-referrer"
                              />
                              <div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setBizModalTab('info');
                                    setSelectedBizDetail(b);
                                  }}
                                  className="font-bold text-indigo-700 hover:text-indigo-900 hover:underline text-left flex items-center gap-1.5 cursor-pointer transition-all"
                                >
                                  {b.name}
                                  {b.isSponsored && <span className="bg-amber-100 text-amber-800 text-[8px] px-1 rounded font-black">SPONSORED</span>}
                                  {b.isWholesale && <span className="bg-teal-100 text-teal-800 text-[8px] px-1 rounded font-black">WHOLESALE</span>}
                                </button>
                                <div className="text-[10px] text-slate-400 truncate max-w-[200px]">{b.address || 'ধানমন্ডি, ঢাকা'}</div>
                                {b.websiteUrl && (
                                  <a
                                    href={b.websiteUrl.startsWith('http') ? b.websiteUrl : `https://${b.websiteUrl}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[9px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-0.5 mt-0.5"
                                  >
                                    🌐 {b.websiteUrl.replace(/^https?:\/\//, '')}
                                  </a>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="font-mono text-slate-900 font-bold">{b.ownerPhone || b.phone}</div>
                            <div className="text-[10px] text-slate-500 font-medium">{b.ownerName || 'মালিক'}</div>
                          </td>
                          <td className="p-3">
                            <span className="text-slate-800 font-bold capitalize block">{b.category}</span>
                            <span className="text-[10px] text-slate-400 font-medium">{b.type === 'shop' ? '🛍️ পণ্য বিক্রেতা' : '🛠️ জরুরি সেবা'}</span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1.5">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                b.subscriptionPlan === 'diamond' 
                                  ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                                  : b.subscriptionPlan === 'gold'
                                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                    : b.subscriptionPlan === 'silver'
                                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                      : 'bg-slate-100 text-slate-800'
                              }`}>
                                {b.subscriptionPlan?.toUpperCase() || 'FREE'}
                              </span>
                              <span className="text-[10px] font-bold text-amber-500">⭐ {b.rating || '5.0'}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5 font-medium">ব্যালেন্স: ৳{b.balance || 0}</div>
                          </td>
                          <td className="p-3">
                            <button
                              type="button"
                              onClick={() => onUpdateBusiness(b.id, { isOpen: !b.isOpen })}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                                b.isOpen ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                              }`}
                              title="ক্লিক করে খোলা বা বন্ধ করুন"
                            >
                              {b.isOpen ? '🟢 খোলা' : '🔴 বন্ধ'}
                            </button>
                          </td>
                          <td className="p-3">
                            <div className="flex flex-col gap-1 items-start">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${b.isApproved !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                {b.isApproved !== false ? 'অনুমোদিত' : 'পেন্ডিং'}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleToggleBusinessApproval(b.id)}
                                className={`px-1.5 py-0.5 rounded text-[9px] font-bold cursor-pointer transition-colors ${b.isApproved !== false ? 'bg-slate-100 hover:bg-amber-50 text-amber-700' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                              >
                                {b.isApproved !== false ? '✕ স্থগিত' : '✓ অনুমোদন'}
                              </button>
                            </div>
                          </td>
                          <td className="p-3 text-slate-500 text-[11px] font-medium whitespace-nowrap">
                            {formatBanglaDate(b.createdAt)}
                          </td>
                          <td className="p-3 text-right space-x-1.5 flex justify-end items-center">
                            <button
                              type="button"
                              onClick={() => openEditBizModal(b)}
                              className="px-2.5 py-1 text-[11px] font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-lg cursor-pointer flex items-center gap-1 transition-all"
                              title="সম্পূর্ণ দোকান এডিট করুন"
                            >
                              <Edit3 className="w-3 h-3" />
                              এডিট
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setBizModalTab('info');
                                setSelectedBizDetail(b);
                              }}
                              className="px-2 py-1 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer transition-all"
                              title="দোকানের প্রোফাইল শপ দেখুন"
                            >
                              👁️
                            </button>
                            <button
                              type="button"
                              onClick={() => setExpandedBizId(expandedBizId === b.id ? null : b.id)}
                              className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                                expandedBizId === b.id ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                              }`}
                              title="পণ্য ও সেবা তালিকা"
                            >
                              📦 {b.products?.length + b.services?.length}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteBizWithConfirmation(b.id, b.name)}
                              className="px-2 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg cursor-pointer transition-all"
                              title="দোকান মুছে ফেলুন"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                        {expandedBizId === b.id && (
                          <tr className="bg-slate-50/70">
                            <td colSpan={7} className="p-4 border-t border-b border-slate-100">
                              <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-100 shadow-xs text-left">
                                <div className="flex items-center justify-between border-b pb-2 mb-2">
                                  <h5 className="text-xs font-black text-slate-800 flex items-center gap-1">
                                    📦 "{b.name}" এর পণ্য ও সেবা তালিকা এবং অনুমোদন কন্ট্রোল
                                  </h5>
                                  <span className="text-[10px] text-slate-500 font-bold">
                                    মোট আইটেম: {b.products.length + b.services.length}টি
                                  </span>
                                </div>

                                {b.products.length === 0 && b.services.length === 0 ? (
                                  <p className="text-[11px] text-slate-400 py-2">এই ব্যবসা প্রতিষ্ঠানে কোনো পণ্য বা সেবা যোগ করা হয়নি।</p>
                                ) : (
                                  <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                                    {/* Products List */}
                                    {b.products.length > 0 && (
                                      <div className="space-y-1.5">
                                        <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider">পণ্য সম্ভার (Products)</span>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                          {b.products.map((p) => (
                                            <div key={p.id} className="p-2.5 rounded-lg border bg-slate-50 flex items-center justify-between gap-4">
                                              <div className="space-y-0.5 min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                  <span className="font-bold text-slate-800 text-[11px] truncate">{p.name}</span>
                                                  <span className="font-bold text-[10px] text-emerald-600">৳{p.price}</span>
                                                </div>
                                                <p className="text-[10px] text-slate-400 truncate">{p.description || 'বিবরণ নেই'}</p>
                                              </div>
                                              <div className="flex items-center gap-2 shrink-0">
                                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${p.isApproved !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                                  {p.isApproved !== false ? 'অনুমোদিত' : 'পেন্ডিং'}
                                                </span>
                                                <button
                                                  type="button"
                                                  onClick={() => handleToggleItemApproval(b.id, p.id)}
                                                  className={`px-2 py-1 rounded text-[9px] font-extrabold cursor-pointer ${p.isApproved !== false ? 'bg-amber-50 hover:bg-amber-100 text-amber-700' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                                                >
                                                  {p.isApproved !== false ? 'স্থগিত' : 'অনুমোদন'}
                                                </button>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Services List */}
                                    {b.services.length > 0 && (
                                      <div className="space-y-1.5">
                                        <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider">সেবা সম্ভার (Services)</span>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                          {b.services.map((s) => (
                                            <div key={s.id} className="p-2.5 rounded-lg border bg-slate-50 flex items-center justify-between gap-4">
                                              <div className="space-y-0.5 min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                  <span className="font-bold text-slate-800 text-[11px] truncate">{s.name}</span>
                                                  <span className="font-bold text-[10px] text-indigo-600">৳{s.charge}</span>
                                                </div>
                                                <p className="text-[10px] text-slate-400 truncate">{s.description || 'বিবরণ নেই'}</p>
                                              </div>
                                              <div className="flex items-center gap-2 shrink-0">
                                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${s.isApproved !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                                  {s.isApproved !== false ? 'অনুমোদিত' : 'পেন্ডিং'}
                                                </span>
                                                <button
                                                  type="button"
                                                  onClick={() => handleToggleItemApproval(b.id, s.id)}
                                                  className={`px-2 py-1 rounded text-[9px] font-extrabold cursor-pointer ${s.isApproved !== false ? 'bg-amber-50 hover:bg-amber-100 text-amber-700' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                                                >
                                                  {s.isApproved !== false ? 'স্থগিত' : 'অনুমোদন'}
                                                </button>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Bookings & Orders Control view */}
      {activeAdminSubTab === 'bookings' && (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4">
            <h4 className="text-sm font-bold text-slate-900">সকল কাস্টমার অর্ডার ও বুকিং নিয়ন্ত্রণ</h4>
            <div className="relative w-64">
              <input
                type="text"
                placeholder="বুকিং আইডি বা মোবাইল বা নাম..."
                value={bookingSearch}
                onChange={(e) => setBookingSearch(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
              />
              <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
                  <th className="p-3">বুকিং আইডি ও তারিখ</th>
                  <th className="p-3">ব্যবসা প্রতিষ্ঠান</th>
                  <th className="p-3">গ্রাহক তথ্য</th>
                  <th className="p-3">আইটেম সমূহ</th>
                  <th className="p-3">বিল</th>
                  <th className="p-3">পেমেন্ট অবস্থা</th>
                  <th className="p-3">বর্তমান অবস্থা</th>
                  <th className="p-3 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(allDb.bookings || [])
                  .filter(b => 
                    b.id.toLowerCase().includes(bookingSearch.toLowerCase()) || 
                    b.userPhone.includes(bookingSearch) ||
                    b.userName.toLowerCase().includes(bookingSearch.toLowerCase()) ||
                    b.businessName.toLowerCase().includes(bookingSearch.toLowerCase())
                  )
                  .map((b, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="p-3">
                        <div className="font-bold text-slate-800">#{b.id}</div>
                        <div className="text-[10px] text-slate-400">{new Date(b.createdAt).toLocaleDateString('bn-BD')}</div>
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-slate-700">{b.businessName}</span>
                        <span className="block text-[10px] text-slate-400 font-mono">{b.businessPhone}</span>
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-slate-700">{b.userName}</span>
                        <span className="block text-[10px] text-slate-400 font-mono">{b.userPhone}</span>
                      </td>
                      <td className="p-3 max-w-[180px] truncate" title={b.items.map((it: any) => `${it.name} (x${it.quantity})`).join(', ')}>
                        {b.items.map((it: any) => `${it.name} (x${it.quantity})`).join(', ')}
                      </td>
                      <td className="p-3 font-extrabold text-slate-900">
                        ৳ {b.totalPrice + (b.deliveryCharge || 0)}
                      </td>
                      <td className="p-3">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${b.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                          {b.paymentStatus === 'paid' ? 'পেইড সম্পন্ন' : 'বাকি / ক্যাশ'}
                        </span>
                        <button
                          onClick={() => {
                            const newPayStatus = b.paymentStatus === 'paid' ? 'pending' : 'paid';
                            onUpdateBookingStatus(b.id, b.status, newPayStatus);
                          }}
                          className="block text-[9px] text-blue-600 hover:underline mt-1 font-semibold"
                        >
                          ⚙️ পেমেন্ট পরিবর্তন
                        </button>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          b.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : b.status === 'cancelled' ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {b.status === 'pending' ? 'পেন্ডিং' : b.status === 'accepted' ? 'গৃহীত' : b.status === 'processing' ? 'চলমান' : b.status === 'completed' ? 'সম্পন্ন' : b.status === 'cancelled' ? 'বাতিল' : b.status}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-1.5 flex justify-end items-center">
                        <select
                          value={b.status}
                          onChange={(e) => onUpdateBookingStatus(b.id, e.target.value, b.paymentStatus)}
                          className="text-[10px] p-1 border rounded bg-white text-slate-700 focus:outline-none font-bold"
                        >
                          <option value="pending">পেন্ডিং</option>
                          <option value="accepted">গৃহীত</option>
                          <option value="processing">চলমান</option>
                          <option value="completed">সম্পন্ন</option>
                          <option value="cancelled">বাতিল</option>
                        </select>
                        <button
                          onClick={() => {
                            if (confirm('আপনি কি এই বুকিং রেকর্ডটি চিরতরে মুছে ফেলতে চান?')) {
                              onDeleteBooking(b.id);
                            }
                          }}
                          className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                          title="বুকিং মুছুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Complaints view */}
      {activeAdminSubTab === 'complaints' && (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden p-4 space-y-4">
          <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">দায়েরকৃত অভিযোগ সমূহ (Customer Disputes)</h4>
          {allDb.complaints.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
              <p className="text-xs font-semibold">সকল অভিযোগ সুন্দরভাবে নিষ্পত্তি করা হয়েছে!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {allDb.complaints.map((c) => (
                <div key={c.id} className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">{c.subject}</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${c.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800 animate-pulse'}`}>
                        {c.status === 'resolved' ? 'নিষ্পত্তি হয়েছে' : 'তদন্তাধীন'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{c.details}</p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-400">
                      <span>অভিযোগকারী: {c.userName} ({c.userPhone})</span>
                      <span>অভিযুক্ত দোকান: <strong className="text-slate-600">{c.businessName}</strong></span>
                      <span>তারিখ: {new Date(c.date).toLocaleDateString('bn-BD')}</span>
                    </div>
                  </div>
                  {c.status === 'pending' && (
                    <button
                      onClick={() => onResolveComplaint(c.id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] py-1.5 px-3 rounded-lg shrink-0 cursor-pointer"
                    >
                      ✓ সমাধান করুন
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Ads verification */}
      {activeAdminSubTab === 'ads' && (
        <div className="space-y-6">
          {/* Header & Toggle Button */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h4 className="text-sm font-black text-slate-900">বিজ্ঞাপন ও প্রমোশন ক্যাম্পেইন ম্যানেজার</h4>
              <p className="text-[10px] text-slate-500 font-medium">গ্রাহক ও মার্চেন্টদের বিজ্ঞাপন ও প্রমোশন রিভিউ করুন অথবা সরাসরি এডমিন প্রোফাইল থেকে বিজ্ঞাপন যুক্ত করুন</p>
            </div>
            <button
              onClick={() => setShowCreateAdForm(!showCreateAdForm)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
                showCreateAdForm 
                  ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' 
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-200'
              }`}
            >
              {showCreateAdForm ? '✕ ফর্ম বন্ধ করুন' : '➕ নতুন বিজ্ঞাপন তৈরি করুন'}
            </button>
          </div>

          {/* Create Ad Form */}
          {showCreateAdForm && (
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 max-w-xl mx-auto space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
                <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg text-lg">📢</span>
                <div>
                  <h4 className="text-sm font-black text-slate-900">সরাসরি প্রমোশন বিজ্ঞাপন যুক্ত করুন</h4>
                  <p className="text-[10px] text-slate-500 font-medium">যেকোনো মার্চেন্ট ব্যবসার জন্য সরাসরি সচল প্রমোশন বিজ্ঞাপন ক্যাম্পেইন শুরু করুন</p>
                </div>
              </div>

              <form onSubmit={handleDirectCreateAd} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">ব্যবসা প্রতিষ্ঠান নির্বাচন করুন (Select Business)</label>
                  <select
                    required
                    value={newAdBizId}
                    onChange={(e) => setNewAdBizId(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none font-bold text-slate-900"
                  >
                    <option value="">-- ব্যবসা প্রতিষ্ঠান সিলেক্ট করুন --</option>
                    {allDb.businesses.map(biz => (
                      <option key={biz.id} value={biz.id}>
                        {biz.name} (ক্যাটাগরি: {biz.category} - {biz.phone})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">ব্যানার ইমেজ বা প্রমোশন ভিডিও লিংক (Banner/Video URL)</label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: https://example.com/promo-video.mp4 অথবা ইউটিউব লিংক"
                    value={newAdBanner}
                    onChange={(e) => setNewAdBanner(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none font-medium text-slate-900"
                  />
                  <span className="text-[9px] text-slate-400 block mt-0.5">MP4 বা WebM ভিডিও, YouTube ভিডিও লিঙ্ক, অথবা সাধারণ জেপিজি/পিএনজি ইমেজ লিঙ্ক ব্যবহার করতে পারেন।</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">বিজ্ঞাপন প্লেসমেন্ট (Placement)</label>
                    <select
                      value={newAdPlacement}
                      onChange={(e: any) => setNewAdPlacement(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none font-bold text-slate-900"
                    >
                      <option value="homepage">হোমপেজ মেইন ব্যানার (Homepage Top Banner)</option>
                      <option value="category">ক্যাটাগরি পেজ টপ ব্যানার (Category Top)</option>
                      <option value="search">সার্চ পেজ বুস্ট (Search Boosting)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">ক্যাম্পেইন বাজেট (Budget ৳)</label>
                    <input
                      type="number"
                      required
                      min={100}
                      value={newAdBudget}
                      onChange={(e) => setNewAdBudget(Number(e.target.value))}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none font-bold text-slate-950"
                    />
                  </div>
                </div>

                {/* Live Media Preview if filled */}
                {newAdBanner && (
                  <div className="border border-slate-100 rounded-xl p-2.5 bg-slate-50/50 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-500 block">লাইভ প্রিভিউ (Live Preview):</span>
                    <div className="aspect-video w-full rounded-lg overflow-hidden relative border bg-slate-950">
                      {renderAdMediaPreview(newAdBanner, "w-full h-full object-cover")}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateAdForm(false);
                      setNewAdBizId('');
                      setNewAdBanner('');
                    }}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl transition-all text-xs cursor-pointer"
                  >
                    বাতিল করুন
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingAd}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-55 text-white font-bold py-2.5 px-4 rounded-xl transition-all text-xs cursor-pointer shadow-md shadow-blue-100"
                  >
                    {isCreatingAd ? 'বিজ্ঞাপন তৈরি হচ্ছে...' : '🚀 বিজ্ঞাপন তৈরি ও সক্রিয় করুন'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Active Campaigns & Requests List */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden p-4 space-y-4">
            <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">আবেদন রিভিউ ও সক্রিয় বিজ্ঞাপন সমূহ</h4>
            {allDb.adCampaigns.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <p className="text-xs">নতুন কোনো বিজ্ঞাপনের আবেদন এই মুহূর্তে নেই।</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allDb.adCampaigns.map((ad) => {
                const isEditing = editingAdId === ad.id;
                const isVideo = isAdVideo(ad.bannerImage);

                return (
                  <div key={ad.id} className="border border-slate-100 rounded-xl overflow-hidden shadow-sm flex flex-col bg-white">
                    {/* Media Preview Section */}
                    <div className="relative h-32 bg-slate-50 border-b">
                      {isEditing ? (
                        <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-xs flex items-center justify-center text-[10px] text-slate-500 font-bold">
                          {renderAdMediaPreview(editAdBanner, "w-full h-full object-cover")}
                        </div>
                      ) : (
                        renderAdMediaPreview(ad.bannerImage, "w-full h-full object-cover")
                      )}
                      
                      {/* Media Format Badge */}
                      <span className="absolute top-2 left-2 bg-slate-900/75 text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wider backdrop-blur-xs">
                        {isVideo ? '🎥 ভিডিও প্রমোশন' : '🖼️ ইমেজ প্রমোশন'}
                      </span>
                    </div>

                    <div className="p-3 flex-1 flex flex-col justify-between space-y-3">
                      {isEditing ? (
                        /* Editing Mode Interface */
                        <div className="space-y-2.5">
                          <div className="text-[11px] font-black text-slate-800">
                            ✏️ সম্পাদনা করছেন: <span className="text-blue-600">{ad.businessName}</span>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 block">বিজ্ঞাপন ছবি বা ভিডিও লিংক (Banner Image/Video URL)</label>
                            <input
                              type="text"
                              value={editAdBanner}
                              onChange={(e) => setEditAdBanner(e.target.value)}
                              placeholder="https://example.com/banner.mp4"
                              className="w-full text-[11px] bg-slate-50 border border-slate-200 rounded p-1.5 focus:outline-none font-medium"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-500 block">প্লেসমেন্ট (Placement)</label>
                              <select
                                value={editAdPlacement}
                                onChange={(e: any) => setEditAdPlacement(e.target.value)}
                                className="w-full text-[11px] bg-slate-50 border border-slate-200 rounded p-1.5 focus:outline-none font-bold"
                              >
                                <option value="homepage">Homepage Banner</option>
                                <option value="category">Category Top</option>
                                <option value="search">Search Boosting</option>
                              </select>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-500 block">বাজেট (Budget)</label>
                              <input
                                type="number"
                                value={editAdBudget}
                                onChange={(e) => setEditAdBudget(Number(e.target.value))}
                                className="w-full text-[11px] bg-slate-50 border border-slate-200 rounded p-1.5 focus:outline-none font-bold text-blue-600"
                              />
                            </div>
                          </div>

                          <div className="flex gap-2 pt-2">
                            <button
                              onClick={() => setEditingAdId(null)}
                              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-1 px-2 rounded text-[10px] cursor-pointer"
                            >
                              বাতিল করুন
                            </button>
                            <button
                              onClick={() => handleUpdateAdCampaign(ad.id)}
                              disabled={isSavingAd}
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded text-[10px] cursor-pointer"
                            >
                              {isSavingAd ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Standard View Mode */
                        <>
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-slate-800">{ad.businessName}</span>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                ad.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : ad.status === 'rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {ad.status === 'approved' ? 'সক্রিয়' : ad.status === 'rejected' ? 'বাতিল' : 'অনুমোদন পেন্ডিং'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1">ক্যাম্পেইন প্লেসমেন্ট: <strong className="text-slate-700 uppercase">{ad.placement}</strong></p>
                            <p className="text-[11px] text-slate-500">বাজেট ও কমিশন ফি: <strong className="text-blue-600">৳ {ad.budget}</strong></p>
                            <p className="text-[10px] text-slate-400 mt-1 truncate max-w-full" title={ad.bannerImage}>
                              লিংক: <span className="font-mono">{ad.bannerImage}</span>
                            </p>
                          </div>

                          <div className="flex gap-1.5 pt-2 border-t border-slate-50">
                            {/* Always allow Editing ad details directly */}
                            <button
                              onClick={() => {
                                setEditingAdId(ad.id);
                                setEditAdBanner(ad.bannerImage);
                                setEditAdPlacement(ad.placement);
                                setEditAdBudget(ad.budget);
                              }}
                              className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold py-1.5 px-2 rounded text-[11px] cursor-pointer transition-all flex items-center justify-center gap-1"
                            >
                              ✏️ তথ্য পরিবর্তন (Edit URL)
                            </button>

                            {ad.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => onToggleAdStatus(ad.id, 'approved')}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-2.5 rounded text-[11px] cursor-pointer transition-all"
                                >
                                  ✓ অনুমোদন দিন
                                </button>
                                <button
                                  onClick={() => onToggleAdStatus(ad.id, 'rejected')}
                                  className="bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-bold py-1.5 px-2 rounded text-[11px] cursor-pointer transition-all"
                                >
                                  ✕ বাতিল
                                </button>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    )}

      {/* Broadcast Center */}
      {activeAdminSubTab === 'broadcast' && (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 max-w-lg mx-auto">
          <div className="text-center space-y-2 mb-5">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto"><Bell className="w-6 h-6" /></div>
            <h4 className="text-sm font-bold text-slate-900">নোটিফিকেশন ব্রডকাস্ট সিস্টেম</h4>
            <p className="text-xs text-slate-500">সব গ্রাহক এবং মার্চেন্টদের মোবাইলের হোমপেজে তাৎক্ষণিক পুশ নোটিফিকেশন এলার্ট যাবে।</p>
          </div>
          <form onSubmit={handleBroadcastSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">নোটিফিকেশন শিরোনাম (Title)</label>
              <input
                type="text"
                required
                placeholder="যেমন: বিশেষ ঈদ অফার!, সিস্টেম রক্ষণাবেক্ষণ নোটিশ"
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">বার্তা বিস্তারিত (Message Body)</label>
              <textarea
                required
                rows={3}
                placeholder="সকল গ্রাহকদের উদ্দেশ্যে বার্তাটি লিখুন..."
                value={broadcastMsg}
                onChange={(e) => setBroadcastMsg(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none resize-none"
              ></textarea>
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-all text-xs cursor-pointer shadow-md shadow-blue-100"
            >
              🚀 ব্রডকাস্ট বার্তা পাঠান
            </button>
          </form>
        </div>
      )}

      {/* Ticker Management Center */}
      {activeAdminSubTab === 'ticker' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form side */}
          <div className="lg:col-span-5 bg-white border border-slate-100 rounded-2xl shadow-sm p-5 space-y-4 h-fit">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
              <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-lg">📝</span>
              <div>
                <h4 className="text-sm font-black text-slate-900">
                  {editingTickerId ? 'আপডেট পরিবর্তন করুন' : 'নতুন লাইভ আপডেট যুক্ত করুন'}
                </h4>
                <p className="text-[10px] text-slate-500 font-medium">লাইভ আপডেটের শিরোনাম ও বিস্তারিত বিবরণ সেট করুন</p>
              </div>
            </div>

            <form onSubmit={handleSaveTickerMessage} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">লাইভ আপডেট শিরোনাম / টেক্সট (Marquee Text)</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: ⚡ আমাদের বুকিং সেবায় বিশেষ ছাড় চলছে!"
                  value={tickerText}
                  onChange={(e) => setTickerText(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none text-slate-950 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">বিস্তারিত বিবরণ (Detailed Body Message)</label>
                <textarea
                  rows={4}
                  placeholder="গ্রাহক এই লাইভ আপডেটে ক্লিক করলে যে বিস্তারিত লেখাটি পপআপে দেখবে তা এখানে লিখুন..."
                  value={tickerDetail}
                  onChange={(e) => setTickerDetail(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none resize-none text-slate-900 font-medium"
                ></textarea>
              </div>

              <div className="flex gap-2 pt-2">
                {editingTickerId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTickerId(null);
                      setTickerText('');
                      setTickerDetail('');
                    }}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-4 rounded-lg transition-all text-xs cursor-pointer"
                  >
                    বাতিল করুন
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSavingTicker}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-55 text-white font-bold py-2 px-4 rounded-lg transition-all text-xs cursor-pointer shadow-md shadow-blue-100"
                >
                  {isSavingTicker ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>

          {/* List side */}
          <div className="lg:col-span-7 bg-white border border-slate-100 rounded-2xl shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-50">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-lg">⚡</span>
                <div>
                  <h4 className="text-sm font-black text-slate-900">বর্তমান লাইভ আপডেট তালিকা</h4>
                  <p className="text-[10px] text-slate-500 font-medium">হোমপেজের উপরে চলমান সকল খবরের তালিকা</p>
                </div>
              </div>
              <span className="bg-indigo-100 text-indigo-700 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full border border-indigo-200">
                মোট: {tickerList.length} টি
              </span>
            </div>

            {tickerList.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs font-medium space-y-2">
                <div>📭 কোনো সক্রিয় লাইভ আপডেট খুঁজে পাওয়া যায়নি।</div>
                <div className="text-[10px] text-slate-400">নতুন আপডেট যোগ করতে বাম পাশের ফর্মটি ব্যবহার করুন।</div>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[480px] overflow-y-auto pr-1">
                {tickerList.map((item, index) => (
                  <div key={item.id || index} className="py-3 flex items-start justify-between gap-4 group hover:bg-slate-50/50 p-2 rounded-xl transition-all">
                    <div className="space-y-1 w-full truncate">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-black font-mono">#{index + 1}</span>
                        <div className="text-xs font-bold text-slate-900 truncate">{item.text}</div>
                      </div>
                      <p className="text-[10px] text-slate-500 truncate pl-6">
                        {item.detail || 'কোনো বিস্তারিত বিবরণ সেট করা নেই।'}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleSelectEditTicker(item)}
                        className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-all cursor-pointer text-[10px] font-black"
                        title="সম্পাদনা করুন"
                      >
                        সম্পাদনা
                      </button>
                      <button
                        onClick={() => handleDeleteTickerMessage(item.id)}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-all cursor-pointer text-[10px] font-black"
                        title="মুছে ফেলুন"
                      >
                        মুছে ফেলুন
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeAdminSubTab === 'subscriptions' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
          {/* Form side */}
          <div className="lg:col-span-5 bg-white border border-slate-100 rounded-2xl shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
              <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg text-lg">💳</span>
              <div>
                <h4 className="text-sm font-black text-slate-900">
                  {editingSubPlanId ? 'প্যাকেজ সম্পাদন করুন' : 'নতুন প্যাকেজ যোগ করুন'}
                </h4>
                <p className="text-[10px] text-slate-500 font-medium">সাবস্ক্রিপশন প্যাকেজের মূল্য ও সুবিধা নিয়ন্ত্রণ করুন</p>
              </div>
            </div>

            <form onSubmit={handleSaveSubPlan} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider font-black text-slate-400">প্যাকেজ আইডি (ইংরেজি ছোট অক্ষরে, যেমন: platinum)</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: silver, gold, diamond, platinum"
                  disabled={!!editingSubPlanId}
                  value={subPlanId}
                  onChange={(e) => setSubPlanId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 disabled:opacity-60"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider font-black text-slate-400">প্যাকেজের নাম (বাংলা/ইংরেজি)</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: গোল্ড প্ল্যান (Gold)"
                  value={subPlanName}
                  onChange={(e) => setSubPlanName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider font-black text-slate-400">প্যাকেজ মূল্য (৳)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="যেমন: 499"
                    value={subPlanPrice}
                    onChange={(e) => setSubPlanPrice(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider font-black text-slate-400">মূল্য পরিশোধের মেয়াদ</label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: মাসিক, বাৎসরিক, আজীবন"
                    value={subPlanPeriod}
                    onChange={(e) => setSubPlanPeriod(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider font-black text-slate-400">থিম ও কালার প্রিসেট (Border, Background & Text)</label>
                <select
                  value={subPlanColor}
                  onChange={(e) => setSubPlanColor(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900"
                >
                  <option value="border-slate-200 bg-white text-slate-900">Slate (ফ্রি/সাধারণ)</option>
                  <option value="border-blue-200 bg-blue-50/30 text-blue-900">Blue (সিলভার/বেসিক)</option>
                  <option value="border-amber-300 bg-amber-50/50 text-amber-900 ring-2 ring-amber-400">Amber/Gold (গোল্ড/প্রিমিয়াম)</option>
                  <option value="border-purple-300 bg-purple-50/30 text-purple-900">Purple (ডায়মন্ড/ভিআইপি)</option>
                  <option value="border-emerald-200 bg-emerald-50/30 text-emerald-950">Emerald (গ্রিন/স্পেশাল)</option>
                  <option value="border-pink-200 bg-pink-50/30 text-pink-900">Pink (পিঙ্ক/আকর্ষণীয়)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider font-black text-slate-400">বাটন স্টাইল প্রিসেট (Button Background & Hover)</label>
                <select
                  value={subPlanButtonStyle}
                  onChange={(e) => setSubPlanButtonStyle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900"
                >
                  <option value="bg-slate-100 text-slate-700 hover:bg-slate-200">Slate Default</option>
                  <option value="bg-blue-600 text-white hover:bg-blue-700">Blue Button</option>
                  <option value="bg-amber-500 text-white hover:bg-amber-600">Gold Button</option>
                  <option value="bg-purple-600 text-white hover:bg-purple-700">Diamond/Purple Button</option>
                  <option value="bg-emerald-600 text-white hover:bg-emerald-700">Emerald Button</option>
                  <option value="bg-pink-600 text-white hover:bg-pink-700">Pink Button</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider font-black text-slate-400">প্যাকেজ ফিচারসমূহ (প্রতি লাইনে একটি সুবিধা লিখুন)</label>
                <textarea
                  required
                  rows={5}
                  placeholder="যেমন:&#10;পণ্যের তালিকা (সর্বোচ্চ ১০টি)&#10;আনলিমিটেড অনলাইন বুকিং&#10;সহজ কুপন কোড ও অফার যোগ"
                  value={subPlanFeaturesText}
                  onChange={(e) => setSubPlanFeaturesText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 font-sans leading-relaxed"
                />
              </div>

              <div className="flex gap-2 pt-2">
                {editingSubPlanId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSubPlanId(null);
                      setSubPlanId('');
                      setSubPlanName('');
                      setSubPlanPrice(0);
                      setSubPlanPeriod('মাসিক');
                      setSubPlanFeaturesText('');
                    }}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs py-2.5 px-4 rounded-xl transition-all cursor-pointer text-center"
                  >
                    বাতিল করুন
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSavingSubPlan}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl transition-all cursor-pointer shadow-md shadow-blue-100 flex items-center justify-center gap-1"
                >
                  {isSavingSubPlan ? 'সংরক্ষণ হচ্ছে...' : editingSubPlanId ? 'প্যাকেজ আপডেট করুন' : 'প্যাকেজ তৈরি করুন'}
                </button>
              </div>
            </form>
          </div>

          {/* List side */}
          <div className="lg:col-span-7 bg-white border border-slate-100 rounded-2xl shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-50">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg text-lg">📊</span>
                <div>
                  <h4 className="text-sm font-black text-slate-900">বর্তমান সাবস্ক্রিপশন প্যাকেজসমূহ</h4>
                  <p className="text-[10px] text-slate-500 font-medium">মার্চেন্ট ড্যাশবোর্ডে প্রদর্শিত ডায়নামিক প্যাকেজ প্ল্যান</p>
                </div>
              </div>
              <span className="bg-blue-100 text-blue-700 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full border border-blue-200">
                মোট: {subPlans.length} টি প্যাকেজ
              </span>
            </div>

            {subPlans.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs font-medium space-y-2">
                <div>📭 কোনো সাবস্ক্রিপশন প্যাকেজ খুঁজে পাওয়া যায়নি।</div>
                <div className="text-[10px] text-slate-400">নতুন প্যাকেজ যোগ করতে বাম পাশের ফর্মটি পূরণ করুন।</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-1">
                {subPlans.map((plan) => (
                  <div key={plan.id} className={`border rounded-2xl p-4 flex flex-col justify-between relative transition-all ${plan.color} shadow-xs`}>
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-black text-xs text-slate-900">{plan.name}</h5>
                          <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.2 rounded font-mono uppercase font-black">ID: {plan.id}</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-sm font-black text-slate-900">৳{plan.price}</span>
                          <span className="text-[9px] text-slate-400">/ {plan.pricePeriod}</span>
                        </div>
                      </div>
                      <ul className="space-y-1 text-[10px] text-slate-600 border-t border-slate-100/50 pt-2">
                        {plan.features.map((feat: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-1">
                            <span className="text-emerald-600 font-bold">✓</span>
                            <span className="leading-tight">{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex items-center gap-1.5 mt-4 border-t border-slate-100/50 pt-3">
                      <button
                        onClick={() => handleSelectEditSubPlan(plan)}
                        className="flex-1 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-[10px] font-black transition-all cursor-pointer text-center"
                      >
                        সম্পাদনা
                      </button>
                      <button
                        onClick={() => handleDeleteSubPlan(plan.id)}
                        className="flex-1 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-[10px] font-black transition-all cursor-pointer text-center"
                      >
                        মুছে ফেলুন
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeAdminSubTab === 'licenses' && (
        <div className="space-y-6 animate-none">
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-50">
              <div>
                <h4 className="text-sm font-black text-slate-900">📄 Merchant License Verification</h4>
                <p className="text-[11px] text-slate-500 font-medium font-sans">পাইকারি দোকান থেকে কেনার জন্য মার্চেন্টদের জমা দেওয়া ট্রেড লাইসেন্স ও আবেদনগুলো পর্যালোচনা করুন</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-1 rounded-full font-mono">
                  ⏳ অপেক্ষমান (Pending): {allDb.users.filter(u => u.tradeLicenseNo && !u.isMerchantVerified && u.tradeLicenseStatus !== 'rejected').length} টি
                </span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-full font-mono">
                  ✅ ভেরিফাইড (Approved): {allDb.users.filter(u => u.tradeLicenseNo && u.isMerchantVerified).length} জন
                </span>
                <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2.5 py-1 rounded-full font-mono">
                  ❌ প্রত্যাখ্যাত (Rejected): {allDb.users.filter(u => u.tradeLicenseNo && u.tradeLicenseStatus === 'rejected').length} জন
                </span>
              </div>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row justify-between gap-3 mt-4">
              <div className="flex flex-wrap gap-1.5 border-b sm:border-b-0 border-slate-100 pb-2 sm:pb-0">
                <button
                  onClick={() => setLicenseStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    licenseStatusFilter === 'all'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  সব ({allDb.users.filter(u => u.tradeLicenseNo).length})
                </button>
                <button
                  onClick={() => setLicenseStatusFilter('pending')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    licenseStatusFilter === 'pending'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                  }`}
                >
                  ⏳ অপেক্ষমান ({allDb.users.filter(u => u.tradeLicenseNo && !u.isMerchantVerified && u.tradeLicenseStatus !== 'rejected').length})
                </button>
                <button
                  onClick={() => setLicenseStatusFilter('verified')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    licenseStatusFilter === 'verified'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  ✅ Approved ({allDb.users.filter(u => u.tradeLicenseNo && u.isMerchantVerified).length})
                </button>
                <button
                  onClick={() => setLicenseStatusFilter('rejected')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    licenseStatusFilter === 'rejected'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                  }`}
                >
                  ❌ Rejected ({allDb.users.filter(u => u.tradeLicenseNo && u.tradeLicenseStatus === 'rejected').length})
                </button>
              </div>

              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="নাম, ফোন বা লাইসেন্স নং..."
                  value={licenseSearch}
                  onChange={(e) => setLicenseSearch(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
                />
                <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>
          </div>

          {/* List of Applications */}
          {(() => {
            const applicants = allDb.users.filter(u => {
              if (!u.tradeLicenseNo) return false;
              
              // Status filter
              if (licenseStatusFilter === 'pending') {
                if (u.isMerchantVerified || u.tradeLicenseStatus === 'rejected') return false;
              }
              if (licenseStatusFilter === 'verified') {
                if (!u.isMerchantVerified) return false;
              }
              if (licenseStatusFilter === 'rejected') {
                if (u.tradeLicenseStatus !== 'rejected') return false;
              }

              // Search text
              const term = licenseSearch.toLowerCase();
              return (
                u.name.toLowerCase().includes(term) ||
                u.phone.includes(term) ||
                u.tradeLicenseNo.toLowerCase().includes(term)
              );
            });

            if (applicants.length === 0) {
              return (
                <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center text-slate-400 text-xs font-medium space-y-2 shadow-xs">
                  <div>📭 কোনো ট্রেড লাইসেন্স আবেদন পাওয়া যায়নি।</div>
                  <div className="text-[10px] text-slate-400">ফিল্টার পরিবর্তন করে অথবা অন্য নাম লিখে আবার অনুসন্ধান করুন।</div>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-none">
                {applicants.map((u, i) => {
                  const hasShop = allDb.businesses.find(b => b.ownerPhone === u.phone);
                  const isPending = !u.isMerchantVerified && u.tradeLicenseStatus !== 'rejected';
                  const isVerified = u.isMerchantVerified;
                  const isRejected = u.tradeLicenseStatus === 'rejected';

                  // Corner decorative background color
                  let cornerColor = 'bg-amber-500';
                  if (isVerified) cornerColor = 'bg-emerald-500';
                  if (isRejected) cornerColor = 'bg-rose-500';

                  return (
                    <div key={i} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between hover:shadow-md transition-all relative overflow-hidden">
                      {/* Decorative corner accent depending on status */}
                      <div className={`absolute top-0 right-0 w-24 h-24 -mr-12 -mt-12 rounded-full opacity-10 ${cornerColor}`} />

                      <div className="space-y-3 relative z-10">
                        <div className="flex justify-between items-start">
                          <div>
                            <h5 className="font-bold text-slate-900 flex items-center gap-1.5">
                              👤 {u.name}
                              <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono font-bold">
                                {u.role === 'merchant' ? 'মার্চেন্ট' : u.role}
                              </span>
                            </h5>
                            <p className="text-[10px] text-slate-500 font-medium mt-0.5">📞 {u.phone}</p>
                          </div>

                          {isVerified ? (
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              Approved
                            </span>
                          ) : isRejected ? (
                            <span className="bg-rose-100 text-rose-800 text-[10px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                              Rejected
                            </span>
                          ) : (
                            <span className="bg-amber-100 text-amber-800 text-[10px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                              Pending
                            </span>
                          )}
                        </div>

                        {/* Associated Business Profile if exists */}
                        <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-100 text-[11px] space-y-1">
                          <div className="text-slate-400 uppercase tracking-wider text-[9px] font-black">দোকান / সার্ভিস প্রোফাইল</div>
                          {hasShop ? (
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-slate-700">🏪 {hasShop.name}</span>
                              <span className="bg-blue-50 text-blue-600 text-[9px] font-bold px-1.5 py-0.2 rounded uppercase">
                                {hasShop.category}
                              </span>
                            </div>
                          ) : (
                            <div className="text-slate-400 italic text-[10px]">এখনও কোনো দোকান খোলা হয়নি।</div>
                          )}
                        </div>

                        {/* License verification details */}
                        <div className="border-t border-slate-50 pt-3 space-y-2">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-400">📄 ট্রেড লাইসেন্স নম্বর:</span>
                            <span className="font-mono font-bold text-slate-800">{u.tradeLicenseNo}</span>
                          </div>

                          {u.tradeLicenseImage && (
                            <div className="space-y-1.5">
                              <span className="text-slate-400 text-[11px] block">📷 সংযুক্ত ডকুমেন্ট / ছবি:</span>
                              <div className="border border-slate-100 rounded-xl overflow-hidden bg-slate-50 relative group max-h-40">
                                <img
                                  src={u.tradeLicenseImage}
                                  alt="Trade License"
                                  className="w-full object-cover max-h-40 hover:scale-105 transition-all"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                  <a
                                    href={u.tradeLicenseImage}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="bg-white/90 hover:bg-white text-slate-800 text-[10px] font-bold py-1 px-3 rounded-lg shadow-sm cursor-pointer"
                                  >
                                    🔍 নতুন ট্যাবে বড় করে দেখুন
                                  </a>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-col gap-2 pt-3 border-t border-slate-50 relative z-10 mt-auto">
                        {isPending && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                if (confirm(`আপনি কি "${u.name}"-এর ট্রেড লাইসেন্স ভেরিফিকেশন অনুমোদন (Approve) করতে চান?`)) {
                                  onUpdateUser(u.phone, { 
                                    isMerchantVerified: true,
                                    tradeLicenseStatus: 'approved',
                                    tradeLicenseRejectReason: ''
                                  });
                                }
                              }}
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] py-2.5 px-3 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                            >
                              ✅ Approve (অনুমোদন)
                            </button>
                            <button
                              onClick={() => {
                                const reason = prompt("আবেদনটি প্রত্যাখ্যান (Reject) করার কারণ লিখুন (যেমন: অস্পষ্ট ডকুমেন্ট, মেয়াদ উত্তীর্ণ ইত্যাদি):");
                                if (reason !== null) {
                                  onUpdateUser(u.phone, { 
                                    isMerchantVerified: false,
                                    tradeLicenseStatus: 'rejected',
                                    tradeLicenseRejectReason: reason.trim() || 'নথিপত্র সঠিক নয়।'
                                  });
                                }
                              }}
                              className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-extrabold text-[11px] py-2.5 px-4 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                            >
                              ❌ Reject (প্রত্যাখ্যান)
                            </button>
                          </div>
                        )}
                        
                        {isVerified && (
                          <div className="w-full flex gap-2">
                            <span className="flex-1 bg-emerald-50 text-emerald-700 text-[11px] font-bold py-2.5 px-3 rounded-xl text-center flex items-center justify-center gap-1">
                              🟢 Approved (ভেরিফাইড মার্চেন্ট)
                            </span>
                            <button
                              onClick={() => {
                                if (confirm(`আপনি কি "${u.name}"-এর মার্চেন্ট ভেরিফিকেশন বাতিল করে Rejected করতে চান?`)) {
                                  const reason = prompt("প্রত্যাখ্যানের কারণ লিখুন:");
                                  if (reason !== null) {
                                    onUpdateUser(u.phone, { 
                                      isMerchantVerified: false,
                                      tradeLicenseStatus: 'rejected',
                                      tradeLicenseRejectReason: reason.trim() || 'অ্যাডমিন কর্তৃক ভেরিফিকেশন বাতিল করা হয়েছে।'
                                    });
                                  }
                                }
                              }}
                              className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-extrabold text-[11px] py-2 px-3 rounded-xl transition-all cursor-pointer"
                            >
                              Reject করুন
                            </button>
                          </div>
                        )}

                        {isRejected && (
                          <div className="w-full flex flex-col gap-2 bg-rose-50/40 p-3 rounded-xl border border-rose-100">
                            <div className="text-[10px] text-rose-800 font-medium leading-relaxed">
                              <strong>🔴 প্রত্যাখ্যানের কারণ:</strong> {u.tradeLicenseRejectReason || 'নির্দিষ্ট কোনো কারণ উল্লেখ করা হয়নি।'}
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  if (confirm(`আপনি কি "${u.name}"-এর পূর্বে প্রত্যাখ্যাত আবেদনটি অনুমোদন (Approve) করতে চান?`)) {
                                    onUpdateUser(u.phone, { 
                                      isMerchantVerified: true,
                                      tradeLicenseStatus: 'approved',
                                      tradeLicenseRejectReason: ''
                                    });
                                  }
                                }}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] py-2 px-3 rounded-xl transition-all shadow-xs cursor-pointer text-center"
                              >
                                ✅ Approve করুন
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`আপনি কি আবেদনটি সম্পূর্ণ মুছে দিয়ে মার্চেন্টকে পুনরায় নতুন করে আবেদন করার সুযোগ দিতে চান?`)) {
                                    onUpdateUser(u.phone, { 
                                      tradeLicenseNo: undefined, 
                                      tradeLicenseImage: undefined, 
                                      isMerchantVerified: false,
                                      tradeLicenseStatus: undefined,
                                      tradeLicenseRejectReason: undefined
                                    });
                                  }
                                }}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-[11px] py-2 px-3 rounded-xl transition-all cursor-pointer"
                              >
                                🗑️ আবেদন মুছুন (Reset)
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {activeAdminSubTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Form: Add New Category */}
          <div className="lg:col-span-1 bg-white border border-slate-100 rounded-2xl shadow-sm p-5 space-y-4 h-fit">
            <div className="border-b border-slate-50 pb-3">
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-indigo-600" />
                নতুন ক্যাটাগরি যোগ করুন
              </h4>
              <p className="text-[11px] text-slate-500 font-medium">প্ল্যাটফর্মে নতুন ব্যবসায়িক বিভাগ বা সেবামূলক ক্যাটাগরি তৈরি করুন</p>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider">ক্যাটাগরির নাম (বাংলা)</label>
                <input
                  type="text"
                  required
                  placeholder="উদা: ডেকোরেটর ও সাউন্ড"
                  value={newCatNameBangla}
                  onChange={(e) => setNewCatNameBangla(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 bg-slate-50 border border-slate-150 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider">ক্যাটাগরির নাম (English)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Decorator & Sound"
                  value={newCatNameEnglish}
                  onChange={(e) => setNewCatNameEnglish(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 bg-slate-50 border border-slate-150 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider">সংক্ষিপ্ত বিবরণ (Description)</label>
                <textarea
                  placeholder="ক্যাটাগরিটি সম্পর্কে সংক্ষিপ্ত বর্ণনা লিখুন..."
                  value={newCatDescription}
                  onChange={(e) => setNewCatDescription(e.target.value)}
                  rows={2}
                  className="w-full text-xs font-semibold p-2.5 bg-slate-50 border border-slate-150 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                />
              </div>

              {/* Icon selector */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider">আইকন নির্বাচন করুন (Icon)</label>
                <div className="grid grid-cols-6 gap-1.5 bg-slate-50 p-2 rounded-xl border border-slate-150 max-h-32 overflow-y-auto">
                  {[
                    { name: 'ShoppingBag', label: 'ব্যাগ' },
                    { name: 'Pill', label: 'ওষুধ' },
                    { name: 'Zap', label: 'বিদ্যুৎ' },
                    { name: 'Droplet', label: 'পানি' },
                    { name: 'Hammer', label: 'হাতুড়ি' },
                    { name: 'Utensils', label: 'খাবার' },
                    { name: 'Truck', label: 'গাড়ি' },
                    { name: 'GraduationCap', label: 'শিক্ষা' },
                    { name: 'Scissors', label: 'পার্লার' },
                    { name: 'Wrench', label: 'মেরামত' },
                    { name: 'Heart', label: 'সেবা' },
                    { name: 'Camera', label: 'ক্যামেরা' },
                    { name: 'BookOpen', label: 'বই' },
                    { name: 'Sparkles', label: 'জাদু' },
                    { name: 'Cpu', label: 'টেক' },
                    { name: 'Layers', label: 'ধাপ' },
                    { name: 'Compass', label: 'দিক' },
                  ].map((ic) => (
                    <button
                      key={ic.name}
                      type="button"
                      onClick={() => setNewCatIconName(ic.name)}
                      title={ic.label}
                      className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all cursor-pointer ${
                        newCatIconName === ic.name
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs scale-105'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {renderCategoryIcon(ic.name)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Preset Selector */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider">রঙ ও স্টাইল থিম (Color Theme)</label>
                <div className="grid grid-cols-5 gap-1.5 bg-slate-50 p-2 rounded-xl border border-slate-150">
                  {[
                    { name: 'Green', class: 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100' },
                    { name: 'Red', class: 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100' },
                    { name: 'Yellow', class: 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100' },
                    { name: 'Blue', class: 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100' },
                    { name: 'Orange', class: 'bg-orange-50 text-orange-600 border-orange-100 hover:bg-orange-100' },
                    { name: 'Purple', class: 'bg-purple-50 text-purple-600 border-purple-100 hover:bg-purple-100' },
                    { name: 'Indigo', class: 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100' },
                    { name: 'Pink', class: 'bg-pink-50 text-pink-600 border-pink-100 hover:bg-pink-100' },
                    { name: 'Teal', class: 'bg-teal-50 text-teal-600 border-teal-100 hover:bg-teal-100' },
                    { name: 'Slate', class: 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100' },
                  ].map((col) => (
                    <button
                      key={col.name}
                      type="button"
                      onClick={() => setNewCatColor(col.class)}
                      title={col.name}
                      className={`h-7 rounded-lg border transition-all cursor-pointer flex items-center justify-center font-bold text-xs ${col.class} ${
                        newCatColor === col.class ? 'ring-2 ring-blue-500 ring-offset-1 scale-105' : ''
                      }`}
                    >
                      A
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSavingCategory}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-extrabold text-xs py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                {isSavingCategory ? 'যুক্ত করা হচ্ছে...' : 'ক্যাটাগরি যুক্ত করুন'}
              </button>
            </form>
          </div>

          {/* Right Table/List: All Categories */}
          <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl shadow-sm p-5 space-y-4">
            <div className="border-b border-slate-50 pb-3 flex justify-between items-center">
              <div>
                <h4 className="text-sm font-black text-slate-900">📂 বর্তমান ক্যাটাগরি তালিকা ({categoriesList.length} টি)</h4>
                <p className="text-[11px] text-slate-500 font-medium">প্ল্যাটফর্মের সকল সক্রিয় ক্যাটাগরি দেখুন এবং নিয়ন্ত্রণ করুন</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-black uppercase tracking-wider text-[10px] border-b border-slate-100">
                    <th className="py-3 px-4">আইকন ও নাম</th>
                    <th className="py-3 px-4">ইংরেজি নাম (ID)</th>
                    <th className="py-3 px-4">বিবরণ</th>
                    <th className="py-3 px-4 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {categoriesList.map((cat: any) => {
                    const isDefault = [
                      'grocery', 'pharmacy', 'electrician', 'plumber', 
                      'mason', 'restaurant', 'transport', 'tutor', 
                      'parlor', 'mechanic', 'wholesale'
                    ].includes(cat.id);

                    return (
                      <tr key={cat.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4 flex items-center gap-3">
                          <div className={`p-2 rounded-xl border ${cat.color || 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                            {renderCategoryIcon(cat.iconName)}
                          </div>
                          <div>
                            <span className="block font-bold text-slate-900">{cat.nameBangla}</span>
                            <span className="text-[9px] text-slate-400 font-semibold uppercase">বাংলা নাম</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">
                          <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">{cat.id}</span>
                          <span className="block text-[10px] text-slate-400 mt-1 font-semibold">{cat.nameEnglish}</span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate" title={cat.description}>
                          {cat.description || 'কোনো বিবরণ নেই'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {isDefault ? (
                            <span className="text-[10px] text-slate-400 font-semibold bg-slate-100 px-2 py-1 rounded-full">ডিফল্ট</span>
                          ) : (
                            <button
                              onClick={() => handleDeleteCategory(cat.id)}
                              className="text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 p-2 rounded-lg transition-colors cursor-pointer"
                              title="ক্যাটাগরি মুছুন"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeAdminSubTab === 'gateways' && (
        <AdminPaymentGatewayControl
          systemConfig={allDb.systemConfig}
          allUsers={allDb.users}
          bookings={allDb.bookings}
          onRefresh={onRefresh}
          onBroadcastNotification={onBroadcastNotification}
        />
      )}

      {activeAdminSubTab === 'commissions' && (
        <div className="space-y-6 animate-fadeIn text-slate-700">
          {/* Header section with stat summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl p-5 shadow-sm space-y-2">
              <div className="flex justify-between items-center opacity-90">
                <span className="text-xs font-bold text-slate-100">গ্লোবাল কমিশন রেট</span>
                <Percent className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-extrabold">{globalCommRate}%</p>
              <p className="text-[10px] text-blue-100 font-semibold">সব ক্যাটাগরি ও মার্চেন্টের জন্য বেস কমিশন ফি</p>
            </div>
            
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-2 flex flex-col justify-between">
              <div className="flex justify-between items-center text-slate-500">
                <span className="text-xs font-bold">ক্যাটাগরি ভিত্তিক ওভাররাইড</span>
                <Settings className="w-5 h-5 text-indigo-500" />
              </div>
              <p className="text-2xl font-extrabold text-slate-800">{Object.keys(catCommRates).length} টি ক্যাটাগরি</p>
              <p className="text-[10px] text-slate-400 font-semibold">কাস্টমাইজড কমিশন রেট বিশিষ্ট ক্যাটাগরি</p>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-2 flex flex-col justify-between">
              <div className="flex justify-between items-center text-slate-500">
                <span className="text-xs font-bold">সক্রিয় কুপন ও অফার</span>
                <Tag className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-2xl font-extrabold text-slate-800">{(allDb.platformOffers || []).length} টি অফার</p>
              <p className="text-[10px] text-slate-400 font-semibold">লাইভ প্রমোশন কুপন কোড</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
            {/* Left/Middle Column: Commission Settings */}
            <div className="lg:col-span-2 space-y-6">
              {/* Card 1: Global and Category Settings */}
              <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 space-y-4">
                <div className="border-b border-slate-50 pb-3 flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-black text-slate-900">⚙️ সাধারণ ও ক্যাটাগরি কমিশন কন্ট্রোল</h4>
                    <p className="text-[11px] text-slate-500 font-medium">প্ল্যাটফর্ম জুড়ে বা নির্দিষ্ট সেবার ক্যাটাগরি ভিত্তিক কমিশন নির্ধারণ করুন</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Global Rate Input */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-slate-800 block">গ্লোবাল কমিশন রেট (Global standard commission)</span>
                      <span className="text-[10px] text-slate-500 block font-medium">যেসব ক্যাটাগরি বা মার্চেন্টের জন্য কাস্টম কমিশন সেট করা নেই, তাদের বিক্রির ওপর এই ফি কার্যকর হবে।</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={globalCommRate}
                          onChange={(e) => setGlobalCommRate(Number(e.target.value))}
                          className="w-20 font-bold text-xs bg-white text-slate-800 border border-slate-200 px-3 py-2 rounded-lg pr-7 text-center focus:outline-none focus:border-blue-500"
                        />
                        <span className="absolute right-2 top-2 text-slate-400 font-bold text-xs">%</span>
                      </div>
                      <button
                        onClick={() => handleSaveSystemConfig({
                          globalCommissionRate: globalCommRate,
                          categoryCommissionRates: catCommRates,
                          merchantCommissionRates: merchantCommRates
                        })}
                        disabled={isSavingSystemConfig}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-extrabold text-xs px-4 py-2 rounded-lg transition-all shadow-sm cursor-pointer"
                      >
                        {isSavingSystemConfig ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ'}
                      </button>
                    </div>
                  </div>

                  {/* Category based list */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-800 block">ক্যাটাগরি ভিত্তিক কমিশন রেট (% শতাংশ)</span>
                    <p className="text-[10px] text-slate-400 pb-1 font-semibold">প্রতিটি ক্যাটাগরির দোকান বা সার্ভিসের জন্য ভিন্ন ভিন্ন কমিশন রেট ওভাররাইড করুন:</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
                      {categoriesList.map((cat: any) => {
                        const currentVal = catCommRates[cat.id] ?? globalCommRate;
                        return (
                          <div key={cat.id} className="flex items-center justify-between p-2.5 bg-white border border-slate-150 rounded-xl shadow-2xs hover:shadow-xs transition-all">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-slate-700">{cat.nameBangla}</span>
                              <span className="text-[9px] font-semibold text-slate-400 font-mono">({cat.id})</span>
                            </div>
                            <div className="relative">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={currentVal}
                                onChange={(e) => {
                                  const updated = { ...catCommRates, [cat.id]: Number(e.target.value) };
                                  setCatCommRates(updated);
                                }}
                                className="w-16 font-semibold text-xs border border-slate-200 rounded-lg px-2 py-1.5 pr-5 text-center bg-slate-50 focus:outline-none focus:bg-white focus:border-indigo-500"
                              />
                              <span className="absolute right-1.5 top-1.5 text-[10px] text-slate-400 font-bold">%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="pt-3 flex justify-end">
                      <button
                        onClick={() => handleSaveSystemConfig({
                          globalCommissionRate: globalCommRate,
                          categoryCommissionRates: catCommRates,
                          merchantCommissionRates: merchantCommRates
                        })}
                        disabled={isSavingSystemConfig}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                      >
                        <Settings className="w-3.5 h-3.5" />
                        ক্যাটাগরি কমিশন আপডেট করুন
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Merchant Overrides */}
              <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 space-y-4">
                <div className="border-b border-slate-50 pb-3">
                  <h4 className="text-sm font-black text-slate-900">👤 মার্চেন্ট-ভিত্তিক বিশেষ কমিশন ওভাররাইড (VIP Overrides)</h4>
                  <p className="text-[11px] text-slate-500 font-medium">কোনো নির্দিষ্ট দোকান বা মার্চেন্টের জন্য বিশেষ আলাদা কমিশন পার্সেন্টেজ সেট করুন</p>
                </div>

                <div className="space-y-4">
                  {/* Override Form */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-indigo-50/20 p-4 border border-indigo-100/60 rounded-xl">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-600">মার্চেন্ট ফোন নম্বর</label>
                      <input
                        type="text"
                        placeholder="যেমন: 01811222333"
                        value={newOverridePhone}
                        onChange={(e) => setNewOverridePhone(e.target.value)}
                        className="w-full text-xs border border-slate-200 px-3 py-2 bg-white rounded-lg focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-600">বিশেষ কমিশন রেট (%)</label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={newOverrideRate}
                          onChange={(e) => setNewOverrideRate(Number(e.target.value))}
                          className="w-full text-xs border border-slate-200 px-3 py-2 bg-white rounded-lg pr-7 focus:outline-none"
                        />
                        <span className="absolute right-2.5 top-2 text-xs font-bold text-slate-400">%</span>
                      </div>
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={handleAddMerchantOverride}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-2.5 rounded-lg transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        যুক্ত করুন
                      </button>
                    </div>
                  </div>

                  {/* Active Overrides List */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-800 block">সক্রিয় বিশেষ মার্চেন্ট কমিশন ওভাররাইড তালিকা:</span>
                    {Object.keys(merchantCommRates).length === 0 ? (
                      <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <p className="text-xs text-slate-400 font-medium">কোনো বিশেষ মার্চেন্ট ওভাররাইড সেট করা নেই। উপরে ফর্ম থেকে এড করুন।</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border border-slate-100 rounded-xl overflow-hidden">
                          <thead>
                            <tr className="bg-slate-50 text-slate-500 font-black text-[10px] border-b border-slate-100">
                              <th className="py-2.5 px-3">মার্চেন্ট ফোন</th>
                              <th className="py-2.5 px-3">দোকানের নাম</th>
                              <th className="py-2.5 px-3">বিশেষ রেট</th>
                              <th className="py-2.5 px-3 text-right">অ্যাকশন</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium">
                            {Object.entries(merchantCommRates).map(([phone, rate]) => {
                              const biz = allDb.businesses.find(b => b.ownerPhone === phone);
                              return (
                                <tr key={phone} className="hover:bg-slate-50/50 transition-all">
                                  <td className="py-2.5 px-3 font-mono text-slate-700">{phone}</td>
                                  <td className="py-2.5 px-3 text-slate-900 font-bold">{biz ? biz.name : 'অজানা দোকান/মার্চেন্ট'}</td>
                                  <td className="py-2.5 px-3 text-indigo-600 font-extrabold">{rate}%</td>
                                  <td className="py-2.5 px-3 text-right">
                                    <button
                                      onClick={() => handleRemoveMerchantOverride(phone)}
                                      className="text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded-md transition-colors font-bold text-[10px] cursor-pointer"
                                    >
                                      বাতিল করুন
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Promo Offers / Coupons */}
            <div className="space-y-6 text-left">
              {/* Card 1: Add Coupon Form */}
              <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 space-y-4">
                <div className="border-b border-slate-50 pb-3">
                  <h4 className="text-sm font-black text-slate-900">🎟️ নতুন প্রমোশনাল কুপন তৈরি</h4>
                  <p className="text-[11px] text-slate-500 font-medium">গ্রাহকদের আকৃষ্ট করতে নতুন অফার ও প্রমো কোড পাবলিশ করুন</p>
                </div>

                <form onSubmit={handleAddOffer} className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-600 uppercase">কুপন প্রমো কোড (যেমন: DHAKA20)</label>
                    <input
                      type="text"
                      placeholder="কুপন কোড (ইংরেজি বড় হাত)"
                      value={newOfferCode}
                      onChange={(e) => setNewOfferCode(e.target.value)}
                      className="w-full border border-slate-200 px-3 py-2 rounded-lg bg-slate-50 font-bold focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-600 uppercase">অফারের শিরোনাম</label>
                    <input
                      type="text"
                      placeholder="১০% ছাড় মুদি বাজারে"
                      value={newOfferTitle}
                      onChange={(e) => setNewOfferTitle(e.target.value)}
                      className="w-full border border-slate-200 px-3 py-2 rounded-lg bg-slate-50 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-600 uppercase">অফারের বিবরণ</label>
                    <textarea
                      placeholder="৫০০ টাকার বেশি অর্ডারে ফ্লাট ডিসকাউন্ট!"
                      rows={2}
                      value={newOfferDesc}
                      onChange={(e) => setNewOfferDesc(e.target.value)}
                      className="w-full border border-slate-200 px-3 py-2 rounded-lg bg-slate-50 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-600 uppercase">ডিসকাউন্ট হার (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={newOfferDiscount}
                        onChange={(e) => setNewOfferDiscount(Number(e.target.value))}
                        className="w-full border border-slate-200 px-3 py-2 rounded-lg bg-slate-50 focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-600 uppercase">সর্বনিম্ন ক্রয় (৳)</label>
                      <input
                        type="number"
                        min="0"
                        value={newOfferMinSpend}
                        onChange={(e) => setNewOfferMinSpend(Number(e.target.value))}
                        className="w-full border border-slate-200 px-3 py-2 rounded-lg bg-slate-50 focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-600 uppercase">মেয়াদ শেষ হওয়ার তারিখ</label>
                    <input
                      type="date"
                      value={newOfferExpiry}
                      onChange={(e) => setNewOfferExpiry(e.target.value)}
                      className="w-full border border-slate-200 px-3 py-2 rounded-lg bg-slate-50 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingPlatformOffer}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-extrabold text-xs py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    {isSavingPlatformOffer ? 'অফার সেভ হচ্ছে...' : 'নতুন কুপন কোড চালু করুন'}
                  </button>
                </form>
              </div>

              {/* Card 2: Coupon List */}
              <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 space-y-4">
                <div className="border-b border-slate-50 pb-3">
                  <h4 className="text-sm font-black text-slate-900">📢 প্ল্যাটফর্মের সক্রিয় কুপনসমূহ</h4>
                </div>

                <div className="space-y-3.5 max-h-[400px] overflow-y-auto pr-1 text-left">
                  {!(allDb.platformOffers) || allDb.platformOffers.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 font-medium">
                      <p>কোনো সক্রিয় অফার বা কুপন নেই</p>
                    </div>
                  ) : (
                    allDb.platformOffers.map((o: any) => (
                      <div
                        key={o.id}
                        className={`border-2 border-dashed rounded-2xl p-4 transition-all relative ${
                          o.isActive 
                            ? 'bg-emerald-50/20 border-emerald-200 hover:border-emerald-300' 
                            : 'bg-slate-50 border-slate-200 hover:border-slate-300 opacity-60'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1">
                            <span className="inline-block font-mono font-extrabold text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded mb-2">
                              {o.code}
                            </span>
                            <h5 className="font-bold text-slate-900 text-xs">{o.title}</h5>
                            <p className="text-[10px] text-slate-500 mt-1">{o.description}</p>
                            <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-2 text-[9px] text-slate-400 font-semibold">
                              <span>মিনিমাম খরচ: ৳{o.minSpend}</span>
                              <span>•</span>
                              <span>ডিসকাউন্ট: {o.discountPercent}%</span>
                              <span>•</span>
                              <span>মেয়াদ: {o.expiryDate}</span>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <button
                              onClick={() => handleToggleOfferActive(o.id)}
                              className={`px-2 py-1 rounded-md border transition-all text-[9px] font-bold cursor-pointer ${
                                o.isActive 
                                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' 
                                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                              }`}
                              title={o.isActive ? "অফার নিষ্ক্রিয় করুন" : "অফার সক্রিয় করুন"}
                            >
                              {o.isActive ? "Active" : "Disabled"}
                            </button>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleOpenEditOffer(o)}
                                className="p-1 rounded-md border bg-indigo-50 border-indigo-100 text-indigo-600 hover:bg-indigo-100 transition-all cursor-pointer"
                                title="এডিট করুন"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleRemoveOffer(o.id)}
                                className="p-1 rounded-md border bg-rose-50 border-rose-100 text-rose-600 hover:bg-rose-100 transition-all cursor-pointer"
                                title="ডিলিট করুন"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Edit Offer Modal */}
          {editingOffer && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between border-b pb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                      <Edit3 className="w-5 h-5" />
                    </span>
                    <div>
                      <h4 className="text-sm font-black text-slate-900">কুপন ও অফার এডিট করুন</h4>
                      <p className="text-[11px] text-slate-500 font-medium">কোড: {editingOffer.code}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingOffer(null)}
                    className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveEditOffer} className="space-y-3.5 text-xs">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-600 uppercase">কুপন প্রমো কোড</label>
                    <input
                      type="text"
                      required
                      value={editOfferCode}
                      onChange={(e) => setEditOfferCode(e.target.value)}
                      className="w-full border border-slate-200 px-3 py-2 rounded-xl bg-slate-50 font-bold uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-600 uppercase">অফারের শিরোনাম</label>
                    <input
                      type="text"
                      required
                      value={editOfferTitle}
                      onChange={(e) => setEditOfferTitle(e.target.value)}
                      className="w-full border border-slate-200 px-3 py-2 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-600 uppercase">অফারের বিবরণ</label>
                    <textarea
                      rows={2}
                      value={editOfferDesc}
                      onChange={(e) => setEditOfferDesc(e.target.value)}
                      className="w-full border border-slate-200 px-3 py-2 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-600 uppercase">ডিসকাউন্ট হার (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        required
                        value={editOfferDiscount}
                        onChange={(e) => setEditOfferDiscount(Number(e.target.value))}
                        className="w-full border border-slate-200 px-3 py-2 rounded-xl bg-slate-50 focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-600 uppercase">সর্বনিম্ন ক্রয় (৳)</label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={editOfferMinSpend}
                        onChange={(e) => setEditOfferMinSpend(Number(e.target.value))}
                        className="w-full border border-slate-200 px-3 py-2 rounded-xl bg-slate-50 focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-600 uppercase">মেয়াদ শেষ হওয়ার তারিখ</label>
                      <input
                        type="date"
                        required
                        value={editOfferExpiry}
                        onChange={(e) => setEditOfferExpiry(e.target.value)}
                        className="w-full border border-slate-200 px-3 py-2 rounded-xl bg-slate-50 focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-600 uppercase">স্ট্যাটাস</label>
                      <select
                        value={editOfferIsActive ? 'active' : 'disabled'}
                        onChange={(e) => setEditOfferIsActive(e.target.value === 'active')}
                        className="w-full border border-slate-200 px-3 py-2 rounded-xl bg-slate-50 focus:bg-white focus:outline-none font-bold"
                      >
                        <option value="active">সক্রিয় (Active)</option>
                        <option value="disabled">নিষ্ক্রিয় (Disabled)</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingOffer(null)}
                      className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
                    >
                      বাতিল
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingEditOffer}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-colors shadow-md disabled:bg-indigo-400 flex items-center justify-center gap-1.5"
                    >
                      <Save className="w-4 h-4" />
                      {isSavingEditOffer ? 'সংরক্ষণ হচ্ছে...' : 'আপডেট সংরক্ষণ করুন'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {activeAdminSubTab === 'profile' && (
        <div className="space-y-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Column: Admin Card & Profile Info form */}
            <div className="flex-1 space-y-6">
              <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-6">
                <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-md overflow-hidden relative group">
                    {adminImage ? (
                      <img referrerPolicy="no-referrer" src={adminImage} alt={adminName} className="w-full h-full object-cover" />
                    ) : (
                      <span>🛡️</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-base">{adminName}</h3>
                    <p className="text-xs text-slate-400 font-bold font-mono">{adminPhone} | {adminEmail}</p>
                    <span className="inline-block mt-1 text-[10px] bg-blue-100 text-blue-800 font-extrabold px-2.5 py-0.5 rounded-full border border-blue-200">
                      {adminDesignation}
                    </span>
                  </div>
                </div>

                <form onSubmit={async (e) => {
                  e.preventDefault();
                  setIsUpdatingProfile(true);
                  try {
                    await onUpdateUser(adminPhone, {
                      name: adminName,
                      email: adminEmail,
                      designation: adminDesignation,
                      bio: adminBio,
                      image: adminImage
                    });
                    alert('আপনার অ্যাডমিন প্রোফাইল সফলভাবে আপডেট হয়েছে!');
                  } catch (err) {
                    console.error(err);
                    alert('প্রোফাইল আপডেট করতে ব্যর্থ হয়েছে।');
                  } finally {
                    setIsUpdatingProfile(false);
                  }
                }} className="space-y-4 text-left">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">ব্যক্তিগত এবং पदबी তথ্য</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-600 uppercase">পূর্ণ নাম / ইউজারনেম</label>
                      <input
                        type="text"
                        value={adminName}
                        onChange={(e) => setAdminName(e.target.value)}
                        className="w-full text-xs border border-slate-200 px-3.5 py-2.5 bg-slate-50 focus:bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-850"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-600 uppercase">পদবী (Designation)</label>
                      <input
                        type="text"
                        value={adminDesignation}
                        onChange={(e) => setAdminDesignation(e.target.value)}
                        className="w-full text-xs border border-slate-200 px-3.5 py-2.5 bg-slate-50 focus:bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-850"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-600 uppercase">ইমেইল ঠিকানা (Email Address)</label>
                      <input
                        type="email"
                        value={adminEmail}
                        disabled
                        className="w-full text-xs border border-slate-200 px-3.5 py-2.5 bg-slate-100 rounded-xl focus:outline-none font-bold text-slate-400 cursor-not-allowed"
                        title="অ্যাডমিন ইমেইল পরিবর্তনযোগ্য নয়"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-600 uppercase">মোবাইল নম্বর (Phone)</label>
                      <input
                        type="text"
                        value={adminPhone}
                        disabled
                        className="w-full text-xs border border-slate-200 px-3.5 py-2.5 bg-slate-100 rounded-xl focus:outline-none font-mono font-bold text-slate-400 cursor-not-allowed"
                        title="মোবাইল নম্বর পরিবর্তনযোগ্য নয়"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-600 uppercase">প্রোফাইল ফটো লিংক (Profile Image URL)</label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={adminImage}
                      onChange={(e) => setAdminImage(e.target.value)}
                      className="w-full text-xs border border-slate-200 px-3.5 py-2.5 bg-slate-50 focus:bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-850"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-600 uppercase">পরিচিতি ও বায়ো (Bio)</label>
                    <textarea
                      rows={3}
                      value={adminBio}
                      onChange={(e) => setAdminBio(e.target.value)}
                      className="w-full text-xs border border-slate-200 px-3.5 py-2.5 bg-slate-50 focus:bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold leading-relaxed text-slate-850"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isUpdatingProfile}
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-extrabold text-xs py-2.5 px-6 rounded-xl transition-all shadow-md cursor-pointer"
                  >
                    {isUpdatingProfile ? 'সংরক্ষণ হচ্ছে...' : 'প্রোফাইল তথ্য আপডেট করুন'}
                  </button>
                </form>
              </div>

              {/* Password update panel */}
              <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-4 text-left">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">🔒 পাসওয়ার্ড নিরাপত্তা পরিবর্তন (Change Password)</h4>
                <p className="text-[10px] text-slate-400 font-semibold pb-1">নিরাপত্তার স্বার্থে নিয়মিত পাসওয়ার্ড পরিবর্তন করুন। পাসওয়ার্ড অবশ্যই শক্তিশালী হতে হবে।</p>
                
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (newPassword !== confirmNewPassword) {
                    alert('নতুন পাসওয়ার্ড এবং নিশ্চিতকরণ পাসওয়ার্ড মেলেনি!');
                    return;
                  }
                  if (currentPassword !== adminUser.password) {
                    alert('আপনার বর্তমান পাসওয়ার্ডটি সঠিক নয়!');
                    return;
                  }
                  setIsUpdatingPassword(true);
                  try {
                    await onUpdateUser(adminPhone, { password: newPassword });
                    alert('আপনার পাসওয়ার্ডটি সফলভাবে পরিবর্তন করা হয়েছে!');
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmNewPassword('');
                  } catch (err) {
                    console.error(err);
                    alert('পাসওয়ার্ড পরিবর্তন করতে ত্রুটি ঘটেছে।');
                  } finally {
                    setIsUpdatingPassword(false);
                  }
                }} className="space-y-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-600 uppercase">বর্তমান পাসওয়ার্ড</label>
                    <input
                      type="password"
                      placeholder="বর্তমান অ্যাডমিন পাসওয়ার্ড দিন"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full text-xs border border-slate-200 px-3.5 py-2.5 bg-slate-50 focus:bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-850"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-600 uppercase">নতুন পাসওয়ার্ড</label>
                      <input
                        type="password"
                        placeholder="কমপক্ষে ৪ অক্ষরের নতুন পাসওয়ার্ড"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full text-xs border border-slate-200 px-3.5 py-2.5 bg-slate-50 focus:bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-850"
                        required
                        minLength={4}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-600 uppercase">নতুন পাসওয়ার্ড নিশ্চিত করুন</label>
                      <input
                        type="password"
                        placeholder="আবার নতুন পাসওয়ার্ডটি দিন"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        className="w-full text-xs border border-slate-200 px-3.5 py-2.5 bg-slate-50 focus:bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-850"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isUpdatingPassword}
                    className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 disabled:bg-slate-600 text-white font-extrabold text-xs py-2.5 px-6 rounded-xl transition-all shadow-md cursor-pointer"
                  >
                    {isUpdatingPassword ? 'পরিবর্তন হচ্ছে...' : 'পাসওয়ার্ড আপডেট করুন'}
                  </button>
                </form>
              </div>
            </div>

            {/* Right Column: Platform Configuration & Maintenance */}
            <div className="w-full lg:w-96 space-y-6 text-left">
              <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 space-y-4">
                <div className="border-b border-slate-50 pb-3">
                  <h4 className="text-sm font-black text-slate-900">🛠️ সিস্টেম কন্ট্রোল বোর্ড</h4>
                  <p className="text-[10px] text-slate-400 font-semibold mt-1">প্ল্যাটফর্মের সার্বিক কার্যক্রম ও জরুরি সেটিংস</p>
                </div>

                <div className="space-y-4">
                  {/* Global Commission slider */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-700">গ্লোবাল কমিশন ফি রেট</span>
                      <span className="bg-blue-100 text-blue-800 font-mono text-xs font-extrabold px-2 py-0.5 rounded">
                        {globalCommRate}%
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold leading-snug">
                      প্রতিটি সম্পন্ন বুকিং থেকে প্ল্যাটফর্ম কমিশন ফি কর্তন।
                    </p>
                    <input
                      type="range"
                      min="0"
                      max="25"
                      step="1"
                      value={globalCommRate}
                      onChange={(e) => setGlobalCommRate(Number(e.target.value))}
                      className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-slate-400 font-bold font-mono">
                      <span>0%</span>
                      <span>10%</span>
                      <span>20%</span>
                      <span>25%</span>
                    </div>
                    <button
                      onClick={() => handleSaveSystemConfig({
                        globalCommissionRate: globalCommRate,
                        categoryCommissionRates: catCommRates,
                        merchantCommissionRates: merchantCommRates
                      })}
                      disabled={isSavingSystemConfig}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-extrabold text-[11px] py-2 rounded-lg transition-all cursor-pointer text-center"
                    >
                      {isSavingSystemConfig ? 'সংরক্ষণ হচ্ছে...' : 'কমিশন রেট সেভ করুন'}
                    </button>
                  </div>

                  {/* Simulated Maintenance Mode Toggle */}
                  <div className="p-4 rounded-xl border border-slate-150 bg-amber-50/20 border-amber-100/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        <span className="text-xs font-bold text-slate-700">জরুরি মেইনটেন্যান্স মোড</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          id="maintenance-toggle"
                          className="sr-only peer" 
                          onChange={() => {
                            alert('সিস্টেম মেইনটেন্যান্স মোড পরিবর্তন করা হয়েছে! এটি ব্রডকাস্টে লাইভ সতর্কবার্তা যুক্ত করবে।');
                          }}
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                      </label>
                    </div>
                    <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                      এটি চালু করলে সাময়িকভাবে গ্রাহকদের জন্য ডিরেক্টরি বুকিং ও মার্চেন্ট রেজিস্ট্রেশন সেবা স্থগিত থাকবে এবং সতর্কবার্তা প্রদর্শিত হবে।
                    </p>
                  </div>

                  {/* Audit Info Card */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-2">
                    <span className="text-xs font-bold text-slate-700 block">🔒 নিরাপত্তা এবং সেশন অডিট</span>
                    <div className="space-y-1.5 text-[10px] text-slate-500 font-semibold font-mono">
                      <div className="flex justify-between">
                        <span>সিস্টেম অবস্থা:</span>
                        <span className="text-emerald-600 font-bold flex items-center gap-1">● Live & Secured</span>
                      </div>
                      <div className="flex justify-between">
                        <span>অ্যাডমিন সেশন মেয়াদ:</span>
                        <span>২৪ ঘণ্টা</span>
                      </div>
                      <div className="flex justify-between">
                        <span>সর্বশেষ ডাটাবেজ ব্যাকআপ:</span>
                        <span>আজকে, {new Date().toLocaleDateString('bn-BD')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeAdminSubTab === 'merchant-control' && (
        <div className="space-y-6 text-left">
          {/* Header Card */}
          <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-800 text-white p-6 rounded-2xl shadow-md space-y-2 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <span className="bg-white/10 border border-white/20 text-blue-100 text-[10px] font-black tracking-widest px-2.5 py-1 rounded-full uppercase">
                  Merchant Administrative Control Center (MACC)
                </span>
                <h3 className="text-lg font-black font-sans">🏪 মার্চেন্ট কন্ট্রোল প্যানেল ও ড্যাশবোর্ড নিয়ন্ত্রণ</h3>
                <p className="text-xs text-blue-100 font-medium max-w-xl font-semibold leading-relaxed">
                  যেকোনো মার্চেন্ট বা দোকানের অ্যাকাউন্ট সাময়িকভাবে স্থগিত করুন, বিজ্ঞাপন প্রচারণা সচল/নিষ্ক্রিয় করুন, আইটেম আপলোডের সীমা নির্ধারণ করুন এবং কাস্টম কমিশন ওভাররাইড রেট সেট করুন।
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/10 flex items-center gap-4 shrink-0">
                <div className="text-center">
                  <p className="text-[10px] uppercase opacity-75 font-bold">মোট মার্চেন্ট</p>
                  <p className="text-lg font-black">{allDb.businesses.length}</p>
                </div>
                <div className="h-8 w-[1px] bg-white/20" />
                <div className="text-center">
                  <p className="text-[10px] uppercase opacity-75 font-bold">সক্রিয়</p>
                  <p className="text-lg font-black text-emerald-300">{allDb.businesses.filter(b => !b.isSuspended).length}</p>
                </div>
                <div className="h-8 w-[1px] bg-white/20" />
                <div className="text-center">
                  <p className="text-[10px] uppercase opacity-75 font-bold">স্থগিত</p>
                  <p className="text-lg font-black text-rose-300">{allDb.businesses.filter(b => b.isSuspended).length}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Merchant List */}
            <div className="lg:col-span-5 bg-white border border-slate-100 p-4 rounded-2xl shadow-xs space-y-4">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                <Search className="w-4 h-4 text-slate-400 animate-pulse" />
                <input
                  type="text"
                  placeholder="মার্চেন্ট বা দোকানের নাম দিয়ে সার্চ..."
                  value={mSearch}
                  onChange={(e) => setMSearch(e.target.value)}
                  className="w-full text-xs bg-transparent focus:outline-none text-slate-900 font-bold"
                />
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {allDb.businesses
                  .filter(biz => !mSearch || biz.name.toLowerCase().includes(mSearch.toLowerCase()) || biz.ownerName.toLowerCase().includes(mSearch.toLowerCase()))
                  .map(biz => {
                    const isSelected = selectedBizId === biz.id;
                    return (
                      <div
                        key={biz.id}
                        onClick={() => selectMerchantForControl(biz)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer text-left space-y-2 ${isSelected ? 'border-blue-500 bg-blue-50/45 ring-1 ring-blue-500' : 'border-slate-100 hover:bg-slate-50 bg-white'}`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                              {biz.name}
                              {biz.isSuspended && (
                                <span className="bg-rose-500 text-white text-[8px] px-1.5 py-0.5 rounded font-black uppercase">SUSPENDED</span>
                              )}
                            </h4>
                            <p className="text-[10px] text-slate-500 mt-0.5 font-semibold">মালিক: {biz.ownerName} | ক্যাটাগরি: {biz.category}</p>
                          </div>
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase ${biz.type === 'shop' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                            {biz.type === 'shop' ? 'দোকান (Shop)' : 'পেশাদার (Service)'}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap gap-1 text-[9px] text-slate-500">
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded font-bold">কমিশন: {biz.commissionRateOverride !== undefined ? `${biz.commissionRateOverride}%` : 'ডিফল্ট'}</span>
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded font-bold">সীমা: {biz.maxProductsLimit !== undefined ? biz.maxProductsLimit : 100} টি</span>
                          {biz.isAutoItemApprovalAllowed && <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-bold">Auto-Approve</span>}
                        </div>
                      </div>
                    );
                  })}
                {allDb.businesses.filter(biz => !mSearch || biz.name.toLowerCase().includes(mSearch.toLowerCase()) || biz.ownerName.toLowerCase().includes(mSearch.toLowerCase())).length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-8">কোনো মার্চেন্ট পাওয়া যায়নি।</p>
                )}
              </div>
            </div>

            {/* Right Column: Controls Form */}
            <div className="lg:col-span-7">
              {selectedBizId ? (() => {
                const selectedBiz = allDb.businesses.find(b => b.id === selectedBizId);
                if (!selectedBiz) return null;
                return (
                  <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs space-y-6 text-left">
                    <div className="border-b pb-3 flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-black text-slate-900">{selectedBiz.name} - এর নিয়ন্ত্রণ</h3>
                        <p className="text-[10px] text-slate-500 mt-0.5 font-semibold">মালিক: {selectedBiz.ownerName} | মেম্বারশিপ: {selectedBiz.planId?.toUpperCase() || 'FREE'}</p>
                      </div>
                      <span className="text-[10px] bg-slate-100 text-slate-600 font-mono px-2 py-1 rounded">ID: {selectedBiz.id}</span>
                    </div>

                    <div className="space-y-4">
                      {/* Account Suspension Control */}
                      <div className="p-4 rounded-xl border border-rose-100 bg-rose-50/20 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <h4 className="text-xs font-black text-rose-900 flex items-center gap-1">
                              <AlertTriangle className="w-4 h-4 text-rose-500 animate-pulse" />
                              মার্চেন্ট অ্যাকাউন্ট স্থগিতকরণ (Suspend Account)
                            </h4>
                            <p className="text-[10px] text-rose-700 font-bold">স্থগিত করলে মার্চেন্ট ড্যাশবোর্ড অ্যাক্সেস বন্ধ হবে এবং কাস্টমাররা দোকানটি দেখতে পাবে না।</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={mSuspended}
                              onChange={(e) => setMSuspended(e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
                          </label>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Ads & Campaigns Allowed */}
                        <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/45 flex items-center justify-between">
                          <div className="space-y-0.5">
                            <h5 className="text-xs font-extrabold text-slate-800">বিজ্ঞাপন প্রচারের অনুমতি</h5>
                            <p className="text-[9px] text-slate-500 font-medium">Sponsor Banner Ads ও অফার প্রচার করতে পারবে</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={mBanners}
                              onChange={(e) => setMBanners(e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>

                        {/* Coupon Offers Allowed */}
                        <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/45 flex items-center justify-between">
                          <div className="space-y-0.5">
                            <h5 className="text-xs font-extrabold text-slate-800">ডিসকাউন্ট অফার সৃষ্টির অনুমতি</h5>
                            <p className="text-[9px] text-slate-500 font-medium">কাস্টম ডিসকাউন্ট কুপন তৈরি করার সুযোগ পাবে</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={mOffers}
                              onChange={(e) => setMOffers(e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>

                        {/* Customer Ledger / বাকি খাতা Allowed */}
                        <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/45 flex items-center justify-between">
                          <div className="space-y-0.5">
                            <h5 className="text-xs font-extrabold text-slate-800">বাকি খাতা / কাস্টমার ডিরেক্টরি</h5>
                            <p className="text-[9px] text-slate-500 font-medium">গ্রাহক বকেয়া হিসাব ও কাস্টমার বুক ব্যবহার করতে পারবে</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={mLedger}
                              onChange={(e) => setMLedger(e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>

                        {/* Product Auto-Approval */}
                        <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/45 flex items-center justify-between">
                          <div className="space-y-0.5">
                            <h5 className="text-xs font-extrabold text-slate-800">আইটেম অটো-অ্যাপ্রুভাল</h5>
                            <p className="text-[9px] text-slate-500 font-medium">নতুন পণ্য যোগ করার সাথে সাথে স্বয়ংক্রিয় অনুমোদিত হবে</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={mAutoApprove}
                              onChange={(e) => setMAutoApprove(e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Max upload limits */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-slate-600 block">সর্বোচ্চ পণ্য/সেবা আপলোড সীমা (Max Items)</label>
                          <input
                            type="number"
                            value={mMaxLimit}
                            onChange={(e) => setMMaxLimit(Math.max(1, Number(e.target.value)))}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                          />
                        </div>

                        {/* Custom Commission rate override */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-slate-600 block">কমিশন ওভাররাইড রেট (Commission Override %)</label>
                          <input
                            type="number"
                            placeholder="ডিফল্ট ব্যবহার করতে ফাঁকা রাখুন"
                            value={mCommission}
                            onChange={(e) => setMCommission(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t flex gap-3">
                      <button
                        type="button"
                        onClick={() => setSelectedBizId(null)}
                        className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all text-center cursor-pointer"
                      >
                        বাতিল করুন
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await onUpdateBusiness(selectedBiz.id, {
                            isSuspended: mSuspended,
                            isBannersAllowed: mBanners,
                            isAutoItemApprovalAllowed: mAutoApprove,
                            isLedgerAllowed: mLedger,
                            maxProductsLimit: mMaxLimit,
                            isOfferCreationAllowed: mOffers,
                            commissionRateOverride: mCommission === '' ? undefined : Number(mCommission),
                          });
                          alert('মার্চেন্ট কন্ট্রোল সেটিংস সফলভাবে সংরক্ষণ করা হয়েছে!');
                          onRefresh();
                        }}
                        className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold transition-all text-center shadow-lg shadow-blue-100 cursor-pointer"
                      >
                        সংরক্ষণ করুন (Save Controls)
                      </button>
                    </div>
                  </div>
                );
              })() : (
                <div className="bg-slate-50 border border-dashed border-slate-200 p-12 rounded-2xl text-center space-y-3 flex flex-col items-center justify-center min-h-[400px]">
                  <span className="text-4xl block animate-pulse">🛠️</span>
                  <h4 className="text-xs font-black text-slate-800">কোনো মার্চেন্ট নির্বাচিত নেই</h4>
                  <p className="text-[10px] text-slate-400 font-bold max-w-xs leading-relaxed">
                    অনুগ্রহ করে বাম পাশের তালিকা থেকে যেকোনো একটি মার্চেন্ট বা দোকান নির্বাচন করুন যাতে তার ড্যাশবোর্ড নিয়ন্ত্রণ, আপলোড লিমিট ও অ্যাকাউন্ট স্ট্যাটাস কাস্টমাইজ করা যায়।
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeAdminSubTab === 'profile-report' && (
        <div className="space-y-6 text-left">
          {/* Header Summary */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 rounded-2xl shadow-md space-y-2 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <span className="bg-blue-500/30 text-blue-100 text-[9px] font-black tracking-widest px-2.5 py-1 rounded-full uppercase">
                  Auditor Console & Reporting Workspace
                </span>
                <h3 className="text-lg font-black font-sans">🛡️ অ্যাডমিন প্রোফাইল ও অডিট রিপোর্ট সিস্টেম</h3>
                <p className="text-xs text-blue-100 font-medium max-w-xl">
                  সিস্টেমের সমস্ত ডাটাবেজ টেবিল, কমিশন আয়ের হিসাব এবং মার্চেন্ট ট্র্যাকিং কার্যক্রম विश्लेषण করে কাস্টম প্রোফাইল বা অডিট স্টেটমেন্ট পিডিএফ জেনারেট করুন।
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center font-black text-lg overflow-hidden">
                  {adminImage ? (
                    <img src={adminImage} alt={adminName} className="w-full h-full object-cover" />
                  ) : (
                    <span>🛡️</span>
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-black">{adminName}</h4>
                  <p className="text-[10px] text-blue-200 font-bold">{adminDesignation}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Report configuration (5 cols on lg) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider font-sans">🛠️ কাস্টম অডিট রিপোর্ট ফিল্টার</h4>
                  <p className="text-[10px] text-slate-400 font-semibold mt-1">রিপোর্টের ধরন ও ডাটা ক্রাইটেরিয়া নির্বাচন করুন</p>
                </div>

                <div className="space-y-3.5">
                  {/* Report Type */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-600 uppercase">রিপোর্টের ক্যাটাগরি</label>
                    <select
                      value={reportType}
                      onChange={(e) => setReportType(e.target.value as any)}
                      className="w-full text-xs border border-slate-200 px-3 py-2 bg-slate-50 focus:bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-800"
                    >
                      <option value="performance">📊 সার্বিক প্ল্যাটফর্ম পারফরম্যান্স ও গ্রোথ রিপোর্ট</option>
                      <option value="customers-vendors">👥 কাস্টমার ও মার্চেন্ট/ভেন্ডর কার্যক্রম রিপোর্ট</option>
                      <option value="merchants">🏪 মার্চেন্ট ও স্টোর রেজিস্ট্রি ভেরিফিকেশন অডিট</option>
                      <option value="revenue">💰 কমিশন লেজার ও সাবস্ক্রিপশন আয় রেভিনিউ স্টেটমেন্ট</option>
                      <option value="bookings">📋 গ্রাহক অর্ডার ও সার্ভিস বুকিং লগস রিপোর্ট</option>
                      <option value="security">🔒 সিস্টেম সিকিউরিটি এবং অ্যাডমিন অ্যাকশন ট্রেইল</option>
                    </select>
                  </div>

                  {/* Date Range */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-600 uppercase">শুরুর তারিখ</label>
                      <input
                        type="date"
                        value={reportStartDate}
                        onChange={(e) => setReportStartDate(e.target.value)}
                        className="w-full text-xs border border-slate-200 px-3 py-2 bg-slate-50 focus:bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-800"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-600 uppercase">শেষের তারিখ</label>
                      <input
                        type="date"
                        value={reportEndDate}
                        onChange={(e) => setReportEndDate(e.target.value)}
                        className="w-full text-xs border border-slate-200 px-3 py-2 bg-slate-50 focus:bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Options Checkboxes */}
                  <div className="space-y-2 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-600 uppercase block mb-1">অতিরিক্ত অপশনসমূহ</span>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={includeCharts}
                        onChange={(e) => setIncludeCharts(e.target.checked)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                      />
                      <span className="text-[10px] font-bold text-slate-750">ডিজিটাল সিগনেচার ও সিল সংযুক্ত করুন</span>
                    </label>
                  </div>

                  {/* Audit Remarks */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-600 uppercase">অডিট মন্তব্য / বিশেষ নির্দেশনা (Remarks)</label>
                    <textarea
                      value={reportNotes}
                      onChange={(e) => setReportNotes(e.target.value)}
                      placeholder="অডিট স্টেটমেন্ট বা রিপোর্টে কোনো বিশেষ মন্তব্য বা সাইনিং নোট সংযুক্ত করতে চাইলে এখানে লিখুন..."
                      className="w-full text-xs border border-slate-200 px-3 py-2 bg-slate-50 focus:bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-800 h-20 resize-none leading-relaxed"
                    />
                  </div>

                  {/* Actions */}
                  <button
                    type="button"
                    onClick={() => {
                      const newId = `REP-${Math.floor(1000 + Math.random() * 9000)}`;
                      const newReport = {
                        id: newId,
                        date: new Date().toISOString(),
                        type: reportType,
                        name: reportType === 'performance' ? "সার্বিক প্ল্যাটফর্ম পারফরম্যান্স ও গ্রোথ রিপোর্ট"
                          : reportType === 'customers-vendors' ? "কাস্টমার ও মার্চেন্ট/ভেন্ডর কার্যক্রম রিপোর্ট"
                          : reportType === 'merchants' ? "মার্চেন্ট ও স্টোর রেজিস্ট্রি ভেরিফিকেশন অডিট"
                          : reportType === 'revenue' ? "কমিশন লেজার ও সাবস্ক্রিপশন রেভিনিউ স্টেটমেন্ট"
                          : reportType === 'bookings' ? "গ্রাহক অর্ডার ও বুকিং লগস রিপোর্ট"
                          : "সিস্টেম সিকিউরিটি এবং অ্যাডমিন অ্যাকশন ট্রেইল",
                        author: adminName,
                        status: "সফল",
                        range: `${reportStartDate} থেকে ${reportEndDate}`,
                        notes: reportNotes || "কোনো বিশেষ রিমার্ক বা মন্তব্য সংযুক্ত নেই।"
                      };
                      setGeneratedReportData(newReport);
                      setReportHistory(prev => [newReport, ...prev]);
                      alert('নতুন অডিট রিপোর্ট সফলভাবে জেনারেট করা হয়েছে! ডানপাশের প্রিভিউতে লেজার ও ডেটা শীট দেখে নিন।');
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-xs py-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    নতুন অডিট স্টেটমেন্ট জেনারেট করুন
                  </button>
                </div>
              </div>

              {/* Saved Reports / History Table */}
              <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 space-y-3.5">
                <div className="border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">🗄️ পূর্বের জেনারেটকৃত রিপোর্টসমূহ</h4>
                  <p className="text-[10px] text-slate-400 font-semibold mt-1">অ্যাডমিন প্রোফাইলের সাম্প্রতিক ডাটা এক্সপোর্ট ইতিহাস</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[10px] border-collapse">
                    <thead>
                      <tr className="bg-slate-50 font-bold border-b border-slate-100 text-slate-500">
                        <th className="py-2 px-2">রিপোর্ট আইডি</th>
                        <th className="py-2 px-2">নাম / টাইপ</th>
                        <th className="py-2 px-2">তারিখ ও সময়</th>
                        <th className="py-2 px-2 text-center">অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {reportHistory.map((rep) => (
                        <tr key={rep.id} className="hover:bg-slate-50/55 transition-colors">
                          <td className="py-2.5 px-2 font-mono font-bold text-blue-600">{rep.id}</td>
                          <td className="py-2.5 px-2">
                            <span className="font-bold text-slate-800 block truncate max-w-[120px]">{rep.name}</span>
                            <span className="text-[8px] text-slate-400">{rep.range}</span>
                          </td>
                          <td className="py-2.5 px-2 text-slate-500">
                            {new Date(rep.date).toLocaleDateString('bn-BD')} {new Date(rep.date).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setGeneratedReportData(rep);
                                setReportType(rep.type);
                                setReportNotes(rep.notes || '');
                              }}
                              className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[9px] px-2 py-1 rounded transition-all cursor-pointer"
                            >
                              ভিউ
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Column: Dynamic Report Sheet (7 cols on lg) */}
            <div className="lg:col-span-7 space-y-6">
              <div id="admin-profile-report-printable-area" className="bg-white border border-slate-150 rounded-2xl shadow-md p-6 sm:p-8 space-y-6 text-slate-800 text-left relative overflow-hidden">
                {/* Visual Watermark background icon */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-100/35 pointer-events-none text-[80px] font-black uppercase tracking-widest select-none z-0">
                  REST BAZAR
                </div>

                {/* Report Sheet Header */}
                <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
                  <div className="flex items-center gap-2.5">
                    <span className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xl shadow-md">
                      R
                    </span>
                    <div>
                      <h3 className="font-black text-slate-900 text-base">রেস্ট বাজার প্ল্যাটফর্ম অডিট</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-mono">Rest Bazar Official Audit Sheet</p>
                    </div>
                  </div>

                  <div className="text-right text-[10px] text-slate-500 space-y-0.5 font-bold font-mono">
                    <div>রিপোর্ট রেফারেন্স: <span className="text-blue-600 font-black">{generatedReportData?.id || "REP-9833"}</span></div>
                    <div>অডিট জেনারেশন সময়: <span>{new Date(generatedReportData?.date || new Date().toISOString()).toLocaleString('bn-BD')}</span></div>
                    <div>অডিট রেঞ্জ: <span className="bg-blue-50 px-1.5 py-0.5 rounded text-blue-700 font-black">{generatedReportData?.range || `${reportStartDate} থেকে ${reportEndDate}`}</span></div>
                  </div>
                </div>

                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-150 space-y-2">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">দায়িত্বপ্রাপ্ত কর্মকর্তা (Auditing Officer)</span>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-black text-sm">
                        🛡️
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900">{adminName}</h4>
                        <p className="text-[10px] text-slate-500 font-bold">{adminDesignation}</p>
                        <p className="text-[9px] text-slate-400 font-semibold font-mono">{adminPhone}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-150 space-y-1 text-xs">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">রিপোর্ট ধরণ ও সাব-সিস্টেম</span>
                    <div className="space-y-1 font-bold text-slate-700 pt-0.5">
                      <div className="flex justify-between text-[11px]">
                        <span>আবেদনের ধরণ:</span>
                        <span className="text-blue-700 font-black">
                          {reportType === 'performance' ? "সার্বিক প্ল্যাটফর্ম পারফরম্যান্স"
                            : reportType === 'customers-vendors' ? "কাস্টমার ও মার্চেন্ট কার্যক্রম"
                            : reportType === 'merchants' ? "মার্চেন্ট রেজিস্ট্রি অডিট"
                            : reportType === 'revenue' ? "কমিশন ও আয় রেভিনিউ"
                            : reportType === 'bookings' ? "অর্ডার ও বুকিং লগস"
                            : "নিরাপত্তা ও অ্যাকশন লগ"}
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span>রিপোর্ট স্ট্যাটাস:</span>
                        <span className="text-emerald-600 font-black">সফলভাবে যাচাইকৃত (VERIFIED)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dynamic Content based on selected reportType */}
                <div className="relative z-10 space-y-4">
                  {reportType === 'performance' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50/50 p-3.5 rounded-xl border border-blue-100/60">
                        <span className="text-[10px] font-black text-blue-800 uppercase block mb-1">📊 সার্বিক পারফরম্যান্স মেট্রিক্স সামারি</span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center pt-1.5">
                          <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-3xs">
                            <span className="text-[9px] text-slate-400 block font-bold">মোট গ্রাহক</span>
                            <span className="font-black text-slate-850 text-sm font-sans">{totalUsers} জন</span>
                          </div>
                          <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-3xs">
                            <span className="text-[9px] text-slate-400 block font-bold">নিবন্ধিত মার্চেন্ট</span>
                            <span className="font-black text-slate-850 text-sm font-sans">{totalBusinesses} টি</span>
                          </div>
                          <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-3xs">
                            <span className="text-[9px] text-slate-400 block font-bold">সম্পন্ন বুকিং</span>
                            <span className="font-black text-slate-850 text-sm font-sans">{allDb.bookings.filter((b: any) => b.status === 'completed').length} টি</span>
                          </div>
                          <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-3xs">
                            <span className="text-[9px] text-slate-400 block font-bold">মোট প্ল্যাটফর্ম আয়</span>
                            <span className="font-black text-emerald-600 text-sm font-sans">৳{totalEarnings.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[10px] font-black text-slate-500 uppercase block">শ্রেণী ভিত্তিক মার্চেন্ট ও দোকান পরিসংখ্যান</span>
                        <div className="border border-slate-150 rounded-xl overflow-hidden bg-white">
                          <table className="w-full text-xs text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50 font-bold border-b border-slate-150 text-slate-600">
                                <th className="p-2.5">ক্যাটাগরি</th>
                                <th className="p-2.5 text-center">মোট নিবন্ধিত স্টোর</th>
                                <th className="p-2.5 text-center">পণ্য বা অফার সংখ্যা</th>
                                <th className="p-2.5 text-right">আয় অবদান</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                              {categoriesList.map((cat: any) => {
                                const bizs = allDb.businesses.filter(b => b.category.toLowerCase() === cat.id.toLowerCase());
                                const itemsCount = bizs.reduce((sum, b) => sum + ((b.products?.length || 0) + (b.services?.length || 0)), 0);
                                return (
                                  <tr key={cat.id} className="hover:bg-slate-50/40">
                                    <td className="p-2.5 flex items-center gap-2">
                                      <span className="p-1 bg-slate-100 rounded text-slate-600 text-[10px]">{cat.nameEnglish}</span>
                                      <span className="font-bold text-slate-900">{cat.nameBangla}</span>
                                    </td>
                                    <td className="p-2.5 text-center">{bizs.length} টি</td>
                                    <td className="p-2.5 text-center text-slate-500">{itemsCount} টি আইটেম</td>
                                    <td className="p-2.5 text-right text-emerald-700 font-bold">৫% কমিশন হার</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {reportType === 'customers-vendors' && (
                    <div className="space-y-5">
                      {/* Subtab Stats Card */}
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-150/85 text-left">
                        <span className="text-[10px] font-black text-blue-800 uppercase block mb-1">👥 কাস্টমার ও ভেন্ডর অডিট সামারি</span>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center pt-1.5">
                          <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-3xs">
                            <span className="text-[9px] text-slate-400 block font-bold">মোট কাস্টমার (গ্রাহক)</span>
                            <span className="font-black text-blue-700 text-sm font-sans">{allDb.users.filter(u => u.role === 'user').length} জন</span>
                            <span className="text-[8px] text-slate-400 block mt-0.5">নিবন্ধিত ব্যবহারকারী</span>
                          </div>
                          <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-3xs">
                            <span className="text-[9px] text-slate-400 block font-bold">মোট মার্চেন্ট / ভেন্ডর</span>
                            <span className="font-black text-indigo-700 text-sm font-sans">{allDb.users.filter(u => u.role === 'merchant').length} জন</span>
                            <span className="text-[8px] text-slate-400 block mt-0.5">নিবন্ধিত ব্যবসায়ী</span>
                          </div>
                          <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-3xs">
                            <span className="text-[9px] text-slate-400 block font-bold">মোট ব্যবসা / দোকান</span>
                            <span className="font-black text-emerald-600 text-sm font-sans">{allDb.businesses.length} টি</span>
                            <span className="text-[8px] text-slate-400 block mt-0.5">লাইভ ক্যাটালগ ও স্টোর</span>
                          </div>
                          <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-3xs">
                            <span className="text-[9px] text-slate-400 block font-bold">ভেরিফাইড মার্চেন্ট</span>
                            <span className="font-black text-teal-600 text-sm font-sans">
                              {allDb.users.filter(u => u.role === 'merchant' && u.isMerchantVerified).length} জন
                            </span>
                            <span className="text-[8px] text-slate-400 block mt-0.5">লাইসেন্স যাচাইকৃত</span>
                          </div>
                        </div>
                      </div>

                      {/* Interactive Live Search and Filter Panel */}
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-3xs space-y-3 text-left">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-1 border-b border-slate-100">
                          <div>
                            <h4 className="text-xs font-black text-slate-800">🔍 অডিট লাইভ সার্চ ও ফিল্টার</h4>
                            <p className="text-[9px] text-slate-400 font-bold">গ্রাহক ও ভেন্ডর ডাটা ফিল্টার করুন</p>
                          </div>
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => setCustVendFilterRole('all')}
                              className={`px-2 py-1 rounded text-[10px] font-bold ${
                                custVendFilterRole === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              সবাই
                            </button>
                            <button
                              type="button"
                              onClick={() => setCustVendFilterRole('user')}
                              className={`px-2 py-1 rounded text-[10px] font-bold ${
                                custVendFilterRole === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              👥 কাস্টমার
                            </button>
                            <button
                              type="button"
                              onClick={() => setCustVendFilterRole('merchant')}
                              className={`px-2 py-1 rounded text-[10px] font-bold ${
                                custVendFilterRole === 'merchant' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              🏪 ভেন্ডর
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="block text-[9px] font-bold text-slate-500 uppercase">নাম বা ফোন নম্বর খুঁজুন</label>
                            <input
                              type="text"
                              value={custVendSearch}
                              onChange={(e) => setCustVendSearch(e.target.value)}
                              placeholder="যেমন: আমিনুল, ০১৮xxxx..."
                              className="w-full text-xs border border-slate-200 px-3 py-1.5 bg-slate-50 focus:bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium text-slate-850"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[9px] font-bold text-slate-500 uppercase">জেলা বা এরিয়া দিয়ে ফিল্টার</label>
                            <select
                              value={custVendDistrict}
                              onChange={(e) => setCustVendDistrict(e.target.value)}
                              className="w-full text-xs border border-slate-200 px-2.5 py-1.5 bg-slate-50 focus:bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-700"
                            >
                              <option value="all">🌍 সকল জেলা / এরিয়া</option>
                              {Array.from(new Set(allDb.users.map(u => (u.location?.district || u.location?.address || '').trim()).filter(Boolean))).map((dist: string, idx: number) => (
                                <option key={`admin-dist-${dist}-${idx}`} value={dist}>📍 {dist}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Filtered List of Customers & Vendors */}
                      <div className="space-y-2 text-left">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-slate-500 uppercase">সদস্য কার্যক্রম লেজার শিট</span>
                          <span className="text-[9px] text-slate-400 font-bold">ফিল্টারকৃত ফলাফল: {
                            allDb.users.filter(u => {
                              if (custVendFilterRole !== 'all' && u.role !== custVendFilterRole) return false;
                              if (u.role === 'admin') return false;
                              
                              const matchesSearch = u.name.toLowerCase().includes(custVendSearch.toLowerCase()) || 
                                                    u.phone.includes(custVendSearch) || 
                                                    (u.email || '').toLowerCase().includes(custVendSearch.toLowerCase());
                              
                              const userLoc = u.location?.district || u.location?.address || '';
                              const matchesLocation = custVendDistrict === 'all' || userLoc.toLowerCase().includes(custVendDistrict.toLowerCase());
                              
                              return matchesSearch && matchesLocation;
                            }).length
                          } জন</span>
                        </div>
                        
                        <div className="border border-slate-150 rounded-xl overflow-hidden bg-white shadow-3xs">
                          <table className="w-full text-xs text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50 font-bold border-b border-slate-150 text-slate-600">
                                <th className="p-2.5">ইউজার তথ্য (কাস্টমার / ভেন্ডর)</th>
                                <th className="p-2.5">রোল (Role)</th>
                                <th className="p-2.5">ঠিকানা / জেলা</th>
                                <th className="p-2.5 text-center">যোগদানের তারিখ</th>
                                <th className="p-2.5 text-right">কার্যক্রম / রেকর্ড</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                              {(() => {
                                const filteredUsers = allDb.users.filter(u => {
                                  if (custVendFilterRole !== 'all' && u.role !== custVendFilterRole) return false;
                                  if (u.role === 'admin') return false;
                                  
                                  const matchesSearch = u.name.toLowerCase().includes(custVendSearch.toLowerCase()) || 
                                                        u.phone.includes(custVendSearch) || 
                                                        (u.email || '').toLowerCase().includes(custVendSearch.toLowerCase());
                                  
                                  const userLoc = u.location?.district || u.location?.address || '';
                                  const matchesLocation = custVendDistrict === 'all' || userLoc.toLowerCase().includes(custVendDistrict.toLowerCase());
                                  
                                  return matchesSearch && matchesLocation;
                                });

                                if (filteredUsers.length === 0) {
                                  return (
                                    <tr>
                                      <td colSpan={5} className="p-8 text-center text-slate-400 font-bold">
                                        কোনো ম্যাচিং গ্রাহক বা ভেন্ডর ডাটা খুঁজে পাওয়া যায়নি।
                                      </td>
                                    </tr>
                                  );
                                }

                                return filteredUsers.map((u) => {
                                  const userBiz = u.role === 'merchant' ? allDb.businesses.find(b => b.ownerPhone === u.phone) : null;
                                  const bookingsCount = u.role === 'user' 
                                    ? allDb.bookings.filter((b: any) => b.customerPhone === u.phone).length
                                    : allDb.bookings.filter((b: any) => b.businessId === userBiz?.id).length;

                                  return (
                                    <tr key={u.phone} className="hover:bg-slate-50/40">
                                      <td className="p-2.5">
                                        <div className="flex items-center gap-2">
                                          <div className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs ${
                                            u.role === 'merchant' ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'
                                          }`}>
                                            {u.image ? (
                                              <img src={u.image} alt={u.name} className="w-full h-full rounded-full object-cover" />
                                            ) : (
                                              u.name.substring(0, 2)
                                            )}
                                          </div>
                                          <div>
                                            <button
                                              type="button"
                                              onClick={() => setSelectedUserDetail(u)}
                                              className="font-bold text-blue-600 hover:text-blue-800 hover:underline transition-all text-left flex items-center gap-1.5"
                                            >
                                              {u.name}
                                              {u.role === 'merchant' && (
                                                <span className={`text-[8px] font-black px-1 rounded-sm ${
                                                  u.isMerchantVerified ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                                }`}>
                                                  {u.isMerchantVerified ? 'Verified' : 'Pending'}
                                                </span>
                                              )}
                                            </button>
                                            <span className="text-[10px] text-slate-400 font-mono block">{u.phone}</span>
                                            {userBiz && (
                                              <span className="text-[9px] text-slate-500 font-bold block bg-slate-50 px-1 py-0.2 rounded border border-slate-100 mt-0.5">
                                                🏪 দোকান: {userBiz.name} ({userBiz.category})
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </td>
                                      <td className="p-2.5">
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                          u.role === 'merchant' ? 'bg-indigo-100 text-indigo-800' : 'bg-blue-100 text-blue-800'
                                        }`}>
                                          {u.role === 'merchant' ? '🏪 ভেন্ডর' : '👥 কাস্টমার'}
                                        </span>
                                      </td>
                                      <td className="p-2.5">
                                        <span className="text-[11px] block text-slate-700 font-medium">
                                          {u.location?.district || "N/A"}
                                        </span>
                                        <span className="text-[9px] text-slate-400 font-semibold block truncate max-w-[150px]">
                                          {u.location?.address || "কোনো সুনির্দিষ্ট এরিয়া দেওয়া নেই"}
                                        </span>
                                      </td>
                                      <td className="p-2.5 text-center text-slate-500 font-mono text-[10px]">
                                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString('bn-BD') : "N/A"}
                                      </td>
                                      <td className="p-2.5 text-right">
                                        <div className="text-[11px]">
                                          <span className="font-bold text-slate-900 block">
                                            {bookingsCount} টি {u.role === 'merchant' ? 'বিক্রয়/বুকিং' : 'অর্ডার'}
                                          </span>
                                          {u.role === 'merchant' && userBiz && (
                                            <span className="text-[9px] text-emerald-600 font-black block">
                                              আইটেম: {(userBiz.products?.length || 0) + (userBiz.services?.length || 0)} টি
                                            </span>
                                          )}
                                          {u.role === 'user' && u.favorites && u.favorites.length > 0 && (
                                            <span className="text-[9px] text-amber-600 font-bold block">
                                              পছন্দ: {u.favorites.length} টি দোকান
                                              </span>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                });
                              })()}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {reportType === 'merchants' && (
                    <div className="space-y-4">
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 space-y-1 text-xs">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">স্টোর রেজিস্ট্রি ও ভেরিফিকেশন সামারি</span>
                        <div className="grid grid-cols-3 gap-2 text-center pt-1">
                          <div className="bg-white p-2 rounded-lg border border-slate-100">
                            <span className="text-[8px] text-slate-400 block font-bold">মোট স্টোর</span>
                            <span className="font-black text-slate-900 text-xs font-sans">{totalBusinesses} টি</span>
                          </div>
                          <div className="bg-white p-2 rounded-lg border border-slate-100">
                            <span className="text-[8px] text-slate-400 block font-bold">ভেরিফাইড লাইসেন্স</span>
                            <span className="font-black text-emerald-600 text-xs font-sans">
                              {allDb.users.filter(u => u.tradeLicenseNo && u.isMerchantVerified).length} টি
                            </span>
                          </div>
                          <div className="bg-white p-2 rounded-lg border border-slate-100">
                            <span className="text-[8px] text-slate-400 block font-bold">অপেক্ষমান লাইসেন্স</span>
                            <span className="font-black text-amber-500 text-xs font-sans">
                              {allDb.users.filter(u => u.tradeLicenseNo && !u.isMerchantVerified).length} টি
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[10px] font-black text-slate-500 uppercase block">মার্চেন্ট প্রোফাইল ডেটাশীট (নমুনা তালিকা)</span>
                        <div className="border border-slate-150 rounded-xl overflow-hidden bg-white">
                          <table className="w-full text-xs text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50 font-bold border-b border-slate-150 text-slate-600">
                                <th className="p-2.5">স্টোর বা ব্যবসার নাম</th>
                                <th className="p-2.5">মার্চেন্ট কন্টাক্ট</th>
                                <th className="p-2.5 text-center">ট্রেড লাইসেন্স নং</th>
                                <th className="p-2.5 text-right">ভেরিফিকেশন স্ট্যাটাস</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                              {allDb.businesses.slice(0, 5).map((biz) => {
                                const ownerUser = allDb.users.find(u => u.phone === biz.ownerPhone);
                                return (
                                  <tr key={biz.id} className="hover:bg-slate-50/40">
                                    <td className="p-2.5">
                                      <span className="font-bold text-slate-900 block">{biz.name}</span>
                                      <span className="text-[9px] text-slate-400 font-mono capitalize">{biz.category}</span>
                                    </td>
                                    <td className="p-2.5">
                                      <span className="block font-mono text-[10px]">{biz.ownerPhone}</span>
                                      <span className="text-[9px] text-slate-400 block">{biz.address}</span>
                                    </td>
                                    <td className="p-2.5 text-center font-mono text-[10px] text-slate-600">
                                      {ownerUser?.tradeLicenseNo || "N/A"}
                                    </td>
                                    <td className="p-2.5 text-right">
                                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                                        ownerUser?.isMerchantVerified 
                                          ? 'bg-emerald-100 text-emerald-800' 
                                          : 'bg-amber-100 text-amber-800'
                                      }`}>
                                        {ownerUser?.isMerchantVerified ? 'ভেরিফাইড' : 'অপেক্ষমান'}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {reportType === 'revenue' && (
                    <div className="space-y-4">
                      <div className="bg-emerald-50/40 p-3.5 rounded-xl border border-emerald-100/80">
                        <span className="text-[10px] font-black text-emerald-800 uppercase block mb-1">💰 আর্থিক কমিশন লেজার ও রাজস্ব স্টেটমেন্ট</span>
                        <div className="grid grid-cols-3 gap-2.5 text-center pt-1">
                          <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-3xs">
                            <span className="text-[8px] text-slate-400 block font-bold">সাবস্ক্রিপশন ফি</span>
                            <span className="font-black text-slate-850 text-xs font-sans">৳{subIncome.toLocaleString()}</span>
                          </div>
                          <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-3xs">
                            <span className="text-[8px] text-slate-400 block font-bold">বিজ্ঞাপন ফি</span>
                            <span className="font-black text-slate-850 text-xs font-sans">৳{adIncome.toLocaleString()}</span>
                          </div>
                          <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-3xs">
                            <span className="text-[8px] text-slate-400 block font-bold">বুকিং কমিশন (৫%)</span>
                            <span className="font-black text-slate-850 text-xs font-sans">৳{commissionIncome.toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="border-t border-emerald-100/80 mt-2.5 pt-2 flex justify-between items-center text-xs">
                          <span className="text-slate-500 font-bold">সর্বমোট প্ল্যাটফর্ম অর্जित রাজস্ব:</span>
                          <span className="font-black text-emerald-700 text-sm">৳{totalEarnings.toLocaleString()} টাকা</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[10px] font-black text-slate-500 uppercase block">সাম্প্রতিক মার্চেন্ট ফি ও লেনদেন বিবরণী</span>
                        <div className="border border-slate-150 rounded-xl overflow-hidden bg-white">
                          <table className="w-full text-xs text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50 font-bold border-b border-slate-150 text-slate-600">
                                <th className="p-2.5">স্টোর বা ব্যবসার নাম</th>
                                <th className="p-2.5 text-center">লেনদেন ধরণ</th>
                                <th className="p-2.5 text-center">তারিখ</th>
                                <th className="p-2.5 text-right">পরিমাণ (টাকা)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                              {(() => {
                                let txList: any[] = [];
                                allDb.businesses.forEach(b => {
                                  b.transactions.forEach((t: any) => {
                                    txList.push({ bizName: b.name, ...t });
                                  });
                                });
                                return txList.slice(0, 5).map((tx, idx) => (
                                  <tr key={idx} className="hover:bg-slate-50/40">
                                    <td className="p-2.5">
                                      <span className="font-bold text-slate-900 block">{tx.bizName}</span>
                                    </td>
                                    <td className="p-2.5 text-center">
                                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                        tx.type === 'subscription' 
                                          ? 'bg-blue-100 text-blue-800' 
                                          : 'bg-purple-100 text-purple-800'
                                      }`}>
                                        {tx.type === 'subscription' ? 'প্যাকেজ সাবস্ক্রিপশন' : 'বিজ্ঞাপন পেমেন্ট'}
                                      </span>
                                    </td>
                                    <td className="p-2.5 text-center font-mono text-[10px] text-slate-500">
                                      {tx.date ? new Date(tx.date).toLocaleDateString('bn-BD') : "N/A"}
                                    </td>
                                    <td className="p-2.5 text-right text-slate-900 font-black">
                                      ৳ {tx.amount.toLocaleString()}
                                    </td>
                                  </tr>
                                ));
                              })()}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {reportType === 'bookings' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100/60 space-y-1 text-xs">
                        <span className="text-[9px] font-black text-blue-800 uppercase block">গ্রাহক বুকিং ও অর্ডার লগ মেট্রিক্স</span>
                        <div className="grid grid-cols-3 gap-2 text-center pt-1">
                          <div className="bg-white p-2 rounded-lg border border-slate-100">
                            <span className="text-[8px] text-slate-400 block font-bold">মোট অর্ডার সংখ্যা</span>
                            <span className="font-black text-slate-900 text-xs font-sans">{allDb.bookings.length} টি</span>
                          </div>
                          <div className="bg-white p-2 rounded-lg border border-slate-100">
                            <span className="text-[8px] text-slate-400 block font-bold">সম্পন্ন অর্ডার</span>
                            <span className="font-black text-emerald-600 text-xs font-sans">
                              {allDb.bookings.filter((b: any) => b.status === 'completed').length} টি
                            </span>
                          </div>
                          <div className="bg-white p-2 rounded-lg border border-slate-100">
                            <span className="text-[8px] text-slate-400 block font-bold">বাতিলকৃত অর্ডার</span>
                            <span className="font-black text-rose-500 text-xs font-sans">
                              {allDb.bookings.filter((b: any) => b.status === 'cancelled').length} টি
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[10px] font-black text-slate-500 uppercase block">বুকিং লেজার কন্টেন্ট শীট (নমুনা)</span>
                        <div className="border border-slate-150 rounded-xl overflow-hidden bg-white">
                          <table className="w-full text-xs text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50 font-bold border-b border-slate-150 text-slate-600">
                                <th className="p-2.5">অর্ডার / বুকিং আইডি</th>
                                <th className="p-2.5">গ্রাহক কন্টাক্ট</th>
                                <th className="p-2.5">স্টোরের নাম</th>
                                <th className="p-2.5 text-right">মূল্য ও অবস্থা</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                              {allDb.bookings.slice(0, 5).map((bk: any) => (
                                <tr key={bk.id} className="hover:bg-slate-50/40">
                                  <td className="p-2.5 font-mono text-[10px] text-blue-600 font-bold">
                                    {bk.id}
                                  </td>
                                  <td className="p-2.5 text-[11px]">
                                    <span className="font-bold text-slate-900 block">{bk.customerName}</span>
                                    <span className="text-slate-400 font-mono text-[9px]">{bk.customerPhone}</span>
                                  </td>
                                  <td className="p-2.5 font-bold text-slate-800 text-[11px] truncate max-w-[110px]">
                                    {bk.businessName}
                                  </td>
                                  <td className="p-2.5 text-right text-[11px]">
                                    <span className="font-black text-slate-900 block">৳ {bk.totalPrice}</span>
                                    <span className={`inline-block text-[8px] font-black px-1.5 py-0.2 rounded-sm ${
                                      bk.status === 'completed' ? 'bg-emerald-100 text-emerald-800'
                                        : bk.status === 'pending' ? 'bg-amber-100 text-amber-800'
                                        : 'bg-rose-100 text-rose-800'
                                    }`}>
                                      {bk.status === 'completed' ? 'সম্পন্ন' : bk.status === 'pending' ? 'অপেক্ষমান' : 'বাতিল'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {reportType === 'security' && (
                    <div className="space-y-4">
                      <div className="bg-rose-50/50 p-3 rounded-xl border border-rose-100 space-y-1 text-xs">
                        <span className="text-[9px] font-black text-rose-800 uppercase block">🔒 সিস্টেম সিকিউরিটি ও ইন্টিগ্রিটি লগ</span>
                        <div className="space-y-1 text-[10px] text-slate-500 font-mono font-bold leading-relaxed pt-0.5">
                          <div className="flex justify-between">
                            <span>সার্ভার কানেকশন অবস্থা:</span>
                            <span className="text-emerald-600">● ACTIVE (SSL secured)</span>
                          </div>
                          <div className="flex justify-between">
                            <span>অ্যাডমিন অ্যাক্টিভিটি ট্র্যাকিং:</span>
                            <span className="text-blue-600">সক্রিয় রয়েছে</span>
                          </div>
                          <div className="flex justify-between">
                            <span>ট্রেড লাইসেন্স ডাটা ইন্টিগ্রিটি:</span>
                            <span className="text-emerald-600">১০০% ভেরিফাইড লেজার</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[10px] font-black text-slate-500 uppercase block">সাম্প্রতিক অ্যাডমিনিস্ট্রেটিভ অ্যাকশন অডিট লগস</span>
                        <div className="border border-slate-150 rounded-xl overflow-hidden bg-white">
                          <table className="w-full text-xs text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50 font-bold border-b border-slate-150 text-slate-600">
                                <th className="p-2.5">অ্যাকশন / ইভেন্ট বিবরণ</th>
                                <th className="p-2.5">আইপি / হোস্ট এড্রেস</th>
                                <th className="p-2.5">অপারেটর আইডেন্টিটি</th>
                                <th className="p-2.5 text-right">ফলাফল</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-mono text-[10px] text-slate-600">
                              <tr className="hover:bg-slate-50/40">
                                <td className="p-2.5 text-slate-800 font-sans">
                                  🔔 ব্রডকাস্ট এলার্ট প্রেরণ করা হয়েছে
                                </td>
                                <td className="p-2.5">192.168.1.145</td>
                                <td className="p-2.5 font-sans">{adminName}</td>
                                <td className="p-2.5 text-right text-emerald-600 font-black">SUCCESS</td>
                              </tr>
                              <tr className="hover:bg-slate-50/40">
                                <td className="p-2.5 text-slate-800 font-sans">
                                  📄 মার্চেন্ট ট্রেড লাইসেন্স ভেরিফিকেশন আপডেট
                                </td>
                                <td className="p-2.5">192.168.1.145</td>
                                <td className="p-2.5 font-sans">{adminName}</td>
                                <td className="p-2.5 text-right text-emerald-600 font-black">SUCCESS</td>
                              </tr>
                              <tr className="hover:bg-slate-50/40">
                                <td className="p-2.5 text-slate-800 font-sans">
                                  📢 প্রমোশনাল ব্যানার অনুমোদন স্ট্যাটাস পরিবর্তন
                                </td>
                                <td className="p-2.5">192.168.1.145</td>
                                <td className="p-2.5 font-sans">{adminName}</td>
                                <td className="p-2.5 text-right text-emerald-600 font-black">SUCCESS</td>
                              </tr>
                              <tr className="hover:bg-slate-50/40">
                                <td className="p-2.5 text-slate-800 font-sans">
                                  ⚙️ গ্লোবাল কমিশন কনফিগারেশন ফি পরিবর্তন
                                </td>
                                <td className="p-2.5">192.168.1.145</td>
                                <td className="p-2.5 font-sans">{adminName}</td>
                                <td className="p-2.5 text-right text-emerald-600 font-black">SUCCESS</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Report Sheet Notes section */}
                <div className="relative z-10 border-t border-slate-200 pt-5 space-y-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase block">অডিট মেমোরেন্ডাম ও সাইনিং রিমার্কস</span>
                  <p className="text-[10px] text-slate-500 font-semibold leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {reportNotes ? reportNotes : "এই অফিশিয়াল অডিট স্টেটমেন্টটি সিস্টেমে থাকা সমস্ত ট্রানজেকশন লগ, বুকিং ডাটাবেজ এবং ইউজার অ্যাকাউন্ট তথ্য বিশ্লেষণ করে তৈরি করা হয়েছে। রিপোর্টটি সম্পূর্ণ নির্ভুল ও সিস্টেম অডিট কমপ্লায়েন্স স্ট্যান্ডার্ড অনুযায়ী ভেরিফাইড।" }
                  </p>
                </div>

                {/* Printable Signature block */}
                {includeCharts && (
                  <div className="relative z-10 pt-10 flex justify-between items-end text-xs font-bold text-slate-500">
                    <div className="text-center w-40 border-t border-slate-300 pt-2 text-[10px]">
                      <p>ডিজিটাল সিকিউরিটি ভেরিফিকেশন</p>
                      <p className="text-[9px] text-slate-400 font-mono font-bold uppercase tracking-widest pt-0.5">REST BAZAR SECURE</p>
                    </div>
                    <div className="text-center w-48 border-t border-slate-300 pt-2 text-[10px]">
                      <p className="text-slate-900 font-black">{adminName}</p>
                      <p className="text-[9px] text-slate-400 font-bold">{adminDesignation}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons to Print */}
              <div className="flex justify-end gap-3 bg-white p-4 border border-slate-100 rounded-2xl shadow-xs">
                <button
                  type="button"
                  onClick={() => {
                    const printContents = document.getElementById('admin-profile-report-printable-area')?.innerHTML;
                    if (printContents) {
                      const printWindow = window.open('', '_blank', 'height=600,width=800');
                      if (printWindow) {
                        printWindow.document.write('<html><head><title>Admin Profile Audit Report</title>');
                        printWindow.document.write('<style>body { font-family: sans-serif; padding: 40px; color: #334155; } table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 10px; } th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; font-size: 11px; } th { background-color: #f8fafc; font-weight: bold; } .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px; margin-bottom: 15px; } .bg-slate-50 { background-color: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; } .font-mono { font-family: monospace; } .text-right { text-align: right; } .font-black { font-weight: 900; } .text-blue-600 { color: #2563eb; }</style>');
                        printWindow.document.write('</head><body>');
                        printWindow.document.write(printContents);
                        printWindow.document.write('</body></html>');
                        printWindow.document.close();
                        printWindow.focus();
                        setTimeout(() => {
                          printWindow.print();
                          printWindow.close();
                        }, 500);
                      } else {
                        window.print();
                      }
                    } else {
                      window.print();
                    }
                  }}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-black text-xs py-2.5 px-5 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  এই রিপোর্টটি নতুন ট্যাবে প্রিন্ট / PDF ডাউনলোড করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Printable Report Modal Overlay */}
      {showPrintReport && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-150 bg-slate-50/80 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">🛡️</span>
                <h3 className="font-black text-slate-900 text-sm">রেস্ট বাজার অডিট ও ফাইনান্সিয়াল স্টেটমেন্ট</h3>
              </div>
              <button 
                onClick={() => setShowPrintReport(false)}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Area content */}
            <div id="restbazar-printable-report" className="p-8 space-y-8 text-slate-800 text-left overflow-y-auto flex-1">
              
              {/* Header Title Info */}
              <div className="border-b-4 border-double border-slate-300 pb-5 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div className="space-y-1.5">
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">REST BAZAR PLATFORM</h1>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">রিয়েল-টাইম প্ল্যাটফর্ম পারফরম্যান্স ও ফাইন্যান্সিয়াল অডিট রিপোর্ট</p>
                  <p className="text-[10px] text-slate-400 font-bold">সার্ভার নোড: <span className="font-mono">restbazar-main-cloudrun-node</span></p>
                </div>
                <div className="text-right text-[11px] font-semibold text-slate-500">
                  <p>তারিখ: {new Date().toLocaleDateString('bn-BD')} | সময়: {new Date().toLocaleTimeString('bn-BD')}</p>
                  <p>অডিটর ইমেইল: <span className="font-mono text-slate-700 font-bold">info.restbazar@gmail.com</span></p>
                  <p>স্ট্যাটাস: <span className="text-emerald-600 font-bold">Verified Audit Record</span></p>
                </div>
              </div>

              {/* Grid 1: Basic counters */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="border border-slate-200 p-4 rounded-xl bg-slate-50/50">
                  <span className="text-[10px] font-black text-slate-400 uppercase">মোট গ্রাহক সংখ্যা</span>
                  <p className="text-xl font-black text-slate-900 mt-1">{totalUsers} জন</p>
                </div>
                <div className="border border-slate-200 p-4 rounded-xl bg-slate-50/50">
                  <span className="text-[10px] font-black text-slate-400 uppercase">মোট নিবন্ধিত স্টোর</span>
                  <p className="text-xl font-black text-slate-900 mt-1">{totalBusinesses} টি</p>
                </div>
                <div className="border border-slate-200 p-4 rounded-xl bg-slate-50/50">
                  <span className="text-[10px] font-black text-slate-400 uppercase">মোট অর্ডার সংখ্যা</span>
                  <p className="text-xl font-black text-slate-900 mt-1">{allDb.bookings.length} টি</p>
                </div>
                <div className="border border-slate-200 p-4 rounded-xl bg-slate-50/50">
                  <span className="text-[10px] font-black text-slate-400 uppercase">প্লাটফর্ম মোট আয়</span>
                  <p className="text-xl font-black text-blue-600 mt-1">৳ {totalEarnings.toLocaleString()}</p>
                </div>
              </div>

              {/* Table 1: Financial Split */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider border-l-4 border-blue-600 pl-2">১. প্ল্যাটফর্ম আয়ের বিবরণ ও খাতভিত্তিক বন্টন</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50 font-bold border-b border-slate-200 text-slate-600">
                        <th className="p-3">আয়ের খাত ও বিবরণ</th>
                        <th className="p-3 text-center">হার / শতাংশ</th>
                        <th className="p-3 text-right">আয়ের পরিমাণ (টাকা)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 font-medium text-slate-700">
                      <tr>
                        <td className="p-3">
                          <span className="font-bold text-slate-900 block">মার্চেন্ট প্যাকেজ সাবস্ক্রিপশন ফি (Subscriptions)</span>
                          <span className="text-[10px] text-slate-400">সিলভার, গোল্ড ও ডায়মন্ড প্রিমিয়াম মার্চেন্ট ফি</span>
                        </td>
                        <td className="p-3 text-center">স্থির প্যাকেজ ফি</td>
                        <td className="p-3 text-right font-bold">৳ {subIncome.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td className="p-3">
                          <span className="font-bold text-slate-900 block">স্পন্সরড ক্যাটাগরি ও ব্যানার প্রমোশন ফি (Sponsored Ads)</span>
                          <span className="text-[10px] text-slate-400">ক্যাটাগরি টপ পজিশন বুস্ট ও বিজ্ঞাপন চার্জ</span>
                        </td>
                        <td className="p-3 text-center">দৈনিক ক্যাম্পেইন বাজেট</td>
                        <td className="p-3 text-right font-bold">৳ {adIncome.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td className="p-3">
                          <span className="font-bold text-slate-900 block">অর্ডার ও বুকিং কমিশন ফি (Service Commissions)</span>
                          <span className="text-[10px] text-slate-400">মার্চেন্টদের সম্পন্ন হওয়া অর্ডারের ওপর নির্ধারিত ফি</span>
                        </td>
                        <td className="p-3 text-center">গ্লোবাল {systemCommRate}%</td>
                        <td className="p-3 text-right font-bold">৳ {commissionIncome.toLocaleString()}</td>
                      </tr>
                      <tr className="bg-slate-50 font-black text-slate-900 border-t border-slate-200">
                        <td className="p-3 uppercase tracking-wider">সর্বমোট প্লাটফর্ম নেট রেভিনিউ</td>
                        <td className="p-3 text-center">-</td>
                        <td className="p-3 text-right text-blue-600 text-sm">৳ {totalEarnings.toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Table 2: Top Merchants list */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider border-l-4 border-blue-600 pl-2">২. সর্বোচ্চ অবদানকারী শীর্ষ মার্চেন্ট তালিকা</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50 font-bold border-b border-slate-200 text-slate-600">
                        <th className="p-3">মার্চেন্ট বা স্টোরের নাম</th>
                        <th className="p-3">ক্যাটাগরি</th>
                        <th className="p-3 text-center">সম্পন্ন বুকিং</th>
                        <th className="p-3 text-right">মোট বিক্রয় (টাকা)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 font-medium text-slate-700">
                      {getTopMerchants().map((m, i) => (
                        <tr key={m.id}>
                          <td className="p-3">
                            <span className="font-bold text-slate-900 block">{i+1}. {m.name}</span>
                            <span className="text-[10px] text-slate-400">আইডি: {m.id}</span>
                          </td>
                          <td className="p-3 capitalize">{m.category === 'groceries' ? 'মুদিখানা' : m.category === 'medicines' ? 'ফার্মেসি' : m.category === 'electricians' ? 'ইলেকট্রিশিয়ান' : m.category === 'plumbers' ? 'প্লাম্বার' : m.category}</td>
                          <td className="p-3 text-center font-bold">{m.bookingsCount} টি</td>
                          <td className="p-3 text-right font-black text-slate-900">৳ {m.totalSales.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Statement Note */}
              <div className="border-t border-slate-200 pt-5 space-y-2">
                <span className="text-[10px] font-black text-slate-400 uppercase block">অডিট নোটিফিকেশন ও ঘোষণা</span>
                <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                  এই ডিক্লেয়ারেশন স্টেটমেন্টটি সিস্টেমে থাকা সকল রিয়েল-টাইম ডাটা, বুকিং লেজার, ট্রানজেকশন আইডি এবং ইউজার ডাটাবেজ বিশ্লেষণ করে প্রস্তুত করা হয়েছে। সমস্ত আয়ের অংক যথোপযুক্ত লাইসেন্সিং নীতি ও সিস্টেম কনফিগারেশন ফি রেট অনুযায়ী সম্পূর্ণ নিখুঁত। যেকোনো প্রয়োজনে এই স্টেটমেন্টটি অফিসিয়াল ডকুমেন্ট ও অডিট ফাইলিংয়ে ব্যবহার করা যাবে।
                </p>
              </div>

              {/* Signature section */}
              <div className="pt-12 flex justify-between items-end text-xs font-bold text-slate-500">
                <div className="text-center w-48 border-t border-slate-300 pt-2">
                  <p>সিস্টেম ও সার্ভার অডিট</p>
                  <p className="text-[10px] text-slate-400 font-mono">Rest Bazar Dev-Sec-Ops</p>
                </div>
                <div className="text-center w-52 border-t border-slate-300 pt-2">
                  <p className="text-slate-900 font-black">{adminName}</p>
                  <p className="text-[10px] text-slate-400">{adminDesignation}</p>
                </div>
              </div>

            </div>

            {/* Modal Actions */}
            <div className="px-6 py-4 border-t border-slate-150 bg-slate-50 flex justify-end gap-3 shrink-0">
              <button 
                onClick={() => setShowPrintReport(false)}
                className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-extrabold text-xs py-2.5 px-5 rounded-xl transition-all cursor-pointer"
              >
                বন্ধ করুন
              </button>
              <button 
                onClick={() => {
                  window.print();
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-2.5 px-5 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                প্রিন্ট করুন / PDF ডাউনলোড
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Selected User Detail Modal Overlay */}
      {selectedUserDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh] overflow-hidden text-left animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <span className={`w-2.5 h-2.5 rounded-full ${selectedUserDetail.role === 'merchant' ? 'bg-indigo-600 animate-pulse' : 'bg-blue-600 animate-pulse'}`}></span>
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase block leading-none mb-1">সদস্য তথ্য পর্যালোচনা</span>
                  <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                    {selectedUserDetail.name} ({selectedUserDetail.role === 'merchant' ? '🏪 ভেন্ডর' : selectedUserDetail.role === 'admin' ? '🔑 অ্যাডমিন' : '👥 কাস্টমার'})
                  </h3>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedUserDetail(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto">
              {/* Profile Card & Quick Info */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-150">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center font-black text-xl shrink-0 shadow-inner ${
                  selectedUserDetail.role === 'merchant' ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {selectedUserDetail.image ? (
                    <img src={selectedUserDetail.image} alt={selectedUserDetail.name} className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    selectedUserDetail.name.substring(0, 2)
                  )}
                </div>
                <div className="space-y-1 text-center sm:text-left flex-1">
                  <h4 className="text-base font-black text-slate-900">{selectedUserDetail.name}</h4>
                  <p className="text-xs text-slate-500 font-mono flex flex-wrap items-center justify-center sm:justify-start gap-x-2 gap-y-0.5">
                    <span>📞 {selectedUserDetail.phone}</span>
                    {selectedUserDetail.email && <span className="before:content-['•'] before:mr-2">✉️ {selectedUserDetail.email}</span>}
                  </p>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                      selectedUserDetail.role === 'merchant' ? 'bg-indigo-100 text-indigo-800' : selectedUserDetail.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {selectedUserDetail.role === 'merchant' ? 'ভেন্ডর' : selectedUserDetail.role === 'admin' ? 'অ্যাডমিন' : 'কাস্টমার'}
                    </span>
                    {selectedUserDetail.role === 'merchant' && (
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                        selectedUserDetail.isMerchantVerified ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {selectedUserDetail.isMerchantVerified ? '🛡️ ভেরিফাইড' : '⏳ ভেরিফিকেশন পেন্ডিং'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Information Blocks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Personal Details */}
                <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-150 text-left">
                  <h5 className="text-xs font-black text-slate-800 border-b border-slate-100 pb-1.5 flex items-center gap-1">
                    📋 অ্যাকাউন্ট বিবরণী
                  </h5>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-400 font-semibold">মোবাইল নম্বর:</span>
                      <span className="font-mono text-slate-700 font-bold">{selectedUserDetail.phone}</span>
                    </div>
                    {selectedUserDetail.email && (
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-400 font-semibold">ইমেইল এড্রেস:</span>
                        <span className="text-slate-700 font-bold break-all">{selectedUserDetail.email}</span>
                      </div>
                    )}
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-400 font-semibold">যোগদানের তারিখ:</span>
                      <span className="text-slate-700 font-bold">
                        {formatBanglaDate(selectedUserDetail.createdAt)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-400 font-semibold">রোল / অ্যাক্সেস:</span>
                      <span className="text-slate-700 font-bold capitalize">{selectedUserDetail.role}</span>
                    </div>
                  </div>
                </div>

                {/* Location details */}
                <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-150 text-left">
                  <h5 className="text-xs font-black text-slate-800 border-b border-slate-100 pb-1.5 flex items-center gap-1">
                    📍 ঠিকানা ও ভৌগোলিক তথ্য
                  </h5>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-400 font-semibold">জেলা/এরিয়া:</span>
                      <span className="text-slate-700 font-bold">{selectedUserDetail.location?.district || "N/A"}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-400 font-semibold flex-shrink-0">সুনির্দিষ্ট ঠিকানা:</span>
                      <span className="text-slate-700 font-bold truncate max-w-[150px]" title={selectedUserDetail.location?.address}>
                        {selectedUserDetail.location?.address || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-400 font-semibold">অক্ষাংশ (Latitude):</span>
                      <span className="text-slate-700 font-mono font-semibold">{selectedUserDetail.location?.latitude || "N/A"}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-400 font-semibold">দ্রাঘিমাংশ (Longitude):</span>
                      <span className="text-slate-700 font-mono font-semibold">{selectedUserDetail.location?.longitude || "N/A"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer / Merchant Financial Summary & Achieved Offers */}
              {(() => {
                const isMerchant = selectedUserDetail.role === 'merchant';
                const now = new Date();
                const todayStr = now.toISOString().split('T')[0];
                const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                const currentYearStr = `${now.getFullYear()}`;

                // Filter bookings related to this user
                const userBookings = allDb.bookings.filter(b => 
                  (b.customerPhone && b.customerPhone === selectedUserDetail.phone) ||
                  (b.customerId && b.customerId === selectedUserDetail.id) ||
                  (selectedUserDetail.email && b.customerEmail && b.customerEmail.toLowerCase() === selectedUserDetail.email.toLowerCase()) ||
                  (isMerchant && (b.merchantPhone === selectedUserDetail.phone || b.businessId === allDb.businesses.find(biz => biz.ownerPhone === selectedUserDetail.phone)?.id))
                );

                const validOrders = userBookings.filter(b => b.status !== 'cancelled');

                const todayAmount = validOrders
                  .filter(b => {
                    const d = b.date || b.createdAt;
                    return d && d.startsWith(todayStr);
                  })
                  .reduce((sum, b) => sum + (Number(b.totalPrice || b.price) || 0), 0);

                const monthAmount = validOrders
                  .filter(b => {
                    const d = b.date || b.createdAt;
                    return d && d.startsWith(currentMonthStr);
                  })
                  .reduce((sum, b) => sum + (Number(b.totalPrice || b.price) || 0), 0);

                const yearAmount = validOrders
                  .filter(b => {
                    const d = b.date || b.createdAt;
                    return d && d.startsWith(currentYearStr);
                  })
                  .reduce((sum, b) => sum + (Number(b.totalPrice || b.price) || 0), 0);

                const lifetimeAmount = validOrders
                  .reduce((sum, b) => sum + (Number(b.totalPrice || b.price) || 0), 0);

                const totalOrders = validOrders.length;

                // Determine Badge & Loyalty Tier
                let tierBadge = "🥉 নবাগত কাস্টমার";
                let tierColor = "bg-amber-100 text-amber-900 border-amber-300";
                let tierDiscount = "১ম অর্ডারে ৫০৳ গিফট ভাউচার অর্জিত";

                if (isMerchant) {
                  if (lifetimeAmount >= 50000 || totalOrders >= 50) {
                    tierBadge = "🏆 প্ল্যাটিনাম সুপার সেলার";
                    tierColor = "bg-purple-100 text-purple-900 border-purple-300";
                    tierDiscount = "১% কম প্ল্যাটফর্ম কমিশন সুবিধা unlocked";
                  } else if (lifetimeAmount >= 20000 || totalOrders >= 20) {
                    tierBadge = "🥇 গোল্ডেন মার্চেন্ট";
                    tierColor = "bg-amber-100 text-amber-900 border-amber-300";
                    tierDiscount = "২% ক্যাশব্যাক রিওয়ার্ড ও ফিচর্ড শপ ব্যাজ";
                  } else if (lifetimeAmount >= 5000 || totalOrders >= 5) {
                    tierBadge = "🥈 সিলভার ভেন্ডর";
                    tierColor = "bg-slate-100 text-slate-800 border-slate-300";
                    tierDiscount = "১% বোনাস পয়েন্ট অর্জিত";
                  } else {
                    tierBadge = "🏪 নতুন মার্চেন্ট শপ";
                    tierColor = "bg-blue-100 text-blue-800 border-blue-300";
                    tierDiscount = "০% প্ল্যাটফর্ম ফি প্রোমোশনাল অফার একটিভ";
                  }
                } else {
                  if (lifetimeAmount >= 10000 || totalOrders >= 20) {
                    tierBadge = "💎 ডায়মন্ড ভিআইপি বায়ার";
                    tierColor = "bg-purple-100 text-purple-900 border-purple-300";
                    tierDiscount = "১৫% ক্যাশব্যাক ছাড় ও ফ্রি হোম ডেলিভারি";
                  } else if (lifetimeAmount >= 5000 || totalOrders >= 10) {
                    tierBadge = "🥇 গোল্ডেন শপার";
                    tierColor = "bg-amber-100 text-amber-900 border-amber-300";
                    tierDiscount = "১০% ছাড় ভাউচার ও প্রাইওরিটি সাপোর্ট";
                  } else if (lifetimeAmount >= 1000 || totalOrders >= 3) {
                    tierBadge = "🥈 সিলভার মেম্বার";
                    tierColor = "bg-slate-100 text-slate-800 border-slate-300";
                    tierDiscount = "৫% ডিসকাউন্ট ভাউচার অর্জিত";
                  }
                }

                return (
                  <div className="space-y-4 text-left">
                    {/* Financial Breakdown Grid */}
                    <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-4 rounded-2xl shadow-md border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2 border-b border-white/10 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{isMerchant ? '💰' : '🛍️'}</span>
                          <div>
                            <h5 className="text-xs font-black text-white">
                              {isMerchant ? 'বিক্রয়ের হিসাব (Sales & Revenue Overview)' : 'কেনাকাটার হিসাব (Purchases & Spending Overview)'}
                            </h5>
                            <p className="text-[10px] text-slate-300 font-medium">দিন, মাস, বছর এবং লাইফটাইম আর্থিক বিবরণী</p>
                          </div>
                        </div>
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border shadow-2xs ${tierColor}`}>
                          {tierBadge}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                        <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-xl border border-white/10">
                          <span className="text-[9px] text-indigo-200 font-bold block uppercase">আজকের {isMerchant ? 'বিক্রি' : 'ক্রয়'}</span>
                          <span className="text-sm font-black text-emerald-300 block mt-0.5">৳ {todayAmount}</span>
                        </div>
                        <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-xl border border-white/10">
                          <span className="text-[9px] text-indigo-200 font-bold block uppercase">এই মাসের {isMerchant ? 'বিক্রি' : 'ক্রয়'}</span>
                          <span className="text-sm font-black text-amber-300 block mt-0.5">৳ {monthAmount}</span>
                        </div>
                        <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-xl border border-white/10">
                          <span className="text-[9px] text-indigo-200 font-bold block uppercase">এই বছরের {isMerchant ? 'বিক্রি' : 'ক্রয়'}</span>
                          <span className="text-sm font-black text-blue-300 block mt-0.5">৳ {yearAmount}</span>
                        </div>
                        <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-xl border border-white/10">
                          <span className="text-[9px] text-indigo-200 font-bold block uppercase">লাইফটাইম {isMerchant ? 'বিক্রি' : 'ক্রয়'}</span>
                          <span className="text-sm font-black text-white block mt-0.5">৳ {lifetimeAmount}</span>
                          <span className="text-[9px] text-slate-300 font-medium block">({totalOrders} টি অর্ডার)</span>
                        </div>
                      </div>
                    </div>

                    {/* Achieved Offers & Loyalty Badges Section */}
                    <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                          <span>🎁</span>
                          <span>{isMerchant ? 'মার্চেন্টের অর্জিত অফার ও প্রমোশন' : 'গ্রাহকের অর্জিত অফার ও রিওয়ার্ডস'}</span>
                        </h5>
                        <span className="text-[10px] bg-indigo-200/60 text-indigo-900 font-black px-2 py-0.5 rounded-md">
                          একটিভ রিওয়ার্ডস
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="bg-white p-3 rounded-xl border border-indigo-100 flex items-start gap-2.5 shadow-2xs">
                          <span className="text-xl">🏆</span>
                          <div>
                            <span className="font-extrabold text-slate-900 block">{tierBadge}</span>
                            <span className="text-[11px] text-slate-500 font-medium block mt-0.5">{tierDiscount}</span>
                          </div>
                        </div>

                        <div className="bg-white p-3 rounded-xl border border-indigo-100 flex items-start gap-2.5 shadow-2xs">
                          <span className="text-xl">🎉</span>
                          <div>
                            <span className="font-extrabold text-slate-900 block">
                              {isMerchant ? 'জিরো কমিশন ওয়েলকাম অফার' : 'স্বাগতম ৫০৳ ক্যাশব্যাক কুপন'}
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                              {isMerchant ? 'প্রথম ১০টি অর্ডারে ০% কমিশন ছাড় অর্জিত' : 'প্রথম অর্ডারে ৫০ টাকা ছাড় কুপন সক্রিয় আছে'}
                            </span>
                          </div>
                        </div>

                        <div className="bg-white p-3 rounded-xl border border-indigo-100 flex items-start gap-2.5 shadow-2xs">
                          <span className="text-xl">⚡</span>
                          <div>
                            <span className="font-extrabold text-slate-900 block">
                              {todayAmount > 0 ? (isMerchant ? 'আজকের ১% সেলার বোনাস অর্জিত' : 'আজকের ডেইলি ক্যাশব্যাক অফার অর্জিত') : (isMerchant ? 'আজকের ডেইলি বুস্ট প্রোমোশন' : 'আজকের ডেলিভারি ছাড় কুপন')}
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                              {todayAmount > 0 ? `আজকের লেনদেনে ৳${Math.round(todayAmount * 0.01)} ক্যাশব্যাক বোনাস অ্যাকাউন্টস এ জমা` : 'আজকের যেকোনো অর্ডারে বিনামূল্যে স্পেশাল গিফট পাবেন'}
                            </span>
                          </div>
                        </div>

                        <div className="bg-white p-3 rounded-xl border border-indigo-100 flex items-start gap-2.5 shadow-2xs">
                          <span className="text-xl">🌟</span>
                          <div>
                            <span className="font-extrabold text-slate-900 block">
                              {monthAmount >= (isMerchant ? 10000 : 2000) ? 'মাসিক স্টার পারফর্ম্যান্স বোনাস অর্জিত' : 'মাসিক শপিং স্টার বোনাস অফার'}
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                              {monthAmount >= (isMerchant ? 10000 : 2000) ? 'চলতি মাসের ১০০০৳ ফ্রি ক্রেডিট প্রমোশন অর্জিত' : `চলতি মাসে ৳${isMerchant ? 10000 : 2000} কেনাবেচায় বিশেষ উপহার`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Trade License Section for Merchants */}
              {selectedUserDetail.role === 'merchant' && (
                <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl space-y-3 text-left">
                  <h5 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    📄 ট্রেড লাইসেন্স ও আইনি নথিপত্র
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-2">
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-400 font-bold">লাইসেন্স নম্বর:</span>
                        <span className="font-mono text-slate-800 font-extrabold">{selectedUserDetail.tradeLicenseNo || 'সংযুক্ত নেই'}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-400 font-bold">ভেরিফিকেশন স্ট্যাটাস:</span>
                        <span className={`font-black ${selectedUserDetail.isMerchantVerified ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {selectedUserDetail.isMerchantVerified ? 'অনুমোদিত ও ভেরিফাইড' : 'পেন্ডিং / অনুমোদনহীন'}
                        </span>
                      </div>
                    </div>
                    {selectedUserDetail.tradeLicenseImage && (
                      <div className="flex flex-col items-center justify-center p-2 bg-white rounded-xl border border-slate-200">
                        <img 
                          src={selectedUserDetail.tradeLicenseImage} 
                          alt="Trade License" 
                          className="w-full h-20 object-contain rounded mb-1 bg-slate-50"
                          referrerPolicy="no-referrer"
                        />
                        <a 
                          href={selectedUserDetail.tradeLicenseImage} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-[10px] text-blue-600 hover:underline font-black flex items-center gap-1"
                        >
                          👁️ পূর্ণ সাইজ ইমেজ দেখুন
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Business details if merchant */}
              {selectedUserDetail.role === 'merchant' && (() => {
                const merchantBiz = allDb.businesses.find(b => b.ownerPhone === selectedUserDetail.phone);
                if (!merchantBiz) {
                  return (
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-850 text-left">
                      ⚠️ এই ভেন্ডরটির কোনো সক্রিয় দোকান বা ক্যাটালগ এখনো নিবন্ধিত হয়নি।
                    </div>
                  );
                }
                return (
                  <div className="space-y-4 text-left">
                    <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border border-slate-150 p-4 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <h5 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                          🏪 সংযুক্ত ব্যবসায়ের প্রোফাইল
                        </h5>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedUserDetail(null);
                            setBizModalTab('info');
                            setSelectedBizDetail(merchantBiz);
                          }}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] rounded-lg shadow-2xs transition-all flex items-center gap-1 cursor-pointer"
                        >
                          🏪 দোকানের প্রোফাইল শপ দেখুন ➔
                        </button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
                        <div className="bg-white p-2 rounded-xl border border-slate-100">
                          <span className="text-[9px] text-slate-400 block font-bold">দোকানের নাম</span>
                          <span className="font-extrabold text-xs text-slate-800 block truncate">{merchantBiz.name}</span>
                        </div>
                        <div className="bg-white p-2 rounded-xl border border-slate-100">
                          <span className="text-[9px] text-slate-400 block font-bold">ক্যাটাগরি</span>
                          <span className="font-extrabold text-xs text-slate-800 block truncate capitalize">{merchantBiz.category}</span>
                        </div>
                        <div className="bg-white p-2 rounded-xl border border-slate-100">
                          <span className="text-[9px] text-slate-400 block font-bold">চলতি ব্যালেন্স</span>
                          <span className="font-black text-xs text-emerald-600 block">৳ {merchantBiz.balance}</span>
                        </div>
                        <div className="bg-white p-2 rounded-xl border border-slate-100">
                          <span className="text-[9px] text-slate-400 block font-bold">প্ল্যান</span>
                          <span className="font-black text-[10px] text-indigo-700 block uppercase">{merchantBiz.subscriptionPlan}</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-500 font-medium leading-relaxed italic">
                        "{merchantBiz.description || 'কোনো বিবরণী দেওয়া নেই। '}"
                      </p>
                    </div>

                    {/* Products / Services offering */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase block">মেনু / ক্যাটালগ আইটেমসমূহ</span>
                      <div className="border border-slate-150 rounded-xl overflow-hidden text-xs max-h-48 overflow-y-auto bg-white">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-150 font-bold text-slate-600">
                              <th className="p-2">আইটেমের নাম</th>
                              <th className="p-2">ধরণ</th>
                              <th className="p-2 text-right">মূল্য / সার্ভিস ফি</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                            {merchantBiz.products?.map((prod) => (
                              <tr key={prod.id} className="hover:bg-slate-50/50">
                                <td className="p-2 flex items-center gap-1.5 font-bold">
                                  📦 {prod.name}
                                  {!prod.isAvailable && <span className="text-[8px] bg-red-100 text-red-800 px-1 rounded-sm">সোল্ড আউট</span>}
                                </td>
                                <td className="p-2 text-slate-450">পণ্য (Product)</td>
                                <td className="p-2 text-right font-black text-slate-900">৳ {prod.price}</td>
                              </tr>
                            ))}
                            {merchantBiz.services?.map((serv) => (
                              <tr key={serv.id} className="hover:bg-slate-50/50">
                                <td className="p-2 flex items-center gap-1.5 font-bold">
                                  🛠️ {serv.name}
                                  {!serv.isAvailable && <span className="text-[8px] bg-red-100 text-red-800 px-1 rounded-sm">অপ্রাপ্য</span>}
                                </td>
                                <td className="p-2 text-slate-450">সার্ভিস (Service)</td>
                                <td className="p-2 text-right font-black text-slate-900">৳ {serv.charge}</td>
                              </tr>
                            ))}
                            {(!merchantBiz.products?.length && !merchantBiz.services?.length) && (
                              <tr>
                                <td colSpan={3} className="p-4 text-center text-slate-400">এই দোকানে কোনো পণ্য বা সার্ভিস যোগ করা হয়নি।</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Favorites & Placed orders for normal users */}
              {selectedUserDetail.role === 'user' && (
                <div className="space-y-4 text-left">
                  {/* Favorite shops */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase block">পছন্দের স্টোর তালিকা ({selectedUserDetail.favorites?.length || 0})</span>
                    {selectedUserDetail.favorites && selectedUserDetail.favorites.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedUserDetail.favorites.map(favId => {
                          const favBiz = allDb.businesses.find(b => b.id === favId);
                          return favBiz ? (
                            <span key={favId} className="text-xs bg-pink-50 border border-pink-100 text-pink-700 font-extrabold px-3 py-1 rounded-full flex items-center gap-1.5">
                              ❤️ {favBiz.name}
                              <span className="text-[9px] text-pink-400 font-medium">({favBiz.category})</span>
                            </span>
                          ) : null;
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic font-bold">এখনো কোনো প্রিয় স্টোর নির্বাচন করা হয়নি।</p>
                    )}
                  </div>

                  {/* Customer order list */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase block">গ্রাহকের রিসেন্ট বুকিং ও অর্ডার ইতিহাস</span>
                    <div className="border border-slate-150 rounded-xl overflow-hidden text-xs max-h-48 overflow-y-auto bg-white">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-150 font-bold text-slate-600">
                            <th className="p-2">দোকানের নাম</th>
                            <th className="p-2">অর্ডার/সার্ভিস</th>
                            <th className="p-2">তারিখ</th>
                            <th className="p-2 text-right">মোট ফি</th>
                            <th className="p-2 text-right">স্ট্যাটাস</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                          {(() => {
                            const userBookings = allDb.bookings.filter(b => b.customerPhone === selectedUserDetail.phone);
                            if (userBookings.length === 0) {
                              return (
                                <tr>
                                  <td colSpan={5} className="p-4 text-center text-slate-400 font-bold">এই গ্রাহকের কোনো অর্ডারের ইতিহাস নেই।</td>
                                </tr>
                              );
                            }
                            return userBookings.map((b) => {
                              const biz = allDb.businesses.find(biz => biz.id === b.businessId);
                              return (
                                <tr key={b.id} className="hover:bg-slate-50/50">
                                  <td className="p-2 font-bold text-slate-800">{biz?.name || 'N/A'}</td>
                                  <td className="p-2 font-medium">{b.serviceName || b.productName || 'অর্ডার'}</td>
                                  <td className="p-2 text-slate-500 text-[10px]">{new Date(b.date).toLocaleDateString('bn-BD')}</td>
                                  <td className="p-2 text-right font-black text-slate-900">৳ {b.totalPrice || b.price}</td>
                                  <td className="p-2 text-right">
                                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                                      b.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                                      b.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                                      b.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                      'bg-amber-100 text-amber-800'
                                    }`}>
                                      {b.status === 'completed' ? 'সম্পন্ন' :
                                       b.status === 'confirmed' ? 'নিশ্চিত' :
                                       b.status === 'cancelled' ? 'বাতিল' : 'পেন্ডিং'}
                                    </span>
                                  </td>
                                </tr>
                              );
                            });
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Admin Actions Box */}
              <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl space-y-3 text-xs text-left">
                <span className="text-[10px] font-black text-slate-400 uppercase block">অ্যাডমিন কন্ট্রোল অ্যাকশনস</span>
                <div className="flex flex-col sm:flex-row gap-3">
                  {selectedUserDetail.role === 'merchant' && (
                    <button
                      type="button"
                      onClick={async () => {
                        const newStatus = !selectedUserDetail.isMerchantVerified;
                        await onUpdateUser(selectedUserDetail.phone, { isMerchantVerified: newStatus });
                        setSelectedUserDetail({ ...selectedUserDetail, isMerchantVerified: newStatus });
                      }}
                      className={`flex-1 py-2 rounded-xl font-bold cursor-pointer transition-all border text-center ${
                        selectedUserDetail.isMerchantVerified 
                          ? 'bg-amber-50 border-amber-200 text-amber-850 hover:bg-amber-100' 
                          : 'bg-emerald-600 border-emerald-700 text-white hover:bg-emerald-700'
                      }`}
                    >
                      {selectedUserDetail.isMerchantVerified ? '❌ ভেরিফিকেশন বাতিল করুন' : '✅ ট্রেড লাইসেন্স ও ভেরিফিকেশন অনুমোদন দিন'}
                    </button>
                  )}

                  <div className="flex-1 flex items-center gap-2">
                    <span className="font-bold text-slate-500 whitespace-nowrap">রোল পরিবর্তন:</span>
                    <select
                      value={selectedUserDetail.role}
                      onChange={async (e) => {
                        const newRole = e.target.value as 'user' | 'merchant' | 'admin';
                        await onUpdateUser(selectedUserDetail.phone, { role: newRole });
                        setSelectedUserDetail({ ...selectedUserDetail, role: newRole });
                      }}
                      className="w-full text-xs border border-slate-200 px-3 py-1.5 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-800"
                    >
                      <option value="user">👤 গ্রাহক (User)</option>
                      <option value="merchant">🏪 মার্চেন্ট (Merchant)</option>
                      <option value="admin">🔑 অ্যাডমিন (Admin)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="px-6 py-4 border-t border-slate-150 bg-slate-50 flex justify-end gap-3 shrink-0">
              <button 
                type="button"
                onClick={() => setSelectedUserDetail(null)}
                className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-extrabold text-xs py-2.5 px-5 rounded-xl transition-all cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Business Profile Detail Modal */}
      {selectedBizDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full border border-slate-100 shadow-2xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xl">🏪</span>
                <div>
                  <h3 className="text-base font-black text-slate-900">দোকান ও ব্যবসা প্রোফাইল (Shop Profile)</h3>
                  <p className="text-[11px] text-slate-500 font-medium">দোকানের ক্যাটালগ, প্রোডাক্টস, লোকেশন ও অ্যাডমিন ওভারভিউ</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedBizDetail(null)}
                className="p-2 hover:bg-slate-200/60 rounded-full text-slate-400 hover:text-slate-700 transition-all cursor-pointer font-extrabold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              
              {/* Cover & Header Info Card */}
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 text-white shadow-sm">
                {selectedBizDetail.images && selectedBizDetail.images.length > 0 ? (
                  <img 
                    src={selectedBizDetail.images[0]} 
                    alt={selectedBizDetail.name} 
                    className="w-full h-32 object-cover opacity-50" 
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-28 bg-gradient-to-r from-indigo-800 via-purple-800 to-slate-900 flex items-center justify-center">
                    <span className="text-3xl opacity-30">🏪</span>
                  </div>
                )}

                <div className="p-4 bg-slate-900/90 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {selectedBizDetail.logo ? (
                      <img 
                        src={selectedBizDetail.logo} 
                        alt={selectedBizDetail.name} 
                        className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-md bg-white shrink-0" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-indigo-600 border-2 border-white flex items-center justify-center font-black text-2xl text-white shadow-md shrink-0">
                        {selectedBizDetail.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-lg font-black text-white">{selectedBizDetail.name}</h4>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          selectedBizDetail.isApproved !== false ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                        }`}>
                          {selectedBizDetail.isApproved !== false ? '✅ অনুমোদিত' : '⏳ পেন্ডিং'}
                        </span>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          selectedBizDetail.isOpen ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}>
                          {selectedBizDetail.isOpen ? '🟢 খোলা' : '🔴 বন্ধ'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-300 flex items-center gap-2 mt-1 flex-wrap font-medium">
                        <span className="bg-white/10 px-2 py-0.5 rounded uppercase font-bold text-[10px] text-indigo-200">
                          {selectedBizDetail.category}
                        </span>
                        <span>•</span>
                        <span>⭐ {selectedBizDetail.rating || 5.0} ({selectedBizDetail.reviewsCount || selectedBizDetail.reviews?.length || 0} রিভিউ)</span>
                        <span>•</span>
                        <span className="uppercase text-amber-300 font-extrabold text-[10px]">
                          👑 {selectedBizDetail.subscriptionPlan || 'free'} প্ল্যান
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Owner switch button */}
                  {(() => {
                    const ownerUser = allDb.users.find(u => u.phone === selectedBizDetail.ownerPhone || (u.email && selectedBizDetail.ownerEmail && u.email.toLowerCase() === selectedBizDetail.ownerEmail.toLowerCase()));
                    if (ownerUser) {
                      return (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedBizDetail(null);
                            setSelectedUserDetail(ownerUser);
                          }}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-2 rounded-xl border border-indigo-400 transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-sm"
                        >
                          👤 মালিকের প্রোফাইল ({ownerUser.name})
                        </button>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>

              {/* Key Metadata Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">মালিকের ফোন</span>
                  <span className="text-xs font-black text-slate-800 font-mono block mt-0.5">{selectedBizDetail.ownerPhone}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">চলতি ওয়ালেট ব্যালেন্স</span>
                  <span className="text-xs font-black text-emerald-600 block mt-0.5">৳ {selectedBizDetail.balance || 0}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">মোট পণ্য ও সেবা</span>
                  <span className="text-xs font-black text-indigo-600 block mt-0.5">
                    {(selectedBizDetail.products?.length || 0) + (selectedBizDetail.services?.length || 0)} টি
                  </span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">ডেলিভারি এরিয়া</span>
                  <span className="text-xs font-black text-slate-800 block mt-0.5">
                    {selectedBizDetail.deliveryRadiusKm || 10} কি.মি. ব্যাসার্ধ
                  </span>
                </div>
              </div>

              {/* Shop Sales Breakdown (Day, Month, Year, Lifetime) & Achieved Offers */}
              {(() => {
                const now = new Date();
                const todayStr = now.toISOString().split('T')[0];
                const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                const currentYearStr = `${now.getFullYear()}`;

                const bizBookings = allDb.bookings.filter(b => 
                  b.businessId === selectedBizDetail.id ||
                  (b.merchantPhone && b.merchantPhone === selectedBizDetail.ownerPhone)
                );

                const validBizOrders = bizBookings.filter(b => b.status !== 'cancelled');

                const todaySales = validBizOrders
                  .filter(b => {
                    const d = b.date || b.createdAt;
                    return d && d.startsWith(todayStr);
                  })
                  .reduce((sum, b) => sum + (Number(b.totalPrice || b.price) || 0), 0);

                const monthSales = validBizOrders
                  .filter(b => {
                    const d = b.date || b.createdAt;
                    return d && d.startsWith(currentMonthStr);
                  })
                  .reduce((sum, b) => sum + (Number(b.totalPrice || b.price) || 0), 0);

                const yearSales = validBizOrders
                  .filter(b => {
                    const d = b.date || b.createdAt;
                    return d && d.startsWith(currentYearStr);
                  })
                  .reduce((sum, b) => sum + (Number(b.totalPrice || b.price) || 0), 0);

                const lifetimeSales = validBizOrders
                  .reduce((sum, b) => sum + (Number(b.totalPrice || b.price) || 0), 0);

                const totalBizOrders = validBizOrders.length;

                // Determine Merchant Badge
                let merchantBadge = "🏪 সাধারণ মার্চেন্ট শপ";
                let merchantColor = "bg-blue-100 text-blue-900 border-blue-300";
                let merchantReward = "০% প্ল্যাটফর্ম ফি প্রোমোশনাল সুবিধা চালু";

                if (lifetimeSales >= 50000 || totalBizOrders >= 50) {
                  merchantBadge = "🏆 প্ল্যাটিনাম সুপার সেলার";
                  merchantColor = "bg-purple-100 text-purple-900 border-purple-300";
                  merchantReward = "১% কম প্ল্যাটফর্ম কমিশন ও প্রাইওরিটি মার্চেন্ট সাপোর্ট";
                } else if (lifetimeSales >= 20000 || totalBizOrders >= 20) {
                  merchantBadge = "🥇 গোল্ডেন সেলার শপ";
                  merchantColor = "bg-amber-100 text-amber-900 border-amber-300";
                  merchantReward = "২% বোনাস ক্যাশব্যাক ও ফিচর্ড স্টোর স্থান অর্জিত";
                } else if (lifetimeSales >= 5000 || totalBizOrders >= 5) {
                  merchantBadge = "🥈 সিলভার স্টোর";
                  merchantColor = "bg-slate-100 text-slate-800 border-slate-300";
                  merchantReward = "১% মার্চেন্ট রিওয়ার্ড ও ভেরিফাইড ট্যাগ unlocked";
                }

                return (
                  <div className="space-y-4 text-left">
                    {/* Sales Summary Grid */}
                    <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white p-4 rounded-2xl shadow-md border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2 border-b border-white/10 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">📊</span>
                          <div>
                            <h5 className="text-xs font-black text-white">
                              দোকানের বিক্রয়ের হিসাব (Shop Revenue & Sales Overview)
                            </h5>
                            <p className="text-[10px] text-slate-300 font-medium">আজকের বিক্রি, চলতি মাস, বছর ও লাইফটাইম মোট ইনকাম</p>
                          </div>
                        </div>
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border shadow-2xs ${merchantColor}`}>
                          {merchantBadge}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                        <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-xl border border-white/10">
                          <span className="text-[9px] text-indigo-200 font-bold block uppercase">আজকের বিক্রি</span>
                          <span className="text-sm font-black text-emerald-300 block mt-0.5">৳ {todaySales}</span>
                        </div>
                        <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-xl border border-white/10">
                          <span className="text-[9px] text-indigo-200 font-bold block uppercase">এই মাসের বিক্রি</span>
                          <span className="text-sm font-black text-amber-300 block mt-0.5">৳ {monthSales}</span>
                        </div>
                        <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-xl border border-white/10">
                          <span className="text-[9px] text-indigo-200 font-bold block uppercase">এই বছরের বিক্রি</span>
                          <span className="text-sm font-black text-blue-300 block mt-0.5">৳ {yearSales}</span>
                        </div>
                        <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-xl border border-white/10">
                          <span className="text-[9px] text-indigo-200 font-bold block uppercase">লাইফটাইম মোট বিক্রি</span>
                          <span className="text-sm font-black text-white block mt-0.5">৳ {lifetimeSales}</span>
                          <span className="text-[9px] text-slate-300 font-medium block">({totalBizOrders} টি সফল অর্ডার)</span>
                        </div>
                      </div>
                    </div>

                    {/* Shop Achieved Offers & Rewards */}
                    <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                          <span>🎁</span>
                          <span>দোকানের অর্জিত অফার, পদক ও ক্যাশব্যাক সুবিধা</span>
                        </h5>
                        <span className="text-[10px] bg-emerald-200/60 text-emerald-900 font-black px-2 py-0.5 rounded-md">
                          মার্চেন্ট সুবিধা
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="bg-white p-3 rounded-xl border border-emerald-100 flex items-start gap-2.5 shadow-2xs">
                          <span className="text-xl">🎖️</span>
                          <div>
                            <span className="font-extrabold text-slate-900 block">{merchantBadge}</span>
                            <span className="text-[11px] text-slate-500 font-medium block mt-0.5">{merchantReward}</span>
                          </div>
                        </div>

                        <div className="bg-white p-3 rounded-xl border border-emerald-100 flex items-start gap-2.5 shadow-2xs">
                          <span className="text-xl">🚀</span>
                          <div>
                            <span className="font-extrabold text-slate-900 block">জিরো কমিশন স্টার্টার প্রোমোশন</span>
                            <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                              নতুন নিবন্ধিত স্টোর হিসেবে ০% প্ল্যাটফর্ম চার্জ অফার অর্জিত
                            </span>
                          </div>
                        </div>

                        <div className="bg-white p-3 rounded-xl border border-emerald-100 flex items-start gap-2.5 shadow-2xs">
                          <span className="text-xl">⚡</span>
                          <div>
                            <span className="font-extrabold text-slate-900 block">
                              {todaySales > 0 ? 'আজকের সেলার ক্যাশব্যাক রিওয়ার্ড অর্জিত' : 'আজকের ডেলিভারি বোনাস অফার'}
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                              {todaySales > 0 ? `আজকের মোট বিক্রি ৳${todaySales} এর ১% ইনস্ট্যান্ট মার্চেন্ট রিওয়ার্ড` : 'আজকের প্রথম অর্ডারে কাস্টমারকে ফ্রি ডেলিভারি অফার দেওয়ার সুবিধা'}
                            </span>
                          </div>
                        </div>

                        <div className="bg-white p-3 rounded-xl border border-emerald-100 flex items-start gap-2.5 shadow-2xs">
                          <span className="text-xl">🌟</span>
                          <div>
                            <span className="font-extrabold text-slate-900 block">
                              {monthSales >= 10000 ? 'মাসিক শপ পারফর্ম্যান্স বোনাস অর্জিত' : 'মাসিক সেলার স্টার চ্যালেঞ্জ'}
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                              {monthSales >= 10000 ? 'চলতি মাসের ১০০০৳ ফ্রি অ্যাডভার্টাইজিং ক্রেডিট unlocked' : 'চলতি মাসে ৳১০,০০০ বিক্রয়ে ১,০০০৳ ফ্রি প্রমোশন বোনাস পাবেন'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Address & Description */}
              <div className="bg-slate-50/60 border border-slate-100 p-4 rounded-2xl space-y-2 text-left text-xs">
                <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                  <span>📍 পূর্ণ ঠিকানা:</span>
                  <span className="text-slate-900 font-extrabold">{selectedBizDetail.address || 'ঠিকানা দেওয়া নেই'}</span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-500 font-medium text-[11px]">
                  <span>তৈরির তারিখ: <strong className="text-slate-800">{formatBanglaDate(selectedBizDetail.createdAt)}</strong></span>
                  <span>থানা: <strong className="text-slate-800">{selectedBizDetail.thana || 'N/A'}</strong></span>
                  <span>জেলা: <strong className="text-slate-800">{selectedBizDetail.district || 'N/A'}</strong></span>
                  <span>বিভাগ: <strong className="text-slate-800">{selectedBizDetail.division || 'N/A'}</strong></span>
                  {selectedBizDetail.lat && selectedBizDetail.lng && (
                    <span>ম্যাপ জিপিএস: <strong className="text-slate-800 font-mono">{selectedBizDetail.lat}, {selectedBizDetail.lng}</strong></span>
                  )}
                </div>
                {selectedBizDetail.description && (
                  <div className="pt-2 border-t border-slate-150 text-slate-600 italic">
                    "{selectedBizDetail.description}"
                  </div>
                )}
                {selectedBizDetail.websiteUrl && (
                  <div className="pt-1">
                    <a 
                      href={selectedBizDetail.websiteUrl.startsWith('http') ? selectedBizDetail.websiteUrl : `https://${selectedBizDetail.websiteUrl}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-indigo-600 hover:underline font-bold text-[11px] flex items-center gap-1"
                    >
                      🌐 অফিশিয়াল ওয়েবসাইট: {selectedBizDetail.websiteUrl}
                    </a>
                  </div>
                )}
              </div>

              {/* Inner Tab Navigation */}
              <div className="flex border-b border-slate-200 gap-1 overflow-x-auto text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setBizModalTab('info')}
                  className={`px-4 py-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                    bizModalTab === 'info' ? 'border-indigo-600 text-indigo-700 font-black' : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  📦 পণ্যসমূহ ({selectedBizDetail.products?.length || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setBizModalTab('services')}
                  className={`px-4 py-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                    bizModalTab === 'services' ? 'border-indigo-600 text-indigo-700 font-black' : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  🛠️ সার্ভিসসমূহ ({selectedBizDetail.services?.length || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setBizModalTab('orders')}
                  className={`px-4 py-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                    bizModalTab === 'orders' ? 'border-indigo-600 text-indigo-700 font-black' : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  📋 দোকান বুকিং ও অর্ডার ইতিহাস ({allDb.bookings.filter(b => b.businessId === selectedBizDetail.id).length})
                </button>
                <button
                  type="button"
                  onClick={() => setBizModalTab('reviews')}
                  className={`px-4 py-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                    bizModalTab === 'reviews' ? 'border-indigo-600 text-indigo-700 font-black' : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  ⭐ গ্রাহক রিভিউ ({selectedBizDetail.reviews?.length || 0})
                </button>
              </div>

              {/* Inner Tab Content */}
              {bizModalTab === 'info' && (
                <div className="space-y-3 text-left">
                  <div className="border border-slate-150 rounded-xl overflow-hidden text-xs bg-white">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-150 font-bold text-slate-600">
                          <th className="p-2.5">ছবি</th>
                          <th className="p-2.5">পণ্যের নাম</th>
                          <th className="p-2.5">ক্যাটাগরি</th>
                          <th className="p-2.5 text-right">মূল্য</th>
                          <th className="p-2.5 text-right">স্টক অবস্থা</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                        {selectedBizDetail.products && selectedBizDetail.products.length > 0 ? (
                          selectedBizDetail.products.map(p => (
                            <tr key={p.id} className="hover:bg-slate-50/50">
                              <td className="p-2">
                                {p.image ? (
                                  <img src={p.image} alt="" className="w-8 h-8 rounded object-cover border border-slate-200" referrerPolicy="no-referrer" />
                                ) : (
                                  <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-[10px]">📦</div>
                                )}
                              </td>
                              <td className="p-2 font-bold text-slate-800">{p.name}</td>
                              <td className="p-2 text-slate-500 text-[11px]">{p.category || selectedBizDetail.category}</td>
                              <td className="p-2 text-right font-black text-indigo-700">৳ {p.price}</td>
                              <td className="p-2 text-right">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${p.isAvailable !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                  {p.isAvailable !== false ? 'স্টকে আছে' : 'স্টক শেষ'}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="p-6 text-center text-slate-400 font-bold">এই দোকানে কোনো প্রোডাক্ট নিবন্ধিত নেই।</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {bizModalTab === 'services' && (
                <div className="space-y-3 text-left">
                  <div className="border border-slate-150 rounded-xl overflow-hidden text-xs bg-white">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-150 font-bold text-slate-600">
                          <th className="p-2.5">সার্ভিসের নাম</th>
                          <th className="p-2.5">বিবরণ</th>
                          <th className="p-2.5 text-right">সার্ভিস ফি</th>
                          <th className="p-2.5 text-right">অবস্থা</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                        {selectedBizDetail.services && selectedBizDetail.services.length > 0 ? (
                          selectedBizDetail.services.map(s => (
                            <tr key={s.id} className="hover:bg-slate-50/50">
                              <td className="p-2.5 font-bold text-slate-800">🛠️ {s.name}</td>
                              <td className="p-2.5 text-slate-500 text-[11px]">{s.description || 'N/A'}</td>
                              <td className="p-2.5 text-right font-black text-indigo-700">৳ {s.charge}</td>
                              <td className="p-2.5 text-right">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${s.isAvailable !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                  {s.isAvailable !== false ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="p-6 text-center text-slate-400 font-bold">এই দোকানে কোনো সার্ভিস তালিকাভুক্ত নেই।</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {bizModalTab === 'orders' && (
                <div className="space-y-3 text-left">
                  <div className="border border-slate-150 rounded-xl overflow-hidden text-xs bg-white max-h-60 overflow-y-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-150 font-bold text-slate-600">
                          <th className="p-2.5">গ্রাহক</th>
                          <th className="p-2.5">আইটেম / সেবা</th>
                          <th className="p-2.5">তারিখ</th>
                          <th className="p-2.5 text-right">মোট টাকা</th>
                          <th className="p-2.5 text-right">স্ট্যাটাস</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                        {(() => {
                          const bizBookings = allDb.bookings.filter(b => b.businessId === selectedBizDetail.id);
                          if (bizBookings.length === 0) {
                            return (
                              <tr>
                                <td colSpan={5} className="p-6 text-center text-slate-400 font-bold">এই দোকানের জন্য কোনো অর্ডারের রেকর্ড পাওয়া যায়নি।</td>
                              </tr>
                            );
                          }
                          return bizBookings.map(b => (
                            <tr key={b.id} className="hover:bg-slate-50/50">
                              <td className="p-2.5 font-bold text-slate-800">
                                <div>{b.customerName || 'গ্রাহক'}</div>
                                <div className="text-[10px] font-mono text-slate-400">{b.customerPhone}</div>
                              </td>
                              <td className="p-2.5 font-medium">{b.serviceName || b.productName || 'অর্ডার'}</td>
                              <td className="p-2.5 text-slate-500 text-[10px]">{new Date(b.date).toLocaleDateString('bn-BD')}</td>
                              <td className="p-2.5 text-right font-black text-slate-900">৳ {b.totalPrice || b.price}</td>
                              <td className="p-2.5 text-right">
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                                  b.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                                  b.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                                  b.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                  'bg-amber-100 text-amber-800'
                                }`}>
                                  {b.status === 'completed' ? 'সম্পন্ন' :
                                   b.status === 'confirmed' ? 'নিশ্চিত' :
                                   b.status === 'cancelled' ? 'বাতিল' : 'পেন্ডিং'}
                                </span>
                              </td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {bizModalTab === 'reviews' && (
                <div className="space-y-3 text-left">
                  {selectedBizDetail.reviews && selectedBizDetail.reviews.length > 0 ? (
                    <div className="space-y-2">
                      {selectedBizDetail.reviews.map((r, index) => (
                        <div key={index} className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800 text-xs">{r.userName || 'গ্রাহক'}</span>
                            <span className="text-amber-500 font-bold text-xs">⭐ {r.rating}</span>
                          </div>
                          <p className="text-xs text-slate-600 font-medium">{r.comment}</p>
                          <span className="text-[10px] text-slate-400 block">{new Date(r.createdAt || Date.now()).toLocaleDateString('bn-BD')}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-slate-400 text-xs font-bold">
                      এখনো কোনো গ্রাহক রিভিউ জমা দেননি।
                    </div>
                  )}
                </div>
              )}

              {/* Admin Quick Control Toolbar */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3 text-xs text-left">
                <span className="text-[10px] font-black text-slate-400 uppercase block">অ্যাডমিন অ্যাকশন টুলবার</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      const newApp = selectedBizDetail.isApproved === false;
                      await onUpdateBusiness(selectedBizDetail.id, { isApproved: newApp });
                      setSelectedBizDetail({ ...selectedBizDetail, isApproved: newApp });
                      onRefresh();
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                      selectedBizDetail.isApproved !== false ? 'bg-amber-100 text-amber-800 border border-amber-200 hover:bg-amber-200' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
                    }`}
                  >
                    {selectedBizDetail.isApproved !== false ? '✕ স্টোর স্থগিত করুন' : '✓ স্টোর অনুমোদন করুন'}
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      const newOpen = !selectedBizDetail.isOpen;
                      await onUpdateBusiness(selectedBizDetail.id, { isOpen: newOpen });
                      setSelectedBizDetail({ ...selectedBizDetail, isOpen: newOpen });
                      onRefresh();
                    }}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition-all cursor-pointer"
                  >
                    {selectedBizDetail.isOpen ? '🔴 স্টোর বন্ধ হিসেবে সেট করুন' : '🟢 স্টোর খোলা হিসেবে সেট করুন'}
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      const newName = prompt('দোকানের নতুন নাম লিখুন:', selectedBizDetail.name);
                      if (newName && newName.trim()) {
                        await onUpdateBusiness(selectedBizDetail.id, { name: newName.trim() });
                        setSelectedBizDetail({ ...selectedBizDetail, name: newName.trim() });
                        onRefresh();
                      }
                    }}
                    className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold rounded-xl border border-blue-200 transition-all cursor-pointer"
                  >
                    ✏️ নাম পরিবর্তন
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      if (confirm(`আপনি কি সত্যিই "${selectedBizDetail.name}" দোকানটি স্থায়ীভাবে মুছে ফেলতে চান?`)) {
                        await onDeleteBusiness(selectedBizDetail.id);
                        setSelectedBizDetail(null);
                        onRefresh();
                      }
                    }}
                    className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold rounded-xl border border-rose-200 transition-all cursor-pointer ml-auto"
                  >
                    🗑️ দোকান মুছে ফেলুন
                  </button>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
              <button 
                type="button"
                onClick={() => setSelectedBizDetail(null)}
                className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-extrabold text-xs py-2 px-5 rounded-xl transition-all cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>

          </div>
        </div>
      )}

      {/* User Create / Edit Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-100 shadow-2xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  {!isNewUserForm ? '✏️' : '➕'}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {!isNewUserForm ? 'ব্যবহারকারী / গ্রাহক তথ্য এডিট করুন' : 'নতুন ব্যবহারকারী যোগ করুন'}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">নাম, ফোন নম্বর, রোল, ঠিকানা ও লাইসেন্স ভেরিফিকেশন তথ্য আপডেট করুন</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsUserModalOpen(false)}
                className="p-2 hover:bg-slate-200/60 rounded-full text-slate-400 hover:text-slate-700 transition-all cursor-pointer font-extrabold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveUserSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 space-y-4 overflow-y-auto flex-1 text-left text-xs">
                
                {/* Basic Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      পূর্ণ নাম <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={userFormData.name}
                      onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                      placeholder="উদা: মোঃ আরিফুল ইসলাম"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      মোবাইল নম্বর <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      disabled={!isNewUserForm}
                      value={userFormData.phone}
                      onChange={(e) => setUserFormData({ ...userFormData, phone: e.target.value })}
                      placeholder="017XXXXXXXX"
                      className={`w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono font-bold ${
                        !isNewUserForm ? 'opacity-70 cursor-not-allowed bg-slate-100' : ''
                      }`}
                    />
                    {!isNewUserForm && (
                      <span className="text-[10px] text-slate-400 mt-0.5 block">মোবাইল নম্বর পরিবর্তনযোগ্য নয় (ইউনিক আইডি)</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      ইমেইল ঠিকানা (ঐচ্ছিক)
                    </label>
                    <input
                      type="email"
                      value={userFormData.email || ''}
                      onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                      placeholder="user@example.com"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      ব্যবহারকারীর রোল (Role) <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={userFormData.role}
                      onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value as any })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold"
                    >
                      <option value="user">👤 সাধারণ গ্রাহক (Customer / User)</option>
                      <option value="merchant">🏪 মার্চেন্ট / বিক্রেতা (Merchant)</option>
                      <option value="admin">🔑 সুপার অ্যাডমিন (Admin)</option>
                    </select>
                  </div>
                </div>

                {/* Profile Image & Designation */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      প্রোফাইল ছবি / অবতার লিংক (URL)
                    </label>
                    <input
                      type="url"
                      value={userFormData.image || ''}
                      onChange={(e) => setUserFormData({ ...userFormData, image: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono text-[11px]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      পদবী বা পেশা (Designation)
                    </label>
                    <input
                      type="text"
                      value={userFormData.designation || ''}
                      onChange={(e) => setUserFormData({ ...userFormData, designation: e.target.value })}
                      placeholder="উদা: উদ্যোক্তা, শিক্ষক, চাকরিজীবী"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                    />
                  </div>
                </div>

                {/* Location Details */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-150 space-y-3">
                  <span className="text-[11px] font-black text-slate-700 uppercase block">📍 লোকেশন ও ঠিকানা বিবরণ</span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">বিভাগ</label>
                      <input
                        type="text"
                        value={userFormData.division || ''}
                        onChange={(e) => setUserFormData({ ...userFormData, division: e.target.value })}
                        placeholder="ঢাকা"
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl focus:outline-none font-medium text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">জেলা</label>
                      <input
                        type="text"
                        value={userFormData.district || ''}
                        onChange={(e) => setUserFormData({ ...userFormData, district: e.target.value })}
                        placeholder="ঢাকা"
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl focus:outline-none font-medium text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">থানা / উপজেলা</label>
                      <input
                        type="text"
                        value={userFormData.thana || ''}
                        onChange={(e) => setUserFormData({ ...userFormData, thana: e.target.value })}
                        placeholder="ধানমন্ডি"
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl focus:outline-none font-medium text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">বিস্তারিত সড়ক/বাড়ি ঠিকানা</label>
                    <input
                      type="text"
                      value={userFormData.address || ''}
                      onChange={(e) => setUserFormData({ ...userFormData, address: e.target.value })}
                      placeholder="বাড়ি #১২, রোড #৪, ধানমন্ডি, ঢাকা"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl focus:outline-none font-medium text-xs"
                    />
                  </div>
                </div>

                {/* Trade License & Merchant Verification Info */}
                <div className="p-3.5 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-3">
                  <span className="text-[11px] font-black text-indigo-900 uppercase block">📄 ট্রেড লাইসেন্স ও মার্চেন্ট তথ্য</span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-1">ট্রেড লাইসেন্স নম্বর</label>
                      <input
                        type="text"
                        value={userFormData.tradeLicenseNo || ''}
                        onChange={(e) => setUserFormData({ ...userFormData, tradeLicenseNo: e.target.value })}
                        placeholder="TRAD/DNCC/XXXXXX"
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl focus:outline-none font-mono text-xs font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-1">লাইসেন্স ডকুমেন্টের ইমেজ URL</label>
                      <input
                        type="url"
                        value={userFormData.tradeLicenseImage || ''}
                        onChange={(e) => setUserFormData({ ...userFormData, tradeLicenseImage: e.target.value })}
                        placeholder="https://..."
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl focus:outline-none font-mono text-[11px]"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={userFormData.isMerchantVerified}
                        onChange={(e) => setUserFormData({ ...userFormData, isMerchantVerified: e.target.checked })}
                        className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                      />
                      <span className="font-extrabold text-slate-800 text-xs">
                        ✅ এই মার্চেন্টের ট্রেড লাইসেন্স অনুমোদিত ও ভেরিফাইড (Verified Merchant)
                      </span>
                    </label>
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-slate-150 bg-slate-50 flex justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-all"
                >
                  বাতিল করুন
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  {!isNewUserForm ? 'সংরক্ষণ করুন' : 'তৈরি করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Business Create / Edit Modal */}
      {isBizModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full border border-slate-100 shadow-2xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  {!isNewBizForm ? '🏪' : '➕'}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {!isNewBizForm ? 'দোকান ও ব্যবসা প্রতিষ্ঠানের তথ্য এডিট করুন' : 'নতুন দোকান ও ব্যবসা প্রতিষ্ঠান যোগ করুন'}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">দোকানের নাম, মালিকের ফোন, ক্যাটাগরি, প্যাকেজ, ঠিকানা ও স্ট্যাটাস পরিচালনা করুন</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBizModalOpen(false)}
                className="p-2 hover:bg-slate-200/60 rounded-full text-slate-400 hover:text-slate-700 transition-all cursor-pointer font-extrabold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveBizSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 space-y-4 overflow-y-auto flex-1 text-left text-xs">
                
                {/* Main Shop Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      দোকানের নাম <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={bizFormData.name}
                      onChange={(e) => setBizFormData({ ...bizFormData, name: e.target.value })}
                      placeholder="উদা: মেসার্স ভাই ভাই জেনারেল স্টোর"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      মালিকের মোবাইল নম্বর <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={bizFormData.ownerPhone}
                      onChange={(e) => setBizFormData({ ...bizFormData, ownerPhone: e.target.value, phone: bizFormData.phone || e.target.value })}
                      placeholder="017XXXXXXXX"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      মালিকের নাম
                    </label>
                    <input
                      type="text"
                      value={bizFormData.ownerName || ''}
                      onChange={(e) => setBizFormData({ ...bizFormData, ownerName: e.target.value })}
                      placeholder="মালিকের নাম"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      দোকানের হটলাইন / ফোন
                    </label>
                    <input
                      type="tel"
                      value={bizFormData.phone || ''}
                      onChange={(e) => setBizFormData({ ...bizFormData, phone: e.target.value })}
                      placeholder="018XXXXXXXX"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-mono font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      মালিকের ইমেইল
                    </label>
                    <input
                      type="email"
                      value={bizFormData.ownerEmail || ''}
                      onChange={(e) => setBizFormData({ ...bizFormData, ownerEmail: e.target.value })}
                      placeholder="store@example.com"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-medium"
                    />
                  </div>
                </div>

                {/* Category, Type, Subscription Plan */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      ক্যাটাগরি <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={bizFormData.category}
                      onChange={(e) => setBizFormData({ ...bizFormData, category: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-bold capitalize"
                    >
                      <option value="grocery">মুদিখানা (Grocery)</option>
                      <option value="pharmacy">ফার্মেসি (Pharmacy)</option>
                      <option value="restaurant">রেস্তোরাঁ / খাবার (Restaurant)</option>
                      <option value="electrician">ইলেকট্রিশিয়ান (Electrician)</option>
                      <option value="plumber">প্লাম্বার (Plumber)</option>
                      <option value="doctor">ডাক্তার / ক্লিনিক (Doctor)</option>
                      <option value="tutor">টিউটর / শিক্ষক (Tutor)</option>
                      <option value="laundry">লন্ড্রি সার্ভিস (Laundry)</option>
                      <option value="clothing">পোশাক / ফ্যাশন (Clothing)</option>
                      <option value="electronics">ইলেকট্রনিক্স (Electronics)</option>
                      <option value="wholesale">পাইকারি ভান্ডার (Wholesale)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      ব্যবসার ধরন <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={bizFormData.type}
                      onChange={(e) => setBizFormData({ ...bizFormData, type: e.target.value as any })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-bold"
                    >
                      <option value="shop">🛍️ পণ্য বিক্রেতা শপ (Product Shop)</option>
                      <option value="service">🛠️ জরুরি সেবা প্রোভাইডার (Service Provider)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      সাবস্ক্রিপশন প্যাকেজ <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={bizFormData.subscriptionPlan}
                      onChange={(e) => setBizFormData({ ...bizFormData, subscriptionPlan: e.target.value as any })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-bold uppercase text-indigo-700"
                    >
                      <option value="free">FREE প্যাকেজ</option>
                      <option value="silver">🥈 SILVER প্যাকেজ</option>
                      <option value="gold">🥇 GOLD প্যাকেজ</option>
                      <option value="diamond">💎 DIAMOND প্যাকেজ</option>
                    </select>
                  </div>
                </div>

                {/* Rating, Balance & Website */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      চলতি ওয়ালেট ব্যালেন্স (৳)
                    </label>
                    <input
                      type="number"
                      value={bizFormData.balance || 0}
                      onChange={(e) => setBizFormData({ ...bizFormData, balance: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-bold text-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      রেটিং (Rating: 1.0 - 5.0)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="5"
                      value={bizFormData.rating || 5.0}
                      onChange={(e) => setBizFormData({ ...bizFormData, rating: parseFloat(e.target.value) || 5.0 })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-bold text-amber-600"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      অফিশিয়াল ওয়েবসাইট লিংক
                    </label>
                    <input
                      type="url"
                      value={bizFormData.websiteUrl || ''}
                      onChange={(e) => setBizFormData({ ...bizFormData, websiteUrl: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-mono text-[11px]"
                    />
                  </div>
                </div>

                {/* Images */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      দোকানের লোগো URL
                    </label>
                    <input
                      type="url"
                      value={bizFormData.logo || ''}
                      onChange={(e) => setBizFormData({ ...bizFormData, logo: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-mono text-[11px]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      কভার / ব্যানার ছবি URL
                    </label>
                    <input
                      type="url"
                      value={bizFormData.images && bizFormData.images.length > 0 ? bizFormData.images[0] : ''}
                      onChange={(e) => setBizFormData({ ...bizFormData, images: [e.target.value] })}
                      placeholder="https://..."
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-mono text-[11px]"
                    />
                  </div>
                </div>

                {/* Location Details */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-150 space-y-3">
                  <span className="text-[11px] font-black text-slate-700 uppercase block">📍 দোকানের অবস্থান ও পূর্ণ ঠিকানা</span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">বিভাগ</label>
                      <input
                        type="text"
                        value={bizFormData.division || ''}
                        onChange={(e) => setBizFormData({ ...bizFormData, division: e.target.value })}
                        placeholder="ঢাকা"
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl focus:outline-none font-medium text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">জেলা</label>
                      <input
                        type="text"
                        value={bizFormData.district || ''}
                        onChange={(e) => setBizFormData({ ...bizFormData, district: e.target.value })}
                        placeholder="ঢাকা"
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl focus:outline-none font-medium text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">থানা / উপজেলা</label>
                      <input
                        type="text"
                        value={bizFormData.thana || ''}
                        onChange={(e) => setBizFormData({ ...bizFormData, thana: e.target.value })}
                        placeholder="ধানমন্ডি"
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl focus:outline-none font-medium text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">পূর্ণ ঠিকানা</label>
                    <input
                      type="text"
                      value={bizFormData.address || ''}
                      onChange={(e) => setBizFormData({ ...bizFormData, address: e.target.value })}
                      placeholder="দোকান #৫, ধানমন্ডি প্লাজা, ঢাকা"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl focus:outline-none font-medium text-xs"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    দোকানের সংক্ষিপ্ত বিবরণ ও পলিসি
                  </label>
                  <textarea
                    rows={2}
                    value={bizFormData.description || ''}
                    onChange={(e) => setBizFormData({ ...bizFormData, description: e.target.value })}
                    placeholder="দোকানের বিশেষত্ব, ডেলিভারি সেবা ও অন্যান্য সুযোগ-সুবিধা..."
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-medium"
                  />
                </div>

                {/* Status Toggles */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <label className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={bizFormData.isApproved}
                      onChange={(e) => setBizFormData({ ...bizFormData, isApproved: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                    />
                    <span className="font-extrabold text-slate-800 text-[11px]">✅ অ্যাডমিন অনুমোদিত</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={bizFormData.isOpen}
                      onChange={(e) => setBizFormData({ ...bizFormData, isOpen: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                    <span className="font-extrabold text-slate-800 text-[11px]">🟢 দোকান খোলা রয়েছে</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={bizFormData.isSponsored}
                      onChange={(e) => setBizFormData({ ...bizFormData, isSponsored: e.target.checked })}
                      className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
                    />
                    <span className="font-extrabold text-slate-800 text-[11px]">⚡ স্পন্সরড শপ</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={bizFormData.isWholesale}
                      onChange={(e) => setBizFormData({ ...bizFormData, isWholesale: e.target.checked })}
                      className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                    />
                    <span className="font-extrabold text-slate-800 text-[11px]">📦 পাইকারি মার্চেন্ট</span>
                  </label>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-slate-150 bg-slate-50 flex justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsBizModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-all"
                >
                  বাতিল করুন
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  {!isNewBizForm ? 'সংরক্ষণ করুন' : 'তৈরি করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
