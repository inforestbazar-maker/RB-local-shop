import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Building2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Settings,
  RefreshCw,
  Save,
  Key,
  Lock,
  Percent,
  Eye,
  EyeOff,
  Copy,
  Check,
  Play,
  Info,
  Layers,
  Activity,
  Search,
  Filter,
  Sparkles,
  RotateCcw,
  Smartphone,
  QrCode,
  Shield,
  HelpCircle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { PaymentGatewayGlobalConfig, MfsGatewayProviderConfig, User, WalletTransaction } from '../types';
import { BangladeshiPaymentGatewayModal, PaymentGatewayDetails } from './BangladeshiPaymentGatewayModal';

interface AdminPaymentGatewayControlProps {
  systemConfig?: any;
  allUsers?: User[];
  bookings?: any[];
  onRefresh?: () => void;
  onBroadcastNotification?: (title: string, message: string) => void;
}

export const DEFAULT_PG_CONFIG: PaymentGatewayGlobalConfig = {
  masterEnabled: true,
  defaultGateway: 'bkash',
  enableWalletAddMoney: true,
  enableWalletSendMoney: true,
  enableWalletToMfsCashout: true,
  minAddMoneyAmount: 10,
  maxAddMoneyAmount: 50000,
  walletToWalletFeePercent: 0,
  walletToMfsFeePercent: 1.5,
  mockOtpSimulation: true,
  bannerNotice: 'সকল অনলাইন MFS পেমেন্ট গেটওয়ে (বিকাশ, নগদ, রকেট) সক্রিয় ও ইনস্ট্যান্ট ভেরিফাইড।',
  providers: {
    bkash: {
      id: 'bkash',
      nameBn: 'বিকাশ (bKash)',
      nameEn: 'bKash Online Payment Gateway',
      isEnabled: true,
      gatewayMode: 'both',
      merchantAccountNumber: '01777889900',
      accountType: 'merchant',
      cashInFeePercent: 0,
      cashOutFeePercent: 1.5,
      minAmount: 10,
      maxAmount: 50000,
      isSandbox: false,
      appKey: 'bkash_live_app_key_restbazar',
      appSecret: 'bkash_sec_9938481230491',
      username: 'restbazar_mfs',
      password: '••••••••••••',
      noticeBanner: 'বিকাশ পেমেন্ট গেটওয়ে দিয়ে ওটিপি/পিন বা TrxID দিয়ে দ্রুত পেমেন্ট সম্পন্ন করুন।',
      instructionsBn: '১. *247# ডায়াল করুন অথবা বিকাশ অ্যাপ ওপেন করুন\n২. "Payment" বা "Send Money" নির্বাচন করুন\n৩. মার্চেন্ট নম্বর প্রদান করুন ও পিন দিন\n৪. TrxID সংগ্রহ করে সাবমিট করুন'
    },
    nagad: {
      id: 'nagad',
      nameBn: 'নগদ (Nagad)',
      nameEn: 'Nagad Digital Payment Gateway',
      isEnabled: true,
      gatewayMode: 'both',
      merchantAccountNumber: '01888990011',
      accountType: 'merchant',
      cashInFeePercent: 0,
      cashOutFeePercent: 1.5,
      minAmount: 10,
      maxAmount: 50000,
      isSandbox: false,
      appKey: 'nagad_live_mid_restbazar',
      appSecret: 'nagad_sec_884719203941',
      username: 'restbazar_nagad',
      password: '••••••••••••',
      noticeBanner: 'বাংলাদেশ ডাক বিভাগের নগদ পেমেন্ট গেটওয়ে দিয়ে নিশ্চিন্তে লেনদেন করুন।',
      instructionsBn: '১. *167# ডায়াল করুন অথবা নগদ অ্যাপে যান\n২. "Merchant Pay" বা "Send Money" করুন\n৩. ট্রানজেকশন সফল হলে TrxID ইনপুট দিন'
    },
    rocket: {
      id: 'rocket',
      nameBn: 'রকেট (Rocket)',
      nameEn: 'Rocket Mobile Banking Gateway',
      isEnabled: true,
      gatewayMode: 'both',
      merchantAccountNumber: '01999001122',
      accountType: 'merchant',
      cashInFeePercent: 0,
      cashOutFeePercent: 1.8,
      minAmount: 10,
      maxAmount: 30000,
      isSandbox: false,
      appKey: 'dbbl_rocket_client_key',
      appSecret: 'rocket_sec_7736182930',
      username: 'restbazar_rocket',
      password: '••••••••••••',
      noticeBanner: 'ডাচ-বাংলা ব্যাংকের রকেট পেমেন্ট গেটওয়ে সক্রিয় রয়েছে।',
      instructionsBn: '১. *322# ডায়াল করুন অথবা রকেট অ্যাপে যান\n২. পেমেন্ট সম্পন্ন করে TrxID সংগ্রহ করুন'
    },
    card: {
      id: 'card',
      nameBn: 'কার্ড / ভিসা / মাস্টারকার্ড',
      nameEn: 'Visa / MasterCard / AMEX Debit & Credit Cards',
      isEnabled: true,
      gatewayMode: 'direct_gateway',
      merchantAccountNumber: 'SSL-RESTBAZAR-LIVE',
      accountType: 'merchant',
      cashInFeePercent: 2.0,
      cashOutFeePercent: 2.5,
      minAmount: 50,
      maxAmount: 100000,
      isSandbox: false,
      appKey: 'ssl_store_id_restbazar',
      appSecret: 'ssl_store_passwd_live_992834',
      noticeBanner: 'যেকোনো বাংলাদেশি ও আন্তর্জাতিক ডেবিট/ক্রেডিট কার্ড সমর্থিত।',
      instructionsBn: 'কার্ড নম্বর, মেয়াদ ও CVV দিয়ে ওটিপি ভেরিফিকেশন সম্পন্ন করুন।'
    },
    bank: {
      id: 'bank',
      nameBn: 'সরাসরি ব্যাংক ডিপোজিট',
      nameEn: 'Direct Bank Transfer / BEFTN / NPSB',
      isEnabled: true,
      gatewayMode: 'manual_trx',
      merchantAccountNumber: '1501204829001 (BRAC Bank)',
      accountType: 'merchant',
      cashInFeePercent: 0,
      cashOutFeePercent: 0,
      minAmount: 500,
      maxAmount: 500000,
      isSandbox: false,
      bankDetails: {
        bankName: 'BRAC Bank Ltd.',
        accountName: 'RestBazar Ltd.',
        accountNumber: '1501204829001',
        branchName: 'Gulshan Branch',
        routingNumber: '060261325'
      },
      noticeBanner: 'বড় অঙ্কের পেমেন্টের জন্য সরাসরি ব্যাংক ডিপোজিট ব্যবহার করুন।',
      instructionsBn: 'ব্যাংক একাউন্ট: RestBazar Ltd.\nহিসাব নং: 1501204829001\nব্যাংক: BRAC Bank Ltd., গুলশান শাখা\nরাউটিং নং: 060261325'
    },
    cod: {
      id: 'cod',
      nameBn: 'ক্যাশ অন ডেলিভারি (COD)',
      nameEn: 'Cash on Delivery',
      isEnabled: true,
      gatewayMode: 'manual_trx',
      merchantAccountNumber: 'Hand-to-Hand',
      accountType: 'merchant',
      cashInFeePercent: 0,
      cashOutFeePercent: 0,
      minAmount: 1,
      maxAmount: 10000,
      isSandbox: false,
      noticeBanner: 'পণ্য বা সেবা হাতে পেয়ে নগদে মূল্য পরিশোধ করুন।'
    }
  }
};

export default function AdminPaymentGatewayControl({
  systemConfig,
  allUsers = [],
  bookings = [],
  onRefresh,
  onBroadcastNotification
}: AdminPaymentGatewayControlProps) {
  // Current config state
  const [config, setConfig] = useState<PaymentGatewayGlobalConfig>(() => {
    if (systemConfig?.paymentGateways && typeof systemConfig.paymentGateways === 'object') {
      return {
        ...DEFAULT_PG_CONFIG,
        ...systemConfig.paymentGateways,
        providers: {
          ...DEFAULT_PG_CONFIG.providers,
          ...(systemConfig.paymentGateways.providers || {})
        }
      };
    }
    return DEFAULT_PG_CONFIG;
  });

  const [activeTab, setActiveTab] = useState<'providers' | 'policies' | 'simulator' | 'transactions'>('providers');
  const [selectedProviderId, setSelectedProviderId] = useState<'bkash' | 'nagad' | 'rocket' | 'card' | 'bank' | 'cod'>('bkash');
  const [showSecretMap, setShowSecretMap] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [trxSearch, setTrxSearch] = useState('');
  const [trxFilterMethod, setTrxFilterMethod] = useState<'all' | 'bkash' | 'nagad' | 'rocket' | 'card' | 'wallet'>('all');

  // Simulator state
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [simAmount, setSimAmount] = useState(500);
  const [simProvider, setSimProvider] = useState<'bkash' | 'nagad' | 'rocket'>('bkash');
  const [simResult, setSimResult] = useState<PaymentGatewayDetails | null>(null);

  // Sync with systemConfig if it changes from outside
  useEffect(() => {
    if (systemConfig?.paymentGateways && typeof systemConfig.paymentGateways === 'object') {
      setConfig({
        ...DEFAULT_PG_CONFIG,
        ...systemConfig.paymentGateways,
        providers: {
          ...DEFAULT_PG_CONFIG.providers,
          ...(systemConfig.paymentGateways.providers || {})
        }
      });
    }
  }, [systemConfig?.paymentGateways]);

  // Toggle secret visibility
  const toggleSecret = (key: string) => {
    setShowSecretMap(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Update provider field
  const updateProviderField = (providerId: string, field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      providers: {
        ...prev.providers,
        [providerId]: {
          ...(prev.providers as any)[providerId],
          [field]: value
        }
      }
    }));
  };

  // Update bank details
  const updateBankDetails = (field: string, value: string) => {
    setConfig(prev => ({
      ...prev,
      providers: {
        ...prev.providers,
        bank: {
          ...prev.providers.bank,
          bankDetails: {
            ...(prev.providers.bank?.bankDetails || {
              bankName: '',
              accountName: '',
              accountNumber: '',
              branchName: '',
              routingNumber: ''
            }),
            [field]: value
          }
        }
      }
    }));
  };

  // Save changes to backend
  const handleSaveConfig = async () => {
    setIsSaving(true);
    setSaveSuccessMsg('');
    try {
      const response = await fetch('/api/admin/payment-gateway-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentGateways: config })
      });
      const data = await response.json();
      if (data.success) {
        setSaveSuccessMsg('পেমেন্ট গেটওয়ে কনফিগারেশন সফলভাবে ডেটাবেজে সংরক্ষিত ও কার্যকর হয়েছে!');
        if (onRefresh) onRefresh();
        if (onBroadcastNotification) {
          onBroadcastNotification(
            '💳 পেমেন্ট গেটওয়ে আপডেট',
            'অ্যাডমিন প্যানেল থেকে পেমেন্ট গেটওয়ে রুলস ও মার্চেন্ট একাউন্ট কনফিগারেশন আপডেট করা হয়েছে।'
          );
        }
        setTimeout(() => setSaveSuccessMsg(''), 4000);
      } else {
        alert(data.error || 'কনফিগারেশন সংরক্ষণ করা সম্ভব হয়নি');
      }
    } catch (err) {
      console.error('Error saving PG config:', err);
      alert('সার্ভার কানেকশন ত্রুটি!');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to default
  const handleResetToDefault = () => {
    if (window.confirm('আপনি কি নিশ্চিত যে সকল পেমেন্ট গেটওয়ে কনফিগারেশন ডিফল্ট অবস্থায় ফিরিয়ে নিতে চান?')) {
      setConfig(DEFAULT_PG_CONFIG);
      setSaveSuccessMsg('ডিফল্ট সেটিংস লোড করা হয়েছে। ডেটাবেজে সংরক্ষণ করতে "সেভ করুন" বাটনে চাপুন।');
      setTimeout(() => setSaveSuccessMsg(''), 4000);
    }
  };

  // Quick 1-click toggle provider
  const toggleProviderQuick = (providerId: string) => {
    const currentStatus = (config.providers as any)[providerId]?.isEnabled ?? true;
    updateProviderField(providerId, 'isEnabled', !currentStatus);
  };

  // Collect all transactions from users & bookings
  const allWalletTransactions: (WalletTransaction & { userName?: string; userPhone?: string })[] = [];
  allUsers.forEach(u => {
    if (u.walletTransactions && Array.isArray(u.walletTransactions)) {
      u.walletTransactions.forEach(t => {
        allWalletTransactions.push({
          ...t,
          userName: u.name,
          userPhone: u.phone
        });
      });
    }
  });

  // Filter transactions
  const filteredTransactions = allWalletTransactions.filter(t => {
    const matchSearch = !trxSearch || 
      (t.trxId && t.trxId.toLowerCase().includes(trxSearch.toLowerCase())) ||
      (t.userPhone && t.userPhone.includes(trxSearch)) ||
      (t.userName && t.userName.toLowerCase().includes(trxSearch.toLowerCase())) ||
      (t.description && t.description.toLowerCase().includes(trxSearch.toLowerCase()));
    
    if (!matchSearch) return false;

    if (trxFilterMethod === 'all') return true;
    if (trxFilterMethod === 'bkash') return (t.method && t.method.includes('bkash')) || (t.description && t.description.includes('বিকাশ'));
    if (trxFilterMethod === 'nagad') return (t.method && t.method.includes('nagad')) || (t.description && t.description.includes('নগদ'));
    if (trxFilterMethod === 'rocket') return (t.method && t.method.includes('rocket')) || (t.description && t.description.includes('রকেট'));
    if (trxFilterMethod === 'card') return (t.method && t.method.includes('card')) || (t.description && t.description.includes('কার্ড'));
    if (trxFilterMethod === 'wallet') return t.type === 'send_money' || t.type === 'receive_money';

    return true;
  });

  const activeProvider = (config.providers as any)[selectedProviderId] || config.providers.bkash;

  const totalGatewayVolume = allWalletTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalCompletedTrx = allWalletTransactions.length;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-5 sm:p-7 text-white shadow-xl border border-indigo-500/20 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-black">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>পেমেন্ট গেটওয়ে ও ওয়ালেট কন্ট্রোল সেন্টার</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              অনলাইন পেমেন্ট গেটওয়ে ও MFS কনফিগারেশন
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              বিকাশ, নগদ, রকেট, ডেবিট/ক্রেডিট কার্ড ও ব্যাংক ট্রান্সফারের মার্চেন্ট একাউন্ট, ফি রেট, লিমিট, ওটিপি সিমুলেশন এবং মাস্টার অন/অফ নিয়ন্ত্রণ করুন।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                setSimulatorOpen(true);
              }}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>গেটওয়ে টেস্ট রান</span>
            </button>
            <button
              onClick={handleResetToDefault}
              className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              title="ডিফল্ট কনফিগারেশন রিস্টোর করুন"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>ডিফল্ট</span>
            </button>
            <button
              onClick={handleSaveConfig}
              disabled={isSaving}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-lg shadow-indigo-500/25 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>সংরক্ষণ হচ্ছে...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>সেভ ও কার্যকর করুন</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Status Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/5 backdrop-blur-xs rounded-2xl p-3.5 border border-white/10">
            <span className="text-[11px] text-slate-400 font-bold block">মাস্টার গেটওয়ে স্ট্যাটাস</span>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-2.5 h-2.5 rounded-full ${config.masterEnabled ? 'bg-emerald-400 animate-ping' : 'bg-rose-400'}`} />
              <span className="text-sm font-black text-white">
                {config.masterEnabled ? 'সক্রিয় (Online)' : 'রক্ষণাবেক্ষণ (Off)'}
              </span>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-xs rounded-2xl p-3.5 border border-white/10">
            <span className="text-[11px] text-slate-400 font-bold block">সক্রিয় প্রোভাইডার</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-black text-white font-mono">
                {Object.values(config.providers).filter((p: any) => p && p.isEnabled).length} / {Object.keys(config.providers).length} চালু
              </span>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-xs rounded-2xl p-3.5 border border-white/10">
            <span className="text-[11px] text-slate-400 font-bold block">মোট গেটওয়ে লেনদেন</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-black text-white font-mono">
                {totalCompletedTrx} টি
              </span>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-xs rounded-2xl p-3.5 border border-white/10">
            <span className="text-[11px] text-slate-400 font-bold block">মোট টার্নওভার ভলিউম</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-black text-emerald-400 font-mono">
                ৳ {totalGatewayVolume.toLocaleString('en-US')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Success Notification Alert */}
      {saveSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
          <button 
            onClick={() => setSaveSuccessMsg('')}
            className="text-emerald-600 hover:text-emerald-900 font-black cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('providers')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'providers'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>গেটওয়ে প্রোভাইডার সেটিংস</span>
          </button>
          <button
            onClick={() => setActiveTab('policies')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'policies'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>গ্লোবাল রুলস ও ওয়ালেট পলিসি</span>
          </button>
          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'simulator'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Play className="w-4 h-4" />
            <span>লাইভ টেস্ট সিমুলেটর</span>
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'transactions'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>লেনদেন খতিয়ান ও TrxID অডিট ({allWalletTransactions.length})</span>
          </button>
        </div>

        {/* Quick Master Switch */}
        <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
          <span className="text-xs font-bold text-slate-700">সিস্টেম গেটওয়ে মাস্টার সুইচ:</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.masterEnabled}
              onChange={(e) => setConfig(prev => ({ ...prev, masterEnabled: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PROVIDER SETTINGS (bKash, Nagad, Rocket, Card, Bank, COD) */}
      {/* ========================================================================= */}
      {activeTab === 'providers' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Provider Switcher List */}
          <div className="lg:col-span-4 space-y-2.5">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
              পেমেন্ট প্রোভাইডার নির্বাচন
            </h3>

            {/* bKash Card */}
            <div
              onClick={() => setSelectedProviderId('bkash')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                selectedProviderId === 'bkash'
                  ? 'bg-pink-50/80 border-[#D12053] shadow-md ring-2 ring-pink-500/20'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#D12053] text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  bK
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                    <span>বিকাশ (bKash)</span>
                    {config.providers.bkash?.isSandbox && (
                      <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-mono font-bold">SANDBOX</span>
                    )}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {config.providers.bkash?.merchantAccountNumber || '01777889900'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleProviderQuick('bkash');
                  }}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-black cursor-pointer ${
                    config.providers.bkash?.isEnabled
                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                      : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                  }`}
                >
                  {config.providers.bkash?.isEnabled ? '● সক্রিয়' : '○ বন্ধ'}
                </button>
              </div>
            </div>

            {/* Nagad Card */}
            <div
              onClick={() => setSelectedProviderId('nagad')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                selectedProviderId === 'nagad'
                  ? 'bg-orange-50/80 border-[#F7941D] shadow-md ring-2 ring-orange-500/20'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F7941D] text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  NG
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                    <span>নগদ (Nagad)</span>
                    {config.providers.nagad?.isSandbox && (
                      <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-mono font-bold">SANDBOX</span>
                    )}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {config.providers.nagad?.merchantAccountNumber || '01888990011'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleProviderQuick('nagad');
                  }}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-black cursor-pointer ${
                    config.providers.nagad?.isEnabled
                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                      : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                  }`}
                >
                  {config.providers.nagad?.isEnabled ? '● সক্রিয়' : '○ বন্ধ'}
                </button>
              </div>
            </div>

            {/* Rocket Card */}
            <div
              onClick={() => setSelectedProviderId('rocket')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                selectedProviderId === 'rocket'
                  ? 'bg-purple-50/80 border-[#8C3494] shadow-md ring-2 ring-purple-500/20'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#8C3494] text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  RK
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                    <span>রকেট (Rocket)</span>
                    {config.providers.rocket?.isSandbox && (
                      <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-mono font-bold">SANDBOX</span>
                    )}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {config.providers.rocket?.merchantAccountNumber || '01999001122'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleProviderQuick('rocket');
                  }}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-black cursor-pointer ${
                    config.providers.rocket?.isEnabled
                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                      : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                  }`}
                >
                  {config.providers.rocket?.isEnabled ? '● সক্রিয়' : '○ বন্ধ'}
                </button>
              </div>
            </div>

            {/* Card Gateway */}
            <div
              onClick={() => setSelectedProviderId('card')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                selectedProviderId === 'card'
                  ? 'bg-blue-50/80 border-blue-600 shadow-md ring-2 ring-blue-500/20'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">ভিসা / মাস্টারকার্ড / Amex</h4>
                  <p className="text-[11px] text-slate-500">SSLCommerz / Stripe Gateway</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleProviderQuick('card');
                  }}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-black cursor-pointer ${
                    config.providers.card?.isEnabled
                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                      : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                  }`}
                >
                  {config.providers.card?.isEnabled ? '● সক্রিয়' : '○ বন্ধ'}
                </button>
              </div>
            </div>

            {/* Bank Deposit */}
            <div
              onClick={() => setSelectedProviderId('bank')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                selectedProviderId === 'bank'
                  ? 'bg-teal-50/80 border-teal-600 shadow-md ring-2 ring-teal-500/20'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-sm">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">সরাসরি ব্যাংক ট্রান্সফার</h4>
                  <p className="text-[11px] text-slate-500">BEFTN, NPSB & Deposit Slip</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleProviderQuick('bank');
                  }}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-black cursor-pointer ${
                    config.providers.bank?.isEnabled
                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                      : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                  }`}
                >
                  {config.providers.bank?.isEnabled ? '● সক্রিয়' : '○ বন্ধ'}
                </button>
              </div>
            </div>

            {/* COD */}
            <div
              onClick={() => setSelectedProviderId('cod')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                selectedProviderId === 'cod'
                  ? 'bg-amber-50/80 border-amber-600 shadow-md ring-2 ring-amber-500/20'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  COD
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">ক্যাশ অন ডেলিভারি (COD)</h4>
                  <p className="text-[11px] text-slate-500">পণ্য হাতে পেয়ে মূল্য পরিশোধ</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleProviderQuick('cod');
                  }}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-black cursor-pointer ${
                    config.providers.cod?.isEnabled
                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                      : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                  }`}
                >
                  {config.providers.cod?.isEnabled ? '● সক্রিয়' : '○ বন্ধ'}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Provider Detail Configuration Form */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <span>{activeProvider?.nameBn || selectedProviderId.toUpperCase()} কনফিগারেশন</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    activeProvider?.isEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {activeProvider?.isEnabled ? 'সক্রিয় (Active)' : 'নিষ্ক্রিয় (Disabled)'}
                  </span>
                </h3>
                <p className="text-xs text-slate-500">{activeProvider?.nameEn}</p>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <span>গেটওয়ে সক্রিয়:</span>
                  <input
                    type="checkbox"
                    checked={activeProvider?.isEnabled ?? true}
                    onChange={(e) => updateProviderField(selectedProviderId, 'isEnabled', e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                </label>
              </div>
            </div>

            {/* Basic Provider Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  মার্চেন্ট একাউন্ট নম্বর:
                </label>
                <input
                  type="text"
                  value={activeProvider?.merchantAccountNumber || ''}
                  onChange={(e) => updateProviderField(selectedProviderId, 'merchantAccountNumber', e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">গ্রাহকের কাছে এই নম্বরে পেমেন্ট করতে নির্দেশ দেওয়া হবে।</span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  অ্যাকাউন্টের ধরণ:
                </label>
                <select
                  value={activeProvider?.accountType || 'merchant'}
                  onChange={(e) => updateProviderField(selectedProviderId, 'accountType', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="merchant">মার্চেন্ট অ্যাকাউন্ট (Merchant Gateway 0%)</option>
                  <option value="agent">এজেন্ট অ্যাকাউন্ট (Agent Cash-in)</option>
                  <option value="personal">পার্সোনাল সেন্ড মানি (Personal Send Money)</option>
                </select>
              </div>
            </div>

            {/* Gateway Modes */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  গেটওয়ে মোড (Checkout Mode):
                </label>
                <select
                  value={activeProvider?.gatewayMode || 'both'}
                  onChange={(e) => updateProviderField(selectedProviderId, 'gatewayMode', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="both">উভয় পদ্ধতি (Direct OTP/PIN + Manual TrxID)</option>
                  <option value="direct_gateway">শুধুমাত্র ডিরেক্ট অনলাইন গেটওয়ে (OTP/PIN)</option>
                  <option value="manual_trx">শুধুমাত্র ম্যানুয়াল সেন্ড মানি (TrxID)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  এনভায়রনমেন্ট মোড:
                </label>
                <select
                  value={activeProvider?.isSandbox ? 'sandbox' : 'live'}
                  onChange={(e) => updateProviderField(selectedProviderId, 'isSandbox', e.target.value === 'sandbox')}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="live">লাইভ প্রোডাকশন (Live Production Mode)</option>
                  <option value="sandbox">স্যান্ডবক্স টেস্ট মোড (Sandbox Simulator)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  ক্যাশ-ইন ফি হার (%):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={activeProvider?.cashInFeePercent ?? 0}
                    onChange={(e) => updateProviderField(selectedProviderId, 'cashInFeePercent', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">%</span>
                </div>
              </div>
            </div>

            {/* Min & Max Limits */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  সর্বনিম্ন লেনদেন লিমিট (টাকা):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">৳</span>
                  <input
                    type="number"
                    min="1"
                    value={activeProvider?.minAmount ?? 10}
                    onChange={(e) => updateProviderField(selectedProviderId, 'minAmount', parseInt(e.target.value) || 10)}
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  সর্বোচ্চ লেনদেন লিমিট (টাকা):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">৳</span>
                  <input
                    type="number"
                    min="100"
                    value={activeProvider?.maxAmount ?? 50000}
                    onChange={(e) => updateProviderField(selectedProviderId, 'maxAmount', parseInt(e.target.value) || 50000)}
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Specific Config for Bank Transfer */}
            {selectedProviderId === 'bank' && (
              <div className="bg-teal-50/50 border border-teal-200 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-black text-teal-900 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-teal-700" />
                  <span>ব্যাংক একাউন্ট ডিটেইলস (গ্রাহকের জমা দেওয়ার জন্য)</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">ব্যাংকের নাম:</label>
                    <input
                      type="text"
                      value={activeProvider?.bankDetails?.bankName || 'BRAC Bank Ltd.'}
                      onChange={(e) => updateBankDetails('bankName', e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">একাউন্টের নাম (Title):</label>
                    <input
                      type="text"
                      value={activeProvider?.bankDetails?.accountName || 'RestBazar Ltd.'}
                      onChange={(e) => updateBankDetails('accountName', e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">একাউন্ট নম্বর:</label>
                    <input
                      type="text"
                      value={activeProvider?.bankDetails?.accountNumber || '1501204829001'}
                      onChange={(e) => updateBankDetails('accountNumber', e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">শাখা (Branch) ও রাউটিং নং:</label>
                    <input
                      type="text"
                      value={activeProvider?.bankDetails?.branchName || 'Gulshan Branch (Routing: 060261325)'}
                      onChange={(e) => updateBankDetails('branchName', e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* API Credentials Box */}
            {selectedProviderId !== 'cod' && selectedProviderId !== 'bank' && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-indigo-600" />
                    <span>API ও সিক্রেট কি ক্রেডেনশিয়াল (Secure Keys)</span>
                  </h4>
                  <span className="text-[10px] text-slate-500 font-mono">ENCRYPTED 256-BIT</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      {selectedProviderId === 'bkash' ? 'bKash App Key:' : selectedProviderId === 'nagad' ? 'Merchant ID (MID):' : 'Client Key:'}
                    </label>
                    <input
                      type="text"
                      value={activeProvider?.appKey || ''}
                      onChange={(e) => updateProviderField(selectedProviderId, 'appKey', e.target.value)}
                      placeholder="app_key_xxxxxxxx"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      {selectedProviderId === 'bkash' ? 'bKash App Secret:' : selectedProviderId === 'nagad' ? 'Merchant Secret Key:' : 'Secret Passphrase:'}
                    </label>
                    <div className="relative">
                      <input
                        type={showSecretMap[selectedProviderId] ? 'text' : 'password'}
                        value={activeProvider?.appSecret || ''}
                        onChange={(e) => updateProviderField(selectedProviderId, 'appSecret', e.target.value)}
                        placeholder="••••••••••••••••"
                        className="w-full pl-3 pr-9 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900"
                      />
                      <button
                        type="button"
                        onClick={() => toggleSecret(selectedProviderId)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        {showSecretMap[selectedProviderId] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Custom Bengali Instructions & Notice */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  গ্রাহক পেমেন্ট নির্দেশিকা (Bengali Instructions):
                </label>
                <textarea
                  rows={3}
                  value={activeProvider?.instructionsBn || ''}
                  onChange={(e) => updateProviderField(selectedProviderId, 'instructionsBn', e.target.value)}
                  placeholder="গ্রাহকের জন্য পেমেন্ট করার বিস্তারিত ধাপসমূহ..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 leading-relaxed font-sans"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  পেমেন্ট গেটওয়ে ব্যানার নোটিশ (Notice Banner):
                </label>
                <input
                  type="text"
                  value={activeProvider?.noticeBanner || ''}
                  onChange={(e) => updateProviderField(selectedProviderId, 'noticeBanner', e.target.value)}
                  placeholder="পপআপে প্রদর্শিত বিশেষ বিজ্ঞপ্তি..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: GLOBAL RULES & WALLET POLICIES */}
      {/* ========================================================================= */}
      {activeTab === 'policies' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-black text-slate-900">গ্লোবাল ওয়ালেট ও পেমেন্ট রুলস</h3>
              <p className="text-xs text-slate-500">ওয়ালেট রিচার্জ, ক্যাশ-আউট, পিয়ার-টু-পিয়ার ট্রান্সফার ও ওটিপি টেস্ট সেটিংস</p>
            </div>
            <button
              onClick={handleSaveConfig}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>রুলস সেভ করুন</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Wallet Add Money Toggle */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black text-slate-800">ওয়ালেটে টাকা যোগ (Add Money)</span>
                <input
                  type="checkbox"
                  checked={config.enableWalletAddMoney}
                  onChange={(e) => setConfig(prev => ({ ...prev, enableWalletAddMoney: e.target.checked }))}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
              </div>
              <p className="text-[11px] text-slate-500">বিকাশ/নগদ/রকেট দিয়ে গ্রাহক ওয়ালেটে ব্যালেন্স রিচার্জ করতে পারবে।</p>
            </div>

            {/* Wallet Send Money Toggle */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black text-slate-800">ওয়ালেট ট্রান্সফার (Send Money)</span>
                <input
                  type="checkbox"
                  checked={config.enableWalletSendMoney}
                  onChange={(e) => setConfig(prev => ({ ...prev, enableWalletSendMoney: e.target.checked }))}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
              </div>
              <p className="text-[11px] text-slate-500">এক রেস্ট পে ওয়ালেট থেকে অন্য মোবাইল নম্বরে ব্যালেন্স পাঠানো যাবে।</p>
            </div>

            {/* Wallet Cash-out Toggle */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black text-slate-800">ওয়ালেট ক্যাশ-আউট (Cash Out)</span>
                <input
                  type="checkbox"
                  checked={config.enableWalletToMfsCashout}
                  onChange={(e) => setConfig(prev => ({ ...prev, enableWalletToMfsCashout: e.target.checked }))}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
              </div>
              <p className="text-[11px] text-slate-500">ওয়ালেটের জমানো টাকা বিকাশ/নগদ অ্যাকাউন্টে ক্যাশ-আউট করতে পারবে।</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                ডিফল্ট পেমেন্ট গেটওয়ে:
              </label>
              <select
                value={config.defaultGateway}
                onChange={(e) => setConfig(prev => ({ ...prev, defaultGateway: e.target.value as any }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
              >
                <option value="bkash">বিকাশ (bKash)</option>
                <option value="nagad">নগদ (Nagad)</option>
                <option value="rocket">রকেট (Rocket)</option>
                <option value="card">ভিসা / কার্ড (Cards)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                সর্বনিম্ন ওয়ালেট টপ-আপ (টাকা):
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">৳</span>
                <input
                  type="number"
                  min="1"
                  value={config.minAddMoneyAmount}
                  onChange={(e) => setConfig(prev => ({ ...prev, minAddMoneyAmount: parseInt(e.target.value) || 10 }))}
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                সর্বোচ্চ ওয়ালেট টপ-আপ (টাকা):
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">৳</span>
                <input
                  type="number"
                  min="100"
                  value={config.maxAddMoneyAmount}
                  onChange={(e) => setConfig(prev => ({ ...prev, maxAddMoneyAmount: parseInt(e.target.value) || 50000 }))}
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                ক্যাশ-আউট ফি (%):
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={config.walletToMfsFeePercent}
                  onChange={(e) => setConfig(prev => ({ ...prev, walletToMfsFeePercent: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">%</span>
              </div>
            </div>
          </div>

          {/* OTP Simulation Mode */}
          <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>টেস্ট ওটিপি সিমুলেশন মোড (Instant Test Code '1234')</span>
              </h4>
              <p className="text-[11px] text-indigo-800/80">
                চালু থাকলে টেস্ট করার সময় যেকোনো ব্যবহারকারী '1234' ওটিপি কোড দিয়ে তাৎক্ষণিক পেমেন্ট ভেরিফাই করতে পারবে।
              </p>
            </div>
            <input
              type="checkbox"
              checked={config.mockOtpSimulation}
              onChange={(e) => setConfig(prev => ({ ...prev, mockOtpSimulation: e.target.checked }))}
              className="w-5 h-5 text-indigo-600 rounded"
            />
          </div>

          {/* Global Public Announcement Notice */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              প্ল্যাটফর্ম পাবলিক পেমেন্ট নোটিশ ব্যানার:
            </label>
            <input
              type="text"
              value={config.bannerNotice}
              onChange={(e) => setConfig(prev => ({ ...prev, bannerNotice: e.target.value }))}
              placeholder="যেমন: বিকাশ ও নগদ গেটওয়ে সফলভাবে চালু আছে..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: LIVE TEST SIMULATOR */}
      {/* ========================================================================= */}
      {activeTab === 'simulator' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Play className="w-4 h-4 text-emerald-600 fill-emerald-600" />
              <span>পেমেন্ট গেটওয়ে ইন্টারেক্টিভ লাইভ স্যান্ডবক্স টেস্ট</span>
            </h3>
            <p className="text-xs text-slate-500">
              অ্যাডমিন হিসেবে সরাসরি গ্রাহক ওটিপি/পিন এবং TrxID পেমেন্ট চেকআউট মডেলটি টেস্ট-রান করুন।
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">টেস্ট টাকার পরিমাণ:</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">৳</span>
                <input
                  type="number"
                  value={simAmount}
                  onChange={(e) => setSimAmount(Math.max(1, parseInt(e.target.value) || 100))}
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">পেমেন্ট মেথড:</label>
              <select
                value={simProvider}
                onChange={(e) => setSimProvider(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
              >
                <option value="bkash">বিকাশ (bKash)</option>
                <option value="nagad">নগদ (Nagad)</option>
                <option value="rocket">রকেট (Rocket)</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => setSimulatorOpen(true)}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>সিমুলেটর চালু করুন (৳{simAmount})</span>
              </button>
            </div>
          </div>

          {/* Last Simulation Result */}
          {simResult && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>সর্বশেষ টেস্ট সফল হয়েছে!</span>
                </span>
                <span className="text-[10px] font-mono text-slate-500 font-bold">{simResult.paidAt}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-bold">মেথড</span>
                  <span className="font-bold text-slate-800">{simResult.methodName}</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-bold">TrxID</span>
                  <span className="font-mono font-bold text-indigo-600">{simResult.trxId}</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-bold">অ্যাকাউন্ট</span>
                  <span className="font-mono font-bold text-slate-800">{simResult.accountNumber}</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-bold">টাকা</span>
                  <span className="font-mono font-black text-emerald-600">৳ {simResult.amount}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: ALL TRANSACTIONS AUDIT & TRxID PASSBOOK */}
      {/* ========================================================================= */}
      {activeTab === 'transactions' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-black text-slate-900">গেটওয়ে লেনদেন ও TrxID অডিট খতিয়ান</h3>
              <p className="text-xs text-slate-500">সকল গ্রাহক ও মার্চেন্টের বিকাশ, নগদ, রকেট ও ওয়ালেট পেমেন্ট রেকর্ড</p>
            </div>

            {/* Filter by Method */}
            <div className="flex items-center gap-2">
              <select
                value={trxFilterMethod}
                onChange={(e) => setTrxFilterMethod(e.target.value as any)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
              >
                <option value="all">সকল মেথড ({allWalletTransactions.length})</option>
                <option value="bkash">বিকাশ (bKash)</option>
                <option value="nagad">নগদ (Nagad)</option>
                <option value="rocket">রকেট (Rocket)</option>
                <option value="card">কার্ড (Cards)</option>
                <option value="wallet">ওয়ালেট পিয়ার-টু-পিয়ার</option>
              </select>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={trxSearch}
              onChange={(e) => setTrxSearch(e.target.value)}
              placeholder="TrxID, মোবাইল নম্বর, বা ব্যবহারকারীর নাম দিয়ে সার্চ করুন..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Table of Transactions */}
          <div className="overflow-x-auto">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Activity className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-500">কোনো লেনদেন রেকর্ড পাওয়া যায়নি</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                    <th className="py-2.5 px-3">TrxID ও মেথড</th>
                    <th className="py-2.5 px-3">ব্যবহারকারী ও মোবাইল</th>
                    <th className="py-2.5 px-3">ধরণ ও বিবরণ</th>
                    <th className="py-2.5 px-3 text-right">পরিমাণ</th>
                    <th className="py-2.5 px-3">তারিখ ও সময়</th>
                    <th className="py-2.5 px-3 text-center">স্ট্যাটাস</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {filteredTransactions.slice(0, 50).map((t, idx) => (
                    <tr key={t.id || idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-mono font-black text-indigo-700 flex items-center gap-1.5">
                          <span>{t.trxId || `TXN-${idx + 100}`}</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(t.trxId || '');
                              alert('TrxID কপি করা হয়েছে!');
                            }}
                            className="text-slate-400 hover:text-indigo-600 cursor-pointer"
                            title="কপি করুন"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase block mt-0.5">
                          {t.method || 'Wallet / MFS'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-900 block">{t.userName || 'গ্রাহক'}</span>
                        <span className="font-mono text-[11px] text-slate-500 block">{t.userPhone || '01XXXXXXXXX'}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-slate-700 font-medium line-clamp-1">{t.description || 'পেমেন্ট'}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono font-bold mt-0.5 inline-block">
                          {t.type}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className={`font-mono font-black text-xs ${
                          t.amount >= 0 ? 'text-emerald-600' : 'text-slate-900'
                        }`}>
                          {t.amount >= 0 ? '+' : ''}৳{Math.abs(t.amount || 0).toLocaleString('en-US')}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500 text-[11px] font-mono whitespace-nowrap">
                        {t.timestamp ? new Date(t.timestamp).toLocaleString('bn-BD') : 'আজ'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                          ভেরিফাইড (Paid)
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Interactive Simulator Modal */}
      {simulatorOpen && (
        <BangladeshiPaymentGatewayModal
          isOpen={simulatorOpen}
          onClose={() => setSimulatorOpen(false)}
          amount={simAmount}
          orderTitle="এডমিন টেস্ট বুকিং অর্ডার #TEST-99"
          businessName="RestBazar Official"
          businessPhone={config.providers[simProvider]?.merchantAccountNumber || '01777889900'}
          userPhone="01911999999"
          userName="এডমিন টেস্ট ইউজার"
          defaultMethod={simProvider}
          onPaymentSuccess={(details) => {
            setSimResult(details);
          }}
        />
      )}
    </div>
  );
}
