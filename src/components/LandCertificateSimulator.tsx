import { useState, useEffect, useRef } from "react";
import { SimulationParams } from "../types";
import { Sparkles, FileText, RefreshCw, Check, AlertTriangle } from "lucide-react";
import { motion } from "motion/react";

interface LandCertificateSimulatorProps {
  onGenerate: (base64Image: string, params: SimulationParams) => void;
  formValues: {
    plotNumber: string;
    identityNumber: string;
  };
}

export default function LandCertificateSimulator({ onGenerate, formValues }: LandCertificateSimulatorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Default values
  const [params, setParams] = useState<SimulationParams>({
    ownerName: "NGUYỄN VĂN AN",
    identityNumber: formValues.identityNumber || "031095012345",
    plotNumber: formValues.plotNumber || "124",
    mapSheetNumber: "18",
    area: "125.5",
    address: "Số 45 Đường Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
    issueDate: "12 tháng 05 năm 2024"
  });

  const [preset, setPreset] = useState<"match" | "wrongPlot" | "wrongId" | "custom">("match");

  // Sync inputs when form values change, if in "match" mode
  useEffect(() => {
    if (preset === "match") {
      setParams(prev => ({
        ...prev,
        plotNumber: formValues.plotNumber || "124",
        identityNumber: formValues.identityNumber || "031095012345"
      }));
    }
  }, [formValues, preset]);

  // Redraw certificate canvas on params change
  useEffect(() => {
    drawCertificate();
  }, [params]);

  const drawCertificate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set A4 dimension ratio (800 x 1130)
    const w = 800;
    const h = 1130;
    canvas.width = w;
    canvas.height = h;

    // 1. Draw warm textured background (cream/soft pinkish-yellow)
    ctx.fillStyle = "#FCF7F2";
    ctx.fillRect(0, 0, w, h);

    // Draw subtle security Guilloche pattern (fine background lines)
    ctx.strokeStyle = "rgba(180, 140, 120, 0.04)";
    ctx.lineWidth = 1;
    for (let i = 0; i < w; i += 15) {
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, i * 1.5, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 2. Draw dual decorative borders
    ctx.strokeStyle = "#C5A880"; // Muted Gold
    ctx.lineWidth = 3;
    ctx.strokeRect(20, 20, w - 40, h - 40);

    ctx.strokeStyle = "#8A1E1E"; // Land Certificate Red/Crimson
    ctx.lineWidth = 1.5;
    ctx.strokeRect(25, 25, w - 50, h - 50);

    // Border corner decorations
    const drawCorner = (x: number, y: number, dirX: number, dirY: number) => {
      ctx.fillStyle = "#8A1E1E";
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + dirX * 30, y);
      ctx.lineTo(x + dirX * 30, y + dirY * 5);
      ctx.lineTo(x + dirX * 5, y + dirY * 5);
      ctx.lineTo(x + dirX * 5, y + dirY * 30);
      ctx.lineTo(x, y + dirY * 30);
      ctx.closePath();
      ctx.fill();
    };
    drawCorner(25, 25, 1, 1);
    drawCorner(w - 25, 25, -1, 1);
    drawCorner(25, h - 25, 1, -1);
    drawCorner(w - 25, h - 25, -1, -1);

    // 3. Header: Country name and motto
    ctx.fillStyle = "#2D3748";
    ctx.font = "bold 15px 'Times New Roman', serif";
    ctx.textAlign = "center";
    ctx.fillText("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", w / 2, 70);

    ctx.font = "bold 13px 'Times New Roman', serif";
    ctx.fillText("Độc lập - Tự do - Hạnh phúc", w / 2, 92);

    // Underline mottos
    ctx.strokeStyle = "#2D3748";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(w / 2 - 90, 102);
    ctx.lineTo(w / 2 + 90, 102);
    ctx.stroke();

    // 4. Document Title in crimson
    ctx.fillStyle = "#A82B2B";
    ctx.font = "bold 23px 'Times New Roman', serif";
    ctx.fillText("GIẤY CHỨNG NHẬN", w / 2, 170);
    ctx.font = "bold 19px 'Times New Roman', serif";
    ctx.fillText("QUYỀN SỬ DỤNG ĐẤT, QUYỀN SỞ HỮU NHÀ Ở", w / 2, 202);
    ctx.fillText("VÀ TÀI SẢN KHÁC GẮN LIỀN VỚI ĐẤT", w / 2, 230);

    // 5. Section I: Owner Details
    ctx.fillStyle = "#8A1E1E";
    ctx.font = "bold 15px 'Times New Roman', serif";
    ctx.textAlign = "left";
    ctx.fillText("I. Người sử dụng đất, chủ sở hữu nhà ở và tài sản khác gắn liền với đất:", 50, 290);

    ctx.fillStyle = "#1A202C";
    ctx.font = "bold 15px 'Times New Roman', serif";
    ctx.fillText(`Ông/Bà: ${params.ownerName}`, 70, 325);

    ctx.font = "normal 14px 'Times New Roman', serif";
    ctx.fillText(`Năm sinh: 1982`, 70, 350);
    ctx.fillText(`Số CMND/CCCD/Hộ chiếu: ${params.identityNumber}`, 70, 375);
    ctx.fillText(`Địa chỉ thường trú: Số 12A Điện Biên Phủ, Quận Ba Đình, Hà Nội`, 70, 400);

    // 6. Section II: Land plot Details
    ctx.fillStyle = "#8A1E1E";
    ctx.font = "bold 15px 'Times New Roman', serif";
    ctx.fillText("II. Thửa đất, nhà ở và tài sản khác gắn liền với đất:", 50, 455);

    ctx.fillStyle = "#1A202C";
    ctx.font = "bold 14px 'Times New Roman', serif";
    ctx.fillText("1. Thửa đất:", 70, 485);

    ctx.font = "normal 14px 'Times New Roman', serif";
    ctx.fillText(`a) Thửa đất số: ${params.plotNumber}`, 90, 510);
    ctx.fillText(`; Tờ bản đồ số: ${params.mapSheetNumber}`, 250, 510);
    ctx.fillText(`b) Địa chỉ: ${params.address}`, 90, 535);
    ctx.fillText(`c) Diện tích: ${params.area} m²`, 90, 560);
    ctx.fillText(`d) Hình thức sử dụng: Sử dụng riêng`, 90, 585);
    ctx.fillText(`đ) Mục đích sử dụng: Đất ở tại đô thị (ODT)`, 90, 610);
    ctx.fillText(`e) Thời hạn sử dụng: Lâu dài`, 90, 635);
    ctx.fillText(`g) Nguồn gốc sử dụng: Công nhận quyền sử dụng đất như giao đất có thu tiền sử dụng đất`, 90, 660);

    // Additional mock sections to make it look official
    ctx.fillStyle = "#8A1E1E";
    ctx.font = "bold 15px 'Times New Roman', serif";
    ctx.fillText("III. Sơ đồ thửa đất, nhà ở và tài sản khác gắn liền với đất:", 50, 710);
    
    // Draw a box for the map illustration
    ctx.strokeStyle = "#CBD5E0";
    ctx.lineWidth = 1;
    ctx.strokeRect(70, 730, 240, 160);
    ctx.fillStyle = "#EDF2F7";
    ctx.fillRect(71, 731, 238, 158);

    // Draw some simple vector lines inside the map box to look like a land plot boundary
    ctx.strokeStyle = "#4A5568";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(100, 760);
    ctx.lineTo(220, 750);
    ctx.lineTo(240, 830);
    ctx.lineTo(120, 850);
    ctx.closePath();
    ctx.stroke();
    
    // Fill the plot visual nicely
    ctx.fillStyle = "rgba(197, 168, 128, 0.2)";
    ctx.fill();

    // Map labels
    ctx.fillStyle = "#4A5568";
    ctx.font = "italic 11px sans-serif";
    ctx.fillText("Thửa " + params.plotNumber, 150, 800);
    ctx.fillText("Đường quy hoạch (8m)", 140, 875);

    // Draw neighbor lines
    ctx.strokeStyle = "rgba(74, 85, 104, 0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(70, 810);
    ctx.lineTo(100, 760);
    ctx.moveTo(220, 750);
    ctx.lineTo(310, 735);
    ctx.stroke();

    // 7. Signature, Date, and Stamp (Bottom right)
    ctx.fillStyle = "#1A202C";
    ctx.font = "italic 14px 'Times New Roman', serif";
    ctx.textAlign = "center";
    ctx.fillText(`TP. Hồ Chí Minh, ngày ${params.issueDate}`, 580, 750);

    ctx.font = "bold 14px 'Times New Roman', serif";
    ctx.fillText("THAY MẶT ỦY BAN NHÂN DÂN", 580, 775);
    ctx.font = "bold 13px 'Times New Roman', serif";
    ctx.fillText("KT. CHỦ TỊCH", 580, 792);
    ctx.fillText("PHÓ CHỦ TỊCH", 580, 807);

    // Draw handwritten-style mock signature in blue
    ctx.strokeStyle = "#1D4ED8"; // Deep Blue Ink
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(520, 860);
    ctx.bezierCurveTo(550, 830, 540, 890, 580, 850);
    ctx.bezierCurveTo(600, 830, 620, 870, 650, 840);
    ctx.stroke();

    ctx.fillStyle = "#1A202C";
    ctx.font = "bold 14px 'Times New Roman', serif";
    ctx.fillText("Lê Văn Bình", 580, 920);

    // Draw a big red stamp (circular)
    ctx.strokeStyle = "rgba(220, 38, 38, 0.75)"; // Red stamp color
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(580, 850, 50, 0, Math.PI * 2);
    ctx.stroke();

    // Inner circle
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(580, 850, 43, 0, Math.PI * 2);
    ctx.stroke();

    // Stamp text inside
    ctx.fillStyle = "rgba(220, 38, 38, 0.75)";
    ctx.font = "bold 8px sans-serif";
    ctx.textAlign = "center";
    
    // Draw curved text (simplified for simplicity with 3 text lines)
    ctx.fillText("ỦY BAN NHÂN DÂN", 580, 825);
    ctx.font = "bold 9px sans-serif";
    ctx.fillText("TP. HỒ CHÍ MINH", 580, 853);
    ctx.font = "bold 7px sans-serif";
    ctx.fillText("SỞ TÀI NGUYÊN & MÔI TRƯỜNG", 580, 880);

    // 8. Footer decoration: Serial number / QR placeholder
    ctx.fillStyle = "#718096";
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Số vào sổ cấp GCN: CH 04812A", 50, 1070);
    ctx.fillText("Mã số vạch định danh: 01928374921", 50, 1090);

    // Draw decorative gold crest pattern in the middle bottom
    ctx.strokeStyle = "rgba(197, 168, 128, 0.4)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(w / 2, 1050, 20, 0, Math.PI * 2);
    ctx.stroke();
  };

  const handlePresetChange = (type: "match" | "wrongPlot" | "wrongId" | "custom") => {
    setPreset(type);
    
    let updatedParams = { ...params };
    
    if (type === "match") {
      updatedParams.plotNumber = formValues.plotNumber || "124";
      updatedParams.identityNumber = formValues.identityNumber || "031095012345";
    } else if (type === "wrongPlot") {
      // Intentionally mismatched plot number (124 in input, but 350 on certificate)
      updatedParams.plotNumber = "350"; 
      updatedParams.identityNumber = formValues.identityNumber || "031095012345";
    } else if (type === "wrongId") {
      // Intentionally mismatched ID number
      updatedParams.plotNumber = formValues.plotNumber || "124";
      updatedParams.identityNumber = "031070999999"; 
    }
    
    setParams(updatedParams);
  };

  const submitGeneratedImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Convert to jpeg base64
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    // Remove prefix 'data:image/jpeg;base64,' to get raw base64 for Gemini API
    const base64Raw = dataUrl.split(",")[1];
    
    onGenerate(base64Raw, params);
  };

  return (
    <div id="land-certificate-simulator-card" className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-rose-600" />
          <h3 className="font-semibold text-slate-800 text-base">Bộ Tạo Sổ Đỏ Giả Lập</h3>
        </div>
        <span className="text-xs bg-rose-50 text-rose-700 font-medium px-2 py-1 rounded-full flex items-center gap-1">
          <FileText className="w-3 h-3" /> Thử nghiệm nhanh
        </span>
      </div>

      <p className="text-xs text-slate-500 mb-5 leading-relaxed">
        Không có sẵn file quét? Sử dụng trình tạo này để giả lập một tờ Sổ đỏ chính thức của Việt Nam bằng Canvas, tùy chỉnh nội dung để kiểm thử thuật toán AI OCR so khớp.
      </p>

      {/* Preset Selectors */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <button
          type="button"
          id="preset-match-btn"
          onClick={() => handlePresetChange("match")}
          className={`py-2 px-1 text-xs rounded-lg border font-medium transition-all ${
            preset === "match"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm"
              : "bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100"
          }`}
        >
          <div className="flex items-center justify-center gap-1">
            <Check className="w-3.5 h-3.5" /> Khớp 100%
          </div>
        </button>

        <button
          type="button"
          id="preset-wrong-plot-btn"
          onClick={() => handlePresetChange("wrongPlot")}
          className={`py-2 px-1 text-xs rounded-lg border font-medium transition-all ${
            preset === "wrongPlot"
              ? "bg-amber-50 text-amber-700 border-amber-200 shadow-sm"
              : "bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100"
          }`}
        >
          <div className="flex items-center justify-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Lệch số thửa
          </div>
        </button>

        <button
          type="button"
          id="preset-wrong-id-btn"
          onClick={() => handlePresetChange("wrongId")}
          className={`py-2 px-1 text-xs rounded-lg border font-medium transition-all ${
            preset === "wrongId"
              ? "bg-rose-50 text-rose-700 border-rose-200 shadow-sm"
              : "bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100"
          }`}
        >
          <div className="flex items-center justify-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Sai số CCCD
          </div>
        </button>
      </div>

      {/* Parameters customization form */}
      <div className="space-y-3 bg-slate-50 p-4 rounded-xl mb-4 border border-slate-100">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Số thửa đất (Sổ đỏ)</label>
            <input
              type="text"
              id="sim-plot-number"
              value={params.plotNumber}
              onChange={(e) => {
                setPreset("custom");
                setParams({ ...params, plotNumber: e.target.value });
              }}
              className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500 bg-white text-slate-800"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Tờ bản đồ số</label>
            <input
              type="text"
              id="sim-map-sheet"
              value={params.mapSheetNumber}
              onChange={(e) => {
                setPreset("custom");
                setParams({ ...params, mapSheetNumber: e.target.value });
              }}
              className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500 bg-white text-slate-800"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">Chủ sở hữu (Họ và Tên)</label>
          <input
            type="text"
            id="sim-owner-name"
            value={params.ownerName}
            onChange={(e) => {
              setPreset("custom");
              setParams({ ...params, ownerName: e.target.value.toUpperCase() });
            }}
            className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500 bg-white text-slate-800 font-semibold"
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">Số CCCD / CMND chủ sở hữu</label>
          <input
            type="text"
            id="sim-identity-number"
            value={params.identityNumber}
            onChange={(e) => {
              setPreset("custom");
              setParams({ ...params, identityNumber: e.target.value });
            }}
            className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500 bg-white text-slate-800 font-mono"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Diện tích (m²)</label>
            <input
              type="text"
              id="sim-area"
              value={params.area}
              onChange={(e) => {
                setPreset("custom");
                setParams({ ...params, area: e.target.value });
              }}
              className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500 bg-white text-slate-800"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Ngày ký cấp sổ</label>
            <input
              type="text"
              id="sim-issue-date"
              value={params.issueDate}
              onChange={(e) => {
                setPreset("custom");
                setParams({ ...params, issueDate: e.target.value });
              }}
              className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500 bg-white text-slate-800"
            />
          </div>
        </div>
      </div>

      {/* Hidden canvas used to generate image */}
      <div className="hidden">
        <canvas ref={canvasRef} style={{ width: "100%", maxWidth: "400px" }} />
      </div>

      {/* Display a small styled vector preview of the canvas */}
      <div className="border border-rose-100 rounded-xl p-3 bg-rose-50/30 flex items-center gap-3 mb-4">
        <div className="w-12 h-16 bg-rose-100 rounded border border-rose-200 flex-shrink-0 flex flex-col justify-between p-1 shadow-sm overflow-hidden text-[5px] text-center font-serif select-none">
          <div className="text-[4px] font-bold text-rose-800 leading-none">VIỆT NAM</div>
          <div className="w-full h-0.5 bg-rose-400 my-0.5"></div>
          <div className="font-bold text-[3px] text-red-600">GCN QUYỀN SỬ DỤNG ĐẤT</div>
          <div className="text-[3px] text-slate-500 text-left mt-1">Sổ thửa: {params.plotNumber}</div>
          <div className="text-[3px] text-slate-500 text-left">CCCD: {params.identityNumber.substring(0, 6)}...</div>
          <div className="w-4 h-4 rounded-full border border-red-500 bg-red-100/50 self-end flex items-center justify-center text-[3px] text-red-600 font-bold scale-75">DẤU</div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-700 truncate">Sổ đỏ giả lập đã sẵn sàng</p>
          <p className="text-[11px] text-slate-500 leading-normal">
            Bao gồm số thửa <span className="font-mono font-medium text-rose-700">{params.plotNumber}</span> & CCCD <span className="font-mono font-medium text-rose-700">{params.identityNumber}</span>
          </p>
        </div>
      </div>

      <button
        type="button"
        id="use-simulated-book-btn"
        onClick={submitGeneratedImage}
        className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
      >
        <RefreshCw className="w-4 h-4 animate-spin-slow" /> Sử dụng Sổ đỏ giả lập này
      </button>
    </div>
  );
}
