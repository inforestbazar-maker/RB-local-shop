import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Trash2, RefreshCw, SwitchCamera, Image as ImageIcon, Link as LinkIcon, Check, X, Sparkles } from 'lucide-react';

interface PhotoCaptureUploadProps {
  currentImage?: string;
  onImageChange: (image: string) => void;
  label?: string;
  sublabel?: string;
  shape?: 'circle' | 'square' | 'rectangle';
  aspectRatio?: '1:1' | '4:3' | '16:9';
  placeholderText?: string;
  allowCamera?: boolean;
  allowUpload?: boolean;
  allowUrl?: boolean;
  compact?: boolean;
}

export default function PhotoCaptureUpload({
  currentImage = '',
  onImageChange,
  label = 'ছবি আপলোড বা ক্যামেরা দিয়ে তুলুন',
  sublabel = 'ক্যামেরা দিয়ে সরাসরি ছবি তুলুন অথবা ফোন/কম্পিউটার থেকে ছবি আপলোড করুন',
  shape = 'circle',
  aspectRatio = '1:1',
  placeholderText = 'RB',
  allowCamera = true,
  allowUpload = true,
  allowUrl = true,
  compact = false
}: PhotoCaptureUploadProps) {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [cameraError, setCameraError] = useState<string>('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [manualUrl, setManualUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isShutterFlashing, setIsShutterFlashing] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const simulatedIntervalRef = useRef<number | null>(null);

  // Clean up camera stream on unmount or when camera turns off
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (simulatedIntervalRef.current) {
      clearInterval(simulatedIntervalRef.current);
      simulatedIntervalRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
    setCameraError('');
  };

  const startCamera = async (mode: 'user' | 'environment' = facingMode) => {
    stopCamera();
    setCameraError('');

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: mode,
            width: { ideal: 640 },
            height: { ideal: 640 }
          }
        });
      } catch (firstErr) {
        console.warn('Standard camera constraints failed, attempting fallback...', firstErr);
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      mediaStreamRef.current = stream;
      setIsCameraActive(true);
      setFacingMode(mode);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch((e) => console.warn('Video play error:', e));
        }
      }, 150);
    } catch (err: any) {
      console.warn('Hardware camera access unavailable, activating simulated camera feed:', err);

      // Fallback Canvas simulation for sandboxed / iframe environments
      try {
        const mockCanvas = document.createElement('canvas');
        mockCanvas.width = 400;
        mockCanvas.height = 400;
        const ctx = mockCanvas.getContext('2d');

        let frame = 0;
        const drawFrame = () => {
          if (!ctx) return;
          frame++;

          // Background
          const gradient = ctx.createRadialGradient(200, 200, 40, 200, 200, 260);
          gradient.addColorStop(0, '#1e1b4b');
          gradient.addColorStop(1, '#0f172a');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, 400, 400);

          // Grid guide
          ctx.strokeStyle = 'rgba(99, 102, 241, 0.15)';
          ctx.lineWidth = 1;
          for (let i = 0; i <= 400; i += 40) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, 400);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(400, i);
            ctx.stroke();
          }

          // Lens Viewfinder Corners
          const glow = Math.abs(Math.sin(frame * 0.06)) * 4 + 2;
          ctx.strokeStyle = '#22c55e';
          ctx.lineWidth = 3;
          ctx.shadowBlur = glow;
          ctx.shadowColor = '#22c55e';

          // Top Left
          ctx.beginPath();
          ctx.moveTo(50, 80);
          ctx.lineTo(50, 50);
          ctx.lineTo(80, 50);
          ctx.stroke();
          // Top Right
          ctx.beginPath();
          ctx.moveTo(350, 80);
          ctx.lineTo(350, 50);
          ctx.lineTo(320, 50);
          ctx.stroke();
          // Bottom Left
          ctx.beginPath();
          ctx.moveTo(50, 320);
          ctx.lineTo(50, 350);
          ctx.lineTo(80, 350);
          ctx.stroke();
          // Bottom Right
          ctx.beginPath();
          ctx.moveTo(350, 320);
          ctx.lineTo(350, 350);
          ctx.lineTo(320, 350);
          ctx.stroke();
          ctx.shadowBlur = 0;

          // Target Circle & Center Reticle
          ctx.strokeStyle = 'rgba(129, 140, 248, 0.4)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(200, 200, 80, 0, Math.PI * 2);
          ctx.stroke();

          // Subject silhouette
          const pulse = 1 + Math.sin(frame * 0.08) * 0.03;
          ctx.fillStyle = 'rgba(99, 102, 241, 0.35)';
          ctx.beginPath();
          ctx.arc(200, 175, 30 * pulse, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.ellipse(200, 240, 50 * pulse, 30 * pulse, 0, 0, Math.PI * 2);
          ctx.fill();

          // High tech HUD markings
          ctx.fillStyle = '#22c55e';
          ctx.font = 'bold 11px sans-serif';
          ctx.fillText('● LIVE CAMERA READY', 60, 75);

          // Timestamp
          const now = new Date();
          const timeStr = now.toTimeString().split(' ')[0];
          ctx.fillStyle = '#ffffff';
          ctx.font = '10px monospace';
          ctx.fillText(timeStr, 290, 75);
        };

        drawFrame();
        const intervalId = window.setInterval(drawFrame, 40);
        simulatedIntervalRef.current = intervalId;

        const canvasStream = (mockCanvas as any).captureStream ? (mockCanvas as any).captureStream(25) : null;
        if (canvasStream) {
          mediaStreamRef.current = canvasStream;
          setIsCameraActive(true);
          setTimeout(() => {
            if (videoRef.current) {
              videoRef.current.srcObject = canvasStream;
              videoRef.current.play().catch((e) => console.warn(e));
            }
          }, 150);
          setCameraError("সিমুলেটেড ক্যামেরা মোড সক্রিয় রয়েছে। নিচের 'ছবি তুলুন' বাটনে ক্লিক করে ছবি ধারণ করতে পারেন।");
          return;
        }
      } catch (mockErr) {
        console.error('Simulated camera error:', mockErr);
      }

      setCameraError('ক্যামেরা চালু করা যায়নি। অনুগ্রহ করে পারমিশন চেক করুন অথবা ফাইল আপলোড বাটন ব্যবহার করুন।');
    }
  };

  const toggleCameraFacingMode = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    startCamera(nextMode);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    // Flash effect
    setIsShutterFlashing(true);
    setTimeout(() => setIsShutterFlashing(false), 200);

    const canvas = document.createElement('canvas');
    const width = 480;
    const height = aspectRatio === '16:9' ? 270 : aspectRatio === '4:3' ? 360 : 480;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      if (facingMode === 'user') {
        // Mirror horizontally for selfie camera
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(videoRef.current, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      onImageChange(dataUrl);
      stopCamera();
    }
  };

  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('অনুগ্রহ করে শুধুমাত্র ছবি ফাইল (JPG, PNG, WebP) নির্বাচন করুন।');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (!result) return;

      // Compress and resize client-side to ensure optimum performance
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 800;
        let w = img.width;
        let h = img.height;

        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }

        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          onImageChange(compressed);
        } else {
          onImageChange(result);
        }
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleApplyUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualUrl.trim()) {
      onImageChange(manualUrl.trim());
      setManualUrl('');
      setShowUrlInput(false);
    }
  };

  // Preview container aspect ratio / shape classes
  const shapeClass = shape === 'circle' ? 'rounded-full' : shape === 'square' ? 'rounded-2xl' : 'rounded-2xl';
  const sizeClass = compact ? 'w-16 h-16 sm:w-20 sm:h-20' : 'w-24 h-24 sm:w-28 sm:h-28';

  return (
    <div className="space-y-3">
      {label && (
        <div className="flex items-center justify-between">
          <div>
            <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-indigo-600" />
              {label}
            </label>
            {sublabel && <p className="text-[10px] text-slate-500 font-medium">{sublabel}</p>}
          </div>
        </div>
      )}

      {/* Main Container */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative p-3.5 rounded-2xl border-2 transition-all ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50/50 shadow-md'
            : 'border-dashed border-slate-200 hover:border-indigo-300 bg-slate-50/60'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* Visual Preview / Live Video Stream Box */}
          <div className="relative shrink-0 flex items-center justify-center">
            <div
              className={`relative overflow-hidden border-2 border-indigo-200 bg-white shadow-sm flex items-center justify-center ${shapeClass} ${sizeClass}`}
            >
              {currentImage && !isCameraActive ? (
                <img
                  src={currentImage}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : !isCameraActive ? (
                <div className="flex flex-col items-center justify-center text-slate-400 p-2 text-center">
                  <ImageIcon className="w-6 h-6 text-slate-300 mb-0.5" />
                  <span className="text-[10px] font-black text-slate-500 uppercase">{placeholderText}</span>
                </div>
              ) : null}

              {/* Live Camera Viewfinder Overlay */}
              {isCameraActive && (
                <div className="absolute inset-0 bg-black flex items-center justify-center z-10">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                  />
                  {isShutterFlashing && <div className="absolute inset-0 bg-white z-20 animate-fade-out" />}
                </div>
              )}
            </div>

            {/* Camera Active Badge Indicator */}
            {isCameraActive && (
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white"></span>
              </span>
            )}
          </div>

          {/* Action Buttons & Tools */}
          <div className="flex-1 w-full space-y-2 text-center sm:text-left">
            {isCameraActive ? (
              <div className="space-y-2">
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer flex-1 sm:flex-none"
                  >
                    <Camera className="w-4 h-4" />
                    <span>📸 ছবি তুলুন (Capture)</span>
                  </button>

                  <button
                    type="button"
                    onClick={toggleCameraFacingMode}
                    className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                    title="ক্যামেরা পরিবর্তন করুন (Front/Back)"
                  >
                    <SwitchCamera className="w-4 h-4" />
                    <span className="hidden sm:inline text-[10px]">
                      {facingMode === 'user' ? 'ব্যাক ক্যামেরা' : 'সেলফি ক্যামেরা'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={stopCamera}
                    className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                    <span>বাতিল</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 font-medium">
                  📷 ক্যামেরা ভিউফাইন্ডারে সঠিক পজিশন রেখে &apos;ছবি তুলুন&apos; বাটনে ক্লিক করুন।
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  {allowCamera && (
                    <button
                      type="button"
                      onClick={() => startCamera('environment')}
                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer flex-1 sm:flex-none"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>লাইভ ক্যামেরা</span>
                    </button>
                  )}

                  {allowUpload && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer flex-1 sm:flex-none"
                    >
                      <Upload className="w-3.5 h-3.5 text-slate-500" />
                      <span>ফাইল আপলোড</span>
                    </button>
                  )}

                  {allowUrl && (
                    <button
                      type="button"
                      onClick={() => setShowUrlInput(!showUrlInput)}
                      className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                      title="অনলাইন ছবি লিংক দিন"
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {currentImage && (
                    <button
                      type="button"
                      onClick={() => onImageChange('')}
                      className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                      title="ফটো মুছুন"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <p className="text-[10px] text-slate-500 font-medium">
                  ছবি ড্র্যাগ করে ছেড়ে দিন অথবা ক্যামেরা দিয়ে সরাসরি তুলুন (সর্বোচ্চ সাইজ ৫ মেগাবাইট)
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Optional Image URL Input Bar */}
        {showUrlInput && !isCameraActive && (
          <form onSubmit={handleApplyUrl} className="mt-3 pt-3 border-t border-slate-200/80 flex gap-2">
            <input
              type="url"
              placeholder="https://example.com/my-photo.jpg"
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
              className="flex-1 text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            <button
              type="submit"
              className="px-3 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 transition-all cursor-pointer flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>যোগ করুন</span>
            </button>
          </form>
        )}

        {/* Camera Warning / Error Message */}
        {cameraError && (
          <div className="mt-2.5 p-2 bg-amber-50 border border-amber-200 rounded-xl text-[11px] font-bold text-amber-900 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>{cameraError}</span>
          </div>
        )}
      </div>
    </div>
  );
}
