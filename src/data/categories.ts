import { BusinessCategory } from '../types';

export interface CategoryItem {
  id: BusinessCategory;
  nameBangla: string;
  nameEnglish: string;
  iconName: string;
  description: string;
  color: string;
}

export const CATEGORIES: CategoryItem[] = [
  {
    id: 'grocery',
    nameBangla: 'মুদি দোকান',
    nameEnglish: 'Grocery',
    iconName: 'ShoppingBag',
    description: 'নিত্যপ্রয়োজনীয় মুদি সামগ্রী ও হোম ডেলিভারি',
    color: 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100',
  },
  {
    id: 'pharmacy',
    nameBangla: 'ওষুধের দোকান',
    nameEnglish: 'Pharmacy',
    iconName: 'Pill',
    description: 'প্রেসক্রিপশন ওষুধ ও ফার্স্ট এইড সরঞ্জাম',
    color: 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100',
  },
  {
    id: 'electrician',
    nameBangla: 'ইলেকট্রিশিয়ান',
    nameEnglish: 'Electrician',
    iconName: 'Zap',
    description: 'এসি, ফ্রিজ, ফ্যান ও বাসার সকল ওয়্যারিং মেরামত',
    color: 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100',
  },
  {
    id: 'plumber',
    nameBangla: 'প্লাম্বার',
    nameEnglish: 'Plumber',
    iconName: 'Droplet',
    description: 'পানি লাইনের লিকেজ, ট্যাপ ও বেসিন ফিটিংস',
    color: 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100',
  },
  {
    id: 'mason',
    nameBangla: 'রাজমিস্ত্রি',
    nameEnglish: 'Mason',
    iconName: 'Hammer',
    description: 'ভবন নির্মাণ, ইটের গাঁথুনি ও প্লাস্টার কাজ',
    color: 'bg-orange-50 text-orange-600 border-orange-100 hover:bg-orange-100',
  },
  {
    id: 'restaurant',
    nameBangla: 'খাবারের দোকান',
    nameEnglish: 'Restaurant',
    iconName: 'Utensils',
    description: 'রেস্টুরেন্ট, ফাস্টফুড ও ঘরোয়া খাবার হোম ডেলিভারি',
    color: 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100',
  },
  {
    id: 'transport',
    nameBangla: 'রিকশা/পিকআপ ভাড়া',
    nameEnglish: 'Transport',
    iconName: 'Truck',
    description: 'পণ্য আনা-নেওয়া বা ভ্রমণের জন্য পিকআপ ও রিকশা',
    color: 'bg-purple-50 text-purple-600 border-purple-100 hover:bg-purple-100',
  },
  {
    id: 'tutor',
    nameBangla: 'টিউটর',
    nameEnglish: 'Tutor',
    iconName: 'GraduationCap',
    description: 'অভিজ্ঞ স্কুল, কলেজ ও বিশ্ববিদ্যালয়ের হোম টিউটর',
    color: 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100',
  },
  {
    id: 'parlor',
    nameBangla: 'বিউটি পার্লার',
    nameEnglish: 'Beauty Parlor',
    iconName: 'Scissors',
    description: 'ছেলে ও মেয়েদের রূপচর্চা, সাজসজ্জা ও হেয়ার কাট',
    color: 'bg-pink-50 text-pink-600 border-pink-100 hover:bg-pink-100',
  },
  {
    id: 'mechanic',
    nameBangla: 'মেকানিক',
    nameEnglish: 'Mechanic',
    iconName: 'Wrench',
    description: 'মোটরসাইকেল, গাড়ি ও বাইসাইকেল মেরামত',
    color: 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100',
  },
  {
    id: 'wholesale',
    nameBangla: 'পাইকারি দোকান',
    nameEnglish: 'Wholesale Shop',
    iconName: 'ShoppingBag',
    description: 'খুচরা দোকানদারদের জন্য বিশেষ পাইকারি রেটে পণ্য ও সরবরাহ',
    color: 'bg-teal-50 text-teal-600 border-teal-100 hover:bg-teal-100',
  },
];

export interface SubscriptionPlanItem {
  id: 'free' | 'silver' | 'gold' | 'diamond';
  name: string;
  price: number;
  pricePeriod: string;
  features: string[];
  color: string;
  buttonStyle: string;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlanItem[] = [
  {
    id: 'free',
    name: 'ফ্রি লিস্টিং (Free)',
    price: 0,
    pricePeriod: 'আজীবন',
    features: [
      'মৌলিক প্রোফাইল পেজ',
      'সার্ভিস/পণ্যের তালিকা (সর্বোচ্চ ৩টি)',
      'সরাসরি কল ও হোয়াটসঅ্যাপ সুবিধা',
      '৫টি বুকিং বা অর্ডার প্রতি মাসে',
    ],
    color: 'border-slate-200 bg-white text-slate-900',
    buttonStyle: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
  },
  {
    id: 'silver',
    name: 'সিলভার প্ল্যান (Silver)',
    price: 499,
    pricePeriod: 'মাসিক',
    features: [
      'পণ্যের তালিকা (সর্বোচ্চ ১০টি)',
      'পছন্দসই লোগো ও ৫টি ছবি আপলোড',
      'অর্ডার ও কাস্টমার রিপোর্ট (বেসিক)',
      'আনলিমিটেড অনলাইন বুকিং',
      'সহজ কুপন কোড ও অফার যোগ',
    ],
    color: 'border-blue-200 bg-blue-50/30 text-blue-900',
    buttonStyle: 'bg-blue-600 text-white hover:bg-blue-700',
  },
  {
    id: 'gold',
    name: 'গোল্ড প্ল্যান (Gold)',
    price: 999,
    pricePeriod: 'মাসিক',
    features: [
      'পণ্যের তালিকা (সর্বোচ্চ ৩০টি)',
      'লোগো ও ১৫টি চমৎকার ফটো গ্যালারি',
      'অ্যাডমিন ড্যাশবোর্ডে টপ লিস্টিং',
      '১টি ফ্রি হোমপেজ ব্যানার বিজ্ঞাপন',
      'AI বর্ণনা লেখার জাদুকরী সুবিধা',
      'বিস্তারিত বিক্রির ও আয়ের গ্রাফ রিপোর্ট',
    ],
    color: 'border-amber-300 bg-amber-50/50 text-amber-900 ring-2 ring-amber-400',
    buttonStyle: 'bg-amber-500 text-white hover:bg-amber-600',
  },
  {
    id: 'diamond',
    name: 'ডায়মন্ড ভিআইপি (Diamond)',
    price: 1999,
    pricePeriod: 'মাসিক',
    features: [
      'আনলিমিটেড পণ্য/সার্ভিস তালিকা',
      'সর্বোচ্চ প্রায়োরিটি সার্চ বুস্টিং',
      '৩টি ক্যাটাগরি ও টপ সার্চ বিজ্ঞাপন',
      'মাসিক আনলিমিটেড হোয়াটসঅ্যাপ নোটিফিকেশন',
      'অফিশিয়াল ভেরিফাইড ব্যাজ (Verified Badge)',
      'সার্বক্ষণিক কাস্টমার কেয়ার সাপোর্ট',
    ],
    color: 'border-purple-300 bg-purple-50/30 text-purple-900',
    buttonStyle: 'bg-purple-600 text-white hover:bg-purple-700',
  },
];
