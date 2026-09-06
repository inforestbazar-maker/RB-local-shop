import React, { useState, useEffect } from 'react';
import { 
  Play, Video, Image as ImageIcon, Sparkles, Plus, Search, CheckCircle2, 
  ThumbsUp, Eye, Clock, BookOpen, MessageSquare, Send, X, ExternalLink, 
  Share2, HelpCircle, Lightbulb, ChevronRight, Layers, Tag, Trash2, 
  Edit3, Camera, Upload, Film, Award, Check, RefreshCw, Info, ArrowRight,
  TrendingUp, ShoppingBag, Truck, DollarSign, Store
} from 'lucide-react';
import { SellerTutorial, SellerTutorialStep, Business, User } from '../types';
import { DEFAULT_SELLER_TUTORIALS } from '../data/defaultTutorials';
import PhotoCaptureUpload from './PhotoCaptureUpload';

interface SellerTutorialsPageProps {
  business?: Business | null;
  currentUser?: User | null;
  onBackToDashboard?: () => void;
}

export default function SellerTutorialsPage({
  business,
  currentUser,
  onBackToDashboard
}: SellerTutorialsPageProps) {
  // Tutorials list state
  const [tutorials, setTutorials] = useState<SellerTutorial[]>(() => {
    try {
      const saved = localStorage.getItem('rb_seller_tutorials');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      // ignore
    }
    return DEFAULT_SELLER_TUTORIALS;
  });

  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [activeVideoTutorial, setActiveVideoTutorial] = useState<SellerTutorial | null>(null);
  const [activeDetailTutorial, setActiveDetailTutorial] = useState<SellerTutorial | null>(null);
  const [activeImagePreview, setActiveImagePreview] = useState<string | null>(null);
  
  // Add/Edit Tutorial Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTutId, setEditingTutId] = useState<string | null>(null);
  const [tutTitle, setTutTitle] = useState('');
  const [tutCategory, setTutCategory] = useState<string>('product_upload');
  const [tutDescription, setTutDescription] = useState('');
  const [tutVideoUrl, setTutVideoUrl] = useState('');
  const [tutThumbnail, setTutThumbnail] = useState('');
  const [tutDuration, setTutDuration] = useState('৩ মিনিট');
  const [tutImages, setTutImages] = useState<string[]>([]);
  const [tutSteps, setTutSteps] = useState<SellerTutorialStep[]>([
    { id: '1', stepNumber: 1, title: '', description: '', keyTip: '', image: '' }
  ]);
  const [formError, setFormError] = useState('');

  // AI Seller Mentor Chat
  const [showAiMentorModal, setShowAiMentorModal] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiChatHistory, setAiChatHistory] = useState<Array<{ sender: 'user' | 'ai'; text: string; time: string }>>([
    {
      sender: 'ai',
      text: `স্বাগতম! আমি RestBazar এআই সেলার মেন্টর 🤖।\nআপনার দোকানের বিক্রি বৃদ্ধি, পাইকারি রেট নির্ধারণ, প্রোডাক্ট ফটো তোলার টিপস, কাস্টমার বাকি আদায়ের কৌশল বা সোশ্যাল মিডিয়া ফ্রি প্রমোশন নিয়ে যেকোনো প্রশ্ন করুন।`,
      time: 'এখন'
    }
  ]);
  const [aiLoading, setAiLoading] = useState(false);

  // AI Tutorial & Video Script Generator Modal
  const [showAiGenModal, setShowAiGenModal] = useState(false);
  const [aiGenTopic, setAiGenTopic] = useState('');
  const [aiGenCategory, setAiGenCategory] = useState('product_upload');
  const [aiGenResult, setAiGenResult] = useState<any | null>(null);
  const [aiGenLoading, setAiGenLoading] = useState(false);

  // Fetch tutorials from backend API on mount
  useEffect(() => {
    fetchTutorials();
  }, []);

  const fetchTutorials = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/seller-tutorials');
      if (res.ok) {
        const data = await res.json();
        if (data.tutorials && Array.isArray(data.tutorials) && data.tutorials.length > 0) {
          // Merge with default seed tutorials if needed
          const combined = [...data.tutorials];
          DEFAULT_SELLER_TUTORIALS.forEach(def => {
            if (!combined.some(t => t.id === def.id || t.title === def.title)) {
              combined.push(def);
            }
          });
          setTutorials(combined);
          localStorage.setItem('rb_seller_tutorials', JSON.stringify(combined));
        } else {
          // Seed defaults to server
          setTutorials(DEFAULT_SELLER_TUTORIALS);
          localStorage.setItem('rb_seller_tutorials', JSON.stringify(DEFAULT_SELLER_TUTORIALS));
        }
      }
    } catch (err) {
      console.warn('Could not fetch tutorials from server, using local data', err);
    } finally {
      setLoading(false);
    }
  };

  const saveTutorialsToState = (updatedList: SellerTutorial[]) => {
    setTutorials(updatedList);
    try {
      localStorage.setItem('rb_seller_tutorials', JSON.stringify(updatedList));
    } catch (e) {
      // ignore
    }
  };

  // Helper to extract clean YouTube embed URL
  const getEmbedVideoUrl = (url: string) => {
    if (!url) return null;
    const cleanUrl = url.trim();
    if (cleanUrl.includes('youtube.com/watch?v=')) {
      const vid = cleanUrl.split('watch?v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${vid}?autoplay=1`;
    }
    if (cleanUrl.includes('youtu.be/')) {
      const vid = cleanUrl.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${vid}?autoplay=1`;
    }
    if (cleanUrl.includes('youtube.com/embed/')) {
      return cleanUrl;
    }
    return cleanUrl;
  };

  // Categories list for filter tabs
  const CATEGORY_TABS = [
    { id: 'all', label: 'সবগুলো টিউটোরিয়াল', icon: Layers },
    { id: 'product_upload', label: 'পণ্য ও সেবা আপলোড', icon: ShoppingBag },
    { id: 'wholesale', label: 'পাইকারি (Wholesale)', icon: Store },
    { id: 'order_delivery', label: 'অর্ডার ও ডেলিভারি', icon: Truck },
    { id: 'social_marketing', label: 'ফেসবুক/কটক প্রমোশন', icon: TrendingUp },
    { id: 'ledger', label: 'বাকি খাতা ও লেজার', icon: BookOpen },
    { id: 'photography', label: 'প্রোডাক্ট ফটোগ্রাফি', icon: Camera },
  ];

  // Filtered tutorials
  const filteredTutorials = tutorials.filter(t => {
    const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
    const matchesSearch = !searchQuery.trim() || 
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.tags && t.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesCategory && matchesSearch;
  });

  // Handle Like Tutorial
  const handleLikeTutorial = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = tutorials.map(t => {
      if (t.id === id) {
        return { ...t, likes: (t.likes || 0) + 1 };
      }
      return t;
    });
    saveTutorialsToState(updated);

    try {
      await fetch(`/api/seller-tutorials/${id}/like`, { method: 'POST' });
    } catch (err) {
      // local updated
    }
  };

  // Handle Delete Tutorial
  const handleDeleteTutorial = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('আপনি কি নিশ্চিত যে এই টিউটোরিয়ালটি মুছে ফেলতে চান?')) return;

    const updated = tutorials.filter(t => t.id !== id);
    saveTutorialsToState(updated);

    try {
      await fetch(`/api/seller-tutorials/${id}`, { method: 'DELETE' });
    } catch (err) {
      // local updated
    }
  };

  // Open Edit Tutorial Modal
  const handleOpenEdit = (tut: SellerTutorial, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTutId(tut.id);
    setTutTitle(tut.title);
    setTutCategory(tut.category || 'product_upload');
    setTutDescription(tut.description || '');
    setTutVideoUrl(tut.videoUrl || '');
    setTutThumbnail(tut.thumbnail || '');
    setTutDuration(tut.duration || '৩ মিনিট');
    setTutImages(tut.images || []);
    setTutSteps(tut.steps && tut.steps.length > 0 ? tut.steps : [
      { id: '1', stepNumber: 1, title: '', description: '', keyTip: '', image: '' }
    ]);
    setFormError('');
    setShowAddModal(true);
  };

  // Add Step to Form
  const handleAddStep = () => {
    setTutSteps(prev => [
      ...prev,
      {
        id: `${Date.now()}_${prev.length + 1}`,
        stepNumber: prev.length + 1,
        title: '',
        description: '',
        keyTip: '',
        image: ''
      }
    ]);
  };

  // Update Step in Form
  const handleUpdateStep = (index: number, field: keyof SellerTutorialStep, value: any) => {
    setTutSteps(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  // Remove Step from Form
  const handleRemoveStep = (index: number) => {
    if (tutSteps.length <= 1) return;
    setTutSteps(prev => {
      const filtered = prev.filter((_, i) => i !== index);
      return filtered.map((s, i) => ({ ...s, stepNumber: i + 1 }));
    });
  };

  // Save Tutorial (Create or Update)
  const handleSaveTutorial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tutTitle.trim()) {
      setFormError('দয়া করে টিউটোরিয়ালের শিরোনাম প্রদান করুন।');
      return;
    }

    const payload = {
      title: tutTitle.trim(),
      category: tutCategory,
      categoryLabel: CATEGORY_TABS.find(c => c.id === tutCategory)?.label || 'সাধারণ গাইড',
      description: tutDescription.trim(),
      videoUrl: tutVideoUrl.trim(),
      thumbnail: tutThumbnail.trim() || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800',
      duration: tutDuration.trim() || '৩ মিনিট',
      authorName: business?.name || currentUser?.name || 'RestBazar বিক্রেতা',
      authorRole: business ? 'দোকান মার্চেন্ট' : 'অ্যাডমিন',
      images: tutImages.filter(img => !!img),
      steps: tutSteps.filter(s => s.title.trim() || s.description.trim()),
      tags: ['টিউটোরিয়াল', CATEGORY_TABS.find(c => c.id === tutCategory)?.label || 'গাইড']
    };

    try {
      if (editingTutId) {
        // Update
        const res = await fetch(`/api/seller-tutorials/${editingTutId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const updated = tutorials.map(t => t.id === editingTutId ? { ...t, ...payload } : t);
        saveTutorialsToState(updated);
      } else {
        // Create new
        const res = await fetch('/api/seller-tutorials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const newTut: SellerTutorial = {
          id: `tut_${Date.now()}`,
          ...payload,
          createdAt: new Date().toISOString(),
          views: 1,
          likes: 0
        };
        if (res.ok) {
          const data = await res.json();
          if (data.tutorial) {
            saveTutorialsToState([data.tutorial, ...tutorials]);
          } else {
            saveTutorialsToState([newTut, ...tutorials]);
          }
        } else {
          saveTutorialsToState([newTut, ...tutorials]);
        }
      }

      setShowAddModal(false);
      resetForm();
    } catch (err) {
      console.error('Error saving tutorial:', err);
      // fallback to local update
      const newTut: SellerTutorial = {
        id: editingTutId || `tut_${Date.now()}`,
        ...payload,
        createdAt: new Date().toISOString(),
        views: 1,
        likes: 0
      };
      if (editingTutId) {
        saveTutorialsToState(tutorials.map(t => t.id === editingTutId ? newTut : t));
      } else {
        saveTutorialsToState([newTut, ...tutorials]);
      }
      setShowAddModal(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setEditingTutId(null);
    setTutTitle('');
    setTutCategory('product_upload');
    setTutDescription('');
    setTutVideoUrl('');
    setTutThumbnail('');
    setTutDuration('৩ মিনিট');
    setTutImages([]);
    setTutSteps([{ id: '1', stepNumber: 1, title: '', description: '', keyTip: '', image: '' }]);
    setFormError('');
  };

  // AI Seller Mentor Ask Question
  const handleAskAiMentor = async (questionText?: string) => {
    const q = (questionText || aiQuestion).trim();
    if (!q) return;

    const userMsg = { sender: 'user' as const, text: q, time: 'এখন' };
    setAiChatHistory(prev => [...prev, userMsg]);
    setAiQuestion('');
    setAiLoading(true);

    try {
      const res = await fetch('/api/ai/seller-mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          shopName: business?.name,
          category: business?.category,
          businessType: business?.type || 'shop'
        })
      });

      if (res.ok) {
        const data = await res.json();
        const aiMsg = { sender: 'ai' as const, text: data.reply || 'দুঃখিত, কোনো উত্তর পাওয়া যায়নি।', time: 'এইমাত্র' };
        setAiChatHistory(prev => [...prev, aiMsg]);
      } else {
        setAiChatHistory(prev => [
          ...prev,
          { sender: 'ai', text: 'দুঃখিত, এআই সার্ভারে সংযোগ পেতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।', time: 'এইমাত্র' }
        ]);
      }
    } catch (err) {
      setAiChatHistory(prev => [
        ...prev,
        {
          sender: 'ai',
          text: `RestBazar-এ আপনার ব্যবসা বৃদ্ধি করার সেরা ৩টি পরামর্শ:\n১. নিয়মিত পণ্যের তাজা ছবি ও আকর্ষণীয় বর্ণনা দিন।\n২. পাইকারি (Wholesale) মোড চালু করে বাল্ক অর্ডারে আকর্ষণীয় ছাড় দিন।\n৩. কাস্টমারদের দ্রুততম সময়ে হোম ডেলিভারি প্রদান করুন।`,
          time: 'এইমাত্র'
        }
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  // AI Tutorial Generator Action
  const handleGenerateAiTutorial = async () => {
    if (!aiGenTopic.trim()) return;
    setAiGenLoading(true);
    setAiGenResult(null);

    try {
      const res = await fetch('/api/ai/generate-tutorial-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: aiGenTopic.trim(),
          category: aiGenCategory,
          businessType: business?.type || 'shop'
        })
      });

      if (res.ok) {
        const data = await res.json();
        setAiGenResult(data);
      } else {
        alert('এআই টিউটোরিয়াল তৈরি করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
      }
    } catch (err) {
      console.error(err);
      alert('এআই টিউটোরিয়াল তৈরির সময় সংযোগ ত্রুটি হয়েছে।');
    } finally {
      setAiGenLoading(false);
    }
  };

  // Save AI Generated Tutorial directly to Library
  const handleSaveAiGeneratedTutorial = async () => {
    if (!aiGenResult) return;

    const newTut: SellerTutorial = {
      id: `tut_ai_${Date.now()}`,
      title: aiGenResult.title,
      category: aiGenResult.category || aiGenCategory,
      categoryLabel: aiGenResult.categoryLabel || CATEGORY_TABS.find(c => c.id === aiGenCategory)?.label || 'এআই গাইড',
      description: aiGenResult.description,
      duration: aiGenResult.duration || '৩ মিনিট ৩০ সেকেন্ড',
      thumbnail: aiGenResult.thumbnail || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800',
      authorName: 'Gemini AI Advisor',
      authorRole: 'স্মার্ট বিজনেস অ্যাসিস্ট্যান্ট',
      aiGenerated: true,
      tags: ['এআই গাইড', 'ভিডিও স্ক্রিপ্ট', aiGenTopic],
      steps: (aiGenResult.steps || []).map((s: any, idx: number) => ({
        id: `s_${Date.now()}_${idx}`,
        stepNumber: s.stepNumber || idx + 1,
        title: s.title,
        description: s.description,
        keyTip: s.keyTip
      })),
      createdAt: new Date().toISOString(),
      views: 1,
      likes: 1
    };

    saveTutorialsToState([newTut, ...tutorials]);

    try {
      await fetch('/api/seller-tutorials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTut)
      });
    } catch (e) {
      // local save done
    }

    setShowAiGenModal(false);
    setAiGenResult(null);
    setAiGenTopic('');
    alert('🎉 এআই গাইডলাইন ও ভিডিও স্ক্রিপ্ট সফলভাবে টিউটোরিয়াল লাইব্রেরিতে যুক্ত হয়েছে!');
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner with Controls */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg border border-emerald-700/30">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-black tracking-wider uppercase">
              <Film className="w-3.5 h-3.5" />
              মার্চেন্ট লার্নিং সেন্টার ও মিডিয়া হাব
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              📺 বিক্রেতা ভিডিও টিউটোরিয়াল, ফটো গাইড ও এআই অ্যাসিস্ট্যান্ট
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
              দোকান পরিচালনা, পণ্য আপলোড, পাইকারি ব্যবসা, ফেসবুক প্রমোশন ও বাকি খাতা ব্যবহারের বিস্তারিত ভিডিও ও সচিত্র গাইডলাইন দেখুন। এছাড়াও নতুন ভিডিও/ফটো গাইড আপলোড করুন অথবা এআই দিয়ে তাৎক্ষণিক পরামর্শ নিন।
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2.5 sm:shrink-0">
            <button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white text-xs font-black shadow-md hover:shadow-lg transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              নতুন ভিডিও ও ফটো গাইড যোগ করুন
            </button>

            <button
              onClick={() => setShowAiMentorModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-emerald-200 hover:text-white text-xs font-bold border border-white/15 backdrop-blur-xs transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
              🤖 এআই বিক্রেতা মেন্টর
            </button>

            <button
              onClick={() => setShowAiGenModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-purple-600/40 hover:bg-purple-600/60 text-purple-200 hover:text-white text-xs font-bold border border-purple-400/30 backdrop-blur-xs transition-all cursor-pointer"
            >
              <Film className="w-4 h-4 text-purple-300" />
              ✨ এআই ভিডিও স্ক্রিপ্ট তৈরি
            </button>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/20 flex items-center justify-center text-emerald-300 font-bold">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base font-black text-white">{tutorials.length}টি</div>
              <div className="text-[11px] text-emerald-200/80">মোট ভিডিও ও গাইড</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/20 flex items-center justify-center text-blue-300 font-bold">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base font-black text-white">
                {tutorials.reduce((acc, t) => acc + (t.images?.length || 0) + (t.steps?.filter(s => s.image)?.length || 0), 0)}টি
              </div>
              <div className="text-[11px] text-blue-200/80">সচিত্র স্টেপ ফটো</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/20 flex items-center justify-center text-amber-300 font-bold">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base font-black text-white">
                {tutorials.reduce((acc, t) => acc + (t.views || 0), 0)} বার
              </div>
              <div className="text-[11px] text-amber-200/80">টিউটোরিয়াল ভিউ</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-400/20 flex items-center justify-center text-rose-300 font-bold">
              <ThumbsUp className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base font-black text-white">
                {tutorials.reduce((acc, t) => acc + (t.likes || 0), 0)} জন
              </div>
              <div className="text-[11px] text-rose-200/80">বিক্রেতা উপকৃত</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Category Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="টিউটোরিয়ালের বিষয় বা কি-ওয়ার্ড খুঁজুন (যেমন: পণ্য আপলোড, পাইকারি, প্রমোশন, ফটো)..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Refresh button */}
          <button
            onClick={fetchTutorials}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            title="রিফ্রেশ করুন"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>রিফ্রেশ</span>
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORY_TABS.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Tutorials Grid */}
      {filteredTutorials.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <Film className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800">কোনো টিউটোরিয়াল পাওয়া যায়নি</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              অনুসন্ধানের সাথে মিল রেখে কোনো ভিডিও বা গাইডলাইন নেই। আপনি নিজে একটি নতুন টিউটোরিয়াল বা ফটো গাইড যুক্ত করতে পারেন!
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            নতুন টিউটোরিয়াল যোগ করুন
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTutorials.map((tut) => {
            const hasVideo = !!tut.videoUrl;
            const hasSteps = !!(tut.steps && tut.steps.length > 0);
            const hasPhotos = !!(tut.images && tut.images.length > 0);

            return (
              <div
                key={tut.id}
                className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 flex flex-col group"
              >
                {/* Media Thumbnail Container */}
                <div className="relative aspect-video bg-slate-900 overflow-hidden">
                  <img
                    src={tut.thumbnail || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600'}
                    alt={tut.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-85 group-hover:opacity-100"
                  />

                  {/* Top Badges */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                    <span className="bg-slate-900/80 backdrop-blur-xs text-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-md border border-emerald-500/20">
                      {tut.categoryLabel || tut.category}
                    </span>

                    {tut.duration && (
                      <span className="bg-black/80 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-300" />
                        {tut.duration}
                      </span>
                    )}
                  </div>

                  {/* Play Button Overlay if has video */}
                  {hasVideo ? (
                    <button
                      onClick={() => setActiveVideoTutorial(tut)}
                      className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/20 transition-colors cursor-pointer"
                      title="ভিডিও দেখুন"
                    >
                      <div className="w-13 h-13 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg transform group-hover:scale-115 transition-transform">
                        <Play className="w-6 h-6 fill-white translate-x-0.5" />
                      </div>
                    </button>
                  ) : (
                    <button
                      onClick={() => setActiveDetailTutorial(tut)}
                      className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/20 transition-colors cursor-pointer"
                      title="সচিত্র গাইড দেখুন"
                    >
                      <div className="w-13 h-13 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg transform group-hover:scale-115 transition-transform">
                        <BookOpen className="w-6 h-6" />
                      </div>
                    </button>
                  )}

                  {/* Bottom indicators */}
                  <div className="absolute bottom-2 left-2 flex gap-1.5">
                    {hasPhotos && (
                      <span className="bg-black/70 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                        <ImageIcon className="w-3 h-3 text-cyan-300" />
                        {tut.images?.length}টি ছবি
                      </span>
                    )}
                    {hasSteps && (
                      <span className="bg-black/70 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        {tut.steps?.length}টি ধাপ
                      </span>
                    )}
                  </div>
                </div>

                {/* Content Box */}
                <div className="p-4.5 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <h3 
                      onClick={() => hasVideo ? setActiveVideoTutorial(tut) : setActiveDetailTutorial(tut)}
                      className="text-sm font-extrabold text-slate-900 line-clamp-2 hover:text-emerald-700 cursor-pointer transition-colors leading-snug"
                    >
                      {tut.title}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {tut.description}
                    </p>
                  </div>

                  {/* Key Step Peek if available */}
                  {tut.steps && tut.steps.length > 0 && (
                    <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl space-y-1">
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <Lightbulb className="w-3 h-3 text-amber-500" />
                        মূল টিপস:
                      </div>
                      <div className="text-[11px] text-slate-700 font-semibold line-clamp-1">
                        {tut.steps[0].keyTip || tut.steps[0].title}
                      </div>
                    </div>
                  )}

                  {/* Author & Footer Actions */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-black flex items-center justify-center text-[10px]">
                        {tut.authorName ? tut.authorName.charAt(0) : 'R'}
                      </div>
                      <span className="text-[11px] font-bold text-slate-600 truncate max-w-[110px]">
                        {tut.authorName || 'মার্চেন্ট সাপোর্ট'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => handleLikeTutorial(tut.id, e)}
                        className="flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                        title="উপকৃত হয়েছেন"
                      >
                        <ThumbsUp className="w-3 h-3 text-rose-500" />
                        <span>{tut.likes || 0}</span>
                      </button>

                      <button
                        onClick={(e) => handleOpenEdit(tut, e)}
                        className="p-1 text-slate-400 hover:text-blue-600 rounded-md hover:bg-slate-100 transition-colors"
                        title="এডিট করুন"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => handleDeleteTutorial(tut.id, e)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-100 transition-colors"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Primary CTA button */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {hasVideo && (
                      <button
                        onClick={() => setActiveVideoTutorial(tut)}
                        className="w-full py-2 px-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-red-700" />
                        ভিডিও প্লে
                      </button>
                    )}

                    <button
                      onClick={() => setActiveDetailTutorial(tut)}
                      className={`py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                        !hasVideo ? 'col-span-2' : ''
                      }`}
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      সচিত্র গাইড পড়ুন
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. MODAL: Interactive Video Player Modal                   */}
      {/* ========================================================= */}
      {activeVideoTutorial && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-4 sm:px-6 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-black uppercase tracking-wider">
                <Film className="w-4 h-4 text-red-500" />
                ভিডিও প্লেয়ার ও নির্দেশিকা
              </div>
              <button
                onClick={() => setActiveVideoTutorial(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Video Player Box */}
            <div className="bg-black relative aspect-video w-full">
              {activeVideoTutorial.videoUrl && activeVideoTutorial.videoUrl.includes('youtube') ? (
                <iframe
                  src={getEmbedVideoUrl(activeVideoTutorial.videoUrl) || ''}
                  title={activeVideoTutorial.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : activeVideoTutorial.videoUrl && (activeVideoTutorial.videoUrl.endsWith('.mp4') || activeVideoTutorial.videoUrl.endsWith('.webm')) ? (
                <video
                  src={activeVideoTutorial.videoUrl}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400">
                    <Video className="w-8 h-8" />
                  </div>
                  <div className="text-sm font-bold text-white max-w-md">
                    {activeVideoTutorial.videoUrl ? 'ভিডিও লিংক: ' + activeVideoTutorial.videoUrl : 'ভিডিও সরাসরি প্লে করার জন্য প্রস্তুত হচ্ছে'}
                  </div>
                  {activeVideoTutorial.videoUrl && (
                    <a
                      href={activeVideoTutorial.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold"
                    >
                      <ExternalLink className="w-4 h-4" />
                      ইউটিউব বা ব্রাউজারে খুলুন
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Video Info & Step Guideline Drawer */}
            <div className="p-5 sm:p-6 bg-slate-900 text-slate-100 overflow-y-auto space-y-4 max-h-[35vh]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">{activeVideoTutorial.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                    <span className="text-emerald-400 font-bold">{activeVideoTutorial.categoryLabel}</span>
                    <span>•</span>
                    <span>সময়কাল: {activeVideoTutorial.duration}</span>
                    <span>•</span>
                    <span>প্রশিক্ষক: {activeVideoTutorial.authorName}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    const tut = activeVideoTutorial;
                    setActiveVideoTutorial(null);
                    setActiveDetailTutorial(tut);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  সচিত্র গাইড ও ফটো দেখুন ↗
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {activeVideoTutorial.description}
              </p>

              {/* Steps preview in video modal */}
              {activeVideoTutorial.steps && activeVideoTutorial.steps.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider">ভিডিওর মূল ধাপসমূহ:</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {activeVideoTutorial.steps.map((step, idx) => (
                      <div key={idx} className="bg-slate-800/80 border border-slate-700/60 p-3 rounded-xl space-y-1">
                        <div className="text-xs font-extrabold text-white flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-mono font-bold">
                            {step.stepNumber}
                          </span>
                          {step.title}
                        </div>
                        <p className="text-[11px] text-slate-300">{step.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. MODAL: Step-by-Step Illustrated Guideline & Lightbox   */}
      {/* ========================================================= */}
      {activeDetailTutorial && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
          <div className="bg-white rounded-3xl overflow-hidden w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl border border-slate-200">
            {/* Header */}
            <div className="p-4 sm:px-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 line-clamp-1">{activeDetailTutorial.title}</h3>
                  <p className="text-[10px] text-slate-500">{activeDetailTutorial.categoryLabel} • {activeDetailTutorial.duration}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {activeDetailTutorial.videoUrl && (
                  <button
                    onClick={() => {
                      const tut = activeDetailTutorial;
                      setActiveDetailTutorial(null);
                      setActiveVideoTutorial(tut);
                    }}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    ভিডিও দেখুন
                  </button>
                )}
                <button
                  onClick={() => setActiveDetailTutorial(null)}
                  className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Overview Box */}
              <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-4.5 space-y-2">
                <h4 className="text-xs font-black text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-emerald-700" />
                  টিউটোরিয়ালের মূল উদ্দেশ্য ও গাইডলাইন
                </h4>
                <p className="text-xs text-emerald-950 font-medium leading-relaxed">
                  {activeDetailTutorial.description}
                </p>
              </div>

              {/* Photo Gallery Infographics if any */}
              {activeDetailTutorial.images && activeDetailTutorial.images.length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-blue-600" />
                    সচিত্র স্ক্রিনশট ও ইনফোগ্রাফিক গ্যালারি ({activeDetailTutorial.images.length}টি):
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {activeDetailTutorial.images.map((img, idx) => (
                      <div
                        key={idx}
                        onClick={() => setActiveImagePreview(img)}
                        className="relative rounded-xl overflow-hidden border border-slate-200 aspect-video group cursor-pointer bg-slate-100 shadow-xs hover:shadow-md transition-all"
                      >
                        <img src={img} alt={`Guideline photo ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                          <Eye className="w-4 h-4 mr-1" /> বড় করে দেখুন
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step by step cards */}
              {activeDetailTutorial.steps && activeDetailTutorial.steps.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ধাপে ধাপে সচিত্র নির্দেশিকা (Step-by-Step Process):
                  </h4>

                  <div className="space-y-4">
                    {activeDetailTutorial.steps.map((step, idx) => (
                      <div key={idx} className="border border-slate-200 rounded-2xl p-4 bg-white shadow-xs space-y-3">
                        <div className="flex items-start gap-3">
                          <span className="w-7 h-7 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                            {step.stepNumber}
                          </span>
                          <div className="space-y-1 flex-1">
                            <h5 className="text-xs font-black text-slate-900">{step.title}</h5>
                            <p className="text-xs text-slate-600 leading-relaxed">{step.description}</p>
                          </div>
                        </div>

                        {step.image && (
                          <div 
                            onClick={() => setActiveImagePreview(step.image!)}
                            className="rounded-xl overflow-hidden border border-slate-200 aspect-video max-h-56 bg-slate-100 cursor-pointer group relative"
                          >
                            <img src={step.image} alt={step.title} className="w-full h-full object-cover group-hover:scale-102 transition-transform" />
                            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded flex items-center gap-1">
                              <Eye className="w-3 h-3" /> বড় করুন
                            </div>
                          </div>
                        )}

                        {step.keyTip && (
                          <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2">
                            <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold">গুরুত্বপূর্ণ টিপস: </span>
                              <span>{step.keyTip}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <div className="text-xs text-slate-500">
                এই গাইডলাইনটি কাজে লেগেছে?
              </div>
              <button
                onClick={(e) => handleLikeTutorial(activeDetailTutorial.id, e)}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                লাইক দিন ({activeDetailTutorial.likes || 0})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. MODAL: Image Lightbox Preview                          */}
      {/* ========================================================= */}
      {activeImagePreview && (
        <div 
          onClick={() => setActiveImagePreview(null)}
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out animate-fadeIn"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img src={activeImagePreview} alt="Preview" className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl border border-white/20" />
            <button
              onClick={() => setActiveImagePreview(null)}
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 7. MODAL: Add/Edit Video & Photo Tutorial Form            */}
      {/* ========================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
          <div className="bg-white rounded-3xl overflow-hidden w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl border border-slate-200">
            {/* Header */}
            <div className="p-4 sm:px-6 bg-emerald-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                <h3 className="text-base font-black">
                  {editingTutId ? 'টিউটোরিয়াল ও ফটো গাইড এডিট করুন' : 'নতুন ভিডিও টিউটোরিয়াল ও সচিত্র গাইড যোগ করুন'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveTutorial} className="p-6 overflow-y-auto space-y-5 flex-1">
              {formError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs font-bold">
                  ⚠️ {formError}
                </div>
              )}

              {/* Title & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-800 block">
                    টিউটোরিয়ালের শিরোনাম (Title) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={tutTitle}
                    onChange={(e) => setTutTitle(e.target.value)}
                    placeholder="যেমন: মোবাইল ক্যামেরা দিয়ে চমৎকার প্রোডাক্ট ফটো তোলার নিয়ম"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 font-medium focus:bg-white focus:outline-none focus:border-emerald-500 transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 block">ক্যাটাগরি (Category)</label>
                  <select
                    value={tutCategory}
                    onChange={(e) => setTutCategory(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold focus:bg-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="product_upload">পণ্য ও সেবা আপলোড</option>
                    <option value="wholesale">পাইকারি (Wholesale)</option>
                    <option value="order_delivery">অর্ডার ও ডেলিভারি</option>
                    <option value="social_marketing">সোশ্যাল মিডিয়া প্রমোশন</option>
                    <option value="ledger">বাকি খাতা ও লেজার</option>
                    <option value="photography">প্রোডাক্ট ফটোগ্রাফি</option>
                    <option value="general">সাধারণ গাইডলাইন</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800 block">বিস্তারিত বিবরণ ও সারাংশ</label>
                <textarea
                  rows={3}
                  value={tutDescription}
                  onChange={(e) => setTutDescription(e.target.value)}
                  placeholder="এই টিউটোরিয়াল থেকে বিক্রেতারা কি কি শিখতে পারবেন তা সংক্ষেপে লিখুন..."
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 font-medium focus:bg-white focus:outline-none focus:border-emerald-500 transition-all"
                />
              </div>

              {/* Video URL & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Film className="w-3.5 h-3.5 text-red-600" />
                    ভিডিও লিংক (YouTube / Facebook Video / Direct MP4 URL)
                  </label>
                  <input
                    type="url"
                    value={tutVideoUrl}
                    onChange={(e) => setTutVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=... বা ভিডিও লিংক"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 font-medium focus:bg-white focus:outline-none focus:border-emerald-500 transition-all"
                  />
                  <span className="text-[10px] text-slate-400">ইউটিউব বা ফেসবুকে আপলোড করা ভিডিওর লিংক দিতে পারেন</span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 block">ভিডিও সময়কাল (Duration)</label>
                  <input
                    type="text"
                    value={tutDuration}
                    onChange={(e) => setTutDuration(e.target.value)}
                    placeholder="যেমন: ৩ মিনিট ৩০ সেকেন্ড"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 font-medium focus:bg-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Thumbnail Photo Upload */}
              <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-emerald-600" />
                  কভার থাম্বনেইল ছবি (Tutorial Cover Photo)
                </label>
                <PhotoCaptureUpload
                  currentImage={tutThumbnail}
                  onImageChange={setTutThumbnail}
                  label="কভার থাম্বনেইল ছবি তুলুন বা আপলোড করুন"
                  sublabel="ক্যামেরা অন করে সরাসরি ছবি তুলুন অথবা গ্যালারি থেকে নির্বাচন করুন"
                  shape="rectangle"
                  aspectRatio="16:9"
                  placeholderText="কভার ছবি"
                />
              </div>

              {/* Multiple Guideline Screenshot Photos */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-blue-600" />
                    সচিত্র স্ক্রিনশট ও ইনফোগ্রাফিক ছবি যুক্ত করুন ({tutImages.length}টি)
                  </label>
                </div>

                <PhotoCaptureUpload
                  onImageChange={(newImg) => {
                    if (newImg) {
                      setTutImages(prev => [...prev, newImg]);
                    }
                  }}
                  label="নতুন গাইড ছবি আপলোড করুন বা ছবি তুলুন"
                  shape="rectangle"
                  aspectRatio="16:9"
                  placeholderText="গ্যালারি ছবি"
                />

                {tutImages.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                    {tutImages.map((img, idx) => (
                      <div key={idx} className="relative rounded-xl overflow-hidden border border-slate-200 aspect-video group bg-white shadow-xs">
                        <img src={img} alt={`Attached ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setTutImages(tutImages.filter((_, i) => i !== idx))}
                          className="absolute top-1.5 right-1.5 p-1 bg-rose-600 text-white rounded-lg opacity-90 group-hover:opacity-100 transition-all cursor-pointer shadow-md"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Step-by-Step Builder */}
              <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <label className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ধাপে ধাপে সচিত্র স্টেপ গাইডলাইন তৈরি ({tutSteps.length}টি ধাপ)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddStep}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    নতুন ধাপ যোগ করুন
                  </button>
                </div>

                <div className="space-y-4">
                  {tutSteps.map((step, idx) => (
                    <div key={step.id || idx} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-black font-mono">
                          ধাপ {step.stepNumber}
                        </span>
                        {tutSteps.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveStep(idx)}
                            className="text-rose-500 hover:text-rose-700 text-xs font-bold flex items-center gap-1 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> ধাপ মুছুন
                          </button>
                        )}
                      </div>

                      <div className="space-y-1">
                        <input
                          type="text"
                          value={step.title}
                          onChange={(e) => handleUpdateStep(idx, 'title', e.target.value)}
                          placeholder={`ধাপ ${step.stepNumber}-এর শিরোনাম (যেমন: প্রোডাক্টের নাম ও বিক্রয়মূল্য লিখুন)`}
                          className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold focus:bg-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <textarea
                          rows={2}
                          value={step.description}
                          onChange={(e) => handleUpdateStep(idx, 'description', e.target.value)}
                          placeholder="এই ধাপে বিক্রেতাকে কি কি করতে হবে বিস্তারিত লিখুন..."
                          className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium focus:bg-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <input
                          type="text"
                          value={step.keyTip || ''}
                          onChange={(e) => handleUpdateStep(idx, 'keyTip', e.target.value)}
                          placeholder="বিশেষ প্রো-টিপস (যেমন: দিনের আলোতে ছবি তুললে রঙ নিখুঁত থাকে)"
                          className="w-full text-xs bg-amber-50/60 border border-amber-200 rounded-xl p-2.5 text-amber-900 font-semibold focus:bg-white focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      {/* Step image */}
                      <PhotoCaptureUpload
                        currentImage={step.image}
                        onImageChange={(img) => handleUpdateStep(idx, 'image', img)}
                        label={`ধাপ ${step.stepNumber}-এর ছবি তুলুন বা আপলোড করুন`}
                        shape="rectangle"
                        aspectRatio="16:9"
                        placeholderText={`ধাপ ${step.stepNumber} ছবি`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-colors"
                >
                  বাতিল করুন
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md cursor-pointer transition-all hover:scale-[1.02] active:scale-95"
                >
                  {editingTutId ? 'পরিবর্তন সংরক্ষণ করুন' : '✅ টিউটোরিয়াল প্রকাশ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 8. MODAL: AI Seller Mentor (এআই বিক্রেতা মেন্টর চ্যাট)       */}
      {/* ========================================================= */}
      {showAiMentorModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl overflow-hidden w-full max-w-2xl h-[85vh] flex flex-col shadow-2xl">
            {/* Header */}
            <div className="p-4 sm:px-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-yellow-500 to-emerald-500 flex items-center justify-center text-slate-950 font-black shadow-md">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    RestBazar এআই বিক্রেতা মেন্টর
                    <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-400/30">
                      Gemini 3.7 AI
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">ব্যবসা বৃদ্ধি, পাইকারি বিক্রয় ও মার্কেটিং এর সার্বক্ষণিক পরামর্শক</p>
                </div>
              </div>

              <button
                onClick={() => setShowAiMentorModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Prompt Chips */}
            <div className="bg-slate-950/60 p-3 border-b border-slate-800/80 flex gap-2 overflow-x-auto scrollbar-none">
              {[
                'দোকানের বিক্রি ৩ গুণ বৃদ্ধি করার উপায় কি?',
                'পাইকারি পণ্যের রেট ও ভলিউম ছাড় কিভাবে নির্ধারণ করব?',
                'মোবাইলে সুন্দর প্রোডাক্ট ফটো তোলার গোপন টিপস',
                'কাস্টমার বাকি খাতার টাকা আদায়ের সহজ কৌশল',
                'ফেসবুক ও টিকটকে ফ্রি ভিডিও প্রমোশন পাওয়ার সেরা নিয়ম',
                'গ্রাহকদের থেকে ৫-স্টার রিভিউ পাওয়ার টেকনিক'
              ].map((chip, i) => (
                <button
                  key={i}
                  onClick={() => handleAskAiMentor(chip)}
                  disabled={aiLoading}
                  className="px-3 py-1.5 bg-slate-800/80 hover:bg-emerald-600/30 hover:border-emerald-500/40 text-emerald-200 text-[11px] font-semibold rounded-xl border border-slate-700 whitespace-nowrap transition-all cursor-pointer disabled:opacity-50"
                >
                  ⚡ {chip}
                </button>
              ))}
            </div>

            {/* Chat Messages Body */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
              {aiChatHistory.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'ai' && (
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 font-bold text-xs shadow-sm mt-1">
                      🤖
                    </div>
                  )}

                  <div
                    className={`p-4 rounded-2xl text-xs leading-relaxed max-w-[85%] whitespace-pre-line shadow-xs ${
                      msg.sender === 'user'
                        ? 'bg-emerald-600 text-white rounded-tr-none'
                        : 'bg-slate-800 text-slate-100 border border-slate-700/60 rounded-tl-none font-medium'
                    }`}
                  >
                    {msg.text}
                    <div className={`text-[9px] mt-1.5 ${msg.sender === 'user' ? 'text-emerald-200 text-right' : 'text-slate-400'}`}>
                      {msg.time}
                    </div>
                  </div>
                </div>
              ))}

              {aiLoading && (
                <div className="flex gap-3 items-center text-xs text-emerald-400">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600/30 border border-emerald-500/30 flex items-center justify-center animate-spin">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <span className="font-semibold animate-pulse">এআই মেন্টর আপনার প্রশ্নের উত্তর তৈরি করছে...</span>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="p-4 bg-slate-950 border-t border-slate-800">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAskAiMentor();
                }}
                className="flex gap-2 items-center"
              >
                <input
                  type="text"
                  value={aiQuestion}
                  onChange={(e) => setAiQuestion(e.target.value)}
                  placeholder="আপনার প্রশ্নটি এখানে বাংলায় লিখুন (যেমন: রমজানে বেশি বিক্রির কৌশল কি?)..."
                  className="flex-1 text-xs bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-all font-medium"
                />
                <button
                  type="submit"
                  disabled={aiLoading || !aiQuestion.trim()}
                  className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-md transition-all shrink-0"
                >
                  <Send className="w-4 h-4" />
                  <span>পাঠান</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 9. MODAL: AI Tutorial & Video Script Creator               */}
      {/* ========================================================= */}
      {showAiGenModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
          <div className="bg-white rounded-3xl overflow-hidden w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl border border-slate-200">
            {/* Header */}
            <div className="p-4 sm:px-6 bg-purple-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-yellow-300" />
                <div>
                  <h3 className="text-base font-black">✨ এআই দিয়ে ভিডিও স্ক্রিপ্ট ও টিউটোরিয়াল তৈরি</h3>
                  <p className="text-[11px] text-purple-200">যেকোনো বিষয় লিখুন, এআই ১-ক্লিকে চমৎকার টিউটোরিয়াল তৈরি করে দেবে</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAiGenModal(false);
                  setAiGenResult(null);
                }}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {!aiGenResult ? (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-800 block">
                      টিউটোরিয়ালের বিষয় বা টপিক (Topic) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={aiGenTopic}
                      onChange={(e) => setAiGenTopic(e.target.value)}
                      placeholder="যেমন: শীতকালীন পোশাক বেশি দামে ও দ্রুত বিক্রির কৌশল"
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-medium focus:bg-white focus:outline-none focus:border-purple-500 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-800 block">ক্যাটাগরি নির্বাচন</label>
                      <select
                        value={aiGenCategory}
                        onChange={(e) => setAiGenCategory(e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold focus:bg-white focus:outline-none focus:border-purple-500"
                      >
                        <option value="product_upload">পণ্য ও সেবা আপলোড</option>
                        <option value="wholesale">পাইকারি (Wholesale)</option>
                        <option value="order_delivery">অর্ডার ও ডেলিভারি</option>
                        <option value="social_marketing">সোশ্যাল প্রমোশন</option>
                        <option value="ledger">বাকি খাতা</option>
                        <option value="photography">প্রোডাক্ট ফটোগ্রাফি</option>
                        <option value="general">সাধারণ ব্যবসায়িক গাইড</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-800 block">প্রস্তাবিত আইডিয়া:</label>
                      <div className="flex flex-wrap gap-1.5">
                        {['পাইকারি দরদাম নির্ধারণ', 'কাস্টমার আকর্ষণ', 'পণ্য প্যাকিং ও ডেলিভারি', 'ডিসকাউন্ট অফার'].map((idea, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setAiGenTopic(idea)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-purple-50 hover:text-purple-700 text-slate-700 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                          >
                            + {idea}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={aiGenLoading || !aiGenTopic.trim()}
                    onClick={handleGenerateAiTutorial}
                    className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all hover:scale-[1.01]"
                  >
                    {aiGenLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Gemini AI ভিডিও স্ক্রিপ্ট ও স্টেপ তৈরি করছে...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-yellow-300" />
                        <span>ভিডিও স্ক্রিপ্ট ও সচিত্র গাইড তৈরি করুন</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                /* Result Preview */
                <div className="space-y-5">
                  <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 bg-purple-200 text-purple-900 rounded-md text-[10px] font-bold">
                        {aiGenResult.categoryLabel}
                      </span>
                      <span className="text-xs text-purple-700 font-mono font-bold">
                        সময়কাল: {aiGenResult.duration}
                      </span>
                    </div>
                    <h4 className="text-sm font-black text-purple-950">{aiGenResult.title}</h4>
                    <p className="text-xs text-purple-900 leading-relaxed">{aiGenResult.description}</p>
                  </div>

                  {/* Video Script Section */}
                  {aiGenResult.videoScript && (
                    <div className="bg-slate-900 text-slate-100 p-4.5 rounded-2xl space-y-2 border border-slate-800">
                      <h5 className="text-xs font-black text-yellow-400 flex items-center gap-1.5">
                        <Film className="w-4 h-4" />
                        ভিডিওতে কি কথা বলতে হবে (Video Script):
                      </h5>
                      <div className="text-xs text-slate-200 leading-relaxed font-mono whitespace-pre-line bg-slate-950/80 p-3 rounded-xl max-h-48 overflow-y-auto">
                        {aiGenResult.videoScript}
                      </div>
                    </div>
                  )}

                  {/* Steps */}
                  {aiGenResult.steps && aiGenResult.steps.length > 0 && (
                    <div className="space-y-3">
                      <h5 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        স্টেপ-বাই-স্টেপ পদক্ষেপসমূহ:
                      </h5>
                      <div className="space-y-2.5">
                        {aiGenResult.steps.map((step: any, idx: number) => (
                          <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
                            <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-[10px] flex items-center justify-center font-mono font-bold">
                                {step.stepNumber || idx + 1}
                              </span>
                              {step.title}
                            </div>
                            <p className="text-xs text-slate-600 pl-7">{step.description}</p>
                            {step.keyTip && (
                              <div className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg ml-7 font-medium border border-amber-100">
                                💡 টিপস: {step.keyTip}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setAiGenResult(null)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                    >
                      ← পুনরায় তৈরি করুন
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveAiGeneratedTutorial}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-95 transition-all"
                    >
                      <Check className="w-4 h-4" />
                      টিউটোরিয়াল লাইব্রেরিতে সংরক্ষণ করুন
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
