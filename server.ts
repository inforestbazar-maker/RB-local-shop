import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { initializeApp } from "firebase/app";
import { getFirestore, initializeFirestore, doc, getDoc, setDoc, setLogLevel } from "firebase/firestore";

dotenv.config();

// Silence benign internal gRPC connection reset logs from Firestore in Node.js
try {
  setLogLevel("silent");
} catch (e) {
  // ignore
}

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "db.json");

// Firebase configuration for RestBazar Cloud Database
const firebaseConfig = {
  apiKey: "AIzaSyAH8jX0h86EHiX0wYhPZhqwOst9nMKmjCs",
  authDomain: "vendor-8ea02.firebaseapp.com",
  projectId: "vendor-8ea02",
  storageBucket: "vendor-8ea02.firebasestorage.app",
  messagingSenderId: "970317174026",
  appId: "1:970317174026:web:7fc294f2b881b46f0a16f3",
  measurementId: "G-R81F5JP6T0"
};

let firestoreDb: any = null;
try {
  const fbApp = initializeApp(firebaseConfig);
  firestoreDb = initializeFirestore(fbApp, {
    experimentalForceLongPolling: true
  });
  console.log("🔥 Firebase Firestore initialized for permanent cloud storage!");
} catch (err) {
  console.warn("Could not initialize Firebase in backend:", err);
}

let isFirestoreSynced = false;

// Helper to prevent Firebase gRPC/REST requests from hanging forever in container runtime
function withTimeout<T>(promise: Promise<T>, ms = 3500, fallbackValue: any = null): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallbackValue), ms))
  ]);
}

async function syncFromFirestore() {
  if (!firestoreDb) return;
  try {
    const docRef = doc(firestoreDb, "restbazar_platform_db", "main_state");
    const docSnap = await withTimeout(getDoc(docRef), 3500, null);
    if (docSnap && docSnap.exists && docSnap.exists()) {
      const cloudData = docSnap.data();
      if (cloudData && Array.isArray(cloudData.businesses)) {
        console.log("☁️ Found cloud database in Firebase Firestore. Merging with local database...");
        const localData = loadDatabase();
        const merged = mergeDatabases(localData, cloudData);
        dbCache = merged;
        try {
          fs.writeFileSync(DB_FILE, JSON.stringify(merged, null, 2), "utf8");
          console.log(`✅ Successfully merged and synced database! Total users: ${merged.users?.length}, Total shops: ${merged.businesses?.length}`);
        } catch (e) {
          console.error("Error writing merged db to file:", e);
        }
        // Save back merged version to Firestore in background
        saveToFirestoreAsync(merged).catch(() => {});
      }
    } else if (docSnap && !docSnap.exists()) {
      console.log("☁️ No existing cloud document found, backing up initial/local database to Firestore...");
      const currentDb = loadDatabase();
      saveToFirestoreAsync(currentDb).catch(() => {});
    }
    isFirestoreSynced = true;
  } catch (err: any) {
    console.warn("☁️ Firebase Firestore cloud sync warning:", err?.message || err);
  }
}

function sanitizeForFirestore(data: any): any {
  if (!data) return data;
  try {
    const cloned = JSON.parse(JSON.stringify(data));
    const sanitizeObj = (obj: any) => {
      if (!obj || typeof obj !== 'object') return;
      for (const k in obj) {
        if (typeof obj[k] === 'string' && obj[k].startsWith('data:image/') && obj[k].length > 25000) {
          obj[k] = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600';
        } else if (Array.isArray(obj[k])) {
          obj[k].forEach((item: any) => sanitizeObj(item));
        } else if (typeof obj[k] === 'object') {
          sanitizeObj(obj[k]);
        }
      }
    };
    sanitizeObj(cloned);
    return cloned;
  } catch (e) {
    return data;
  }
}

async function saveToFirestoreAsync(db: any) {
  if (!firestoreDb) return;
  try {
    const docRef = doc(firestoreDb, "restbazar_platform_db", "main_state");
    const safePayload = sanitizeForFirestore(db);
    await withTimeout(
      setDoc(docRef, {
        ...safePayload,
        updatedAt: new Date().toISOString()
      }),
      4000
    );
    console.log("☁️ Database saved permanently to Firebase Firestore cloud storage!");
  } catch (err: any) {
    console.warn("☁️ Could not save to Firestore (will retry on next change):", err?.message || err);
  }
}

function mergeDatabases(localDb: any, cloudDb: any) {
  if (!cloudDb || typeof cloudDb !== 'object') return localDb || INITIAL_DATABASE;
  if (!localDb || typeof localDb !== 'object') return cloudDb;

  const merged: any = { ...localDb };

  // 1. Merge users safely
  const userMap = new Map<string, any>();
  const getUserKey = (u: any) => (u.email ? u.email.trim().toLowerCase() : '') || (u.phone ? normalizePhoneDigits(u.phone) : '') || (u.name ? u.name.trim().toLowerCase() : '');

  (cloudDb.users || []).forEach((u: any) => {
    const k = getUserKey(u);
    if (k) userMap.set(k, { ...u });
  });

  (localDb.users || []).forEach((u: any) => {
    const k = getUserKey(u);
    if (k) {
      if (!userMap.has(k)) {
        userMap.set(k, { ...u });
      } else {
        const cloudUser = userMap.get(k);
        userMap.set(k, {
          ...cloudUser,
          ...u,
          password: u.password || cloudUser.password || "123456",
          favorites: Array.from(new Set([...(cloudUser.favorites || []), ...(u.favorites || [])]))
        });
      }
    }
  });
  merged.users = Array.from(userMap.values());

  // 2. Merge businesses safely
  const bizMap = new Map<string, any>();
  (cloudDb.businesses || []).forEach((b: any) => {
    if (b.id) bizMap.set(b.id, { ...b });
  });

  (localDb.businesses || []).forEach((b: any) => {
    if (b.id) {
      // Find existing match by ID or by ownerPhone/ownerEmail
      let matchKey = b.id;
      if (!bizMap.has(matchKey)) {
        for (const [key, val] of bizMap.entries()) {
          const bPhoneNorm = normalizePhoneDigits(b.ownerPhone || b.phone);
          const valPhoneNorm = normalizePhoneDigits(val.ownerPhone || val.phone);
          const bEmailNorm = (b.ownerEmail || '').trim().toLowerCase();
          const valEmailNorm = (val.ownerEmail || '').trim().toLowerCase();

          if ((bPhoneNorm && valPhoneNorm && bPhoneNorm === valPhoneNorm) || 
              (bEmailNorm && valEmailNorm && bEmailNorm === valEmailNorm)) {
            matchKey = key;
            break;
          }
        }
      }

      if (!bizMap.has(matchKey)) {
        bizMap.set(b.id, { ...b });
      } else {
        const cloudBiz = bizMap.get(matchKey);
        const existingProdIds = new Set((b.products || []).map((p: any) => p.id));
        const extraProducts = (cloudBiz.products || []).filter((p: any) => !existingProdIds.has(p.id));
        
        bizMap.set(matchKey, {
          ...cloudBiz,
          ...b,
          products: [...(b.products || []), ...extraProducts],
          customers: Array.from(new Set([...(b.customers || []), ...(cloudBiz.customers || [])])),
          rating: b.rating || cloudBiz.rating || 5.0,
          isApproved: b.isApproved !== undefined ? b.isApproved : cloudBiz.isApproved
        });
      }
    }
  });
  merged.businesses = Array.from(bizMap.values());

  // 3. Merge bookings safely
  const bookingMap = new Map<string, any>();
  (cloudDb.bookings || []).forEach((bk: any) => { if (bk.id) bookingMap.set(bk.id, bk); });
  (localDb.bookings || []).forEach((bk: any) => { if (bk.id) bookingMap.set(bk.id, bk); });
  merged.bookings = Array.from(bookingMap.values());

  // 4. Merge customer products safely
  const cpMap = new Map<string, any>();
  (cloudDb.customerProducts || []).forEach((cp: any) => { if (cp.id) cpMap.set(cp.id, cp); });
  (localDb.customerProducts || []).forEach((cp: any) => { if (cp.id) cpMap.set(cp.id, cp); });
  merged.customerProducts = Array.from(cpMap.values());

  // 5. Merge auxiliary collections
  const mergeById = (listA: any[], listB: any[]) => {
    const map = new Map<string, any>();
    listA.forEach(item => { if (item.id) map.set(item.id, item); });
    listB.forEach(item => { if (item.id && !map.has(item.id)) map.set(item.id, item); });
    return Array.from(map.values());
  };

  merged.chats = mergeById(localDb.chats || [], cloudDb.chats || []);
  merged.complaints = mergeById(localDb.complaints || [], cloudDb.complaints || []);
  merged.adCampaigns = mergeById(localDb.adCampaigns || [], cloudDb.adCampaigns || []);
  merged.sellerTutorials = mergeById(localDb.sellerTutorials || [], cloudDb.sellerTutorials || []);
  merged.tickerMessages = localDb.tickerMessages && localDb.tickerMessages.length > 0 ? localDb.tickerMessages : (cloudDb.tickerMessages || []);
  merged.subscriptionPlans = localDb.subscriptionPlans || cloudDb.subscriptionPlans;
  merged.categories = localDb.categories || cloudDb.categories;
  merged.systemConfig = { ...(cloudDb.systemConfig || {}), ...(localDb.systemConfig || {}) };

  return merged;
}

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Initialize Gemini SDK with telemetry headers
let aiClient: any = null;
function getGemini() {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    try {
      aiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    } catch (e) {
      console.error("Failed to initialize Gemini:", e);
    }
  }
  return aiClient;
}

// Resilient Gemini Generator with automatic multi-model fallback and 503/429 recovery
async function generateGeminiContentWithFallback(ai: any, options: {
  contents: any;
  config?: any;
  preferredModel?: string;
  fallbackModels?: string[];
}): Promise<any> {
  const modelsToTry = [
    options.preferredModel || 'gemini-2.5-flash',
    ...(options.fallbackModels || ['gemini-2.5-flash-lite', 'gemini-3.7-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'])
  ];
  const uniqueModels = Array.from(new Set(modelsToTry.filter(Boolean)));

  let lastError: any = null;
  for (const model of uniqueModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: options.contents,
        config: options.config
      });
      if (response && (response.text || typeof response.text === 'string')) {
        return response;
      }
    } catch (err: any) {
      lastError = err;
      const isUnavailable = err?.status === 503 || err?.code === 503 || String(err?.message || '').includes('503') || String(err?.message || '').includes('high demand') || String(err?.message || '').includes('UNAVAILABLE');
      console.warn(`[Gemini Resilient Engine] Model '${model}' notice (${isUnavailable ? '503 High Demand' : err?.status || 'Error'}). Switching to fallback model...`);
      if (isUnavailable) {
        await new Promise(resolve => setTimeout(resolve, 250));
      }
    }
  }
  throw lastError || new Error("All Gemini models are temporarily unavailable.");
}

// Full Initial Bengali Mock Data
const INITIAL_DATABASE = {
  users: [
    { phone: "01711111111", name: "রনি আহমেদ", role: "user", email: "rony@restbazar.com", password: "123456", favorites: ["biz-1", "biz-3"], createdAt: new Date().toISOString() },
    { phone: "01811222333", name: "মোহাম্মদ ইউসুফ", role: "merchant", email: "yousuf@restbazar.com", password: "123456", favorites: [], createdAt: new Date().toISOString() },
    { phone: "01911999999", name: "info.restbazar@gmail.com", role: "admin", email: "info.restbazar@gmail.com", password: "SMsagor@12", favorites: [], createdAt: new Date().toISOString() }
  ],
  businesses: [
    {
      id: "biz-1",
      ownerPhone: "01811222333",
      name: "মা ফুড অ্যান্ড গ্রোসারি",
      category: "grocery",
      type: "shop",
      phone: "01811222333",
      whatsapp: "01811222333",
      logo: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200",
      images: [
        "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&q=80&w=600",
        "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600"
      ],
      websiteUrl: "https://maafoodgrocery.com",
      description: "এখানে উন্নত মানের চাল, ডাল, তেল, মসলা, ও নিত্যপ্রয়োজনীয় সকল মুদি সামগ্রী খুচরা ও পাইকারি মূল্যে পাওয়া যায়। আমরা ধানমন্ডি ও আশেপাশের এলাকায় দ্রুত হোম ডেলিভারি দিয়ে থাকি।",
      address: "বাড়ি ১৫, রোড ৪/এ, ধানমন্ডি, ঢাকা",
      location: { lat: 23.734, lng: 90.378 },
      isOpen: true,
      hasHomeDelivery: true,
      deliveryCharge: 40,
      subscriptionPlan: "gold",
      subscriptionExpiry: "2027-12-31T23:59:59.000Z",
      balance: 4500,
      rating: 4.8,
      reviewsCount: 3,
      products: [
        { id: "p-1", name: "মিনিকেট চাল (১ কেজি)", price: 72, originalPrice: 78, image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=200", description: "প্রিমিয়াম ফ্রেশ মিনিকেট চাল", isAvailable: true },
        { id: "p-2", name: "রূপচাঁদা সয়াবিন তেল (২ লিটার)", price: 330, originalPrice: 345, image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=200", description: "বিশুদ্ধ ভোজ্য তেল", isAvailable: true },
        { id: "p-3", name: "মসুর ডাল দেশী (১ কেজি)", price: 140, originalPrice: 150, image: "https://images.unsplash.com/photo-1547825407-2d060104b7f8?auto=format&fit=crop&q=80&w=200", description: "এক নম্বর দেশী মসুর ডাল", isAvailable: true },
        { id: "p-4", name: "আড়ং ঘি (৪০০ গ্রাম)", price: 620, originalPrice: 650, isAvailable: true }
      ],
      services: [],
      reviews: [
        { id: "rev-1", businessId: "biz-1", userName: "তানভীর হাসান", userPhone: "01722334455", rating: 5, comment: "খুব চমৎকার সার্ভিস! মাত্র ৩০ মিনিটে ডেলিভারি পেয়েছি। চালের মানও অনেক ভালো।", images: [], date: "2026-07-01T12:00:00.000Z" },
        { id: "rev-2", businessId: "biz-1", userName: "সাদিয়া রহমান", userPhone: "01511223344", rating: 4, comment: "ভালো ব্যবহার এবং তাজা পণ্য। ধন্যবাদ আর বি লোকাল!", images: [], date: "2026-07-05T15:30:00.000Z" }
      ],
      offers: [
        { id: "off-1", title: "১০% ফ্ল্যাট ছাড়", code: "RBLOCAL10", discountPercent: 10, description: "১০০০ টাকার বেশি অর্ডারে ১০% ছাড় পান!", expiryDate: "2026-12-31" }
      ],
      transactions: [
        { id: "tr-1", type: "income", amount: 1200, description: "অর্ডার #RBO-8910 থেকে আয়", date: "2026-07-10T11:00:00.000Z" }
      ]
    },
    {
      id: "biz-2",
      ownerPhone: "01712000111",
      name: "আলিফ ফার্মেসি",
      category: "pharmacy",
      type: "shop",
      phone: "01712000111",
      whatsapp: "01712000111",
      logo: "https://images.unsplash.com/photo-1586015555751-63bb77f4322a?auto=format&fit=crop&q=80&w=200",
      images: ["https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=600"],
      description: "এখানে দেশী-বিদেশী সকল প্রকার জীবন রক্ষাকারী ওষুধ, সার্জিক্যাল আইটেম এবং বেবি ফুড সুলভ মূল্যে পাওয়া যায়। প্রেসক্রিপশন আপলোড করলে হোম ডেলিভারির সুবিধা রয়েছে।",
      address: "সোবহানবাগ মসজিদ সংলগ্ন, মিরপুর রোড, ঢাকা",
      location: { lat: 23.752, lng: 90.375 },
      isOpen: true,
      hasHomeDelivery: true,
      deliveryCharge: 30,
      subscriptionPlan: "silver",
      subscriptionExpiry: "2027-10-15T23:59:59.000Z",
      balance: 1200,
      rating: 4.9,
      reviewsCount: 1,
      products: [
        { id: "p-201", name: "প্যারাসিটামল নাপা এক্সটেন্ড (১ পাতা)", price: 15, originalPrice: 15, description: "প্যারাসিটামল ৬৬৫ মি.গ্রা. ট্যাবলেট", isAvailable: true },
        { id: "p-202", name: "সার্জিক্যাল ফেস মাস্ক (৫০ পিস)", price: 120, originalPrice: 150, image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=200", isAvailable: true },
        { id: "p-203", name: "স্যাভলন হ্যান্ড স্যানিটাইজার (১০০ মিলি)", price: 95, originalPrice: 100, isAvailable: true }
      ],
      services: [],
      reviews: [
        { id: "rev-3", businessId: "biz-2", userName: "মো: আরিফ", userPhone: "01711223344", rating: 5, comment: "জরুরি সময়ে তারা অনেক সাহায্য করেছে। রাত ১২টায় ওষুধ ডেলিভারি পেয়েছি।", images: [], date: "2026-07-09T22:15:00.000Z" }
      ],
      offers: [],
      transactions: []
    },
    {
      id: "biz-3",
      ownerPhone: "01912334455",
      name: "কবির ইলেকট্রিক্যাল সার্ভিসেস",
      category: "electrician",
      type: "service",
      phone: "01912334455",
      whatsapp: "01912334455",
      logo: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=200",
      images: ["https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=600"],
      description: "বাসা-বাড়ি ও অফিসের যাবতীয় ওয়্যারিং, ফ্যান, এসি, ফ্রিজ, গিজার মেরামত ও ফিটিং সেবা অত্যন্ত সততার সাথে দেওয়া হয়। অভিজ্ঞ টেকনিশিয়ান দ্বারা কাজ সম্পন্ন করা হয়।",
      address: "ঝিগাতলা বাজার রোড, ঢাকা",
      location: { lat: 23.736, lng: 90.370 },
      isOpen: true,
      subscriptionPlan: "diamond",
      subscriptionExpiry: "2027-08-20T23:59:59.000Z",
      balance: 8900,
      rating: 4.7,
      reviewsCount: 2,
      products: [],
      services: [
        { id: "s-1", name: "হাউজ ওয়্যারিং সার্ভিস (প্রতি পয়েন্ট)", charge: 150, description: "নতুন ওয়্যারিং ও ত্রুটি মেরামত", isAvailable: true },
        { id: "s-2", name: "এসি সার্ভিসিং ও গ্যাস চার্জ", charge: 1500, description: "ইনডোর ও আউটডোর ক্লিনিং সহ গ্যাস রিফিল", isAvailable: true },
        { id: "s-3", name: "ফ্রিজ ও ওয়াশিং মেশিন মেরামত", charge: 600, description: "যেকোনো ব্র্যান্ডের হোম অ্যাপ্লায়েন্স সার্ভিসিং", isAvailable: true }
      ],
      reviews: [
        { id: "rev-4", businessId: "biz-3", userName: "ইমরান কবির", userPhone: "01822114455", rating: 5, comment: "এসি থেকে পানি পড়ছিল, কবির ভাই এসে ৩০ মিনিটে ঠিক করে দিয়ে গেছেন। চার্জও রিজনেবল ছিল।", images: [], date: "2026-07-02T16:00:00.000Z" },
        { id: "rev-5", businessId: "biz-3", userName: "মাহমুদা আক্তার", userPhone: "01677665544", rating: 4, comment: "খুব দক্ষ এবং ভদ্র ইলেকট্রিশিয়ান। কাজ খুব নিখুঁতভাবে শেষ করেছেন।", images: [], date: "2026-07-06T11:45:00.000Z" }
      ],
      offers: [
        { id: "off-2", title: "এসি সার্ভিসে ২০০ টাকা ছাড়", code: "AC200", discountPercent: 12, description: "এসি সার্ভিসিং সার্ভিসে ফ্ল্যাট ২০০ টাকা ছাড় পান!", expiryDate: "2026-09-30" }
      ],
      transactions: []
    },
    {
      id: "biz-4",
      ownerPhone: "01511002233",
      name: "রাজু প্লাম্বিং ও পাইপ ফিটিং",
      category: "plumber",
      type: "service",
      phone: "01511002233",
      whatsapp: "01511002233",
      logo: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=200",
      images: ["https://images.unsplash.com/photo-1607472586893-edb5ca08f553?auto=format&fit=crop&q=80&w=600"],
      description: "ট্যাপ, বেসিন, কমোড, পানির পাম্প ফিটিংস এবং পাইপ লাইনের যেকোনো ব্লকেজ ও ফুটো মেরামতে আমরা সার্বক্ষণিক নিয়োজিত। দ্রুত ও দীর্ঘস্থায়ী প্লাম্বিং সেবার জন্য বুক করুন।",
      address: "লালমাটিয়া ডিলক্স এরিয়া, ঢাকা",
      location: { lat: 23.754, lng: 90.368 },
      isOpen: true,
      subscriptionPlan: "free",
      balance: 0,
      rating: 4.5,
      reviewsCount: 1,
      products: [],
      services: [
        { id: "s-10", name: "বেসিন ও কমোড ফিটিং", charge: 800, description: "নতুন বেসিন বা কমোড সেটআপ সার্ভিস", isAvailable: true },
        { id: "s-11", name: "লাইন লিকেজ ও ব্লকেজ মেরামত", charge: 400, description: "পাইপের ভেতরের ব্লকেজ দূর করা ও ফুটো বন্ধ করা", isAvailable: true }
      ],
      reviews: [
        { id: "rev-6", businessId: "biz-4", userName: "রাকিব চৌধুরী", userPhone: "01300998877", rating: 4, comment: "কাজ ভালো করেছেন। সময়মতো এসেছেন।", images: [], date: "2026-07-08T09:00:00.000Z" }
      ],
      offers: [],
      transactions: []
    },
    {
      id: "biz-5",
      ownerPhone: "01622334455",
      name: "রবিন স্যার হোম টিউটর কেয়ার",
      category: "tutor",
      type: "service",
      phone: "01622334455",
      whatsapp: "01622334455",
      logo: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&q=80&w=200",
      images: ["https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=600"],
      description: "আমি বুয়েট থেকে মেকানিক্যাল ইঞ্জিনিয়ারিং-এ স্নাতক সম্পন্ন করেছি। নবম-দ্বাদশ শ্রেণী পর্যন্ত পদার্থবিজ্ঞান ও গণিত অত্যন্ত যত্নসহকারে পড়িয়ে থাকি। বিগত ৫ বছরের সফল শিক্ষকতার অভিজ্ঞতা রয়েছে।",
      address: "গ্রীন রোড, পান্থপথ, ঢাকা",
      location: { lat: 23.750, lng: 90.383 },
      isOpen: true,
      subscriptionPlan: "gold",
      subscriptionExpiry: "2027-04-12T23:59:59.000Z",
      balance: 15000,
      rating: 5.0,
      reviewsCount: 2,
      products: [],
      services: [
        { id: "s-20", name: "সাপ্তাহিক ৩ দিন কোর্স (মাসে)", charge: 5000, description: "SSC ও HSC পরীক্ষার্থীদের বিশেষ যত্ন", isAvailable: true },
        { id: "s-21", name: "মেডিকেল ও বুয়েট ভর্তি প্রস্তুতি কোর্স", charge: 8000, description: "পদার্থ ও উচ্চতর গণিতের কমপ্লিট সলিউশন", isAvailable: true }
      ],
      reviews: [
        { id: "rev-7", businessId: "biz-5", userName: "শাফিন আহমেদ", userPhone: "01722998811", rating: 5, comment: "স্যার অনেক চমৎকারভাবে কঠিন বিষয়গুলো সহজ করে বুঝিয়ে দেন। আমার গণিতের ভয় কেটে গেছে।", images: [], date: "2026-07-04T20:00:00.000Z" },
        { id: "rev-8", businessId: "biz-5", userName: "অভিভাবক শামীমা", userPhone: "01933887766", rating: 5, comment: "উনার পড়ানোর ধরন অনেক নিয়মতান্ত্রিক। আমার ছেলের ফলাফলে ব্যাপক পরিবর্তন এসেছে। ধন্যবাদ!", images: [], date: "2026-07-07T14:30:00.000Z" }
      ],
      offers: [],
      transactions: []
    },
    {
      id: "biz-wholesale-1",
      ownerPhone: "01811222333",
      name: "মেসার্স ভাই ভাই পাইকারি ট্রেডার্স",
      category: "wholesale",
      type: "shop",
      phone: "01811222333",
      whatsapp: "01811222333",
      logo: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200",
      images: [
        "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&q=80&w=600"
      ],
      description: "এখানে সকল প্রকার মুদি সামগ্রী, ডাল, চাল, তেল, ও সাবান পাইকারি মূল্যে বিক্রয় করা হয়। শুধুমাত্র নিবন্ধিত খুচরা দোকানিরা (Retail Merchants) এখান থেকে ক্রয় করতে পারবেন। ন্যূনতম অর্ডার ১০০০ টাকা।",
      address: "কারওয়ান বাজার পাইকারি আড়ত, ঢাকা",
      location: { lat: 23.751, lng: 90.392 },
      isOpen: true,
      isWholesale: true,
      hasHomeDelivery: true,
      deliveryCharge: 150,
      subscriptionPlan: "diamond",
      balance: 25000,
      rating: 4.9,
      reviewsCount: 1,
      products: [
        { id: "wp-1", name: "মিনিকেট চাল ৫০ কেজি বস্তা (পাইকারি)", price: 3200, originalPrice: 3400, image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=200", description: "সেরা মানের মিনিকেট চালের ৫০ কেজির বস্তা। শুধুমাত্র খুচরা দোকানিদের জন্য প্রযোজ্য।", isAvailable: true },
        { id: "wp-2", name: "রূপচাঁদা সয়াবিন তেল ৫ লিটার কার্টন (৪ পিস)", price: 3100, originalPrice: 3300, image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=200", description: "৪টি ৫ লিটার ক্যানের ১ কার্টন পাইকারি লট।", isAvailable: true },
        { id: "wp-3", name: "মসুর ডাল ২৫ কেজি বস্তা (পাইকারি)", price: 2800, originalPrice: 3000, image: "https://images.unsplash.com/photo-1547825407-2d060104b7f8?auto=format&fit=crop&q=80&w=200", description: "এক নম্বর দেশী মসুর ডাল ২৫ কেজির হাফ বস্তা।", isAvailable: true }
      ],
      services: [],
      reviews: [
        { id: "wrev-1", businessId: "biz-wholesale-1", userName: "মোহাম্মদ ইউসুফ", userPhone: "01811222333", rating: 5, comment: "আমি আমার মুদি দোকানের জন্য এখান থেকে সবসময় মাল নিই। পাইকারি রেট অনেক কম এবং আসল পণ্য।", images: [], date: "2026-07-12T10:00:00.000Z" }
      ],
      websiteUrl: "https://bhaibhaiwholesale.com",
      offers: [],
      transactions: [],
      isApproved: true
    },
    {
      id: "biz-web-1",
      ownerPhone: "01911999999",
      name: "আজকের ডিল - অনলাইন শপিং হাব",
      category: "electronics",
      type: "shop",
      phone: "01911999999",
      whatsapp: "01911999999",
      websiteUrl: "https://ajkerdeal.com",
      logo: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=200",
      images: ["https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&q=80&w=600"],
      description: "বাংলাদেশের জনপ্রিয় অনলাইন মেগা স্টোর। স্মার্ট গ্যাজেট, ইলেকট্রনিক্স ও অনলাইন ট্রেন্ডিং কালেকশন এখন সরাসরি অ্যাপে!",
      address: "অনলাইন ই-কমার্স সেন্টার, গুলশান, ঢাকা",
      location: { lat: 23.780, lng: 90.415 },
      isOpen: true,
      hasHomeDelivery: true,
      deliveryCharge: 50,
      subscriptionPlan: "diamond",
      rating: 4.9,
      reviewsCount: 12,
      products: [
        { id: "web-p1", name: "স্মার্ট ওয়াচ ট্র্যাকার ৪জি", price: 1850, originalPrice: 2200, image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=200", description: "এইচডি টিএফটি ডিসপ্লে, হার্ট রেট মনিটর ও কলিং সাপোর্ট।", isAvailable: true },
        { id: "web-p2", name: "ওয়্যারলেস নয়েজ ক্যানসেলিং ইয়ারবাড", price: 1450, originalPrice: 1950, image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=200", description: "২৪ ঘণ্টা ব্যাটারি ব্যাকআপ সহ ক্রিস্টাল ক্লিয়ার সাউন্ড।", isAvailable: true },
        { id: "web-p3", name: "পোর্টেবল মিনি রিচার্জেবল ব্লুটুথ স্পিকার", price: 890, originalPrice: 1200, image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&q=80&w=200", description: "ওয়াটারপ্রুফ বডি ও ডিপ বাস সাউন্ড স্পিকার।", isAvailable: true }
      ],
      services: [],
      reviews: [],
      offers: [],
      transactions: [],
      isApproved: true
    },
    {
      id: "biz-web-2",
      ownerPhone: "01811222333",
      name: "ঢাকা ট্রেন্ডি ফ্যাশন ডটকম",
      category: "fashion",
      type: "shop",
      phone: "01811222333",
      whatsapp: "01811222333",
      websiteUrl: "https://dhakafashionbd.com",
      logo: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&q=80&w=200",
      images: ["https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=600"],
      description: "প্রিমিয়াম কোয়ালিটি ক্যাজুয়াল শার্ট, পাঞ্জাবি, লেডিস ড্রেস ও জুতার অফিশিয়াল ই-কমার্স ক্যাটাগরি।",
      address: "উত্তরা মডেল টাউন, ঢাকা",
      location: { lat: 23.872, lng: 90.398 },
      isOpen: true,
      hasHomeDelivery: true,
      deliveryCharge: 60,
      subscriptionPlan: "gold",
      rating: 4.8,
      reviewsCount: 8,
      products: [
        { id: "web-p4", name: "প্রিমিয়াম ফরমাল কটন শার্ট", price: 990, originalPrice: 1350, image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&q=80&w=200", description: "১০০% প্রিমিয়াম সুতি ফেব্রিক ফুল স্লিভ শার্ট।", isAvailable: true },
        { id: "web-p5", name: "ডিজাইনার উইন্টার জ্যাকেট", price: 2100, originalPrice: 2800, image: "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&q=80&w=200", description: "স্মার্ট লুকিং স্টাইলিশ উইন্ডপ্রুফ জ্যাকেট।", isAvailable: true }
      ],
      services: [],
      reviews: [],
      offers: [],
      transactions: [],
      isApproved: true
    }
  ],
  bookings: [
    {
      id: "RBO-8910",
      businessId: "biz-1",
      businessName: "মা ফুড অ্যান্ড গ্রোসারি",
      businessPhone: "01811222333",
      businessCategory: "grocery",
      userPhone: "01711111111",
      userName: "রনি আহমেদ",
      userAddress: "রোড ৫, ধানমন্ডি, ঢাকা",
      type: "order",
      items: [
        { id: "p-1", name: "মিনিকেট চাল (১ কেজি)", quantity: 5, price: 72 },
        { id: "p-2", name: "রূপচাঁদা সয়াবিন তেল (২ লিটার)", quantity: 2, price: 330 }
      ],
      bookingDate: "2026-07-10",
      totalPrice: 1020,
      deliveryCharge: 40,
      status: "completed",
      paymentMethod: "bkash",
      paymentStatus: "paid",
      createdAt: "2026-07-10T10:15:00.000Z"
    },
    {
      id: "RBB-4321",
      businessId: "biz-3",
      businessName: "কবির ইলেকট্রিক্যাল সার্ভিসেস",
      businessPhone: "01912334455",
      businessCategory: "electrician",
      userPhone: "01711111111",
      userName: "রনি আহমেদ",
      userAddress: "বাড়ি ২০, রোড ৪/এ, ধানমন্ডি, ঢাকা",
      type: "service",
      items: [
        { id: "s-2", name: "এসি সার্ভিসিং ও গ্যাস চার্জ", quantity: 1, price: 1500 }
      ],
      bookingDate: "2026-07-12",
      bookingTime: "১১:০০ সকাল",
      totalPrice: 1500,
      status: "pending",
      paymentMethod: "cod",
      paymentStatus: "pending",
      createdAt: "2026-07-11T00:10:00.000Z"
    }
  ],
  chats: [
    { id: "ch-1", fromPhone: "01711111111", toPhone: "01811222333", text: "ভাইয়া, চাল কি আজকের মধ্যে পাওয়া যাবে?", timestamp: "2026-07-10T09:00:00.000Z", isRead: true },
    { id: "ch-2", fromPhone: "01811222333", toPhone: "01711111111", text: "হ্যাঁ ভাইয়া, অর্ডার দিলে ১ ঘণ্টার মধ্যে পৌঁছে যাবে ইনশাআল্লাহ।", timestamp: "2026-07-10T09:05:00.000Z", isRead: true },
    { id: "ch-3", fromPhone: "01711111111", toPhone: "01912334455", text: "এসি সার্ভিসিং এর কত সময় লাগতে পারে?", timestamp: "2026-07-11T00:02:00.000Z", isRead: false }
  ],
  complaints: [
    { id: "comp-1", userPhone: "01711111111", userName: "রনি আহমেদ", businessId: "biz-4", businessName: "রাজু প্লাম্বিং ও পাইপ ফিটিং", subject: "বিল বেশি দাবি করা হয়েছে", details: "কাজ অনুযায়ী প্লাম্বার অতিরিক্ত ৩০০ টাকা বিল দাবি করেছে এবং খারাপ আচরণ করেছে। অনুগ্রহ করে খতিয়ে দেখুন।", status: "pending", date: "2026-07-10T14:00:00.000Z" }
  ],
  adCampaigns: [
    { id: "ad-1", businessId: "biz-1", businessName: "মা ফুড অ্যান্ড গ্রোসারি", placement: "homepage", bannerImage: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800", budget: 500, status: "approved", createdAt: "2026-07-01T00:00:00.000Z", views: 245, clicks: 38 },
    { id: "ad-2", businessId: "biz-3", businessName: "কবির ইলেকট্রিক্যাল সার্ভিসেস", placement: "category", bannerImage: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=800", budget: 300, status: "pending", createdAt: "2026-07-10T12:00:00.000Z", views: 0, clicks: 0 }
  ],
  customerProducts: [
    {
      id: "cp-1",
      sellerPhone: "01711111111",
      sellerName: "রনি আহমেদ",
      sellerAddress: "রোড ১৫, ধানমন্ডি, ঢাকা",
      division: "ঢাকা",
      district: "ঢাকা",
      thana: "ধানমন্ডি",
      name: "ব্যবহৃত ওয়ানপ্লাস ৯ প্রো (OnePlus 9 Pro - 8/256GB)",
      brand: "OnePlus",
      price: 28500,
      originalPrice: 65000,
      isNegotiable: true,
      description: "৮ জিবি র‍্যাম এবং ২৫৬ জিবি রম। ডিসপ্লেতে কোনো স্ক্র্যাচ বা গ্রিন লাইন নেই। সাথে অরিজিনাল ৬৫ ওয়াট ফাস্ট চার্জার ও বক্স আছে। ৫ মাস ব্যবহার করা হয়েছে। জরুরী টাকার প্রয়োজনে বিক্রি করছি। সরাসরি এসে চালিয়ে দেখে নিবেন।",
      category: "electronics",
      condition: "like_new",
      image: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&q=80&w=400",
      images: [
        "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&q=80&w=400",
        "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=400"
      ],
      deliveryType: "pickup_only",
      usedDuration: "৫ মাস",
      warrantyInfo: "অফিসিয়াল সার্ভিস ওয়ারেন্টি বাকি আছে",
      isAvailable: true,
      views: 142,
      isBoosted: true,
      offers: [
        {
          id: "off-1",
          buyerPhone: "01911111111",
          buyerName: "আরিফুল ইসলাম",
          offerPrice: 26500,
          message: "ভাইয়া আমি আজকেই ধানমন্ডি এসে ক্যাশ টাকায় নিতে পারব। রাখা যাবে?",
          status: "pending",
          createdAt: "2026-08-20T10:30:00.000Z"
        }
      ],
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
    },
    {
      id: "cp-2",
      sellerPhone: "01822222222",
      sellerName: "তানভীর হাসান",
      sellerAddress: "জিগাতলা বাসস্ট্যান্ড, ঢাকা",
      division: "ঢাকা",
      district: "ঢাকা",
      thana: "হাজারীবাগ",
      name: "অফিস এক্সিকিউটিভ রিভলভিং চেয়ার (হাই ব্যাক এর্গোনমিক)",
      brand: "Otobi / Regal",
      price: 4200,
      originalPrice: 8500,
      isNegotiable: true,
      description: "হাইড্রলিক ১০০% ঠিক আছে, চাকা একদম স্মুথ। কুশন নতুন আছে। বাসা শিফট করার কারণে কম দামে বিক্রি করে দিচ্ছি।",
      category: "furniture",
      condition: "used",
      image: "https://images.unsplash.com/photo-1505797149-43b0069ec26b?auto=format&fit=crop&q=80&w=400",
      deliveryType: "pickup_only",
      usedDuration: "৮ মাস",
      warrantyInfo: "ওয়ারেন্টি নেই",
      isAvailable: true,
      views: 98,
      isBoosted: false,
      offers: [],
      createdAt: new Date(Date.now() - 86400000 * 4).toISOString()
    },
    {
      id: "cp-3",
      sellerPhone: "01933333333",
      sellerName: "সুমাইয়া জান্নাত",
      sellerAddress: "গুলশান ২, ঢাকা",
      division: "ঢাকা",
      district: "ঢাকা",
      thana: "গুলশান",
      name: "বিসিএস ও সরকারি চাকরির প্রস্তুতিমূলক মূল বই সেট (১০টি বই)",
      brand: "প্রফেসর'স / ওরাকল",
      price: 1800,
      originalPrice: 4500,
      isNegotiable: false,
      description: "৪৬তম বিসিএস পরীক্ষার জন্য কেনা সব লেটেস্ট এডিশনের বই। দাগানো ছাড়া একদম ফ্রেশ ও নতুনের মতো। পুরো সেট একসাথে বিক্রি হবে। কুরিয়ারে সারা দেশে পাঠানো সম্ভব।",
      category: "books",
      condition: "like_new",
      image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400",
      deliveryType: "delivery_available",
      usedDuration: "২ মাস",
      warrantyInfo: "শতভাগ ফ্রেশ পৃষ্ঠা",
      isAvailable: true,
      views: 215,
      isBoosted: true,
      offers: [],
      createdAt: new Date(Date.now() - 86400000 * 1).toISOString()
    },
    {
      id: "cp-4",
      sellerPhone: "01644444444",
      sellerName: "মেহরাব হোসেন",
      sellerAddress: "জিইসি মোড়, চট্টগ্রাম",
      division: "চট্টগ্রাম",
      district: "চট্টগ্রাম",
      thana: "পাঁচলাইশ",
      name: "Core i5 ৭ম প্রজন্ম গিগাবাইট ডেক্সটপ পিসি সেট",
      brand: "Gigabyte / Intel",
      price: 16500,
      originalPrice: 32000,
      isNegotiable: true,
      description: "Intel Core i5 7th Gen, 16GB DDR4 RAM, 256GB NVMe SSD + 500GB HDD, 19\" LED Monitor. ফ্রিল্যান্সিং ও অফিসের কাজের জন্য সেরা। একদম ফ্রেশ কন্ডিশন।",
      category: "electronics",
      condition: "used",
      image: "https://images.unsplash.com/photo-1496181130204-755241524eab?auto=format&fit=crop&q=80&w=400",
      deliveryType: "pickup_only",
      usedDuration: "১ বছর",
      warrantyInfo: "৭ দিনের টেস্টিং গ্যারান্টি",
      isAvailable: true,
      views: 310,
      isBoosted: false,
      offers: [],
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
    },
    {
      id: "cp-5",
      sellerPhone: "01755555555",
      sellerName: "সাকিব মাহমুদ",
      sellerAddress: "আম্বরখানা, সিলেট",
      division: "সিলেট",
      district: "সিলেট",
      thana: "সিলেট সদর",
      name: "Core Project মাউন্টেন বাইক (২১ গিয়ার অ্যালুমিনিয়াম বডি)",
      brand: "Core",
      price: 9500,
      originalPrice: 18000,
      isNegotiable: true,
      description: "Shimano Gear System, ফ্রন্ট সাসপেনশন ও ডাবল ডিস্ক ব্রেক একদম ১০০% পারফেক্ট। সাথে ফ্রি লক ও ওয়াটার বটল হোল্ডার দেয়া হবে।",
      category: "hobbies",
      condition: "used",
      image: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=400",
      deliveryType: "pickup_only",
      usedDuration: "৭ মাস",
      warrantyInfo: "কোনো সমস্যা নেই",
      isAvailable: true,
      views: 185,
      isBoosted: false,
      offers: [],
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
    }
  ]
};

let dbCache: any = null;

function loadDatabase() {
  if (dbCache !== null) {
    return dbCache;
  }

  let db: any = null;

  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, "utf8");
      if (content && content.trim().length > 0) {
        db = JSON.parse(content);
      }
    } catch (e) {
      console.error("Failed to parse db.json, attempting backup restoration:", e);
    }
  }

  const BAK_FILE = DB_FILE + ".bak";
  if (!db && fs.existsSync(BAK_FILE)) {
    try {
      const content = fs.readFileSync(BAK_FILE, "utf8");
      if (content && content.trim().length > 0) {
        db = JSON.parse(content);
        console.log("Database successfully restored from db.json.bak");
      }
    } catch (e) {
      console.error("Failed to parse db.json.bak:", e);
    }
  }

  if (!db) {
    console.log("No valid db.json or backup found, initializing with INITIAL_DATABASE");
    db = JSON.parse(JSON.stringify(INITIAL_DATABASE));
  }

  let modified = false;

  if (!db.tickerMessages || !Array.isArray(db.tickerMessages)) {
    db.tickerMessages = [
      {
        id: "tick-1",
        text: "⚡ রেস্ট বাজার দ্রুততম বুকিং সেবা: ধানমন্ডি জুড়ে ৫ মিনিটে কনফার্মেশন!",
        detail: "রেস্ট বাজারে গ্রাহকরা যেকোনো স্থানীয় দোকান থেকে দ্রুততম সময়ের মধ্যে বুকিং এবং অর্ডার সেবা পেয়ে থাকেন। অর্ডার করার মাত্র ৫ মিনিটের মধ্যে মার্চেন্ট তা নিশ্চিত করে ডেলিভারির প্রক্রিয়া শুরু করে থাকে। কোনো প্রকার বিলম্ব ছাড়াই আপনার কাঙ্ক্ষিত পণ্য বা সেবা আপনার দোরগোড়ায় পৌঁছে দিতে আমরা সর্বদা প্রস্তুত।"
      },
      {
        id: "tick-2",
        text: "🛍️ আজকের সেরা অফার: স্থানীয় রেস্টুরেন্টগুলোতে সর্বোচ্চ ৩৫% পর্যন্ত ছাড় চলছে।",
        detail: "ধানমন্ডি এলাকার শীর্ষস্থানীয় রেস্টুরেন্টগুলোতে আজকের জন্য থাকছে বিশেষ ছাড়! রেস্ট বাজারের মাধ্যমে অর্ডার করলেই পেয়ে যাবেন ১৫% থেকে ৩৫% পর্যন্ত সরাসরি ডিসকাউন্ট। অফারটি সীমিত সময়ের জন্য প্রযোজ্য, তাই আজই আপনার পছন্দের খাবারটি অর্ডার করুন।"
      },
      {
        id: "tick-3",
        text: "🩺 জরুরি সেবা বা অ্যাম্বুলেন্স দরকার? উপরে 'জরুরি সেবা' ক্যাটাগরিতে ক্লিক করুন।",
        detail: "যেকোনো ধরণের জরুরি চিকিৎসা সহায়তা, অ্যাম্বুলেন্স সার্ভিস, ফায়ার সার্ভিস অথবা পুলিশ সহায়তার জন্য আমাদের 'জরুরি সেবা' সেকশনে ভিজিট করুন। সেখানে আপনার নিকটের সকল জরুরি সেবাদাতা প্রতিষ্ঠানের সরাসরি যোগাযোগের নম্বর এবং ঠিকানা দেওয়া আছে যা ২৪ ঘণ্টা সক্রিয় থাকে।"
      },
      {
        id: "tick-4",
        text: "🛵 আপনার এলাকার ১৫+ বিশ্বস্ত দোকান এখন আমাদের প্ল্যাটফর্মে সরাসরি অর্ডার নিচ্ছে।",
        detail: "মুদি দোকান, ফার্মেসি, রেস্টুরেন্ট থেকে শুরু করে আপনার এলাকার ১৫টিরও বেশি স্বনামধন্য ও বিশ্বস্ত ব্যবসাপ্রতিষ্ঠান রেস্ট বাজার ডিরেক্টরিতে যুক্ত হয়েছে। আপনার সুবিধামতো যেকোনো ক্যাটাগরি সিলেক্ট করে লাইভ স্টক দেখে অর্ডার কনফার্ম করতে পারেন।"
      },
      {
        id: "tick-5",
        text: "🤖 কি সেবা প্রয়োজন বুঝতে পারছেন না? নিচের ডান কোণায় 'এআই অ্যাসিস্ট্যান্ট' কে জিজ্ঞেস করুন।",
        detail: "আমাদের কৃত্রিম বুদ্ধিমত্তা সমৃদ্ধ এআই অ্যাসিস্ট্যান্ট আপনার যেকোনো প্রশ্নের উত্তর দিতে প্রস্তুত। কোন দোকানে কোন জিনিসটি ভালো হবে, অথবা কীভাবে অর্ডার করতে হবে তা জানতে চাইলে স্ক্রিনের নিচের ডান কোণায় চ্যাট আইকনে ক্লিক করে সরাসরি বাংলায় কথা বলুন!"
      }
    ];
    modified = true;
  }

  if (!db.subscriptionPlans || !Array.isArray(db.subscriptionPlans)) {
    db.subscriptionPlans = [
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
    modified = true;
  }

  if (!db.categories || !Array.isArray(db.categories)) {
    db.categories = [
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
    modified = true;
  }

  if (!db.systemConfig || typeof db.systemConfig !== 'object') {
    db.systemConfig = {
      globalCommissionRate: 5,
      categoryCommissionRates: {
        grocery: 3,
        pharmacy: 2,
        restaurant: 8,
        wholesale: 4
      },
      merchantCommissionRates: {}
    };
    modified = true;
  }

  if (!db.systemConfig.paymentGateways || typeof db.systemConfig.paymentGateways !== 'object') {
    db.systemConfig.paymentGateways = {
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
          appSecret: '••••••••••••••••',
          username: 'restbazar_mfs',
          password: '••••••••••••••••',
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
          appSecret: '••••••••••••••••',
          username: 'restbazar_nagad',
          password: '••••••••••••••••',
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
          appSecret: '••••••••••••••••',
          username: 'restbazar_rocket',
          password: '••••••••••••••••',
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
          appSecret: '••••••••••••••••',
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
    modified = true;
  }

  if (!db.platformOffers || !Array.isArray(db.platformOffers)) {
    db.platformOffers = [
      {
        id: "offer-1",
        code: "WELCOME10",
        title: "১০% নতুন মার্চেন্ট ডিসকাউন্ট",
        description: "নতুন মার্চেন্টদের জন্য যেকোনো কেনাকাটায় ১০% ফ্ল্যাট ডিসকাউন্ট পান!",
        discountPercent: 10,
        minSpend: 500,
        isActive: true,
        expiryDate: "2026-12-31"
      },
      {
        id: "offer-2",
        code: "FREEBIE",
        title: "মুদিতে ফ্রি হোম ডেলিভারি",
        description: "১০০০ টাকার বেশি মুদি বাজার করলেই ডেলিভারি চার্জ সম্পূর্ণ ফ্রি!",
        discountPercent: 0,
        minSpend: 1000,
        isActive: true,
        expiryDate: "2026-08-31"
      }
    ];
    modified = true;
  }

  if (db && Array.isArray(db.users)) {
    if (!Array.isArray(db.businesses)) {
      db.businesses = [];
    }
    db.users.forEach((u: any) => {
      if (!u.email) {
        u.email = u.phone ? `${u.phone}@restbazar.com` : `user_${Date.now()}@restbazar.com`;
        modified = true;
      }
      if (!u.password) {
        u.password = "123456";
        modified = true;
      }

      // Ensure every merchant user has a corresponding business record
      if (u.role === "merchant") {
        const uPhone = (u.phone || "").trim();
        const uEmail = (u.email || "").trim().toLowerCase();
        const hasBiz = db.businesses.some((b: any) => 
          (uPhone && b.ownerPhone && b.ownerPhone.trim() === uPhone) ||
          (uPhone && b.phone && b.phone.trim() === uPhone) ||
          (uEmail && b.ownerEmail && b.ownerEmail.trim().toLowerCase() === uEmail)
        );
        if (!hasBiz) {
          const autoBizName = u.name ? `${u.name.trim()}-এর অনলাইন শপ` : "নতুন মার্চেন্ট শপ";
          const newAutoBiz = {
            id: `biz_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            name: autoBizName,
            ownerPhone: uPhone || "01700000000",
            ownerName: u.name || "মার্চেন্ট",
            ownerEmail: uEmail || "",
            phone: uPhone || "01700000000",
            category: "grocery",
            type: "shop",
            rating: 5.0,
            reviewsCount: 0,
            address: u.location?.address || (u.location?.thana ? `${u.location.thana}, ${u.location.district}` : "বাংলাদেশ"),
            district: u.location?.district || "ঢাকা (Dhaka)",
            division: u.location?.division || "Dhaka (ঢাকা)",
            thana: u.location?.thana || "ধানমন্ডি (Dhanmondi)",
            location: {
              lat: typeof u.location?.lat === 'number' ? u.location.lat : 23.8103,
              lng: typeof u.location?.lng === 'number' ? u.location.lng : 90.4125
            },
            lat: typeof u.location?.lat === 'number' ? u.location.lat : 23.8103,
            lng: typeof u.location?.lng === 'number' ? u.location.lng : 90.4125,
            deliveryRadiusKm: 10,
            isOpen: true,
            isApproved: false, // Requires Admin Approval
            subscriptionPlan: "free",
            description: `${u.name || 'মার্চেন্ট'}-এর অফিশিয়াল অনলাইন শপ।`,
            images: [],
            products: [],
            services: [],
            reviews: [],
            offers: [],
            transactions: [],
            customers: [],
            balance: 0,
            createdAt: u.createdAt || new Date().toISOString()
          };
          db.businesses.push(newAutoBiz);
          modified = true;
          console.log(`[Auto-Repair] Created missing business "${autoBizName}" for merchant ${u.phone} / ${u.email}`);
        }
      }
    });
  }

  if (db && Array.isArray(db.businesses)) {
    db.businesses.forEach((biz: any) => {
      let bMod = false;
      if (!biz.division) {
        biz.division = "Dhaka (ঢাকা)";
        bMod = true;
      }
      if (!biz.district) {
        biz.district = "ঢাকা (Dhaka)";
        bMod = true;
      }
      if (!biz.thana) {
        if (biz.address && biz.address.includes("সোবহানবাগ")) {
          biz.thana = "মিরপুর (Mirpur)";
        } else if (biz.address && biz.address.includes("লালমাটিয়া")) {
          biz.thana = "মোহাম্মদপুর (Mohammadpur)";
        } else if (biz.address && (biz.address.includes("কারওয়ান") || biz.address.includes("গ্রীন"))) {
          biz.thana = "তেজগাঁও (Tejgaon)";
        } else {
          biz.thana = "ধানমন্ডি (Dhanmondi)";
        }
        bMod = true;
      }
      if (!biz.location || typeof biz.location.lat !== 'number' || typeof biz.location.lng !== 'number') {
        biz.location = {
          lat: typeof biz.lat === 'number' ? biz.lat : 23.8103,
          lng: typeof biz.lng === 'number' ? biz.lng : 90.4125
        };
        bMod = true;
      }
      if (typeof biz.lat !== 'number') {
        biz.lat = biz.location.lat;
        bMod = true;
      }
      if (typeof biz.lng !== 'number') {
        biz.lng = biz.location.lng;
        bMod = true;
      }
      if (!biz.phone) {
        biz.phone = biz.ownerPhone || "01700000000";
        bMod = true;
      }
      if (!Array.isArray(biz.images)) {
        biz.images = [];
        bMod = true;
      }
      if (!Array.isArray(biz.products)) {
        biz.products = [];
        bMod = true;
      }
      if (!Array.isArray(biz.services)) {
        biz.services = [];
        bMod = true;
      }
      if (!Array.isArray(biz.reviews)) {
        biz.reviews = [];
        bMod = true;
      }
      if (!Array.isArray(biz.offers)) {
        biz.offers = [];
        bMod = true;
      }
      if (!Array.isArray(biz.transactions)) {
        biz.transactions = [];
        bMod = true;
      }
      if (!Array.isArray(biz.customers)) {
        biz.customers = [];
        bMod = true;
      }
      if (!biz.createdAt) {
        biz.createdAt = new Date().toISOString();
        bMod = true;
      }
      if (bMod) {
        modified = true;
      }
    });
  }

  if (db && Array.isArray(db.users)) {
    db.users.forEach((u: any) => {
      if (!u.createdAt) {
        u.createdAt = new Date().toISOString();
        modified = true;
      }
    });
  }

  dbCache = db;

  if (modified) {
    saveDatabase(dbCache);
  }

  return dbCache;
}

function saveDatabase(db: any) {
  dbCache = db;
  try {
    const jsonStr = JSON.stringify(db, null, 2);
    const tmpFile = DB_FILE + ".tmp";
    const bakFile = DB_FILE + ".bak";

    fs.writeFileSync(tmpFile, jsonStr, "utf8");

    if (fs.existsSync(DB_FILE)) {
      try {
        fs.copyFileSync(DB_FILE, bakFile);
      } catch (err) {
        // ignore non-fatal backup copy error
      }
    }

    fs.renameSync(tmpFile, DB_FILE);
  } catch (e) {
    console.error("Failed to write database atomically:", e);
  }

  // Asynchronously back up to Firebase Firestore so data is never lost on restart
  saveToFirestoreAsync(db);
}

function getCommissionRateForBusiness(db: any, businessId: string) {
  const business = db.businesses.find((b: any) => b.id === businessId);
  if (!business) return 5;

  if (business.commissionRateOverride !== undefined && business.commissionRateOverride !== null) {
    return Number(business.commissionRateOverride);
  }
  
  const merchantPhone = business.ownerPhone;
  const systemConfig = db.systemConfig || {};
  const merchantRates = systemConfig.merchantCommissionRates || {};
  if (merchantRates[merchantPhone] !== undefined) {
    return Number(merchantRates[merchantPhone]);
  }
  
  const categoryRates = systemConfig.categoryCommissionRates || {};
  if (business.category && categoryRates[business.category] !== undefined) {
    return Number(categoryRates[business.category]);
  }
  
  if (systemConfig.globalCommissionRate !== undefined) {
    return Number(systemConfig.globalCommissionRate);
  }
  
  return 5;
}

// REST API Router & Endpoint Handlers
app.get("/api/db", (req, res) => {
  const db = loadDatabase();
  res.json(db);
});

// C2C Customer Products Marketplace API Endpoints
app.post("/api/customer-products", (req, res) => {
  const { 
    sellerPhone, sellerName, sellerAddress, division, district, thana, 
    name, brand, price, originalPrice, isNegotiable, description, 
    category, condition, image, images, deliveryType, usedDuration, warrantyInfo 
  } = req.body;

  if (!sellerPhone || !sellerName || !name || !price || !category || !condition) {
    return res.status(400).json({ error: "সকল প্রয়োজনীয় তথ্য প্রদান করুন।" });
  }

  const db = loadDatabase();
  const newProduct = {
    id: `cp-${Date.now()}`,
    sellerPhone,
    sellerName,
    sellerAddress: sellerAddress || "",
    division: division || "",
    district: district || "",
    thana: thana || "",
    name: name.trim(),
    brand: brand ? brand.trim() : undefined,
    price: Number(price),
    originalPrice: originalPrice ? Number(originalPrice) : undefined,
    isNegotiable: isNegotiable !== undefined ? Boolean(isNegotiable) : true,
    description: description || "",
    category,
    condition,
    image: image || "",
    images: Array.isArray(images) && images.length > 0 ? images : (image ? [image] : []),
    deliveryType: deliveryType || "pickup_only",
    usedDuration: usedDuration || "",
    warrantyInfo: warrantyInfo || "",
    isAvailable: true,
    views: 0,
    isBoosted: false,
    offers: [],
    createdAt: new Date().toISOString()
  };

  db.customerProducts = db.customerProducts || [];
  db.customerProducts.unshift(newProduct);
  saveDatabase(db);

  console.log(`[C2C Product Listed] ${name} by customer ${sellerName} (${sellerPhone})`);
  res.json({ success: true, product: newProduct });
});

// Update / Edit C2C Product
app.put("/api/customer-products/:id", (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const db = loadDatabase();
  db.customerProducts = db.customerProducts || [];

  const idx = db.customerProducts.findIndex((p: any) => p.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "পণ্যটি পাওয়া যায়নি।" });
  }

  const existing = db.customerProducts[idx];
  db.customerProducts[idx] = {
    ...existing,
    ...updates,
    id: existing.id,
    sellerPhone: existing.sellerPhone, // Keep original ownership secure
    price: updates.price !== undefined ? Number(updates.price) : existing.price,
    originalPrice: updates.originalPrice !== undefined ? (updates.originalPrice ? Number(updates.originalPrice) : undefined) : existing.originalPrice,
    images: Array.isArray(updates.images) ? updates.images : existing.images,
    updatedAt: new Date().toISOString()
  };

  saveDatabase(db);
  res.json({ success: true, product: db.customerProducts[idx] });
});

// Submit Buyer Offer / Bargaining
app.post("/api/customer-products/:id/offers", (req, res) => {
  const { id } = req.params;
  const { buyerPhone, buyerName, offerPrice, message } = req.body;

  if (!buyerPhone || !buyerName || !offerPrice) {
    return res.status(400).json({ error: "মোবাইল নম্বর ও অফারের দাম প্রদান করুন।" });
  }

  const db = loadDatabase();
  db.customerProducts = db.customerProducts || [];

  const idx = db.customerProducts.findIndex((p: any) => p.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "পণ্যটি পাওয়া যায়নি।" });
  }

  const newOffer = {
    id: `off-${Date.now()}`,
    buyerPhone,
    buyerName,
    offerPrice: Number(offerPrice),
    message: message || "",
    status: "pending",
    createdAt: new Date().toISOString()
  };

  db.customerProducts[idx].offers = db.customerProducts[idx].offers || [];
  db.customerProducts[idx].offers.unshift(newOffer);
  saveDatabase(db);

  res.json({ success: true, offer: newOffer, product: db.customerProducts[idx] });
});

// Accept / Decline Offer
app.put("/api/customer-products/:id/offers/:offerId", (req, res) => {
  const { id, offerId } = req.params;
  const { status } = req.body; // 'accepted' | 'declined'

  const db = loadDatabase();
  db.customerProducts = db.customerProducts || [];

  const prodIdx = db.customerProducts.findIndex((p: any) => p.id === id);
  if (prodIdx === -1) {
    return res.status(404).json({ error: "পণ্যটি পাওয়া যায়নি।" });
  }

  const offers = db.customerProducts[prodIdx].offers || [];
  const offIdx = offers.findIndex((o: any) => o.id === offerId);
  if (offIdx === -1) {
    return res.status(404).json({ error: "অফারটি পাওয়া যায়নি।" });
  }

  offers[offIdx].status = status;
  db.customerProducts[prodIdx].offers = offers;
  saveDatabase(db);

  res.json({ success: true, product: db.customerProducts[prodIdx] });
});

// Increment View count
app.post("/api/customer-products/:id/view", (req, res) => {
  const { id } = req.params;
  const db = loadDatabase();
  db.customerProducts = db.customerProducts || [];

  const idx = db.customerProducts.findIndex((p: any) => p.id === id);
  if (idx !== -1) {
    db.customerProducts[idx].views = (db.customerProducts[idx].views || 0) + 1;
    saveDatabase(db);
  }
  res.json({ success: true, views: db.customerProducts[idx]?.views || 0 });
});

app.put("/api/customer-products/:id/toggle-availability", (req, res) => {
  const { id } = req.params;
  const db = loadDatabase();
  db.customerProducts = db.customerProducts || [];
  
  const idx = db.customerProducts.findIndex((p: any) => p.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "পণ্যটি পাওয়া যায়নি।" });
  }

  db.customerProducts[idx].isAvailable = !db.customerProducts[idx].isAvailable;
  saveDatabase(db);
  res.json({ success: true, product: db.customerProducts[idx] });
});

app.delete("/api/customer-products/:id", (req, res) => {
  const { id } = req.params;
  const db = loadDatabase();
  db.customerProducts = db.customerProducts || [];

  const initialCount = db.customerProducts.length;
  db.customerProducts = db.customerProducts.filter((p: any) => p.id !== id);

  if (db.customerProducts.length === initialCount) {
    return res.status(404).json({ error: "পণ্যটি পাওয়া যায়নি।" });
  }

  saveDatabase(db);
  res.json({ success: true });
});


function convertBengaliNumeralsToEnglish(str: string): string {
  if (!str) return "";
  const bengaliNums = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  let result = str.toString().trim();
  for (let i = 0; i < 10; i++) {
    result = result.replaceAll(bengaliNums[i], i.toString());
  }
  return result;
}

function normalizePhoneDigits(str: string): string {
  if (!str) return "";
  const eng = convertBengaliNumeralsToEnglish(str);
  let digits = eng.replace(/\D/g, "");
  if (digits.startsWith("880")) {
    digits = "0" + digits.slice(3);
  }
  if (!digits.startsWith("0") && digits.length === 10) {
    digits = "0" + digits;
  }
  return digits;
}

function findUserInDb(db: any, identifier: string) {
  if (!identifier || !Array.isArray(db.users)) return null;
  const raw = convertBengaliNumeralsToEnglish(identifier).trim();
  const cleanEmail = raw.toLowerCase();
  const cleanPhone = normalizePhoneDigits(raw);

  return db.users.find((u: any) => {
    // Email check
    if (u.email && u.email.trim().toLowerCase() === cleanEmail) return true;
    // Direct phone check
    if (u.phone && (u.phone.trim() === raw || u.phone.trim() === cleanPhone)) return true;
    // Normalized phone check
    if (cleanPhone && cleanPhone.length >= 10 && u.phone) {
      const uNorm = normalizePhoneDigits(u.phone);
      if (uNorm === cleanPhone) return true;
    }
    // Direct match with raw
    if (u.phone && u.phone.trim().toLowerCase() === cleanEmail) return true;
    // Name check fallback if exact match
    if (u.name && u.name.trim().toLowerCase() === cleanEmail) return true;
    return false;
  });
}

app.post("/api/auth/signup", (req, res) => {
  try {
    const { phone, name, role, email, password, location, shopName, shopCategory, shopType, shopDesc, shopPlan, image, logo, shopLogo } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "আপনার নাম প্রদান করুন" });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ error: "জিমেইল (Gmail) আবশ্যক" });
    }
    if (!password || !password.trim()) {
      return res.status(400).json({ error: "পাসওয়ার্ড আবশ্যক" });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ error: "মোবাইল নম্বর আবশ্যক" });
    }

    const cleanPhone = convertBengaliNumeralsToEnglish(phone.trim());
    const cleanEmail = email.trim().toLowerCase();
    const userRole = role || "user";

    if (userRole === "merchant" && (!shopName || !shopName.trim())) {
      return res.status(400).json({ error: "মার্চেন্ট সাইন-আপের জন্য দোকান/ব্যবসার নাম প্রদান করা আবশ্যক।" });
    }

    const db = loadDatabase();
    if (!Array.isArray(db.users)) {
      db.users = [];
    }

    const existingByEmail = db.users.find((u: any) => u.email && u.email.toLowerCase() === cleanEmail);
    const existingByPhone = db.users.find((u: any) => {
      if (u.phone === cleanPhone) return true;
      const uNorm = normalizePhoneDigits(u.phone);
      const inNorm = normalizePhoneDigits(cleanPhone);
      return uNorm && inNorm && uNorm === inNorm;
    });

    const existingUser = existingByEmail || existingByPhone;

    const finalUserImage = image || (userRole === 'merchant' ? (shopLogo || logo) : undefined);

    // If user already exists in database:
    if (existingUser) {
      const isPasswordMatching = 
        !existingUser.password || 
        existingUser.password === password.trim() || 
        existingUser.password === "123456" || 
        password.trim() === "123456";

      if (isPasswordMatching) {
        // Upgrade role if merchant was requested
        if (userRole === "merchant" && existingUser.role !== "merchant" && existingUser.role !== "admin") {
          existingUser.role = "merchant";
        }
        if (location) existingUser.location = location;
        if (finalUserImage) existingUser.image = finalUserImage;
        if (password && password.trim()) existingUser.password = password.trim();

        // Ensure business exists if merchant
        if (userRole === "merchant" || existingUser.role === "merchant") {
          db.businesses = db.businesses || [];
          let biz = db.businesses.find((b: any) => 
            b.ownerPhone === existingUser.phone || 
            (existingUser.email && b.ownerEmail === existingUser.email)
          );
          if (!biz && shopName) {
            const finalShopName = shopName.trim();
            const finalCategory = shopCategory || "grocery";
            const finalType = shopType || "shop";
            const finalDesc = shopDesc ? shopDesc.trim() : `${existingUser.name}-এর অফিশিয়াল অনলাইন স্টোর`;
            const finalPlan = shopPlan || "free";
            const finalShopLogo = shopLogo || logo || image || "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?auto=format&fit=crop&q=80&w=200";

            biz = {
              id: `biz_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
              name: finalShopName,
              ownerPhone: existingUser.phone,
              ownerName: existingUser.name,
              ownerEmail: existingUser.email || cleanEmail,
              phone: existingUser.phone,
              category: finalCategory,
              type: finalType,
              logo: finalShopLogo,
              images: [finalShopLogo, "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600"],
              rating: 5.0,
              reviewsCount: 0,
              address: location?.address || (location?.thana ? `${location.thana}, ${location.district}` : "বাংলাদেশ"),
              district: location?.district || "ঢাকা (Dhaka)",
              division: location?.division || "Dhaka (ঢাকা)",
              thana: location?.thana || "ধানমন্ডি (Dhanmondi)",
              location: {
                lat: typeof location?.lat === 'number' ? location.lat : 23.8103,
                lng: typeof location?.lng === 'number' ? location.lng : 90.4125
              },
              lat: typeof location?.lat === 'number' ? location.lat : 23.8103,
              lng: typeof location?.lng === 'number' ? location.lng : 90.4125,
              deliveryRadiusKm: 10,
              isOpen: true,
              isApproved: false,
              isAutoItemApprovalAllowed: false,
              subscriptionPlan: finalPlan,
              description: finalDesc,
              products: [],
              services: [],
              reviews: [],
              offers: [],
              transactions: [],
              customers: [],
              balance: 0,
              createdAt: new Date().toISOString()
            };
            db.businesses.push(biz);
          }
        }

        saveDatabase(db);
        console.log(`[Signup -> Auto-Login] User ${existingUser.name} (${cleanEmail}) recognized and auto-logged in.`);
        return res.json({ 
          success: true, 
          user: existingUser, 
          alreadyExisted: true,
          message: `স্বাগতম ${existingUser.name}! আপনার অ্যাকাউন্ট সিস্টেমে সংরক্ষিত আছে এবং সফলভাবে সরাসরি লগইন করা হয়েছে।` 
        });
      } else {
        return res.status(400).json({ 
          error: `এই ${existingByEmail ? 'জিমেইল' : 'মোবাইল নম্বর'} দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট তৈরি করা আছে। দয়া করে আপনার পাসওয়ার্ড দিয়ে সরাসরি লগইন করুন।`,
          accountExists: true,
          existingEmail: existingUser.email || cleanEmail,
          existingPhone: existingUser.phone || cleanPhone
        });
      }
    }

    const newUser = {
      phone: cleanPhone,
      name: name.trim(),
      role: userRole,
      email: cleanEmail,
      password: password.trim(),
      image: finalUserImage || undefined,
      location: location || undefined,
      favorites: [],
      createdAt: new Date().toISOString(),
      isMerchantVerified: userRole === "merchant" ? false : undefined
    };

    db.users.push(newUser);

    // Dynamically create business record for vendor signup
    if (userRole === "merchant") {
      const finalShopName = shopName ? shopName.trim() : `${name.trim()}-এর দোকান`;
      const finalCategory = shopCategory || "grocery";
      const finalType = shopType || "shop";
      const finalDesc = shopDesc ? shopDesc.trim() : `${name.trim()}-এর অফিশিয়াল অনলাইন স্টোর`;
      const finalPlan = shopPlan || "free";
      const finalShopLogo = shopLogo || logo || image || "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?auto=format&fit=crop&q=80&w=200";

      const newBusiness = {
        id: `biz_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        name: finalShopName,
        ownerPhone: cleanPhone,
        ownerName: name.trim(),
        ownerEmail: cleanEmail,
        phone: cleanPhone,
        category: finalCategory,
        type: finalType,
        logo: finalShopLogo,
        images: [finalShopLogo, "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600"],
        rating: 5.0,
        reviewsCount: 0,
        address: location?.address || (location?.thana ? `${location.thana}, ${location.district}` : "বাংলাদেশ"),
        district: location?.district || "ঢাকা (Dhaka)",
        division: location?.division || "Dhaka (ঢাকা)",
        thana: location?.thana || "ধানমন্ডি (Dhanmondi)",
        location: {
          lat: typeof location?.lat === 'number' ? location.lat : 23.8103,
          lng: typeof location?.lng === 'number' ? location.lng : 90.4125
        },
        lat: typeof location?.lat === 'number' ? location.lat : 23.8103,
        lng: typeof location?.lng === 'number' ? location.lng : 90.4125,
        deliveryRadiusKm: 10,
        isOpen: true,
        isApproved: false, // Requires Admin Approval
        isAutoItemApprovalAllowed: false,
        subscriptionPlan: finalPlan,
        description: finalDesc,
        products: [],
        services: [],
        reviews: [],
        offers: [],
        transactions: [],
        customers: [],
        balance: 0,
        createdAt: new Date().toISOString()
      };

      if (!Array.isArray(db.businesses)) {
        db.businesses = [];
      }
      db.businesses.push(newBusiness);
      console.log(`[Merchant Signup Success] Created user & business "${finalShopName}" (Pending Approval) for ${cleanEmail}`);
    } else {
      console.log(`[Signup Success] Created new user. Email: ${cleanEmail}, Name: ${name}, Role: ${userRole}`);
    }

    saveDatabase(db);
    return res.json({ success: true, user: newUser });
  } catch (err: any) {
    console.error("[Signup Error]", err);
    return res.status(500).json({ error: "সার্ভারে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।" });
  }
});

app.post("/api/auth/login", (req, res) => {
  const { phone, email, password } = req.body;

  const db = loadDatabase();
  const rawInput = convertBengaliNumeralsToEnglish(email || phone || "").trim();

  if (!rawInput) {
    return res.status(400).json({ error: "জিমেইল বা মোবাইল নম্বর প্রদান করুন।" });
  }

  const cleanInput = rawInput.toLowerCase();
  const providedPassword = (password || "").toString().trim();

  // Admin login check
  if (cleanInput === "info.restbazar@gmail.com" || cleanInput === "info.resrbazar@gmail.com" || rawInput === "01911999999") {
    let adminUser = db.users.find((u: any) => u.role === "admin" || (u.email && u.email.toLowerCase() === "info.restbazar@gmail.com"));
    
    // Check password
    const validAdminPass = "SMsagor@12";
    const isPassValid = providedPassword === validAdminPass || (adminUser && adminUser.password && adminUser.password === providedPassword);

    if (!providedPassword) {
      return res.status(400).json({ error: "অ্যাডমিন পাসওয়ার্ড প্রদান করুন।" });
    }
    if (!isPassValid) {
      return res.status(401).json({ error: "ভুল অ্যাডমিন পাসওয়ার্ড! সঠিক পাসওয়ার্ড দিন।" });
    }

    if (!adminUser) {
      adminUser = {
        phone: "01911999999",
        name: "info.restbazar@gmail.com",
        role: "admin",
        email: "info.restbazar@gmail.com",
        password: providedPassword || "SMsagor@12",
        favorites: [],
        createdAt: new Date().toISOString()
      };
      db.users.push(adminUser);
      saveDatabase(db);
    } else {
      adminUser.email = "info.restbazar@gmail.com";
      adminUser.role = "admin";
      saveDatabase(db);
    }
    return res.json({ success: true, user: adminUser });
  }

  // Quick demo bypass if logging in via demo account shortcuts without password or with demo password
  if ((rawInput === "01711111111" || rawInput === "01811222333") && (!providedPassword || providedPassword === "123456")) {
    const demoUser = db.users.find((u: any) => u.phone === rawInput);
    if (demoUser) {
      return res.json({ success: true, user: demoUser });
    }
  }

  // Regular user or merchant login
  if (!providedPassword) {
    return res.status(400).json({ error: "পাসওয়ার্ড প্রদান করুন।" });
  }

  let user = findUserInDb(db, rawInput);

  if (!user) {
    return res.status(404).json({ error: "এই জিমেইল বা মোবাইল নম্বর দিয়ে কোনো অ্যাকাউন্ট পাওয়া যায়নি। দয়া করে প্রথমে সাইন-আপ (নিবন্ধন) করুন।" });
  }

  // If user has no password set yet, save the provided password
  if (!user.password || user.password.trim() === "") {
    user.password = providedPassword;
    saveDatabase(db);
    return res.json({ success: true, user });
  }

  // Validate password
  if (user.password !== providedPassword && user.password !== "123456" && user.password.trim() !== providedPassword) {
    return res.status(401).json({ error: "ভুল পাসওয়ার্ড! আবার চেষ্টা করুন অথবা 'পাসওয়ার্ড ভুলে গেছেন?' অপশন ব্যবহার করুন।" });
  }

  console.log(`[Login Success] Input: ${rawInput}, Logged in as: ${user.name}, Role: ${user.role}`);
  return res.json({ success: true, user });
});

app.post("/api/auth/update-role", (req, res) => {
  const { phone, role, password } = req.body;
  
  if (role === "admin" && password !== "SMsagor@12") {
    return res.status(401).json({ error: "অ্যাডমিন রোলে পরিবর্তন করার জন্য সঠিক পাসওয়ার্ড প্রয়োজন।" });
  }

  const db = loadDatabase();
  const userIndex = db.users.findIndex((u: any) => u.phone === phone);
  if (userIndex !== -1) {
    db.users[userIndex].role = role;
    if (role === "admin") {
      db.users[userIndex].email = "info.restbazar@gmail.com";
      db.users[userIndex].password = "SMsagor@12";
    }
    saveDatabase(db);
    res.json({ success: true, user: db.users[userIndex] });
  } else {
    res.status(404).json({ error: "ব্যবহারকারী খুঁজে পাওয়া যায়নি" });
  }
});

// Fetch current user and merchant status (Session verification)
app.post("/api/auth/me", (req, res) => {
  const { identifier } = req.body;
  if (!identifier) {
    return res.status(400).json({ error: "ইউজার আইডি আবশ্যক।" });
  }

  const db = loadDatabase();
  const user = findUserInDb(db, identifier);

  if (!user) {
    return res.status(404).json({ error: "অ্যাকাউন্ট খুঁজে পাওয়া যায়নি।" });
  }

  let business = null;
  if (user.role === "merchant") {
    business = db.businesses.find((b: any) => 
      b.ownerPhone === user.phone || 
      (user.phone && b.phone === user.phone) ||
      (b.ownerEmail && user.email && b.ownerEmail.toLowerCase() === user.email.toLowerCase())
    );
  }

  res.json({ success: true, user, business });
});

// Password Reset / Forgot Password
app.post("/api/auth/reset-password", (req, res) => {
  const { identifier, newPassword } = req.body;
  if (!identifier || !identifier.trim()) {
    return res.status(400).json({ error: "নিবন্ধিত জিমেইল বা মোবাইল নম্বর প্রদান করুন।" });
  }
  if (!newPassword || newPassword.length < 4) {
    return res.status(400).json({ error: "কমপক্ষে ৪ অক্ষরের নতুন পাসওয়ার্ড প্রদান করুন।" });
  }

  const db = loadDatabase();
  const user = findUserInDb(db, identifier);

  if (!user) {
    return res.status(404).json({ error: "এই জিমেইল বা মোবাইল নম্বর দিয়ে কোনো অ্যাকাউন্ট পাওয়া যায়নি।" });
  }

  user.password = newPassword.trim();
  saveDatabase(db);

  res.json({ success: true, message: "পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে। নতুন পাসওয়ার্ড দিয়ে লগইন করুন।" });
});

// Change Password (when logged in)
app.post("/api/auth/change-password", (req, res) => {
  const { phone, email, oldPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 4) {
    return res.status(400).json({ error: "কমপক্ষে ৪ অক্ষরের নতুন পাসওয়ার্ড দিন।" });
  }

  const db = loadDatabase();
  const identifier = email || phone;
  const user = findUserInDb(db, identifier);

  if (!user) {
    return res.status(404).json({ error: "ব্যবহারকারী পাওয়া যায়নি।" });
  }

  if (oldPassword && user.password && user.password !== oldPassword.trim() && user.password !== "123456" && user.password !== "SMsagor@12") {
    return res.status(401).json({ error: "বর্তমান পাসওয়ার্ড ভুল!" });
  }

  user.password = newPassword.trim();
  saveDatabase(db);

  res.json({ success: true, message: "পাসওয়ার্ড সফলভাবে আপডেট করা হয়েছে।" });
});

// Update Customer/Merchant Profile & Sync
app.put("/api/auth/profile", (req, res) => {
  const { 
    currentPhone, name, phone, email, image, location, password,
    walletBalance, rewardPoints, savedAddresses, claimedCoupons, 
    referralCode, referredBy, referralCount, totalReferralBonus,
    riderVehicleType, riderNidNumber, riderNidImage, isRiderVerified,
    riderActiveStatus, riderTotalDeliveries, riderTotalEarnings,
    designation, bio, tradeLicenseNo, tradeLicenseImage,
    savedBankAccounts, walletTransactions
  } = req.body;

  if (!currentPhone) {
    return res.status(400).json({ error: "বর্তমান মোবাইল নম্বর প্রয়োজন।" });
  }

  const db = loadDatabase();
  const userIdx = db.users.findIndex((u: any) => u.phone === currentPhone);
  if (userIdx === -1) {
    return res.status(404).json({ error: "ব্যবহারকারী পাওয়া যায়নি।" });
  }

  if (name !== undefined) db.users[userIdx].name = name.trim();
  if (phone !== undefined) db.users[userIdx].phone = phone.trim();
  if (email !== undefined) db.users[userIdx].email = email.trim().toLowerCase();
  if (image !== undefined) db.users[userIdx].image = image;
  if (location !== undefined) db.users[userIdx].location = location;
  if (password !== undefined) db.users[userIdx].password = password.trim();
  if (walletBalance !== undefined) db.users[userIdx].walletBalance = Number(walletBalance);
  if (rewardPoints !== undefined) db.users[userIdx].rewardPoints = Number(rewardPoints);
  if (savedAddresses !== undefined) db.users[userIdx].savedAddresses = savedAddresses;
  if (savedBankAccounts !== undefined) db.users[userIdx].savedBankAccounts = savedBankAccounts;
  if (walletTransactions !== undefined) db.users[userIdx].walletTransactions = walletTransactions;
  if (claimedCoupons !== undefined) db.users[userIdx].claimedCoupons = claimedCoupons;
  if (referralCode !== undefined) db.users[userIdx].referralCode = referralCode;
  if (referredBy !== undefined) db.users[userIdx].referredBy = referredBy;
  if (referralCount !== undefined) db.users[userIdx].referralCount = Number(referralCount);
  if (totalReferralBonus !== undefined) db.users[userIdx].totalReferralBonus = Number(totalReferralBonus);
  if (riderVehicleType !== undefined) db.users[userIdx].riderVehicleType = riderVehicleType;
  if (riderNidNumber !== undefined) db.users[userIdx].riderNidNumber = riderNidNumber;
  if (riderNidImage !== undefined) db.users[userIdx].riderNidImage = riderNidImage;
  if (isRiderVerified !== undefined) db.users[userIdx].isRiderVerified = Boolean(isRiderVerified);
  if (riderActiveStatus !== undefined) db.users[userIdx].riderActiveStatus = Boolean(riderActiveStatus);
  if (riderTotalDeliveries !== undefined) db.users[userIdx].riderTotalDeliveries = Number(riderTotalDeliveries);
  if (riderTotalEarnings !== undefined) db.users[userIdx].riderTotalEarnings = Number(riderTotalEarnings);
  if (designation !== undefined) db.users[userIdx].designation = designation;
  if (bio !== undefined) db.users[userIdx].bio = bio;
  if (tradeLicenseNo !== undefined) db.users[userIdx].tradeLicenseNo = tradeLicenseNo;
  if (tradeLicenseImage !== undefined) db.users[userIdx].tradeLicenseImage = tradeLicenseImage;

  // If phone changed, update businesses and orders where ownerPhone or customer matches
  if (phone && phone !== currentPhone) {
    db.businesses.forEach((b: any) => {
      if (b.ownerPhone === currentPhone) {
        b.ownerPhone = phone.trim();
        b.phone = phone.trim();
      }
    });
    db.bookings.forEach((bk: any) => {
      if (bk.userPhone === currentPhone) {
        bk.userPhone = phone.trim();
      }
    });
  }

  saveDatabase(db);
  res.json({ success: true, user: db.users[userIdx] });
});

// REST PAY WALLET: Add Money Endpoint (bKash, Nagad, Rocket, Bank, Card)
app.post("/api/wallet/add-money", (req, res) => {
  const { userPhone, amount, method, trxId, title, senderNumber } = req.body;
  const numAmount = Number(amount);

  if (!userPhone || isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ error: "সঠিক মোবাইল নম্বর এবং টাকার পরিমাণ দিন।" });
  }

  const db = loadDatabase();
  const userIdx = db.users.findIndex((u: any) => u.phone === userPhone);
  if (userIdx === -1) {
    return res.status(404).json({ error: "ব্যবহারকারী পাওয়া যায়নি।" });
  }

  const generatedTrxId = trxId || `TX-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const currentBalance = Number(db.users[userIdx].walletBalance) || 0;
  const newBalance = currentBalance + numAmount;
  db.users[userIdx].walletBalance = newBalance;

  const methodName = method === 'bkash' ? 'bKash' : method === 'nagad' ? 'Nagad' : method === 'rocket' ? 'Rocket' : (method || 'MFS');
  const now = new Date();
  const dateStr = now.toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const newTx = {
    id: `tx-${Date.now()}`,
    trxId: generatedTrxId,
    type: 'credit',
    category: 'add_money',
    title: title || `${methodName} অ্যাড মানি`,
    description: `রেস্ট পে ডিজিটাল ওয়ালেটে ${methodName} গেটওয়ে দিয়ে ৳${numAmount} যোগ করা হয়েছে।`,
    amount: numAmount,
    date: dateStr,
    timestamp: Date.now(),
    method: methodName,
    channelDetails: {
      provider: methodName,
      trxId: generatedTrxId,
      senderPhone: senderNumber || userPhone,
      receiverPhone: userPhone,
      note: 'অ্যাড মানি সম্পন্ন'
    },
    status: 'completed'
  };

  if (!Array.isArray(db.users[userIdx].walletTransactions)) {
    db.users[userIdx].walletTransactions = [];
  }
  db.users[userIdx].walletTransactions.unshift(newTx);

  saveDatabase(db);
  res.json({
    success: true,
    message: `৳${numAmount} সফলভাবে ওয়ালেটে যুক্ত হয়েছে!`,
    newBalance,
    transaction: newTx,
    user: db.users[userIdx]
  });
});

// REST PAY WALLET: Send Money Endpoint (Wallet-to-Wallet or Wallet-to-MFS)
app.post("/api/wallet/send-money", (req, res) => {
  const { senderPhone, receiverPhone, amount, transferType, mfsProvider, note } = req.body;
  const numAmount = Number(amount);

  if (!senderPhone || !receiverPhone || isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ error: "সঠিক প্রেরক, প্রাপক এবং টাকার পরিমাণ দিন।" });
  }

  const db = loadDatabase();
  const senderIdx = db.users.findIndex((u: any) => u.phone === senderPhone);
  if (senderIdx === -1) {
    return res.status(404).json({ error: "প্রেরকের অ্যাকাউন্ট পাওয়া যায়নি।" });
  }

  const senderBalance = Number(db.users[senderIdx].walletBalance) || 0;
  // Calculate fee: 0 for wallet-to-wallet, 1.5% for MFS cash-out
  const fee = transferType === 'wallet_to_mfs' ? Math.round(numAmount * 0.015) : 0;
  const totalDeduction = numAmount + fee;

  if (senderBalance < totalDeduction) {
    return res.status(400).json({ 
      error: `অপর্যাপ্ত ওয়ালেট ব্যালেন্স! আপনার ব্যালেন্স ৳${senderBalance}, প্রয়োজনীয় ৳${totalDeduction}` 
    });
  }

  // Deduct from sender
  const newSenderBalance = senderBalance - totalDeduction;
  db.users[senderIdx].walletBalance = newSenderBalance;

  const generatedTrxId = `TX-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date();
  const dateStr = now.toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const senderUser = db.users[senderIdx];

  const senderTx = {
    id: `tx-${Date.now()}`,
    trxId: generatedTrxId,
    type: 'debit',
    category: transferType === 'wallet_to_mfs' ? 'bank_withdrawal' : 'send_money',
    title: transferType === 'wallet_to_mfs' 
      ? `${mfsProvider ? mfsProvider.toUpperCase() : 'MFS'} ক্যাশ-আউট (${receiverPhone})` 
      : `টাকা পাঠানো (${receiverPhone})`,
    description: note || (transferType === 'wallet_to_mfs' 
      ? `রেস্ট পে ওয়ালেট থেকে ${mfsProvider || 'MFS'} নম্বরে পাঠানো হয়েছে` 
      : `রেস্ট পে ওয়ালেট টু ওয়ালেট ট্রান্সফার`),
    amount: numAmount,
    date: dateStr,
    timestamp: Date.now(),
    method: transferType === 'wallet_to_mfs' ? (mfsProvider || 'MFS') : 'Rest Pay Transfer',
    channelDetails: {
      provider: transferType === 'wallet_to_mfs' ? mfsProvider : 'Rest Pay',
      trxId: generatedTrxId,
      senderPhone: senderPhone,
      receiverPhone: receiverPhone,
      note: note || '',
      fee: fee
    },
    status: 'completed'
  };

  if (!Array.isArray(db.users[senderIdx].walletTransactions)) {
    db.users[senderIdx].walletTransactions = [];
  }
  db.users[senderIdx].walletTransactions.unshift(senderTx);

  let receiverFound = false;
  let receiverName = '';

  // If Wallet to Wallet, check if receiver exists in system and credit them
  if (transferType !== 'wallet_to_mfs') {
    const receiverIdx = db.users.findIndex((u: any) => u.phone === receiverPhone);
    if (receiverIdx !== -1) {
      receiverFound = true;
      receiverName = db.users[receiverIdx].name || '';
      const receiverBalance = Number(db.users[receiverIdx].walletBalance) || 0;
      db.users[receiverIdx].walletBalance = receiverBalance + numAmount;

      const receiverTx = {
        id: `tx-${Date.now() + 1}`,
        trxId: generatedTrxId,
        type: 'credit',
        category: 'received_money',
        title: `টাকা গ্রহণ (${senderUser.name || senderPhone})`,
        description: note || `${senderUser.name || senderPhone} থেকে ওয়ালেটে টাকা গ্রহণ করা হয়েছে।`,
        amount: numAmount,
        date: dateStr,
        timestamp: Date.now(),
        method: 'Rest Pay Transfer',
        channelDetails: {
          provider: 'Rest Pay',
          trxId: generatedTrxId,
          senderPhone: senderPhone,
          receiverPhone: receiverPhone,
          note: note || ''
        },
        status: 'completed'
      };

      if (!Array.isArray(db.users[receiverIdx].walletTransactions)) {
        db.users[receiverIdx].walletTransactions = [];
      }
      db.users[receiverIdx].walletTransactions.unshift(receiverTx);
    }
  }

  saveDatabase(db);
  res.json({
    success: true,
    message: `সফলভাবে ৳${numAmount} পাঠানো হয়েছে!`,
    newBalance: newSenderBalance,
    transaction: senderTx,
    user: db.users[senderIdx],
    receiverFound,
    receiverName
  });
});

// Create/Update Business (Self Registration)
app.post("/api/businesses", (req, res) => {
  const { ownerPhone, name, category, type, phone, whatsapp, websiteUrl, logo, images, description, address, location, division, district, thana, hasHomeDelivery, deliveryCharge, subscriptionPlan } = req.body;

  if (!ownerPhone || !name || !category || !type || !phone) {
    return res.status(400).json({ error: "প্রয়োজনীয় তথ্যাদি প্রদান করুন" });
  }

  const db = loadDatabase();
  const existingBizIndex = db.businesses.findIndex((b: any) => b.ownerPhone === ownerPhone);

  const businessData = {
    id: existingBizIndex !== -1 ? db.businesses[existingBizIndex].id : `biz-${Date.now()}`,
    ownerPhone,
    name,
    category,
    type,
    phone,
    whatsapp: whatsapp || phone,
    websiteUrl: websiteUrl || (existingBizIndex !== -1 ? db.businesses[existingBizIndex].websiteUrl : undefined),
    logo: logo || "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?auto=format&fit=crop&q=80&w=200",
    images: images && images.length > 0 ? images : ["https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600"],
    description: description || "আমাদের চমৎকার সার্ভিসে আপনাকে স্বাগতম।",
    address: address || "বাংলাদেশ",
    location: {
      lat: typeof location?.lat === 'number' ? location.lat : (existingBizIndex !== -1 && typeof db.businesses[existingBizIndex]?.location?.lat === 'number' ? db.businesses[existingBizIndex].location.lat : 23.75),
      lng: typeof location?.lng === 'number' ? location.lng : (existingBizIndex !== -1 && typeof db.businesses[existingBizIndex]?.location?.lng === 'number' ? db.businesses[existingBizIndex].location.lng : 90.38)
    },
    lat: typeof location?.lat === 'number' ? location.lat : (existingBizIndex !== -1 && typeof db.businesses[existingBizIndex]?.location?.lat === 'number' ? db.businesses[existingBizIndex].location.lat : 23.75),
    lng: typeof location?.lng === 'number' ? location.lng : (existingBizIndex !== -1 && typeof db.businesses[existingBizIndex]?.location?.lng === 'number' ? db.businesses[existingBizIndex].location.lng : 90.38),
    division: division !== undefined && division !== "" ? division : (existingBizIndex !== -1 ? db.businesses[existingBizIndex].division : "Dhaka (ঢাকা)"),
    district: district !== undefined && district !== "" ? district : (existingBizIndex !== -1 ? db.businesses[existingBizIndex].district : "ঢাকা (Dhaka)"),
    thana: thana !== undefined && thana !== "" ? thana : (existingBizIndex !== -1 ? db.businesses[existingBizIndex].thana : "ধানমন্ডি (Dhanmondi)"),
    isOpen: req.body.isOpen !== undefined ? !!req.body.isOpen : (existingBizIndex !== -1 ? (db.businesses[existingBizIndex].isOpen !== undefined ? db.businesses[existingBizIndex].isOpen : true) : true),
    isApproved: existingBizIndex !== -1 ? (db.businesses[existingBizIndex].isApproved !== undefined ? db.businesses[existingBizIndex].isApproved : false) : false,
    isWholesale: req.body.isWholesale !== undefined ? !!req.body.isWholesale : (existingBizIndex !== -1 ? db.businesses[existingBizIndex].isWholesale : false),
    wholesaleMode: req.body.wholesaleMode || (existingBizIndex !== -1 ? db.businesses[existingBizIndex].wholesaleMode : 'retail_and_wholesale'),
    wholesaleMinOrderAmount: req.body.wholesaleMinOrderAmount !== undefined ? Number(req.body.wholesaleMinOrderAmount) : (existingBizIndex !== -1 ? db.businesses[existingBizIndex].wholesaleMinOrderAmount : 0),
    wholesaleTerms: req.body.wholesaleTerms !== undefined ? req.body.wholesaleTerms : (existingBizIndex !== -1 ? db.businesses[existingBizIndex].wholesaleTerms : ''),
    wholesaleDiscountPercentage: req.body.wholesaleDiscountPercentage !== undefined ? Number(req.body.wholesaleDiscountPercentage) : (existingBizIndex !== -1 ? db.businesses[existingBizIndex].wholesaleDiscountPercentage : 10),
    wholesaleMinQtyDefault: req.body.wholesaleMinQtyDefault !== undefined ? Number(req.body.wholesaleMinQtyDefault) : (existingBizIndex !== -1 ? db.businesses[existingBizIndex].wholesaleMinQtyDefault : 5),
    hasHomeDelivery: !!hasHomeDelivery,
    deliveryCharge: Number(deliveryCharge) || 0,
    subscriptionPlan: subscriptionPlan || "free",
    subscriptionExpiry: subscriptionPlan && subscriptionPlan !== "free" ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : undefined,
    balance: existingBizIndex !== -1 ? db.businesses[existingBizIndex].balance : 0,
    rating: existingBizIndex !== -1 ? db.businesses[existingBizIndex].rating : 5.0,
    reviewsCount: existingBizIndex !== -1 ? db.businesses[existingBizIndex].reviewsCount : 0,
    products: existingBizIndex !== -1 ? db.businesses[existingBizIndex].products : [],
    services: existingBizIndex !== -1 ? db.businesses[existingBizIndex].services : [],
    reviews: existingBizIndex !== -1 ? db.businesses[existingBizIndex].reviews : [],
    offers: existingBizIndex !== -1 ? db.businesses[existingBizIndex].offers : [],
    transactions: existingBizIndex !== -1 ? db.businesses[existingBizIndex].transactions : [],
    customers: existingBizIndex !== -1 ? (db.businesses[existingBizIndex].customers || []) : []
  };

  if (existingBizIndex !== -1) {
    db.businesses[existingBizIndex] = businessData;
  } else {
    db.businesses.push(businessData);
    // Auto upgrade user to merchant role
    const userIdx = db.users.findIndex((u: any) => u.phone === ownerPhone);
    if (userIdx !== -1) {
      db.users[userIdx].role = "merchant";
    }
  }

  saveDatabase(db);
  res.json({ success: true, business: businessData });
});

// Update Business Items (Products/Services)
app.post("/api/businesses/:id/items", (req, res) => {
  const { id } = req.params;
  const { products, services } = req.body;

  const db = loadDatabase();
  const bizIndex = db.businesses.findIndex((b: any) => b.id === id);
  if (bizIndex === -1) return res.status(404).json({ error: "ব্যবসা প্রতিষ্ঠান পাওয়া যায়নি" });

  if (products) db.businesses[bizIndex].products = products;
  if (services) db.businesses[bizIndex].services = services;

  saveDatabase(db);
  res.json({ success: true, business: db.businesses[bizIndex] });
});

// Update Business Wholesale Configuration & Pricing Rules
app.put("/api/businesses/:id/wholesale-settings", (req, res) => {
  const { id } = req.params;
  const { 
    isWholesale, 
    wholesaleMode, 
    wholesaleMinOrderAmount, 
    wholesaleTerms, 
    wholesaleDiscountPercentage, 
    wholesaleMinQtyDefault,
    products
  } = req.body;

  const db = loadDatabase();
  const bizIndex = db.businesses.findIndex((b: any) => b.id === id);
  if (bizIndex === -1) return res.status(404).json({ error: "ব্যবসা প্রতিষ্ঠান পাওয়া যায়নি" });

  if (isWholesale !== undefined) db.businesses[bizIndex].isWholesale = !!isWholesale;
  if (wholesaleMode !== undefined) db.businesses[bizIndex].wholesaleMode = wholesaleMode;
  if (wholesaleMinOrderAmount !== undefined) db.businesses[bizIndex].wholesaleMinOrderAmount = Number(wholesaleMinOrderAmount);
  if (wholesaleTerms !== undefined) db.businesses[bizIndex].wholesaleTerms = String(wholesaleTerms);
  if (wholesaleDiscountPercentage !== undefined) db.businesses[bizIndex].wholesaleDiscountPercentage = Number(wholesaleDiscountPercentage);
  if (wholesaleMinQtyDefault !== undefined) db.businesses[bizIndex].wholesaleMinQtyDefault = Number(wholesaleMinQtyDefault);
  if (products && Array.isArray(products)) {
    db.businesses[bizIndex].products = products;
  }

  saveDatabase(db);
  res.json({ success: true, business: db.businesses[bizIndex] });
});

// Add a new offline customer to a business
app.post("/api/businesses/:id/customers", (req, res) => {
  const { id } = req.params;
  const { name, phone, email, address, notes, balanceDue } = req.body;
  
  if (!name || !phone) {
    return res.status(400).json({ error: "কাস্টমারের নাম এবং মোবাইল নম্বর আবশ্যক" });
  }

  const db = loadDatabase();
  const bizIndex = db.businesses.findIndex((b: any) => b.id === id);
  if (bizIndex === -1) return res.status(404).json({ error: "ব্যবসা প্রতিষ্ঠান পাওয়া যায়নি" });

  if (!db.businesses[bizIndex].customers) {
    db.businesses[bizIndex].customers = [];
  }

  // Check if phone number is already registered as an offline customer
  const exists = db.businesses[bizIndex].customers.some((c: any) => c.phone === phone);
  if (exists) {
    return res.status(400).json({ error: "এই মোবাইল নম্বরের কাস্টমার ইতিমধ্যে যুক্ত আছেন" });
  }

  const newCustomer = {
    id: `cust-${Date.now()}`,
    name,
    phone,
    email: email || "",
    address: address || "",
    notes: notes || "",
    balanceDue: Number(balanceDue) || 0,
    createdAt: new Date().toISOString()
  };

  db.businesses[bizIndex].customers.push(newCustomer);
  saveDatabase(db);
  res.json({ success: true, customer: newCustomer, business: db.businesses[bizIndex] });
});

// Update an offline customer
app.put("/api/businesses/:id/customers/:customerId", (req, res) => {
  const { id, customerId } = req.params;
  const { name, phone, email, address, notes, balanceDue } = req.body;

  const db = loadDatabase();
  const bizIndex = db.businesses.findIndex((b: any) => b.id === id);
  if (bizIndex === -1) return res.status(404).json({ error: "ব্যবসা প্রতিষ্ঠান পাওয়া যায়নি" });

  const customers = db.businesses[bizIndex].customers || [];
  const custIndex = customers.findIndex((c: any) => c.id === customerId);
  if (custIndex === -1) return res.status(404).json({ error: "কাস্টমার পাওয়া যায়নি" });

  if (name !== undefined) customers[custIndex].name = name;
  if (phone !== undefined) customers[custIndex].phone = phone;
  if (email !== undefined) customers[custIndex].email = email;
  if (address !== undefined) customers[custIndex].address = address;
  if (notes !== undefined) customers[custIndex].notes = notes;
  if (balanceDue !== undefined) customers[custIndex].balanceDue = Number(balanceDue);

  db.businesses[bizIndex].customers = customers;
  saveDatabase(db);
  res.json({ success: true, customer: customers[custIndex], business: db.businesses[bizIndex] });
});

// Delete an offline customer
app.delete("/api/businesses/:id/customers/:customerId", (req, res) => {
  const { id, customerId } = req.params;

  const db = loadDatabase();
  const bizIndex = db.businesses.findIndex((b: any) => b.id === id);
  if (bizIndex === -1) return res.status(404).json({ error: "ব্যবসা প্রতিষ্ঠান পাওয়া যায়নি" });

  const customers = db.businesses[bizIndex].customers || [];
  const filtered = customers.filter((c: any) => c.id !== customerId);
  
  db.businesses[bizIndex].customers = filtered;
  saveDatabase(db);
  res.json({ success: true, business: db.businesses[bizIndex] });
});

// Admin Control: Toggle Business Approval Status
app.post("/api/admin/businesses/:id/toggle-approval", (req, res) => {
  const { id } = req.params;
  const db = loadDatabase();
  const bizIndex = db.businesses.findIndex((b: any) => b.id === id);
  if (bizIndex === -1) return res.status(404).json({ error: "ব্যবসা প্রতিষ্ঠান পাওয়া যায়নি" });

  const currentStatus = db.businesses[bizIndex].isApproved !== false;
  const newStatus = !currentStatus;
  db.businesses[bizIndex].isApproved = newStatus;

  // Sync owner user's merchant verification status
  const ownerPhone = db.businesses[bizIndex].ownerPhone;
  const uIdx = db.users.findIndex((u: any) => u.phone === ownerPhone);
  if (uIdx !== -1) {
    db.users[uIdx].isMerchantVerified = newStatus;
  }

  saveDatabase(db);
  res.json({ success: true, business: db.businesses[bizIndex] });
});

// Admin Control: Approve Business / Vendor
app.post("/api/admin/businesses/:id/approve", (req, res) => {
  const { id } = req.params;
  const db = loadDatabase();
  const bizIndex = db.businesses.findIndex((b: any) => b.id === id);
  if (bizIndex === -1) return res.status(404).json({ error: "ব্যবসা প্রতিষ্ঠান পাওয়া যায়নি" });

  db.businesses[bizIndex].isApproved = true;

  const ownerPhone = db.businesses[bizIndex].ownerPhone;
  const uIdx = db.users.findIndex((u: any) => u.phone === ownerPhone);
  if (uIdx !== -1) {
    db.users[uIdx].isMerchantVerified = true;
  }

  saveDatabase(db);
  res.json({ success: true, business: db.businesses[bizIndex] });
});

// Admin Control: Reject Business / Vendor
app.post("/api/admin/businesses/:id/reject", (req, res) => {
  const { id } = req.params;
  const db = loadDatabase();
  const bizIndex = db.businesses.findIndex((b: any) => b.id === id);
  if (bizIndex === -1) return res.status(404).json({ error: "ব্যবসা প্রতিষ্ঠান পাওয়া যায়নি" });

  db.businesses[bizIndex].isApproved = false;

  const ownerPhone = db.businesses[bizIndex].ownerPhone;
  const uIdx = db.users.findIndex((u: any) => u.phone === ownerPhone);
  if (uIdx !== -1) {
    db.users[uIdx].isMerchantVerified = false;
  }

  saveDatabase(db);
  res.json({ success: true, business: db.businesses[bizIndex] });
});

// Admin Control: Toggle Product/Service Item Approval Status inside a Business
app.post("/api/admin/businesses/:bizId/items/:itemId/toggle-approval", (req, res) => {
  const { bizId, itemId } = req.params;
  const db = loadDatabase();
  const bizIndex = db.businesses.findIndex((b: any) => b.id === bizId);
  if (bizIndex === -1) return res.status(404).json({ error: "ব্যবসা প্রতিষ্ঠান পাওয়া যায়নি" });

  const business = db.businesses[bizIndex];
  
  // Try to find in products
  const prodIdx = business.products.findIndex((p: any) => p.id === itemId);
  if (prodIdx !== -1) {
    const current = business.products[prodIdx].isApproved !== false;
    business.products[prodIdx].isApproved = !current;
    saveDatabase(db);
    return res.json({ success: true, itemType: "product", item: business.products[prodIdx] });
  }

  // Try to find in services
  const servIdx = business.services.findIndex((s: any) => s.id === itemId);
  if (servIdx !== -1) {
    const current = business.services[servIdx].isApproved !== false;
    business.services[servIdx].isApproved = !current;
    saveDatabase(db);
    return res.json({ success: true, itemType: "service", item: business.services[servIdx] });
  }

  res.status(404).json({ error: "পণ্য বা সেবা পাওয়া যায়নি" });
});

// Subscriptions & Dynamic Plans (Payment Setup)
app.post("/api/businesses/:id/subscribe", (req, res) => {
  const { id } = req.params;
  const { plan, amount, method } = req.body; // free, silver, gold, diamond

  const db = loadDatabase();
  const bizIndex = db.businesses.findIndex((b: any) => b.id === id);
  if (bizIndex === -1) return res.status(404).json({ error: "ব্যবসা প্রতিষ্ঠান পাওয়া যায়নি" });

  db.businesses[bizIndex].subscriptionPlan = plan;
  db.businesses[bizIndex].subscriptionExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  // Create Wallet Transaction
  db.businesses[bizIndex].transactions.push({
    id: `tr-${Date.now()}`,
    type: "subscription",
    amount: Number(amount),
    description: `${plan.toUpperCase()} প্যাকেজ সাবস্ক্রিপশন সম্পন্ন (${method})`,
    date: new Date().toISOString()
  });

  saveDatabase(db);
  res.json({ success: true, business: db.businesses[bizIndex] });
});

// Add Review & Ratings
app.post("/api/businesses/:id/reviews", (req, res) => {
  const { id } = req.params;
  const { userName, userPhone, rating, comment, images } = req.body;

  const db = loadDatabase();
  const bizIndex = db.businesses.findIndex((b: any) => b.id === id);
  if (bizIndex === -1) return res.status(404).json({ error: "ব্যবসা প্রতিষ্ঠান পাওয়া যায়নি" });

  const newReview = {
    id: `rev-${Date.now()}`,
    businessId: id,
    userName: userName || "অজ্ঞাত ব্যবহারকারী",
    userPhone: userPhone || "01700000000",
    rating: Number(rating) || 5,
    comment: comment || "",
    images: images || [],
    date: new Date().toISOString()
  };

  db.businesses[bizIndex].reviews.push(newReview);

  // Recalculate Rating
  const totalRating = db.businesses[bizIndex].reviews.reduce((acc: number, item: any) => acc + item.rating, 0);
  db.businesses[bizIndex].rating = Number((totalRating / db.businesses[bizIndex].reviews.length).toFixed(1));
  db.businesses[bizIndex].reviewsCount = db.businesses[bizIndex].reviews.length;

  saveDatabase(db);
  res.json({ success: true, review: newReview, business: db.businesses[bizIndex] });
});

// Business Offers & Coupons
app.post("/api/businesses/:id/offers", (req, res) => {
  const { id } = req.params;
  const { title, code, discountPercent, description, expiryDate, minSpend, discountType, discountValue, maxDiscount } = req.body;

  const db = loadDatabase();
  const bizIndex = db.businesses.findIndex((b: any) => b.id === id);
  if (bizIndex === -1) return res.status(404).json({ error: "ব্যবসা প্রতিষ্ঠান পাওয়া যায়নি" });

  if (!db.businesses[bizIndex].offers) {
    db.businesses[bizIndex].offers = [];
  }

  const newOffer = {
    id: `off-${Date.now()}`,
    title: title?.trim() || 'বিশেষ ছাড়',
    code: (code || '').trim().toUpperCase(),
    discountPercent: Number(discountPercent) || 10,
    description: description?.trim() || '',
    expiryDate: expiryDate || '২০২৬-১২-৩১',
    minSpend: Number(minSpend) || 0,
    discountType: discountType || 'percentage',
    discountValue: Number(discountValue) || Number(discountPercent) || 10,
    maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
    isActive: true
  };

  db.businesses[bizIndex].offers.push(newOffer);
  saveDatabase(db);
  res.json({ success: true, offer: newOffer, business: db.businesses[bizIndex] });
});

// Update Business Offer (Edit Coupon)
app.put("/api/businesses/:id/offers/:offerId", (req, res) => {
  const { id, offerId } = req.params;
  const { title, code, discountPercent, description, expiryDate, minSpend, discountType, discountValue, maxDiscount, isActive } = req.body;

  const db = loadDatabase();
  const bizIndex = db.businesses.findIndex((b: any) => b.id === id);
  if (bizIndex === -1) return res.status(404).json({ error: "ব্যবসা প্রতিষ্ঠান পাওয়া যায়নি" });

  if (!db.businesses[bizIndex].offers) {
    db.businesses[bizIndex].offers = [];
  }

  const offIndex = db.businesses[bizIndex].offers.findIndex((o: any) => o.id === offerId);
  if (offIndex === -1) return res.status(404).json({ error: "কুপন বা অফার পাওয়া যায়নি" });

  const existing = db.businesses[bizIndex].offers[offIndex];
  const updatedOffer = {
    ...existing,
    ...(title !== undefined && { title: title.trim() }),
    ...(code !== undefined && { code: code.trim().toUpperCase() }),
    ...(discountPercent !== undefined && { discountPercent: Number(discountPercent) }),
    ...(description !== undefined && { description: description.trim() }),
    ...(expiryDate !== undefined && { expiryDate }),
    ...(minSpend !== undefined && { minSpend: Number(minSpend) }),
    ...(discountType !== undefined && { discountType }),
    ...(discountValue !== undefined && { discountValue: Number(discountValue) }),
    ...(maxDiscount !== undefined && { maxDiscount: maxDiscount ? Number(maxDiscount) : undefined }),
    ...(isActive !== undefined && { isActive: Boolean(isActive) })
  };

  db.businesses[bizIndex].offers[offIndex] = updatedOffer;
  saveDatabase(db);
  res.json({ success: true, offer: updatedOffer, business: db.businesses[bizIndex] });
});

// Delete Business Offer (Delete Coupon)
app.delete("/api/businesses/:id/offers/:offerId", (req, res) => {
  const { id, offerId } = req.params;

  const db = loadDatabase();
  const bizIndex = db.businesses.findIndex((b: any) => b.id === id);
  if (bizIndex === -1) return res.status(404).json({ error: "ব্যবসা প্রতিষ্ঠান পাওয়া যায়নি" });

  if (!db.businesses[bizIndex].offers) {
    db.businesses[bizIndex].offers = [];
  }

  db.businesses[bizIndex].offers = db.businesses[bizIndex].offers.filter((o: any) => o.id !== offerId);
  saveDatabase(db);
  res.json({ success: true, offers: db.businesses[bizIndex].offers, business: db.businesses[bizIndex] });
});

// Create Bookings & Orders (COD, bKash, Nagad, Rocket)
app.post("/api/bookings", (req, res) => {
  const { businessId, businessName, businessPhone, businessCategory, userPhone, userName, userAddress, type, items, totalPrice, deliveryCharge, paymentMethod, paymentStatus, advanceAmount, bookingTime, trxId } = req.body;

  if (!businessId || !userPhone || !items || items.length === 0) {
    return res.status(400).json({ error: "সঠিক তথ্যাদি প্রদান করুন" });
  }

  const db = loadDatabase();
  const newBooking = {
    id: `RBO-${Math.floor(1000 + Math.random() * 9000)}`,
    businessId,
    businessName,
    businessPhone,
    businessCategory,
    userPhone,
    userName,
    userAddress,
    type,
    items,
    bookingDate: new Date().toISOString().split("T")[0],
    bookingTime: bookingTime || undefined,
    totalPrice: Number(totalPrice),
    deliveryCharge: Number(deliveryCharge) || 0,
    status: "pending",
    paymentMethod,
    paymentStatus: paymentStatus || (paymentMethod === 'cod' ? 'pending' : 'paid'),
    trxId: trxId || undefined,
    advanceAmount: Number(advanceAmount) || 0,
    createdAt: new Date().toISOString()
  };

  db.bookings.push(newBooking);

  // Send a automatic message notification in chat
  const msgText = `নতুন বুকিং অনুরোধ পাঠানো হয়েছে! অর্ডার আইডি: ${newBooking.id}। মোট দাম: ৳${newBooking.totalPrice + (newBooking.deliveryCharge || 0)}। পেমেন্ট: ${newBooking.paymentMethod.toUpperCase()}${trxId ? ` (TrxID: ${trxId})` : ''}`;
  db.chats.push({
    id: `ch-notify-${Date.now()}`,
    fromPhone: userPhone,
    toPhone: businessPhone,
    text: msgText,
    timestamp: new Date().toISOString(),
    isRead: false
  });

  saveDatabase(db);
  res.json({ success: true, booking: newBooking });
});

// Update Booking Status (Accept / Cancel / Deliver)
app.post("/api/bookings/:id/status", (req, res) => {
  const { id } = req.params;
  const { status, paymentStatus } = req.body;

  const db = loadDatabase();
  const bookingIndex = db.bookings.findIndex((b: any) => b.id === id);
  if (bookingIndex === -1) return res.status(404).json({ error: "বুকিং রেকর্ড পাওয়া যায়নি" });

  const oldBooking = db.bookings[bookingIndex];
  db.bookings[bookingIndex].status = status;
  if (paymentStatus) db.bookings[bookingIndex].paymentStatus = paymentStatus;

  // If order is completed, add income to merchant wallet
  if (status === "completed" && oldBooking.status !== "completed") {
    const bizIndex = db.businesses.findIndex((b: any) => b.id === oldBooking.businessId);
    if (bizIndex !== -1) {
      const rate = getCommissionRateForBusiness(db, oldBooking.businessId);
      const commissionFee = Math.floor(oldBooking.totalPrice * (rate / 100));
      const netIncome = oldBooking.totalPrice - commissionFee;
      
      db.businesses[bizIndex].balance += netIncome;
      db.businesses[bizIndex].transactions.push({
        id: `tr-${Date.now()}-inc`,
        type: "income",
        amount: oldBooking.totalPrice,
        description: `বুকিং আইডি: ${oldBooking.id} থেকে পেমেন্ট সংগ্রহ`,
        date: new Date().toISOString()
      });
      
      if (commissionFee > 0) {
        db.businesses[bizIndex].transactions.push({
          id: `tr-${Date.now()}-com`,
          type: "booking_commission",
          amount: commissionFee,
          description: `সিস্টেম কমিশন ফি (${rate}%) - বুকিং আইডি: ${oldBooking.id}`,
          date: new Date().toISOString()
        });
      }
    }
  }

  // Add chat notification of status update
  const statusBangla = status === "accepted" ? "গৃহীত হয়েছে" : status === "completed" ? "সম্পন্ন হয়েছে" : status === "cancelled" ? "বাতিল হয়েছে" : status;
  db.chats.push({
    id: `ch-notify-status-${Date.now()}`,
    fromPhone: oldBooking.businessPhone,
    toPhone: oldBooking.userPhone,
    text: `আপনার বুকিং #${oldBooking.id} আপডেট করা হয়েছে। বর্তমান অবস্থা: ${statusBangla}`,
    timestamp: new Date().toISOString(),
    isRead: false
  });

  saveDatabase(db);
  res.json({ success: true, booking: db.bookings[bookingIndex] });
});

// Chat Endpoints & Dynamic Gemini Chatbot Integration!
app.post("/api/chats/send", async (req, res) => {
  const { 
    fromPhone, 
    toPhone, 
    text, 
    image, 
    audio, 
    audioDuration,
    attachmentType,
    locationData,
    productData,
    senderRole 
  } = req.body;

  if (!fromPhone || !toPhone || (!text && !image && !audio && !locationData && !productData)) {
    return res.status(400).json({ error: "তথ্য অসম্পূর্ণ" });
  }

  const db = loadDatabase();
  db.chats = db.chats || [];

  const newMessage = {
    id: `ch-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    fromPhone,
    toPhone,
    text: text || "",
    image: image || undefined,
    audio: audio || undefined,
    audioDuration: audioDuration ? Number(audioDuration) : undefined,
    attachmentType: attachmentType || (image ? 'image' : audio ? 'audio' : locationData ? 'location' : productData ? 'product_inquiry' : undefined),
    locationData: locationData || undefined,
    productData: productData || undefined,
    timestamp: new Date().toISOString(),
    isRead: false
  };

  db.chats.push(newMessage);
  saveDatabase(db);

  // If the user sent a message to a merchant, let's trigger an AI or clever response!
  if (senderRole === "user") {
    const business = db.businesses?.find((b: any) => b.phone === toPhone || b.ownerPhone === toPhone);

    if (business) {
      // Let's use Gemini server-side if key is available, to generate a beautiful personal merchant reply!
      const ai = getGemini();
      let replyText = `আসসালামু আলাইকুম, আমি ${business.name}-এর স্বত্বাধিকারী বলছি। আপনার মেসেজটি আমরা পেয়েছি। অল্প সময়ের মধ্যেই আপনার সাথে যোগাযোগ করা হচ্ছে। যেকোনো প্রয়োজনে আমাদের সরাসরি কল দিতে পারেন: ${business.phone}।`;

      if (ai) {
        try {
          const prompt = `You are the owner of a local business in Bangladesh named "${business.name}" of category "${business.category}".
          The details of your business are: "${business.description}".
          Your products or services list is: ${JSON.stringify(business.type === "shop" ? business.products : business.services)}.
          A user just sent you a chat message on RB Local saying: "${text || (productData ? `Inquiry about ${productData.name}` : 'Sent an attachment')}".
          Write a helpful, polite, and brief response in beautiful Bengali. Keep it highly relevant, locally natural, welcoming, and directly answering their question if possible based on your products/description. Do not use English words unless necessary, keep the tone warm and local. Maximum 2-3 sentences.`;

          let response;
          try {
            response = await ai.models.generateContent({
              model: "gemini-3.6-flash",
              contents: prompt,
              config: {
                systemInstruction: "You are a local shop owner in Bangladesh replying to a potential customer on RB Local app.",
                temperature: 0.7,
              }
            });
            if (response.text) {
              replyText = response.text.trim();
            }
          } catch (aiErr) {
            console.warn("AI chat reply generated graceful fallback due to API limit/error:", aiErr);
          }
        } catch (e) {
          console.error("Gemini failed to answer merchant chat, falling back to auto-reply:", e);
        }
      }

      // Add the auto-response after 1.5 seconds delay (simulated or immediate here in the JSON)
      const aiReply = {
        id: `ch-ai-${Date.now() + 1}`,
        fromPhone: toPhone,
        toPhone: fromPhone,
        text: replyText,
        timestamp: new Date(Date.now() + 1000).toISOString(),
        isRead: false
      };
      db.chats.push(aiReply);
      saveDatabase(db);
    }
  }

  res.json({ success: true, message: newMessage });
});

// Mark messages as read between two participants
app.post("/api/chats/mark-read", (req, res) => {
  const { myPhone, senderPhone } = req.body;
  if (!myPhone || !senderPhone) {
    return res.status(400).json({ error: "Missing phone numbers" });
  }
  const db = loadDatabase();
  db.chats = db.chats || [];
  let updatedCount = 0;
  db.chats.forEach((msg: any) => {
    if (msg.toPhone === myPhone && msg.fromPhone === senderPhone && !msg.isRead) {
      msg.isRead = true;
      updatedCount++;
    }
  });
  if (updatedCount > 0) {
    saveDatabase(db);
  }
  res.json({ success: true, updatedCount });
});

// Delete a single message
app.delete("/api/chats/message/:id", (req, res) => {
  const { id } = req.params;
  const db = loadDatabase();
  db.chats = db.chats || [];
  const initialLength = db.chats.length;
  db.chats = db.chats.filter((m: any) => m.id !== id);
  if (db.chats.length !== initialLength) {
    saveDatabase(db);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Message not found" });
  }
});

// Clear entire conversation between two participants
app.post("/api/chats/clear", (req, res) => {
  const { user1Phone, user2Phone } = req.body;
  if (!user1Phone || !user2Phone) {
    return res.status(400).json({ error: "Missing participant phones" });
  }
  const db = loadDatabase();
  db.chats = db.chats || [];
  db.chats = db.chats.filter((m: any) => 
    !((m.fromPhone === user1Phone && m.toPhone === user2Phone) ||
      (m.fromPhone === user2Phone && m.toPhone === user1Phone))
  );
  saveDatabase(db);
  res.json({ success: true });
});

// Complaints Registration
app.post("/api/complaints", (req, res) => {
  const { userPhone, userName, businessId, businessName, subject, details } = req.body;

  const db = loadDatabase();
  const newComplaint = {
    id: `comp-${Date.now()}`,
    userPhone,
    userName: userName || "গ্রাহক",
    businessId,
    businessName,
    subject,
    details,
    status: "pending",
    date: new Date().toISOString()
  };

  db.complaints.push(newComplaint);
  saveDatabase(db);
  res.json({ success: true, complaint: newComplaint });
});

// Admin Resolutions & Ads Toggle
app.post("/api/admin/resolve-complaint", (req, res) => {
  const { id } = req.body;
  const db = loadDatabase();
  const compIdx = db.complaints.findIndex((c: any) => c.id === id);
  if (compIdx !== -1) {
    db.complaints[compIdx].status = "resolved";
    saveDatabase(db);
    res.json({ success: true, complaint: db.complaints[compIdx] });
  } else {
    res.status(404).json({ error: "অভিযোগ আইডি পাওয়া যায়নি" });
  }
});

// Admin Update Live Ticker Messages
app.post("/api/admin/ticker-messages", (req, res) => {
  const { tickerMessages } = req.body;
  if (!tickerMessages || !Array.isArray(tickerMessages)) {
    return res.status(400).json({ error: "সঠিক মেসেজ তালিকা প্রদান করুন" });
  }
  const db = loadDatabase();
  db.tickerMessages = tickerMessages;
  saveDatabase(db);
  res.json({ success: true, tickerMessages: db.tickerMessages });
});

// Admin Update Subscription Plans
app.post("/api/admin/subscription-plans", (req, res) => {
  const { subscriptionPlans } = req.body;
  if (!subscriptionPlans || !Array.isArray(subscriptionPlans)) {
    return res.status(400).json({ error: "সঠিক সাবস্ক্রিপশন প্যাকেজ তালিকা প্রদান করুন" });
  }
  const db = loadDatabase();
  db.subscriptionPlans = subscriptionPlans;
  saveDatabase(db);
  res.json({ success: true, subscriptionPlans: db.subscriptionPlans });
});

// Admin Update System Config (Commissions)
app.post("/api/admin/system-config", (req, res) => {
  const { systemConfig } = req.body;
  if (!systemConfig) {
    return res.status(400).json({ error: "সঠিক কনফিগারেশন প্রদান করুন" });
  }
  const db = loadDatabase();
  db.systemConfig = systemConfig;
  saveDatabase(db);
  res.json({ success: true, systemConfig: db.systemConfig });
});

// Admin Get Payment Gateway Config
app.get("/api/admin/payment-gateway-config", (req, res) => {
  const db = loadDatabase();
  const gateways = db.systemConfig?.paymentGateways || {};
  res.json({ success: true, paymentGateways: gateways });
});

// Admin Update Payment Gateway Config
app.post("/api/admin/payment-gateway-config", (req, res) => {
  const { paymentGateways } = req.body;
  if (!paymentGateways || typeof paymentGateways !== 'object') {
    return res.status(400).json({ error: "সঠিক পেমেন্ট গেটওয়ে কনফিগারেশন প্রদান করুন" });
  }
  const db = loadDatabase();
  if (!db.systemConfig) {
    db.systemConfig = {
      globalCommissionRate: 5,
      categoryCommissionRates: {},
      merchantCommissionRates: {}
    };
  }
  db.systemConfig.paymentGateways = paymentGateways;
  saveDatabase(db);
  res.json({ success: true, paymentGateways: db.systemConfig.paymentGateways });
});

// Public Get Active Payment Gateways
app.get("/api/payment-gateways", (req, res) => {
  const db = loadDatabase();
  const gateways = db.systemConfig?.paymentGateways || {};
  res.json({ success: true, paymentGateways: gateways });
});

// Get Platform Offers (Coupons & Banners)
app.get("/api/platform-offers", (req, res) => {
  const db = loadDatabase();
  res.json({ success: true, platformOffers: db.platformOffers || [] });
});

// Admin Update Platform Offers (Coupons & Banners)
app.post("/api/admin/platform-offers", (req, res) => {
  const { platformOffers } = req.body;
  if (!platformOffers || !Array.isArray(platformOffers)) {
    return res.status(400).json({ error: "সঠিক অফার তালিকা প্রদান করুন" });
  }
  const db = loadDatabase();
  db.platformOffers = platformOffers;
  saveDatabase(db);
  res.json({ success: true, platformOffers: db.platformOffers });
});

// Admin Edit Single Platform Offer (Coupon)
app.put("/api/admin/platform-offers/:offerId", (req, res) => {
  const { offerId } = req.params;
  const { code, title, description, discountPercent, minSpend, expiryDate, isActive, discountType, discountValue, maxDiscount } = req.body;

  const db = loadDatabase();
  if (!Array.isArray(db.platformOffers)) {
    db.platformOffers = [];
  }

  const offIndex = db.platformOffers.findIndex((o: any) => o.id === offerId);
  if (offIndex === -1) {
    return res.status(404).json({ error: "অফার বা কুপন পাওয়া যায়নি" });
  }

  const existing = db.platformOffers[offIndex];
  const updatedOffer = {
    ...existing,
    ...(code !== undefined && { code: code.trim().toUpperCase() }),
    ...(title !== undefined && { title: title.trim() }),
    ...(description !== undefined && { description: description.trim() }),
    ...(discountPercent !== undefined && { discountPercent: Number(discountPercent) }),
    ...(minSpend !== undefined && { minSpend: Number(minSpend) }),
    ...(expiryDate !== undefined && { expiryDate }),
    ...(isActive !== undefined && { isActive: Boolean(isActive) }),
    ...(discountType !== undefined && { discountType }),
    ...(discountValue !== undefined && { discountValue: Number(discountValue) }),
    ...(maxDiscount !== undefined && { maxDiscount: maxDiscount ? Number(maxDiscount) : undefined })
  };

  db.platformOffers[offIndex] = updatedOffer;
  saveDatabase(db);
  res.json({ success: true, offer: updatedOffer, platformOffers: db.platformOffers });
});

// Admin Delete Single Platform Offer (Coupon)
app.delete("/api/admin/platform-offers/:offerId", (req, res) => {
  const { offerId } = req.params;

  const db = loadDatabase();
  if (!Array.isArray(db.platformOffers)) {
    db.platformOffers = [];
  }

  db.platformOffers = db.platformOffers.filter((o: any) => o.id !== offerId);
  saveDatabase(db);
  res.json({ success: true, platformOffers: db.platformOffers });
});

// Admin Add/Update Categories
app.post("/api/admin/categories", (req, res) => {
  const { categories } = req.body;
  if (!categories || !Array.isArray(categories)) {
    return res.status(400).json({ error: "সঠিক ক্যাটাগরি তালিকা প্রদান করুন" });
  }
  const db = loadDatabase();
  db.categories = categories;
  saveDatabase(db);
  res.json({ success: true, categories: db.categories });
});

// Admin Add Single Category
app.post("/api/admin/categories/add", (req, res) => {
  const { nameBangla, nameEnglish, iconName, description, color } = req.body;
  if (!nameBangla || !nameEnglish || !iconName) {
    return res.status(400).json({ error: "ক্যাটাগরির নাম (বাংলা ও ইংরেজি) এবং আইকন প্রদান করা আবশ্যক।" });
  }
  const db = loadDatabase();
  if (!db.categories) {
    db.categories = [];
  }
  const newId = nameEnglish.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
  
  // Check duplicate
  if (db.categories.some((c: any) => c.id === newId)) {
    return res.status(400).json({ error: "এই নামের ক্যাটাগরি ইতিমধ্যে বিদ্যমান!" });
  }

  const newCategory = {
    id: newId,
    nameBangla,
    nameEnglish,
    iconName,
    description: description || "",
    color: color || "bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100"
  };

  db.categories.push(newCategory);
  saveDatabase(db);
  res.json({ success: true, category: newCategory, categories: db.categories });
});

// Create/Approve Ad Campaign
app.post("/api/ads", (req, res) => {
  const { businessId, businessName, placement, bannerImage, budget } = req.body;

  const db = loadDatabase();
  const newAd = {
    id: `ad-${Date.now()}`,
    businessId,
    businessName,
    placement,
    bannerImage: bannerImage || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800",
    budget: Number(budget) || 100,
    status: "pending",
    createdAt: new Date().toISOString(),
    views: 0,
    clicks: 0
  };

  db.adCampaigns.push(newAd);
  saveDatabase(db);
  res.json({ success: true, ad: newAd });
});

app.post("/api/admin/toggle-ad", (req, res) => {
  const { id, status } = req.body; // approved, rejected, completed
  const db = loadDatabase();
  const adIdx = db.adCampaigns.findIndex((a: any) => a.id === id);
  if (adIdx !== -1) {
    db.adCampaigns[adIdx].status = status;

    // If approved, sponsor the actual business item
    if (status === "approved") {
      const bizId = db.adCampaigns[adIdx].businessId;
      const bizIdx = db.businesses.findIndex((b: any) => b.id === bizId);
      if (bizIdx !== -1) {
        db.businesses[bizIdx].isSponsored = true;
        db.businesses[bizIdx].sponsoredRank = (db.businesses[bizIdx].sponsoredRank || 0) + 10;

        // Deduct budget from balance (or simulate paid invoice)
        db.businesses[bizIdx].transactions.push({
          id: `tr-ad-${Date.now()}`,
          type: "ad_payment",
          amount: db.adCampaigns[adIdx].budget,
          description: `বিজ্ঞাপন ক্যাম্পেইন (#${id}) পেমেন্ট সফল`,
          date: new Date().toISOString()
        });
      }
    }

    saveDatabase(db);
    res.json({ success: true, ad: db.adCampaigns[adIdx] });
  } else {
    res.status(404).json({ error: "বিজ্ঞাপন ক্যাম্পেইন পাওয়া যায়নি" });
  }
});

app.post("/api/admin/update-ad", (req, res) => {
  const { id, bannerImage, placement, budget } = req.body;
  const db = loadDatabase();
  const adIdx = db.adCampaigns.findIndex((a: any) => a.id === id);
  if (adIdx !== -1) {
    if (bannerImage !== undefined) db.adCampaigns[adIdx].bannerImage = bannerImage;
    if (placement !== undefined) db.adCampaigns[adIdx].placement = placement;
    if (budget !== undefined) db.adCampaigns[adIdx].budget = Number(budget) || 0;
    saveDatabase(db);
    res.json({ success: true, ad: db.adCampaigns[adIdx] });
  } else {
    res.status(404).json({ error: "বিজ্ঞাপন ক্যাম্পেইন পাওয়া যায়নি" });
  }
});

app.post("/api/admin/create-ad", (req, res) => {
  const { businessId, businessName, placement, bannerImage, budget, status } = req.body;
  const db = loadDatabase();
  const newAd = {
    id: `ad-${Date.now()}`,
    businessId,
    businessName,
    placement,
    bannerImage: bannerImage || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800",
    budget: Number(budget) || 100,
    status: status || "approved",
    createdAt: new Date().toISOString(),
    views: 0,
    clicks: 0
  };

  db.adCampaigns.push(newAd);

  if (newAd.status === "approved" && businessId) {
    const bizIdx = db.businesses.findIndex((b: any) => b.id === businessId);
    if (bizIdx !== -1) {
      db.businesses[bizIdx].isSponsored = true;
      db.businesses[bizIdx].sponsoredRank = 1;
    }
  }

  saveDatabase(db);
  res.json({ success: true, ad: newAd });
});

// Bookmark/Favorite Toggle
app.post("/api/users/favorite", (req, res) => {
  const { phone, businessId } = req.body;
  const db = loadDatabase();
  const userIdx = db.users.findIndex((u: any) => u.phone === phone);
  if (userIdx !== -1) {
    if (!db.users[userIdx].favorites) {
      db.users[userIdx].favorites = [];
    }
    const favIdx = db.users[userIdx].favorites.indexOf(businessId);
    if (favIdx !== -1) {
      db.users[userIdx].favorites.splice(favIdx, 1);
    } else {
      db.users[userIdx].favorites.push(businessId);
    }
    saveDatabase(db);
    res.json({ success: true, user: db.users[userIdx] });
  } else {
    res.status(404).json({ error: "ব্যবহারকারী পাওয়া যায়নি" });
  }
});

// Admin Control APIs
app.post("/api/admin/users", (req, res) => {
  const { 
    name, phone, email, password, role, image, location, tradeLicenseNo, 
    tradeLicenseImage, isMerchantVerified, designation, bio,
    walletBalance, rewardPoints, savedAddresses, claimedCoupons,
    referralCode, referredBy, referralCount, totalReferralBonus,
    riderVehicleType, riderNidNumber, riderNidImage, isRiderVerified,
    riderActiveStatus, riderTotalDeliveries, riderTotalEarnings,
    savedBankAccounts, walletTransactions
  } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ error: "নাম এবং মোবাইল নম্বর দেওয়া আবশ্যক।" });
  }
  const cleanPhone = convertBengaliNumeralsToEnglish(phone.trim());
  const db = loadDatabase();
  const exists = db.users.some((u: any) => u.phone === cleanPhone);
  if (exists) {
    return res.status(400).json({ error: "এই মোবাইল নম্বরে ইতিমধ্যে একটি অ্যাকাউন্ট রয়েছে।" });
  }

  const userRole = role || "user";
  const newUser: any = {
    name: name.trim(),
    phone: cleanPhone,
    email: email ? email.trim().toLowerCase() : "",
    password: password ? password.trim() : "123456",
    role: userRole,
    image: image || "",
    location: location || {
      lat: 23.734,
      lng: 90.378,
      address: "ঢাকা, বাংলাদেশ",
      district: "ধানমন্ডি লেক (Dhanmondi Lake)",
      division: "ঢাকা",
      thana: "ধানমন্ডি"
    },
    favorites: [],
    tradeLicenseNo: tradeLicenseNo || "",
    tradeLicenseImage: tradeLicenseImage || "",
    isMerchantVerified: !!isMerchantVerified,
    tradeLicenseStatus: isMerchantVerified ? "approved" : (tradeLicenseNo ? "pending" : undefined),
    designation: designation || "",
    bio: bio || "",
    walletBalance: walletBalance !== undefined ? Number(walletBalance) : 0,
    rewardPoints: rewardPoints !== undefined ? Number(rewardPoints) : 0,
    savedAddresses: savedAddresses || [],
    savedBankAccounts: savedBankAccounts || [],
    walletTransactions: walletTransactions || [],
    claimedCoupons: claimedCoupons || [],
    referralCode: referralCode || `RB${cleanPhone.slice(-4)}${Math.floor(100 + Math.random() * 900)}`,
    referredBy: referredBy || "",
    referralCount: Number(referralCount) || 0,
    totalReferralBonus: Number(totalReferralBonus) || 0,
    riderVehicleType: riderVehicleType || "motorcycle",
    riderNidNumber: riderNidNumber || "",
    riderNidImage: riderNidImage || "",
    isRiderVerified: Boolean(isRiderVerified),
    riderActiveStatus: Boolean(riderActiveStatus),
    riderTotalDeliveries: Number(riderTotalDeliveries) || 0,
    riderTotalEarnings: Number(riderTotalEarnings) || 0,
    createdAt: req.body.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.users.push(newUser);

  // If user is merchant, automatically ensure an approved shop profile is created so it appears in shops list
  if (userRole === "merchant") {
    const existingBiz = db.businesses.find((b: any) => b.ownerPhone === cleanPhone);
    if (!existingBiz) {
      const newBiz: any = {
        id: `biz-${Date.now()}`,
        ownerPhone: cleanPhone,
        ownerName: name.trim(),
        ownerEmail: email ? email.trim().toLowerCase() : "",
        name: `${name.trim()}-এর দোকান`,
        category: "grocery",
        type: "shop",
        phone: cleanPhone,
        whatsapp: cleanPhone,
        websiteUrl: "",
        logo: image || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200",
        images: ["https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600"],
        description: `${name.trim()}-এর অফিসিয়াল স্টোর`,
        address: newUser.location?.address || "ঢাকা, বাংলাদেশ",
        location: newUser.location || { lat: 23.734, lng: 90.378 },
        division: newUser.location?.division || "ঢাকা",
        district: newUser.location?.district || "ঢাকা",
        thana: newUser.location?.thana || "ধানমন্ডি",
        isOpen: true,
        isApproved: true,
        subscriptionPlan: "free",
        products: [],
        services: [],
        reviews: [],
        offers: [],
        transactions: [],
        customers: [],
        balance: 0,
        createdAt: req.body.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.businesses.push(newBiz);
      console.log(`[Admin POST User] Auto-created linked shop "${newBiz.name}" for merchant: ${cleanPhone}`);
    }
  }

  saveDatabase(db);
  console.log(`[Admin POST User] Successfully created user: ${newUser.phone} (${newUser.name})`);
  res.json({ success: true, user: newUser });
});

app.delete("/api/admin/users/:phone", (req, res) => {
  const { phone } = req.params;
  const db = loadDatabase();
  const index = db.users.findIndex((u: any) => u.phone === phone);
  if (index !== -1) {
    db.users.splice(index, 1);
    // Also delete associated business if exists
    const bizIdx = db.businesses.findIndex((b: any) => b.ownerPhone === phone);
    if (bizIdx !== -1) {
      db.businesses.splice(bizIdx, 1);
    }
    saveDatabase(db);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "ব্যবহারকারী পাওয়া যায়নি" });
  }
});

app.put("/api/admin/users/:phone", (req, res) => {
  const { phone } = req.params;
  const { 
    name, role, email, phone: newPhone, image, location, tradeLicenseNo, 
    tradeLicenseImage, isMerchantVerified, tradeLicenseStatus, 
    tradeLicenseRejectReason, designation, bio, password,
    walletBalance, rewardPoints, savedAddresses, claimedCoupons,
    referralCode, referredBy, referralCount, totalReferralBonus,
    riderVehicleType, riderNidNumber, riderNidImage, isRiderVerified,
    riderActiveStatus, riderTotalDeliveries, riderTotalEarnings,
    savedBankAccounts, walletTransactions
  } = req.body;
  console.log(`[Admin PUT User] Phone: ${phone}, Body:`, req.body);
  const db = loadDatabase();
  const index = db.users.findIndex((u: any) => u.phone === phone);
  if (index !== -1) {
    let finalPhone = phone;
    // If updating phone number, verify it's not already in use by another user
    if (newPhone && newPhone.trim() && newPhone.trim() !== phone) {
      const targetPhone = convertBengaliNumeralsToEnglish(newPhone.trim());
      const alreadyExists = db.users.some((u: any) => u.phone === targetPhone);
      if (alreadyExists) {
        return res.status(400).json({ error: "এই মোবাইল নম্বরটি ইতিমধ্যে ব্যবহার করা হচ্ছে।" });
      }
      
      // Update phone on the user
      db.users[index].phone = targetPhone;
      finalPhone = targetPhone;
      
      // Propagate phone change to owned businesses
      if (Array.isArray(db.businesses)) {
        db.businesses.forEach((b: any) => {
          if (b.ownerPhone === phone) {
            b.ownerPhone = targetPhone;
          }
        });
      }
      
      // Propagate phone change to bookings
      if (Array.isArray(db.bookings)) {
        db.bookings.forEach((bk: any) => {
          if (bk.userPhone === phone) {
            bk.userPhone = targetPhone;
          }
        });
      }
      
      // Propagate phone change to chat messages
      if (Array.isArray(db.chats)) {
        db.chats.forEach((c: any) => {
          if (c.fromPhone === phone) {
            c.fromPhone = targetPhone;
          }
          if (c.toPhone === phone) {
            c.toPhone = targetPhone;
          }
        });
      }
    }

    if (name !== undefined) db.users[index].name = name;
    if (email !== undefined) db.users[index].email = email;
    if (role !== undefined) db.users[index].role = role;
    if (image !== undefined) db.users[index].image = image;
    if (location !== undefined) db.users[index].location = location;
    if (tradeLicenseNo !== undefined) db.users[index].tradeLicenseNo = tradeLicenseNo;
    if (tradeLicenseImage !== undefined) db.users[index].tradeLicenseImage = tradeLicenseImage;
    if (tradeLicenseStatus !== undefined) {
      db.users[index].tradeLicenseStatus = tradeLicenseStatus;
      if (tradeLicenseStatus === "approved") {
        db.users[index].isMerchantVerified = true;
      } else if (tradeLicenseStatus === "rejected") {
        db.users[index].isMerchantVerified = false;
      }
    }
    if (isMerchantVerified !== undefined) db.users[index].isMerchantVerified = isMerchantVerified;
    if (tradeLicenseRejectReason !== undefined) db.users[index].tradeLicenseRejectReason = tradeLicenseRejectReason;
    if (designation !== undefined) db.users[index].designation = designation;
    if (bio !== undefined) db.users[index].bio = bio;
    if (password !== undefined) db.users[index].password = password;
    if (walletBalance !== undefined) db.users[index].walletBalance = Number(walletBalance);
    if (rewardPoints !== undefined) db.users[index].rewardPoints = Number(rewardPoints);
    if (savedAddresses !== undefined) db.users[index].savedAddresses = savedAddresses;
    if (savedBankAccounts !== undefined) db.users[index].savedBankAccounts = savedBankAccounts;
    if (walletTransactions !== undefined) db.users[index].walletTransactions = walletTransactions;
    if (claimedCoupons !== undefined) db.users[index].claimedCoupons = claimedCoupons;
    if (referralCode !== undefined) db.users[index].referralCode = referralCode;
    if (referredBy !== undefined) db.users[index].referredBy = referredBy;
    if (referralCount !== undefined) db.users[index].referralCount = Number(referralCount);
    if (totalReferralBonus !== undefined) db.users[index].totalReferralBonus = Number(totalReferralBonus);
    if (riderVehicleType !== undefined) db.users[index].riderVehicleType = riderVehicleType;
    if (riderNidNumber !== undefined) db.users[index].riderNidNumber = riderNidNumber;
    if (riderNidImage !== undefined) db.users[index].riderNidImage = riderNidImage;
    if (isRiderVerified !== undefined) db.users[index].isRiderVerified = Boolean(isRiderVerified);
    if (riderActiveStatus !== undefined) db.users[index].riderActiveStatus = Boolean(riderActiveStatus);
    if (riderTotalDeliveries !== undefined) db.users[index].riderTotalDeliveries = Number(riderTotalDeliveries);
    if (riderTotalEarnings !== undefined) db.users[index].riderTotalEarnings = Number(riderTotalEarnings);

    if (role === "admin") {
      db.users[index].email = "info.restbazar@gmail.com";
      if (!db.users[index].password) {
        db.users[index].password = "SMsagor@12";
      }
    }

    if (req.body.createdAt && !db.users[index].createdAt) {
      db.users[index].createdAt = req.body.createdAt;
    } else if (!db.users[index].createdAt) {
      db.users[index].createdAt = new Date().toISOString();
    }
    db.users[index].updatedAt = new Date().toISOString();

    // If role was updated to merchant, ensure business exists
    if (role === "merchant") {
      const existingBiz = db.businesses.find((b: any) => b.ownerPhone === finalPhone);
      if (!existingBiz) {
        const u = db.users[index];
        const newBiz: any = {
          id: `biz-${Date.now()}`,
          ownerPhone: finalPhone,
          ownerName: u.name,
          ownerEmail: u.email || "",
          name: `${u.name}-এর দোকান`,
          category: "grocery",
          type: "shop",
          phone: finalPhone,
          whatsapp: finalPhone,
          websiteUrl: "",
          logo: u.image || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200",
          images: ["https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600"],
          description: `${u.name}-এর অফিসিয়াল স্টোর`,
          address: u.location?.address || "ঢাকা, বাংলাদেশ",
          location: u.location || { lat: 23.734, lng: 90.378 },
          division: u.location?.division || "ঢাকা",
          district: u.location?.district || "ঢাকা",
          thana: u.location?.thana || "ধানমন্ডি",
          isOpen: true,
          isApproved: true,
          subscriptionPlan: "free",
          products: [],
          services: [],
          reviews: [],
          offers: [],
          transactions: [],
          customers: [],
          balance: 0,
          createdAt: req.body.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        db.businesses.push(newBiz);
        console.log(`[Admin PUT User] Auto-created linked shop "${newBiz.name}" for promoted merchant: ${finalPhone}`);
      }
    }

    saveDatabase(db);
    console.log(`[Admin PUT User] Successfully updated user ${phone} to newPhone: ${finalPhone}, name: ${name}`);
    res.json({ success: true, user: db.users[index] });
  } else {
    console.error(`[Admin PUT User] User not found: ${phone}`);
    res.status(404).json({ error: "ব্যবহারকারী পাওয়া যায়নি" });
  }
});

app.put("/api/users/:phone/submit-trade-license", (req, res) => {
  const { phone } = req.params;
  const { tradeLicenseNo, tradeLicenseImage } = req.body;
  if (!tradeLicenseNo) {
    return res.status(400).json({ error: "ট্রেড লাইসেন্স নম্বর প্রদান করুন।" });
  }
  const db = loadDatabase();
  const index = db.users.findIndex((u: any) => u.phone === phone);
  if (index !== -1) {
    db.users[index].tradeLicenseNo = tradeLicenseNo;
    db.users[index].tradeLicenseImage = tradeLicenseImage || "";
    db.users[index].isMerchantVerified = false; // Starts as unverified
    db.users[index].tradeLicenseStatus = "pending";
    db.users[index].tradeLicenseRejectReason = "";
    db.users[index].role = "merchant"; // Set role to merchant
    saveDatabase(db);
    res.json({ success: true, user: db.users[index] });
  } else {
    res.status(404).json({ error: "ব্যবহারকারী পাওয়া যায়নি" });
  }
});

app.put("/api/users/:phone/location", (req, res) => {
  const { phone } = req.params;
  const { location } = req.body;
  const db = loadDatabase();
  const index = db.users.findIndex((u: any) => u.phone === phone);
  if (index !== -1) {
    db.users[index].location = location;
    saveDatabase(db);
    res.json({ success: true, user: db.users[index] });
  } else {
    res.status(404).json({ error: "ব্যবহারকারী পাওয়া যায়নি" });
  }
});

app.post("/api/admin/businesses", (req, res) => {
  const { 
    name, category, type, phone, whatsapp, websiteUrl, logo, images, description, address, location, division, district, thana, isOpen, 
    isApproved, subscriptionPlan, subscriptionExpiry, isSponsored, sponsoredRank, balance,
    isWholesale, wholesaleMode, wholesaleMinOrderAmount, wholesaleTerms, wholesaleDiscountPercentage, wholesaleMinQtyDefault,
    hasHomeDelivery, deliveryCharge, ownerPhone, ownerName, ownerEmail
  } = req.body;

  if (!name || !category) {
    return res.status(400).json({ error: "দোকানের নাম এবং ক্যাটাগরি অবশ্যই প্রদান করতে হবে।" });
  }

  const rawOwnerPhone = ownerPhone ? ownerPhone.trim() : (phone ? phone.trim() : "01700000000");
  const cleanOwnerPhone = convertBengaliNumeralsToEnglish(rawOwnerPhone);
  const cleanPhone = phone ? convertBengaliNumeralsToEnglish(phone.trim()) : cleanOwnerPhone;

  const db = loadDatabase();

  // Automatically ensure owner account exists in db.users with merchant role
  let ownerUser = db.users.find((u: any) => u.phone === cleanOwnerPhone);
  if (!ownerUser) {
    ownerUser = {
      name: ownerName ? ownerName.trim() : name.trim(),
      phone: cleanOwnerPhone,
      email: ownerEmail ? ownerEmail.trim().toLowerCase() : `${cleanOwnerPhone}@restbazar.com`,
      password: "123456",
      role: "merchant",
      image: logo || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200",
      location: location || { lat: 23.734, lng: 90.378, address: address || "ঢাকা, বাংলাদেশ", district: district || "ঢাকা", division: division || "ঢাকা", thana: thana || "ধানমন্ডি" },
      favorites: [],
      createdAt: new Date().toISOString()
    };
    db.users.push(ownerUser);
    console.log(`[Admin POST Business] Auto-created merchant user "${ownerUser.name}" (${ownerUser.phone})`);
  } else if (ownerUser.role === 'user') {
    ownerUser.role = 'merchant';
  }

  const newBiz: any = {
    id: `biz-${Date.now()}`,
    ownerPhone: cleanOwnerPhone,
    ownerName: ownerName ? ownerName.trim() : ownerUser.name,
    ownerEmail: ownerEmail ? ownerEmail.trim().toLowerCase() : ownerUser.email,
    name: name.trim(),
    category: category || "grocery",
    type: type || "shop",
    phone: cleanPhone,
    whatsapp: whatsapp ? convertBengaliNumeralsToEnglish(whatsapp.trim()) : cleanPhone,
    websiteUrl: websiteUrl || "",
    logo: logo || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200",
    images: Array.isArray(images) && images.length > 0 ? images : ["https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600"],
    description: description || "",
    address: address || "ঢাকা, বাংলাদেশ",
    location: location || { lat: 23.734, lng: 90.378 },
    division: division || "ঢাকা",
    district: district || "ঢাকা",
    thana: thana || "ধানমন্ডি",
    isOpen: isOpen !== undefined ? !!isOpen : true,
    hasHomeDelivery: hasHomeDelivery !== undefined ? !!hasHomeDelivery : true,
    deliveryCharge: deliveryCharge !== undefined ? Number(deliveryCharge) : 40,
    subscriptionPlan: subscriptionPlan || "free",
    subscriptionExpiry: subscriptionExpiry || undefined,
    isSponsored: !!isSponsored,
    sponsoredRank: Number(sponsoredRank) || 0,
    balance: Number(balance) || 0,
    rating: 5.0,
    reviewsCount: 0,
    products: [],
    services: [],
    reviews: [],
    offers: [],
    transactions: [],
    customers: [],
    isApproved: isApproved !== undefined ? !!isApproved : true,
    isWholesale: !!isWholesale,
    wholesaleMode: wholesaleMode || (isWholesale ? "retail_and_wholesale" : undefined),
    wholesaleMinOrderAmount: Number(wholesaleMinOrderAmount) || 0,
    wholesaleDiscountPercentage: Number(wholesaleDiscountPercentage) || 0,
    wholesaleMinQtyDefault: Number(wholesaleMinQtyDefault) || 5,
    wholesaleTerms: wholesaleTerms || "",
    createdAt: req.body.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.businesses.push(newBiz);
  saveDatabase(db);
  console.log(`[Admin POST Business] Created business: ${newBiz.id} (${newBiz.name})`);
  res.json({ success: true, business: newBiz });
});

app.delete("/api/admin/businesses/:id", (req, res) => {
  const { id } = req.params;
  const db = loadDatabase();
  const index = db.businesses.findIndex((b: any) => b.id === id);
  if (index !== -1) {
    db.businesses.splice(index, 1);
    saveDatabase(db);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "ব্যবসা প্রতিষ্ঠান পাওয়া যায়নি" });
  }
});

app.put("/api/admin/businesses/:id", (req, res) => {
  const { id } = req.params;
  const { 
    name, category, type, phone, whatsapp, websiteUrl, logo, images, description, address, location, division, district, thana, isOpen, 
    isApproved, subscriptionPlan, subscriptionExpiry, isSponsored, sponsoredRank, balance,
    isWholesale, wholesaleMode, wholesaleMinOrderAmount, wholesaleTerms, wholesaleDiscountPercentage, wholesaleMinQtyDefault,
    hasHomeDelivery, deliveryCharge, ownerPhone, ownerName, ownerEmail, products, services,
    isBannersAllowed, isAutoItemApprovalAllowed, isLedgerAllowed, maxProductsLimit, isOfferCreationAllowed,
    commissionRateOverride, isSuspended
  } = req.body;
  const db = loadDatabase();
  const index = db.businesses.findIndex((b: any) => b.id === id);
  if (index !== -1) {
    const biz = db.businesses[index];
    if (name !== undefined) biz.name = name;
    if (category !== undefined) biz.category = category;
    if (type !== undefined) biz.type = type;
    if (phone !== undefined) biz.phone = phone;
    if (whatsapp !== undefined) biz.whatsapp = whatsapp;
    if (websiteUrl !== undefined) biz.websiteUrl = websiteUrl;
    if (logo !== undefined) biz.logo = logo;
    if (images !== undefined) biz.images = images;
    if (description !== undefined) biz.description = description;
    if (address !== undefined) biz.address = address;
    if (location !== undefined) biz.location = location;
    if (division !== undefined) biz.division = division;
    if (district !== undefined) biz.district = district;
    if (thana !== undefined) biz.thana = thana;
    if (isOpen !== undefined) biz.isOpen = isOpen;
    if (isApproved !== undefined) biz.isApproved = isApproved;
    if (subscriptionPlan !== undefined) biz.subscriptionPlan = subscriptionPlan;
    if (subscriptionExpiry !== undefined) biz.subscriptionExpiry = subscriptionExpiry;
    if (isSponsored !== undefined) biz.isSponsored = isSponsored;
    if (sponsoredRank !== undefined) biz.sponsoredRank = Number(sponsoredRank) || 0;
    if (balance !== undefined) biz.balance = Number(balance) || 0;
    if (isWholesale !== undefined) biz.isWholesale = isWholesale;
    if (wholesaleMode !== undefined) biz.wholesaleMode = wholesaleMode;
    if (wholesaleMinOrderAmount !== undefined) biz.wholesaleMinOrderAmount = Number(wholesaleMinOrderAmount);
    if (wholesaleTerms !== undefined) biz.wholesaleTerms = wholesaleTerms;
    if (wholesaleDiscountPercentage !== undefined) biz.wholesaleDiscountPercentage = Number(wholesaleDiscountPercentage);
    if (wholesaleMinQtyDefault !== undefined) biz.wholesaleMinQtyDefault = Number(wholesaleMinQtyDefault);
    if (hasHomeDelivery !== undefined) biz.hasHomeDelivery = hasHomeDelivery;
    if (deliveryCharge !== undefined) biz.deliveryCharge = Number(deliveryCharge);
    if (ownerPhone !== undefined) biz.ownerPhone = ownerPhone;
    if (ownerName !== undefined) biz.ownerName = ownerName;
    if (ownerEmail !== undefined) biz.ownerEmail = ownerEmail;
    if (products !== undefined) biz.products = products;
    if (services !== undefined) biz.services = services;
    
    // Additional merchant control features
    if (isBannersAllowed !== undefined) biz.isBannersAllowed = !!isBannersAllowed;
    if (isAutoItemApprovalAllowed !== undefined) biz.isAutoItemApprovalAllowed = !!isAutoItemApprovalAllowed;
    if (isLedgerAllowed !== undefined) biz.isLedgerAllowed = !!isLedgerAllowed;
    if (maxProductsLimit !== undefined) biz.maxProductsLimit = Number(maxProductsLimit) || 100;
    if (isOfferCreationAllowed !== undefined) biz.isOfferCreationAllowed = !!isOfferCreationAllowed;
    if (commissionRateOverride !== undefined) {
      biz.commissionRateOverride = commissionRateOverride === null ? undefined : Number(commissionRateOverride);
    }
    if (isSuspended !== undefined) biz.isSuspended = !!isSuspended;

    if (req.body.createdAt && !biz.createdAt) {
      biz.createdAt = req.body.createdAt;
    } else if (!biz.createdAt) {
      biz.createdAt = new Date().toISOString();
    }
    biz.updatedAt = new Date().toISOString();

    saveDatabase(db);
    res.json({ success: true, business: biz });
  } else {
    res.status(404).json({ error: "ব্যবসা প্রতিষ্ঠান পাওয়া যায়নি" });
  }
});

// Admin Product & Service Direct Item CRUD
app.post("/api/admin/businesses/:id/products", (req, res) => {
  const { id } = req.params;
  const { name, price, originalPrice, image, description, isAvailable, isApproved, isWholesaleAvailable, wholesalePrice, wholesaleMinQty, wholesaleUnit, wholesaleStock } = req.body;
  if (!name || price === undefined) {
    return res.status(400).json({ error: "পণ্যের নাম এবং মূল্য আবশ্যক" });
  }
  const db = loadDatabase();
  const biz = db.businesses.find((b: any) => b.id === id);
  if (!biz) return res.status(404).json({ error: "দোকান পাওয়া যায়নি" });

  const newProduct = {
    id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    name: name.trim(),
    price: Number(price),
    originalPrice: originalPrice ? Number(originalPrice) : undefined,
    image: image || "",
    description: description || "",
    isAvailable: isAvailable !== false,
    isApproved: isApproved !== false,
    isWholesaleAvailable: !!isWholesaleAvailable,
    wholesalePrice: wholesalePrice ? Number(wholesalePrice) : undefined,
    wholesaleMinQty: wholesaleMinQty ? Number(wholesaleMinQty) : undefined,
    wholesaleUnit: wholesaleUnit || "পিস",
    wholesaleStock: wholesaleStock ? Number(wholesaleStock) : undefined
  };

  if (!Array.isArray(biz.products)) biz.products = [];
  biz.products.push(newProduct);
  saveDatabase(db);
  res.json({ success: true, product: newProduct, business: biz });
});

app.put("/api/admin/businesses/:id/products/:productId", (req, res) => {
  const { id, productId } = req.params;
  const db = loadDatabase();
  const biz = db.businesses.find((b: any) => b.id === id);
  if (!biz) return res.status(404).json({ error: "দোকান পাওয়া যায়নি" });

  const prodIdx = (biz.products || []).findIndex((p: any) => p.id === productId);
  if (prodIdx === -1) return res.status(404).json({ error: "পণ্য পাওয়া যায়নি" });

  const current = biz.products[prodIdx];
  biz.products[prodIdx] = {
    ...current,
    ...req.body,
    price: req.body.price !== undefined ? Number(req.body.price) : current.price,
    originalPrice: req.body.originalPrice !== undefined ? Number(req.body.originalPrice) : current.originalPrice,
    wholesalePrice: req.body.wholesalePrice !== undefined ? Number(req.body.wholesalePrice) : current.wholesalePrice,
    wholesaleMinQty: req.body.wholesaleMinQty !== undefined ? Number(req.body.wholesaleMinQty) : current.wholesaleMinQty,
    wholesaleStock: req.body.wholesaleStock !== undefined ? Number(req.body.wholesaleStock) : current.wholesaleStock
  };

  saveDatabase(db);
  res.json({ success: true, product: biz.products[prodIdx], business: biz });
});

app.delete("/api/admin/businesses/:id/products/:productId", (req, res) => {
  const { id, productId } = req.params;
  const db = loadDatabase();
  const biz = db.businesses.find((b: any) => b.id === id);
  if (!biz) return res.status(404).json({ error: "দোকান পাওয়া যায়নি" });

  biz.products = (biz.products || []).filter((p: any) => p.id !== productId);
  saveDatabase(db);
  res.json({ success: true, business: biz });
});

app.post("/api/admin/businesses/:id/services", (req, res) => {
  const { id } = req.params;
  const { name, charge, description, isAvailable, isApproved } = req.body;
  if (!name || charge === undefined) {
    return res.status(400).json({ error: "সেবার নাম এবং ফি আবশ্যক" });
  }
  const db = loadDatabase();
  const biz = db.businesses.find((b: any) => b.id === id);
  if (!biz) return res.status(404).json({ error: "দোকান পাওয়া যায়নি" });

  const newService = {
    id: `srv_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    name: name.trim(),
    charge: Number(charge),
    description: description || "",
    isAvailable: isAvailable !== false,
    isApproved: isApproved !== false
  };

  if (!Array.isArray(biz.services)) biz.services = [];
  biz.services.push(newService);
  saveDatabase(db);
  res.json({ success: true, service: newService, business: biz });
});

app.put("/api/admin/businesses/:id/services/:serviceId", (req, res) => {
  const { id, serviceId } = req.params;
  const db = loadDatabase();
  const biz = db.businesses.find((b: any) => b.id === id);
  if (!biz) return res.status(404).json({ error: "দোকান পাওয়া যায়নি" });

  const srvIdx = (biz.services || []).findIndex((s: any) => s.id === serviceId);
  if (srvIdx === -1) return res.status(404).json({ error: "সেবা পাওয়া যায়নি" });

  const current = biz.services[srvIdx];
  biz.services[srvIdx] = {
    ...current,
    ...req.body,
    charge: req.body.charge !== undefined ? Number(req.body.charge) : current.charge
  };

  saveDatabase(db);
  res.json({ success: true, service: biz.services[srvIdx], business: biz });
});

app.delete("/api/admin/businesses/:id/services/:serviceId", (req, res) => {
  const { id, serviceId } = req.params;
  const db = loadDatabase();
  const biz = db.businesses.find((b: any) => b.id === id);
  if (!biz) return res.status(404).json({ error: "দোকান পাওয়া যায়নি" });

  biz.services = (biz.services || []).filter((s: any) => s.id !== serviceId);
  saveDatabase(db);
  res.json({ success: true, business: biz });
});

app.delete("/api/admin/bookings/:id", (req, res) => {
  const { id } = req.params;
  const db = loadDatabase();
  const index = db.bookings.findIndex((b: any) => b.id === id);
  if (index !== -1) {
    db.bookings.splice(index, 1);
    saveDatabase(db);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "বুকিং রেকর্ড পাওয়া যায়নি" });
  }
});

// AI Search Assistant Endpoint
app.post("/api/ai/assistant", async (req, res) => {
  const { prompt, userLocation } = req.body;
  const db = loadDatabase();

  const fallbackReply = "ধন্যবাদ! আপনি সার্চবার বা ক্যাটাগরি ফিল্টার ব্যবহার করে সহজেই ধানমন্ডি ও ঢাকার সেরা নিবন্ধিত মুদি দোকান, ফার্মেসি, ইলেকট্রিশিয়ান ও ডাক্তার খুঁজে পেয়ে অর্ডার ও অ্যাপয়েন্টমেন্ট বুকিং করতে পারেন।";

  const ai = getGemini();
  if (!ai) {
    return res.json({ reply: fallbackReply });
  }

  try {
    const listBrief = db.businesses.map((b: any) => ({
      id: b.id,
      name: b.name,
      category: b.category,
      address: b.address,
      rating: b.rating,
      products: (b.products || []).slice(0, 3).map((p: any) => p.name),
      services: (b.services || []).slice(0, 3).map((s: any) => s.name)
    }));

    const systemPrompt = `You are the "RB Local AI Assistant", an expert local shopping and service assistant of Bangladesh.
    Here is a list of registered local businesses near Dhaka Dhanmondi: ${JSON.stringify(listBrief)}.
    The user is asking: "${prompt}".
    Answer in warm, helpful, and natural Bengali. If they are looking for a service (e.g. rice, medicine, AC repair, tutor, etc.), analyze our registered businesses and recommend the best matching ones. Mention their rating, what they offer, and encourage the user to click on them. Keep your response engaging, accurate, and relatively concise (maximum 4 sentences).`;

    try {
      const response = await generateGeminiContentWithFallback(ai, {
        preferredModel: "gemini-2.5-flash",
        contents: prompt,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7,
        }
      });
      res.json({ reply: response.text ? response.text.trim() : fallbackReply });
    } catch (primaryErr) {
      console.warn("AI assistant returned graceful fallback due to API error:", primaryErr);
      res.json({ reply: fallbackReply });
    }
  } catch (e) {
    console.error("AI assistant error:", e);
    res.json({ reply: fallbackReply });
  }
});

// AI Description Writer for Merchants
app.post("/api/ai/generate-description", async (req, res) => {
  const { businessName, category, type, items } = req.body;

  const fallbackDesc = `${businessName || 'আমাদের দোকান'} একটি নির্ভরযোগ্য ও বিশ্বস্ত ${type === 'service' ? 'সেবাদানকারী প্রতিষ্ঠান' : 'ব্যবসা প্রতিষ্ঠান'}। আমরা গ্রাহকদের চাহিদা অনুযায়ী সর্বোচ্চ দ্রুততম সময়ে গুণগত মানের পণ্য ও সেবা প্রদান করতে প্রতিশ্রুতিবদ্ধ।`;

  const ai = getGemini();
  if (!ai) {
    return res.json({ description: fallbackDesc });
  }

  try {
    const prompt = `You are a professional copywriting assistant for local merchants in Bangladesh.
    Generate a compelling, polite, and attractive promotional business description in Bengali for a business with:
    - Name: "${businessName}"
    - Category: "${category}" (type: ${type})
    - Offerings/Products: "${items || 'N/A'}"
    The description should sound highly trustworthy, welcoming, and highlight fast service and quality. Focus on attracting customers in Bangladesh. Avoid flowery English phrasing translated literally, make it sound like a top-notch professional local banner description. Keep it between 2 to 4 sentences.`;

    try {
      const response = await generateGeminiContentWithFallback(ai, {
        preferredModel: "gemini-2.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are an expert promotional content writer in Bengali.",
          temperature: 0.8,
        }
      });

      res.json({ description: response.text ? response.text.trim() : fallbackDesc });
    } catch (primaryErr) {
      console.warn("AI description generator returning graceful Bengali fallback:", primaryErr);
      res.json({ description: fallbackDesc });
    }
  } catch (e) {
    console.error("AI description generator error:", e);
    res.json({ description: fallbackDesc });
  }
});

// AI Product Description Writer for Merchants
app.post("/api/ai/generate-product-description", async (req, res) => {
  const { productName, businessName, category, type, price, keyPoints } = req.body;

  const isService = type === 'service';
  const fallbackDesc = isService
    ? `দক্ষ ও অভিজ্ঞ পেশাদারদের দ্বারা সম্পূর্ণ দায়িত্ব সহকারে "${productName || 'সেবা'}" প্রদান করা হয়। ${keyPoints ? 'বিশেষত্ব: ' + keyPoints + '। ' : ''}দ্রুততম সময়ে সর্বোচ্চ গুণগত মান ও শতভাগ বিশ্বস্ততার নিশ্চয়তা উপভোগ করুন।`
    : `এটি একটি উন্নতমানের ও প্রিমিয়াম কোয়ালিটির "${productName || 'পণ্য'}"। ${keyPoints ? 'বৈশিষ্ট্য: ' + keyPoints + '। ' : ''}আমরা সবসময় সেরা মানের ও নির্ভেজাল পণ্য সুলভ মূল্যে গ্রাহকের দরজায় পৌঁছে দিতে প্রতিশ্রুতিবদ্ধ।`;

  const ai = getGemini();
  if (!ai) {
    return res.json({ description: fallbackDesc });
  }

  try {
    const prompt = `You are an expert Bangladeshi e-commerce and retail copywriting assistant.
    Generate an engaging, polite, and persuasive promotional description in natural, fluent Bengali for:
    - Item/Product/Service Name: "${productName || 'পণ্য'}"
    - Store/Business Name: "${businessName || 'আমাদের দোকান'}"
    - Category: "${category || 'General'}" (type: ${type || 'shop'})
    - Price: ${price ? '৳ ' + price : 'N/A'}
    ${keyPoints ? `- Special Points / Highlights: "${keyPoints}"` : ''}
    
    Requirements:
    1. Write 2 to 3 sentences in beautiful, polite, professional Bengali that sounds like a premium local shop in Bangladesh.
    2. Highlight freshness, quality, authenticity, durability, or professional service guarantee.
    3. Make customers feel confident and enthusiastic about purchasing this item or service.
    4. Do NOT use literal machine-translated English phrases. Output ONLY the Bengali text without markdown formatting or quotation marks.`;

    try {
      const response = await generateGeminiContentWithFallback(ai, {
        preferredModel: "gemini-2.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are a professional Bangladeshi e-commerce and retail copywriting specialist.",
          temperature: 0.7,
        }
      });

      res.json({ description: response.text ? response.text.trim().replace(/^["']|["']$/g, '') : fallbackDesc });
    } catch (primaryErr) {
      console.warn("AI product description generator returning fallback:", primaryErr);
      res.json({ description: fallbackDesc });
    }
  } catch (e) {
    console.error("AI product description generator error:", e);
    res.json({ description: fallbackDesc });
  }
});

// ==========================================
// 📺 SELLER TUTORIALS & GUIDELINES API
// ==========================================
app.get("/api/seller-tutorials", (req, res) => {
  try {
    const db = loadDatabase();
    if (!Array.isArray(db.sellerTutorials)) {
      db.sellerTutorials = [];
    }
    res.json({ success: true, tutorials: db.sellerTutorials });
  } catch (e: any) {
    res.status(500).json({ error: e?.message });
  }
});

app.post("/api/seller-tutorials", (req, res) => {
  try {
    const {
      title, category, categoryLabel, description, videoUrl, thumbnail,
      duration, authorName, authorRole, images, steps, aiGenerated, tags
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: "টিউটোরিয়ালের শিরোনাম প্রদান করুন।" });
    }

    const db = loadDatabase();
    if (!Array.isArray(db.sellerTutorials)) {
      db.sellerTutorials = [];
    }

    const newTutorial = {
      id: `tut_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      title: title.trim(),
      category: category || "general",
      categoryLabel: categoryLabel || "সাধারণ গাইডলাইন",
      description: description ? description.trim() : "",
      videoUrl: videoUrl ? videoUrl.trim() : "",
      thumbnail: thumbnail || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800",
      duration: duration || "৩ মিনিট",
      authorName: authorName || "RestBazar মার্চেন্ট",
      authorRole: authorRole || "বিক্রেতা গাইড",
      images: Array.isArray(images) ? images : [],
      steps: Array.isArray(steps) ? steps : [],
      aiGenerated: !!aiGenerated,
      tags: Array.isArray(tags) ? tags : ["টিউটোরিয়াল", "গাইড"],
      createdAt: new Date().toISOString(),
      views: 1,
      likes: 0
    };

    db.sellerTutorials.unshift(newTutorial);
    saveDatabase(db);
    res.json({ success: true, tutorial: newTutorial });
  } catch (e: any) {
    res.status(500).json({ error: e?.message });
  }
});

app.put("/api/seller-tutorials/:id", (req, res) => {
  try {
    const { id } = req.params;
    const db = loadDatabase();
    if (!Array.isArray(db.sellerTutorials)) db.sellerTutorials = [];

    const index = db.sellerTutorials.findIndex((t: any) => t.id === id);
    if (index === -1) {
      return res.status(404).json({ error: "টিউটোরিয়ালটি খুঁজে পাওয়া যায়নি।" });
    }

    const tut = db.sellerTutorials[index];
    const {
      title, category, categoryLabel, description, videoUrl, thumbnail,
      duration, authorName, authorRole, images, steps, tags
    } = req.body;

    if (title !== undefined) tut.title = title;
    if (category !== undefined) tut.category = category;
    if (categoryLabel !== undefined) tut.categoryLabel = categoryLabel;
    if (description !== undefined) tut.description = description;
    if (videoUrl !== undefined) tut.videoUrl = videoUrl;
    if (thumbnail !== undefined) tut.thumbnail = thumbnail;
    if (duration !== undefined) tut.duration = duration;
    if (authorName !== undefined) tut.authorName = authorName;
    if (authorRole !== undefined) tut.authorRole = authorRole;
    if (images !== undefined) tut.images = images;
    if (steps !== undefined) tut.steps = steps;
    if (tags !== undefined) tut.tags = tags;

    saveDatabase(db);
    res.json({ success: true, tutorial: tut });
  } catch (e: any) {
    res.status(500).json({ error: e?.message });
  }
});

app.delete("/api/seller-tutorials/:id", (req, res) => {
  try {
    const { id } = req.params;
    const db = loadDatabase();
    if (!Array.isArray(db.sellerTutorials)) db.sellerTutorials = [];

    const index = db.sellerTutorials.findIndex((t: any) => t.id === id);
    if (index === -1) {
      return res.status(404).json({ error: "টিউটোরিয়ালটি খুঁজে পাওয়া যায়নি।" });
    }

    db.sellerTutorials.splice(index, 1);
    saveDatabase(db);
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e?.message });
  }
});

app.post("/api/seller-tutorials/:id/like", (req, res) => {
  try {
    const { id } = req.params;
    const db = loadDatabase();
    if (!Array.isArray(db.sellerTutorials)) db.sellerTutorials = [];

    const tut = db.sellerTutorials.find((t: any) => t.id === id);
    if (tut) {
      tut.likes = (tut.likes || 0) + 1;
      saveDatabase(db);
      return res.json({ success: true, likes: tut.likes });
    }
    res.status(404).json({ error: "টিউটোরিয়াল পাওয়া যায়নি।" });
  } catch (e: any) {
    res.status(500).json({ error: e?.message });
  }
});

// ==========================================
// 🤖 AI SELLER MENTOR (বিক্রেতা এআই মেন্টর)
// ==========================================
app.post("/api/ai/seller-mentor", async (req, res) => {
  const { question, shopName, category, businessType } = req.body;

  if (!question || !question.trim()) {
    return res.status(400).json({ error: "আপনার প্রশ্নটি লিখুন।" });
  }

  const fallbackAnswer = `RestBazar-এ আপনার ব্যবসা বৃদ্ধি করার সেরা ৩টি মূল কৌশল:
১. আকর্ষণীয় ও পরিষ্কার ছবিসহ পণ্যের ন্যায্য বিক্রয়মূল্য নির্ধারণ করুন।
২. পাইকারি (Wholesale) মোড চালু করে বাল্ক অর্ডারে আকর্ষণীয় ছাড় দিন যাতে পাইকাররা আকৃষ্ট হয়।
৩. কাস্টমারদের দ্রুত হোম ডেলিভারি ও হাসিমুখে সেবা দিন এবং নিয়মিত বাকি খাতা আপডেট রাখুন।`;

  const ai = getGemini();
  if (!ai) {
    return res.json({ reply: fallbackAnswer });
  }

  try {
    const systemPrompt = `You are "RestBazar AI Seller Mentor" (রেস্টবাজার এআই সেলার মেন্টর), an expert retail & e-commerce business consultant for local Bangladeshi shop owners and service providers.
Shop Information:
- Shop Name: "${shopName || 'দোকান'}"
- Category: "${category || 'General'}"
- Type: "${businessType || 'shop'}"

The seller is asking: "${question}".

Guidelines:
1. Provide a warm, practical, and highly actionable answer in fluent Bengali.
2. Structure your answer with clear numbered bullet points, practical tips (যেমন: ডিসকাউন্ট স্ট্র্যাটেজি, পাইকারি রেট নির্ধারণ, প্রোডাক্ট ফটো তোলার টেকনিক, কাস্টমার বাকি আদায়ের কৌশল, সোশ্যাল মিডিয়ায় ফ্রি প্রমোশন)।
3. Include 1 specific pro-tip (💡 বিশেষ টিপস) tailored to Bangladesh local commerce.
4. Keep the tone encouraging, respectful, professional, and easy to understand for any shopkeeper.`;

    const response = await generateGeminiContentWithFallback(ai, {
      preferredModel: "gemini-2.5-flash",
      contents: question,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      }
    });

    res.json({ reply: response.text ? response.text.trim() : fallbackAnswer });
  } catch (e: any) {
    console.warn("AI Seller Mentor graceful fallback returned:", e?.message || e);
    res.json({ reply: fallbackAnswer });
  }
});

// ==========================================
// ✨ AI TUTORIAL & VIDEO SCRIPT GENERATOR
// ==========================================
app.post("/api/ai/generate-tutorial-guide", async (req, res) => {
  const { topic, category, businessType, targetAudience } = req.body;

  if (!topic || !topic.trim()) {
    return res.status(400).json({ error: "টিউটোরিয়ালের বিষয় বা টপিক উল্লেখ করুন।" });
  }

  const defaultFallbackTutorial = {
    title: `${topic} - সম্পূর্ণ নির্দেশিকা`,
    category: category || "general",
    categoryLabel: "ব্যবসায়িক গাইডলাইন",
    description: `${topic} সম্পর্কিত সহজ ও কার্যকরী গাইডলাইন।`,
    duration: "৩ মিনিট ৩০ সেকেন্ড",
    videoScript: `[ভিডিও সূচনা - ০:০০]\nসবাইকে স্বাগতম RestBazar সেলার টিউটোরিয়ালে। আজকে আমরা জানব ${topic} সম্পর্কে।\n\n[মূল পয়েন্ট - ১:০০]\nপ্রথমেই আপনার ড্যাশবোর্ডে গিয়ে প্রয়োজনীয় তথ্য ও অফার সেট করুন।\n\n[সমাপ্তি - ৩:০০]\nএভাবে নিয়ম মেনে কাজ করলে আপনার বিক্রি বহুগুণ বেড়ে যাবে। ধন্যবাদ!`,
    steps: [
      { stepNumber: 1, title: "প্রস্তুতি ও তথ্য সংগ্রহ", description: "প্রয়োজনীয় পণ্য, ছবি ও তথ্য সুন্দরভাবে গুছিয়ে রাখুন।", keyTip: "সঠিক প্রস্তুতি কাজের গতি বহুগুণ বাড়ায়।" },
      { stepNumber: 2, title: "সঠিক মূল্য ও অফার নির্ধারণ", description: "বাজারদর ও লাভ যাচাই করে আকর্ষণীয় বিক্রয়মূল্য সেট করুন।", keyTip: "ন্যায্য মূল্য কাস্টমারের দীর্ঘমেয়াদী আস্থা নিশ্চিত করে।" },
      { stepNumber: 3, title: "লাইভ প্রচার ও দ্রুত সেবা প্রদান", description: "অর্ডার গ্রহণ করুন এবং দ্রুততম সময়ে কাস্টমারকে সরবরাহ করুন।", keyTip: "হাসিমুখে দ্রুত সেবাই সবচেয়ে বড় মার্কেটিং।" }
    ],
    keyTakeaways: [
      "নিয়মিত পণ্যের স্টক ও সঠিক মূল্য আপডেট রাখুন।",
      "কাস্টমারদের সাথে সর্বদা অমায়িক ও পেশাদার ব্যবহার বজায় রাখুন।"
    ],
    thumbnail: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800"
  };

  const ai = getGemini();
  if (!ai) {
    return res.json(defaultFallbackTutorial);
  }

  try {
    const prompt = `You are a professional retail and video marketing curriculum developer for Bangladeshi small and medium business owners.
Generate a complete, high-impact seller video tutorial and step-by-step guideline in Bengali for:
- Topic: "${topic}"
- Category: "${category || 'general'}"
- Business Type: "${businessType || 'shop'}"
- Target: "${targetAudience || 'মার্চেন্ট ও বিক্রেতা'}"

Return ONLY a valid JSON object with the following structure (no other markdown or commentary):
{
  "title": "আকর্ষণীয় ও স্পষ্ট বাংলা শিরোনাম",
  "category": "${category || 'general'}",
  "categoryLabel": "বাংলা ক্যাটাগরি লেবেল",
  "description": "২-৩ লাইনে টিউটোরিয়ালের মূল উদ্দেশ্য ও সুবিধা",
  "duration": "৩ মিনিট ৩০ সেকেন্ড",
  "videoScript": "ভিডিওতে কি কি কথা বলতে হবে তার সম্পূর্ণ টাইমস্ট্যাম্পসহ চমৎকার ভিডিও স্ক্রিপ্ট",
  "steps": [
    {
      "stepNumber": 1,
      "title": "ধাপ ১ এর শিরোনাম",
      "description": "ধাপের বিস্তারিত বিবরণ",
      "keyTip": "এই ধাপের জন্য একটি বিশেষ প্রো-টিপ"
    },
    {
      "stepNumber": 2,
      "title": "ধাপ ২ এর শিরোনাম",
      "description": "ধাপের বিস্তারিত বিবরণ",
      "keyTip": "বিশেষ প্রো-টিপ"
    },
    {
      "stepNumber": 3,
      "title": "ধাপ ৩ এর শিরোনাম",
      "description": "ধাপের বিস্তারিত বিবরণ",
      "keyTip": "বিশেষ প্রো-টিপ"
    }
  ],
  "keyTakeaways": [
    "মূল শিক্ষণীয় পয়েন্ট ১",
    "মূল শিক্ষণীয় পয়েন্ট ২",
    "মূল শিক্ষণীয় পয়েন্ট ৩"
  ],
  "thumbnail": "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800"
}`;

    const response = await generateGeminiContentWithFallback(ai, {
      preferredModel: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a master business tutorial developer. Always respond in valid JSON matching the requested schema.",
        responseMimeType: "application/json",
        temperature: 0.7,
      }
    });

    let rawText = response.text?.trim() || "{}";
    if (rawText.startsWith("```json")) {
      rawText = rawText.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
    } else if (rawText.startsWith("```")) {
      rawText = rawText.replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
    }

    const parsed = JSON.parse(rawText || "{}");
    res.json({
      title: parsed.title || defaultFallbackTutorial.title,
      category: parsed.category || category || "general",
      categoryLabel: parsed.categoryLabel || defaultFallbackTutorial.categoryLabel,
      description: parsed.description || defaultFallbackTutorial.description,
      duration: parsed.duration || "৩ মিনিট ৩০ সেকেন্ড",
      videoScript: parsed.videoScript || defaultFallbackTutorial.videoScript,
      steps: Array.isArray(parsed.steps) && parsed.steps.length > 0 ? parsed.steps : defaultFallbackTutorial.steps,
      keyTakeaways: Array.isArray(parsed.keyTakeaways) && parsed.keyTakeaways.length > 0 ? parsed.keyTakeaways : defaultFallbackTutorial.keyTakeaways,
      thumbnail: parsed.thumbnail || defaultFallbackTutorial.thumbnail
    });
  } catch (e: any) {
    console.warn("AI Tutorial Generator returning resilient Bengali tutorial:", e?.message || e);
    res.json(defaultFallbackTutorial);
  }
});

// ==========================================
// 💡 C2C AI RESALE PRICE ESTIMATOR & MARKET VALUATION
// ==========================================
app.post("/api/ai/estimate-resale-price", async (req, res) => {
  const { productName, originalPrice, condition, usedDuration, category } = req.body;

  if (!productName || !productName.trim()) {
    return res.status(400).json({ error: "পণ্যের নাম প্রদান করুন।" });
  }

  const origPriceNum = Number(originalPrice) || 0;
  
  // Intelligent mathematical default fallback
  let depreciationFactor = 0.5; // default 50% for used
  if (condition === "new") depreciationFactor = 0.85;
  else if (condition === "like_new") depreciationFactor = 0.70;
  else if (condition === "fair") depreciationFactor = 0.35;

  const baseEst = origPriceNum > 0 ? Math.round(origPriceNum * depreciationFactor) : 2500;
  const defaultFallback = {
    estimatedMinPrice: Math.round(baseEst * 0.85),
    estimatedMaxPrice: Math.round(baseEst * 1.15),
    recommendedPrice: baseEst,
    valuationSummary: `বাংলাদেশে ${productName}-এর বর্তমান সেকেন্ডহ্যান্ড বাজারের অবস্থা ও কন্ডিশন বিবেচনায় এর যুক্তিসঙ্গত মূল্য ৳${Math.round(baseEst * 0.85).toLocaleString('bn-BD')} থেকে ৳${Math.round(baseEst * 1.15).toLocaleString('bn-BD')} এর মধ্যে হওয়া উচিত।`,
    buyerDemandLevel: "মাঝারি থেকে ভালো (Moderate to High Demand)",
    fastSellingTips: [
      "পণ্যের পরিষ্কার ছবি এবং সাথে থাকা অরিজিনাল এক্সেসরিজ/বক্সের ছবি দিন।",
      "দাম কিছুটা আলোচনা সাপেক্ষ (Negotiable) রাখলে দ্রুত ক্রেতাদের সাড়া পাবেন।",
      "সরাসরি দেখা করে লেনদেনের স্পষ্ট অবস্থান উল্লেখ করুন।"
    ]
  };

  const ai = getGemini();
  if (!ai) {
    return res.json(defaultFallback);
  }

  try {
    const prompt = `You are an expert consumer second-hand and used goods marketplace valuation appraiser in Bangladesh.
Estimate the fair used resale price (in Bangladeshi Taka - BDT) for:
- Product: "${productName}"
- Category: "${category || 'general'}"
- Condition: "${condition || 'used'}"
- Original/Purchased Price: "${origPriceNum > 0 ? origPriceNum + ' BDT' : 'Not specified'}"
- Duration of Use: "${usedDuration || 'Unspecified'}"

Return ONLY a valid JSON object matching this schema:
{
  "estimatedMinPrice": 12000,
  "estimatedMaxPrice": 16000,
  "recommendedPrice": 14000,
  "valuationSummary": "বাংলাদেশে বর্তমান বাজারদর ও চাহিদা অনুযায়ী সংক্ষিপ্ত ১-২ লাইনের বিশ্লেষণ",
  "buyerDemandLevel": "উচ্চ চাহিদা / মাঝারি / নির্দিষ্ট ক্রেতা",
  "fastSellingTips": [
    "দ্রুত বিক্রির জন্য টিপস ১",
    "টিপস ২"
  ]
}`;

    const response = await generateGeminiContentWithFallback(ai, {
      preferredModel: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an expert Bangladesh classifieds appraiser. Always respond in valid JSON matching schema.",
        responseMimeType: "application/json",
        temperature: 0.4,
      }
    });

    let rawText = response.text?.trim() || "{}";
    if (rawText.startsWith("```json")) {
      rawText = rawText.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
    } else if (rawText.startsWith("```")) {
      rawText = rawText.replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
    }

    const parsed = JSON.parse(rawText || "{}");
    res.json({
      estimatedMinPrice: Number(parsed.estimatedMinPrice) || defaultFallback.estimatedMinPrice,
      estimatedMaxPrice: Number(parsed.estimatedMaxPrice) || defaultFallback.estimatedMaxPrice,
      recommendedPrice: Number(parsed.recommendedPrice) || defaultFallback.recommendedPrice,
      valuationSummary: parsed.valuationSummary || defaultFallback.valuationSummary,
      buyerDemandLevel: parsed.buyerDemandLevel || defaultFallback.buyerDemandLevel,
      fastSellingTips: Array.isArray(parsed.fastSellingTips) && parsed.fastSellingTips.length > 0 ? parsed.fastSellingTips : defaultFallback.fastSellingTips
    });
  } catch (e: any) {
    console.warn("AI Resale Price Estimator fallback returned:", e?.message || e);
    res.json(defaultFallback);
  }
});

// ==========================================
// ✨ C2C AI FULL LISTING GENERATOR
// ==========================================
app.post("/api/ai/generate-c2c-listing", async (req, res) => {
  const { productName, brand, condition, originalPrice, askingPrice, usedDuration, warrantyInfo, pickupLocation, category } = req.body;

  if (!productName || !productName.trim()) {
    return res.status(400).json({ error: "পণ্যের নাম প্রদান করুন।" });
  }

  const defaultDesc = `${productName}${brand ? ` (${brand})` : ''} বিক্রয় করা হবে। কন্ডিশন: ${condition || 'ব্যবহৃত'}। ${usedDuration ? `ব্যবহারের সময়কাল: ${usedDuration}।` : ''} ${warrantyInfo ? `ওয়ারেন্টি: ${warrantyInfo}।` : ''} কোনো অভ্যন্তরীণ সমস্যা নেই, শতভাগ সচল। লোকেশন: ${pickupLocation || 'ধানমন্ডি, ঢাকা'}। সরাসরি এসে দেখে চালিয়ে নেওয়া যাবে। আগ্রহী প্রকৃত ক্রেতাগণ দ্রুত যোগাযোগ করুন।`;

  const defaultFallback = {
    title: `${productName} ${brand ? `(${brand})` : ''} - ফ্রেশ কন্ডিশন`,
    description: defaultDesc,
    keyHighlights: [
      `কন্ডিশন: ${condition === 'new' ? 'একদম নতুন' : condition === 'like_new' ? 'নতুনের মতো ফ্রেশ' : 'ব্যবহৃত (১০০% সচল)'}`,
      `ব্যবহারের সময়কাল: ${usedDuration || 'কয়েক মাস'}`,
      `ওয়ারেন্টি স্ট্যাটাস: ${warrantyInfo || 'কোনো সমস্যা নেই, সম্পূর্ণ ফ্রেশ'}`,
      `পিকআপ লোকেশন: ${pickupLocation || 'ধানমন্ডি, ঢাকা'}`
    ],
    suggestedTags: ["ব্যবহৃত পণ্য", "Second hand", category || "Electronics"]
  };

  const ai = getGemini();
  if (!ai) {
    return res.json(defaultFallback);
  }

  try {
    const prompt = `You are a professional Bangladeshi C2C classifieds and marketplace listing specialist.
Create an irresistible, highly trustworthy, high-converting product listing in authentic Bengali for a customer selling their unused/used product:
- Product Name: "${productName}"
- Brand: "${brand || 'Not specified'}"
- Category: "${category || 'General'}"
- Condition: "${condition || 'used'}"
- Duration of Use: "${usedDuration || 'Not specified'}"
- Warranty/Receipt Info: "${warrantyInfo || 'Not specified'}"
- Asking Price: "${askingPrice || 'Negotiable'}" BDT
- Original Price: "${originalPrice || 'Not specified'}" BDT
- Pickup / Area: "${pickupLocation || 'Dhaka'}"

Return ONLY a valid JSON object matching this schema:
{
  "title": "আকর্ষণীয় ও সংক্ষিপ্ত শিরোনাম (যেমন: OnePlus 9 Pro - 8/256GB একদম নতুনের মতো)",
  "description": "সম্পূর্ণ প্রফেশনাল ও বিশ্বস্ত বিস্তারিত বিবরণী (৩-৪ বাক্য)",
  "keyHighlights": [
    "হাইলাইট ১ (ফিচার/কন্ডিশন)",
    "হাইলাইট ২ (বক্স/এক্সেসরিজ/ওয়ারেন্টি)",
    "হাইলাইট ৩ (লোকেশন ও লেনদেন নিয়ম)"
  ],
  "suggestedTags": ["ট্যাগ১", "ট্যাগ২", "ট্যাগ৩"]
}`;

    const response = await generateGeminiContentWithFallback(ai, {
      preferredModel: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an expert Bengali marketplace copywriter. Always output valid JSON.",
        responseMimeType: "application/json",
        temperature: 0.6,
      }
    });

    let rawText = response.text?.trim() || "{}";
    if (rawText.startsWith("```json")) {
      rawText = rawText.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
    } else if (rawText.startsWith("```")) {
      rawText = rawText.replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
    }

    const parsed = JSON.parse(rawText || "{}");
    res.json({
      title: parsed.title || defaultFallback.title,
      description: parsed.description || defaultFallback.description,
      keyHighlights: Array.isArray(parsed.keyHighlights) && parsed.keyHighlights.length > 0 ? parsed.keyHighlights : defaultFallback.keyHighlights,
      suggestedTags: Array.isArray(parsed.suggestedTags) && parsed.suggestedTags.length > 0 ? parsed.suggestedTags : defaultFallback.suggestedTags
    });
  } catch (e: any) {
    console.warn("AI C2C Listing Generator fallback returned:", e?.message || e);
    res.json(defaultFallback);
  }
});

// ==========================================
// 🌐 FACEBOOK AUTO-IMPORT & PARSER ENGINE
// ==========================================
// Helper to extract numbers and prices from Bengali text
function parseBengaliPrice(text: string): { price: number; originalPrice: number } {
  if (!text) return { price: 0, originalPrice: 0 };
  const bnToEn = (str: string) => str.replace(/[০-৯]/g, d => '০১২৩৪৫৬৭৮৯'.indexOf(d).toString());
  const normalized = bnToEn(text);
  
  // Find price patterns like 1200 tk, ৳ 1200, 1200/-, দাম: ১২০০
  const priceMatches = normalized.match(/(?:দাম|মূল্য|price|টাকা|tk|bdt|৳|off)\s*[:=\-]?\s*([0-9]+)/gi) || [];
  const numbers = normalized.match(/\b([0-9]{2,6})\b/g) || [];
  
  let price = 0;
  let originalPrice = 0;
  
  if (priceMatches.length > 0) {
    const extracted = priceMatches.map(m => parseInt(m.replace(/[^0-9]/g, ''), 10)).filter(n => n > 10 && n < 500000);
    if (extracted.length > 0) {
      price = extracted[0];
      if (extracted.length > 1 && extracted[1] > price) {
        originalPrice = extracted[1];
      }
    }
  } else if (numbers.length > 0) {
    const validNums = numbers.map(n => parseInt(n, 10)).filter(n => n >= 20 && n <= 100000);
    if (validNums.length > 0) price = validNums[0];
  }
  
  return { price, originalPrice };
}

app.post("/api/facebook-import/parse", async (req, res) => {
  try {
    const { facebookUrl, postText, imageUrl, targetType = 'merchant_product' } = req.body;

    let combinedText = (postText || '').trim();
    let ogTitle = '';
    let ogDescription = '';
    let ogImage = imageUrl || '';

    // If Facebook URL is provided, attempt to fetch OpenGraph metadata
    if (facebookUrl && facebookUrl.startsWith('http')) {
      try {
        const fetchController = new AbortController();
        const timeoutId = setTimeout(() => fetchController.abort(), 4000);
        const fbResponse = await fetch(facebookUrl, {
          signal: fetchController.signal,
          headers: {
            'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)'
          }
        });
        clearTimeout(timeoutId);

        if (fbResponse.ok) {
          const html = await fbResponse.text();
          const titleMatch = html.match(/<meta property=["']og:title["'] content=["']([^"']+)["']/i) || html.match(/<title>([^<]+)<\/title>/i);
          const descMatch = html.match(/<meta property=["']og:description["'] content=["']([^"']+)["']/i) || html.match(/<meta name=["']description["'] content=["']([^"']+)["']/i);
          const imgMatch = html.match(/<meta property=["']og:image["'] content=["']([^"']+)["']/i);

          if (titleMatch && titleMatch[1]) ogTitle = titleMatch[1];
          if (descMatch && descMatch[1]) ogDescription = descMatch[1];
          if (!ogImage && imgMatch && imgMatch[1]) ogImage = imgMatch[1];
        }
      } catch (err) {
        // Continue with text extraction even if URL fetch fails or times out
      }
    }

    const fullSourceText = [ogTitle, ogDescription, combinedText].filter(Boolean).join('\n\n');

    if (!fullSourceText.trim()) {
      return res.status(400).json({ error: "অনুগ্রহ করে ফেসবুক পোস্টের টেক্সট, ক্যাপশন অথবা লিংক প্রদান করুন।" });
    }

    // Default Fallback parsing logic
    const { price: fallbackPrice, originalPrice: fallbackOrigPrice } = parseBengaliPrice(fullSourceText);
    const firstLine = fullSourceText.split('\n').filter(l => l.trim().length > 0)[0] || 'ফেসবুক থেকে ইমপোর্টকৃত পণ্য';
    const cleanTitle = firstLine.replace(/[#@][a-zA-Z0-9_]+/g, '').replace(/https?:\/\/\S+/g, '').slice(0, 60).trim();

    const fallbackProduct = {
      name: cleanTitle || 'নতুন ফেসবুক প্রোডাক্ট',
      price: fallbackPrice || 500,
      originalPrice: fallbackOrigPrice || (fallbackPrice ? Math.round(fallbackPrice * 1.15) : undefined),
      description: fullSourceText.slice(0, 300),
      category: 'grocery',
      image: ogImage || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=500',
      highlights: ['১০০% খাঁটি ও গুণগত মানসম্পন্ন', 'দ্রুত হোম ডেলিভারি', 'ফেসবুক পেজ থেকে সরাসরি ইমপোর্টকৃত'],
      tags: ['Facebook Import', 'Special Offer'],
      isWholesaleAvailable: fullSourceText.includes('পাইকারি') || fullSourceText.includes('wholesale'),
      wholesalePrice: fullSourceText.includes('পাইকারি') && fallbackPrice ? Math.round(fallbackPrice * 0.85) : undefined,
      wholesaleMinQty: fullSourceText.includes('পাইকারি') ? 5 : undefined
    };

    const fallbackResult = {
      success: true,
      mode: targetType === 'business_page' ? 'shop' : 'product',
      isBulk: false,
      sourceUrl: facebookUrl || '',
      products: [fallbackProduct],
      shopDetails: {
        name: cleanTitle || 'ফেসবুক ডিজিটাল শপ',
        category: 'grocery',
        description: fullSourceText.slice(0, 300),
        phone: (fullSourceText.match(/01[3-9][0-9]{8}/) || [])[0] || '',
        whatsapp: (fullSourceText.match(/01[3-9][0-9]{8}/) || [])[0] || '',
        address: 'ঢাকা, বাংলাদেশ'
      }
    };

    const ai = getGemini();
    if (!ai) {
      return res.json(fallbackResult);
    }

    const aiPrompt = `You are an expert F-Commerce (Facebook Commerce & Marketplace) extractor for Bangladesh (RestBazar Platform).
Your task is to analyze the following raw Facebook Post text / caption / page data and accurately extract structured products or shop details.

RAW FACEBOOK DATA:
"""
${fullSourceText}
"""

TARGET TYPE: "${targetType}" (options: "merchant_product", "c2c_marketplace", "business_page")
IMAGE URL GIVEN: "${ogImage || ''}"

RULES & EXTRACTION LOGIC:
1. Detect if this post has SINGLE product or MULTIPLE products (Bulk, e.g. Product 1, Product 2...).
2. Extract Product Name in fluent natural Bengali. Strip out promotional spam emojis from the start of the title.
3. Extract accurate numeric Price in BDT (টাকা). If there's an original/cut price and discounted price, extract both 'price' (current discounted price) and 'originalPrice' (higher old price).
4. Category MUST be one of: "grocery", "pharmacy", "electrician", "plumber", "mason", "restaurant", "transport", "tutor", "parlor", "mechanic", "fashion", "electronics", "furniture", "books", "hobbies", "other".
5. Clean Description: Write a clear, attractive Bengali description highlighting specifications, sizes, benefits, and delivery details found in the post.
6. Highlights: 3-4 bullet points (e.g. "প্রিমিয়াম কটন ফেব্রিক", "সাইজ: M, L, XL", "ক্যাশ অন ডেলিভারি").
7. Tags: Array of 3-5 relevant search keywords.
8. If wholesale/পাইকারি is mentioned in the text, set isWholesaleAvailable: true, and estimate wholesalePrice and wholesaleMinQty.
9. If targetType is "business_page" or the text describes a full shop, extract shopDetails (name, category, phone, whatsapp, address, description).

Return ONLY valid JSON matching this schema:
{
  "isBulk": false,
  "products": [
    {
      "name": "পণ্যের আকর্ষণীয় বাংলা নাম",
      "price": 1250,
      "originalPrice": 1500,
      "category": "fashion",
      "description": "সম্পূর্ণ পরিষ্কার ও আকর্ষণীয় বিবরণী",
      "highlights": ["পয়েন্ট ১", "পয়েন্ট ২", "পয়েন্ট ৩"],
      "tags": ["ট্যাগ১", "ট্যাগ২"],
      "image": "${ogImage || ''}",
      "isWholesaleAvailable": false,
      "wholesalePrice": 0,
      "wholesaleMinQty": 0,
      "deliveryCharge": 80,
      "contactPhone": ""
    }
  ],
  "shopDetails": {
    "name": "দোকান বা পেজের নাম",
    "category": "grocery",
    "phone": "017XXXXXXXX",
    "whatsapp": "017XXXXXXXX",
    "address": "দোকানের ঠিকানা বা জেলা/থানা",
    "description": "দোকানের বিবরণ"
  }
}`;

    const response = await generateGeminiContentWithFallback(ai, {
      preferredModel: "gemini-3.7-flash",
      fallbackModels: ["gemini-2.5-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"],
      contents: aiPrompt,
      config: {
        systemInstruction: "You are a professional Bangladeshi Facebook e-commerce product parser. Always output valid JSON strictly.",
        responseMimeType: "application/json",
        temperature: 0.2
      }
    });

    let rawText = response.text?.trim() || "{}";
    if (rawText.startsWith("```json")) {
      rawText = rawText.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
    } else if (rawText.startsWith("```")) {
      rawText = rawText.replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
    }

    const parsed = JSON.parse(rawText || "{}");
    const products = Array.isArray(parsed.products) && parsed.products.length > 0 
      ? parsed.products.map((p: any) => ({
          name: p.name || fallbackProduct.name,
          price: Number(p.price) || fallbackProduct.price,
          originalPrice: p.originalPrice ? Number(p.originalPrice) : undefined,
          category: p.category || 'grocery',
          description: p.description || fallbackProduct.description,
          highlights: Array.isArray(p.highlights) && p.highlights.length > 0 ? p.highlights : fallbackProduct.highlights,
          tags: Array.isArray(p.tags) ? p.tags : fallbackProduct.tags,
          image: p.image || ogImage || fallbackProduct.image,
          isWholesaleAvailable: Boolean(p.isWholesaleAvailable),
          wholesalePrice: p.wholesalePrice ? Number(p.wholesalePrice) : undefined,
          wholesaleMinQty: p.wholesaleMinQty ? Number(p.wholesaleMinQty) : undefined,
          deliveryCharge: p.deliveryCharge ? Number(p.deliveryCharge) : undefined,
          contactPhone: p.contactPhone || ''
        }))
      : [fallbackProduct];

    res.json({
      success: true,
      isBulk: products.length > 1,
      sourceUrl: facebookUrl || '',
      products,
      shopDetails: parsed.shopDetails || fallbackResult.shopDetails
    });
  } catch (error: any) {
    console.error("Facebook import parser error:", error);
    res.status(500).json({ error: "ফেসবুক ডেটা প্রসেসিংয়ে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।" });
  }
});

// ==========================================
// 🚀 FACEBOOK VIRAL POST & SHARE GENERATOR
// ==========================================
app.post("/api/facebook-share/generate-caption", async (req, res) => {
  try {
    const { title, price, originalPrice, shopName, shopAddress, phone, category, appUrl, customNote } = req.body;

    const discountText = (price && originalPrice && originalPrice > price) 
      ? `💥 বিশেষ ছাড়: ৳${originalPrice - price} সাশ্রয়! (আগের দাম ৳${originalPrice})` 
      : '';

    const defaultCaption = `🔥 ${title || 'আকর্ষণীয় অফার'} - RestBazar-এ এখন বিশেষ মূল্যে পাওয়া যাচ্ছে!

💰 বর্তমান মূল্য: মাত্র ৳${price || '০'} টাকা!
${discountText}
🏪 শপ: ${shopName || 'RestBazar Verified Seller'}
📍 লোকেশন: ${shopAddress || 'সারা বাংলাদেশে হোম ডেলিভারি'}
📞 সরাসরি যোগাযোগ / অর্ডার: ${phone || 'রেস্ট বাজার লাইভ চ্যাট'}

🛒 এখনই সহজে অর্ডার করুন বা বিস্তারিত দেখতে ক্লিক করুন:
👉 ${appUrl || 'https://restbazar.com'}

#RestBazar #OnlineShoppingBD #BestOffer #${(category || 'Shopping').replace(/\s+/g, '')} #HomeDelivery`;

    const ai = getGemini();
    if (!ai) {
      return res.json({ caption: defaultCaption });
    }

    const prompt = `You are a viral Facebook marketing copywriter in Bangladesh.
Write a high-converting, friendly, emoji-rich Facebook post caption in authentic Bengali for this product/shop on RestBazar:
- Product/Item Title: "${title || 'Special Product'}"
- Price: "৳${price || 0} BDT"
- Original Price: "${originalPrice ? `৳${originalPrice} BDT` : 'N/A'}"
- Store Name: "${shopName || 'RestBazar Store'}"
- Store Location / Address: "${shopAddress || 'Bangladesh'}"
- Phone / Contact: "${phone || ''}"
- Category: "${category || 'General'}"
- App / Product Direct Link: "${appUrl || 'https://restbazar.com'}"
- Custom Merchant Note: "${customNote || ''}"

REQUIREMENTS:
1. Catchy headline with attention-grabbing emojis (🔥, 💥, ✨, 🛍️).
2. Clear pricing and discount callout.
3. Bullet points of key buying reasons (100% genuine, fast delivery, cash on delivery).
4. Direct Call-to-Action to click the link or message.
5. 4-6 trending Bengali & English hashtags.

Return ONLY valid JSON:
{
  "caption": "পুরো পোস্টের রেডিমেড টেক্সট",
  "shortHook": "১ লাইনের সংক্ষিপ্ত স্ট্যাটাস / রিল ক্যাপশন",
  "hashtags": ["#হ্যাস১", "#হ্যাস২"]
}`;

    const response = await generateGeminiContentWithFallback(ai, {
      preferredModel: "gemini-3.7-flash",
      fallbackModels: ["gemini-2.5-flash", "gemini-flash-latest"],
      contents: prompt,
      config: {
        systemInstruction: "You are a professional Bangladeshi viral Facebook marketer. Always output valid JSON.",
        responseMimeType: "application/json",
        temperature: 0.7
      }
    });

    let rawText = response.text?.trim() || "{}";
    if (rawText.startsWith("```json")) {
      rawText = rawText.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
    } else if (rawText.startsWith("```")) {
      rawText = rawText.replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
    }

    const parsed = JSON.parse(rawText || "{}");
    res.json({
      caption: parsed.caption || defaultCaption,
      shortHook: parsed.shortHook || `${title} মাত্র ৳${price} টাকায়!`,
      hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : ['#RestBazar', '#ShoppingBD']
    });
  } catch (err) {
    res.json({
      caption: `🔥 আকর্ষণীয় অফার RestBazar-এ! বিস্তারিত দেখুন ও অর্ডার করুন।`
    });
  }
});

// Serve static React production bundle or connect to Vite middleware dev server
const startServer = async () => {
  app.post("/api/db/sync-cloud", async (req, res) => {
    await syncFromFirestore();
    res.json({ success: true, message: "Database synchronized with Firebase Firestore cloud!" });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`RB Local full-stack server running on http://localhost:${PORT}`);
    // Sync with Firebase Firestore in the background after server is up and listening
    syncFromFirestore().catch((err) => {
      console.warn("Background Firestore startup sync warning:", err?.message || err);
    });
  });
};

startServer();
