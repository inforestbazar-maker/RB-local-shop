import React, { useState } from 'react';
import { 
  CreditCard, 
  Smartphone, 
  Building2, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Copy, 
  Check, 
  Printer, 
  ExternalLink,
  Lock,
  ChevronRight,
  Info,
  Layers,
  Sparkles,
  HelpCircle,
  RefreshCw
} from 'lucide-react';
import { 
  BANGLADESH_MFS_LIST, 
  BANGLADESH_BANKS_LIST, 
  BANGLADESH_CARD_PROVIDERS, 
  generateTrxID,
  BankDefinition,
  MFSDefinition
} from '../data/bangladeshFinancialData';
import { SavedBankAccount, WalletTransaction } from '../types';

interface FinancialTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'add_money' | 'withdraw_bank' | 'send_money' | 'receipt_view';
  walletBalance: number;
  onConfirmTransaction: (
    type: 'credit' | 'debit',
    category: 'add_money' | 'send_money' | 'bank_withdrawal',
    amount: number,
    title: string,
    method: string,
    channelDetails: any
  ) => Promise<void>;
  savedBankAccounts?: SavedBankAccount[];
  onSaveBankAccount?: (account: SavedBankAccount) => Promise<void>;
  selectedReceipt?: WalletTransaction | null;
  userPhone?: string;
  userName?: string;
}

export function FinancialTransactionModal({
  isOpen,
  onClose,
  mode,
  walletBalance,
  onConfirmTransaction,
  savedBankAccounts = [],
  onSaveBankAccount,
  selectedReceipt,
  userPhone = '',
  userName = ''
}: FinancialTransactionModalProps) {
  if (!isOpen) return null;

  // Add Money Tabs: 'mfs' | 'bank' | 'card'
  const [addMethodTab, setAddMethodTab] = useState<'mfs' | 'bank' | 'card'>('mfs');
  const [selectedMFS, setSelectedMFS] = useState<string>('bkash');
  const [selectedBankId, setSelectedBankId] = useState<string>('ibbl');
  const [selectedCardType, setSelectedCardType] = useState<string>('visa');

  // Transaction Inputs
  const [amount, setAmount] = useState<number>(mode === 'send_money' ? 200 : 500);
  const [mfsNumber, setMfsNumber] = useState<string>(userPhone || '');
  const [mfsOtp, setMfsOtp] = useState<string>('');
  const [mfsPin, setMfsPin] = useState<string>('');
  const [step, setStep] = useState<'form' | 'gateway_otp' | 'gateway_pin' | 'success'>('form');

  // Bank Add Money / Withdraw Inputs
  const [bankAccNumber, setBankAccNumber] = useState<string>('');
  const [bankAccTitle, setBankAccTitle] = useState<string>(userName || '');
  const [bankBranch, setBankBranch] = useState<string>('প্রধান কার্যালয়, ঢাকা');
  const [bankRouting, setBankRouting] = useState<string>('');
  const [bankTransferType, setBankTransferType] = useState<'instant_netbanking' | 'npsb_beftn'>('instant_netbanking');
  const [bankDepositRef, setBankDepositRef] = useState<string>('');
  const [saveThisBank, setSaveThisBank] = useState<boolean>(true);

  // Card Inputs
  const [cardNumber, setCardNumber] = useState<string>('');
  const [cardHolder, setCardHolder] = useState<string>(userName || '');
  const [cardExpiry, setCardExpiry] = useState<string>('');
  const [cardCvv, setCardCvv] = useState<string>('');

  // Send Money Inputs
  const [receiverPhone, setReceiverPhone] = useState<string>('');
  const [transferNote, setTransferNote] = useState<string>('');

  // Loading & Feedback
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [createdTransaction, setCreatedTransaction] = useState<WalletTransaction | null>(null);
  const [copiedTrx, setCopiedTrx] = useState<boolean>(false);

  // Quick Amount presets
  const presetAmounts = [200, 500, 1000, 2000, 5000];

  const currentSelectedBank = BANGLADESH_BANKS_LIST.find(b => b.id === selectedBankId) || BANGLADESH_BANKS_LIST[0];
  const currentSelectedMFS = BANGLADESH_MFS_LIST.find(m => m.id === selectedMFS) || BANGLADESH_MFS_LIST[0];

  // Helper to format card number
  const handleCardNumberChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '').substring(0, 16);
    const parts = [];
    for (let i = 0; i < cleaned.length; i += 4) {
      parts.push(cleaned.substring(i, i + 4));
    }
    setCardNumber(parts.join(' '));
  };

  // Helper to format expiry
  const handleExpiryChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '').substring(0, 4);
    if (cleaned.length >= 2) {
      setCardExpiry(`${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}`);
    } else {
      setCardExpiry(cleaned);
    }
  };

  // Process Add Money via MFS
  const handleProceedMfsGateway = () => {
    if (!amount || amount < 10) {
      setErrorMessage('ন্যূনতম ১০ টাকা যোগ করুন।');
      return;
    }
    if (!mfsNumber || mfsNumber.length < 11) {
      setErrorMessage('সঠিক ১১ ডিজিটের মোবাইল নম্বর প্রদান করুন।');
      return;
    }
    setErrorMessage('');
    setStep('gateway_otp');
  };

  const handleVerifyMfsOtp = () => {
    if (!mfsOtp || mfsOtp.length < 4) {
      setErrorMessage('সঠিক ৪ বা ৬ ডিজিটের ওটিপি (OTP) কোড দিন। (ডেমো কোড: 1234)');
      return;
    }
    setErrorMessage('');
    setStep('gateway_pin');
  };

  const handleCompleteMfsAddMoney = async () => {
    if (!mfsPin || mfsPin.length < 4) {
      setErrorMessage('আপনার অ্যাকাউন্টের পিন নম্বর প্রদান করুন।');
      return;
    }
    setIsProcessing(true);
    setErrorMessage('');

    try {
      const trxId = generateTrxID();
      const channelDetails = {
        provider: currentSelectedMFS.name,
        accountNumber: mfsNumber,
        trxId: trxId,
        fee: 0,
        senderPhone: mfsNumber
      };

      await onConfirmTransaction(
        'credit',
        'add_money',
        amount,
        `${currentSelectedMFS.name} থেকে অ্যাড মানি`,
        currentSelectedMFS.nameEn,
        channelDetails
      );

      const generatedTx: WalletTransaction = {
        id: `tx-${Date.now()}`,
        trxId: trxId,
        type: 'credit',
        category: 'add_money',
        title: `${currentSelectedMFS.name} থেকে অ্যাড মানি`,
        amount: amount,
        date: 'আজকে (এইমাত্র)',
        timestamp: Date.now(),
        method: currentSelectedMFS.nameEn,
        channelDetails: channelDetails,
        status: 'completed'
      };

      setCreatedTransaction(generatedTx);
      setStep('success');
    } catch (err: any) {
      setErrorMessage(err.message || 'লেনদেন সম্পন্ন করতে সমস্যা হয়েছে।');
    } finally {
      setIsProcessing(false);
    }
  };

  // Process Add Money via Bank
  const handleCompleteBankAddMoney = async () => {
    if (!amount || amount < 50) {
      setErrorMessage('ব্যাংক থেকে ন্যূনতম ৫০ টাকা যোগ করুন।');
      return;
    }
    if (!bankAccNumber || bankAccNumber.length < 6) {
      setErrorMessage('সঠিক ব্যাংক অ্যাকাউন্ট নম্বর দিন।');
      return;
    }
    if (!bankAccTitle.trim()) {
      setErrorMessage('অ্যাকাউন্টধারীর নাম (Account Title) আবশ্যক।');
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    try {
      const trxId = generateTrxID();
      const channelDetails = {
        provider: currentSelectedBank.name,
        bankName: currentSelectedBank.name,
        accountTitle: bankAccTitle,
        accountNumber: bankAccNumber,
        branchName: bankBranch,
        routingNumber: bankRouting || `${currentSelectedBank.routingPrefix}0000`,
        trxId: trxId,
        fee: 0
      };

      if (saveThisBank && onSaveBankAccount) {
        onSaveBankAccount({
          id: `saved-bank-${Date.now()}`,
          type: 'bank',
          providerName: currentSelectedBank.name,
          accountTitle: bankAccTitle,
          accountNumber: bankAccNumber,
          branchName: bankBranch,
          routingNumber: bankRouting || `${currentSelectedBank.routingPrefix}0000`,
          createdAt: new Date().toISOString()
        });
      }

      await onConfirmTransaction(
        'credit',
        'add_money',
        amount,
        `${currentSelectedBank.name} থেকে অ্যাড মানি`,
        'Bank',
        channelDetails
      );

      const generatedTx: WalletTransaction = {
        id: `tx-${Date.now()}`,
        trxId: trxId,
        type: 'credit',
        category: 'add_money',
        title: `${currentSelectedBank.name} থেকে অ্যাড মানি`,
        amount: amount,
        date: 'আজকে (এইমাত্র)',
        timestamp: Date.now(),
        method: 'Bank Transfer',
        channelDetails: channelDetails,
        status: 'completed'
      };

      setCreatedTransaction(generatedTx);
      setStep('success');
    } catch (err: any) {
      setErrorMessage(err.message || 'ব্যাংক পেমেন্ট সম্পন্ন করতে সমস্যা হয়েছে।');
    } finally {
      setIsProcessing(false);
    }
  };

  // Process Add Money via Card
  const handleCompleteCardAddMoney = async () => {
    if (!amount || amount < 10) {
      setErrorMessage('ন্যূনতম ১০ টাকা যোগ করুন।');
      return;
    }
    const cleanNum = cardNumber.replace(/\s/g, '');
    if (cleanNum.length < 15) {
      setErrorMessage('সঠিক ১৬ ডিজিটের কার্ড নম্বর দিন।');
      return;
    }
    if (!cardExpiry || cardExpiry.length < 5) {
      setErrorMessage('সঠিক কার্ড মেয়াদ (MM/YY) দিন।');
      return;
    }
    if (!cardCvv || cardCvv.length < 3) {
      setErrorMessage('৩ ডিজিটের সিকিউরিটি কোড (CVV) দিন।');
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    try {
      const trxId = generateTrxID();
      const channelDetails = {
        provider: `${selectedCardType.toUpperCase()} Card`,
        accountNumber: `**** **** **** ${cleanNum.slice(-4)}`,
        accountTitle: cardHolder,
        trxId: trxId,
        fee: 0
      };

      await onConfirmTransaction(
        'credit',
        'add_money',
        amount,
        `${selectedCardType.toUpperCase()} কার্ড থেকে ডিপোজিট`,
        'Card',
        channelDetails
      );

      const generatedTx: WalletTransaction = {
        id: `tx-${Date.now()}`,
        trxId: trxId,
        type: 'credit',
        category: 'add_money',
        title: `${selectedCardType.toUpperCase()} কার্ড থেকে ডিপোজিট`,
        amount: amount,
        date: 'আজকে (এইমাত্র)',
        timestamp: Date.now(),
        method: 'Card',
        channelDetails: channelDetails,
        status: 'completed'
      };

      setCreatedTransaction(generatedTx);
      setStep('success');
    } catch (err: any) {
      setErrorMessage(err.message || 'কার্ড পেমেন্টে সমস্যা হয়েছে।');
    } finally {
      setIsProcessing(false);
    }
  };

  // Process Bank Withdrawal / Cashout
  const handleCompleteWithdrawal = async () => {
    if (!amount || amount <= 0) {
      setErrorMessage('সঠিক উত্তোলনের পরিমাণ দিন।');
      return;
    }
    if (amount > walletBalance) {
      setErrorMessage(`অপর্যাপ্ত ব্যালেন্স! আপনার সর্বোচ্চ ওয়ালেট ব্যালেন্স: ৳${walletBalance}`);
      return;
    }
    if (addMethodTab === 'bank') {
      if (!bankAccNumber || bankAccNumber.length < 6) {
        setErrorMessage('সঠিক ব্যাংক অ্যাকাউন্ট নম্বর দিন।');
        return;
      }
      if (!bankAccTitle.trim()) {
        setErrorMessage('অ্যাকাউন্টধারীর নাম (Account Title) আবশ্যক।');
        return;
      }
    } else {
      if (!mfsNumber || mfsNumber.length < 11) {
        setErrorMessage('সঠিক ১১ ডিজিটের বিকাশ/নগদ নম্বর দিন।');
        return;
      }
    }

    setIsProcessing(true);
    setErrorMessage('');

    try {
      const trxId = generateTrxID();
      const isBank = addMethodTab === 'bank';
      const provider = isBank ? currentSelectedBank.name : currentSelectedMFS.name;
      const channelDetails = {
        provider: provider,
        bankName: isBank ? currentSelectedBank.name : undefined,
        accountTitle: isBank ? bankAccTitle : userName,
        accountNumber: isBank ? bankAccNumber : mfsNumber,
        branchName: isBank ? bankBranch : undefined,
        routingNumber: isBank ? (bankRouting || `${currentSelectedBank.routingPrefix}0000`) : undefined,
        trxId: trxId,
        fee: 0
      };

      if (isBank && saveThisBank && onSaveBankAccount) {
        onSaveBankAccount({
          id: `saved-bank-${Date.now()}`,
          type: 'bank',
          providerName: currentSelectedBank.name,
          accountTitle: bankAccTitle,
          accountNumber: bankAccNumber,
          branchName: bankBranch,
          routingNumber: bankRouting || `${currentSelectedBank.routingPrefix}0000`,
          createdAt: new Date().toISOString()
        });
      }

      await onConfirmTransaction(
        'debit',
        'bank_withdrawal',
        amount,
        `${provider}-এ টাকা উত্তোলন / ট্রান্সফার`,
        isBank ? 'Bank Withdrawal' : currentSelectedMFS.nameEn,
        channelDetails
      );

      const generatedTx: WalletTransaction = {
        id: `tx-${Date.now()}`,
        trxId: trxId,
        type: 'debit',
        category: 'bank_withdrawal',
        title: `${provider}-এ টাকা উত্তোলন / ট্রান্সফার`,
        amount: amount,
        date: 'আজকে (এইমাত্র)',
        timestamp: Date.now(),
        method: isBank ? 'Bank' : currentSelectedMFS.nameEn,
        channelDetails: channelDetails,
        status: 'completed'
      };

      setCreatedTransaction(generatedTx);
      setStep('success');
    } catch (err: any) {
      setErrorMessage(err.message || 'উত্তোলন প্রক্রিয়াকরণে সমস্যা হয়েছে।');
    } finally {
      setIsProcessing(false);
    }
  };

  // Process Send Money
  const handleCompleteSendMoney = async () => {
    if (!receiverPhone || receiverPhone.length < 11) {
      setErrorMessage('সঠিক ১১ ডিজিটের প্রাপক মোবাইল নম্বর দিন।');
      return;
    }
    if (!amount || amount <= 0) {
      setErrorMessage('টাকার পরিমাণ দিন।');
      return;
    }
    if (amount > walletBalance) {
      setErrorMessage(`অপর্যাপ্ত ব্যালেন্স! আপনার ওয়ালেট ব্যালেন্স: ৳${walletBalance}`);
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    try {
      const trxId = generateTrxID();
      const channelDetails = {
        provider: 'RestBazar Wallet',
        receiverPhone: receiverPhone,
        senderPhone: userPhone,
        note: transferNote || 'ওয়ালেট ব্যালেন্স ট্রান্সফার',
        trxId: trxId,
        fee: 0
      };

      await onConfirmTransaction(
        'debit',
        'send_money',
        amount,
        `টাকা পাঠানো (${receiverPhone})`,
        'Wallet Transfer',
        channelDetails
      );

      const generatedTx: WalletTransaction = {
        id: `tx-${Date.now()}`,
        trxId: trxId,
        type: 'debit',
        category: 'send_money',
        title: `টাকা পাঠানো (${receiverPhone})`,
        amount: amount,
        date: 'আজকে (এইমাত্র)',
        timestamp: Date.now(),
        method: 'Wallet Transfer',
        channelDetails: channelDetails,
        status: 'completed'
      };

      setCreatedTransaction(generatedTx);
      setStep('success');
    } catch (err: any) {
      setErrorMessage(err.message || 'টাকা পাঠাতে সমস্যা হয়েছে।');
    } finally {
      setIsProcessing(false);
    }
  };

  // Copy Trx ID helper
  const handleCopyTrx = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTrx(true);
    setTimeout(() => setCopiedTrx(false), 2000);
  };

  // View Receipt mode
  const activeReceipt = selectedReceipt || createdTransaction;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 my-auto animate-scaleUp">
        
        {/* MODAL HEADER */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 text-amber-400">
              {mode === 'add_money' && <ArrowDownLeft className="w-5 h-5" />}
              {mode === 'withdraw_bank' && <Building2 className="w-5 h-5" />}
              {mode === 'send_money' && <ArrowUpRight className="w-5 h-5" />}
              {mode === 'receipt_view' && <ShieldCheck className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                {mode === 'add_money' && 'ওয়ালেটে টাকা যোগ (Add Money / Deposit)'}
                {mode === 'withdraw_bank' && 'ব্যাংক ও এমএফএস-এ টাকা উত্তোলন (Withdraw)'}
                {mode === 'send_money' && 'টাকা পাঠান (Send Money P2P)'}
                {mode === 'receipt_view' && 'অফিসিয়াল ডিজিটাল লেনদেন রসিদ (Money Receipt)'}
              </h3>
              <p className="text-[11px] text-slate-300">
                {mode === 'add_money' && 'বিকাশ, নগদ, রকেট, কার্ড বা যেকোনো ব্যাংক থেকে ইনস্ট্যান্ট জমা'}
                {mode === 'withdraw_bank' && 'যেকোনো ব্যাংক অ্যাকাউন্ট বা মোবাইল ব্যাংকিংয়ে ক্যাশ-আউট'}
                {mode === 'send_money' && 'যেকোনো ব্যবহারকারীকে ওয়ালেট টু ওয়ালেট ফ্রি ট্রান্সফার'}
                {mode === 'receipt_view' && 'ভেরিফাইড ও সিকিউর ট্রানজেকশন স্টেটমেন্ট'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ERROR NOTIFICATION */}
        {errorMessage && (
          <div className="bg-rose-50 border-b border-rose-200 px-5 py-2.5 flex items-center gap-2 text-rose-700 text-xs font-bold animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 1: DIGITAL RECEIPT / INVOICE (Success or Standalone View) */}
        {/* ========================================================================= */}
        {(step === 'success' || mode === 'receipt_view') && activeReceipt && (
          <div className="p-6 space-y-5">
            <div className="text-center space-y-1">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-base font-black text-slate-900">
                {step === 'success' ? 'লেনদেন সফলভাবে সম্পন্ন হয়েছে!' : 'ডিজিটাল ট্রানজেকশন ভাউচার'}
              </h4>
              <p className="text-xs text-slate-500">
                RestBazar Secure Pay Transaction Verification
              </p>
            </div>

            {/* Official Receipt Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3 relative overflow-hidden font-sans">
              <div className="flex justify-between items-center border-b border-slate-200/80 pb-3">
                <div className="flex items-center gap-2">
                  <span className="bg-indigo-600 text-white font-black text-[10px] px-2 py-0.5 rounded-md">
                    RESTBAZAR PAY
                  </span>
                  <span className="text-xs font-bold text-slate-700">Money Receipt</span>
                </div>
                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${
                  activeReceipt.type === 'credit' 
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                    : 'bg-rose-100 text-rose-800 border border-rose-300'
                }`}>
                  ● {activeReceipt.type === 'credit' ? 'ক্রেডিট / জমা (CREDIT)' : 'ডেবিট / কর্তন (DEBIT)'}
                </span>
              </div>

              {/* Amount Display */}
              <div className="text-center py-2 bg-white rounded-xl border border-slate-100 shadow-xs">
                <span className="text-xs text-slate-500 font-bold">লেনদেনের মোট পরিমাণ</span>
                <div className="text-3xl font-black text-slate-900 font-mono tracking-tight">
                  ৳ {activeReceipt.amount.toLocaleString('en-US')}
                </div>
                <span className="text-[10px] text-emerald-600 font-bold">সার্ভিস ফি: ৳০.০০ (ফ্রি)</span>
              </div>

              {/* Key Details Rows */}
              <div className="space-y-2 text-xs pt-1">
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-500">ট্রানজেকশন আইডি (TrxID)</span>
                  <div className="flex items-center gap-1.5 font-mono font-black text-indigo-700">
                    <span>{activeReceipt.trxId || activeReceipt.id}</span>
                    <button 
                      onClick={() => handleCopyTrx(activeReceipt.trxId || activeReceipt.id)}
                      className="text-slate-400 hover:text-indigo-600 cursor-pointer p-0.5"
                      title="কপি করুন"
                    >
                      {copiedTrx ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-500">পেমেন্ট চ্যানেল / মেথড</span>
                  <span className="font-bold text-slate-800">{activeReceipt.method || activeReceipt.title}</span>
                </div>

                {activeReceipt.channelDetails?.bankName && (
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-500">ব্যাংক ও শাখা</span>
                    <span className="font-bold text-slate-800 text-right">
                      {activeReceipt.channelDetails.bankName}
                      {activeReceipt.channelDetails.branchName && ` (${activeReceipt.channelDetails.branchName})`}
                    </span>
                  </div>
                )}

                {activeReceipt.channelDetails?.accountNumber && (
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-500">অ্যাকাউন্ট / মোবাইল নম্বর</span>
                    <span className="font-mono font-bold text-slate-800">{activeReceipt.channelDetails.accountNumber}</span>
                  </div>
                )}

                {activeReceipt.channelDetails?.accountTitle && (
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-500">অ্যাকাউন্ট হোল্ডার</span>
                    <span className="font-bold text-slate-800">{activeReceipt.channelDetails.accountTitle}</span>
                  </div>
                )}

                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-500">তারিখ ও সময়</span>
                  <span className="font-medium text-slate-700">{activeReceipt.date}</span>
                </div>

                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">স্ট্যাটাস</span>
                  <span className="text-emerald-600 font-black flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> ভেরিফাইড ও সফল
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => window.print()}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>রসিদ প্রিন্ট করুন</span>
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-200 transition-all cursor-pointer"
              >
                <span>বন্ধ করুন</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: ADD MONEY (DEPOSIT) FORM */}
        {/* ========================================================================= */}
        {step !== 'success' && mode === 'add_money' && (
          <div className="p-5 sm:p-6 space-y-5">
            {/* Payment Method Channels Selector */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">
                পেমেন্ট গেটওয়ে ও চ্যানেল নির্বাচন করুন
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setAddMethodTab('mfs')}
                  className={`py-2.5 px-3 rounded-2xl border text-center font-bold text-xs transition-all flex flex-col items-center gap-1 cursor-pointer ${
                    addMethodTab === 'mfs'
                      ? 'bg-pink-50 border-pink-500 text-pink-700 border-2 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Smartphone className="w-4 h-4 text-pink-600" />
                  <span>মোবাইল ব্যাংকিং (MFS)</span>
                  <span className="text-[9px] text-pink-500 font-normal">বিকাশ, নগদ, রকেট</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAddMethodTab('bank')}
                  className={`py-2.5 px-3 rounded-2xl border text-center font-bold text-xs transition-all flex flex-col items-center gap-1 cursor-pointer ${
                    addMethodTab === 'bank'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700 border-2 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  <span>যেকোনো ব্যাংক অ্যাকাউন্ট</span>
                  <span className="text-[9px] text-emerald-500 font-normal">সকল ব্যাংক ও iBanking</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAddMethodTab('card')}
                  className={`py-2.5 px-3 rounded-2xl border text-center font-bold text-xs transition-all flex flex-col items-center gap-1 cursor-pointer ${
                    addMethodTab === 'card'
                      ? 'bg-blue-50 border-blue-500 text-blue-700 border-2 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  <span>ডেবিট / ক্রেডিট কার্ড</span>
                  <span className="text-[9px] text-blue-500 font-normal">ভিসা, মাস্টারকার্ড</span>
                </button>
              </div>
            </div>

            {/* AMOUNT INPUT & PRESETS */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-700">টাকার পরিমাণ (Deposit Amount)</label>
                <span className="text-[11px] text-slate-400 font-mono">বর্তমান ওয়ালেট ব্যালেন্স: ৳{walletBalance}</span>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black text-slate-400">৳</span>
                <input
                  type="number"
                  min="10"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-base font-black font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="৫০০"
                />
              </div>

              {/* Preset buttons */}
              <div className="flex gap-2 pt-1">
                {presetAmounts.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setAmount(p)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      amount === p
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    +৳{p}
                  </button>
                ))}
              </div>
            </div>

            {/* SUB-SECTION A: MFS FORM & GATEWAY SIMULATION */}
            {addMethodTab === 'mfs' && (
              <div className="space-y-4 pt-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">MFS অপারেটর সিলেক্ট করুন</label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {BANGLADESH_MFS_LIST.map((mfs) => (
                      <button
                        key={mfs.id}
                        type="button"
                        onClick={() => setSelectedMFS(mfs.id)}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                          selectedMFS === mfs.id
                            ? `${mfs.bgColor} ${mfs.borderColor} ${mfs.textColor} border-2 shadow-xs`
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span className="text-xs font-black">{mfs.name}</span>
                        <span className="text-[9px] opacity-75">{mfs.ussd}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {step === 'form' && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        আপনার {currentSelectedMFS.name} অ্যাকাউন্ট নম্বর (১১ ডিজিট)
                      </label>
                      <input
                        type="text"
                        placeholder="01XXXXXXXXX"
                        value={mfsNumber}
                        onChange={(e) => setMfsNumber(e.target.value)}
                        className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold text-slate-900"
                      />
                    </div>

                    <div className="bg-pink-50/70 border border-pink-100 rounded-2xl p-3 text-[11px] text-pink-800 space-y-1">
                      <div className="font-bold flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-pink-600" />
                        <span>অটোমেটিক সিকিউর পেমেন্ট গেটওয়ে</span>
                      </div>
                      <p className="opacity-90">
                        পরবর্তী ধাপে আপনার {currentSelectedMFS.name} নম্বরে ওটিপি পাঠানো হবে এবং পিন দিয়ে ভেরিফাই করলেই তাৎক্ষণিক টাকা ওয়ালেটে যোগ হয়ে যাবে।
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleProceedMfsGateway}
                      className="w-full bg-pink-600 hover:bg-pink-700 text-white font-black py-3.5 rounded-2xl text-xs cursor-pointer shadow-md shadow-pink-200 transition-all flex items-center justify-center gap-2"
                    >
                      <span>{currentSelectedMFS.name} গেটওয়েতে যান (৳{amount})</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* MFS GATEWAY STEP 2: OTP */}
                {step === 'gateway_otp' && (
                  <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-4 border border-slate-800 animate-fadeIn">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-pulse" />
                        <span className="text-xs font-black text-pink-400">{currentSelectedMFS.name} সিকিউর ওটিপি ভেরিফিকেশন</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">টাকা: ৳{amount}</span>
                    </div>

                    <p className="text-xs text-slate-300">
                      আপনার <span className="text-amber-300 font-mono font-bold">{mfsNumber}</span> নম্বরে একটি ৬-ডিজিটের ভেরিফিকেশন কোড পাঠানো হয়েছে।
                    </p>

                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">ভেরিফিকেশন কোড (OTP)</label>
                      <input
                        type="text"
                        placeholder="1234"
                        value={mfsOtp}
                        onChange={(e) => setMfsOtp(e.target.value)}
                        className="w-full text-center text-lg tracking-widest bg-slate-800 border border-slate-700 rounded-xl p-2.5 font-mono font-black text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                      />
                      <span className="text-[10px] text-slate-400 block mt-1">টেস্টিংয়ের জন্য যেকোনো ৪ ডিজিট কোড (যেমন: 1234) দিতে পারেন।</span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setStep('form')}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-xs cursor-pointer"
                      >
                        ফিরে যান
                      </button>
                      <button
                        type="button"
                        onClick={handleVerifyMfsOtp}
                        className="flex-2 bg-pink-600 hover:bg-pink-700 text-white font-black py-2.5 rounded-xl text-xs cursor-pointer shadow-md"
                      >
                        ওটিপি নিশ্চিত করুন
                      </button>
                    </div>
                  </div>
                )}

                {/* MFS GATEWAY STEP 3: PIN */}
                {step === 'gateway_pin' && (
                  <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-4 border border-slate-800 animate-fadeIn">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-xs font-black text-emerald-400">{currentSelectedMFS.name} পিন দিয়ে নিশ্চিত করুন</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">টাকা: ৳{amount}</span>
                    </div>

                    <p className="text-xs text-slate-300">
                      আপনার <span className="text-white font-bold">{currentSelectedMFS.name}</span> অ্যাকাউন্টের গোপন পিন নম্বর প্রদান করে লেনদেন সম্পূর্ণ করুন।
                    </p>

                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">আপনার গোপন পিন (PIN)</label>
                      <input
                        type="password"
                        maxLength={5}
                        placeholder="•••••"
                        value={mfsPin}
                        onChange={(e) => setMfsPin(e.target.value)}
                        className="w-full text-center text-xl tracking-widest bg-slate-800 border border-slate-700 rounded-xl p-2.5 font-mono font-black text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setStep('gateway_otp')}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-xs cursor-pointer"
                      >
                        পূর্ববর্তী
                      </button>
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={handleCompleteMfsAddMoney}
                        className="flex-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black py-2.5 rounded-xl text-xs cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                      >
                        {isProcessing ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>প্রসেসিং হচ্ছে...</span>
                          </>
                        ) : (
                          <span>পেমেন্ট সম্পূর্ণ করুন (৳{amount})</span>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SUB-SECTION B: BANK ACCOUNT FORM */}
            {addMethodTab === 'bank' && (
              <div className="space-y-4 pt-1">
                {/* Bank Select Dropdown */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    ব্যাংক নির্বাচন করুন (Select Bangladeshi Bank)
                  </label>
                  <select
                    value={selectedBankId}
                    onChange={(e) => {
                      setSelectedBankId(e.target.value);
                      const b = BANGLADESH_BANKS_LIST.find(x => x.id === e.target.value);
                      if (b && b.branches.length > 0) {
                        setBankBranch(b.branches[0]);
                        setBankRouting(`${b.routingPrefix}0000`);
                      }
                    }}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-900 cursor-pointer"
                  >
                    {BANGLADESH_BANKS_LIST.map((bank) => (
                      <option key={bank.id} value={bank.id}>
                        {bank.name} ({bank.nameEn})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Bank Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">অ্যাকাউন্টধারীর নাম (Account Title)</label>
                    <input
                      type="text"
                      placeholder="যেমন: মো: আরিফুল ইসলাম"
                      value={bankAccTitle}
                      onChange={(e) => setBankAccTitle(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">ব্যাংক অ্যাকাউন্ট নম্বর</label>
                    <input
                      type="text"
                      placeholder="যেমন: 20501234567890"
                      value={bankAccNumber}
                      onChange={(e) => setBankAccNumber(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold text-slate-900"
                    />
                  </div>
                </div>

                {/* Branch Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">শাখা (Branch Name)</label>
                    <select
                      value={bankBranch}
                      onChange={(e) => setBankBranch(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold cursor-pointer"
                    >
                      {currentSelectedBank.branches.map((br) => (
                        <option key={br} value={br}>{br}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">রাউটিং নম্বর (ঐচ্ছিক)</label>
                    <input
                      type="text"
                      placeholder={`${currentSelectedBank.routingPrefix}0000`}
                      value={bankRouting}
                      onChange={(e) => setBankRouting(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono"
                    />
                  </div>
                </div>

                {/* Transfer Channel Badge */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-xs text-emerald-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>ইন্টারনেট ব্যাংকিং ও এনপিএসবি (NPSB / BEFTN) ইনস্ট্যান্ট ক্লিয়ারিং</span>
                  </div>
                  <p className="text-[11px] text-emerald-700">
                    {currentSelectedBank.name}-এর {currentSelectedBank.portalName} পোর্টাল ও ন্যাশনাল পেমেন্ট সুইচের মাধ্যমে আপনার টাকা সরাসরি ওয়ালেটে ক্রেডিট হবে।
                  </p>
                </div>

                {/* Save Bank Account Checkbox */}
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={saveThisBank}
                    onChange={(e) => setSaveThisBank(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <span>ভবিষ্যতে দ্রুত ব্যবহারের জন্য এই ব্যাংক অ্যাকাউন্টটি সেভ রাখুন</span>
                </label>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleCompleteBankAddMoney}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black py-3.5 rounded-2xl text-xs cursor-pointer shadow-md shadow-emerald-200 transition-all flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>ব্যাংক প্রসেসিং চলছে...</span>
                    </>
                  ) : (
                    <span>ব্যাংক থেকে ডিপোজিট সম্পূর্ণ করুন (৳{amount})</span>
                  )}
                </button>
              </div>
            )}

            {/* SUB-SECTION C: CARD FORM */}
            {addMethodTab === 'card' && (
              <div className="space-y-4 pt-1">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">কার্ডের ধরন সিলেক্ট করুন</label>
                  <div className="grid grid-cols-3 gap-2">
                    {BANGLADESH_CARD_PROVIDERS.map((card) => (
                      <button
                        key={card.id}
                        type="button"
                        onClick={() => setSelectedCardType(card.id)}
                        className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                          selectedCardType === card.id
                            ? `${card.color} border-2 shadow-xs`
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {card.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">কার্ড নম্বর (১৬ ডিজিট)</label>
                    <input
                      type="text"
                      placeholder="XXXX XXXX XXXX XXXX"
                      value={cardNumber}
                      onChange={(e) => handleCardNumberChange(e.target.value)}
                      className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold text-slate-900"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">মেয়াদ (MM/YY)</label>
                      <input
                        type="text"
                        placeholder="12/28"
                        value={cardExpiry}
                        onChange={(e) => handleExpiryChange(e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">CVV / CVC কোড</label>
                      <input
                        type="password"
                        maxLength={4}
                        placeholder="•••"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold text-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">কার্ডহোল্ডারের নাম</label>
                    <input
                      type="text"
                      placeholder="যেমন: MD ARIFUL ISLAM"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold uppercase text-slate-900"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleCompleteCardAddMoney}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black py-3.5 rounded-2xl text-xs cursor-pointer shadow-md shadow-blue-200 transition-all flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>3D সিকিউর ভেরিফিকেশন চলছে...</span>
                    </>
                  ) : (
                    <span>কার্ড দিয়ে ডিপোজিট করুন (৳{amount})</span>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: WITHDRAWAL / CASHOUT TO BANK OR MFS */}
        {/* ========================================================================= */}
        {step !== 'success' && mode === 'withdraw_bank' && (
          <div className="p-5 sm:p-6 space-y-5">
            {/* Balance Preview Card */}
            <div className="bg-slate-900 text-white rounded-2xl p-4 flex justify-between items-center">
              <div>
                <span className="text-[11px] text-slate-400 block font-bold">উত্তোলনযোগ্য ওয়ালেট ব্যালেন্স</span>
                <span className="text-2xl font-black text-amber-300 font-mono">৳ {walletBalance.toLocaleString('en-US')}</span>
              </div>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-500/30">
                ইনস্ট্যান্ট ক্যাশআউট
              </span>
            </div>

            {/* Destination Channel Selector */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">কোথায় টাকা উত্তোলন করতে চান?</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAddMethodTab('bank')}
                  className={`py-3 px-3 rounded-2xl border text-center font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    addMethodTab === 'bank'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700 border-2 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  <span>ব্যাংক অ্যাকাউন্ট</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAddMethodTab('mfs')}
                  className={`py-3 px-3 rounded-2xl border text-center font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    addMethodTab === 'mfs'
                      ? 'bg-pink-50 border-pink-500 text-pink-700 border-2 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Smartphone className="w-4 h-4 text-pink-600" />
                  <span>বিকাশ / নগদ / রকেট</span>
                </button>
              </div>
            </div>

            {/* Amount */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">উত্তোলনের পরিমাণ (৳)</label>
              <input
                type="number"
                min="10"
                max={walletBalance}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full py-3 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-base font-black font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="যেমন: ১০০০"
              />
            </div>

            {/* If Bank selected */}
            {addMethodTab === 'bank' && (
              <div className="space-y-3">
                {/* Saved Banks dropdown if available */}
                {savedBankAccounts && savedBankAccounts.length > 0 && (
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">সংরক্ষিত ব্যাংক থেকে নির্বাচন করুন</label>
                    <div className="space-y-1.5">
                      {savedBankAccounts.map((sb) => (
                        <div
                          key={sb.id}
                          onClick={() => {
                            setBankAccNumber(sb.accountNumber);
                            setBankAccTitle(sb.accountTitle);
                            if (sb.branchName) setBankBranch(sb.branchName);
                          }}
                          className="p-2.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-xl cursor-pointer flex items-center justify-between text-xs transition-all"
                        >
                          <div className="font-bold text-slate-800">
                            <span>{sb.providerName}</span>
                            <span className="font-mono text-slate-500 block text-[10px]">Acc: {sb.accountNumber} ({sb.accountTitle})</span>
                          </div>
                          <span className="text-[10px] text-indigo-600 font-bold">সিলেক্ট করুন</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">ব্যাংক নাম</label>
                  <select
                    value={selectedBankId}
                    onChange={(e) => setSelectedBankId(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-slate-900"
                  >
                    {BANGLADESH_BANKS_LIST.map((bank) => (
                      <option key={bank.id} value={bank.id}>{bank.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">অ্যাকাউন্টধারীর নাম</label>
                    <input
                      type="text"
                      value={bankAccTitle}
                      onChange={(e) => setBankAccTitle(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">অ্যাকাউন্ট নম্বর</label>
                    <input
                      type="text"
                      value={bankAccNumber}
                      onChange={(e) => setBankAccNumber(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-bold"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={saveThisBank}
                    onChange={(e) => setSaveThisBank(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <span>এই ব্যাংক অ্যাকাউন্টটি পরবর্তীতে ব্যবহারের জন্য সংরক্ষণ করুন</span>
                </label>
              </div>
            )}

            {/* If MFS selected */}
            {addMethodTab === 'mfs' && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  {BANGLADESH_MFS_LIST.slice(0, 3).map((mfs) => (
                    <button
                      key={mfs.id}
                      type="button"
                      onClick={() => setSelectedMFS(mfs.id)}
                      className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                        selectedMFS === mfs.id
                          ? `${mfs.bgColor} ${mfs.borderColor} ${mfs.textColor} border-2`
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      {mfs.name}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    প্রাপক {currentSelectedMFS.name} নম্বর
                  </label>
                  <input
                    type="text"
                    placeholder="01XXXXXXXXX"
                    value={mfsNumber}
                    onChange={(e) => setMfsNumber(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono font-bold text-slate-900"
                  />
                </div>
              </div>
            )}

            <button
              type="button"
              disabled={isProcessing}
              onClick={handleCompleteWithdrawal}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black py-3.5 rounded-2xl text-xs cursor-pointer shadow-md shadow-emerald-200 transition-all flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>উত্তোলন প্রক্রিয়াকরণ হচ্ছে...</span>
                </>
              ) : (
                <span>টাকা উত্তোলন নিশ্চিত করুন (৳{amount})</span>
              )}
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 4: SEND MONEY (WALLET TO WALLET TRANSFER) */}
        {/* ========================================================================= */}
        {step !== 'success' && mode === 'send_money' && (
          <div className="p-5 sm:p-6 space-y-4">
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-3 text-xs text-indigo-900 flex items-center justify-between">
              <span className="font-bold">আপনার বর্তমান ব্যালেন্স:</span>
              <span className="font-mono font-black text-indigo-700">৳ {walletBalance}</span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">প্রাপকের মোবাইল নম্বর (Receiver Phone)</label>
              <input
                type="text"
                placeholder="01XXXXXXXXX"
                value={receiverPhone}
                onChange={(e) => setReceiverPhone(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">টাকার পরিমাণ (৳)</label>
              <input
                type="number"
                min="10"
                max={walletBalance}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full text-base bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono font-black text-slate-900 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">নোট বা রেফারেন্স (ঐচ্ছিক)</label>
              <input
                type="text"
                placeholder="যেমন: শপিং বিল বা উপহার"
                value={transferNote}
                onChange={(e) => setTransferNote(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800"
              />
            </div>

            <button
              type="button"
              disabled={isProcessing}
              onClick={handleCompleteSendMoney}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black py-3.5 rounded-2xl text-xs cursor-pointer shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>ট্রান্সফার হচ্ছে...</span>
                </>
              ) : (
                <span>টাকা পাঠান (৳{amount})</span>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

export default FinancialTransactionModal;
