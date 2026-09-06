import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Truck, ShoppingBag, Zap, Droplet, GraduationCap, Scissors, Search } from 'lucide-react';
import { Business, Location } from '../types';

interface MapWidgetProps {
  businesses: Business[];
  selectedBusiness?: Business;
  userLocation: Location;
  onSelectBusiness: (biz: Business) => void;
  onUpdateUserLocation?: (loc: Location) => void;
}

export default function MapWidget({
  businesses,
  selectedBusiness,
  userLocation,
  onSelectBusiness,
  onUpdateUserLocation,
}: MapWidgetProps) {
  const [hoveredBiz, setHoveredBiz] = useState<Business | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeLegendFilter, setActiveLegendFilter] = useState<'grocery' | 'pharmacy' | 'services' | 'sponsored' | null>(null);
  const [showLegend, setShowLegend] = useState(true);
  const [viewRadius, setViewRadius] = useState<number>(1.5);
  const [onlyWithinRadius, setOnlyWithinRadius] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 400, height: 350 });

  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({ width, height });
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  const getSafeLoc = (loc: any) => ({
    lat: typeof loc?.lat === 'number' ? loc.lat : (typeof loc?.latitude === 'number' ? loc.latitude : 23.8103),
    lng: typeof loc?.lng === 'number' ? loc.lng : (typeof loc?.longitude === 'number' ? loc.longitude : 90.4125),
  });

  // Distance helper in kilometers
  const getDistanceKm = (loc1: any, loc2: any) => {
    const l1 = getSafeLoc(loc1);
    const l2 = getSafeLoc(loc2);
    const R = 6371; // Earth's radius in km
    const dLat = ((l2.lat - l1.lat) * Math.PI) / 180;
    const dLng = ((l2.lng - l1.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((l1.lat * Math.PI) / 180) *
        Math.cos((l2.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const pixelsPerKmX = dimensions.width / 5.1;
  const radiusPx = viewRadius * pixelsPerKmX;

  // Helper to identify services category
  const isServicesCategory = (cat: string) => ['electrician', 'plumber', 'tutor', 'parlor'].includes(cat);

  // Return specific color scheme classes for each pin type
  const getPinColorClass = (biz: Business, isSelected: boolean) => {
    if (isSelected) {
      return 'bg-rose-600 border-white text-white ring-4 ring-rose-300 scale-125 z-30 animate-bounce';
    }
    if (biz.isSponsored) {
      return 'bg-amber-500 border-white text-white';
    }
    if (biz.category === 'grocery') {
      return 'bg-emerald-600 border-white text-white';
    }
    if (biz.category === 'pharmacy') {
      return 'bg-rose-500 border-white text-white';
    }
    if (isServicesCategory(biz.category)) {
      return 'bg-blue-600 border-white text-white';
    }
    return 'bg-slate-600 border-white text-white';
  };

  // Check if a business matches the active legend filter
  const isHighlighted = (biz: Business) => {
    if (!activeLegendFilter) return false;
    if (activeLegendFilter === 'grocery' && biz.category === 'grocery') return true;
    if (activeLegendFilter === 'pharmacy' && biz.category === 'pharmacy') return true;
    if (activeLegendFilter === 'services' && isServicesCategory(biz.category)) return true;
    if (activeLegendFilter === 'sponsored' && biz.isSponsored) return true;
    return false;
  };

  const isDimmed = (biz: Business) => {
    const isOutOfRadius = getDistanceKm(userLocation, biz.location || biz) > viewRadius;
    if (onlyWithinRadius && isOutOfRadius) return true;
    if (!activeLegendFilter) return false;
    return !isHighlighted(biz);
  };

  // Reverse coordinates mapping logic
  const getLatLng = (xPercent: number, yPercent: number) => {
    const lngDiff = xPercent * 0.05;
    const latDiff = (1 - yPercent) * 0.05;
    const lat = 23.72 + latDiff;
    const lng = 90.35 + lngDiff;
    return { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) };
  };

  const getAddressFromLatLng = (lat: number, lng: number) => {
    if (lat > 23.755 && lng < 90.37) {
      return { address: 'সোবহানবাগ জামে মসজিদ সংলগ্ন, ধানমন্ডি', district: 'সোবহানবাগ (Sobhanbag)' };
    } else if (lat > 23.75 && lng >= 90.37) {
      return { address: 'কলাবাগান ক্রীড়া চক্র মাঠ সংলগ্ন, ঢাকা', district: 'কলাবাগান (Kalabagan)' };
    } else if (lat > 23.745 && lng < 90.365) {
      return { address: 'ধানমন্ডি ২৭ নং রোড (সাতমসজিদ রোড মোড়), ঢাকা', district: 'ধানমন্ডি ২৭ (Road 27)' };
    } else if (lat > 23.74 && lat <= 23.75 && lng < 90.375) {
      return { address: 'ধানমন্ডি ৩২ নং রোড (বঙ্গবন্ধু স্মৃতি জাদুঘর সংলগ্ন), ঢাকা', district: 'ধানমন্ডি ৩২ (Road 32)' };
    } else if (lat > 23.73 && lat <= 23.74 && lng < 90.365) {
      return { address: 'ধানমন্ডি ১৫ নং রোড (সাতমসজিদ রোড লেকপার), ঢাকা', district: 'ধানমন্ডি ১৫ (Road 15)' };
    } else if (lat <= 23.73 && lng < 90.37) {
      return { address: 'জিগাতলা বাসস্ট্যান্ড সংলগ্ন এলাকা, ঢাকা', district: 'জিগাতলা (Jigatola)' };
    } else if (lat <= 23.73 && lng >= 90.37) {
      return { address: 'সায়েন্স ল্যাবরেটরি মোড় সংলগ্ন, ঢাকা', district: 'সায়েন্স ল্যাব (Science Lab)' };
    } else {
      return { address: 'ধানমন্ডি লেক সংলগ্ন আবাসিক এলাকা, ঢাকা', district: 'ধানমন্ডি লেক (Dhanmondi Lake)' };
    }
  };

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onUpdateUserLocation) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const xPercent = (e.clientX - rect.left) / rect.width;
    const yPercent = (e.clientY - rect.top) / rect.height;
    
    const { lat, lng } = getLatLng(xPercent, yPercent);
    const { address, district } = getAddressFromLatLng(lat, lng);
    
    onUpdateUserLocation({
      lat,
      lng,
      address,
      district
    });
  };

  // Filtering businesses shown on map
  const filteredMapBusinesses = businesses.filter(b => 
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper to map category to emoji/icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'grocery': return <ShoppingBag className="w-3.5 h-3.5" />;
      case 'pharmacy': return <span className="text-xs font-bold font-mono">💊</span>;
      case 'electrician': return <Zap className="w-3.5 h-3.5" />;
      case 'plumber': return <Droplet className="w-3.5 h-3.5" />;
      case 'tutor': return <GraduationCap className="w-3.5 h-3.5" />;
      case 'parlor': return <Scissors className="w-3.5 h-3.5" />;
      default: return <MapPin className="w-3.5 h-3.5" />;
    }
  };

  // Coordinates mapping logic for visualization ( Dhanmondi grid )
  // Dhanmondi center: lat: 23.74, lng: 90.37
  const getXY = (lat: number, lng: number) => {
    const latDiff = lat - 23.72; // height range
    const lngDiff = lng - 90.35; // width range
    const x = Math.min(Math.max((lngDiff / 0.05) * 100, 5), 95);
    const y = Math.min(Math.max(100 - (latDiff / 0.05) * 100, 5), 95);
    return { x, y };
  };

  const safeUserLoc = getSafeLoc(userLocation);
  const userPos = getXY(safeUserLoc.lat, safeUserLoc.lng);

  return (
    <div id="map-widget-container" className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full min-h-[420px]">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/50">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600"></span>
            </span>
            লাইভ সার্ভিস ম্যাপ (Live Service Map)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            আপনার চারপাশে সচল সকল দোকান ও জরুরি সার্ভিস সেবা
          </p>
        </div>
        <div className="relative w-full sm:w-48">
          <input
            type="text"
            placeholder="ম্যাপে খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
        </div>
      </div>

      {/* Map Canvas Grid */}
      <div 
        ref={containerRef}
        onClick={handleMapClick}
        className="relative flex-1 bg-slate-100 overflow-hidden h-[300px] sm:h-[350px] md:h-[380px] border-b border-slate-100 cursor-crosshair select-none group/canvas"
        title="ম্যাপে ক্লিক করে আপনার অবস্থান সেট করুন"
      >
        {/* Map Location Change Helper Info Banner */}
        <div className="absolute top-2 left-2 z-30 bg-slate-900/90 backdrop-blur-xs text-white text-[10px] py-1 px-2.5 rounded-lg font-bold flex items-center gap-1 shadow-md pointer-events-none transition-all group-hover/canvas:bg-blue-600">
          📍 ম্যাপে ক্লিক করে অবস্থান পরিবর্তন করুন
        </div>

        {/* Dynamic Road Layout Overlay */}
        <div className="absolute inset-0 opacity-15 pointer-events-none">
          {/* Roads */}
          <div className="absolute top-1/4 left-0 w-full h-4 bg-slate-500 rotate-2"></div>
          <div className="absolute top-3/4 left-0 w-full h-5 bg-slate-500 -rotate-3"></div>
          <div className="absolute left-1/3 top-0 w-4 h-full bg-slate-500 rotate-12"></div>
          <div className="absolute left-2/3 top-0 w-5 h-full bg-slate-500 -rotate-6"></div>
          {/* Dhanmondi Lake Simulation */}
          <div className="absolute top-1/3 left-1/4 w-32 h-24 rounded-full bg-blue-300 filter blur-sm"></div>
        </div>

        {/* Visual Radius Circle (Perfect circle using ResizeObserver dimensions) */}
        <div
          style={{
            left: `${userPos.x}%`,
            top: `${userPos.y}%`,
            width: `${radiusPx * 2}px`,
            height: `${radiusPx * 2}px`,
          }}
          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed border-blue-500/40 bg-blue-500/5 pointer-events-none transition-all duration-350 z-10"
        >
          {/* Pulsing Scan Effect */}
          <div className="absolute inset-0 rounded-full bg-blue-500/5 animate-pulse" />
          
          {/* Edge Marker Label */}
          <div 
            style={{ transform: 'translate(50%, -50%)' }}
            className="absolute right-0 top-1/2 bg-blue-600 text-white text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-md whitespace-nowrap"
          >
            {viewRadius < 1 ? `${viewRadius * 1000}মি.` : `${viewRadius} কিমি`}
          </div>
        </div>

        {/* User Marker */}
        <div 
          style={{ left: `${userPos.x}%`, top: `${userPos.y}%` }}
          className="absolute -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center group cursor-pointer"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="absolute -top-8 bg-slate-900 text-white text-[10px] py-1 px-2 rounded shadow-md whitespace-nowrap hidden group-hover:block">
            আপনি এখানে আছেন ({userLocation.district})
          </div>
          <div className="w-8 h-8 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center shadow-lg text-white animate-bounce">
            <Navigation className="w-3.5 h-3.5 transform -rotate-45" />
          </div>
          <span className="text-[10px] font-bold text-blue-700 bg-white/90 px-1.5 py-0.5 rounded shadow mt-1">
            আমার অবস্থান
          </span>
        </div>

        {/* Floating Interactive Legend Overlay */}
        <div className="absolute bottom-3 left-3 z-30 flex flex-col items-start gap-1.5 max-w-[calc(100%-24px)]" onClick={(e) => e.stopPropagation()}>
          {/* Legend toggle button */}
          <button
            type="button"
            onClick={() => setShowLegend(!showLegend)}
            className="bg-slate-900/90 hover:bg-slate-900 backdrop-blur-md text-white text-[10px] sm:text-[11px] py-1.5 px-3 rounded-xl font-bold flex items-center gap-1.5 shadow-md border border-slate-800 transition-all cursor-pointer"
          >
            🗺️ <span>ম্যাপ সূচক (Interactive Legend)</span>
            <span className="text-[9px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">
              {showLegend ? 'আড়াল করুন ▴' : 'দেখুন ▾'}
            </span>
          </button>

          {showLegend && (
            <div 
              className="bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-slate-200/80 shadow-xl w-56 sm:w-60 text-[10px] sm:text-[11px] space-y-2 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 max-h-[220px] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <span className="font-black text-slate-900">পিন টাইপ ও কালার সূচক</span>
                {activeLegendFilter && (
                  <button
                    onClick={() => setActiveLegendFilter(null)}
                    className="text-[9px] bg-rose-50 hover:bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded font-black cursor-pointer"
                  >
                    রিসেট ✕
                  </button>
                )}
              </div>
              <p className="text-[9px] text-slate-500 font-bold leading-tight">যেকোনো সূচকে ক্লিক করে ম্যাপের পিন হাইলাইট করুন:</p>
              
              <div className="space-y-1">
                {/* Grocery */}
                <button
                  type="button"
                  onClick={() => setActiveLegendFilter(activeLegendFilter === 'grocery' ? null : 'grocery')}
                  className={`w-full flex items-center justify-between p-1 rounded-lg border text-left transition-all cursor-pointer ${
                    activeLegendFilter === 'grocery' 
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-black ring-1 ring-emerald-300' 
                      : 'border-transparent hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs border border-white">
                      <ShoppingBag className="w-3 h-3" />
                    </span>
                    <span>গ্রোসারি ও মুদি দোকান</span>
                  </span>
                  <span className="text-[8px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.2 rounded">Green</span>
                </button>

                {/* Pharmacy */}
                <button
                  type="button"
                  onClick={() => setActiveLegendFilter(activeLegendFilter === 'pharmacy' ? null : 'pharmacy')}
                  className={`w-full flex items-center justify-between p-1 rounded-lg border text-left transition-all cursor-pointer ${
                    activeLegendFilter === 'pharmacy' 
                      ? 'bg-rose-50 border-rose-300 text-rose-950 font-black ring-1 ring-rose-300' 
                      : 'border-transparent hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-xs border border-white text-[9px] font-bold">
                      💊
                    </span>
                    <span>ফার্মেসি ও মেডিসিন</span>
                  </span>
                  <span className="text-[8px] bg-rose-100 text-rose-800 font-extrabold px-1.5 py-0.2 rounded">Pink</span>
                </button>

                {/* Services */}
                <button
                  type="button"
                  onClick={() => setActiveLegendFilter(activeLegendFilter === 'services' ? null : 'services')}
                  className={`w-full flex items-center justify-between p-1 rounded-lg border text-left transition-all cursor-pointer ${
                    activeLegendFilter === 'services' 
                      ? 'bg-blue-50 border-blue-300 text-blue-950 font-black ring-1 ring-blue-300' 
                      : 'border-transparent hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs border border-white">
                      <Zap className="w-3 h-3" />
                    </span>
                    <span>জরুরি হোম সার্ভিস</span>
                  </span>
                  <span className="text-[8px] bg-blue-100 text-blue-800 font-extrabold px-1.5 py-0.2 rounded">Blue</span>
                </button>

                {/* Sponsored */}
                <button
                  type="button"
                  onClick={() => setActiveLegendFilter(activeLegendFilter === 'sponsored' ? null : 'sponsored')}
                  className={`w-full flex items-center justify-between p-1 rounded-lg border text-left transition-all cursor-pointer ${
                    activeLegendFilter === 'sponsored' 
                      ? 'bg-amber-50 border-amber-300 text-amber-950 font-black ring-1 ring-amber-300' 
                      : 'border-transparent hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs border border-white text-[8px] font-bold">
                      ★
                    </span>
                    <span>স্পন্সরড মার্চেন্ট</span>
                  </span>
                  <span className="text-[8px] bg-amber-100 text-amber-800 font-extrabold px-1.5 py-0.2 rounded">Amber</span>
                </button>
              </div>

              {/* Viewing Range Selector */}
              <div className="border-t border-slate-100 pt-2.5 mt-2.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900 text-[10px]">সার্ভিস ভিউ রেঞ্জ (View Radius)</span>
                  <span className="text-[9px] text-blue-600 font-black bg-blue-50 px-1.5 py-0.2 rounded">
                    {viewRadius < 1 ? `${viewRadius * 1000} মিটার` : `${viewRadius} কি.মি.`}
                  </span>
                </div>
                
                <div className="flex gap-1">
                  {[0.5, 1.0, 1.5, 2.5].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setViewRadius(r)}
                      className={`flex-1 py-1 text-[9px] font-extrabold rounded-lg border text-center transition-all cursor-pointer ${
                        viewRadius === r
                          ? 'bg-blue-600 border-blue-600 text-white font-black shadow-xs'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      {r < 1 ? '৫০০মি.' : `${r}কিমি`}
                    </button>
                  ))}
                </div>

                {/* Filter toggle for within radius */}
                <label className="flex items-center gap-2 pt-1 pb-0.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={onlyWithinRadius}
                    onChange={(e) => setOnlyWithinRadius(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                  />
                  <span className="text-[10px] font-bold text-slate-700">
                    শুধু এই ব্যাসার্ধের ভেতরের সেবা দেখান
                  </span>
                </label>
              </div>

              {/* General explanations */}
              <div className="border-t border-slate-100 pt-1.5 space-y-1 text-[9px] text-slate-500 font-bold">
                <div className="flex items-center gap-1.5 px-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600 border border-white shadow-xs inline-block animate-pulse" />
                  <span>নির্বাচিত প্রতিষ্ঠান (Selected Pin)</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Business Pins */}
        {filteredMapBusinesses.map((biz) => {
          const safeBizLoc = getSafeLoc(biz.location || biz);
          const bizPos = getXY(safeBizLoc.lat, safeBizLoc.lng);
          const isSelected = selectedBusiness?.id === biz.id;
          const isDim = isDimmed(biz);
          const isHigh = isHighlighted(biz);
          
          return (
            <div
              key={biz.id}
              style={{ left: `${bizPos.x}%`, top: `${bizPos.y}%` }}
              onClick={(e) => {
                e.stopPropagation();
                onSelectBusiness(biz);
              }}
              onMouseEnter={() => setHoveredBiz(biz)}
              onMouseLeave={() => setHoveredBiz(null)}
              className={`absolute -translate-x-1/2 -translate-y-1/2 z-10 cursor-pointer flex flex-col items-center group transition-all duration-250 ${
                isDim ? 'opacity-20 scale-75 blur-[0.3px] pointer-events-none' : ''
              } ${
                !isDim && getDistanceKm(userLocation, biz.location || biz) > viewRadius && !isSelected
                  ? 'opacity-50 hover:opacity-100 scale-90'
                  : ''
              } ${isHigh ? 'z-30 scale-115' : ''}`}
            >
              {/* Badge pin */}
              <div className={`p-1.5 rounded-full border-2 shadow-md transition-all ${getPinColorClass(biz, isSelected)} ${
                isHigh ? 'ring-4 ring-offset-1 ' + (
                  activeLegendFilter === 'grocery' ? 'ring-emerald-400' :
                  activeLegendFilter === 'pharmacy' ? 'ring-rose-400' :
                  activeLegendFilter === 'services' ? 'ring-blue-400' : 'ring-amber-400'
                ) + ' animate-pulse' : ''
              }`}>
                {getCategoryIcon(biz.category)}
              </div>

              {/* Minified info tooltip */}
              {(hoveredBiz?.id === biz.id || isSelected) && (
                <div className="absolute bottom-9 bg-slate-900/95 backdrop-blur-sm text-white p-2 rounded-lg shadow-xl z-50 w-44 text-[11px] animate-fade-in border border-slate-800">
                  <div className="font-bold flex items-center justify-between gap-1">
                    <span className="truncate">{biz.name}</span>
                    {biz.isSponsored && <span className="bg-amber-400 text-[8px] text-slate-950 px-1 rounded font-black">SPONSOR</span>}
                  </div>
                  <div className="text-[10px] text-slate-300 mt-0.5 flex items-center justify-between">
                    <span>⭐ {biz.rating} ({biz.reviewsCount} রিভিউ)</span>
                    <span className="text-emerald-400 font-bold">
                      {biz.type === 'shop' ? 'দোকান' : 'সার্ভিস'}
                    </span>
                  </div>
                  <div className="text-[9px] text-slate-400 mt-1 line-clamp-1">
                    📍 {biz.address}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Distance and Routes Helper Card */}
      <div className="p-4 bg-slate-50 flex-1 flex flex-col justify-between text-xs">
        {selectedBusiness ? (
          <div>
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">নির্বাচিত সেবা ও দূরত্ব</span>
                <h4 className="font-bold text-slate-900 text-sm mt-0.5">{selectedBusiness.name}</h4>
                <p className="text-slate-500 text-[11px] mt-0.5">📍 {selectedBusiness.address}</p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${selectedBusiness.isOpen ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                  {selectedBusiness.isOpen ? 'খোলা আছে' : 'বন্ধ আছে'}
                </span>
                <button
                  type="button"
                  onClick={() => onSelectBusiness(null as any)}
                  className="text-[9px] text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded font-black mt-1 transition-all cursor-pointer border border-rose-100"
                  title="পিন সিলেকশন বাদ দিন"
                >
                  ✕ পিন বাদ দিন
                </button>
              </div>
            </div>

            {/* Real Calculations */}
            {(() => {
              const distance = getDistanceKm(userLocation, selectedBusiness.location || selectedBusiness);
              const distanceStr = distance < 1
                ? `${Math.round(distance * 1000)} মিটার`
                : `${distance.toFixed(2)} কিমি`;
              const walkTimeMins = Math.max(1, Math.round(distance * 12));
              return (
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-semibold">সরাসরি দূরত্ব</span>
                    <span className="font-bold text-slate-800 text-sm">
                      {distanceStr}
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-semibold">পৌঁছানোর সময় (হেঁটে)</span>
                    <span className="font-bold text-slate-800 text-sm">
                      ~ {walkTimeMins} মিনিট
                    </span>
                  </div>
                </div>
              );
            })()}

            <div className="mt-3 flex gap-2">
              <a 
                href={`tel:${selectedBusiness.phone}`}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors text-center text-[11px]"
              >
                📞 কল করুন
              </a>
              {selectedBusiness.whatsapp && (
                <a 
                  href={`https://wa.me/${selectedBusiness.whatsapp}`}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-1.5 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors text-[11px]"
                >
                  💬 হোয়াটসঅ্যাপ
                </a>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-slate-500 flex flex-col items-center justify-center h-full">
            <MapPin className="w-8 h-8 text-slate-300 mb-2" />
            <p className="font-semibold">যেকোনো দোকান বা সার্ভিস পিনে ক্লিক করুন</p>
            <p className="text-[11px] text-slate-400 mt-1">ক্লিক করার সাথে সাথে দূরত্ব, যোগাযোগের লিংক ও দিকনির্দেশ দেখাবে।</p>
          </div>
        )}
      </div>
    </div>
  );
}
