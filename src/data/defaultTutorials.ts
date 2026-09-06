import { SellerTutorial } from '../types';

export const DEFAULT_SELLER_TUTORIALS: SellerTutorial[] = [
  {
    id: 'tut-1',
    title: '১. মোবাইল দিয়ে নতুন পণ্য/সেবা যুক্ত ও আকর্ষণীয় ছবি আপলোডের নিয়ম',
    category: 'product_upload',
    categoryLabel: 'পণ্য ও সেবা আপলোড',
    description: 'সহজেই স্মার্টফোন থেকে আপনার দোকানের মুদি, পোশাক, ইলেকট্রনিক্স বা যে কোনো পণ্য/সেবা লাইভ করুন। টাইটেল, সঠিক ক্যাটাগরি, বিক্রয়মূল্য ও এআই দিয়ে বিবরণ লিখার সম্পূর্ণ নির্দেশিকা।',
    videoUrl: 'https://www.youtube.com/watch?v=ysz5S6PUM-U',
    thumbnail: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800',
    duration: '৩ মিনিট ২০ সেকেন্ড',
    authorName: 'RestBazar Merchant Support',
    authorRole: 'অফিশিয়াল বিক্রেতা ট্রেনিং',
    images: [
      'https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=800'
    ],
    tags: ['পণ্য আপলোড', 'মোবাইল ক্যামেরা', 'এআই বিবরণ', 'দোকান সাজানো'],
    createdAt: '2026-08-01T10:00:00.000Z',
    views: 1420,
    likes: 215,
    steps: [
      {
        id: 's1-1',
        stepNumber: 1,
        title: 'ড্যাশবোর্ডের "পণ্য যোগ করুন" মেন্যুতে যান',
        description: 'মার্চেন্ট ড্যাশবোর্ডে গিয়ে বাম পাশের সাইডবার থেকে "➕ পণ্য যোগ করুন (Add Product)" ট্যাবে ট্যাপ করুন।',
        image: 'https://images.unsplash.com/photo-1556742049-0a67e5572293?auto=format&fit=crop&q=80&w=600',
        keyTip: 'প্রথমে টাইটেল দিয়ে সার্চ করে নিশ্চিত হোন পণ্যটি আগে থেকেই দোকানে আছে কিনা।'
      },
      {
        id: 's1-2',
        stepNumber: 2,
        title: 'পণ্যের নাম ও ন্যায্য বিক্রয়মূল্য নির্ধারণ করুন',
        description: 'পণ্যের স্পষ্ট নাম ও ওজন/পরিমাণ লিখুন (যেমন: মিনিকেট চাল ১ কেজি)। বর্তমান বিক্রয়মূল্য এবং চাইলে পূর্বের মূল্য (ডিসকাউন্ট হিসেবে) লিখুন।',
        image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=600',
        keyTip: 'মূল্য নির্ধারণের সময় প্রতিযোগী দোকানের বাজারদর বিবেচনা করুন।'
      },
      {
        id: 's1-3',
        stepNumber: 3,
        title: 'ক্যামেরা দিয়ে সরাসরি ফ্রেশ ছবি তুলুন বা গ্যালারি থেকে দিন',
        description: 'ক্যামেরা অপশনে ট্যাপ করে পর্যাপ্ত আলোতে পণ্যের ক্লিয়ার ছবি তুলুন অথবা রেডিমেড ইমেজ প্রিসেট থেকে নির্বাচন করুন।',
        image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600',
        keyTip: 'সাদা বা পরিষ্কার ব্যাকগ্রাউন্ডে ছবি তুললে কাস্টমারদের আকর্ষণ বেশি থাকে।'
      },
      {
        id: 's1-4',
        stepNumber: 4,
        title: '✨ "এআই দিয়ে বিবরণ লিখুন" বাটনে ক্লিক করে সেভ করুন',
        description: 'বৈশিষ্ট্যের চিপস সিলেক্ট করে ১-ক্লিকে চমৎকার আকর্ষণীয় বিবরণ জেনারেট করুন এবং "তালিকায় যোগ করুন" বাটনে ক্লিক করে প্রকাশ করুন।',
        image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=600',
        keyTip: 'নতুন পণ্য যোগ করার পর প্রথম ২০টি স্লট সম্পূর্ণ ফ্রি!'
      }
    ]
  },
  {
    id: 'tut-2',
    title: '২. পাইকারি (Wholesale) বিক্রি শুরু ও ভলিউম টায়ার ডিসকাউন্ট সেটআপ',
    category: 'wholesale',
    categoryLabel: 'পাইকারি বিক্রি ও ডিসকাউন্ট',
    description: 'খুচরা বিক্রির পাশাপাশি একসাথে বেশি পরিমাণে (বুল্ক অর্ডার) পাইকারি বিক্রি করে ব্যবসার টার্নওভার বহুগুণ বাড়িয়ে নিন। নূন্যতম অর্ডার সংখ্যা ও টায়ার ভিত্তিক বিশেষ দরদামের সম্পূর্ণ কৌশল।',
    videoUrl: 'https://www.youtube.com/watch?v=7X8II6J-6mU',
    thumbnail: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=800',
    duration: '৪ মিনিট ১৫ সেকেন্ড',
    authorName: 'RestBazar B2B Commerce',
    authorRole: 'হোলসেল স্পেশালিস্ট',
    images: [
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&q=80&w=800'
    ],
    tags: ['পাইকারি বিক্রি', 'হোলসেল', 'টায়ার প্রাইসিং', 'বাল্ক অর্ডার'],
    createdAt: '2026-08-05T12:00:00.000Z',
    views: 980,
    likes: 184,
    steps: [
      {
        id: 's2-1',
        stepNumber: 1,
        title: 'পাইকারি মোড সক্রিয় করুন',
        description: 'সাইডবার থেকে "🏢 পাইকারি বিক্রি (Wholesale)" ট্যাবে ক্লিক করে আপনার দোকানকে পাইকারি বিক্রেতা হিসেবে অন করুন।',
        image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=600',
        keyTip: 'পাইকারি ও খুচরা উভয় মোড চালু রাখলে সাধারণ ও পাইকারি সব ক্রেতাই অর্ডার দিতে পারবে।'
      },
      {
        id: 's2-2',
        stepNumber: 2,
        title: 'পণ্যভিত্তিক পাইকারি মূল্য ও নূন্যতম অর্ডার কোয়ান্টিটি দিন',
        description: 'পণ্য এডিটে গিয়ে "পাইকারি বিক্রির সুবিধা চালু করুন" অন করে পাইকারি ইউনিট রেট এবং নূন্যতম অর্ডার সংখ্যা (যেমন ৫টি/১০টি) বসান।',
        image: 'https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&q=80&w=600',
        keyTip: 'বেশি অর্ডারে দাম কম থাকলে স্থানীয় ছোট খুচরা ব্যবসায়ীরা নিয়মিত আপনার কাছ থেকেই কিনবে।'
      },
      {
        id: 's2-3',
        stepNumber: 3,
        title: 'ভলিউম টায়ার ডিসকাউন্ট যুক্ত করুন',
        description: 'যেমন: ৫০ পিস কিনলে প্রতি পিস ৳ ৯০, ১০০ পিস কিনলে প্রতি পিস ৳ ৮৫—এভাবে টায়ার তৈরি করুন।',
        image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=600',
        keyTip: 'টায়ার ডিসকাউন্ট দিলে ক্রেতারা বাজেট বাড়িয়ে একসাথে বড় চালান কিনতে উৎসাহিত হয়।'
      }
    ]
  },
  {
    id: 'tut-3',
    title: '৩. নতুন কাস্টমার অর্ডার গ্রহণ, প্রসেসিং ও ফ্রি হোম ডেলিভারি চালুর নিয়ম',
    category: 'order_delivery',
    categoryLabel: 'অর্ডার ও ডেলিভারি',
    description: 'গ্রাহকের অর্ডার আসলে ফোনে সাথে সাথে কিভাবে এক্সেপ্ট করবেন, প্যাকেট রেডি করবেন এবং দ্রুততম সময়ে ডেলিভারি বা কাস্টমার পিক-আপ সম্পন্ন করবেন তার ধাপসমূহ।',
    videoUrl: 'https://www.youtube.com/watch?v=ysz5S6PUM-U',
    thumbnail: 'https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&q=80&w=800',
    duration: '২ মিনিট ৫০ সেকেন্ড',
    authorName: 'RestBazar Logistics',
    authorRole: 'ডেলিভারি ট্রেইনার',
    images: [
      'https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?auto=format&fit=crop&q=80&w=800'
    ],
    tags: ['অর্ডার গ্রহণ', 'ডেলিভারি', 'পেমেন্ট কনফার্ম', 'ক্যাশ অন ডেলিভারি'],
    createdAt: '2026-08-10T14:30:00.000Z',
    views: 1120,
    likes: 195,
    steps: [
      {
        id: 's3-1',
        stepNumber: 1,
        title: 'অর্ডার নোটিফিকেশন দেখে বুকিং এক্সেপ্ট করুন',
        description: 'শপ অর্ডারস ট্যাবে নতুন অর্ডার আসলে গ্রাহকের ঠিকানা ও পণ্য তালিকা যাচাই করে "✓ গ্রহণ করুন (Accept)" বাটনে ক্লিক করুন।',
        image: 'https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&q=80&w=600',
        keyTip: 'অর্ডারের সাথে সাথে কাস্টমারকে একটি কনফার্মেশন কল দিলে কাস্টমার অনেক খুশি হয়।'
      },
      {
        id: 's3-2',
        stepNumber: 2,
        title: 'পণ্য সুন্দরভাবে প্যাকেট করুন ও ডেলিভারির জন্য পাঠান',
        description: 'পণ্যগুলো ভালো মানের প্যাকেজিংয়ে প্রস্তুত করুন এবং আপনার ডেলিভারিম্যান বা কুরিয়ারে হস্তান্তর করুন।',
        image: 'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?auto=format&fit=crop&q=80&w=600',
        keyTip: 'প্যাকেটের উপর কাস্টমারের নাম, মোবাইল ও ক্যাশ অন ডেলিভারি টাকার অংক স্পষ্ট করে লিখুন।'
      },
      {
        id: 's3-3',
        stepNumber: 3,
        title: 'ডেলিভারি শেষে "সম্পন্ন" স্ট্যাটাস দিন',
        description: 'কাস্টমার পণ্য পেয়ে টাকা পরিশোধ করার পর ড্যাশবোর্ডে "✓ ডেলিভারি ও পেমেন্ট সম্পন্ন" বাটনে ক্লিক করুন।',
        image: 'https://images.unsplash.com/photo-1556742049-0a67e5572293?auto=format&fit=crop&q=80&w=600',
        keyTip: 'ডেলিভারি সম্পন্ন করার সাথে সাথে দোকানের মোট বিক্রয় ও আয় স্বয়ংক্রিয়ভাবে রিপোর্টে যোগ হবে।'
      }
    ]
  },
  {
    id: 'tut-4',
    title: '৪. ফেসবুক ও টিকটকে RestBazar ফ্রি রিলস প্রমোশন পাওয়ার সেরা টেকনিক',
    category: 'social_marketing',
    categoryLabel: 'সোশ্যাল মিডিয়া ও প্রমোশন',
    description: 'কোনো খরচ ছাড়াই আপনার দোকানের হট ডিল ও সেরা পণ্যগুলো কীভাবে RestBazar-এর অফিশিয়াল ফেসবুক পেজ ও টিকটক একাউন্টে ভাইরাল প্রমোশন হিসেবে তুলে ধরবেন।',
    videoUrl: 'https://www.youtube.com/watch?v=7X8II6J-6mU',
    thumbnail: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80&w=800',
    duration: '৩ মিনিট ৪৫ সেকেন্ড',
    authorName: 'RestBazar Media Lab',
    authorRole: 'ডিজিটাল মার্কেটিং এক্সপার্ট',
    images: [
      'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=800'
    ],
    tags: ['ফেসবুক প্রমোশন', 'টিকটক রিলস', 'ফ্রি বুস্টিং', 'ভাইরাল সেলস'],
    createdAt: '2026-08-12T09:00:00.000Z',
    views: 2150,
    likes: 380,
    steps: [
      {
        id: 's4-1',
        stepNumber: 1,
        title: 'সেরা আকর্ষণীয় পণ্য নির্বাচন করুন',
        description: 'যে পণ্যটির চাহিদা বেশি অথবা যেটিতে আপনি বিশেষ ডিসকাউন্ট দিচ্ছেন সেটি নির্বাচন করুন।',
        image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=600',
        keyTip: 'অফার বা ডিসকাউন্ট যুক্ত পণ্য সোশ্যাল মিডিয়ায় দ্রুত শেয়ার ও ভাইরাল হয়।'
      },
      {
        id: 's4-2',
        stepNumber: 2,
        title: '"📢 ফেসবুক/টিকটক প্রমোশন" ট্যাবে সাবমিট করুন',
        description: 'সাইডবার থেকে প্রমোশন ট্যাবে গিয়ে ড্রপডাউন থেকে আপনার পণ্য সিলেক্ট করে ১-ক্লিকে আবেদন সাবমিট করুন।',
        image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80&w=600',
        keyTip: 'আমাদের মিডিয়া টিম সরাসরি আপনার পণ্যের হাই-কোয়ালিটি ভিডিও বানিয়ে বুস্ট করবে।'
      }
    ]
  },
  {
    id: 'tut-5',
    title: '৫. বাকি খাতা (কাস্টমার লেজার) ও ডিজিটাল বকেয়া হিসাব রাখার নিয়ম',
    category: 'ledger',
    categoryLabel: 'বাকি খাতা ও লেজার',
    description: 'কাগজের খাতা হারিয়ে যাওয়ার ভয় ছাড়াই সব নিয়মিত কাস্টমারের নাম, ফোন নম্বর, বাকি হিসাব ও জমার হিসাব ডিজিটাল লেজারে সুরক্ষিত রাখুন।',
    videoUrl: 'https://www.youtube.com/watch?v=ysz5S6PUM-U',
    thumbnail: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=800',
    duration: '৩ মিনিট ১০ সেকেন্ড',
    authorName: 'RestBazar Business Tools',
    authorRole: 'অ্যাকাউন্টিং অ্যাডভাইজর',
    images: [
      'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&q=80&w=800'
    ],
    tags: ['বাকি খাতা', 'হিসাব খাতা', 'কাস্টমার লেজার', 'বকেয়া আদায়'],
    createdAt: '2026-08-14T11:20:00.000Z',
    views: 860,
    likes: 142,
    steps: [
      {
        id: 's5-1',
        stepNumber: 1,
        title: 'নতুন কাস্টমার নিবন্ধন করুন',
        description: '"👥 বাকি খাতা (Customer Book)" ট্যাবে গিয়ে "নতুন কাস্টমার যোগ করুন" বাটনে ট্যাপ করে কাস্টমারের নাম ও মোবাইল নম্বর লিখুন।',
        image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=600',
        keyTip: 'মোবাইল নম্বর যুক্ত রাখলে পরবর্তীতে ফোন দিয়ে বাকি তাগাদা দেওয়া সহজ হয়।'
      },
      {
        id: 's5-2',
        stepNumber: 2,
        title: 'বাকি দেওয়া বা আদায়ের সময় "৳ হিসাব খাতা" বাটনে আপডেট করুন',
        description: 'যখনি কাস্টমার বাকি নিবেন বা টাকা জমা দিবেন, ১ ক্লিকে তার বাকি টাকার ব্যালেন্স আপডেট করে নিন।',
        image: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&q=80&w=600',
        keyTip: 'ক্লাউডে ডেটা স্বয়ংক্রিয়ভাবে ব্যাকআপ থাকে, ফোন পরিবর্তন হলেও খাতা হারানোর ভয় নেই।'
      }
    ]
  },
  {
    id: 'tut-6',
    title: '৬. স্মার্টফোন ক্যামেরা দিয়ে প্রফেশনাল প্রোডাক্ট ফটো তোলার টিপস',
    category: 'photography',
    categoryLabel: 'প্রোডাক্ট ফটোগ্রাফি',
    description: 'কোনো দামি ক্যামেরা ছাড়াই সাধারণ মোবাইল দিয়ে আলো, অ্যাঙ্গেল এবং ব্যাকগ্রাউন্ড সাজিয়ে আকর্ষণীয় ক্যাটালগ ফটো তোলার নিয়ম।',
    videoUrl: 'https://www.youtube.com/watch?v=7X8II6J-6mU',
    thumbnail: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=800',
    duration: '৪ মিনিট',
    authorName: 'RestBazar Studio',
    authorRole: 'প্রোডাক্ট ফটোগ্রাফি মেন্টর',
    images: [
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&q=80&w=800'
    ],
    tags: ['ফটোগ্রাফি টিপস', 'মোবাইল ফটো', 'প্রোডাক্ট লাইটিং', 'ক্লিন ব্যাকগ্রাউন্ড'],
    createdAt: '2026-08-16T15:00:00.000Z',
    views: 1750,
    likes: 310,
    steps: [
      {
        id: 's6-1',
        stepNumber: 1,
        title: 'প্রাকৃতিক দিনের আলো বা পর্যাপ্ত লাইটে ছবি তুলুন',
        description: 'জানালা বা দরজার পাশে দিনের আলোতে ছবি তুললে পণ্যের আসল রঙ ফুটে ওঠে। সরাসরি ফ্ল্যাশ লাইট ব্যবহার এড়িয়ে চলুন।',
        image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=600',
        keyTip: 'ক্যামেরার লেন্স পরিষ্কার কাপড়ে মুছে নিলে ছবি অনেক বেশি শার্প ও চকচকে হয়।'
      },
      {
        id: 's6-2',
        stepNumber: 2,
        title: 'সাদা বা পরিষ্কার একরঙা ব্যাকগ্রাউন্ড ব্যবহার করুন',
        description: 'একটি সাদা আর্ট পেপার বা পরিষ্কার টেবিলের উপর পণ্য রেখে ছবি তুললে ক্রেতাদের চোখ সরাসরি পণ্যের দিকে আকৃষ্ট হয়।',
        image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&q=80&w=600',
        keyTip: 'পণ্যের একাধিক কোণ (সামনে, প্যাকেজিং, ব্র্যান্ড লেবেল) থেকে ছবি তুলুন।'
      }
    ]
  }
];
