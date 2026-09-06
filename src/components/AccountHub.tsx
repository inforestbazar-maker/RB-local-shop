import React, { useState } from 'react';
import { 
  User, 
  Location, 
  UserRole, 
  SavedAddress, 
  UserCoupon, 
  DeliveryJob, 
  Booking, 
  Business 
} from '../types';
import { 
  BANGLADESH_LOCATIONS, 
  normalizeDivisionName, 
  normalizeDistrictName, 
  normalizeThanaName, 
  getDistrictsForDivision, 
  getThanasForDistrict, 
  getDistrictCoordinates 
} from '../data/bangladeshLocations';
import PhotoCaptureUpload from './PhotoCaptureUpload';
import { BangladeshiPaymentGatewayModal, PaymentGatewayDetails } from './BangladeshiPaymentGatewayModal';
import { 
  User as UserIcon, 
  CreditCard, 
  MapPin, 
  Tag, 
  Gift, 
  Truck, 
  ShieldCheck, 
  RefreshCw, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Coins, 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  Phone, 
  Mail, 
  Lock, 
  ExternalLink,
  Store,
  Compass,
  AlertCircle,
  Share2,
  Bike,
  Eye,
  EyeOff,
  QrCode,
  Printer,
  Send,
  Smartphone,
  Sparkles,
  Edit3,
  Filter,
  Search,
  Percent,
  X
} from 'lucide-react';
import { WalletTransaction } from '../types';

interface AccountHubProps {
  currentUser: User;
  onUpdateUser: (updatedData: Partial<User>) => Promise<void>;
  onSwitchRole?: (role: UserRole) => void;
  myMerchantBusiness?: Business | null;
  myBookings?: Booking[];
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
  language?: 'bn' | 'en';
  systemConfig?: any;
}

export function AccountHub({
  currentUser,
  onUpdateUser,
  onSwitchRole: _onSwitchRole,
  myMerchantBusiness,
  myBookings = [],
  setActiveTab,
  onLogout,
  onDeleteAccount,
  language = 'bn',
  systemConfig
}: AccountHubProps) {
  const isBn = language === 'bn';

  // Active Sub-Tab within Account Hub
  const [activeSection, setActiveSection] = useState<
    'profile' | 'wallet' | 'addresses' | 'coupons' | 'referral' | 'rider' | 'security'
  >('profile');

  // Profile Edit State
  const [name, setName] = useState(currentUser.name || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [email, setEmail] = useState(currentUser.email || '');
  const [image, setImage] = useState(currentUser.image || '');
  const [division, setDivision] = useState(currentUser.location?.division || 'Dhaka (ঢাকা)');
  const [district, setDistrict] = useState(currentUser.location?.district || 'ঢাকা (Dhaka)');
  const [thana, setThana] = useState(currentUser.location?.thana || 'ধানমন্ডি (Dhanmondi)');
  const [address, setAddress] = useState(currentUser.location?.address || '');
  const [lat, setLat] = useState(currentUser.location?.lat || 23.8103);
  const [lng, setLng] = useState(currentUser.location?.lng || 90.4125);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Password / Security State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordErr, setPasswordErr] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);

  // Digital Wallet State
  const [walletBalance, setWalletBalance] = useState<number>(currentUser.walletBalance ?? 350);
  const [rewardPoints, setRewardPoints] = useState<number>(currentUser.rewardPoints ?? 120);
  const [showHideBalance, setShowHideBalance] = useState<boolean>(true);
  const [isAddMoneyOpen, setIsAddMoneyOpen] = useState(false);
  const [addAmount, setAddAmount] = useState<number>(500);
  const [paymentMethod, setPaymentMethod] = useState<'bkash' | 'nagad' | 'rocket' | 'card'>('bkash');
  
  // Payment Gateway Modal State for Add Money
  const [isAddGatewayOpen, setIsAddGatewayOpen] = useState<boolean>(false);
  const [gatewayMethod, setGatewayMethod] = useState<'bkash' | 'nagad' | 'rocket'>('bkash');
  const [gatewayAmount, setGatewayAmount] = useState<number>(500);

  // Send Money State
  const [isSendMoneyOpen, setIsSendMoneyOpen] = useState(false);
  const [sendMoneyMode, setSendMoneyMode] = useState<'wallet_to_wallet' | 'wallet_to_mfs'>('wallet_to_wallet');
  const [sendMfsProvider, setSendMfsProvider] = useState<'bkash' | 'nagad' | 'rocket'>('bkash');
  const [sendPhone, setSendPhone] = useState('');
  const [sendAmount, setSendAmount] = useState<number>(100);
  const [sendNote, setSendNote] = useState<string>('');
  const [isSendingMoney, setIsSendingMoney] = useState<boolean>(false);

  // Digital Receipt & Filter State
  const [txFilter, setTxFilter] = useState<'all' | 'credit' | 'debit'>('all');
  const [receiptTx, setReceiptTx] = useState<any | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState<boolean>(false);
  const [copiedTrxId, setCopiedTrxId] = useState<string | null>(null);

  const [walletTransactions, setWalletTransactions] = useState<Array<{
    id: string;
    trxId?: string;
    type: 'credit' | 'debit' | string;
    category?: string;
    title: string;
    description?: string;
    amount: number;
    date: string;
    timestamp?: number;
    method?: string;
    channelDetails?: any;
    status?: string;
  }>>(
    currentUser.walletTransactions && currentUser.walletTransactions.length > 0
      ? currentUser.walletTransactions
      : [
          { id: 'tx-1', trxId: 'TX-RB-984321', type: 'credit', title: 'সাইন-আপ ওয়েলকাম বোনাস', amount: 100, date: 'আজ, দুপুর ১২:৩০', method: 'Welcome Bonus', status: 'completed' },
          { id: 'tx-2', trxId: 'TX-BK-873214', type: 'credit', title: 'বিকাশ অ্যাড মানি', amount: 200, date: 'গতকাল, সন্ধ্যা ৭:৪৫', method: 'bKash', status: 'completed' },
          { id: 'tx-3', trxId: 'TX-NG-554129', type: 'credit', title: 'অর্ডার ক্যাশব্যাক বোনাস', amount: 50, date: '৩ দিন আগে', method: 'Cashback', status: 'completed' }
        ]
  );

  // Saved Addresses State
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>(
    currentUser.savedAddresses && currentUser.savedAddresses.length > 0
      ? currentUser.savedAddresses
      : [
          {
            id: 'addr-default',
            title: 'বাসা (Home)',
            recipientName: currentUser.name,
            phone: currentUser.phone,
            division: currentUser.location?.division || 'Dhaka (ঢাকা)',
            district: currentUser.location?.district || 'ঢাকা (Dhaka)',
            thana: currentUser.location?.thana || 'ধানমন্ডি (Dhanmondi)',
            address: currentUser.location?.address || 'ধানমন্ডি, ঢাকা',
            isDefault: true
          }
        ]
  );
  const [isAddAddressOpen, setIsAddAddressOpen] = useState(false);
  const [newAddrTitle, setNewAddrTitle] = useState('বাসা (Home)');
  const [newAddrRecipient, setNewAddrRecipient] = useState(currentUser.name);
  const [newAddrPhone, setNewAddrPhone] = useState(currentUser.phone);
  const [newAddrDiv, setNewAddrDiv] = useState('Dhaka (ঢাকা)');
  const [newAddrDist, setNewAddrDist] = useState('ঢাকা (Dhaka)');
  const [newAddrThana, setNewAddrThana] = useState('ধানমন্ডি (Dhanmondi)');
  const [newAddrDetails, setNewAddrDetails] = useState('');
  const [newAddrDefault, setNewAddrDefault] = useState(false);

  // Coupons State with full Edit, Add & Delete functionality
  const [availableCoupons, setAvailableCoupons] = useState<UserCoupon[]>(
    currentUser.claimedCoupons && currentUser.claimedCoupons.length > 0 && typeof currentUser.claimedCoupons[0] === 'object'
      ? (currentUser.claimedCoupons as UserCoupon[])
      : [
          {
            id: 'cp-welcome50',
            code: 'WELCOME50',
            title: 'নতুন গ্রাহক ৫০৳ ছাড়',
            discountType: 'flat',
            discountValue: 50,
            minSpend: 250,
            expiryDate: '2026-12-31',
            description: 'যেকোনো শপ থেকে প্রথম অর্ডারে ন্যূনতম ২৫০ টাকার কেনাকাটায় সরাসরি ৫০ টাকা ক্যাশ ডিসকাউন্ট।'
          },
          {
            id: 'cp-rest10',
            code: 'REST10',
            title: 'মেগা ১০% ডিসকাউন্ট',
            discountType: 'percentage',
            discountValue: 10,
            minSpend: 500,
            maxDiscount: 200,
            expiryDate: '2026-10-15',
            description: 'যেকোনো সুপার শপ ও গ্রোসারি অর্ডারে সরাসরি ১০% ইনস্ট্যান্ট ছাড়।'
          },
          {
            id: 'cp-freeship',
            code: 'FREESHIP',
            title: 'ফ্রি হোম ডেলিভারি',
            discountType: 'flat',
            discountValue: 60,
            minSpend: 400,
            expiryDate: '2026-11-30',
            description: '৪০০ টাকার বেশি যেকোনো খাবার বা পণ্যের অর্ডারে সম্পূর্ণ ফ্রি হোম ডেলিভারি।'
          },
          {
            id: 'cp-eid2026',
            code: 'EID2026',
            title: 'উৎসবের উপহার ১০০৳ ছাড়',
            discountType: 'flat',
            discountValue: 100,
            minSpend: 1000,
            expiryDate: '2026-12-31',
            description: '১০০০ টাকার গ্রোসারি, পোশাক বা সার্ভিস বুকিংয়ে বিশাল ১০০ টাকা ফ্ল্যাট ছাড়।'
          }
        ]
  );
  const [copiedCouponCode, setCopiedCouponCode] = useState<string | null>(null);
  const [couponSearch, setCouponSearch] = useState('');
  const [couponFilterType, setCouponFilterType] = useState<'all' | 'flat' | 'percentage'>('all');

  // Add / Edit Modal States
  const [isAddCouponOpen, setIsAddCouponOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<UserCoupon | null>(null);
  const [couponFormCode, setCouponFormCode] = useState('');
  const [couponFormTitle, setCouponFormTitle] = useState('');
  const [couponFormDesc, setCouponFormDesc] = useState('');
  const [couponFormType, setCouponFormType] = useState<'flat' | 'percentage'>('flat');
  const [couponFormValue, setCouponFormValue] = useState<number>(50);
  const [couponFormMinSpend, setCouponFormMinSpend] = useState<number>(200);
  const [couponFormMaxDiscount, setCouponFormMaxDiscount] = useState<number>(100);
  const [couponFormExpiry, setCouponFormExpiry] = useState('2026-12-31');

  const handleOpenAddCoupon = () => {
    setEditingCoupon(null);
    setCouponFormCode('');
    setCouponFormTitle('');
    setCouponFormDesc('');
    setCouponFormType('flat');
    setCouponFormValue(50);
    setCouponFormMinSpend(200);
    setCouponFormMaxDiscount(100);
    setCouponFormExpiry('2026-12-31');
    setIsAddCouponOpen(true);
  };

  const handleOpenEditCoupon = (cp: UserCoupon) => {
    setEditingCoupon(cp);
    setCouponFormCode(cp.code);
    setCouponFormTitle(cp.title);
    setCouponFormDesc(cp.description);
    setCouponFormType(cp.discountType);
    setCouponFormValue(cp.discountValue);
    setCouponFormMinSpend(cp.minSpend || 0);
    setCouponFormMaxDiscount(cp.maxDiscount || 0);
    setCouponFormExpiry(cp.expiryDate);
    setIsAddCouponOpen(true);
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponFormCode.trim() || !couponFormTitle.trim() || couponFormValue <= 0) {
      alert('অনুগ্রহ করে সঠিক কুপন কোড, নাম ও ডিসকাউন্ট ভ্যালু প্রদান করুন।');
      return;
    }

    let updatedCoupons: UserCoupon[];
    if (editingCoupon) {
      updatedCoupons = availableCoupons.map((c) =>
        c.id === editingCoupon.id
          ? {
              ...c,
              code: couponFormCode.trim().toUpperCase(),
              title: couponFormTitle.trim(),
              description: couponFormDesc.trim() || `${couponFormType === 'flat' ? `৳${couponFormValue}` : `${couponFormValue}%`} বিশেষ ছাড়!`,
              discountType: couponFormType,
              discountValue: Number(couponFormValue),
              minSpend: Number(couponFormMinSpend),
              maxDiscount: couponFormType === 'percentage' ? Number(couponFormMaxDiscount) : undefined,
              expiryDate: couponFormExpiry
            }
          : c
      );
      alert('কুপন ভাউচারের তথ্য সফলভাবে এডিট ও আপডেট করা হয়েছে!');
    } else {
      const newCoupon: UserCoupon = {
        id: `cp-${Date.now()}`,
        code: couponFormCode.trim().toUpperCase(),
        title: couponFormTitle.trim(),
        description: couponFormDesc.trim() || `${couponFormType === 'flat' ? `৳${couponFormValue}` : `${couponFormValue}%`} বিশেষ ছাড়!`,
        discountType: couponFormType,
        discountValue: Number(couponFormValue),
        minSpend: Number(couponFormMinSpend),
        maxDiscount: couponFormType === 'percentage' ? Number(couponFormMaxDiscount) : undefined,
        expiryDate: couponFormExpiry
      };
      updatedCoupons = [newCoupon, ...availableCoupons];
      alert('নতুন ডিসকাউন্ট কুপন সফলভাবে যোগ করা হয়েছে!');
    }

    setAvailableCoupons(updatedCoupons);
    setIsAddCouponOpen(false);
    setEditingCoupon(null);
    await onUpdateUser({ claimedCoupons: updatedCoupons });
  };

  const handleDeleteCoupon = async (couponId: string) => {
    if (!confirm('আপনি কি নিশ্চিত যে এই কুপন ভাউচারটি ডিলিট করতে চান?')) return;
    const updated = availableCoupons.filter((c) => c.id !== couponId);
    setAvailableCoupons(updated);
    await onUpdateUser({ claimedCoupons: updated });
    alert('কুপন ভাউচারটি সফলভাবে ডিলিট করা হয়েছে!');
  };

  // Referral State
  const referralCode = currentUser.referralCode || `RB-${currentUser.phone.slice(-4)}${Math.floor(Math.random() * 90 + 10)}`;
  const referralLink = `${typeof window !== 'undefined' ? window.location.origin : 'https://restbazar.com'}?ref=${referralCode}`;
  const [isCopiedRef, setIsCopiedRef] = useState(false);

  // Rider Mode State
  const [isRiderOnline, setIsRiderOnline] = useState(currentUser.riderActiveStatus ?? true);
  const [vehicleType, setVehicleType] = useState(currentUser.riderVehicleType || 'motorcycle');
  const [nidNumber, setNidNumber] = useState(currentUser.riderNidNumber || '');
  const [riderJobs, setRiderJobs] = useState<DeliveryJob[]>([
    {
      id: 'del-101',
      bookingId: 'BK-9982',
      businessName: 'আমানত গ্রোসারি ও সুপার শপ',
      businessAddress: 'রোড ৪, ধানমন্ডি, ঢাকা',
      businessPhone: '01711223344',
      customerName: 'তানভীর আহমেদ',
      customerPhone: '01811556677',
      deliveryAddress: 'বাড়ি ১২, রোড ৭, ধানমন্ডি, ঢাকা',
      division: 'Dhaka (ঢাকা)',
      district: 'ঢাকা (Dhaka)',
      thana: 'ধানমন্ডি (Dhanmondi)',
      itemsCount: 4,
      totalOrderPrice: 650,
      deliveryFee: 60,
      paymentType: 'cod',
      status: 'available'
    },
    {
      id: 'del-102',
      bookingId: 'BK-9983',
      businessName: 'মদিনা ফার্মেসি ও হেলথকেয়ার',
      businessAddress: 'মিরপুর ১০ গোলচত্বর, ঢাকা',
      businessPhone: '01911445566',
      customerName: 'সাবিনা ইয়াসমিন',
      customerPhone: '01611889900',
      deliveryAddress: 'ব্লক সি, সেকশন ৬, মিরপুর, ঢাকা',
      division: 'Dhaka (ঢাকা)',
      district: 'ঢাকা (Dhaka)',
      thana: 'মিরপুর (Mirpur)',
      itemsCount: 2,
      totalOrderPrice: 320,
      deliveryFee: 50,
      paymentType: 'paid_online',
      status: 'available'
    }
  ]);
  const [riderTotalEarnings, setRiderTotalEarnings] = useState(currentUser.riderTotalEarnings ?? 840);
  const [riderTotalDeliveries, setRiderTotalDeliveries] = useState(currentUser.riderTotalDeliveries ?? 14);

  // Handle Profile Save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setSaveSuccessMsg('');
    try {
      const updatedData: Partial<User> = {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        image: image || undefined,
        location: {
          address: address.trim() || `${thana}, ${district}`,
          division: normalizeDivisionName(division),
          district: normalizeDistrictName(division, district),
          thana: normalizeThanaName(division, district, thana),
          lat,
          lng
        },
        walletBalance,
        rewardPoints,
        savedAddresses
      };

      await onUpdateUser(updatedData);
      setSaveSuccessMsg('✅ প্রোফাইল তথ্য সফলভাবে আপডেট ও সংরক্ষিত হয়েছে!');
      setTimeout(() => setSaveSuccessMsg(''), 4000);
    } catch (err) {
      console.error(err);
      alert('প্রোফাইল আপডেট করতে সমস্যা হয়েছে।');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg('');
    setPasswordErr('');
    if (newPassword.length < 4) {
      setPasswordErr('কমপক্ষে ৪ অক্ষরের নতুন পাসওয়ার্ড দিন।');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordErr('নতুন পাসওয়ার্ড ও কনফার্ম পাসওয়ার্ড মিলছে না!');
      return;
    }

    setIsChangingPass(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: currentUser.phone,
          email: currentUser.email,
          oldPassword: currentPassword,
          newPassword
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPasswordMsg('🎉 পাসওয়ার্ড সফলভাবে আপডেট করা হয়েছে!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        await onUpdateUser({ password: newPassword });
      } else {
        setPasswordErr(data.error || 'পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে।');
      }
    } catch (err) {
      setPasswordErr('সার্ভার এরর! পুনরায় চেষ্টা করুন।');
    } finally {
      setIsChangingPass(false);
    }
  };

  // Open Bangladeshi MFS Payment Gateway (bKash / Nagad / Rocket) for Add Money
  const handleOpenMfsAddMoney = (method: 'bkash' | 'nagad' | 'rocket', customAmount?: number) => {
    const amt = customAmount !== undefined ? customAmount : addAmount;
    if (amt < 10) {
      alert('ন্যূনতম ১০ টাকা যোগ করুন।');
      return;
    }
    setGatewayMethod(method);
    setGatewayAmount(amt);
    setIsAddMoneyOpen(false);
    setIsAddGatewayOpen(true);
  };

  // Handle Add Money Success from Gateway
  const handleGatewayAddMoneySuccess = async (details: PaymentGatewayDetails) => {
    setIsAddGatewayOpen(false);
    const addedAmount = Number(details.amount);
    const fallbackTrxId = details.trxId || `TX-RB-${Date.now().toString(36).toUpperCase()}`;

    try {
      const response = await fetch('/api/wallet/add-money', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userPhone: currentUser.phone,
          amount: addedAmount,
          method: details.method,
          trxId: fallbackTrxId,
          title: `${details.methodName} অ্যাড মানি`,
          senderNumber: details.accountNumber
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const newBal = data.newBalance;
          setWalletBalance(newBal);
          const updatedTxs = [data.transaction, ...walletTransactions];
          setWalletTransactions(updatedTxs);
          await onUpdateUser({ walletBalance: newBal, walletTransactions: updatedTxs });
          setReceiptTx(data.transaction);
          setIsReceiptOpen(true);
          return;
        }
      }
    } catch (e) {
      console.warn('Backend wallet API unreachable, falling back to state sync:', e);
    }

    // Local Fallback
    const newBal = walletBalance + addedAmount;
    setWalletBalance(newBal);
    const localTx = {
      id: `tx-${Date.now()}`,
      trxId: fallbackTrxId,
      type: 'credit' as const,
      category: 'add_money',
      title: `${details.methodName} অ্যাড মানি`,
      description: `রেস্ট পে ওয়ালেটে ${details.methodName} গেটওয়ে দিয়ে ৳${addedAmount} সফলভাবে যোগ করা হয়েছে।`,
      amount: addedAmount,
      date: 'এইমাত্র',
      timestamp: Date.now(),
      method: details.methodName,
      channelDetails: {
        provider: details.methodName,
        trxId: fallbackTrxId,
        senderPhone: details.accountNumber,
        receiverPhone: currentUser.phone
      },
      status: 'completed'
    };
    const updatedTxs = [localTx, ...walletTransactions];
    setWalletTransactions(updatedTxs);
    await onUpdateUser({ walletBalance: newBal, walletTransactions: updatedTxs });
    setReceiptTx(localTx);
    setIsReceiptOpen(true);
  };

  // Handle Standard Add Money submit button
  const handleConfirmAddMoney = async () => {
    if (addAmount < 10) {
      alert('ন্যূনতম ১০ টাকা যোগ করুন।');
      return;
    }
    if (paymentMethod === 'bkash' || paymentMethod === 'nagad' || paymentMethod === 'rocket') {
      handleOpenMfsAddMoney(paymentMethod, addAmount);
      return;
    }

    // Card or Bank
    const newBal = walletBalance + addAmount;
    setWalletBalance(newBal);
    const generatedTrxId = `TX-CD-${Date.now().toString(36).toUpperCase()}`;
    const newTx = {
      id: `tx-${Date.now()}`,
      trxId: generatedTrxId,
      type: 'credit' as const,
      category: 'add_money',
      title: `${paymentMethod.toUpperCase()} অ্যাড মানি`,
      amount: addAmount,
      date: 'এইমাত্র',
      timestamp: Date.now(),
      method: paymentMethod.toUpperCase(),
      status: 'completed'
    };
    const updatedTxs = [newTx, ...walletTransactions];
    setWalletTransactions(updatedTxs);
    await onUpdateUser({ walletBalance: newBal, walletTransactions: updatedTxs });
    setIsAddMoneyOpen(false);
    setReceiptTx(newTx);
    setIsReceiptOpen(true);
  };

  // Handle Send Money to Friend or MFS
  const handleConfirmSendMoney = async () => {
    const cleanPhone = sendPhone.trim();
    if (!cleanPhone || cleanPhone.length < 11 || !cleanPhone.startsWith('01')) {
      alert('সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)।');
      return;
    }
    if (sendMoneyMode === 'wallet_to_wallet' && cleanPhone === currentUser.phone) {
      alert('নিজের নম্বরে টাকা পাঠানো সম্ভব নয়। অন্যের রেস্ট পে নম্বর দিন।');
      return;
    }
    if (sendAmount < 10) {
      alert('ন্যূনতম ১০ টাকা ট্রান্সফার করতে হবে।');
      return;
    }

    const fee = sendMoneyMode === 'wallet_to_mfs' ? Math.round(sendAmount * 0.015) : 0;
    const totalRequired = sendAmount + fee;

    if (totalRequired > walletBalance) {
      alert(`পর্যাপ্ত ওয়ালেট ব্যালেন্স নেই! আপনার ব্যালেন্স ৳${walletBalance}, প্রয়োজনীয় ৳${totalRequired}`);
      return;
    }

    setIsSendingMoney(true);

    try {
      const res = await fetch('/api/wallet/send-money', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderPhone: currentUser.phone,
          receiverPhone: cleanPhone,
          amount: sendAmount,
          transferType: sendMoneyMode,
          mfsProvider: sendMfsProvider,
          note: sendNote.trim()
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const newBal = data.newBalance;
          setWalletBalance(newBal);
          const updatedTxs = [data.transaction, ...walletTransactions];
          setWalletTransactions(updatedTxs);
          await onUpdateUser({ walletBalance: newBal, walletTransactions: updatedTxs });
          setIsSendMoneyOpen(false);
          setSendPhone('');
          setSendNote('');
          setReceiptTx(data.transaction);
          setIsReceiptOpen(true);
          return;
        } else {
          alert(data.error || 'টাকা পাঠানো ব্যর্থ হয়েছে।');
        }
      }
    } catch (e) {
      console.warn('Backend wallet API unreachable, performing local transaction:', e);
    } finally {
      setIsSendingMoney(false);
    }

    // Local Fallback
    const newBal = walletBalance - totalRequired;
    setWalletBalance(newBal);
    const generatedTrxId = `TX-ST-${Date.now().toString(36).toUpperCase()}`;
    const newTx = {
      id: `tx-${Date.now()}`,
      trxId: generatedTrxId,
      type: 'debit' as const,
      category: sendMoneyMode === 'wallet_to_mfs' ? 'bank_withdrawal' : 'send_money',
      title: sendMoneyMode === 'wallet_to_mfs' 
        ? `${sendMfsProvider.toUpperCase()} ক্যাশ-আউট (${cleanPhone})` 
        : `টাকা পাঠানো (${cleanPhone})`,
      description: sendNote || (sendMoneyMode === 'wallet_to_mfs' ? `রেস্ট পে ওয়ালেট থেকে ${sendMfsProvider.toUpperCase()} অ্যাকাউন্টে ট্রান্সফার` : `রেস্ট পে ওয়ালেট ট্রান্সফার`),
      amount: sendAmount,
      date: 'এইমাত্র',
      timestamp: Date.now(),
      method: sendMoneyMode === 'wallet_to_mfs' ? sendMfsProvider.toUpperCase() : 'Rest Pay Transfer',
      channelDetails: {
        provider: sendMoneyMode === 'wallet_to_mfs' ? sendMfsProvider : 'Rest Pay',
        trxId: generatedTrxId,
        senderPhone: currentUser.phone,
        receiverPhone: cleanPhone,
        note: sendNote,
        fee
      },
      status: 'completed'
    };
    const updatedTxs = [newTx, ...walletTransactions];
    setWalletTransactions(updatedTxs);
    await onUpdateUser({ walletBalance: newBal, walletTransactions: updatedTxs });
    setIsSendMoneyOpen(false);
    setSendPhone('');
    setSendNote('');
    setReceiptTx(newTx);
    setIsReceiptOpen(true);
  };

  const handleCopyTrx = (trxId: string) => {
    navigator.clipboard.writeText(trxId);
    setCopiedTrxId(trxId);
    setTimeout(() => setCopiedTrxId(null), 2500);
  };

  // Handle Points Conversion to Cash
  const handleRedeemPoints = async () => {
    if (rewardPoints < 100) {
      alert('পয়েন্ট কনভার্ট করতে কমপক্ষে ১০০ রিওয়ার্ড কয়েন প্রয়োজন (১০০ কয়েন = ১০ টাকা)।');
      return;
    }
    const cashValue = Math.floor(rewardPoints / 100) * 10;
    const remainingPoints = rewardPoints % 100;
    const newBal = walletBalance + cashValue;

    setWalletBalance(newBal);
    setRewardPoints(remainingPoints);
    const newTx = {
      id: `tx-${Date.now()}`,
      type: 'credit' as const,
      title: 'রিওয়ার্ড পয়েন্ট ক্যাশব্যাক রিডিম',
      amount: cashValue,
      date: 'এইমাত্র',
      method: 'Reward Points'
    };
    setWalletTransactions([newTx, ...walletTransactions]);
    await onUpdateUser({ walletBalance: newBal, rewardPoints: remainingPoints });
    alert(`🎉 অভিনন্দন! আপনার রিওয়ার্ড কয়েন থেকে ৳${cashValue} মূল্যের ক্যাশ ওয়ালেটে যুক্ত হয়েছে!`);
  };

  // Handle Add New Address
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddrDetails.trim()) {
      alert('বিস্তারিত ঠিকানা লিখুন।');
      return;
    }
    const newAddr: SavedAddress = {
      id: `addr-${Date.now()}`,
      title: newAddrTitle,
      recipientName: newAddrRecipient.trim() || currentUser.name,
      phone: newAddrPhone.trim() || currentUser.phone,
      division: normalizeDivisionName(newAddrDiv),
      district: normalizeDistrictName(newAddrDiv, newAddrDist),
      thana: normalizeThanaName(newAddrDiv, newAddrDist, newAddrThana),
      address: newAddrDetails.trim(),
      isDefault: newAddrDefault || savedAddresses.length === 0
    };

    let updatedList = [...savedAddresses];
    if (newAddr.isDefault) {
      updatedList = updatedList.map(a => ({ ...a, isDefault: false }));
    }
    updatedList.push(newAddr);
    setSavedAddresses(updatedList);
    await onUpdateUser({ savedAddresses: updatedList });
    setIsAddAddressOpen(false);
    setNewAddrDetails('');
    alert('📍 নতুন ডেলিভারি ঠিকানা সফলভাবে সংরক্ষণ করা হয়েছে!');
  };

  // Handle Set Default Address
  const handleSetDefaultAddress = async (id: string) => {
    const updated = savedAddresses.map(a => ({
      ...a,
      isDefault: a.id === id
    }));
    setSavedAddresses(updated);
    await onUpdateUser({ savedAddresses: updated });
  };

  // Handle Delete Address
  const handleDeleteAddress = async (id: string) => {
    if (confirm('আপনি কি নিশ্চিতভাবে এই ঠিকানাটি মুছে ফেলতে চান?')) {
      const updated = savedAddresses.filter(a => a.id !== id);
      setSavedAddresses(updated);
      await onUpdateUser({ savedAddresses: updated });
    }
  };

  // Handle Copy Coupon Code
  const handleCopyCoupon = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCouponCode(code);
    setTimeout(() => setCopiedCouponCode(null), 2500);
  };

  // Handle Copy Referral Link
  const handleCopyReferral = () => {
    navigator.clipboard.writeText(referralLink);
    setIsCopiedRef(true);
    setTimeout(() => setIsCopiedRef(false), 2500);
  };

  // Handle Rider Job Accept / Complete
  const handleRiderAction = async (jobId: string, nextStatus: 'accepted' | 'picked_up' | 'delivered') => {
    const targetJob = riderJobs.find(j => j.id === jobId);
    if (!targetJob) return;

    const updatedJobs = riderJobs.map(job => {
      if (job.id === jobId) {
        return {
          ...job,
          status: nextStatus,
          assignedRiderPhone: currentUser.phone,
          assignedRiderName: currentUser.name
        };
      }
      return job;
    });
    setRiderJobs(updatedJobs);

    if (nextStatus === 'delivered') {
      const earned = targetJob.deliveryFee;
      const newTotalEarnings = riderTotalEarnings + earned;
      const newTotalDeliv = riderTotalDeliveries + 1;
      const newBal = walletBalance + earned;

      setRiderTotalEarnings(newTotalEarnings);
      setRiderTotalDeliveries(newTotalDeliv);
      setWalletBalance(newBal);

      setWalletTransactions([
        {
          id: `tx-rider-${Date.now()}`,
          type: 'credit',
          title: `ডেলিভারি ফি আয় (অর্ডার #${targetJob.bookingId})`,
          amount: earned,
          date: 'এইমাত্র',
          method: 'Rider Earning'
        },
        ...walletTransactions
      ]);

      await onUpdateUser({
        riderTotalEarnings: newTotalEarnings,
        riderTotalDeliveries: newTotalDeliv,
        walletBalance: newBal
      });
      alert(`🎉 ডেলিভারি সম্পন্ন! আপনার ওয়ালেটে ৳${earned} ডেলিভারি ফি যোগ হয়েছে!`);
    } else if (nextStatus === 'accepted') {
      alert(`🛵 আপনি অর্ডার #${targetJob.bookingId} ডেলিভারি কাজের জন্য এক্সেপ্ট করেছেন। অনুগ্রহ করে দোকান থেকে পণ্য সংগ্রহ করুন।`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-fadeIn">
      {/* 1. Header Profile Banner & Role Badge Card */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="h-32 sm:h-36 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 relative p-4 sm:p-6 flex flex-col justify-end">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex items-end gap-3.5 translate-y-8 sm:translate-y-10">
              <div className="w-18 h-18 sm:w-22 sm:h-22 rounded-2xl overflow-hidden border-4 border-white shadow-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-2xl shrink-0">
                {image ? (
                  <img src={image} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  name ? name.substring(0, 2).toUpperCase() : 'RB'
                )}
              </div>
              <div className="pb-1 text-white sm:text-slate-900 sm:translate-y-8">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-xl font-black">{name || 'সম্মানিত ব্যবহারকারী'}</h2>
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs ${
                    currentUser.role === 'admin'
                      ? 'bg-rose-500 text-white'
                      : currentUser.role === 'merchant'
                      ? 'bg-amber-500 text-white'
                      : currentUser.role === 'rider'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-indigo-600 text-white'
                  }`}>
                    {currentUser.role === 'admin' ? '🛡️ সুপার অ্যাডমিন' : currentUser.role === 'merchant' ? '🏪 ভেরিফায়েড মার্চেন্ট' : currentUser.role === 'rider' ? '🛵 ডেলিভারি রাইডার' : '🙋‍♂️ গ্রাহক অ্যাকাউন্ট'}
                  </span>
                </div>
                <p className="text-xs text-slate-300 sm:text-slate-500 font-mono mt-0.5 flex items-center gap-2">
                  <span>📱 {phone}</span>
                  {email && <span>• ✉️ {email}</span>}
                </p>
              </div>
            </div>

            {/* Quick Quick Balances in Header */}
            <div className="hidden md:flex items-center gap-3 bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20 text-white text-xs">
              <div className="px-3 py-1 bg-white/20 rounded-xl">
                <span className="text-[10px] text-slate-300 block">ওয়ালেট ব্যালেন্স</span>
                <span className="font-black text-amber-300 text-sm">৳ {walletBalance}</span>
              </div>
              <div className="px-3 py-1 bg-white/20 rounded-xl">
                <span className="text-[10px] text-slate-300 block">রিওয়ার্ড পয়েন্ট</span>
                <span className="font-black text-emerald-300 text-sm">🪙 {rewardPoints}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Sub-Navigation Bar */}
        <div className="pt-12 sm:pt-14 px-4 sm:px-6 pb-4 border-b border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveSection('profile')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeSection === 'profile'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            <span>প্রোফাইল ও লোকেশন</span>
          </button>

          <button
            onClick={() => setActiveSection('wallet')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeSection === 'wallet'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>রেস্ট ওয়ালেট ও কয়েন</span>
            <span className="bg-amber-400 text-slate-900 text-[10px] font-black px-1.5 py-0.2 rounded-full">
              ৳{walletBalance}
            </span>
          </button>

          <button
            onClick={() => setActiveSection('addresses')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeSection === 'addresses'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>ঠিকানা বুক</span>
            <span className="bg-slate-200 text-slate-700 text-[10px] font-black px-1.5 py-0.2 rounded-full">
              {savedAddresses.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSection('coupons')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeSection === 'coupons'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>কুপন ও ভাউচার</span>
            <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
              {availableCoupons.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSection('referral')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeSection === 'referral'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <Gift className="w-4 h-4" />
            <span>রেফার ও আয় (৳৫০)</span>
          </button>

          <button
            onClick={() => setActiveSection('rider')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeSection === 'rider'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>ডেলিভারি রাইডার পোর্টাল</span>
          </button>

          <button
            onClick={() => setActiveSection('security')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeSection === 'security'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>নিরাপত্তা ও পাসওয়ার্ড</span>
          </button>
        </div>
      </div>

      {/* 2. SECTION CONTENT */}

      {/* SECTION A: PROFILE & LOCATION SETTINGS */}
      {activeSection === 'profile' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h3 className="text-base font-black text-slate-900">👤 আপনার প্রোফাইল ও বিস্তারিত ঠিকানা</h3>
              <p className="text-xs text-slate-500 mt-0.5">আপনার নাম, যোগাযোগ ও ডেলিভারি লোকেশন আপডেট করুন।</p>
            </div>
            {saveSuccessMsg && (
              <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-emerald-200 animate-bounce">
                {saveSuccessMsg}
              </span>
            )}
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-6">
            {/* Live Photo Upload Widget */}
            <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80">
              <PhotoCaptureUpload
                currentImage={image}
                onImageChange={setImage}
                label="প্রোফাইল ছবি ও ইনস্ট্যান্ট ক্যামেরা"
                sublabel="মোবাইল বা পিসি ক্যামেরা দিয়ে সরাসরি ছবি তুলুন অথবা গ্যালারি থেকে আপলোড করুন"
                shape="circle"
                placeholderText={name ? name.substring(0, 2).toUpperCase() : 'RB'}
              />
            </div>

            {/* Name, Phone, Email Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">আপনার পুরো নাম</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-900"
                  placeholder="যেমন: মো: আরিফুল ইসলাম"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">মোবাইল নম্বর (লগইন নম্বর)</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold text-slate-900"
                  placeholder="01XXXXXXXXX"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">ইমেইল ঠিকানা (ঐচ্ছিক)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-900"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            {/* Division, District, Thana */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-indigo-50/40 p-4 rounded-2xl border border-indigo-100">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">বিভাগ (Division)</label>
                <select
                  required
                  value={normalizeDivisionName(division)}
                  onChange={(e) => {
                    setDivision(e.target.value);
                    setDistrict('');
                    setThana('');
                  }}
                  className="w-full text-xs bg-white border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-900 cursor-pointer"
                >
                  <option value="">বিভাগ সিলেক্ট করুন</option>
                  {BANGLADESH_LOCATIONS.map((loc, idx) => (
                    <option key={`prof-div-${loc.division}-${idx}`} value={loc.division}>
                      {loc.division}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">জেলা (District)</label>
                <select
                  required
                  value={normalizeDistrictName(division, district)}
                  onChange={(e) => {
                    const dist = e.target.value;
                    setDistrict(dist);
                    setThana('');
                    const coords = getDistrictCoordinates(dist);
                    setLat(coords.lat);
                    setLng(coords.lng);
                  }}
                  disabled={!normalizeDivisionName(division)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-900 disabled:opacity-60 cursor-pointer"
                >
                  <option value="">{normalizeDivisionName(division) ? 'জেলা সিলেক্ট করুন' : 'আগে বিভাগ'}</option>
                  {normalizeDivisionName(division) &&
                    Array.from(new Set(getDistrictsForDivision(normalizeDivisionName(division)).map(d => d.name))).map((dName, idx) => (
                      <option key={`prof-dist-${dName}-${idx}`} value={dName}>
                        {dName}
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">থানা / উপজেলা (Thana)</label>
                <select
                  required
                  value={normalizeThanaName(division, district, thana)}
                  onChange={(e) => setThana(e.target.value)}
                  disabled={!normalizeDistrictName(division, district)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-900 disabled:opacity-60 cursor-pointer"
                >
                  <option value="">{normalizeDistrictName(division, district) ? 'থানা সিলেক্ট করুন' : 'আগে জেলা'}</option>
                  {normalizeDistrictName(division, district) &&
                    Array.from(new Set(getThanasForDistrict(normalizeDivisionName(division), normalizeDistrictName(division, district)))).map((t, idx) => (
                      <option key={`prof-thana-${t}-${idx}`} value={t}>
                        {t}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Detailed Street Address */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">বিস্তারিত ঠিকানা (বাড়ি, রোড, ফ্ল্যাট নং)</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-900"
                placeholder="যেমন: বাড়ি #২৪, রোড #৩, ব্লক #ডি, ধানমন্ডি, ঢাকা"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSavingProfile}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 px-8 rounded-xl text-xs cursor-pointer shadow-lg shadow-indigo-200 transition-all flex items-center gap-2"
              >
                {isSavingProfile ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>💾 প্রোফাইল পরিবর্তন সংরক্ষণ করুন</span>}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SECTION B: DIGITAL WALLET & REWARD POINTS */}
      {activeSection === 'wallet' && (
        <div className="space-y-6">
          {/* Wallet Cards Top Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Cash Balance Card */}
            <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden flex flex-col justify-between border border-indigo-500/20">
              <div className="absolute -right-8 -bottom-8 w-44 h-44 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
              
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shadow-md">
                      <CreditCard className="w-4 h-4 text-amber-300" />
                    </div>
                    <div>
                      <span className="text-xs font-black tracking-wide text-white block">রেস্ট পে ডিজিটাল ওয়ালেট</span>
                      <span className="text-[9px] text-indigo-300 flex items-center gap-1 font-mono">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" /> SSL সিকিউরড MFS গেটওয়ে
                      </span>
                    </div>
                  </div>
                  <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black px-2.5 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    অ্যাক্টিভ ওয়ালেট
                  </span>
                </div>

                <div className="space-y-1 my-3 bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-300 font-medium">বর্তমান উপলব্ধ ব্যালেন্স</span>
                    <button
                      type="button"
                      onClick={() => setShowHideBalance(!showHideBalance)}
                      className="text-xs text-indigo-300 hover:text-white flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-lg transition-all cursor-pointer font-bold"
                    >
                      {showHideBalance ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showHideBalance ? 'ব্যালেন্স লুকান' : 'ব্যালেন্স দেখুন'}</span>
                    </button>
                  </div>
                  <div className="flex items-baseline gap-2 pt-1">
                    <h3 className="text-3xl sm:text-4xl font-black text-amber-300 font-mono tracking-tight">
                      {showHideBalance ? `৳ ${walletBalance.toLocaleString('en-US')}` : '৳ ••••••'}
                    </h3>
                    <span className="text-[11px] text-slate-400 font-bold">BDT</span>
                  </div>
                </div>

                {/* Instant 1-Click MFS Top-up Shortcuts */}
                <div className="pt-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">দ্রুত টাকা যোগ করুন (Quick MFS Top-up):</span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenMfsAddMoney('bkash', 500)}
                      className="py-1.5 px-2 bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 hover:text-pink-200 border border-pink-500/30 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                    >
                      <Smartphone className="w-3 h-3 text-pink-400" />
                      <span>+৳৫০০ বিকাশ</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenMfsAddMoney('nagad', 500)}
                      className="py-1.5 px-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 hover:text-orange-200 border border-orange-500/30 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                    >
                      <Smartphone className="w-3 h-3 text-orange-400" />
                      <span>+৳৫০০ নগদ</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenMfsAddMoney('rocket', 500)}
                      className="py-1.5 px-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 hover:text-purple-200 border border-purple-500/30 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                    >
                      <Smartphone className="w-3 h-3 text-purple-400" />
                      <span>+৳৫০০ রকেট</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-5 mt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddMoneyOpen(true)}
                  className="bg-amber-400 hover:bg-amber-500 text-slate-900 font-black py-3 px-4 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-amber-400/20"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>টাকা যোগ করুন</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsSendMoneyOpen(true)}
                  className="bg-white/15 hover:bg-white/25 text-white font-black py-3 px-4 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-white/25 shadow-sm"
                >
                  <Send className="w-4 h-4" />
                  <span>টাকা পাঠান</span>
                </button>
              </div>
            </div>

            {/* Cashback Reward Points Card */}
            <div className="bg-gradient-to-br from-emerald-900 via-teal-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden flex flex-col justify-between border border-emerald-500/20">
              <div className="absolute -right-8 -bottom-8 w-44 h-44 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center shadow-md">
                      <Coins className="w-4 h-4 text-amber-300" />
                    </div>
                    <div>
                      <span className="text-xs font-black tracking-wide text-white block">ক্যাশব্যাক ও রিওয়ার্ড কয়েন</span>
                      <span className="text-[9px] text-emerald-300 font-mono">প্রতি অর্ডারে ক্যাশব্যাক বোনাস</span>
                    </div>
                  </div>
                  <span className="bg-emerald-400 text-slate-900 text-[10px] font-black px-2.5 py-1 rounded-full">
                    ১০০ কয়েন = ১০৳
                  </span>
                </div>

                <div className="space-y-1 my-3 bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                  <span className="text-xs text-slate-300 font-medium">অর্জিত রিওয়ার্ড পয়েন্ট ব্যালেন্স</span>
                  <div className="flex items-baseline gap-2 pt-1">
                    <h3 className="text-3xl sm:text-4xl font-black text-emerald-300 font-mono tracking-tight">
                      🪙 {rewardPoints.toLocaleString('en-US')}
                    </h3>
                    <span className="text-[11px] text-slate-400 font-bold">Points</span>
                  </div>
                </div>

                <div className="bg-emerald-950/50 p-3 rounded-xl border border-emerald-500/20 text-emerald-200 text-xs flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                  <span>রেস্টবাজারে যেকোনো কেনাকাটায় স্বয়ংক্রিয় পয়েন্ট অর্জন করুন ও ক্যাশে রূপান্তর করুন!</span>
                </div>
              </div>

              <div className="pt-5 mt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={handleRedeemPoints}
                  disabled={rewardPoints < 100}
                  className="w-full bg-emerald-400 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-black py-3 px-4 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-400/20"
                >
                  <Gift className="w-4 h-4" />
                  <span>কয়েন ক্যাশে রূপান্তর করুন (Redeem Cash)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Wallet Transaction History / Passbook */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
              <div>
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600" /> ডিজিটাল ওয়ালেট খতিয়ান (Passbook & Receipts)
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">যেকোনো ট্রানজেকশনে ক্লিক করে ডিজিটাল রসিদ ও TrxID দেখুন</p>
              </div>
              
              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setTxFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    txFilter === 'all' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  সব ({walletTransactions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTxFilter('credit')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    txFilter === 'credit' ? 'bg-emerald-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ক্যাশ-ইন (+)
                </button>
                <button
                  type="button"
                  onClick={() => setTxFilter('debit')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    txFilter === 'debit' ? 'bg-rose-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ক্যাশ-আউট (-)
                </button>
              </div>
            </div>

            {walletTransactions.filter(tx => txFilter === 'all' || tx.type === txFilter).length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Clock className="w-6 h-6" />
                </div>
                <p className="text-xs text-slate-500 font-medium">কোনো লেনদেনের রেকর্ড পাওয়া যায়নি।</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {walletTransactions
                  .filter(tx => txFilter === 'all' || tx.type === txFilter)
                  .map((tx) => (
                    <div 
                      key={tx.id} 
                      onClick={() => {
                        setReceiptTx(tx);
                        setIsReceiptOpen(true);
                      }}
                      className="py-3.5 px-2 hover:bg-indigo-50/40 rounded-2xl transition-all flex items-center justify-between gap-3 cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                          tx.type === 'credit' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                        }`}>
                          {tx.type === 'credit' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{tx.title}</p>
                            {tx.method && (
                              <span className="text-[9px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                                {tx.method}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-slate-400 font-mono">{tx.date}</span>
                            {tx.trxId && (
                              <span className="text-[9px] text-indigo-500 font-mono bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100">
                                {tx.trxId}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0 flex items-center gap-3">
                        <div>
                          <span className={`text-xs font-black font-mono block ${
                            tx.type === 'credit' ? 'text-emerald-600' : 'text-rose-600'
                          }`}>
                            {tx.type === 'credit' ? `+ ৳${tx.amount}` : `- ৳${tx.amount}`}
                          </span>
                          <span className="inline-block text-[9px] bg-emerald-50 text-emerald-700 font-black px-1.5 py-0.2 rounded uppercase">
                            {tx.status === 'pending' ? 'পেন্ডিং' : 'সফল'}
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION C: SAVED ADDRESS BOOK */}
      {activeSection === 'addresses' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h3 className="text-base font-black text-slate-900">📍 সংরক্ষিত ডেলিভারি ঠিকানা সমূহ (Address Book)</h3>
              <p className="text-xs text-slate-500 mt-0.5">অর্ডারের সময় ১-ক্লিকে ডেলিভারি ঠিকানা সিলেক্ট করতে আপনার ঠিকানাগুলো সেভ রাখুন।</p>
            </div>
            <button
              onClick={() => setIsAddAddressOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-indigo-100"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন ঠিকানা যোগ করুন</span>
            </button>
          </div>

          {/* Address Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedAddresses.map((addr) => (
              <div
                key={addr.id}
                className={`p-4 rounded-2xl border transition-all ${
                  addr.isDefault
                    ? 'border-indigo-500 bg-indigo-50/20 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-xs text-slate-900">{addr.title}</span>
                    {addr.isDefault && (
                      <span className="bg-indigo-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full">
                        ডিফল্ট ঠিকানা
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {!addr.isDefault && (
                      <button
                        onClick={() => handleSetDefaultAddress(addr.id)}
                        className="text-[10px] text-indigo-600 font-bold hover:underline cursor-pointer px-2 py-1 bg-indigo-50 rounded-lg"
                      >
                        ডিফল্ট করুন
                      </button>
                    )}
                    {savedAddresses.length > 1 && (
                      <button
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-1 text-xs text-slate-600">
                  <p className="font-bold text-slate-800">👤 প্রাপক: {addr.recipientName} ({addr.phone})</p>
                  <p>📍 {addr.address}</p>
                  <p className="text-[11px] text-slate-500">{addr.thana}, {addr.district}, {addr.division}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION D: COUPONS & DISCOUNT VOUCHERS */}
      {activeSection === 'coupons' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">🎟️</span>
                <h3 className="text-base font-black text-slate-900">স্পেশাল কুপন ও ডিসকাউন্ট ভাউচার</h3>
                <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                  {availableCoupons.length}টি কুপন
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">কেনাকাটার সময় কুপন কোড ব্যবহার করে অতিরিক্ত ছাড় ও ক্যাশব্যাক উপভোগ করুন।</p>
            </div>

            {/* Add New Coupon Button */}
            <button
              type="button"
              onClick={handleOpenAddCoupon}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black py-2 px-4 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-indigo-100 shrink-0 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ নতুন ভাউচার যোগ করুন</span>
            </button>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-200/70">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="কুপন কোড, টাইটেল বা বিবরণ দিয়ে খুঁজুন..."
                value={couponSearch}
                onChange={(e) => setCouponSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold text-slate-800"
              />
              {couponSearch && (
                <button
                  type="button"
                  onClick={() => setCouponSearch('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shrink-0">
              <button
                type="button"
                onClick={() => setCouponFilterType('all')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                  couponFilterType === 'all'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                সব ({availableCoupons.length})
              </button>
              <button
                type="button"
                onClick={() => setCouponFilterType('flat')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                  couponFilterType === 'flat'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ৳ ফ্ল্যাট ছাড়
              </button>
              <button
                type="button"
                onClick={() => setCouponFilterType('percentage')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                  couponFilterType === 'percentage'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                % পার্সেন্টেজ
              </button>
            </div>
          </div>

          {/* Coupons Grid */}
          {availableCoupons
            .filter((cp) => {
              const matchesSearch =
                cp.code.toLowerCase().includes(couponSearch.toLowerCase()) ||
                cp.title.toLowerCase().includes(couponSearch.toLowerCase()) ||
                cp.description.toLowerCase().includes(couponSearch.toLowerCase());
              const matchesFilter =
                couponFilterType === 'all' || cp.discountType === couponFilterType;
              return matchesSearch && matchesFilter;
            }).length === 0 ? (
            <div className="text-center py-12 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200 space-y-3">
              <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto text-xl">
                🎟️
              </div>
              <p className="text-xs font-bold text-slate-500">কোনো কুপন বা ভাউচার পাওয়া যায়নি।</p>
              <button
                type="button"
                onClick={handleOpenAddCoupon}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 px-4 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                + নতুন ভাউচার যোগ করুন
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableCoupons
                .filter((cp) => {
                  const matchesSearch =
                    cp.code.toLowerCase().includes(couponSearch.toLowerCase()) ||
                    cp.title.toLowerCase().includes(couponSearch.toLowerCase()) ||
                    cp.description.toLowerCase().includes(couponSearch.toLowerCase());
                  const matchesFilter =
                    couponFilterType === 'all' || cp.discountType === couponFilterType;
                  return matchesSearch && matchesFilter;
                })
                .map((cp) => (
                  <div
                    key={cp.id}
                    className="border-2 border-dashed border-indigo-200 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/30 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between hover:shadow-md hover:border-indigo-300 transition-all group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="bg-indigo-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                          {cp.discountType === 'flat' ? `৳${cp.discountValue} ফ্ল্যাট ছাড়` : `${cp.discountValue}% ডিসকাউন্ট`}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400 font-mono">মেয়াদ: {cp.expiryDate}</span>
                          
                          {/* Edit & Delete Action Buttons */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditCoupon(cp)}
                            title="কুপন এডিট করুন"
                            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCoupon(cp.id)}
                            title="কুপন ডিলিট করুন"
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h4 className="text-sm font-black text-slate-900 group-hover:text-indigo-700 transition-colors">
                        {cp.title}
                      </h4>
                      <p className="text-xs text-slate-600">{cp.description}</p>
                      
                      {cp.minSpend && cp.minSpend > 0 && (
                        <div className="text-[11px] text-indigo-700 font-bold bg-indigo-50/70 px-2 py-0.5 rounded-md inline-block">
                          ন্যূনতম কেনাকাটা: ৳{cp.minSpend}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 font-mono font-black text-xs text-indigo-700 tracking-wider">
                        {cp.code}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopyCoupon(cp.code)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 px-3.5 rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                        >
                          {copiedCouponCode === cp.code ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>কপি হয়েছে!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>কোড কপি</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* Add / Edit Coupon Modal */}
          {isAddCouponOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
              <div className="bg-white border border-slate-100 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 relative max-h-[92vh] overflow-y-auto animate-scale-up text-left">
                <button
                  type="button"
                  onClick={() => { setIsAddCouponOpen(false); setEditingCoupon(null); }}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold text-lg p-1.5 hover:bg-slate-50 rounded-full transition-all cursor-pointer"
                >
                  ✕
                </button>

                <div className="space-y-1">
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Tag className="w-5 h-5 text-indigo-600" />
                    <span>{editingCoupon ? 'কুপন ভাউচার এডিট করুন' : 'নতুন স্পেশাল কুপন যোগ করুন'}</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    {editingCoupon ? 'কুপনের কোড, ডিসকাউন্ট ও মেয়াদের তথ্য সংশোধন করুন।' : 'কাস্টমারদের জন্য আকর্ষণীয় ছাড় ও ভাউচার তৈরি করুন।'}
                  </p>
                </div>

                <form onSubmit={handleSaveCoupon} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-700 block">কুপন কোড (Coupon Code) *</label>
                      <input
                        type="text"
                        required
                        placeholder="যেমন: EID2026 বা SAVE50"
                        value={couponFormCode}
                        onChange={(e) => setCouponFormCode(e.target.value.toUpperCase())}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono font-bold uppercase text-slate-900"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-700 block">ডিসকাউন্টের ধরন (Type) *</label>
                      <select
                        value={couponFormType}
                        onChange={(e) => setCouponFormType(e.target.value as 'flat' | 'percentage')}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold text-slate-900 cursor-pointer"
                      >
                        <option value="flat">ফ্ল্যাট ক্যাশ ছাড় (৳ Flat)</option>
                        <option value="percentage">শতকরা ছাড় (% Percentage)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-700 block">কুপনের শিরোনাম (Title) *</label>
                    <input
                      type="text"
                      required
                      placeholder="যেমন: নতুন গ্রাহক ৫০৳ ছাড় বা মেগা অফার"
                      value={couponFormTitle}
                      onChange={(e) => setCouponFormTitle(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold text-slate-900"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-700 block">
                        {couponFormType === 'flat' ? 'ডিসকাউন্ট পরিমাণ (৳ Taka) *' : 'ডিসকাউন্ট শতাংশ (% Percent) *'}
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={couponFormValue}
                        onChange={(e) => setCouponFormValue(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold text-slate-900"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-700 block">ন্যূনতম কেনাকাটা (Min Spend ৳)</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="যেমন: 200"
                        value={couponFormMinSpend}
                        onChange={(e) => setCouponFormMinSpend(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-700 block">মেয়াদ শেষ হওয়ার তারিখ (Expiry Date) *</label>
                    <input
                      type="date"
                      required
                      value={couponFormExpiry}
                      onChange={(e) => setCouponFormExpiry(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold text-slate-900 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-700 block">বিস্তারিত বিবরণ (Description)</label>
                    <textarea
                      rows={2}
                      placeholder="অফারটির শর্ত বা বিবরণ লিখুন..."
                      value={couponFormDesc}
                      onChange={(e) => setCouponFormDesc(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold text-slate-900 resize-none"
                    />
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => { setIsAddCouponOpen(false); setEditingCoupon(null); }}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl transition-all cursor-pointer text-center"
                    >
                      বাতিল
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black py-2.5 px-4 rounded-xl transition-all cursor-pointer text-center shadow-md shadow-indigo-100"
                    >
                      {editingCoupon ? '✓ আপডেট সংরক্ষণ করুন' : '✓ কুপন যোগ করুন'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION E: REFERRAL & EARN PROGRAM */}
      {activeSection === 'referral' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 sm:p-8 space-y-6">
          <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white text-center space-y-4 relative overflow-hidden">
            <div className="w-16 h-16 bg-white/10 rounded-2xl mx-auto flex items-center justify-center text-3xl border border-white/20">
              🎁
            </div>
            <div className="space-y-1 max-w-lg mx-auto">
              <h3 className="text-xl sm:text-2xl font-black text-amber-300">বন্ধুদের রেফার করুন এবং প্রতি রেফারেলে আয় করুন ৳৫০!</h3>
              <p className="text-xs text-slate-300">
                আপনার রেফারেল লিংক দিয়ে যেকোনো বন্ধু বা মার্চেন্ট সাইন-আপ করলেই আপনার রেস্ট ওয়ালেটে ইনস্ট্যান্ট ৫০ টাকা ক্যাশ বোনাস যোগ হবে।
              </p>
            </div>

            {/* Referral Code & Copy Box */}
            <div className="max-w-md mx-auto bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20 flex items-center justify-between gap-3">
              <div className="text-left font-mono">
                <span className="text-[10px] text-slate-300 block">আপনার পার্সোনাল রেফার কোড:</span>
                <span className="text-sm font-black text-amber-300">{referralCode}</span>
              </div>
              <button
                onClick={handleCopyReferral}
                className="bg-amber-400 hover:bg-amber-500 text-slate-900 font-black py-2 px-4 rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                {isCopiedRef ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{isCopiedRef ? 'কপি হয়েছে!' : 'লিংক কপি করুন'}</span>
              </button>
            </div>
          </div>

          {/* Referral Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-center">
              <span className="text-xs font-bold text-slate-500 block">মোট রেফারেল সংখ্যা</span>
              <h4 className="text-2xl font-black text-indigo-600 font-mono mt-1">
                {currentUser.referralCount ?? 3} জন
              </h4>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-center">
              <span className="text-xs font-bold text-slate-500 block">মোট রেফারেল বোনাস আয়</span>
              <h4 className="text-2xl font-black text-emerald-600 font-mono mt-1">
                ৳ {(currentUser.totalReferralBonus ?? 150).toLocaleString('en-US')}
              </h4>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-center">
              <span className="text-xs font-bold text-slate-500 block">বোনাস ক্যাশআউট স্ট্যাটাস</span>
              <h4 className="text-sm font-black text-slate-800 mt-2 flex items-center justify-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> সরাসরি ওয়ালেটে ট্রান্সফার
              </h4>
            </div>
          </div>
        </div>
      )}

      {/* SECTION F: DELIVERY RIDER PORTAL */}
      {activeSection === 'rider' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Bike className="w-5 h-5 text-indigo-600" /> রেস্ট বাজার ডেলিভারি পার্টনার পোর্টাল (Rider Hub)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">আপনার এলাকার দোকানগুলোর অর্ডার ডেলিভারি করে প্রতিদিন আয় করুন।</p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-700">ডিউটি স্ট্যাটাস:</span>
              <button
                onClick={() => setIsRiderOnline(!isRiderOnline)}
                className={`px-4 py-1.5 rounded-xl text-xs font-black cursor-pointer transition-all ${
                  isRiderOnline
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-100'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {isRiderOnline ? '🟢 অনলাইন (কাজ গ্রহণ চালু)' : '🔴 অফলাইন (কাজ বন্ধ)'}
              </button>
            </div>
          </div>

          {/* Rider Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
              <span className="text-xs text-indigo-700 font-bold block">মোট ডেলিভারি সম্পন্ন</span>
              <h4 className="text-2xl font-black text-indigo-900 font-mono mt-0.5">{riderTotalDeliveries} টি</h4>
            </div>

            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
              <span className="text-xs text-emerald-700 font-bold block">ডেলিভারি ফি থেকে আয়</span>
              <h4 className="text-2xl font-black text-emerald-900 font-mono mt-0.5">৳ {riderTotalEarnings}</h4>
            </div>

            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
              <span className="text-xs text-amber-700 font-bold block">বর্তমান রেটিং</span>
              <h4 className="text-2xl font-black text-amber-900 font-mono mt-0.5">⭐ ৪.৯ (ভেরিফায়েড)</h4>
            </div>
          </div>

          {/* Available Delivery Tasks */}
          <div className="space-y-4 pt-2">
            <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <span>📦 আপনার এলাকায় নতুন ডেলিভারি টাস্ক ({riderJobs.length} টি)</span>
            </h4>

            <div className="space-y-3">
              {riderJobs.map((job) => (
                <div
                  key={job.id}
                  className="p-4 rounded-2xl border border-slate-200 hover:border-indigo-300 bg-slate-50/50 flex flex-col md:flex-row justify-between gap-4 transition-all"
                >
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-slate-900">অর্ডার #{job.bookingId}</span>
                      <span className="bg-indigo-100 text-indigo-800 text-[10px] font-black px-2 py-0.5 rounded-md">
                        {job.itemsCount} টি পণ্য
                      </span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                        job.paymentType === 'cod' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {job.paymentType === 'cod' ? `ক্যাশ অন ডেলিভারি (৳${job.totalOrderPrice})` : 'অনলাইনে পেইড'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block">🏪 পিকআপ শপ:</span>
                        <p className="font-bold text-slate-800">{job.businessName}</p>
                        <p className="text-[11px] text-slate-500">{job.businessAddress} ({job.businessPhone})</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block">📍 ডেলিভারি ঠিকানা:</span>
                        <p className="font-bold text-slate-800">{job.customerName}</p>
                        <p className="text-[11px] text-slate-500">{job.deliveryAddress} ({job.customerPhone})</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col justify-between items-end gap-3 shrink-0">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-bold">আপনার ডেলিভারি ফি</span>
                      <span className="text-base font-black text-emerald-600 font-mono">৳ {job.deliveryFee}</span>
                    </div>

                    {job.status === 'available' && (
                      <button
                        onClick={() => handleRiderAction(job.id, 'accepted')}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl text-xs cursor-pointer shadow-md transition-all"
                      >
                        🛵 কাজটি এক্সেপ্ট করুন
                      </button>
                    )}

                    {job.status === 'accepted' && (
                      <button
                        onClick={() => handleRiderAction(job.id, 'picked_up')}
                        className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-4 rounded-xl text-xs cursor-pointer shadow-md transition-all"
                      >
                        📦 পণ্য সংগ্রহ হয়েছে (Picked Up)
                      </button>
                    )}

                    {job.status === 'picked_up' && (
                      <button
                        onClick={() => handleRiderAction(job.id, 'delivered')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-xl text-xs cursor-pointer shadow-md transition-all"
                      >
                        ✅ ডেলিভারি সম্পন্ন করুন
                      </button>
                    )}

                    {job.status === 'delivered' && (
                      <span className="bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-xl text-xs">
                        ✓ সম্পন্ন হয়েছে
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION G: SECURITY & PASSWORD */}
      {activeSection === 'security' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 sm:p-8 space-y-6">
          <div className="border-b pb-4">
            <h3 className="text-base font-black text-slate-900">🛡️ পাসওয়ার্ড পরিবর্তন ও অ্যাকাউন্ট নিরাপত্তা</h3>
            <p className="text-xs text-slate-500 mt-0.5">আপনার অ্যাকাউন্টের নিরাপত্তা নিশ্চিত করতে নিয়মিত পাসওয়ার্ড আপডেট করুন।</p>
          </div>

          <form onSubmit={handleChangePassword} className="max-w-md space-y-4">
            {passwordMsg && (
              <div className="p-3 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200">
                {passwordMsg}
              </div>
            )}
            {passwordErr && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs font-bold rounded-xl border border-rose-200">
                {passwordErr}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">বর্তমান পাসওয়ার্ড (Current Password)</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-900"
                placeholder="••••••••"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">নতুন পাসওয়ার্ড (New Password)</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-900"
                placeholder="কমপক্ষে ৪ অক্ষর"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">নতুন পাসওয়ার্ড নিশ্চিত করুন (Confirm)</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-900"
                placeholder="পুনরায় পাসওয়ার্ড লিখুন"
              />
            </div>

            <button
              type="submit"
              disabled={isChangingPass}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 px-6 rounded-xl text-xs transition-all cursor-pointer shadow-md shadow-indigo-100 flex items-center gap-2"
            >
              {isChangingPass ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>🔒 পাসওয়ার্ড পরিবর্তন করুন</span>}
            </button>
          </form>
        </div>
      )}

      {/* 4. LOGOUT & DANGER ACTIONS ROW */}
      <div className="bg-white rounded-3xl border border-slate-100 p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onLogout}
            className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold py-2.5 px-5 rounded-xl text-xs border border-rose-200 cursor-pointer transition-all flex items-center gap-1.5"
          >
            🚪 লগ-আউট (Logout)
          </button>
        </div>

        <button
          onClick={onDeleteAccount}
          className="text-xs text-rose-500 hover:text-rose-700 font-bold hover:underline cursor-pointer"
        >
          🗑️ অ্যাকাউন্ট চিরতরে ডিলিট করুন
        </button>
      </div>

      {/* MODAL: ADD MONEY TO WALLET */}
      {isAddMoneyOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-indigo-600" /> ওয়ালেটে টাকা যোগ করুন (Add Money)
              </h4>
              <button onClick={() => setIsAddMoneyOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold p-1">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">পেমেন্ট গেটওয়ে নির্বাচন করুন</label>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { id: 'bkash', label: 'বিকাশ (bKash)', sub: 'ইনস্ট্যান্ট গেটওয়ে', color: 'border-pink-500 text-pink-700 bg-pink-50/80', ring: 'ring-pink-500' },
                    { id: 'nagad', label: 'নগদ (Nagad)', sub: 'ইনস্ট্যান্ট গেটওয়ে', color: 'border-orange-500 text-orange-700 bg-orange-50/80', ring: 'ring-orange-500' },
                    { id: 'rocket', label: 'রকেট (Rocket)', sub: 'DBBL সিকিউরড', color: 'border-purple-500 text-purple-700 bg-purple-50/80', ring: 'ring-purple-500' },
                    { id: 'card', label: 'কার্ড (Visa/Master)', sub: 'ডেবিট/ক্রেডিট কার্ড', color: 'border-blue-500 text-blue-700 bg-blue-50/80', ring: 'ring-blue-500' }
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={`p-3 text-left rounded-2xl border transition-all cursor-pointer ${
                        paymentMethod === m.id 
                          ? `${m.color} border-2 shadow-sm ring-1 ${m.ring}` 
                          : 'border-slate-200 text-slate-700 bg-slate-50/50 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-xs font-black block">{m.label}</span>
                      <span className="text-[10px] text-slate-500 block">{m.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">টাকার পরিমাণ (৳)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">৳</span>
                  <input
                    type="number"
                    min="10"
                    max="50000"
                    value={addAmount || ''}
                    onChange={(e) => setAddAmount(Number(e.target.value))}
                    className="w-full text-base bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-black text-slate-900"
                    placeholder="টাকার পরিমাণ লিখুন"
                  />
                </div>
              </div>

              {/* Quick Amount Pills */}
              <div className="grid grid-cols-4 gap-2">
                {[100, 200, 500, 1000, 2000, 5000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAddAmount(amt)}
                    className={`py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      addAmount === amt 
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' 
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                    }`}
                  >
                    ৳{amt}
                  </button>
                ))}
              </div>

              <div className="bg-indigo-50/70 p-3 rounded-2xl border border-indigo-100 text-indigo-900 text-xs flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="text-[11px] leading-relaxed">
                  বিকাশ/নগদ/রকেট সিলেক্ট করে নিশ্চিত করুন। স্বয়ংক্রিয় গেটওয়ে দিয়ে ওটিপি বা পিন দিয়ে তাৎক্ষণিক ব্যালেন্স রিচার্জ সম্পন্ন হবে।
                </span>
              </div>

              <button
                type="button"
                onClick={handleConfirmAddMoney}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3.5 rounded-2xl text-xs cursor-pointer shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
              >
                <span>{paymentMethod === 'card' ? 'কার্ড দিয়ে পেমেন্ট করুন' : `${paymentMethod.toUpperCase()} গেটওয়েতে যান`} (৳{addAmount})</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SEND MONEY */}
      {isSendMoneyOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4 text-indigo-600" /> টাকা পাঠান ও ক্যাশ-আউট (Send Money)
              </h4>
              <button onClick={() => setIsSendMoneyOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold p-1">✕</button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setSendMoneyMode('wallet_to_wallet')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                  sendMoneyMode === 'wallet_to_wallet'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📱 রেস্ট পে টু রেস্ট পে
                <span className="block text-[9px] text-emerald-600 font-bold font-mono">০% ফি • ইনস্ট্যান্ট</span>
              </button>
              <button
                type="button"
                onClick={() => setSendMoneyMode('wallet_to_mfs')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                  sendMoneyMode === 'wallet_to_mfs'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                💳 বিকাশ / নগদ / রকেট
                <span className="block text-[9px] text-slate-500 font-bold font-mono">MFS ক্যাশ-আউট</span>
              </button>
            </div>

            <div className="space-y-3.5">
              {/* If MFS Mode: Choose Destination Provider */}
              {sendMoneyMode === 'wallet_to_mfs' && (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">MFS প্রোভাইডার সিলেক্ট করুন</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'bkash', label: 'বিকাশ', color: 'border-pink-500 text-pink-700 bg-pink-50' },
                      { id: 'nagad', label: 'নগদ', color: 'border-orange-500 text-orange-700 bg-orange-50' },
                      { id: 'rocket', label: 'রকেট', color: 'border-purple-500 text-purple-700 bg-purple-50' }
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSendMfsProvider(m.id as any)}
                        className={`py-2 text-xs font-black rounded-xl border text-center transition-all cursor-pointer ${
                          sendMfsProvider === m.id
                            ? `${m.color} border-2 shadow-xs`
                            : 'border-slate-200 text-slate-700 bg-slate-50'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {sendMoneyMode === 'wallet_to_mfs' ? `প্রাপকের ${sendMfsProvider.toUpperCase()} অ্যাকাউন্ট নম্বর` : 'প্রাপকের রেস্ট পে মোবাইল নম্বর'}
                </label>
                <input
                  type="text"
                  placeholder="01XXXXXXXXX"
                  value={sendPhone}
                  onChange={(e) => setSendPhone(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold text-slate-900"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">টাকার পরিমাণ (৳)</label>
                  <span className="text-[11px] text-slate-400 font-mono">উপলব্ধ: ৳{walletBalance}</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">৳</span>
                  <input
                    type="number"
                    min="10"
                    max={walletBalance}
                    value={sendAmount || ''}
                    onChange={(e) => setSendAmount(Number(e.target.value))}
                    className="w-full text-base bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-black text-slate-900"
                    placeholder="টাকার পরিমাণ লিখুন"
                  />
                </div>
              </div>

              {/* Quick Amount Fast Buttons */}
              <div className="flex gap-2">
                {[100, 200, 500, 1000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setSendAmount(amt)}
                    className="flex-1 py-1 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
                  >
                    ৳{amt}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setSendAmount(walletBalance)}
                  className="flex-1 py-1 text-[11px] font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg"
                >
                  সব
                </button>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">রেফারেন্স / নোট (ঐচ্ছিক)</label>
                <input
                  type="text"
                  placeholder="যেমন: খাবারের বিল / উপহার"
                  value={sendNote}
                  onChange={(e) => setSendNote(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                />
              </div>

              {/* Fee and Total Summary Box */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span>ট্রান্সফার পরিমাণ:</span>
                  <span className="font-mono font-bold text-slate-900">৳ {sendAmount || 0}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>সার্ভিস চার্জ / ফি:</span>
                  <span className="font-mono font-bold text-emerald-600">
                    {sendMoneyMode === 'wallet_to_mfs' ? `৳ ${Math.round((sendAmount || 0) * 0.015)} (1.5%)` : '৳ ০.০০ (ফ্রি)'}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200 font-bold text-slate-900">
                  <span>মোট কর্তন হবে:</span>
                  <span className="font-mono text-sm text-indigo-600 font-black">
                    ৳ {(sendAmount || 0) + (sendMoneyMode === 'wallet_to_mfs' ? Math.round((sendAmount || 0) * 0.015) : 0)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                disabled={isSendingMoney || sendAmount <= 0}
                onClick={handleConfirmSendMoney}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-3.5 rounded-2xl text-xs cursor-pointer shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2"
              >
                {isSendingMoney ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>প্রসেসিং হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>টাকা ট্রান্সফার নিশ্চিত করুন</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DIGITAL RECEIPT SLIP */}
      {isReceiptOpen && receiptTx && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl animate-scaleUp border border-slate-100 text-slate-900">
            <div className="text-center space-y-2 pb-2 border-b border-slate-100">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <span className="text-[10px] font-black tracking-widest text-indigo-600 uppercase">Rest Pay Digital Slip</span>
                <h3 className="text-base font-black text-slate-900">লেনদেন সফল হয়েছে</h3>
                <span className="text-2xl font-black font-mono text-emerald-600 block mt-1">
                  ৳ {Number(receiptTx.amount).toLocaleString('en-US')}
                </span>
              </div>
            </div>

            <div className="space-y-2.5 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">বিবরণ:</span>
                <span className="font-bold text-slate-900">{receiptTx.title}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">লেনদেনের ধরন:</span>
                <span className={`font-black px-2 py-0.5 rounded text-[10px] uppercase ${
                  receiptTx.type === 'credit' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                }`}>
                  {receiptTx.type === 'credit' ? 'ক্যাশ-ইন / জমা' : 'ক্যাশ-আউট / পাঠানো'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">পেমেন্ট মেথড:</span>
                <span className="font-bold text-slate-900">{receiptTx.method || 'Rest Pay'}</span>
              </div>
              {receiptTx.trxId && (
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                  <span className="text-slate-500 font-medium">TrxID:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-black text-indigo-600 text-xs bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                      {receiptTx.trxId}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyTrx(receiptTx.trxId)}
                      className="p-1 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                      title="TrxID কপি করুন"
                    >
                      {copiedTrxId === receiptTx.trxId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">তারিখ ও সময়:</span>
                <span className="font-mono text-slate-700 text-[11px]">{receiptTx.date}</span>
              </div>
              {receiptTx.channelDetails?.receiverPhone && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">প্রাপক:</span>
                  <span className="font-mono text-slate-900 font-bold">{receiptTx.channelDetails.receiverPhone}</span>
                </div>
              )}
              {receiptTx.channelDetails?.fee !== undefined && receiptTx.channelDetails.fee > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">সার্ভিস ফি:</span>
                  <span className="font-mono text-slate-900 font-bold">৳ {receiptTx.channelDetails.fee}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>প্রিন্ট রসিদ</span>
              </button>
              <button
                type="button"
                onClick={() => setIsReceiptOpen(false)}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-2.5 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-indigo-100"
              >
                <span>ঠিক আছে</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BANGLADESHI PAYMENT GATEWAY MODAL (FOR ADD MONEY) */}
      <BangladeshiPaymentGatewayModal
        isOpen={isAddGatewayOpen}
        amount={gatewayAmount}
        defaultMethod={gatewayMethod}
        orderTitle="রেস্ট পে ডিজিটাল ওয়ালেট রিচার্জ (Add Money)"
        businessName="Rest Pay Digital Wallet"
        userPhone={currentUser.phone}
        userName={currentUser.name}
        gatewayConfig={systemConfig?.paymentGateways}
        onClose={() => setIsAddGatewayOpen(false)}
        onPaymentSuccess={handleGatewayAddMoneySuccess}
      />

      {/* MODAL: ADD SAVED ADDRESS */}
      {isAddAddressOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-600" /> নতুন ডেলিভারি ঠিকানা যুক্ত করুন
              </h4>
              <button onClick={() => setIsAddAddressOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleSaveAddress} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">ঠিকানার নাম (ট্যাগ)</label>
                  <select
                    value={newAddrTitle}
                    onChange={(e) => setNewAddrTitle(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold"
                  >
                    <option value="বাসা (Home)">বাসা (Home)</option>
                    <option value="অফিস (Office)">অফিস (Office)</option>
                    <option value="গ্রামের বাড়ি (Hometown)">গ্রামের বাড়ি (Hometown)</option>
                    <option value="অন্যান্য (Other)">অন্যান্য (Other)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">প্রাপকের নাম</label>
                  <input
                    type="text"
                    required
                    value={newAddrRecipient}
                    onChange={(e) => setNewAddrRecipient(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">মোবাইল নম্বর</label>
                <input
                  type="text"
                  required
                  value={newAddrPhone}
                  onChange={(e) => setNewAddrPhone(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-bold"
                />
              </div>

              {/* Division, District, Thana */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-1">বিভাগ</label>
                  <select
                    value={normalizeDivisionName(newAddrDiv)}
                    onChange={(e) => {
                      setNewAddrDiv(e.target.value);
                      setNewAddrDist('');
                      setNewAddrThana('');
                    }}
                    className="w-full text-[11px] bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold"
                  >
                    {BANGLADESH_LOCATIONS.map((loc, idx) => (
                      <option key={`na-div-${loc.division}-${idx}`} value={loc.division}>
                        {loc.division}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-1">জেলা</label>
                  <select
                    value={normalizeDistrictName(newAddrDiv, newAddrDist)}
                    onChange={(e) => {
                      setNewAddrDist(e.target.value);
                      setNewAddrThana('');
                    }}
                    className="w-full text-[11px] bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold"
                  >
                    {Array.from(new Set(getDistrictsForDivision(normalizeDivisionName(newAddrDiv)).map(d => d.name))).map((dName, idx) => (
                      <option key={`na-dist-${dName}-${idx}`} value={dName}>
                        {dName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-1">থানা</label>
                  <select
                    value={normalizeThanaName(newAddrDiv, newAddrDist, newAddrThana)}
                    onChange={(e) => setNewAddrThana(e.target.value)}
                    className="w-full text-[11px] bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold"
                  >
                    {Array.from(new Set(getThanasForDistrict(normalizeDivisionName(newAddrDiv), normalizeDistrictName(newAddrDiv, newAddrDist)))).map((t, idx) => (
                      <option key={`na-thana-${t}-${idx}`} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">বিস্তারিত ঠিকানা (বাড়ি, রোড, ফ্ল্যাট)</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: বাড়ি #৪, রোড #৯, সেক্টর #৩"
                  value={newAddrDetails}
                  onChange={(e) => setNewAddrDetails(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold"
                />
              </div>

              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={newAddrDefault}
                  onChange={(e) => setNewAddrDefault(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                <span>এই ঠিকানাটিকে ডিফল্ট ডেলিভারি ঠিকানা হিসেবে সেট করুন</span>
              </label>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 rounded-xl text-xs cursor-pointer shadow-md transition-all mt-2"
              >
                ঠিকানা সংরক্ষণ করুন
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AccountHub;
