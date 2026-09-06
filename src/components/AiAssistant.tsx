import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Bot, User, MapPin, Search, ArrowRight, Mic, MicOff } from 'lucide-react';
import { Business, Location } from '../types';

import { Language } from '../translations';

interface AiAssistantProps {
  businesses: Business[];
  userLocation: Location;
  onSelectBusiness: (biz: Business) => void;
  setActiveTab: (tab: string) => void;
  language?: Language;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

export default function AiAssistant({
  businesses,
  userLocation,
  onSelectBusiness,
  setActiveTab,
  language = 'bn'
}: AiAssistantProps) {
  const [prompt, setPrompt] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [recognitionError, setRecognitionError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = language === 'en' ? 'en-US' : 'bn-BD';

      rec.onstart = () => {
        setIsListening(true);
        setRecognitionError(null);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        if (event.error === 'not-allowed') {
          setRecognitionError('not-allowed');
        } else if (event.error === 'no-speech') {
          setRecognitionError('no-speech');
        } else {
          setRecognitionError('error');
        }
        setIsListening(false);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setPrompt(prev => prev ? prev + ' ' + transcript : transcript);
        }
      };

      recognitionRef.current = rec;
    }
  }, []);

  const toggleListening = () => {
    if (!isSupported) {
      setRecognitionError('not-supported');
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setRecognitionError(null);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (err) {
          console.error('Failed to start speech recognition:', err);
          setRecognitionError('error');
        }
      }
    }
  };

  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'আসসালামু আলাইকুম! আমি **Rest Bazar AI সহকারী**। ধানমন্ডি ও আশেপাশের এলাকার সকল দোকান, ফার্মেসি, ইলেকট্রিশিয়ান, প্লাম্বার বা গৃহশিক্ষকের খোঁজখবর দিতে আমি আপনাকে সাহায্য করব। \n\nআপনি কী খুঁজছেন বলুন? যেমন: "আমার বাসার পানির লাইনে সমস্যা, প্লাম্বার পাবো?"',
      timestamp: new Date()
    }
  ]);

  const suggestions = [
    "ধানমন্ডিতে ভালো ফার্মেসী কোথায় আছে?",
    "আমার বাসায় একজন ইলেকট্রিশিয়ান লাগবে",
    "সবচেয়ে বেশি রিভিউ পাওয়া মুদি দোকান কোনটি?",
    "জরুরী অ্যাম্বুলেন্স বা অক্সিজেন সার্ভিস আছে?"
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSuggestionClick = (text: string) => {
    setPrompt(text);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    const userMessageText = prompt;
    setPrompt('');
    setMessages(prev => [...prev, {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: userMessageText,
      timestamp: new Date()
    }]);

    setLoading(true);

    try {
      const response = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userMessageText,
          userLocation: userLocation
        })
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();
      setMessages(prev => [...prev, {
        id: `msg-ai-${Date.now()}`,
        sender: 'assistant',
        text: data.reply || 'দুঃখিত, কোনো উত্তর পাওয়া যায়নি।',
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('AI error:', error);
      // Beautiful locale friendly fallback
      setMessages(prev => [...prev, {
        id: `msg-ai-error-${Date.now()}`,
        sender: 'assistant',
        text: 'দুঃখিত, একটু কারিগরি সমস্যা হচ্ছে। আপনি আমাদের সার্চবার ব্যবহার করে অথবা হোমপেজে সরাসরি ক্যাটাগরি ফিল্টার করে দোকানসমূহ দেখতে পারেন।',
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="rb-local-ai-assistant" className="h-[600px] bg-white border border-slate-100 rounded-3xl shadow-xl flex flex-col overflow-hidden relative">
      {/* Assistant Header */}
      <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-100">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
              Rest Bazar AI সহকারী (AI Assistant)
              <span className="bg-indigo-100 text-indigo-700 text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider">GEMINI</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              আপনার প্রশ্নের তাৎক্ষণিক ও সঠিক সেবা পরামর্শ পেতে সাহায্য করবে
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-100">
          <MapPin className="w-3.5 h-3.5 text-indigo-500" />
          <span>{userLocation.district}</span>
        </div>
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 max-w-[85%] ${
              msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
            }`}
          >
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs shrink-0 ${
              msg.sender === 'user' 
                ? 'bg-indigo-150 text-indigo-700 bg-indigo-50 font-bold' 
                : 'bg-indigo-600 text-white font-bold'
            }`}>
              {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            {/* Bubble */}
            <div className="space-y-1">
              <div className={`p-3 rounded-2xl text-xs leading-relaxed whitespace-pre-line ${
                msg.sender === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-none font-medium'
                  : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none shadow-sm'
              }`}>
                {msg.text}
              </div>
              <span className={`text-[9px] block text-slate-400 ${msg.sender === 'user' ? 'text-right' : ''}`}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 max-w-[80%]">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs shrink-0">
              <Bot className="w-4 h-4 animate-pulse" />
            </div>
            <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm text-xs text-slate-500 flex items-center gap-2">
              <span className="flex space-x-1">
                <span className="h-1.5 w-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="h-1.5 w-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="h-1.5 w-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </span>
              <span>এআই সহকারী দোকান এবং সার্ভিস খুঁজছে...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestive prompts pills */}
      {messages.length === 1 && (
        <div className="p-3 bg-slate-50 border-t border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wide">পরামর্শ প্রশ্নসমূহ (Suggested Questions):</p>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSuggestionClick(s)}
                className="text-[11px] bg-white hover:bg-indigo-50 border border-slate-200 text-indigo-700 font-medium px-2.5 py-1 rounded-lg transition-colors cursor-pointer text-left"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Voice-to-Text Error Notification */}
      {recognitionError && (
        <div className="mx-3 my-1 p-2 bg-rose-50 border border-rose-100 text-rose-600 text-[11px] rounded-lg flex justify-between items-center transition-all animate-fade-in">
          <span>
            {recognitionError === 'not-allowed' && 'মাইক্রোফোন ব্যবহারের অনুমতি দিন (Please allow microphone access)।'}
            {recognitionError === 'no-speech' && 'কোনো কথা শোনা যায়নি। আবার চেষ্টা করুন (No speech detected)।'}
            {recognitionError === 'not-supported' && 'আপনার ব্রাউজারটি ভয়েস ইনপুট সমর্থন করে না (Voice input not supported in this browser)।'}
            {recognitionError === 'error' && 'ভয়েস ইনপুট ব্যবহারে সমস্যা হয়েছে (Speech input error)।'}
          </span>
          <button 
            type="button"
            onClick={() => setRecognitionError(null)} 
            className="text-rose-400 hover:text-rose-600 font-bold ml-2 text-xs"
          >
            ×
          </button>
        </div>
      )}

      {/* Chat Input form */}
      <form onSubmit={handleSend} className="p-3 border-t border-slate-100 flex gap-2 bg-white">
        <div className="relative flex-1 flex items-center">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={isListening ? "বলুন, আমি শুনছি... (Speak now...)" : "বাংলায় আপনার প্রশ্ন লিখুন... (যেমন: তেলের দোকান বা এসি মেকানিক)"}
            disabled={loading}
            className={`w-full bg-slate-50 border border-slate-200 text-xs rounded-xl pl-4 pr-10 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 text-slate-900 ${
              isListening ? 'border-rose-400 bg-rose-50/10 placeholder-rose-400 focus:ring-rose-500' : ''
            }`}
          />
          <button
            type="button"
            onClick={toggleListening}
            title={isListening ? "ভয়েস ইনপুট বন্ধ করুন" : "ভয়েসের মাধ্যমে কথা বলুন (Voice Search)"}
            className={`absolute right-2.5 p-1.5 rounded-lg transition-all flex items-center justify-center cursor-pointer ${
              isListening 
                ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-200' 
                : 'text-slate-400 hover:bg-slate-100 hover:text-indigo-600'
            }`}
          >
            {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
          </button>
        </div>
        <button
          type="submit"
          disabled={!prompt.trim() || loading || isListening}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl transition-all font-semibold text-xs flex items-center gap-1.5 disabled:opacity-50 disabled:hover:bg-indigo-600 shrink-0 cursor-pointer shadow-md shadow-indigo-100"
        >
          <Send className="w-3.5 h-3.5" />
          <span>পাঠান</span>
        </button>
      </form>
    </div>
  );
}
