import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Send, 
  Image as ImageIcon, 
  Mic, 
  Square,
  MessageSquare, 
  Phone, 
  X, 
  Check, 
  CheckCheck,
  Maximize2,
  Minimize2,
  ChevronLeft,
  Search,
  Trash2,
  Copy,
  MapPin,
  Smile,
  ExternalLink,
  ShoppingBag,
  Store,
  User as UserIcon,
  Play,
  Pause,
  AlertCircle,
  MoreVertical,
  Volume2
} from 'lucide-react';
import { ChatMessage, Business, User } from '../types';

interface ChatWindowProps {
  currentUser: User;
  activeRecipientPhone: string | null;
  recipientName: string;
  recipientBusiness?: Business;
  allBusinesses?: Business[];
  allUsers?: User[];
  chatMessages: ChatMessage[];
  onSendMessage: (
    text: string, 
    image?: string, 
    audio?: string, 
    audioDuration?: number,
    attachmentType?: 'image' | 'audio' | 'location' | 'product_inquiry',
    locationData?: { lat: number; lng: number; address: string },
    productData?: { id: string; name: string; price: number; image?: string; shopName?: string }
  ) => Promise<void>;
  onSelectConversation?: (phone: string, name: string, biz?: Business) => void;
  onClose: () => void;
  onRefreshDb?: () => Promise<void>;
}

export default function ChatWindow({
  currentUser,
  activeRecipientPhone,
  recipientName,
  recipientBusiness,
  allBusinesses = [],
  allUsers = [],
  chatMessages,
  onSendMessage,
  onSelectConversation,
  onClose,
  onRefreshDb,
}: ChatWindowProps) {
  // View states
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showInboxList, setShowInboxList] = useState(!activeRecipientPhone);
  const [searchMsgQuery, setSearchMsgQuery] = useState('');
  const [searchContactQuery, setSearchContactQuery] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Message inputs
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<{ id: string; name: string; price: number; image?: string; shopName?: string } | null>(null);

  // Audio Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<any>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Image Lightbox Modal
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Show Toast helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Quick Emoji preset
  const quickEmojis = ['😀', '❤️', '👍', '📦', '💰', '📍', '🔥', '✨', '🙏', '🎉', '🤝', '⚡'];

  // Quick Bengali smart reply chips
  const quickReplies = [
    '📦 পণ্যটি কি স্টকে আছে?',
    '🚚 হোম ডেলিভারি চার্জ কত?',
    '💰 কিছুটা ডিসকাউন্ট দেওয়া যাবে কি?',
    '📍 আপনাদের দোকানের বিস্তারিত ঠিকানা কোথায়?',
    '✅ আমি এখনই অর্ডার কনফার্ম করতে চাই।',
    '🙏 অনেক ধন্যবাদ!'
  ];

  // Auto-switch to chat view when active recipient is selected
  useEffect(() => {
    if (activeRecipientPhone) {
      setShowInboxList(false);
    }
  }, [activeRecipientPhone]);

  // Derive conversation list for current user
  const conversations = useMemo(() => {
    const userPhone = currentUser.phone;
    const convMap = new Map<string, {
      phone: string;
      name: string;
      business?: Business;
      lastMessage: ChatMessage;
      unreadCount: number;
    }>();

    chatMessages.forEach((msg) => {
      const isFromMe = msg.fromPhone === userPhone;
      const partnerPhone = isFromMe ? msg.toPhone : msg.fromPhone;
      if (!partnerPhone || partnerPhone === userPhone) return;

      const existing = convMap.get(partnerPhone);
      const isUnread = !isFromMe && !msg.isRead;

      if (!existing || new Date(msg.timestamp) > new Date(existing.lastMessage.timestamp)) {
        // Find business or user info
        const biz = allBusinesses.find(b => b.phone === partnerPhone || b.ownerPhone === partnerPhone);
        const usr = allUsers.find(u => u.phone === partnerPhone);
        const name = biz?.name || usr?.name || partnerPhone;

        const currentUnread = existing ? existing.unreadCount + (isUnread ? 1 : 0) : (isUnread ? 1 : 0);

        convMap.set(partnerPhone, {
          phone: partnerPhone,
          name,
          business: biz,
          lastMessage: msg,
          unreadCount: currentUnread
        });
      } else if (isUnread && existing) {
        existing.unreadCount += 1;
      }
    });

    const list = Array.from(convMap.values());
    list.sort((a, b) => new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime());
    return list;
  }, [chatMessages, currentUser.phone, allBusinesses, allUsers]);

  // Total unread messages across all chats
  const totalUnreadCount = useMemo(() => {
    return chatMessages.filter(m => m.toPhone === currentUser.phone && !m.isRead).length;
  }, [chatMessages, currentUser.phone]);

  // Active messages filter
  const activeMessages = useMemo(() => {
    if (!activeRecipientPhone) return [];
    return chatMessages.filter(
      (msg) =>
        (msg.fromPhone === currentUser.phone && msg.toPhone === activeRecipientPhone) ||
        (msg.fromPhone === activeRecipientPhone && msg.toPhone === currentUser.phone)
    );
  }, [chatMessages, currentUser.phone, activeRecipientPhone]);

  // Filter messages by in-chat search query
  const filteredMessages = useMemo(() => {
    if (!searchMsgQuery.trim()) return activeMessages;
    const q = searchMsgQuery.toLowerCase();
    return activeMessages.filter(m => 
      (m.text && m.text.toLowerCase().includes(q)) ||
      (m.productData?.name && m.productData.name.toLowerCase().includes(q)) ||
      (m.locationData?.address && m.locationData.address.toLowerCase().includes(q))
    );
  }, [activeMessages, searchMsgQuery]);

  // Filter conversations list by search
  const filteredConversations = useMemo(() => {
    if (!searchContactQuery.trim()) return conversations;
    const q = searchContactQuery.toLowerCase();
    return conversations.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.phone.includes(q) ||
      (c.business?.category && c.business.category.toLowerCase().includes(q))
    );
  }, [conversations, searchContactQuery]);

  // Auto scroll to bottom
  useEffect(() => {
    if (!isMinimized && !showInboxList) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [filteredMessages, isMinimized, showInboxList]);

  // Mark messages as read when viewing conversation
  useEffect(() => {
    if (activeRecipientPhone && !isMinimized && !showInboxList) {
      const hasUnread = activeMessages.some(m => m.fromPhone === activeRecipientPhone && !m.isRead);
      if (hasUnread) {
        fetch('/api/chats/mark-read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            myPhone: currentUser.phone,
            senderPhone: activeRecipientPhone
          })
        }).then(() => {
          if (onRefreshDb) onRefreshDb();
        }).catch(() => {});
      }
    }
  }, [activeRecipientPhone, activeMessages, currentUser.phone, isMinimized, showInboxList, onRefreshDb]);

  // Polling interval for live real-time sync
  useEffect(() => {
    if (isMinimized) return;
    const interval = setInterval(() => {
      if (onRefreshDb) {
        onRefreshDb();
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [isMinimized, onRefreshDb]);

  // Handle Photo Picker from Device
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('ছবির সাইজ সর্বোচ্চ ৫ মেগাবাইট হতে পারবে।');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      setSelectedPhoto(result);
      setSelectedLocation(null);
    };
    reader.readAsDataURL(file);
  };

  // Voice recording logic with MediaRecorder
  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        // Fallback simulation
        simulateVoiceRecord();
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          setRecordedAudioUrl(reader.result as string);
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordDuration(0);

      recordTimerRef.current = setInterval(() => {
        setRecordDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.warn('Microphone permission denied or not supported, using fallback voice:', err);
      simulateVoiceRecord();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordTimerRef.current) {
        clearInterval(recordTimerRef.current);
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordTimerRef.current) {
        clearInterval(recordTimerRef.current);
      }
      setRecordedAudioUrl(null);
      setRecordDuration(0);
    }
  };

  const simulateVoiceRecord = () => {
    setIsRecording(true);
    setRecordDuration(0);
    recordTimerRef.current = setInterval(() => {
      setRecordDuration(prev => {
        if (prev >= 3) {
          clearInterval(recordTimerRef.current);
          setIsRecording(false);
          setRecordedAudioUrl('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3');
          return 3;
        }
        return prev + 1;
      });
    }, 1000);
  };

  // Location sharing
  const handleShareLocation = () => {
    if (currentUser.location?.address) {
      setSelectedLocation({
        lat: currentUser.location.lat || 23.75,
        lng: currentUser.location.lng || 90.38,
        address: currentUser.location.address
      });
      showToast('📍 লোকেশন সংযুক্ত হয়েছে');
      return;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setSelectedLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            address: `অক্ষাংশ: ${position.coords.latitude.toFixed(4)}, দ্রাঘিমাংশ: ${position.coords.longitude.toFixed(4)}`
          });
          showToast('📍 জিপিএস লোকেশন সংযুক্ত হয়েছে');
        },
        () => {
          setSelectedLocation({
            lat: 23.734,
            lng: 90.378,
            address: 'ধানমন্ডি লেক সংলগ্ন, ঢাকা'
          });
          showToast('📍 ডিফল্ট লোকেশন সংযুক্ত হয়েছে');
        }
      );
    } else {
      setSelectedLocation({
        lat: 23.734,
        lng: 90.378,
        address: 'ঢাকা, বাংলাদেশ'
      });
    }
  };

  // Submit message
  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeRecipientPhone) return;
    if ((!text.trim() && !selectedPhoto && !recordedAudioUrl && !selectedLocation && !selectedProduct) || loading) return;

    setLoading(true);
    const textToSend = text.trim();
    const photoToSend = selectedPhoto || undefined;
    const audioToSend = recordedAudioUrl || undefined;
    const locationToSend = selectedLocation || undefined;
    const productToSend = selectedProduct || undefined;
    const audioDur = recordDuration > 0 ? recordDuration : 3;

    // Reset inputs
    setText('');
    setSelectedPhoto(null);
    setRecordedAudioUrl(null);
    setSelectedLocation(null);
    setSelectedProduct(null);
    setRecordDuration(0);
    setShowEmojiPicker(false);

    try {
      let attachmentType: any = undefined;
      if (photoToSend) attachmentType = 'image';
      else if (audioToSend) attachmentType = 'audio';
      else if (locationToSend) attachmentType = 'location';
      else if (productToSend) attachmentType = 'product_inquiry';

      const fallbackText = textToSend || 
        (photoToSend ? '📷 ছবি সংযুক্ত করা হয়েছে' : 
         audioToSend ? '🎙️ ভয়েস মেসেজ' : 
         locationToSend ? '📍 আমার লোকেশন' : 
         productToSend ? `🛍️ ${productToSend.name} সম্পর্কে জানতে চাই` : 'মেসেজ');

      await onSendMessage(
        fallbackText, 
        photoToSend, 
        audioToSend, 
        audioDur,
        attachmentType,
        locationToSend,
        productToSend
      );

      if (onRefreshDb) {
        await onRefreshDb();
      }
    } catch (err) {
      console.error(err);
      showToast('মেসেজ পাঠাতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  // Copy message to clipboard
  const handleCopyMessage = (msgText: string) => {
    navigator.clipboard.writeText(msgText);
    showToast('📋 মেসেজ কপি করা হয়েছে!');
  };

  // Delete message
  const handleDeleteMessage = async (msgId: string) => {
    if (!confirm('আপনি কি এই মেসেজটি মুছে ফেলতে চান?')) return;
    try {
      const res = await fetch(`/api/chats/message/${msgId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('🗑️ মেসেজ মুছে ফেলা হয়েছে');
        if (onRefreshDb) onRefreshDb();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Clear conversation
  const handleClearConversation = async () => {
    if (!activeRecipientPhone) return;
    if (!confirm(`আপনি কি "${recipientName}"-এর সাথে সমস্ত কথোপকথন মুছে ফেলতে চান?`)) return;
    try {
      const res = await fetch('/api/chats/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user1Phone: currentUser.phone,
          user2Phone: activeRecipientPhone
        })
      });
      if (res.ok) {
        showToast('সকল মেসেজ মুছে ফেলা হয়েছে');
        setShowActionsMenu(false);
        if (onRefreshDb) onRefreshDb();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Play/pause voice notes
  const handleToggleAudioPlay = (msgId: string, audioUrl?: string) => {
    if (!audioUrl) return;
    if (playingAudioId === msgId) {
      audioElementRef.current?.pause();
      setPlayingAudioId(null);
    } else {
      if (audioElementRef.current) {
        audioElementRef.current.pause();
      }
      const audio = new Audio(audioUrl);
      audioElementRef.current = audio;
      setPlayingAudioId(msgId);
      audio.play();
      audio.onended = () => setPlayingAudioId(null);
    }
  };

  // Format Time
  const formatMsgTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // Format Date for Inbox list
  const formatInboxDate = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      if (isToday) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return date.toLocaleDateString('bn-BD', { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  // If Minimized: Show stylish floating chat pill
  if (isMinimized) {
    return (
      <div 
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-20 sm:bottom-6 right-4 z-50 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white px-4 py-3 rounded-full shadow-2xl hover:shadow-indigo-500/40 flex items-center gap-3 cursor-pointer transition-all transform hover:scale-105 active:scale-95 border-2 border-white/20 animate-bounce-subtle"
      >
        <div className="relative">
          <MessageSquare className="w-5 h-5" />
          {totalUnreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
              {totalUnreadCount}
            </span>
          )}
        </div>
        <div className="text-left pr-1">
          <h4 className="text-xs font-black leading-tight max-w-[140px] truncate">
            {activeRecipientPhone ? recipientName : 'লাইভ মেসেজ ইনবক্স'}
          </h4>
          <span className="text-[9px] text-blue-100 font-bold block">
            {totalUnreadCount > 0 ? `${totalUnreadCount}টি নতুন মেসেজ` : 'ক্লিক করে চ্যাট ওপেন করুন'}
          </span>
        </div>
        <Maximize2 className="w-3.5 h-3.5 text-blue-200 ml-1" />
      </div>
    );
  }

  return (
    <>
      {/* Toast popup */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] bg-slate-900/90 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg backdrop-blur-sm border border-slate-700 animate-fade-in flex items-center gap-2">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Image Lightbox Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-[10000] bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh] w-full flex flex-col items-center">
            <button 
              onClick={() => setPreviewImage(null)}
              className="absolute -top-12 right-0 p-2 bg-white/20 hover:bg-white/30 text-white rounded-full transition-all"
            >
              <X className="w-6 h-6" />
            </button>
            <img 
              src={previewImage} 
              alt="Enlarged preview" 
              className="max-h-[80vh] max-w-full rounded-2xl object-contain shadow-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Main Chat Container */}
      <div className={`fixed z-50 bg-white shadow-2xl border border-slate-200/80 flex flex-col overflow-hidden transition-all duration-300 ${
        isFullscreen 
          ? 'inset-0 w-full h-[100dvh] rounded-none z-[9999]' 
          : 'bottom-0 sm:bottom-4 right-0 sm:right-4 w-full sm:w-[420px] md:w-[480px] h-[100dvh] sm:h-[620px] sm:max-h-[85vh] sm:rounded-3xl'
      }`}>
        
        {/* Hidden File Input */}
        <input 
          type="file" 
          ref={fileInputRef} 
          accept="image/*" 
          onChange={handlePhotoSelect} 
          className="hidden" 
        />

        {/* Top Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white px-3 sm:px-4 py-3 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Back to Inbox Button */}
            {!showInboxList && conversations.length > 0 && (
              <button 
                type="button"
                onClick={() => setShowInboxList(true)}
                className="p-1.5 -ml-1 hover:bg-white/15 rounded-xl transition-all flex items-center gap-1 text-xs font-bold"
                title="ইনবক্স দেখুন"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline text-[10px]">ইনবক্স</span>
              </button>
            )}

            {showInboxList ? (
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-white/20 flex items-center justify-center font-black text-sm">
                  💬
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-tight">মেসেজ ও লাইভ চ্যাট</h3>
                  <span className="text-[10px] text-blue-100 font-bold block">
                    {conversations.length}টি সক্রিয় বার্তা সংযোগ
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative shrink-0">
                  {recipientBusiness?.logo ? (
                    <img 
                      src={recipientBusiness.logo} 
                      alt={recipientName} 
                      className="w-9 h-9 rounded-2xl border-2 border-white/30 object-cover shadow-sm bg-white"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center font-black text-xs text-white">
                      {recipientName ? recipientName.substring(0, 2) : '??'}
                    </div>
                  )}
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-indigo-700 rounded-full animate-pulse"></span>
                </div>

                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-black truncate max-w-[160px] sm:max-w-[200px]">
                    {recipientName || 'ব্যবহারকারী'}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[10px] text-blue-100 font-semibold">
                    <span className="truncate">
                      {recipientBusiness ? `🏪 ${recipientBusiness.category}` : '👤 সরাসরি গ্রাহক চ্যাট'}
                    </span>
                    <span className="inline-block w-1 h-1 bg-white/60 rounded-full"></span>
                    <span className="text-emerald-300 font-bold">অনলাইন</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Header Action Icons */}
          <div className="flex items-center gap-1 shrink-0">
            {!showInboxList && activeRecipientPhone && (
              <>
                <a 
                  href={`tel:${activeRecipientPhone}`}
                  className="p-2 hover:bg-white/15 rounded-xl transition-all"
                  title="সরাসরি কল করুন"
                >
                  <Phone className="w-4 h-4" />
                </a>

                <button 
                  type="button"
                  onClick={() => setSearchMsgQuery(prev => prev ? '' : ' ')}
                  className={`p-2 rounded-xl transition-all ${searchMsgQuery ? 'bg-white/30 text-white' : 'hover:bg-white/15'}`}
                  title="মেসেজ খুঁজুন"
                >
                  <Search className="w-4 h-4" />
                </button>

                <div className="relative">
                  <button 
                    type="button"
                    onClick={() => setShowActionsMenu(!showActionsMenu)}
                    className="p-2 hover:bg-white/15 rounded-xl transition-all"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {showActionsMenu && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white text-slate-800 rounded-2xl shadow-xl border border-slate-100 py-1.5 z-50 text-xs font-bold animate-scale-up">
                      <button
                        type="button"
                        onClick={handleClearConversation}
                        className="w-full text-left px-3 py-2 hover:bg-rose-50 text-rose-600 flex items-center gap-2 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>চ্যাট ক্লিয়ার করুন</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowActionsMenu(false);
                          setShowInboxList(true);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2 transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>সকল কথোপকথন</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Maximize / Fullscreen Toggle */}
            <button 
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="hidden sm:inline-flex p-2 hover:bg-white/15 rounded-xl transition-all"
              title={isFullscreen ? "ছোট করুন" : "বড় করুন"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Minimize to Pill */}
            <button 
              type="button"
              onClick={() => setIsMinimized(true)}
              className="p-2 hover:bg-white/15 rounded-xl transition-all"
              title="মিনিমাইজ করুন"
            >
              <span className="text-sm font-black">_</span>
            </button>

            {/* Close button */}
            <button 
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-rose-500/80 rounded-xl transition-all"
              title="বন্ধ করুন"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body Area: Either Conversation List OR Active Conversation */}
        {showInboxList ? (
          /* ========================================================= */
          /* 📥 CONVERSATIONS INBOX LIST VIEW                          */
          /* ========================================================= */
          <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
            {/* Search Input for Contacts */}
            <div className="p-3 bg-white border-b border-slate-100">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  value={searchContactQuery}
                  onChange={(e) => setSearchContactQuery(e.target.value)}
                  placeholder="দোকান বা গ্রাহকের নাম দিয়ে খুঁজুন..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-100/80 border border-slate-200/80 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400"
                />
                {searchContactQuery && (
                  <button 
                    onClick={() => setSearchContactQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Conversations List Scrollable */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-slate-400 space-y-3">
                  <div className="w-14 h-14 bg-indigo-50 text-indigo-500 rounded-3xl flex items-center justify-center mx-auto text-2xl shadow-inner">
                    💬
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-700">কোনো চ্যাট মেসেজ নেই</h4>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-[240px] mx-auto leading-relaxed">
                      যেকোনো দোকানের পেজে গিয়ে সরাসরি "লাইভ চ্যাট" বাটনে ক্লিক করে কথা শুরু করতে পারেন।
                    </p>
                  </div>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const isSelected = activeRecipientPhone === conv.phone;
                  const isBiz = !!conv.business;
                  const hasUnread = conv.unreadCount > 0;

                  return (
                    <div
                      key={conv.phone}
                      onClick={() => {
                        if (onSelectConversation) {
                          onSelectConversation(conv.phone, conv.name, conv.business);
                        }
                        setShowInboxList(false);
                      }}
                      className={`p-3.5 flex items-center gap-3 transition-all cursor-pointer hover:bg-indigo-50/50 ${
                        isSelected ? 'bg-indigo-50/80 border-l-4 border-indigo-600' : 'bg-white'
                      }`}
                    >
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        {conv.business?.logo ? (
                          <img 
                            src={conv.business.logo} 
                            alt={conv.name} 
                            className="w-11 h-11 rounded-2xl object-cover border border-slate-200 shadow-sm"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500 to-blue-600 text-white flex items-center justify-center font-black text-sm shadow-sm">
                            {conv.name.substring(0, 2)}
                          </div>
                        )}
                        {hasUnread && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 border-2 border-white rounded-full"></span>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <h4 className={`text-xs truncate ${hasUnread ? 'font-black text-slate-900' : 'font-bold text-slate-800'}`}>
                            {conv.name}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-bold shrink-0">
                            {formatInboxDate(conv.lastMessage.timestamp)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-[11px] truncate max-w-[200px] ${hasUnread ? 'font-black text-slate-900' : 'text-slate-500 font-medium'}`}>
                            {conv.lastMessage.fromPhone === currentUser.phone && 'আপনি: '}
                            {conv.lastMessage.image && '📷 ছবি '}
                            {conv.lastMessage.audio && '🎙️ ভয়েস নোট '}
                            {conv.lastMessage.locationData && '📍 লোকেশন '}
                            {conv.lastMessage.productData && `🛍️ ${conv.lastMessage.productData.name} `}
                            {conv.lastMessage.text}
                          </p>

                          {hasUnread && (
                            <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shrink-0">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[9px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold">
                            {isBiz ? `🏪 ${conv.business?.category}` : '👤 সাধারণ চ্যাট'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /* 💬 ACTIVE CHAT MESSAGES THREAD VIEW                       */
          /* ========================================================= */
          <div className="flex-1 flex flex-col bg-slate-50/70 overflow-hidden relative">
            
            {/* In-chat Search Bar Overlay */}
            {searchMsgQuery !== '' && (
              <div className="bg-amber-50 border-b border-amber-200 p-2 flex items-center gap-2 shrink-0 animate-slide-down">
                <Search className="w-4 h-4 text-amber-600 shrink-0" />
                <input 
                  type="text" 
                  autoFocus
                  value={searchMsgQuery.trim()}
                  onChange={(e) => setSearchMsgQuery(e.target.value)}
                  placeholder="মেসেজের ভেতরের শব্দ খুঁজুন..."
                  className="flex-1 bg-transparent border-none text-xs font-bold text-slate-800 focus:outline-none placeholder:text-amber-700/60"
                />
                <span className="text-[10px] text-amber-800 font-bold shrink-0">
                  {filteredMessages.length}টি ম্যাচ
                </span>
                <button 
                  onClick={() => setSearchMsgQuery('')}
                  className="p-1 hover:bg-amber-200/50 rounded-lg text-amber-800"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Product context banner if chat is opened with a product */}
            {recipientBusiness && recipientBusiness.products && recipientBusiness.products.length > 0 && !selectedProduct && (
              <div className="bg-indigo-50/90 border-b border-indigo-100 px-3 py-1.5 flex items-center justify-between text-[11px] shrink-0">
                <div className="flex items-center gap-1.5 text-indigo-900 font-bold truncate">
                  <ShoppingBag className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span className="truncate">দোকানের শীর্ষ পণ্য: {recipientBusiness.products[0].name} (৳{recipientBusiness.products[0].price})</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const p = recipientBusiness.products[0];
                    setSelectedProduct({
                      id: p.id,
                      name: p.name,
                      price: p.price,
                      image: p.image,
                      shopName: recipientBusiness.name
                    });
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black px-2 py-0.5 rounded-lg shrink-0 transition-colors"
                >
                  ইনকোয়ারি করুন
                </button>
              </div>
            )}

            {/* Scrollable Messages Body */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
              {filteredMessages.length === 0 ? (
                <div className="text-center py-10 text-slate-400 space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center mx-auto text-xl">
                    👋
                  </div>
                  <h4 className="text-xs font-black text-slate-700">কথোপকথন শুরু করুন!</h4>
                  <p className="text-[11px] text-slate-400 max-w-[260px] mx-auto leading-relaxed">
                    সরাসরি টেক্সট, ফটো, ভয়েস মেসেজ পাঠিয়ে দাম, স্টক ও হোম ডেলিভারি কনফার্ম করুন।
                  </p>
                </div>
              ) : (
                filteredMessages.map((msg, idx) => {
                  const isMe = msg.fromPhone === currentUser.phone;
                  const isFirstInGroup = idx === 0 || filteredMessages[idx - 1].fromPhone !== msg.fromPhone;

                  return (
                    <div 
                      key={msg.id} 
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group`}
                    >
                      {/* Message Bubble Card */}
                      <div className={`relative max-w-[85%] sm:max-w-[78%] rounded-2xl p-3 text-xs shadow-sm transition-all ${
                        isMe 
                          ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-tr-sm' 
                          : 'bg-white text-slate-900 border border-slate-200/80 rounded-tl-sm'
                      }`}>
                        
                        {/* 1. Product Inquiry Card if attached */}
                        {msg.productData && (
                          <div className={`rounded-xl p-2 mb-2 flex items-center gap-2.5 border ${
                            isMe ? 'bg-white/10 border-white/20' : 'bg-indigo-50/70 border-indigo-100'
                          }`}>
                            {msg.productData.image ? (
                              <img 
                                src={msg.productData.image} 
                                alt={msg.productData.name} 
                                className="w-12 h-12 rounded-lg object-cover border border-white/30 shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-indigo-500/20 flex items-center justify-center shrink-0 text-lg">
                                🛍️
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <span className={`text-[9px] font-bold block uppercase tracking-wider ${isMe ? 'text-blue-100' : 'text-indigo-600'}`}>
                                পণ্য সম্পর্কিত জিজ্ঞাসা
                              </span>
                              <h5 className="font-black text-xs truncate">{msg.productData.name}</h5>
                              <span className="font-extrabold text-[11px] text-amber-300">
                                মূল্য: ৳{msg.productData.price}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* 2. Image Attachment */}
                        {msg.image && (
                          <div className="mb-2 relative overflow-hidden rounded-xl group/img">
                            <img 
                              src={msg.image} 
                              alt="চ্যাট ছবি" 
                              onClick={() => setPreviewImage(msg.image || null)}
                              className="rounded-xl max-h-48 w-full object-cover cursor-pointer hover:opacity-95 transition-all"
                            />
                            <button
                              type="button"
                              onClick={() => setPreviewImage(msg.image || null)}
                              className="absolute bottom-2 right-2 bg-black/60 hover:bg-black/80 text-white p-1 rounded-lg text-[9px] font-bold flex items-center gap-1 backdrop-blur-sm"
                            >
                              <Maximize2 className="w-3 h-3" />
                              <span>বড় করুন</span>
                            </button>
                          </div>
                        )}

                        {/* 3. Audio Voice Note Bubble */}
                        {msg.audio && (
                          <div className={`rounded-xl p-2.5 mb-2 flex items-center gap-2.5 border ${
                            isMe ? 'bg-white/10 border-white/20' : 'bg-slate-100 border-slate-200'
                          }`}>
                            <button
                              type="button"
                              onClick={() => handleToggleAudioPlay(msg.id, msg.audio)}
                              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 ${
                                isMe ? 'bg-white text-indigo-600' : 'bg-indigo-600 text-white'
                              }`}
                            >
                              {playingAudioId === msg.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                            </button>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between text-[10px] font-bold mb-1">
                                <span className="flex items-center gap-1">
                                  <Volume2 className="w-3 h-3" />
                                  <span>ভয়েস মেসেজ</span>
                                </span>
                                <span>{msg.audioDuration ? `00:0${msg.audioDuration}` : '00:03'}</span>
                              </div>
                              {/* Fake animated audio waveform */}
                              <div className="flex items-center gap-0.5 h-3">
                                {[40, 70, 30, 90, 50, 80, 60, 100, 45, 75, 35, 85].map((h, i) => (
                                  <span 
                                    key={i} 
                                    style={{ height: `${h}%` }}
                                    className={`w-1 rounded-full transition-all ${
                                      playingAudioId === msg.id 
                                        ? 'bg-amber-400 animate-pulse' 
                                        : (isMe ? 'bg-white/60' : 'bg-indigo-400')
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 4. Location Pin Attachment Card */}
                        {msg.locationData && (
                          <div className={`rounded-xl p-2.5 mb-2 border space-y-1.5 ${
                            isMe ? 'bg-white/10 border-white/20' : 'bg-emerald-50/80 border-emerald-200'
                          }`}>
                            <div className="flex items-center gap-1.5 font-black text-[11px] text-emerald-300">
                              <MapPin className="w-3.5 h-3.5 shrink-0" />
                              <span>শেয়ারকৃত লোকেশন</span>
                            </div>
                            <p className="text-[11px] font-bold leading-tight">
                              {msg.locationData.address}
                            </p>
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${msg.locationData.lat},${msg.locationData.lng}`}
                              target="_blank"
                              rel="noreferrer"
                              className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md ${
                                isMe ? 'bg-white text-indigo-700' : 'bg-emerald-600 text-white'
                              }`}
                            >
                              <span>গুগল ম্যাপে দেখুন</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        )}

                        {/* 5. Text Message Content */}
                        {msg.text && (
                          <p className="leading-relaxed whitespace-pre-wrap break-words font-medium">
                            {msg.text}
                          </p>
                        )}

                        {/* Message Metadata (Timestamp & Read ticks) */}
                        <div className={`flex items-center justify-end gap-1 mt-1 text-[9px] font-bold ${
                          isMe ? 'text-blue-100' : 'text-slate-400'
                        }`}>
                          <span>{formatMsgTime(msg.timestamp)}</span>
                          {isMe && (
                            msg.isRead ? (
                              <CheckCheck className="w-3.5 h-3.5 text-emerald-300 stroke-[2.5]" title="পড়া হয়েছে" />
                            ) : (
                              <Check className="w-3.5 h-3.5 text-blue-200" title="পাঠানো হয়েছে" />
                            )
                          )}
                        </div>
                      </div>

                      {/* Hover action bar for quick copying or deleting message */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 mt-0.5 px-1 text-[10px] text-slate-400">
                        <button
                          type="button"
                          onClick={() => handleCopyMessage(msg.text || '')}
                          className="hover:text-indigo-600 p-0.5"
                          title="কপি করুন"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        {isMe && (
                          <button
                            type="button"
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="hover:text-rose-600 p-0.5"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Bengali Replies Chips Carousel */}
            <div className="px-3 py-1.5 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
              <span className="text-[10px] font-black text-indigo-600 flex items-center gap-0.5 shrink-0">
                <span>⚡</span>
              </span>
              {quickReplies.map((reply, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setText(reply)}
                  className="shrink-0 text-[10px] font-bold bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 px-2.5 py-1 rounded-full transition-colors border border-slate-200/60 whitespace-nowrap active:scale-95"
                >
                  {reply}
                </button>
              ))}
            </div>

            {/* Selected Attachment Previews Bar */}
            {(selectedPhoto || recordedAudioUrl || selectedLocation || selectedProduct) && (
              <div className="bg-indigo-50/90 p-2.5 border-t border-indigo-100 flex items-center justify-between text-xs text-indigo-900 shrink-0 animate-slide-up">
                <div className="flex items-center gap-2 min-w-0">
                  {selectedPhoto && (
                    <div className="flex items-center gap-2">
                      <img src={selectedPhoto} alt="Selected" className="w-8 h-8 rounded-lg object-cover border border-indigo-300 shadow-sm" />
                      <span className="font-bold text-[11px] truncate">📷 ছবি সংযুক্ত হয়েছে</span>
                    </div>
                  )}

                  {recordedAudioUrl && (
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-bold">
                        🎙️
                      </div>
                      <span className="font-bold text-[11px] text-emerald-800">ভয়েস মেসেজ প্রস্তুত ({recordDuration}s)</span>
                    </div>
                  )}

                  {selectedLocation && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-emerald-600" />
                      <span className="font-bold text-[11px] truncate">{selectedLocation.address}</span>
                    </div>
                  )}

                  {selectedProduct && (
                    <div className="flex items-center gap-1.5">
                      <ShoppingBag className="w-4 h-4 text-indigo-600" />
                      <span className="font-bold text-[11px] truncate">{selectedProduct.name}</span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedPhoto(null);
                    setRecordedAudioUrl(null);
                    setSelectedLocation(null);
                    setSelectedProduct(null);
                  }}
                  className="p-1 hover:bg-rose-100 text-rose-600 rounded-lg text-[10px] font-black shrink-0 transition-colors"
                >
                  বাতিল
                </button>
              </div>
            )}

            {/* Voice Recording Live Animation Bar */}
            {isRecording && (
              <div className="bg-rose-50 p-3 border-t border-rose-200 flex items-center justify-between text-rose-800 shrink-0 animate-pulse">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-600 animate-ping"></span>
                  <span className="text-xs font-black">রেকর্ডিং হচ্ছে... 00:0{recordDuration}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={cancelRecording}
                    className="px-2.5 py-1 text-xs font-bold text-rose-600 hover:bg-rose-100 rounded-lg"
                  >
                    বাতিল
                  </button>
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="px-3 py-1 text-xs font-black bg-rose-600 text-white rounded-lg flex items-center gap-1 shadow-sm"
                  >
                    <Square className="w-3 h-3 fill-current" />
                    <span>সম্পন্ন</span>
                  </button>
                </div>
              </div>
            )}

            {/* Emoji Quick Picker Row */}
            {showEmojiPicker && (
              <div className="bg-white border-t border-slate-100 p-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 shadow-inner">
                {quickEmojis.map((emoji, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setText(prev => prev + emoji);
                      inputRef.current?.focus();
                    }}
                    className="p-1.5 hover:bg-slate-100 rounded-lg text-base transition-transform active:scale-125"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {/* Main Input Control Panel */}
            <form onSubmit={handleSend} className="p-2.5 bg-white border-t border-slate-100 flex items-center gap-1.5 shrink-0">
              
              {/* Photo Upload from device */}
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer"
                title="ডিভাইস থেকে ছবি আপলোড করুন"
              >
                <ImageIcon className="w-4 h-4" />
              </button>

              {/* Voice Record Button */}
              <button 
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  isRecording 
                    ? 'bg-rose-500 text-white animate-bounce' 
                    : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'
                }`}
                title="ভয়েস নোট রেকর্ড করুন"
              >
                <Mic className="w-4 h-4" />
              </button>

              {/* Location Share Button */}
              <button 
                type="button"
                onClick={handleShareLocation}
                className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all cursor-pointer"
                title="আমার লোকেশন শেয়ার করুন"
              >
                <MapPin className="w-4 h-4" />
              </button>

              {/* Emoji Toggle */}
              <button 
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  showEmojiPicker ? 'bg-amber-100 text-amber-600' : 'text-slate-500 hover:text-amber-500 hover:bg-amber-50'
                }`}
                title="ইমোজি"
              >
                <Smile className="w-4 h-4" />
              </button>

              {/* Text Input */}
              <input
                ref={inputRef}
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="মেসেজ লিখুন..."
                disabled={loading || isRecording}
                className="flex-1 text-xs bg-slate-100/90 border border-slate-200/80 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white text-slate-900 font-bold placeholder:text-slate-400 transition-all disabled:opacity-50"
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={(!text.trim() && !selectedPhoto && !recordedAudioUrl && !selectedLocation && !selectedProduct) || loading || isRecording}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white p-2.5 rounded-xl transition-all disabled:opacity-40 cursor-pointer shrink-0 shadow-md shadow-indigo-200 active:scale-95 flex items-center justify-center"
                title="পাঠান"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </>
  );
}
