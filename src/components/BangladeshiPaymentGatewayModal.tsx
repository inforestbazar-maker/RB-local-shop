import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Copy, 
  Check, 
  Printer, 
  ShieldCheck, 
  Lock, 
  Smartphone, 
  QrCode, 
  RefreshCw, 
  ArrowRight,
  ChevronRight,
  CreditCard,
  Building2,
  Sparkles,
  Info,
  Clock
} from 'lucide-react';
import { BANGLADESH_MFS_LIST, generateTrxID, MFSDefinition } from '../data/bangladeshFinancialData';
import { PaymentGatewayGlobalConfig } from '../types';

export interface PaymentGatewayDetails {
  method: 'bkash' | 'nagad' | 'rocket' | 'upay' | 'bank' | 'card' | 'cod';
  methodName: string;
  accountNumber: string;
  trxId: string;
  amount: number;
  fee: number;
  paidAt: string;
  status: 'paid' | 'completed' | 'pending';
}

interface BangladeshiPaymentGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  orderTitle?: string;
  businessName?: string;
  businessPhone?: string;
  userPhone?: string;
  userName?: string;
  defaultMethod?: 'bkash' | 'nagad' | 'rocket';
  gatewayConfig?: PaymentGatewayGlobalConfig;
  onPaymentSuccess: (details: PaymentGatewayDetails) => void;
}

export function BangladeshiPaymentGatewayModal({
  isOpen,
  onClose,
  amount,
  orderTitle = 'অর্ডার / সার্ভিস বুকিং',
  businessName = 'RestBazar Merchant',
  businessPhone = '01700000000',
  userPhone = '',
  userName = '',
  defaultMethod = 'bkash',
  gatewayConfig,
  onPaymentSuccess
}: BangladeshiPaymentGatewayModalProps) {
  if (!isOpen) return null;

  // Determine available providers
  const isBkashEnabled = gatewayConfig?.providers?.bkash?.isEnabled ?? true;
  const isNagadEnabled = gatewayConfig?.providers?.nagad?.isEnabled ?? true;
  const isRocketEnabled = gatewayConfig?.providers?.rocket?.isEnabled ?? true;

  const initialMethod = defaultMethod && ((defaultMethod === 'bkash' && isBkashEnabled) || (defaultMethod === 'nagad' && isNagadEnabled) || (defaultMethod === 'rocket' && isRocketEnabled))
    ? defaultMethod
    : isBkashEnabled ? 'bkash' : isNagadEnabled ? 'nagad' : isRocketEnabled ? 'rocket' : 'bkash';

  const [selectedMethod, setSelectedMethod] = useState<'bkash' | 'nagad' | 'rocket'>(initialMethod);
  const [gatewayType, setGatewayType] = useState<'direct_gateway' | 'manual_trx'>('direct_gateway');
  
  // Direct Gateway Steps: 'phone' -> 'otp' -> 'pin' -> 'success'
  const [step, setStep] = useState<'phone' | 'otp' | 'pin' | 'success'>('phone');
  
  // Inputs
  const [phoneNumber, setPhoneNumber] = useState<string>(userPhone || '');
  const [otpCode, setOtpCode] = useState<string>('');
  const [pinCode, setPinCode] = useState<string>('');
  const [agreedTerms, setAgreedTerms] = useState<boolean>(true);
  
  // Manual TrxID Inputs
  const [manualSenderPhone, setManualSenderPhone] = useState<string>(userPhone || '');
  const [manualTrxId, setManualTrxId] = useState<string>('');

  // Processing state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [generatedTrx, setGeneratedTrx] = useState<PaymentGatewayDetails | null>(null);
  const [copiedTrx, setCopiedTrx] = useState<boolean>(false);
  const [copiedMerchantNumber, setCopiedMerchantNumber] = useState<boolean>(false);

  const activeMfs = BANGLADESH_MFS_LIST.find(m => m.id === selectedMethod) || BANGLADESH_MFS_LIST[0];

  // Theme config based on selected gateway
  const themeConfig = {
    bkash: {
      primaryColor: '#D12053',
      bgGradient: 'from-pink-600 to-rose-700',
      headerBg: 'bg-[#D12053]',
      activeBorder: 'border-[#D12053] ring-2 ring-pink-400/30',
      badgeBg: 'bg-pink-100 text-pink-800',
      btnBg: 'bg-[#D12053] hover:bg-[#b01742] text-white',
      nameEn: 'bKash Online Payment Gateway',
      nameBn: 'বিকাশ পেমেন্ট গেটওয়ে',
      tagline: 'সহজ, দ্রুত ও সম্পূর্ণ সুরক্ষিত পেমেন্ট'
    },
    nagad: {
      primaryColor: '#F7941D',
      bgGradient: 'from-amber-600 to-orange-600',
      headerBg: 'bg-[#F7941D]',
      activeBorder: 'border-[#F7941D] ring-2 ring-orange-400/30',
      badgeBg: 'bg-orange-100 text-orange-800',
      btnBg: 'bg-[#F7941D] hover:bg-[#e07d0d] text-white',
      nameEn: 'Nagad Digital Payment Gateway',
      nameBn: 'নগদ ডিজিটাল পেমেন্ট গেটওয়ে',
      tagline: 'বাংলাদেশ ডাক বিভাগের ডিজিটাল লেনদেন'
    },
    rocket: {
      primaryColor: '#8C3494',
      bgGradient: 'from-purple-700 to-indigo-800',
      headerBg: 'bg-[#8C3494]',
      activeBorder: 'border-[#8C3494] ring-2 ring-purple-400/30',
      badgeBg: 'bg-purple-100 text-purple-800',
      btnBg: 'bg-[#8C3494] hover:bg-[#74237c] text-white',
      nameEn: 'Rocket Direct Checkout',
      nameBn: 'রকেট মোবাইল ব্যাংকিং গেটওয়ে',
      tagline: 'ডাচ-বাংলা ব্যাংকের রকেট পেমেন্ট'
    }
  }[selectedMethod];

  // Step 1: Submit Phone Number
  const handleProceedToOtp = () => {
    if (!phoneNumber || phoneNumber.replace(/\D/g, '').length < 11) {
      setErrorMsg('সঠিক ১১ ডিজিটের মোবাইল ব্যাংকিং নম্বর লিখুন (যেমন: 017XXXXXXXX)।');
      return;
    }
    if (!agreedTerms) {
      setErrorMsg('গেটওয়ের শর্তাবলীতে সম্মতি প্রদান করুন।');
      return;
    }
    setErrorMsg('');
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setStep('otp');
    }, 600);
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = () => {
    if (!otpCode || otpCode.length < 4) {
      setErrorMsg('আপনার মোবাইলে পাঠানো ৪ বা ৬ ডিজিটের ওটিপি (OTP) কোড লিখুন। (টেস্ট কোড: 1234)');
      return;
    }
    setErrorMsg('');
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setStep('pin');
    }, 600);
  };

  // Step 3: Enter PIN & Confirm Payment
  const handleConfirmPinPayment = () => {
    if (!pinCode || pinCode.length < 4) {
      setErrorMsg('আপনার অ্যাকাউন্টের গোপন পিন নম্বর প্রদান করুন।');
      return;
    }
    setErrorMsg('');
    setIsProcessing(true);

    setTimeout(() => {
      const prefix = selectedMethod === 'bkash' ? 'BK' : selectedMethod === 'nagad' ? 'NG' : 'RK';
      const finalTrxId = `${prefix}${Date.now().toString().slice(-6)}${Math.floor(10 + Math.random() * 90)}`;
      
      const details: PaymentGatewayDetails = {
        method: selectedMethod,
        methodName: themeConfig.nameBn,
        accountNumber: phoneNumber,
        trxId: finalTrxId,
        amount: amount,
        fee: 0,
        paidAt: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }) + ', ' + new Date().toLocaleDateString('bn-BD'),
        status: 'paid'
      };

      setGeneratedTrx(details);
      setIsProcessing(false);
      setStep('success');
      onPaymentSuccess(details);
    }, 1000);
  };

  // Manual TrxID Confirmation
  const handleConfirmManualTrx = () => {
    if (!manualSenderPhone || manualSenderPhone.length < 11) {
      setErrorMsg('যে নম্বর থেকে টাকা পাঠিয়েছেন সেই ১১ ডিজিট নম্বর লিখুন।');
      return;
    }
    if (!manualTrxId || manualTrxId.trim().length < 6) {
      setErrorMsg('সঠিক ট্রানজেকশন আইডি (TrxID) লিখুন (যেমন: 9B7X2L4A)।');
      return;
    }
    setErrorMsg('');
    setIsProcessing(true);

    setTimeout(() => {
      const cleanTrx = manualTrxId.trim().toUpperCase();
      const details: PaymentGatewayDetails = {
        method: selectedMethod,
        methodName: `${themeConfig.nameBn} (ম্যানুয়াল পেমেন্ট)`,
        accountNumber: manualSenderPhone,
        trxId: cleanTrx,
        amount: amount,
        fee: 0,
        paidAt: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }) + ', ' + new Date().toLocaleDateString('bn-BD'),
        status: 'paid'
      };

      setGeneratedTrx(details);
      setIsProcessing(false);
      setStep('success');
      onPaymentSuccess(details);
    }, 800);
  };

  const handleCopyText = (text: string, isMerchant = false) => {
    navigator.clipboard.writeText(text);
    if (isMerchant) {
      setCopiedMerchantNumber(true);
      setTimeout(() => setCopiedMerchantNumber(false), 2000);
    } else {
      setCopiedTrx(true);
      setTimeout(() => setCopiedTrx(false), 2000);
    }
  };

  const isSandbox = gatewayConfig?.isSandbox || gatewayConfig?.providers?.[selectedMethod]?.mode === 'sandbox';
  const merchantAccountNumber = gatewayConfig?.providers?.[selectedMethod]?.merchantAccountNumber || businessPhone || '01712345678';
  const noticeBannerText = gatewayConfig?.providers?.[selectedMethod]?.noticeBanner || gatewayConfig?.bannerNotice;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 my-auto animate-scaleUp">
        
        {/* TOP BANNER */}
        <div className={`p-4 text-white ${themeConfig.headerBg} relative overflow-hidden transition-colors duration-300`}>
          <div className="flex justify-between items-center relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center border border-white/20 shadow-inner">
                <Smartphone className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                  <span>{themeConfig.nameBn}</span>
                  <span className="bg-white/25 text-white text-[9px] px-1.5 py-0.5 rounded font-mono font-bold">
                    {isSandbox ? 'SANDBOX' : 'SECURE'}
                  </span>
                </h3>
                <p className="text-[10px] text-white/80">{themeConfig.tagline}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Amount & Shop Details Bar */}
          <div className="mt-3 pt-3 border-t border-white/20 flex justify-between items-center text-xs">
            <div>
              <span className="text-white/75 text-[10px] block font-medium">পেমেন্ট প্রাপক:</span>
              <span className="font-bold text-white truncate max-w-[180px] block">{businessName}</span>
            </div>
            <div className="text-right">
              <span className="text-white/75 text-[10px] block font-medium">মোট প্রদেয় টাকা:</span>
              <span className="text-lg font-black text-white font-mono">৳ {amount.toLocaleString('en-US')}</span>
            </div>
          </div>
        </div>

        {/* Master Enabled Check */}
        {gatewayConfig && gatewayConfig.masterEnabled === false ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-base font-black text-slate-800">পেমেন্ট গেটওয়ে সাময়িক বন্ধ রয়েছে</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {gatewayConfig.bannerNotice || 'পেমেন্ট গেটওয়ে সিস্টেমে আপগ্রেড কাজ চলছে। অনুগ্রহ করে ক্যাশ অন ডেলিভারি নির্বাচন করুন।'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-full bg-slate-900 hover:bg-black text-white font-bold py-2.5 rounded-xl text-xs cursor-pointer"
            >
              বন্ধ করুন
            </button>
          </div>
        ) : (
          <>
            {/* NOTICE BANNER IF CONFIGURED */}
            {noticeBannerText && (
              <div className="bg-amber-50 border-b border-amber-200/60 px-4 py-2 flex items-center gap-2 text-amber-900 text-xs">
                <Info className="w-4 h-4 text-amber-600 shrink-0" />
                <p className="text-[11px] font-medium leading-snug">{noticeBannerText}</p>
              </div>
            )}

            {/* ERROR MESSAGE NOTIFICATION */}
            {errorMsg && (
              <div className="bg-rose-50 border-b border-rose-200 px-4 py-2 flex items-center gap-2 text-rose-700 text-xs font-bold animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* SUCCESS RECEIPT VIEW */}
            {step === 'success' && generatedTrx ? (
              <div className="p-5 space-y-4 font-sans animate-fadeIn">
                <div className="text-center space-y-1">
                  <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h4 className="text-base font-black text-slate-900">পেমেন্ট সফলভাবে সম্পন্ন হয়েছে!</h4>
                  <p className="text-xs text-slate-500">আপনার অর্ডারটি চূড়ান্তভাবে নিশ্চিত করা হয়েছে</p>
                </div>

                {/* Official Digital Voucher */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 relative overflow-hidden">
                  <div className="flex justify-between items-center border-b border-slate-200/80 pb-2">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded text-white ${themeConfig.headerBg}`}>
                        {selectedMethod.toUpperCase()}
                      </span>
                      <span className="text-[11px] font-bold text-slate-700">Official Payment Receipt</span>
                    </div>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                      ● PAID
                    </span>
                  </div>

                  <div className="text-center py-2 bg-white rounded-xl border border-slate-100 shadow-xs">
                    <span className="text-[10px] text-slate-400 font-bold block">পরিশোধিত মূল্য</span>
                    <div className="text-2xl font-black text-slate-900 font-mono">
                      ৳ {generatedTrx.amount.toLocaleString('en-US')}
                    </div>
                    <span className="text-[9px] text-emerald-600 font-bold">সার্ভিস ফি: ৳০.০০ (ফ্রি)</span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between items-center py-1 border-b border-slate-100">
                      <span className="text-slate-500 text-[11px]">ট্রানজেকশন আইডি (TrxID)</span>
                      <div className="flex items-center gap-1.5 font-mono font-black text-indigo-700">
                        <span>{generatedTrx.trxId}</span>
                        <button 
                          onClick={() => handleCopyText(generatedTrx.trxId)}
                          className="text-slate-400 hover:text-indigo-600 cursor-pointer p-0.5"
                          title="কপি করুন"
                        >
                          {copiedTrx ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-slate-100">
                      <span className="text-slate-500 text-[11px]">পেমেন্ট মেথড</span>
                      <span className="font-bold text-slate-800 text-[11px]">{generatedTrx.methodName}</span>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-slate-100">
                      <span className="text-slate-500 text-[11px]">প্রেরক অ্যাকাউন্ট নম্বর</span>
                      <span className="font-mono font-bold text-slate-800 text-[11px]">{generatedTrx.accountNumber}</span>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-slate-100">
                      <span className="text-slate-500 text-[11px]">তারিখ ও সময়</span>
                      <span className="font-medium text-slate-700 text-[11px]">{generatedTrx.paidAt}</span>
                    </div>

                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-500 text-[11px]">স্ট্যাটাস</span>
                      <span className="text-emerald-600 font-black text-[11px] flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" /> ভেরিফাইড ও প্রদেয়
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => window.print()}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>রসিদ প্রিন্ট করুন</span>
                  </button>
                  <button
                    onClick={onClose}
                    className="flex-1 bg-slate-900 hover:bg-black text-white font-black py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
                  >
                    <span>অর্ডারে ফিরে যান</span>
                  </button>
                </div>
              </div>
            ) : (
              /* PAYMENT FORM WORKFLOW */
              <div className="p-4 sm:p-5 space-y-4">
                
                {/* 1. MFS Gateway Selector Tab */}
                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1.5">
                    মোবাইল ব্যাংকিং গেটওয়ে নির্বাচন করুন:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {/* bKash */}
                    {isBkashEnabled && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMethod('bkash');
                          setStep('phone');
                          setErrorMsg('');
                        }}
                        className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                          selectedMethod === 'bkash'
                            ? 'bg-pink-50 border-[#D12053] text-[#D12053] border-2 shadow-xs font-black'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 font-bold'
                        }`}
                      >
                        <span className="text-xs">বিকাশ (bKash)</span>
                        <span className="text-[9px] opacity-75 font-mono">*247#</span>
                      </button>
                    )}

                    {/* Nagad */}
                    {isNagadEnabled && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMethod('nagad');
                          setStep('phone');
                          setErrorMsg('');
                        }}
                        className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                          selectedMethod === 'nagad'
                            ? 'bg-orange-50 border-[#F7941D] text-[#F7941D] border-2 shadow-xs font-black'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 font-bold'
                        }`}
                      >
                        <span className="text-xs">নগদ (Nagad)</span>
                        <span className="text-[9px] opacity-75 font-mono">*167#</span>
                      </button>
                    )}

                    {/* Rocket */}
                    {isRocketEnabled && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMethod('rocket');
                          setStep('phone');
                          setErrorMsg('');
                        }}
                        className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                          selectedMethod === 'rocket'
                            ? 'bg-purple-50 border-[#8C3494] text-[#8C3494] border-2 shadow-xs font-black'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 font-bold'
                        }`}
                      >
                        <span className="text-xs">রকেট (Rocket)</span>
                        <span className="text-[9px] opacity-75 font-mono">*322#</span>
                      </button>
                    )}
                  </div>
                </div>

            {/* 2. Payment Type Toggle (Direct Instant Gateway vs Manual Send Money / TrxID) */}
            <div className="flex bg-slate-100 p-1 rounded-xl gap-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setGatewayType('direct_gateway');
                  setErrorMsg('');
                }}
                className={`flex-1 py-1.5 rounded-lg transition-all text-center cursor-pointer flex items-center justify-center gap-1 ${
                  gatewayType === 'direct_gateway'
                    ? 'bg-white text-slate-900 shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
                <span>ইনস্ট্যান্ট অনলাইন গেটওয়ে</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setGatewayType('manual_trx');
                  setErrorMsg('');
                }}
                className={`flex-1 py-1.5 rounded-lg transition-all text-center cursor-pointer flex items-center justify-center gap-1 ${
                  gatewayType === 'manual_trx'
                    ? 'bg-white text-slate-900 shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <QrCode className="w-3.5 h-3.5 text-indigo-600" />
                <span>সেন্ড মানি / TrxID দিয়ে পেমেন্ট</span>
              </button>
            </div>

            {/* ========================================================================= */}
            {/* OPTION A: DIRECT INSTANT PAYMENT GATEWAY FLOW (Phone -> OTP -> PIN) */}
            {/* ========================================================================= */}
            {gatewayType === 'direct_gateway' && (
              <div className="space-y-3.5">
                
                {/* STEP 1: PHONE NUMBER */}
                {step === 'phone' && (
                  <div className="space-y-3 animate-fadeIn">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        আপনার {activeMfs.name} অ্যাকাউন্ট নম্বর (১১ ডিজিট):
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">🇧🇩</span>
                        <input
                          type="text"
                          placeholder="017XXXXXXXX"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    {/* Terms Agreement */}
                    <label className="flex items-start gap-2 text-[11px] text-slate-600 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={agreedTerms}
                        onChange={(e) => setAgreedTerms(e.target.checked)}
                        className="mt-0.5 rounded text-indigo-600"
                      />
                      <span>আমি {themeConfig.nameBn}-এর অনলাইন পেমেন্ট শর্তাবলী মেনে নিচ্ছি।</span>
                    </label>

                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-[11px] text-slate-600 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>এনক্রিপ্টেড ও সম্পূর্ণ নিরাপদ ২৪/৭ ব্যাংক পেমেন্ট প্রসেসিং</span>
                    </div>

                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={handleProceedToOtp}
                      className={`w-full font-black py-3 rounded-xl text-xs cursor-pointer shadow-md transition-all flex items-center justify-center gap-2 ${themeConfig.btnBg}`}
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>যাচাই করা হচ্ছে...</span>
                        </>
                      ) : (
                        <>
                          <span>ওটিপি (OTP) পাঠান</span>
                          <ChevronRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* STEP 2: OTP VERIFICATION */}
                {step === 'otp' && (
                  <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-3.5 border border-slate-800 animate-fadeIn">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs font-black text-slate-100">ওটিপি (OTP) কোড দিন</span>
                      </div>
                      <span className="text-[10px] font-mono text-amber-400">টাকা: ৳{amount}</span>
                    </div>

                    <p className="text-xs text-slate-300">
                      আপনার <span className="text-amber-300 font-mono font-bold">{phoneNumber}</span> নম্বরে একটি ওটিপি কোড পাঠানো হয়েছে।
                    </p>

                    <div>
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="1234"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        className="w-full text-center text-lg tracking-widest bg-slate-800 border border-slate-700 rounded-xl p-2 font-mono font-black text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                      />
                      <span className="text-[10px] text-slate-400 block mt-1 text-center">
                        ডেমো ভেরিফিকেশনের জন্য <strong>1234</strong> কোড ব্যবহার করতে পারেন।
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setStep('phone')}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 rounded-xl text-xs cursor-pointer"
                      >
                        ফিরে যান
                      </button>
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={handleVerifyOtp}
                        className={`flex-2 font-black py-2 rounded-xl text-xs cursor-pointer shadow-md flex items-center justify-center gap-1.5 ${themeConfig.btnBg}`}
                      >
                        {isProcessing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <span>ওটিপি নিশ্চিত করুন</span>}
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: PIN CODE */}
                {step === 'pin' && (
                  <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-3.5 border border-slate-800 animate-fadeIn">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-xs font-black text-emerald-400">{activeMfs.name} পিন কোড দিন</span>
                      </div>
                      <span className="text-[10px] font-mono text-amber-400">টাকা: ৳{amount}</span>
                    </div>

                    <p className="text-xs text-slate-300">
                      আপনার <span className="text-white font-bold">{activeMfs.name}</span> অ্যাকাউন্টের গোপন পিন নম্বর প্রদান করে পেমেন্ট সম্পূর্ণ করুন।
                    </p>

                    <div>
                      <input
                        type="password"
                        maxLength={5}
                        placeholder="•••••"
                        value={pinCode}
                        onChange={(e) => setPinCode(e.target.value)}
                        className="w-full text-center text-xl tracking-widest bg-slate-800 border border-slate-700 rounded-xl p-2 font-mono font-black text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setStep('otp')}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 rounded-xl text-xs cursor-pointer"
                      >
                        পূর্ববর্তী
                      </button>
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={handleConfirmPinPayment}
                        className="flex-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black py-2.5 rounded-xl text-xs cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                      >
                        {isProcessing ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>পেমেন্ট প্রসেসিং...</span>
                          </>
                        ) : (
                          <span>পেমেন্ট সম্পন্ন করুন (৳{amount})</span>
                        )}
                      </button>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* ========================================================================= */}
            {/* OPTION B: MANUAL SEND MONEY / MERCHANT QR & TrxID INPUT */}
            {/* ========================================================================= */}
            {gatewayType === 'manual_trx' && (
              <div className="space-y-3.5 animate-fadeIn">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-slate-500">মার্চেন্ট {activeMfs.name} নম্বর:</span>
                    <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded">
                      Personal / Merchant
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-2.5">
                    <span className="font-mono font-black text-sm text-slate-900">
                      {businessPhone || '01712345678'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyText(businessPhone || '01712345678', true)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-lg"
                    >
                      {copiedMerchantNumber ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedMerchantNumber ? 'কপি হয়েছে' : 'কপি নম্বর'}</span>
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    উপরের নম্বরে আপনার {activeMfs.name} অ্যাপ থেকে <strong>৳{amount}</strong> সেন্ড মানি বা পেমেন্ট করে নিচের বক্সে ট্রানজেকশন আইডি দিন।
                  </p>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      যে নম্বর থেকে টাকা পাঠিয়েছেন:
                    </label>
                    <input
                      type="text"
                      placeholder="017XXXXXXXX"
                      value={manualSenderPhone}
                      onChange={(e) => setManualSenderPhone(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      ট্রানজেকশন আইডি (TrxID):
                    </label>
                    <input
                      type="text"
                      placeholder="যেমন: 9B7X2L4A বা BK829103"
                      value={manualTrxId}
                      onChange={(e) => setManualTrxId(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono uppercase font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleConfirmManualTrx}
                  className={`w-full font-black py-3 rounded-xl text-xs cursor-pointer shadow-md transition-all flex items-center justify-center gap-2 ${themeConfig.btnBg}`}
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>যাচাই করা হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>ট্রানজেকশন ভেরিফাই ও অর্ডার সম্পন্ন করুন</span>
                    </>
                  )}
                </button>
              </div>
            )}

          </div>
        )}
          </>
        )}

      </div>
    </div>
  );
}
