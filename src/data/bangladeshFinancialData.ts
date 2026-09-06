export interface BankDefinition {
  id: string;
  name: string;
  nameEn: string;
  category: 'islamic' | 'private' | 'state' | 'foreign';
  portalName: string;
  portalApp: string;
  routingPrefix: string;
  logoColor: string;
  accentColor: string;
  branches: string[];
}

export interface MFSDefinition {
  id: string;
  name: string;
  nameEn: string;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  badge: string;
  ussd: string;
  appTitle: string;
}

export const BANGLADESH_MFS_LIST: MFSDefinition[] = [
  {
    id: 'bkash',
    name: 'বিকাশ',
    nameEn: 'bKash',
    color: '#D12053',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-500',
    textColor: 'text-pink-700',
    badge: 'সবচেয়ে জনপ্রিয়',
    ussd: '*247#',
    appTitle: 'bKash App / Payment Gateway'
  },
  {
    id: 'nagad',
    name: 'নগদ',
    nameEn: 'Nagad',
    color: '#F7941D',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-500',
    textColor: 'text-orange-700',
    badge: 'ডাক বিভাগ ডিজিটাল লেনদেন',
    ussd: '*167#',
    appTitle: 'Nagad Digital Financial Service'
  },
  {
    id: 'rocket',
    name: 'রকেট (DBBL)',
    nameEn: 'Rocket',
    color: '#8C3494',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-500',
    textColor: 'text-purple-700',
    badge: 'ডাচ-বাংলা মোবাইল ব্যাংকিং',
    ussd: '*322#',
    appTitle: 'Dutch-Bangla Rocket'
  },
  {
    id: 'upay',
    name: 'উপায় (UCB)',
    nameEn: 'Upay',
    color: '#00A859',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-500',
    textColor: 'text-emerald-700',
    badge: 'ইউসিবি ডিজিটাল ওয়ালেট',
    ussd: '*268#',
    appTitle: 'Upay Mobile Banking'
  },
  {
    id: 'cellfin',
    name: 'সেলফিন (Islami Bank)',
    nameEn: 'CellFin (IBBL)',
    color: '#007A3D',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-500',
    textColor: 'text-teal-700',
    badge: 'স্মার্ট ইসলামী ব্যাংকিং অ্যাপ',
    ussd: 'CellFin App',
    appTitle: 'IBBL CellFin Omnichannel'
  }
];

export const BANGLADESH_BANKS_LIST: BankDefinition[] = [
  {
    id: 'ibbl',
    name: 'ইসলামী ব্যাংক বাংলাদেশ পিএলসি',
    nameEn: 'Islami Bank Bangladesh PLC',
    category: 'islamic',
    portalName: 'iBanking / CellFin',
    portalApp: 'IBBL CellFin & iBanking',
    routingPrefix: '125',
    logoColor: 'bg-emerald-700 text-white',
    accentColor: '#007A3D',
    branches: ['প্রধান কার্যালয়, মতিঝিল', 'ধানমন্ডি শাখা, ঢাকা', 'গুলশান কর্পোরেট শাখা', 'উত্তরা শাখা', 'চট্টগ্রাম আগ্রাবাদ শাখা', 'সিলেট জিন্দাবাজার শাখা', 'রাজশাহী শাখা', 'খুলনা শাখা', 'বগুড়া শাখা']
  },
  {
    id: 'brac',
    name: 'ব্র্যাক ব্যাংক লিমিটেড',
    nameEn: 'BRAC Bank Limited',
    category: 'private',
    portalName: 'Astha App',
    portalApp: 'BRAC Bank Astha Internet Banking',
    routingPrefix: '060',
    logoColor: 'bg-blue-600 text-white',
    accentColor: '#00529B',
    branches: ['আসানিয়া মিশন শাখা, ধানমন্ডি', 'গুলশান এভিনিউ শাখা', 'মিরপুর ১০ শাখা', 'উত্তরা শাখা', 'বনানী শাখা', 'সিলেট শাখা', 'চট্টগ্রাম জিইসি শাখা', 'কক্সবাজার শাখা']
  },
  {
    id: 'dbbl',
    name: 'ডাচ-বাংলা ব্যাংক লিমিটেড (DBBL)',
    nameEn: 'Dutch-Bangla Bank Limited',
    category: 'private',
    portalName: 'NexusPay / Core Banking',
    portalApp: 'DBBL NexusPay & Internet Banking',
    routingPrefix: '090',
    logoColor: 'bg-orange-600 text-white',
    accentColor: '#E65100',
    branches: ['মতিঝিল প্রধান শাখা', 'ধানমন্ডি শাখা', 'এলিফ্যান্ট রোড শাখা', 'মিরপুর ১ শাখা', 'উত্তরা মডেল টাউন', 'চট্টগ্রাম আগ্রাবাদ', 'রংপুর শাখা', 'ময়মনসিংহ শাখা']
  },
  {
    id: 'city',
    name: 'দি সিটি ব্যাংক লিমিটেড',
    nameEn: 'The City Bank Limited',
    category: 'private',
    portalName: 'CityTouch',
    portalApp: 'CityTouch Digital Banking',
    routingPrefix: '225',
    logoColor: 'bg-red-700 text-white',
    accentColor: '#C8102E',
    branches: ['সিটি ব্যাংক হেড অফিস', 'ধানমন্ডি ২৭ শাখা', 'গুলশান ১ শাখা', 'বনানী শাখা', 'উত্তর বাড্ডা শাখা', 'চট্টগ্রাম আন্দরকিল্লা', 'সিলেট দরগাহ গেট']
  },
  {
    id: 'ebl',
    name: 'ইস্টার্ন ব্যাংক পিএলসি (EBL)',
    nameEn: 'Eastern Bank PLC',
    category: 'private',
    portalName: 'EBL Skybanking',
    portalApp: 'EBL Skybanking App',
    routingPrefix: '095',
    logoColor: 'bg-sky-600 text-white',
    accentColor: '#0284C7',
    branches: ['প্রিন্সিপাল ব্রাঞ্চ, দিলকুশা', 'ধানমন্ডি শাখা', 'গুলশান ২ শাখা', 'বসুন্ধরা শাখা', 'মিরপুর শাখা', 'চট্টগ্রাম নাসিরাবাদ', 'কুমিল্লা শাখা']
  },
  {
    id: 'sonali',
    name: 'সোনালী ব্যাংক পিএলসি',
    nameEn: 'Sonali Bank PLC',
    category: 'state',
    portalName: 'Sonali eSheba / e-Wallet',
    portalApp: 'Sonali eSheba & Internet Banking',
    routingPrefix: '200',
    logoColor: 'bg-amber-600 text-white',
    accentColor: '#D97706',
    branches: ['স্থানীয় কার্যালয়, মতিঝিল', 'ঢাকা বিশ্ববিদ্যালয় শাখা', 'ফার্মগেট শাখা', 'মিরপুর শাখা', 'সদরঘাট শাখা', 'চট্টগ্রাম লালদিঘী', 'রাজশাহী প্রধান শাখা', 'বরিশাল শাখা']
  },
  {
    id: 'mtb',
    name: 'মিউচুয়াল ট্রাস্ট ব্যাংক (MTB)',
    nameEn: 'Mutual Trust Bank Limited',
    category: 'private',
    portalName: 'MTB Smart Banking',
    portalApp: 'MTB Smart Banking App',
    routingPrefix: '145',
    logoColor: 'bg-rose-700 text-white',
    accentColor: '#BE123C',
    branches: ['এমটিবি সেন্টার, গুলশান', 'ধানমন্ডি শাখা', 'পান্থপথ শাখা', 'প্রগতি সরণি শাখা', 'চট্টগ্রাম জুবিলি রোড', 'সিলেট শাখা']
  },
  {
    id: 'pubali',
    name: 'পূবালী ব্যাংক পিএলসি',
    nameEn: 'Pubali Bank PLC',
    category: 'private',
    portalName: 'PI Banking',
    portalApp: 'Pubali PI Banking App',
    routingPrefix: '175',
    logoColor: 'bg-indigo-700 text-white',
    accentColor: '#4338CA',
    branches: ['প্রধান কার্যালয়, মতিঝিল', 'ধানমন্ডি শাখা', 'গুলশান শাখা', 'মৌলভীবাজার শাখা', 'সিলেট বন্দরবাজার', 'চট্টগ্রাম খাতুনগঞ্জ']
  },
  {
    id: 'bankasia',
    name: 'ব্যাংক এশিয়া লিমিটেড',
    nameEn: 'Bank Asia Limited',
    category: 'private',
    portalName: 'Smart App / iBanking',
    portalApp: 'Bank Asia Smart Banking',
    routingPrefix: '045',
    logoColor: 'bg-cyan-700 text-white',
    accentColor: '#0E7490',
    branches: ['কর্পোরেট অফিস, পুরানা পল্টন', 'ধানমন্ডি শাখা', 'গুলশান শাখা', 'উত্তরা শাখা', 'চট্টগ্রাম আগ্রাবাদ']
  },
  {
    id: 'ucb',
    name: 'ইউনাইটেড কমার্শিয়াল ব্যাংক (UCB)',
    nameEn: 'United Commercial Bank PLC',
    category: 'private',
    portalName: 'UCB UNET',
    portalApp: 'UCB UNET Internet Banking',
    routingPrefix: '215',
    logoColor: 'bg-emerald-600 text-white',
    accentColor: '#059669',
    branches: ['কর্পোরেট হেড অফিস, গুলশান', 'ধানমন্ডি শাখা', 'মতিঝিল শাখা', 'বনানী শাখা', 'চট্টগ্রাম চকবাজার']
  },
  {
    id: 'scb',
    name: 'স্ট্যান্ডার্ড চার্টার্ড ব্যাংক (SCB)',
    nameEn: 'Standard Chartered Bangladesh',
    category: 'foreign',
    portalName: 'SC Mobile',
    portalApp: 'SC Mobile Bangladesh',
    routingPrefix: '205',
    logoColor: 'bg-blue-800 text-white',
    accentColor: '#1E40AF',
    branches: ['প্রধান কার্যালয়, গুলশান ১', 'ধানমন্ডি রোড ৫ শাখা', 'উত্তরা শাখা', 'চট্টগ্রাম নাসিরাবাদ']
  },
  {
    id: 'dhakabank',
    name: 'ঢাকা ব্যাংক লিমিটেড',
    nameEn: 'Dhaka Bank Limited',
    category: 'private',
    portalName: 'Dhaka Bank Go',
    portalApp: 'Dhaka Bank Go App',
    routingPrefix: '085',
    logoColor: 'bg-teal-700 text-white',
    accentColor: '#0F766E',
    branches: ['প্রধান কার্যালয়, মতিঝিল', 'ধানমন্ডি শাখা', 'গুলশান শাখা', 'উত্তরা শাখা', 'চট্টগ্রাম শাখা']
  },
  {
    id: 'primebank',
    name: 'প্রাইম ব্যাংক পিএলসি',
    nameEn: 'Prime Bank PLC',
    category: 'private',
    portalName: 'Altitude Banking',
    portalApp: 'Prime Bank Altitude',
    routingPrefix: '170',
    logoColor: 'bg-violet-700 text-white',
    accentColor: '#6D28D9',
    branches: ['প্রধান কার্যালয়, মতিঝিল', 'ধানমন্ডি শাখা', 'বনানী শাখা', 'উত্তরা শাখা', 'চট্টগ্রাম শাখা']
  },
  {
    id: 'alarafah',
    name: 'আল-আরাফাহ ইসলামী ব্যাংক',
    nameEn: 'Al-Arafah Islami Bank PLC',
    category: 'islamic',
    portalName: 'AIBL i-Banking',
    portalApp: 'AIBL Islamic Banking App',
    routingPrefix: '015',
    logoColor: 'bg-green-700 text-white',
    accentColor: '#15803D',
    branches: ['প্রধান কার্যালয়, পুরানা পল্টন', 'ধানমন্ডি শাখা', 'মতিঝিল শাখা', 'উত্তরা শাখা', 'চট্টগ্রাম আগ্রাবাদ']
  },
  {
    id: 'janata',
    name: 'জনতা ব্যাংক পিএলসি',
    nameEn: 'Janata Bank PLC',
    category: 'state',
    portalName: 'eJanata',
    portalApp: 'eJanata Digital Banking',
    routingPrefix: '135',
    logoColor: 'bg-blue-700 text-white',
    accentColor: '#1D4ED8',
    branches: ['স্থানীয় কার্যালয়, মতিঝিল', 'ফার্মগেট শাখা', 'ধানমন্ডি শাখা', 'সদরঘাট শাখা', 'চট্টগ্রাম কর্পোরেট শাখা']
  },
  {
    id: 'otherbank',
    name: 'অন্যান্য যেকোনো তফসিলি ব্যাংক (Other Bank)',
    nameEn: 'Other Commercial Bank (NPSB/BEFTN)',
    category: 'private',
    portalName: 'National Payment Switch / BEFTN',
    portalApp: 'Internet Banking / EFT Transfer',
    routingPrefix: '999',
    logoColor: 'bg-slate-700 text-white',
    accentColor: '#334155',
    branches: ['প্রধান শাখা (Principal Branch)', 'স্থানীয় শাখা (Local Branch)', 'অনলাইন ক্লিয়ারিং (NPSB Transfer)']
  }
];

export const BANGLADESH_CARD_PROVIDERS = [
  { id: 'visa', name: 'ভিসা কার্ড (Visa)', logo: '💳 Visa', color: 'border-blue-600 text-blue-700 bg-blue-50' },
  { id: 'mastercard', name: 'মাস্টারকার্ড (MasterCard)', logo: '💳 MasterCard', color: 'border-rose-600 text-rose-700 bg-rose-50' },
  { id: 'nexus', name: 'ডাচ-বাংলা নেক্সাস (Nexus Card)', logo: '💳 Nexus', color: 'border-amber-600 text-amber-700 bg-amber-50' },
  { id: 'unionpay', name: 'ইউনিয়নপে (UnionPay)', logo: '💳 UnionPay', color: 'border-teal-600 text-teal-700 bg-teal-50' },
  { id: 'amex', name: 'আমেরিকান এক্সপ্রেস (Amex)', logo: '💳 Amex', color: 'border-indigo-600 text-indigo-700 bg-indigo-50' }
];

export function generateTrxID(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let trx = 'RB';
  for (let i = 0; i < 8; i++) {
    trx += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return trx;
}
