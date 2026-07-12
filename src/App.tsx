import React, { useState, useRef, useEffect } from "react";
import Header from "./components/Header";
import LandCertificateSimulator from "./components/LandCertificateSimulator";
import Form15Editor from "./components/Form15Editor";
import { UserInputData, OcrResult, SimulationParams, SavedRecord, UploadedImage } from "./types";
import { 
  FileText, 
  Phone, 
  UserCheck, 
  UploadCloud, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Info, 
  Camera, 
  Sparkles, 
  RefreshCw, 
  ArrowRight, 
  FileSpreadsheet, 
  Scan, 
  MapPin, 
  Calendar, 
  Compass, 
  Maximize, 
  CornerDownRight, 
  Check, 
  X,
  Plus,
  Download,
  Trash2,
  Edit,
  Database,
  CheckSquare,
  Printer
} from "lucide-react";

export default function App() {
  // Navigation states
  const [currentView, setCurrentView] = useState<"ocr_dashboard" | "form15_manager">("ocr_dashboard");
  const [selectedForm15RecordId, setSelectedForm15RecordId] = useState<string | null>(null);

  // User Input Form State
  const [formValues, setFormValues] = useState<UserInputData>({
    plotNumber: "124",
    identityNumber: "031095012345",
    phoneNumber: "0912345678"
  });

  // Custom alert & confirm states for smooth iframe usage
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Selected or Simulated Image State
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);

  // Compute active preview dynamically to avoid synchronization bugs
  const activeImage = uploadedImages.find(img => img.id === selectedImageId) || uploadedImages[0] || null;
  const imagePreview = activeImage?.preview || null;
  const imageMimeType = activeImage?.mimeType || "image/jpeg";
  const uploadedFileName = activeImage?.fileName || null;
  
  // OCR Scan & Status State
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  
  // Interface Settings
  const [activeTab, setActiveTab] = useState<"upload" | "camera" | "simulator">("simulator");
  const [isDragActive, setIsDragActive] = useState<boolean>(false);
  const [cameraActive, setCameraActive] = useState<boolean>(false);

  // Database / Saved Records State
  const [savedRecords, setSavedRecords] = useState<SavedRecord[]>(() => {
    try {
      const saved = localStorage.getItem("smart_gcn_saved_records");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // OCR Pre-save Edit Form state
  const [saveForm, setSaveForm] = useState<Omit<SavedRecord, "id" | "verifiedAt">>({
    plotNumber: "",
    mapSheetNumber: "",
    ownerName: "",
    ownerId: "",
    address: "",
    area: "",
    issueDate: "",
    phoneNumber: "",
    status: "matched",
    notes: "",
    origin: ""
  });

  // Manual Add/Edit form state
  const [showManualModal, setShowManualModal] = useState<boolean>(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [manualForm, setManualForm] = useState<Omit<SavedRecord, "id" | "verifiedAt">>({
    plotNumber: "",
    mapSheetNumber: "",
    ownerName: "",
    ownerId: "",
    address: "",
    area: "",
    issueDate: "",
    phoneNumber: "",
    status: "manual",
    notes: "",
    origin: ""
  });

  // Sync OCR result to saveForm when OCR finishes
  useEffect(() => {
    if (ocrResult) {
      setSaveForm({
        plotNumber: ocrResult.extractedData.plotNumber || formValues.plotNumber || "",
        mapSheetNumber: ocrResult.extractedData.mapSheetNumber || "18",
        ownerName: ocrResult.extractedData.ownerName || "",
        ownerId: ocrResult.extractedData.ownerId || formValues.identityNumber || "",
        address: ocrResult.extractedData.address || "",
        area: ocrResult.extractedData.area || "",
        issueDate: ocrResult.extractedData.issueDate || "",
        phoneNumber: ocrResult.extractedData.phone || formValues.phoneNumber || "",
        status: ocrResult.isOverallValid ? "matched" : "mismatched",
        notes: "Được lưu tự động từ quá trình quét OCR AI.",
        origin: ocrResult.extractedData.origin || ""
      });
    }
  }, [ocrResult, formValues]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Auto scroll to results when OCR is completed
  useEffect(() => {
    if (ocrResult) {
      const element = document.getElementById("ocr-results-container");
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [ocrResult]);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const addUploadedFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    // Validate types
    const invalidFiles = fileArray.filter(f => !f.type.startsWith("image/"));
    if (invalidFiles.length > 0) {
      setError("Vui lòng chỉ tải lên các file ảnh hợp lệ (PNG, JPG, JPEG).");
      return;
    }

    setError(null);

    fileArray.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          const newImg: UploadedImage = {
            id: "IMG_" + Date.now() + "_" + index + "_" + Math.random().toString(36).substr(2, 5),
            preview: e.target.result as string,
            mimeType: file.type,
            fileName: file.name
          };
          setUploadedImages(prev => {
            const updated = [...prev, newImg];
            setSelectedImageId(newImg.id);
            return updated;
          });
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addUploadedFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addUploadedFiles(e.target.files);
    }
  };

  // Camera Functions
  const startCamera = async () => {
    setError(null);
    setCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setError("Không thể truy cập camera. Vui lòng cấp quyền hoặc tải ảnh lên từ thư viện.");
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || !mediaStreamRef.current) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg");
      const newImg: UploadedImage = {
        id: "IMG_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
        preview: dataUrl,
        mimeType: "image/jpeg",
        fileName: `camera_capture_${uploadedImages.length + 1}.jpg`
      };
      setUploadedImages(prev => {
        const updated = [...prev, newImg];
        setSelectedImageId(newImg.id);
        return updated;
      });
      setError(null);
    }
  };

  // Callback from Simulator
  const handleSimulatedImage = (base64Data: string, params: SimulationParams) => {
    const newImg: UploadedImage = {
      id: "IMG_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
      preview: `data:image/jpeg;base64,${base64Data}`,
      mimeType: "image/jpeg",
      fileName: `sodo_gialap_${params.plotNumber}_trang_${uploadedImages.length + 1}.jpg`
    };
    setUploadedImages(prev => {
      const updated = [...prev, newImg];
      setSelectedImageId(newImg.id);
      return updated;
    });
    setError(null);
  };

  // Run OCR with server
  const runVerification = async () => {
    if (uploadedImages.length === 0) {
      setError("Vui lòng tải ảnh, chụp camera hoặc sử dụng Sổ đỏ giả lập trước.");
      return;
    }

    setLoading(true);
    setError(null);
    setOcrResult(null);

    // Dynamic scanning status simulations for interactive feel
    const steps = [
      "1. Đang tối ưu hóa độ tương phản hình ảnh...",
      "2. Đang phân tích cấu trúc tài liệu Sổ đỏ...",
      "3. Phát hiện vùng chứa chữ (OCR) bằng Gemini AI...",
      "4. Trích xuất thông tin chủ sở hữu & thửa đất...",
      "5. Thực hiện so khớp dữ liệu với thông tin nhập..."
    ];

    let stepIdx = 0;
    setLoadingStep(steps[0]);
    const interval = setInterval(() => {
      stepIdx++;
      if (stepIdx < steps.length) {
        setLoadingStep(steps[stepIdx]);
      }
    }, 1200);

    try {
      const imagesPayload = uploadedImages.map(img => ({
        base64: img.preview.split(",")[1],
        mimeType: img.mimeType
      }));

      const response = await fetch("/api/ocr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plotNumber: formValues.plotNumber,
          identityNumber: formValues.identityNumber,
          phoneNumber: formValues.phoneNumber,
          images: imagesPayload
        })
      });

      clearInterval(interval);

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || errData.details || "Có lỗi bất ngờ khi gọi API OCR.");
      }

      const result: OcrResult = await response.json();
      setOcrResult(result);
    } catch (err: any) {
      clearInterval(interval);
      console.error("Verification error:", err);
      setError(err?.message || "Không thể hoàn thành việc OCR và xác thực. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setUploadedImages([]);
    setSelectedImageId(null);
    setOcrResult(null);
    setError(null);
    stopCamera();
    setFormValues({
      plotNumber: "",
      identityNumber: "",
      phoneNumber: ""
    });
  };

  const handleRemoveImage = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setUploadedImages(prev => {
      const updated = prev.filter(img => img.id !== id);
      if (selectedImageId === id) {
        const index = prev.findIndex(img => img.id === id);
        if (updated.length > 0) {
          const nextSelected = updated[index] || updated[updated.length - 1];
          setSelectedImageId(nextSelected.id);
        } else {
          setSelectedImageId(null);
        }
      }
      return updated;
    });
  };

  // Database Save & Edit Action handlers
  const handleSaveOcrRecord = () => {
    const newRecord: SavedRecord = {
      id: "REC_" + Date.now(),
      verifiedAt: new Date().toLocaleDateString("vi-VN") + " " + new Date().toLocaleTimeString("vi-VN"),
      ...saveForm
    };

    const updated = [newRecord, ...savedRecords];
    setSavedRecords(updated);
    localStorage.setItem("smart_gcn_saved_records", JSON.stringify(updated));
    showToast("Đã lưu bản ghi OCR thành công vào Cơ sở dữ liệu riêng!", "success");
    handleReset(); // Automatically clear scanner state after successful saving
  };

  const handleSaveManualRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRecordId) {
      const updated = savedRecords.map(r => {
        if (r.id === editingRecordId) {
          return {
            ...r,
            ...manualForm
          };
        }
        return r;
      });
      setSavedRecords(updated);
      localStorage.setItem("smart_gcn_saved_records", JSON.stringify(updated));
      setEditingRecordId(null);
      showToast("Đã cập nhật bản ghi thành công!", "success");
    } else {
      const newRecord: SavedRecord = {
        id: "REC_" + Date.now(),
        verifiedAt: new Date().toLocaleDateString("vi-VN") + " " + new Date().toLocaleTimeString("vi-VN"),
        ...manualForm,
        status: "manual"
      };
      const updated = [newRecord, ...savedRecords];
      setSavedRecords(updated);
      localStorage.setItem("smart_gcn_saved_records", JSON.stringify(updated));
      showToast("Đã thêm bản ghi thủ công thành công!", "success");
    }

    setShowManualModal(false);
    setManualForm({
      plotNumber: "",
      mapSheetNumber: "",
      ownerName: "",
      ownerId: "",
      address: "",
      area: "",
      issueDate: "",
      phoneNumber: "",
      status: "manual",
      notes: "",
      origin: ""
    });
  };

  const handleDeleteRecord = (id: string) => {
    setRecordToDelete(id);
  };

  const confirmDeleteRecord = () => {
    if (recordToDelete) {
      const updated = savedRecords.filter(r => r.id !== recordToDelete);
      setSavedRecords(updated);
      localStorage.setItem("smart_gcn_saved_records", JSON.stringify(updated));
      setRecordToDelete(null);
      showToast("Đã xóa bản ghi thành công!", "success");
    }
  };

  const handleStartEdit = (record: SavedRecord) => {
    setEditingRecordId(record.id);
    setManualForm({
      plotNumber: record.plotNumber,
      mapSheetNumber: record.mapSheetNumber,
      ownerName: record.ownerName,
      ownerId: record.ownerId,
      address: record.address,
      area: record.area,
      issueDate: record.issueDate,
      phoneNumber: record.phoneNumber,
      status: record.status,
      notes: record.notes || "",
      origin: record.origin || ""
    });
    setShowManualModal(true);
  };

  const handleExportCSV = () => {
    if (savedRecords.length === 0) {
      showToast("Không có bản ghi nào để xuất báo cáo!", "error");
      return;
    }

    const headers = [
      "Mã Bản Ghi",
      "Số Thửa Đất",
      "Số Tờ Bản Đồ",
      "Họ Tên Chủ Sử Dụng",
      "CCCD / CMND",
      "Số Điện Thoại",
      "Diện Tích (m2)",
      "Địa Chỉ Thửa Đất",
      "Ngày Cấp Sổ",
      "Thời Gian Xác Thực",
      "Loại Xác Thực",
      "Ghi Chú"
    ];

    const lines = savedRecords.map(r => {
      const statusText = 
        r.status === "matched" ? "Khớp hoàn toàn" :
        r.status === "mismatched" ? "Không khớp" : "Nhập thủ công";
      
      return [
        r.id,
        `"${r.plotNumber.replace(/"/g, '""')}"`,
        `"${r.mapSheetNumber.replace(/"/g, '""')}"`,
        `"${r.ownerName.replace(/"/g, '""')}"`,
        `"${r.ownerId.replace(/"/g, '""')}"`,
        `"${r.phoneNumber.replace(/"/g, '""')}"`,
        `"${r.area.replace(/"/g, '""')}"`,
        `"${r.address.replace(/"/g, '""')}"`,
        `"${r.issueDate.replace(/"/g, '""')}"`,
        `"${r.verifiedAt}"`,
        `"${statusText}"`,
        `"${(r.notes || "").replace(/"/g, '""')}"`
      ].join(",");
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...lines].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Bao_Cao_OCR_Dat_Dai_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col text-slate-800 font-sans">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Banner Introduction */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-rose-950 text-white rounded-2xl p-6 sm:p-8 shadow-md mb-8 relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-400 to-transparent"></div>
          <div className="max-w-3xl relative z-10">
            <span className="text-[11px] font-bold tracking-wider uppercase px-2.5 py-1 bg-rose-500/20 text-rose-300 rounded-full border border-rose-500/30">
              CÔNG NGHỆ OCR AI THỜI GIAN THỰC
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-3 tracking-tight">
              Xác Thực & So Khớp Thông Tin Sổ Đỏ Tự Động
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-2 leading-relaxed">
              Nhập thông tin người dùng/thửa đất cần kiểm tra, gửi bản gốc hoặc ảnh chụp Sổ đỏ của bạn lên. Hệ thống sử dụng công nghệ nhận dạng ký tự quang học thông minh (AI OCR) dựa trên mô hình Gemini để trích xuất dữ liệu, phát hiện gian lận và đối sánh tính chính xác ngay lập tức.
            </p>
          </div>
        </div>

        {/* Navigation Selector (Segmented Tabs) - Hidden during print */}
        <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-100 mb-8 no-print max-w-lg">
          <button
            type="button"
            id="nav-tab-ocr"
            onClick={() => setCurrentView("ocr_dashboard")}
            className={`flex-1 py-3 text-center rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              currentView === "ocr_dashboard"
                ? "bg-slate-900 text-white shadow-md font-extrabold"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <Scan className="w-4 h-4" /> Kính So Khớp & Thẩm Định OCR
          </button>
          
          <button
            type="button"
            id="nav-tab-form15"
            onClick={() => {
              setCurrentView("form15_manager");
              setSelectedForm15RecordId(null);
            }}
            className={`flex-1 py-3 text-center rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              currentView === "form15_manager"
                ? "bg-slate-900 text-white shadow-md font-extrabold"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <Printer className="w-4 h-4" /> Biên Soạn & In Đơn Mẫu Số 15
          </button>
        </div>

        {currentView === "ocr_dashboard" ? (
          <>
            {/* Master Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Side: Input Form & File Upload (7 Columns) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Step 1: Input Targets */}
            <div id="step-1-card" className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <div className="flex items-center space-x-2.5 mb-5 border-b border-slate-100 pb-3">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm sm:text-base">Thông Tin Cần Đối Chiếu</h3>
                  <p className="text-xs text-slate-500">Nhập dữ liệu gốc từ hệ thống hoặc hợp đồng để so khớp</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-500" />
                    Số thửa đất *
                  </label>
                  <input
                    type="text"
                    name="plotNumber"
                    id="input-plot-number"
                    value={formValues.plotNumber}
                    onChange={handleInputChange}
                    placeholder="Ví dụ: 124"
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50 hover:bg-slate-50 transition-colors text-slate-800 font-medium"
                    required
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Ghi trong mục II.1.a trên sổ</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
                    Số CCCD chủ đất *
                  </label>
                  <input
                    type="text"
                    name="identityNumber"
                    id="input-identity-number"
                    value={formValues.identityNumber}
                    onChange={handleInputChange}
                    placeholder="Ví dụ: 031095012345"
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50 hover:bg-slate-50 transition-colors text-slate-800 font-mono"
                    required
                  />
                  <p className="text-[10px] text-slate-400 mt-1">CMND/CCCD của chủ sổ đỏ</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-indigo-500" />
                    Số điện thoại liên hệ
                  </label>
                  <input
                    type="text"
                    name="phoneNumber"
                    id="input-phone-number"
                    value={formValues.phoneNumber}
                    onChange={handleInputChange}
                    placeholder="Ví dụ: 0912345678"
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50 hover:bg-slate-50 transition-colors text-slate-800 font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Hệ thống sẽ rà soát từ tệp đính kèm</p>
                </div>
              </div>
            </div>

            {/* Step 2: Source Documents */}
            <div id="step-2-card" className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs">
                    2
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm sm:text-base">Tải Bản Gốc Sổ Đỏ Lên</h3>
                    <p className="text-xs text-slate-500">Tải lên nhiều trang/mặt sổ đỏ khác nhau cùng lúc</p>
                  </div>
                </div>
                
                {/* Reset Image Button */}
                {uploadedImages.length > 0 && (
                  <button
                    type="button"
                    id="reset-preview-btn"
                    onClick={handleReset}
                    className="text-xs text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Xóa tất cả ({uploadedImages.length})
                  </button>
                )}
              </div>

              {/* Mode Tabs */}
              <div className="flex border-b border-slate-100 mb-5">
                <button
                  type="button"
                  id="tab-simulator"
                  onClick={() => { setActiveTab("simulator"); stopCamera(); }}
                  className={`flex-1 pb-3 text-xs font-semibold text-center border-b-2 transition-all ${
                    activeTab === "simulator"
                      ? "border-rose-600 text-rose-700"
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Giả lập Sổ Đỏ (Nhanh)
                  </div>
                </button>
                
                <button
                  type="button"
                  id="tab-upload"
                  onClick={() => { setActiveTab("upload"); stopCamera(); }}
                  className={`flex-1 pb-3 text-xs font-semibold text-center border-b-2 transition-all ${
                    activeTab === "upload"
                      ? "border-rose-600 text-rose-700"
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <UploadCloud className="w-3.5 h-3.5" /> Tải tệp lên
                  </div>
                </button>

                <button
                  type="button"
                  id="tab-camera"
                  onClick={() => { setActiveTab("camera"); startCamera(); }}
                  className={`flex-1 pb-3 text-xs font-semibold text-center border-b-2 transition-all ${
                    activeTab === "camera"
                      ? "border-rose-600 text-rose-700"
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <Camera className="w-3.5 h-3.5" /> Chụp ảnh camera
                  </div>
                </button>
              </div>

              {/* Tab Contents */}
              <div className="mb-5">
                
                {/* 1. SIMULATOR TAB */}
                {activeTab === "simulator" && (
                  <div className="space-y-4">
                    <LandCertificateSimulator 
                      onGenerate={handleSimulatedImage} 
                      formValues={formValues} 
                    />
                  </div>
                )}

                {/* 2. UPLOAD FILE TAB */}
                {activeTab === "upload" && (
                  <div>
                    <div
                      id="drag-drop-zone"
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                        isDragActive
                          ? "border-rose-500 bg-rose-50/30"
                          : "border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="file"
                        id="file-uploader-input"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        multiple
                        className="hidden"
                      />
                      <div className="mx-auto w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 mb-2">
                        <UploadCloud className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-semibold text-slate-700">Kéo thả các tệp hoặc nhấp để chọn ảnh</p>
                      <p className="text-[10px] text-slate-400 mt-1">Hỗ trợ tải lên nhiều mặt, nhiều trang cùng lúc</p>
                    </div>
                  </div>
                )}

                {/* 3. CAMERA TAB */}
                {activeTab === "camera" && (
                  <div className="space-y-4">
                    {cameraActive ? (
                      <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-black aspect-video max-w-md mx-auto">
                        <video
                          id="camera-stream-video"
                          ref={videoRef}
                          autoPlay
                          playsInline
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
                          <button
                            type="button"
                            id="capture-camera-btn"
                            onClick={capturePhoto}
                            className="bg-rose-600 hover:bg-rose-700 text-white rounded-full px-5 py-2.5 text-xs font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2 border border-rose-500 cursor-pointer"
                          >
                            <Camera className="w-4 h-4" /> Chụp thêm trang
                          </button>
                          <button
                            type="button"
                            id="stop-camera-btn"
                            onClick={stopCamera}
                            className="bg-slate-800 hover:bg-slate-700 text-white rounded-full px-4 py-2.5 text-xs font-semibold shadow-md transition-all cursor-pointer"
                          >
                            Xong
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center p-6 border border-dashed border-slate-200 bg-slate-50 rounded-2xl max-w-md mx-auto">
                        <button
                          type="button"
                          id="start-camera-btn"
                          onClick={startCamera}
                          className="py-3 px-6 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-xl shadow-sm transition-all inline-flex items-center gap-2 cursor-pointer"
                        >
                          <Camera className="w-4 h-4" /> Kích hoạt Camera chụp tài liệu
                        </button>
                      </div>
                    )}
                  </div>
                )}

              </div>

              {/* Multi-Image Thumbnails Grid */}
              {uploadedImages.length > 0 && (
                <div className="border-t border-slate-100 pt-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                      <span>Các trang sổ đỏ đã nạp ({uploadedImages.length}):</span>
                    </p>
                    <span className="text-[10px] text-slate-400 italic">Nhấp vào hình để phóng to xem trước</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-3 items-center">
                    {uploadedImages.map((img, idx) => {
                      const isSelected = selectedImageId === img.id || (selectedImageId === null && idx === 0);
                      return (
                        <div
                          key={img.id}
                          onClick={() => setSelectedImageId(img.id)}
                          className={`group relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl border-2 overflow-hidden cursor-pointer transition-all ${
                            isSelected 
                              ? "border-rose-500 ring-2 ring-rose-500/10 shadow-sm" 
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <img src={img.preview} alt={`Trang ${idx + 1}`} className="w-full h-full object-cover animate-fade-in" />
                          <div className="absolute inset-x-0 bottom-0 bg-black/60 text-[9px] text-white font-medium text-center py-0.5">
                            Trang {idx + 1}
                          </div>
                          
                          {/* Delete Page Button */}
                          <button
                            type="button"
                            onClick={(e) => handleRemoveImage(img.id, e)}
                            className="absolute top-1 right-1 w-4 h-4 bg-rose-600 hover:bg-rose-700 text-white rounded-full flex items-center justify-center shadow-sm z-10 cursor-pointer"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      );
                    })}

                    {/* Quick Add Plus Card */}
                    <button
                      type="button"
                      onClick={() => {
                        if (activeTab === "upload") {
                          fileInputRef.current?.click();
                        } else if (activeTab === "camera") {
                          startCamera();
                        } else {
                          setActiveTab("upload");
                          setTimeout(() => fileInputRef.current?.click(), 100);
                        }
                      }}
                      className="w-16 h-16 sm:w-20 sm:h-20 border-2 border-dashed border-slate-200 hover:border-slate-300 rounded-xl flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="text-[9px] font-bold">Thêm trang</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Show preview of the currently active/selected image */}
              {imagePreview && (
                <div className="pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Đang chọn xem: <span className="text-slate-800 font-bold">{uploadedFileName}</span></span>
                    </p>
                    <span className="text-[10px] text-slate-400 uppercase bg-slate-100 px-1.5 py-0.5 rounded font-mono">{imageMimeType.split("/")[1]}</span>
                  </div>
                  <div className="relative border border-slate-200 rounded-xl overflow-hidden bg-slate-900 shadow-inner max-h-[350px] flex justify-center items-center">
                    <img 
                      id="document-loaded-preview"
                      src={imagePreview} 
                      alt="Xem trước sổ đỏ" 
                      className="max-h-[350px] object-contain w-auto transition-transform" 
                    />
                    
                    {/* Scanner Effect Layer */}
                    {loading && (
                      <div className="absolute inset-0 bg-black/40 flex flex-col justify-center items-center pointer-events-none">
                        {/* Scanning Laser Line */}
                        <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent shadow-[0_0_12px_#ef4444] animate-scan-line"></div>
                        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-col items-center gap-2 max-w-xs text-center shadow-2xl scale-95 sm:scale-100">
                          <Scan className="w-8 h-8 text-rose-500 animate-pulse" />
                          <p className="text-xs font-semibold text-white">Đang Quét Tài Liệu OCR...</p>
                          <p className="text-[10px] text-rose-300 font-mono transition-all px-2 py-1 bg-rose-950/40 rounded-lg">{loadingStep}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action trigger button */}
              {uploadedImages.length > 0 && (
                <div className="mt-6">
                  <button
                    type="button"
                    id="trigger-verification-btn"
                    onClick={runVerification}
                    disabled={loading}
                    className={`w-full py-3.5 px-6 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      loading 
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                        : "bg-slate-900 hover:bg-slate-800 text-white hover:shadow-lg"
                    }`}
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Đang chạy nhận diện AI cho {uploadedImages.length} trang...
                      </>
                    ) : (
                      <>
                        <Scan className="w-4 h-4" /> Kích hoạt So khớp & Xác thực {uploadedImages.length} trang tự động
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* General instruction cards */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 flex gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 flex-shrink-0">
                <Info className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800 mb-1">Mẹo thực tế khi kiểm tra Sổ đỏ</h4>
                <ul className="text-[11px] text-slate-500 space-y-1 list-disc pl-4 leading-relaxed">
                  <li><strong>Số thửa đất</strong> nằm trong mục "II. Thửa đất..." và phải khớp chính xác trên hệ thống.</li>
                  <li><strong>Số CCCD</strong> phải đúng của chủ sử dụng ghi ở phần "I. Người sử dụng đất...".</li>
                  <li>Hầu hết Sổ đỏ <strong>không chứa số điện thoại</strong> của chủ sở hữu, AI sẽ tự động phân tích và đưa ra lý giải phù hợp nếu không thấy số điện thoại trên văn bản gốc.</li>
                </ul>
              </div>
            </div>

          </div>

          {/* Right Side: OCR Analysis & Results (5 Columns) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Error alerts */}
            {error && (
              <div id="error-message-box" className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex gap-3 text-rose-800">
                <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold">Đã có lỗi xảy ra</h4>
                  <p className="text-[11px] text-rose-600 mt-1 leading-normal">{error}</p>
                </div>
              </div>
            )}

            {/* Waiting/Empty state */}
            {!ocrResult && !loading && (
              <div className="bg-white rounded-2xl p-8 border border-slate-100 text-center flex flex-col items-center justify-center min-h-[400px]">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 mb-4 animate-bounce-slow">
                  <Scan className="w-7 h-7 text-slate-400" />
                </div>
                <h3 className="font-bold text-slate-700 text-sm">Chưa có kết quả xác thực</h3>
                <p className="text-xs text-slate-400 mt-2 max-w-xs leading-relaxed">
                  Vui lòng nhập thông tin cần đối chiếu ở cột trái, chọn nguồn ảnh và ấn nút <span className="font-semibold text-rose-600">"Kích hoạt So khớp & Xác thực"</span> để bắt đầu.
                </p>
                <div className="mt-6 flex flex-col gap-2 w-full max-w-[240px]">
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 text-left bg-slate-50 p-2 rounded-lg">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0"></span>
                    <span>Hệ thống sử dụng Gemini OCR để đọc ảnh thực tế</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 text-left bg-slate-50 p-2 rounded-lg">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0"></span>
                    <span>Tốc độ xử lý trích xuất chỉ mất khoảng 2-3s</span>
                  </div>
                </div>
              </div>
            )}

            {/* Loading placeholder */}
            {loading && (
              <div className="bg-white rounded-2xl p-8 border border-slate-100 text-center flex flex-col items-center justify-center min-h-[400px]">
                <div className="relative w-16 h-16 mb-5">
                  <div className="absolute inset-0 border-4 border-rose-100 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-rose-600 rounded-full border-t-transparent animate-spin"></div>
                </div>
                <h3 className="font-bold text-slate-700 text-sm">AI đang quét dữ liệu...</h3>
                <p className="text-xs text-rose-600 mt-1 font-semibold">{loadingStep.substring(2)}</p>
                <p className="text-[11px] text-slate-400 mt-3 max-w-xs leading-relaxed">
                  Quá trình xử lý bao gồm việc chạy thuật toán OCR thông minh, bóc tách cấu trúc văn bản hành chính Việt Nam và so khớp từng trường thông tin.
                </p>
              </div>
            )}

            {/* Actual Result Panel */}
            {ocrResult && (
              <div id="ocr-results-container" className="space-y-6">
                
                {/* 1. Header Validation Status */}
                <div className={`p-6 rounded-2xl border text-white shadow-lg transition-all ${
                  ocrResult.isOverallValid
                    ? "bg-gradient-to-br from-emerald-800 to-teal-950 border-emerald-700"
                    : "bg-gradient-to-br from-amber-700 to-rose-900 border-rose-850"
                }`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold tracking-wider uppercase bg-white/20 px-2 py-0.5 rounded-full">
                        KẾT QUẢ ĐỐI SÁNH CUỐI CÙNG
                      </span>
                      <h4 className="text-xl font-extrabold mt-2 tracking-tight">
                        {ocrResult.isOverallValid 
                          ? "Thông Tin Khớp Hoàn Toàn" 
                          : "Phát Hiện Điểm Không Trùng Khớp"
                        }
                      </h4>
                      <p className="text-xs text-white/80 mt-1 leading-relaxed">
                        {ocrResult.isOverallValid
                          ? "Mọi thông tin cốt lõi (Số thửa đất, Số định danh CCCD) trích xuất từ tài liệu Sổ đỏ đều khớp chính xác với dữ liệu yêu cầu."
                          : "Có sự sai lệch hoặc thiếu thông tin giữa tài liệu Sổ đỏ đã tải lên và dữ liệu yêu cầu đối chiếu."
                        }
                      </p>
                    </div>

                    <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
                      {ocrResult.isOverallValid ? (
                        <CheckCircle2 className="w-7 h-7 text-emerald-300" />
                      ) : (
                        <AlertCircle className="w-7 h-7 text-amber-300" />
                      )}
                    </div>
                  </div>

                  {/* Document Type Warning */}
                  {!ocrResult.isLandCertificate && (
                    <div className="mt-4 p-3 bg-red-950/40 border border-red-500/20 rounded-xl flex items-start gap-2 text-rose-200">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <p className="text-[11px] leading-relaxed">
                        <strong>Cảnh báo tài liệu:</strong> AI nhận định hình ảnh tải lên có thể không phải là một văn bản Sổ đỏ/Sổ hồng chính thức của Việt Nam. Vui lòng kiểm tra lại.
                      </p>
                    </div>
                  )}
                </div>

                {/* 2. Key comparison fields detailed list */}
                <div id="comparison-fields-panel" className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
                  <h4 className="font-bold text-slate-800 text-xs sm:text-sm tracking-tight flex items-center gap-2">
                    <Scan className="w-4 h-4 text-rose-600" />
                    Báo Cáo So Khớp Chi Tiết
                  </h4>

                  {/* Plot number field result */}
                  <div className="p-3.5 bg-slate-50/50 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
                        Số thửa đất
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        ocrResult.comparison.plotNumberMatch.isMatched
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                          : "bg-rose-50 text-rose-700 border border-rose-100"
                      }`}>
                        {ocrResult.comparison.plotNumberMatch.isMatched ? (
                          <>
                            <Check className="w-3 h-3" /> TRÙNG KHỚP
                          </>
                        ) : (
                          <>
                            <X className="w-3 h-3" /> KHÔNG KHỚP
                          </>
                        )}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs mb-2 bg-white p-2 rounded-lg border border-slate-100/80">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Bản gốc Sổ Đỏ</span>
                        <span className="font-semibold text-slate-800 font-mono">
                          {ocrResult.comparison.plotNumberMatch.extracted || "Chưa trích xuất"}
                        </span>
                      </div>
                      <div className="border-l border-slate-100 pl-2">
                        <span className="text-[10px] text-slate-400 block font-medium">Người dùng nhập</span>
                        <span className="font-semibold text-slate-800 font-mono">
                          {ocrResult.comparison.plotNumberMatch.inputted || "Trống"}
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed pl-1 flex items-start gap-1">
                      <CornerDownRight className="w-3 h-3 text-slate-400 mt-0.5 flex-shrink-0" />
                      <span>{ocrResult.comparison.plotNumberMatch.explanation}</span>
                    </p>
                  </div>

                  {/* Identity number field result */}
                  <div className="p-3.5 bg-slate-50/50 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                        Số định danh CCCD/CMND
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        ocrResult.comparison.ownerIdMatch.isMatched
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                          : "bg-rose-50 text-rose-700 border border-rose-100"
                      }`}>
                        {ocrResult.comparison.ownerIdMatch.isMatched ? (
                          <>
                            <Check className="w-3 h-3" /> TRÙNG KHỚP
                          </>
                        ) : (
                          <>
                            <X className="w-3 h-3" /> KHÔNG KHỚP
                          </>
                        )}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs mb-2 bg-white p-2 rounded-lg border border-slate-100/80">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Bản gốc Sổ Đỏ</span>
                        <span className="font-semibold text-slate-800 font-mono">
                          {ocrResult.comparison.ownerIdMatch.extracted || "Chưa trích xuất"}
                        </span>
                      </div>
                      <div className="border-l border-slate-100 pl-2">
                        <span className="text-[10px] text-slate-400 block font-medium">Người dùng nhập</span>
                        <span className="font-semibold text-slate-800 font-mono">
                          {ocrResult.comparison.ownerIdMatch.inputted || "Trống"}
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed pl-1 flex items-start gap-1">
                      <CornerDownRight className="w-3 h-3 text-slate-400 mt-0.5 flex-shrink-0" />
                      <span>{ocrResult.comparison.ownerIdMatch.explanation}</span>
                    </p>
                  </div>

                  {/* Phone number field result */}
                  <div className="p-3.5 bg-slate-50/50 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        Số điện thoại liên hệ
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        ocrResult.comparison.phoneMatch.isMatched
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                          : "bg-amber-50 text-amber-700 border border-amber-100"
                      }`}>
                        {ocrResult.comparison.phoneMatch.isMatched ? "TRÙNG KHỚP" : "BÌNH THƯỜNG / LỆCH"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs mb-2 bg-white p-2 rounded-lg border border-slate-100/80">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Bản gốc Sổ Đỏ</span>
                        <span className="font-semibold text-slate-800 font-mono">
                          {ocrResult.comparison.phoneMatch.extracted || "Không tìm thấy"}
                        </span>
                      </div>
                      <div className="border-l border-slate-100 pl-2">
                        <span className="text-[10px] text-slate-400 block font-medium">Người dùng nhập</span>
                        <span className="font-semibold text-slate-800 font-mono">
                          {ocrResult.comparison.phoneMatch.inputted || "Trống"}
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed pl-1 flex items-start gap-1">
                      <CornerDownRight className="w-3 h-3 text-slate-400 mt-0.5 flex-shrink-0" />
                      <span>{ocrResult.comparison.phoneMatch.explanation}</span>
                    </p>
                  </div>

                </div>

                {/* 3. Detailed Extracted Data from Certificate */}
                <div id="extracted-metadata-panel" className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
                  <h4 className="font-bold text-slate-800 text-xs sm:text-sm tracking-tight flex items-center gap-2">
                    <Compass className="w-4 h-4 text-emerald-600" />
                    Thông Tin Trích Xuất Từ Bản Gốc
                  </h4>

                  <div className="space-y-2.5">
                    
                    <div className="flex items-start justify-between py-2 border-b border-slate-100">
                      <span className="text-xs text-slate-500">Chủ sở hữu ghi trên sổ:</span>
                      <span className="text-xs font-bold text-slate-900 text-right uppercase">
                        {ocrResult.extractedData.ownerName || "Không tìm thấy"}
                      </span>
                    </div>

                    <div className="flex items-start justify-between py-2 border-b border-slate-100">
                      <span className="text-xs text-slate-500">Số định danh / CMND:</span>
                      <span className="text-xs font-semibold text-slate-900 text-right font-mono">
                        {ocrResult.extractedData.ownerId || "Không tìm thấy"}
                      </span>
                    </div>

                    <div className="flex items-start justify-between py-2 border-b border-slate-100">
                      <span className="text-xs text-slate-500">Số thửa đất trích xuất:</span>
                      <span className="text-xs font-semibold text-slate-900 text-right">
                        Thửa số {ocrResult.extractedData.plotNumber || "Không tìm thấy"}
                      </span>
                    </div>

                    <div className="flex items-start justify-between py-2 border-b border-slate-100">
                      <span className="text-xs text-slate-500">Số tờ bản đồ:</span>
                      <span className="text-xs font-semibold text-slate-900 text-right">
                        Tờ bản đồ số {ocrResult.extractedData.mapSheetNumber || "N/A"}
                      </span>
                    </div>

                    <div className="flex items-start justify-between py-2 border-b border-slate-100">
                      <span className="text-xs text-slate-500">Diện tích đất:</span>
                      <span className="text-xs font-semibold text-slate-900 text-right">
                        {ocrResult.extractedData.area || "N/A"}
                      </span>
                    </div>

                    <div className="flex items-start justify-between py-2 border-b border-slate-100">
                      <span className="text-xs text-slate-500">Địa chỉ thửa đất:</span>
                      <span className="text-xs font-semibold text-slate-900 text-right max-w-[200px] leading-tight">
                        {ocrResult.extractedData.address || "N/A"}
                      </span>
                    </div>

                    <div className="flex items-start justify-between py-2">
                      <span className="text-xs text-slate-500">Ngày ký cấp:</span>
                      <span className="text-xs font-semibold text-slate-900 text-right">
                        {ocrResult.extractedData.issueDate || "N/A"}
                      </span>
                    </div>

                  </div>
                </div>

                {/* 4. Natural Text Summary by Gemini */}
                <div id="ai-summary-narrative" className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                  <h4 className="font-bold text-slate-800 text-xs sm:text-sm tracking-tight mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-rose-600" />
                    Bản Dịch & Nhận Định Tổng Quan (AI)
                  </h4>
                  <div className="bg-rose-50/20 p-4 rounded-xl border border-rose-100/50">
                    <p className="text-xs text-slate-600 leading-relaxed font-medium whitespace-pre-line">
                      {ocrResult.summary}
                    </p>
                  </div>
                </div>

                {/* 5. Correction and Save Section */}
                <div id="correction-and-save-panel" className="bg-gradient-to-br from-indigo-50/60 to-slate-50 rounded-2xl p-6 border border-indigo-100 shadow-sm space-y-4">
                  <h4 className="font-bold text-slate-800 text-xs sm:text-sm tracking-tight flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-indigo-600" />
                    Hiệu Chỉnh & Lưu Dữ Liệu Scan
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Nếu kết quả trích xuất bị thiếu hoặc có điểm chưa đúng, bạn hãy sửa trực tiếp vào biểu mẫu dưới đây trước khi lưu chính thức vào Cơ sở dữ liệu.
                  </p>

                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Chủ sử dụng đất</label>
                        <input
                          type="text"
                          value={saveForm.ownerName}
                          onChange={(e) => setSaveForm(prev => ({ ...prev, ownerName: e.target.value }))}
                          className="w-full text-xs px-2.5 py-2 border border-slate-200 rounded-lg bg-white text-slate-800 font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Số CCCD / CMND</label>
                        <input
                          type="text"
                          value={saveForm.ownerId}
                          onChange={(e) => setSaveForm(prev => ({ ...prev, ownerId: e.target.value }))}
                          className="w-full text-xs px-2.5 py-2 border border-slate-200 rounded-lg bg-white text-slate-800 font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Số điện thoại</label>
                        <input
                          type="text"
                          value={saveForm.phoneNumber}
                          onChange={(e) => setSaveForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                          className="w-full text-xs px-2.5 py-2 border border-slate-200 rounded-lg bg-white text-slate-800 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Số thửa đất</label>
                        <input
                          type="text"
                          value={saveForm.plotNumber}
                          onChange={(e) => setSaveForm(prev => ({ ...prev, plotNumber: e.target.value }))}
                          className="w-full text-xs px-2.5 py-2 border border-slate-200 rounded-lg bg-white text-slate-800 font-mono font-semibold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Số tờ bản đồ</label>
                        <input
                          type="text"
                          value={saveForm.mapSheetNumber}
                          onChange={(e) => setSaveForm(prev => ({ ...prev, mapSheetNumber: e.target.value }))}
                          className="w-full text-xs px-2.5 py-2 border border-slate-200 rounded-lg bg-white text-slate-800 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Diện tích (m2)</label>
                        <input
                          type="text"
                          value={saveForm.area}
                          onChange={(e) => setSaveForm(prev => ({ ...prev, area: e.target.value }))}
                          className="w-full text-xs px-2.5 py-2 border border-slate-200 rounded-lg bg-white text-slate-800"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Địa chỉ thửa đất</label>
                      <input
                        type="text"
                        value={saveForm.address}
                        onChange={(e) => setSaveForm(prev => ({ ...prev, address: e.target.value }))}
                        className="w-full text-xs px-2.5 py-2 border border-slate-200 rounded-lg bg-white text-slate-800"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Ngày ký cấp</label>
                        <input
                          type="text"
                          value={saveForm.issueDate}
                          onChange={(e) => setSaveForm(prev => ({ ...prev, issueDate: e.target.value }))}
                          className="w-full text-xs px-2.5 py-2 border border-slate-200 rounded-lg bg-white text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Phân loại / Trạng thái</label>
                        <select
                          value={saveForm.status}
                          onChange={(e) => setSaveForm(prev => ({ ...prev, status: e.target.value as any }))}
                          className="w-full text-xs px-2.5 py-2 border border-slate-200 rounded-lg bg-white text-slate-700 font-semibold focus:outline-none"
                        >
                          <option value="matched">Khớp hoàn toàn (Matched)</option>
                          <option value="mismatched">Có điểm lệch (Mismatched)</option>
                          <option value="manual">Nhập thủ công (Manual)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Ghi chú thêm</label>
                      <input
                        type="text"
                        value={saveForm.notes}
                        onChange={(e) => setSaveForm(prev => ({ ...prev, notes: e.target.value }))}
                        className="w-full text-xs px-2.5 py-2 border border-slate-200 rounded-lg bg-white text-slate-800"
                        placeholder="Thêm lưu ý nghiệp vụ..."
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleSaveOcrRecord}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                    >
                      <Plus className="w-4 h-4" /> Tạo Dữ Liệu Riêng & Lưu Bản Ghi
                    </button>
                  </div>
                </div>

              </div>
            )}

          </div>

        </div>

        {/* DATABASE STORAGE SECTION */}
        <div id="private-database-section" className="mt-12 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 text-base sm:text-lg">Cơ Sử Dữ Liệu Đất Đai Đã Xác Thực</h3>
                <p className="text-xs text-slate-500">Danh sách các thửa đất đã quét OCR thành công hoặc tự nhập liệu báo cáo</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditingRecordId(null);
                  setManualForm({
                    plotNumber: "",
                    mapSheetNumber: "",
                    ownerName: "",
                    ownerId: "",
                    address: "",
                    area: "",
                    issueDate: "",
                    phoneNumber: "",
                    status: "manual",
                    notes: "",
                    origin: ""
                  });
                  setShowManualModal(true);
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Thêm Bản Ghi Thủ Công
              </button>

              <button
                type="button"
                onClick={handleExportCSV}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" /> Xuất Báo Cáo Excel (CSV)
              </button>
            </div>
          </div>

          {/* Table of Records */}
          {savedRecords.length === 0 ? (
            <div className="text-center py-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <Database className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-xs font-semibold text-slate-600">Chưa có bản ghi nào được tạo</p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                Hãy tiến hành scan Sổ đỏ ở trên và click "Lưu Bản Ghi" hoặc nhấp vào "Thêm Bản Ghi Thủ Công" để bắt đầu xây dựng cơ sở dữ liệu.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="p-3 text-[11px] font-bold text-slate-500 uppercase">Mã / Ngày Tạo</th>
                    <th className="p-3 text-[11px] font-bold text-slate-500 uppercase">Thông Tin Thửa</th>
                    <th className="p-3 text-[11px] font-bold text-slate-500 uppercase">Chủ Đất (CCCD)</th>
                    <th className="p-3 text-[11px] font-bold text-slate-500 uppercase">Số Điện Thoại</th>
                    <th className="p-3 text-[11px] font-bold text-slate-500 uppercase">Đặc Điểm Thửa Đất</th>
                    <th className="p-3 text-[11px] font-bold text-slate-500 uppercase text-center">Xác Thực</th>
                    <th className="p-3 text-[11px] font-bold text-slate-500 uppercase">Ghi Chú</th>
                    <th className="p-3 text-[11px] font-bold text-slate-500 uppercase text-center">Hành Động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {savedRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3 space-y-0.5">
                        <span className="font-mono text-indigo-600 font-bold block">{record.id}</span>
                        <span className="text-[10px] text-slate-400 font-mono block">{record.verifiedAt}</span>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-800">Thửa số: {record.plotNumber}</div>
                        <div className="text-[10px] text-slate-400">Tờ bản đồ: {record.mapSheetNumber}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-800 uppercase">{record.ownerName || "TRỐNG"}</div>
                        <div className="text-[10px] text-slate-400 font-mono">CCCD: {record.ownerId || "N/A"}</div>
                      </td>
                      <td className="p-3">
                        <span className="font-mono font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                          {record.phoneNumber || "N/A"}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="font-medium text-slate-700">D.Tích: {record.area || "N/A"}</div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[200px]" title={record.address}>{record.address || "Chưa cập nhật địa chỉ"}</div>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                          record.status === "matched" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                          record.status === "mismatched" ? "bg-rose-50 text-rose-700 border-rose-100" :
                          "bg-blue-50 text-blue-700 border-blue-100"
                        }`}>
                          {record.status === "matched" ? "Khớp hoàn toàn" :
                           record.status === "mismatched" ? "Có sai lệch" : "Nhập thủ công"}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500 max-w-[150px] truncate" title={record.notes}>
                        {record.notes || "---"}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedForm15RecordId(record.id);
                              setCurrentView("form15_manager");
                              showToast(`Đã chuyển sang mẫu đơn 15 cho chủ đất ${record.ownerName}!`, "success");
                            }}
                            className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-colors cursor-pointer"
                            title="Xuất đơn Mẫu số 15"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStartEdit(record)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors cursor-pointer"
                            title="Sửa bản ghi"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRecord(record.id)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors cursor-pointer"
                            title="Xóa bản ghi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
          </>
        ) : (
          <Form15Editor 
            savedRecords={savedRecords} 
            onShowToast={showToast} 
            initialRecordId={selectedForm15RecordId}
          />
        )}

      </main>

      {/* MANUAL INPUT / EDIT DIALOG OVERLAY */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5 relative">
            <button 
              type="button"
              onClick={() => setShowManualModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                <Database className="w-4 h-4" />
              </div>
              <h3 className="font-extrabold text-slate-800 text-base">
                {editingRecordId ? "Cập Nhật Thông Tin Thửa Đất" : "Thêm Bản Ghi Đất Đai Thủ Công"}
              </h3>
            </div>

            <form onSubmit={handleSaveManualRecord} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Số thửa đất *</label>
                  <input
                    type="text"
                    required
                    value={manualForm.plotNumber}
                    onChange={(e) => setManualForm(prev => ({ ...prev, plotNumber: e.target.value }))}
                    className="w-full text-xs px-2.5 py-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="Ví dụ: 124"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Số tờ bản đồ</label>
                  <input
                    type="text"
                    value={manualForm.mapSheetNumber}
                    onChange={(e) => setManualForm(prev => ({ ...prev, mapSheetNumber: e.target.value }))}
                    className="w-full text-xs px-2.5 py-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="Ví dụ: 18"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Chủ sở hữu đất *</label>
                  <input
                    type="text"
                    required
                    value={manualForm.ownerName}
                    onChange={(e) => setManualForm(prev => ({ ...prev, ownerName: e.target.value }))}
                    className="w-full text-xs px-2.5 py-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="Họ và tên viết hoa"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Số CCCD / CMND *</label>
                  <input
                    type="text"
                    required
                    value={manualForm.ownerId}
                    onChange={(e) => setManualForm(prev => ({ ...prev, ownerId: e.target.value }))}
                    className="w-full text-xs px-2.5 py-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
                    placeholder="031095012345"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    value={manualForm.phoneNumber}
                    onChange={(e) => setManualForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    className="w-full text-xs px-2.5 py-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
                    placeholder="0912345678"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Diện tích (m2)</label>
                  <input
                    type="text"
                    value={manualForm.area}
                    onChange={(e) => setManualForm(prev => ({ ...prev, area: e.target.value }))}
                    className="w-full text-xs px-2.5 py-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="Ví dụ: 150.5 m2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Địa chỉ thửa đất</label>
                <input
                  type="text"
                  value={manualForm.address}
                  onChange={(e) => setManualForm(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full text-xs px-2.5 py-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Xã, Huyện, Tỉnh..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Ngày ký cấp sổ</label>
                  <input
                    type="text"
                    value={manualForm.issueDate}
                    onChange={(e) => setManualForm(prev => ({ ...prev, issueDate: e.target.value }))}
                    className="w-full text-xs px-2.5 py-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="11/02/2021"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Phân loại dữ liệu</label>
                  <select
                    value={manualForm.status}
                    onChange={(e) => setManualForm(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full text-xs px-2.5 py-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700"
                  >
                    <option value="manual">Nhập thủ công (Manual)</option>
                    <option value="matched">Đã khớp (Matched)</option>
                    <option value="mismatched">Có sai lệch (Mismatched)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nguồn gốc sử dụng đất</label>
                <input
                  type="text"
                  value={manualForm.origin || ""}
                  onChange={(e) => setManualForm(prev => ({ ...prev, origin: e.target.value }))}
                  className="w-full text-xs px-2.5 py-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Ví dụ: Công nhận quyền sử dụng đất như giao đất có thu tiền, Nhận chuyển nhượng..."
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Ghi chú nội bộ</label>
                <textarea
                  value={manualForm.notes}
                  onChange={(e) => setManualForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full text-xs px-2.5 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 h-16"
                  placeholder="Nhập thông tin ghi chú khác..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm cursor-pointer"
                >
                  {editingRecordId ? "Cập Nhật Ngay" : "Lưu Bản Ghi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-fade-in">
          <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-white font-medium text-xs border ${
            toast.type === "success" 
              ? "bg-emerald-600 border-emerald-500" 
              : toast.type === "error" 
                ? "bg-rose-600 border-rose-500" 
                : "bg-slate-800 border-slate-700"
          }`}>
            {toast.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-200" />}
            {toast.type === "error" && <XCircle className="w-4 h-4 text-rose-200" />}
            {toast.type === "info" && <Info className="w-4 h-4 text-sky-200" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {recordToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
              <Trash2 className="w-6 h-6" />
            </div>
            
            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-800 text-base">Xác nhận xóa bản ghi</h3>
              <p className="text-xs text-slate-500">
                Bạn có chắc chắn muốn xóa bản ghi đất đai có mã <span className="font-mono font-bold text-indigo-600">{recordToDelete}</span>? Hành động này không thể hoàn tác.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRecordToDelete(null)}
                className="flex-1 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={confirmDeleteRecord}
                className="flex-1 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-sm cursor-pointer"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Styled Footer */}
      <footer id="app-footer" className="bg-white border-t border-slate-100 mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-400 space-y-2">
          <p>© 2026 Hệ thống xác thực Sổ đỏ tự động bằng công nghệ AI OCR.</p>
          <p>Mô hình xử lý chính: <span className="font-medium text-slate-500">Gemini 3.5 Flash</span> - Cập nhật dữ liệu thời gian thực thông qua API bảo mật.</p>
        </div>
      </footer>
    </div>
  );
}
