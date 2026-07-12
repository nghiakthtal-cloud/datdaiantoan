import React, { useState, useEffect } from "react";
import { Form15Data, SavedRecord, Form15aData, CoOwner } from "../types";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { 
  Printer, 
  FileText, 
  Sparkles, 
  UserCheck, 
  MapPin, 
  Home, 
  ClipboardList, 
  RotateCcw, 
  Plus, 
  Trash2, 
  Check, 
  Info,
  Calendar,
  Download,
  Loader
} from "lucide-react";

interface Form15EditorProps {
  savedRecords: SavedRecord[];
  onShowToast: (message: string, type: "success" | "error" | "info") => void;
  initialRecordId?: string | null;
}

const DEFAULT_FORM_15: Form15Data = {
  authority: "ỦY BAN NHÂN DÂN XÃ AN TOÀN",
  ownerName: "NGUYỄN VĂN HÙNG",
  ownerId: "031095012345, Cấp ngày 15/04/2021 tại Cục Cảnh sát QLHC về trật tự xã hội",
  ownerAddress: "Số 45, Đường Lê Lợi, Thị trấn Trạm Trôi, Huyện Hoài Đức, Thành phố Hà Nội",
  ownerPhone: "0912345678",
  ownerEmail: "",
  plotNumber: "124",
  mapSheetNumber: "08",
  landAddress: "Xã An Toàn, tỉnh Gia Lai",
  area: "150.5",
  areaCommon: "0.0",
  areaPrivate: "150.5",
  purpose: "Đất ở tại nông thôn (ONT)",
  purposeStartDate: "12/03/2015",
  duration: "Lâu dài",
  origin: "Công nhận quyền sử dụng đất như giao đất có thu tiền sử dụng đất",
  restrictions: "Không có hạn chế hay tranh chấp liền kề nào.",
  hasAsset: true,
  assetType: "Nhà ở riêng lẻ (Bê tông cốt thép 3 tầng)",
  assetArea: "85.2",
  assetFloorArea: "255.6",
  assetCommon: "0.0",
  assetPrivate: "255.6",
  floors: "3",
  floorsNoi: "3",
  floorsHam: "0",
  assetOrigin: "Tự đầu tư xây dựng hoàn thành năm 2017",
  assetYear: "2017",
  assetDuration: "-/- (Lâu dài)",
  assetCommitment: true,
  reqRegister: true,
  reqCertificate: true,
  reqDebt: false,
  reqOther: "Đề nghị cấp đổi Giấy chứng nhận quyền sử dụng đất cũ sang mẫu mới theo Luật Đất đai hiện hành.",
  attachedDocuments: [
    "Hợp đồng chuyển nhượng quyền sử dụng đất đã công chứng ngày 10/03/2015",
    "Bản vẽ hoàn công nhà ở được duyệt năm 2017",
    "Tờ khai lệ phí trước bạ đất đai và tài sản gắn liền với đất",
    "Bản chụp CCCD và Sổ hộ khẩu cũ của người sử dụng đất"
  ],
  signLocation: "An Toàn",
  signDate: new Date().toLocaleDateString("vi-VN")
};

const DEFAULT_FORM_15A: Form15aData = {
  isSharedLand: true,
  isSharedAsset: false,
  coOwners: [
    {
      id: "owner-1",
      name: "NGUYỄN VĂN HÙNG",
      birthYear: "1995",
      docType: "CCCD",
      docNo: "031095012345",
      docDate: "15/04/2021",
      docPlace: "Cục Cảnh sát QLHC",
      address: "Số 45, Đường Lê Lợi, Thị trấn Trạm Trôi, Huyện Hoài Đức, Thành phố Hà Nội",
    },
    {
      id: "owner-2",
      name: "TRẦN THỊ HỒNG",
      birthYear: "1997",
      docType: "CCCD",
      docNo: "038097009876",
      docDate: "20/09/2022",
      docPlace: "Cục Cảnh sát QLHC",
      address: "Thôn An Toàn, Xã An Toàn, Huyện An Lão, Tỉnh Bình Định",
    }
  ],
  signLocation: "An Toàn",
  signDate: new Date().toLocaleDateString("vi-VN")
};

export default function Form15Editor({ savedRecords, onShowToast, initialRecordId }: Form15EditorProps) {
  const [formData, setFormData] = useState<Form15Data>(DEFAULT_FORM_15);
  const [activeMainTab, setActiveMainTab] = useState<"form15" | "form15a">("form15");
  const [form15aData, setForm15aData] = useState<Form15aData>(DEFAULT_FORM_15A);
  const [activeSubTab, setActiveSubTab] = useState<"owner" | "land" | "asset" | "request">("owner");
  const [newDocName, setNewDocName] = useState("");
  const [selectedRecordId, setSelectedRecordId] = useState<string>("");
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Trigger autofill if initialRecordId is provided
  useEffect(() => {
    if (initialRecordId) {
      const record = savedRecords.find(r => r.id === initialRecordId);
      if (record) {
        handleAutofillFromRecord(record);
        setSelectedRecordId(initialRecordId);
      }
    }
  }, [initialRecordId, savedRecords]);

  // Autofill from private database record
  const handleAutofillFromRecord = (record: SavedRecord) => {
    setFormData(prev => ({
      ...prev,
      ownerName: record.ownerName.toUpperCase(),
      ownerId: record.ownerId ? `${record.ownerId}, Cấp tại Cục CS QLHC` : prev.ownerId,
      ownerAddress: record.address || prev.ownerAddress,
      ownerPhone: record.phoneNumber || prev.ownerPhone,
      plotNumber: record.plotNumber,
      mapSheetNumber: record.mapSheetNumber,
      landAddress: record.address || prev.landAddress,
      area: record.area ? record.area.replace(" m²", "").replace(" m2", "") : prev.area,
      areaPrivate: record.area ? record.area.replace(" m²", "").replace(" m2", "") : prev.areaPrivate,
      origin: record.origin || (record.notes ? `Theo hồ sơ lưu: ${record.notes}` : prev.origin)
    }));

    setForm15aData(prev => {
      const updatedOwners = [...prev.coOwners];
      const signLoc = record.address ? record.address.split(",").slice(-2)[0]?.trim() || "An Toàn" : "An Toàn";
      if (updatedOwners.length > 0) {
        updatedOwners[0] = {
          ...updatedOwners[0],
          name: record.ownerName.toUpperCase(),
          docNo: record.ownerId || updatedOwners[0].docNo,
          address: record.address || updatedOwners[0].address
        };
      } else {
        updatedOwners.push({
          id: "owner-1",
          name: record.ownerName.toUpperCase(),
          birthYear: "1995",
          docType: "CCCD",
          docNo: record.ownerId || "",
          docDate: "15/04/2021",
          docPlace: "Cục Cảnh sát QLHC",
          address: record.address || "",
        });
      }
      return {
        ...prev,
        coOwners: updatedOwners,
        signLocation: signLoc
      };
    });

    onShowToast(`Đã tự động điền dữ liệu của Thửa đất #${record.plotNumber}!`, "success");
  };

  // Preset demo options
  const applyPreset = (type: "hanoi" | "saigon" | "danang") => {
    if (type === "hanoi") {
      setFormData({
        ...DEFAULT_FORM_15,
        ownerName: "TRẦN VĂN QUYẾT",
        ownerId: "001090123456, Cấp ngày 12/08/2022 tại Cục Cảnh sát QLHC",
        ownerAddress: "Số 12A, Ngõ 92, Phố Nguyễn Chí Thanh, Láng Hạ, Đống Đa, Hà Nội",
        authority: "ỦY BAN NHÂN DÂN QUẬN ĐỐNG ĐA, TP. HÀ NỘI\nCHI NHÁNH VĂN PHÒNG ĐĂNG KÝ ĐẤT ĐAI QUẬN ĐỐNG ĐA",
        plotNumber: "88",
        mapSheetNumber: "23",
        landAddress: "Phố Nguyễn Chí Thanh, Phường Láng Hạ, Quận Đống Đa, Hà Nội",
        area: "90.0",
        areaCommon: "0.0",
        areaPrivate: "90.0",
        purpose: "Đất ở tại đô thị (ODT)",
        origin: "Nhận tặng cho từ bố mẹ đẻ theo Hợp đồng tặng cho số 159/TC ngày 24/11/2022",
        assetType: "Nhà ở riêng lẻ BTCT 4 tầng",
        assetArea: "75.0",
        assetFloorArea: "300.0",
        floors: "4",
        floorsNoi: "4"
      });
      onShowToast("Đã áp dụng mẫu đất ở Đô thị (Đống Đa, Hà Nội)", "info");
    } else if (type === "saigon") {
      setFormData({
        ...DEFAULT_FORM_15,
        authority: "ỦY BAN NHÂN DÂN QUẬN 7, THÀNH PHỐ HỒ CHÍ MINH\nCHI NHÁNH VĂN PHÒNG ĐĂNG KÝ ĐẤT ĐAI QUẬN 7",
        ownerName: "CÔNG TY TNHH ĐẦU TƯ BẤT ĐỘNG SẢN NAM SÀI GÒN",
        ownerId: "0305678910, ĐKKD cấp ngày 08/02/2018 tại Sở KH&ĐT TP.HCM",
        ownerAddress: "Tầng 15, Tòa nhà Crescent Mall, Phú Mỹ Hưng, Quận 7, TP. Hồ Chí Minh",
        ownerPhone: "02854111222",
        ownerEmail: "contact@namsaigon.com.vn",
        plotNumber: "502",
        mapSheetNumber: "14",
        landAddress: "Khu đô thị mới Phú Mỹ Hưng, Phường Tân Phong, Quận 7, TP. Hồ Chí Minh",
        area: "1250.8",
        areaCommon: "1250.8",
        areaPrivate: "0.0",
        purpose: "Đất thương mại, dịch vụ (TMD)",
        origin: "Nhà nước giao đất có thu tiền sử dụng đất theo Quyết định số 754/QĐ-UBND ngày 14/05/2018 của UBND TP.HCM",
        hasAsset: true,
        assetType: "Tòa nhà Văn phòng cho thuê Phú Mỹ",
        assetArea: "680.5",
        assetFloorArea: "6805.0",
        assetCommon: "0.0",
        assetPrivate: "6805.0",
        floors: "12",
        floorsNoi: "10",
        floorsHam: "2",
        assetYear: "2020",
        attachedDocuments: [
          "Quyết định giao đất của UBND TP.HCM năm 2018",
          "Giấy phép xây dựng số 154/GPXD của Sở Xây dựng",
          "Biên bản nghiệm thu hoàn thành công trình đưa vào sử dụng năm 2020",
          "Báo cáo rà soát hiện trạng sử dụng đất của tổ chức theo Mẫu số 15d"
        ]
      });
      onShowToast("Đã áp dụng mẫu tổ chức doanh nghiệp (Quận 7, TP.HCM)", "info");
    } else {
      setFormData({
        ...DEFAULT_FORM_15,
        authority: "ỦY BAN NHÂN DÂN HUYỆN HÒA VANG, THÀNH PHỐ ĐÀ NẴNG\nCHI NHÁNH VĂN PHÒNG ĐĂNG KÝ ĐẤT ĐAI HUYỆN HÒA VANG",
        ownerName: "LÊ THỊ HOÀI AN",
        ownerId: "048185012345, Cấp ngày 10/10/2021 tại Cục Cảnh sát QLHC",
        ownerAddress: "Thôn Túy Loan Đông, Xã Hòa Phong, Huyện Hòa Vang, TP. Đà Nẵng",
        plotNumber: "34",
        mapSheetNumber: "12",
        landAddress: "Xã Hòa Phong, Huyện Hòa Vang, Thành phố Đà Nẵng",
        area: "420.0",
        areaCommon: "0.0",
        areaPrivate: "420.0",
        purpose: "Đất trồng cây lâu năm (CLN)",
        origin: "Nhận thừa kế theo văn bản phân chia di sản thừa kế số 99/TK lập ngày 15/09/2023 tại Văn phòng Công chứng Hòa Vang",
        hasAsset: false,
        attachedDocuments: [
          "Văn bản khai nhận di sản thừa kế công chứng ngày 15/09/2023",
          "Trích lục đo vẽ bản đồ địa chính thửa đất",
          "Biên lai nộp thuế đất phi nông nghiệp hàng năm"
        ]
      });
      onShowToast("Đã áp dụng mẫu đất nông nghiệp/cây lâu năm (Hòa Vang, Đà Nẵng)", "info");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName.trim()) return;
    setFormData(prev => ({
      ...prev,
      attachedDocuments: [...prev.attachedDocuments, newDocName.trim()]
    }));
    setNewDocName("");
    onShowToast("Đã thêm một giấy tờ nộp kèm mới!", "success");
  };

  const handleRemoveDocument = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachedDocuments: prev.attachedDocuments.filter((_, i) => i !== index)
    }));
    onShowToast("Đã xóa giấy tờ nộp kèm.", "info");
  };

  const handleResetForm = () => {
    setFormData(DEFAULT_FORM_15);
    setSelectedRecordId("");
    onShowToast("Đã đưa dữ liệu biểu mẫu về mặc định.", "info");
  };

  const handleExportPDF = async () => {
    const element = document.getElementById("form15-print-area");
    if (!element) {
      onShowToast("Không tìm thấy vùng dữ liệu in!", "error");
      return;
    }
    
    try {
      setIsExportingPdf(true);
      onShowToast("Đang chuẩn bị và kết xuất tệp PDF chất lượng cao...", "info");
      
      // Helper function to safely replace oklch with rgba in CSS text
      const cleanOklchText = (cssText: string): string => {
        return cssText.replace(/oklch\(\s*([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)(?:\s*\/\s*([0-9.%]+))?\s*\)/gi, (match, lStr, cStr, hStr, aStr) => {
          const l = parseFloat(lStr);
          const a = aStr ? (aStr.includes("%") ? parseFloat(aStr)/100 : parseFloat(aStr)) : 1;
          // If lightness is high, fallback to light-gray/white. If low, fallback to dark slate/black.
          return l > 0.85 ? `rgba(245, 245, 245, ${a})` : `rgba(30, 30, 30, ${a})`;
        });
      };

      // We render html2canvas with configuration specifically tailored for crisp PDF page rendering
      const canvas = await html2canvas(element, {
        scale: 2.2, // Higher scaling factor for high-resolution print output
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        windowWidth: 800, // Forces standard wide A4 desktop layout to prevent rendering issues on mobile
        onclone: (clonedDoc) => {
          // 1. Process all inline <style> tags
          const styleTags = clonedDoc.getElementsByTagName("style");
          for (let i = 0; i < styleTags.length; i++) {
            const style = styleTags[i];
            if (style.innerHTML) {
              style.innerHTML = cleanOklchText(style.innerHTML);
            }
          }

          // 2. Process all external <link rel="stylesheet"> tags by replacing them with cleaned inline styles
          const linkTags = Array.from(clonedDoc.querySelectorAll("link[rel='stylesheet']"));
          for (const link of linkTags) {
            const href = link.getAttribute("href");
            if (href) {
              try {
                const xhr = new XMLHttpRequest();
                xhr.open("GET", href, false); // Synchronous XHR is perfect inside local cloned documents
                xhr.send(null);
                if (xhr.status === 200) {
                  const cleanedCss = cleanOklchText(xhr.responseText);
                  const newStyle = clonedDoc.createElement("style");
                  newStyle.innerHTML = cleanedCss;
                  link.parentNode?.replaceChild(newStyle, link);
                }
              } catch (e) {
                console.warn("Failed to clean oklch from external stylesheet sync:", href, e);
              }
            }
          }

          // 3. Process all inline style attributes on all DOM elements inside the clone
          const allElements = clonedDoc.getElementsByTagName("*");
          for (let i = 0; i < allElements.length; i++) {
            const el = allElements[i] as HTMLElement;
            if (el.style) {
              const styleAttr = el.getAttribute("style");
              if (styleAttr && styleAttr.includes("oklch")) {
                el.setAttribute("style", cleanOklchText(styleAttr));
              }
            }
          }

          const clonedElement = clonedDoc.getElementById("form15-print-area");
          if (clonedElement) {
            clonedElement.style.boxShadow = "none";
            clonedElement.style.border = "none";
            clonedElement.style.borderRadius = "0";
            clonedElement.style.padding = "1.5cm";
            clonedElement.style.margin = "0";
            clonedElement.style.backgroundColor = "#ffffff";
            clonedElement.style.color = "#000000";
          }
        }
      });
      
      const imgData = canvas.toDataURL("image/jpeg", 0.98);
      
      // Initialize jsPDF for A4 portrait
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;
      
      // Page 1
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
      
      // If content overflows A4 height, handle multi-page split nicely
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
      
      const is15a = activeMainTab === "form15a";
      const safeName = (is15a ? (form15aData.coOwners[0]?.name || "Danh_Sach") : formData.ownerName).trim().replace(/\s+/g, "_") || "Chu_Dat";
      pdf.save(`Mau_Don_${is15a ? "15a" : "15"}_${safeName}.pdf`);
      onShowToast(`Tải tệp PDF mẫu số ${is15a ? "15a" : "15"} thành công!`, "success");
    } catch (error) {
      console.error("PDF generation error:", error);
      onShowToast("Không thể xuất PDF. Vui lòng sử dụng tính năng In trực tiếp hoặc thử lại!", "error");
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handlePrint = () => {
    const printArea = document.getElementById("form15-print-area");
    if (!printArea) {
      onShowToast("Không tìm thấy dữ liệu vùng in!", "error");
      return;
    }

    // Attempt to open an isolated popup print window
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      onShowToast("Trình duyệt đã chặn cửa sổ bật lên. Vui lòng nhấn vào biểu tượng mở ứng dụng trong Tab mới (ở góc trên bên phải) để có trải nghiệm In và Lưu PDF chuẩn nhất!", "info");
      window.print();
      return;
    }

    // Capture existing style sheets from parent document
    let styleSheetsHtml = "";
    const styles = document.querySelectorAll("style, link[rel='stylesheet']");
    styles.forEach((style) => {
      styleSheetsHtml += style.outerHTML;
    });

    const printContent = printArea.innerHTML;
    const ownerName = formData.ownerName || "Chu_Dat";
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Mẫu Số 15 - ${ownerName}</title>
          <link href="https://fonts.googleapis.com/css2?family=Times+New+Roman&display=swap" rel="stylesheet">
          ${styleSheetsHtml}
          <style>
            /* Setup absolute sheet dimensions for printing */
            html, body {
              background-color: #ffffff !important;
              background: #ffffff !important;
              margin: 0 !important;
              padding: 0 !important;
              width: 210mm !important;
              height: auto !important;
              color: #000000 !important;
              font-family: 'Times New Roman', Times, serif, "Times New Roman" !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              padding: 2.0cm 1.5cm 2.0cm 2.0cm !important; /* Vietnam Standard Legal Margins: Top 2cm, Bottom 2cm, Left 2cm, Right 1.5cm */
              box-sizing: border-box !important;
            }
            
            /* FORCE ALL ELEMENTS TO BE VISIBLE - Overriding parent print CSS hidden rules */
            body, body * {
              visibility: visible !important;
            }
            
            #form15-print-area {
              width: 100% !important;
              background-color: #ffffff !important;
              color: #000000 !important;
              padding: 0 !important;
              margin: 0 !important;
              box-shadow: none !important;
              border: none !important;
            }
            /* Clean black text overrides for professional legal templates */
            p, span, div, td, th, h1, h2, h3, h4, label {
              color: #000000 !important;
            }
            .border-dashed {
              border-bottom: 1.2px dashed #000000 !important;
            }
            .font-bold {
              font-weight: 700 !important;
            }
            .font-extrabold {
              font-weight: 800 !important;
            }
            table {
              border-collapse: collapse;
              width: 100%;
            }
            table, th, td {
              border: 1px solid #000000 !important;
            }
            th, td {
              padding: 6px;
              text-align: left;
            }
            @page {
              size: A4 portrait;
              margin: 0;
            }
          </style>
        </head>
        <body>
          <div id="form15-print-area">
            ${printContent}
          </div>
          <script>
            // Automatically launch print window and auto-close when done
            window.onload = function() {
              setTimeout(function() {
                window.focus();
                window.print();
                try {
                  window.onafterprint = function() {
                    window.close();
                  };
                } catch (e) {}
                setTimeout(function() {
                  window.close();
                }, 1500);
              }, 600);
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
    onShowToast("Đã mở trang in độc lập! Chọn máy in là 'Microsoft Print to PDF' hoặc 'Save as PDF' trong hộp thoại.", "success");
  };

  return (
    <div className="space-y-6">
      {/* Dynamic styles injected specifically for clean printing of Mẫu số 15 */}
      <style>{`
        @media print {
          /* Setup basic layout resetting for print document */
          html, body {
            background-color: #ffffff !important;
            background: none !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 210mm !important;
            height: auto !important;
            color: #000000 !important;
            font-family: 'Times New Roman', Times, serif !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          /* Hide navigation bar, layout widgets, control actions and headers */
          header, 
          footer, 
          nav, 
          .no-print, 
          button, 
          select, 
          form, 
          .toast-container,
          aside {
            display: none !important;
          }

          /* Hide all general DOM tree elements first to isolate the document container */
          body * {
            visibility: hidden;
          }

          /* Show only the target print area and its contents */
          #form15-print-area, #form15-print-area * {
            visibility: visible;
          }

          /* Style the printed A4 sheet cleanly */
          #form15-print-area {
            visibility: visible !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            min-height: 297mm !important;
            margin: 0 !important;
            padding: 2.0cm 1.5cm 2.0cm 2.0cm !important; /* Vietnamese standard legal document margins: Top 2cm, Bottom 2cm, Left 2cm, Right 1.5cm */
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            background-color: #ffffff !important;
            color: #000000 !important;
            font-family: 'Times New Roman', Times, serif !important;
            font-size: 13.5px !important;
            line-height: 1.5 !important;
          }

          /* Ensure dashed lines are printed cleanly */
          .border-dashed {
            border-bottom: 1.2px dashed #000000 !important;
          }

          /* Ensure bold elements stand out */
          .font-bold {
            font-weight: 700 !important;
          }
          .font-extrabold {
            font-weight: 800 !important;
          }

          /* Vietnamese Legal Page Break settings */
          h3, .font-bold {
            page-break-inside: avoid;
          }
          
          /* Custom A4 standard portrait page properties */
          @page {
            size: A4 portrait;
            margin: 0;
          }
        }
      `}</style>

      {/* Control Actions Header */}
      <div className="bg-gradient-to-br from-white to-slate-50/50 rounded-2xl shadow-sm border border-slate-200/60 p-6 no-print">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-indigo-50/80 text-indigo-700 border border-indigo-100/80 px-3 py-1 rounded-full font-bold uppercase tracking-wider shadow-sm flex items-center gap-1.5">
                Mẫu số 15 mới nhất - Thông tư số 24/2024/TT-BTNMT
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <h3 className="font-black text-slate-800 text-xl tracking-tight">
              Biểu Mẫu Số 15: Đăng Ký Đất Đai & Tài Sản
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-3xl">
              Hỗ trợ tự động kết nối dữ liệu đã đối sánh, điền tự động dữ liệu mẫu và kết xuất bản in chuẩn A4 pháp lý Việt Nam.
              <span className="block mt-1.5 text-[11px] text-amber-600 font-semibold leading-relaxed bg-amber-50/40 border border-amber-100/50 rounded-lg p-2">
                * Mẹo: Để có bản in chất lượng sắc nét tuyệt đối (font chữ vector), hãy nhấn <strong className="text-amber-700">"In trực tiếp ra file PDF"</strong> rồi chọn điểm đến là <strong className="text-amber-700">"Lưu dưới dạng PDF" (Save as PDF)</strong> trong hộp thoại của trình duyệt. Nếu đang dùng trong cửa sổ xem trước iframe bị chặn, hãy bấm <strong className="text-amber-700">"Tải File PDF (Tự động)"</strong> để tải file trực tiếp.
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start lg:self-center">
            {/* Autofill From Saved Database Dropdown */}
            {savedRecords.length > 0 && (
              <div className="flex items-center">
                <select
                  id="autofill-select"
                  value={selectedRecordId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedRecordId(id);
                    const rec = savedRecords.find(r => r.id === id);
                    if (rec) handleAutofillFromRecord(rec);
                  }}
                  className="text-xs border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 hover:bg-white font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer shadow-sm"
                >
                  <option value="">-- Đổ dữ liệu từ Database --</option>
                  {savedRecords.map(r => (
                    <option key={r.id} value={r.id}>
                      Thửa {r.plotNumber} - {r.ownerName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Download PDF Button */}
            <button
              type="button"
              id="download-form-15-pdf-btn"
              disabled={isExportingPdf}
              onClick={handleExportPDF}
              className={`px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer ${
                isExportingPdf ? "opacity-75 cursor-not-allowed" : ""
              }`}
              title="Tự động tạo và tải xuống file PDF sử dụng công nghệ kết xuất canvas"
            >
              {isExportingPdf ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Đang xuất PDF...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Tải File PDF (Tự động)
                </>
              )}
            </button>

            {/* Direct Print/Save as PDF Button */}
            <button
              type="button"
              id="print-form-15-btn"
              onClick={handlePrint}
              className="px-4.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer"
              title="Mở hộp thoại in của trình duyệt (chọn 'Lưu dưới dạng PDF' hoặc 'Save as PDF' để tải file chất lượng gốc)"
            >
              <Printer className="w-4 h-4" /> In trực tiếp ra file PDF (Chất lượng cao)
            </button>
          </div>
        </div>

        {/* Presets Grid */}
        <div className="mt-5 pt-5 border-t border-slate-100 flex flex-wrap items-center gap-3">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Chọn nhanh kịch bản mẫu dữ liệu:
          </span>
          <button
            type="button"
            onClick={() => applyPreset("hanoi")}
            className="text-xs bg-slate-100/60 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 px-3.5 py-2 rounded-lg font-bold transition-all border border-slate-200/80 hover:scale-[1.02] active:scale-[0.98] shadow-sm text-slate-600 cursor-pointer"
          >
            Đất ở Đô thị (Hà Nội)
          </button>
          <button
            type="button"
            onClick={() => applyPreset("saigon")}
            className="text-xs bg-slate-100/60 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 px-3.5 py-2 rounded-lg font-bold transition-all border border-slate-200/80 hover:scale-[1.02] active:scale-[0.98] shadow-sm text-slate-600 cursor-pointer"
          >
            Đất Doanh nghiệp (TP.HCM)
          </button>
          <button
            type="button"
            onClick={() => applyPreset("danang")}
            className="text-xs bg-slate-100/60 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 px-3.5 py-2 rounded-lg font-bold transition-all border border-slate-200/80 hover:scale-[1.02] active:scale-[0.98] shadow-sm text-slate-600 cursor-pointer"
          >
            Đất Nông nghiệp (Đà Nẵng)
          </button>

          <button
            type="button"
            onClick={handleResetForm}
            className="ml-auto text-xs text-slate-500 hover:text-rose-600 bg-slate-50 hover:bg-rose-50/50 hover:border-rose-200 px-3 py-1.5 rounded-lg font-semibold transition-all border border-slate-200 flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Khôi phục ban đầu
          </button>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex border border-slate-200/80 bg-slate-100/80 p-1.5 rounded-2xl no-print gap-1.5 max-w-2xl">
        <button
          type="button"
          onClick={() => setActiveMainTab("form15")}
          className={`flex-1 md:flex-none px-6 py-3 text-xs md:text-sm font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeMainTab === "form15"
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          <FileText className="w-4 h-4" />
          Mẫu số 15: Đơn Đăng Ký Đất Đai
        </button>
        <button
          type="button"
          onClick={() => setActiveMainTab("form15a")}
          className={`flex-1 md:flex-none px-6 py-3 text-xs md:text-sm font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeMainTab === "form15a"
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          Mẫu số 15a: Danh Sách Đồng Sử Dụng
        </button>
      </div>

      {/* Main Form + Live Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Section: Form Interactive Editor (5 Columns) */}
        <div className="lg:col-span-5 bg-white rounded-2xl shadow-md border border-slate-200/50 p-6 space-y-6 no-print shadow-slate-100/40">
          {activeMainTab === "form15" ? (
            <>
              {/* Sub-Tabs for Step Form */}
          <div className="flex bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/40 gap-1.5">
            <button
              type="button"
              onClick={() => setActiveSubTab("owner")}
              className={`flex-1 py-2 text-center rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                activeSubTab === "owner"
                  ? "bg-white text-indigo-700 shadow-sm scale-[1.02]"
                  : "text-slate-500 hover:text-slate-800 hover:bg-white/40"
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" /> 1. Người kê khai
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab("land")}
              className={`flex-1 py-2 text-center rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                activeSubTab === "land"
                  ? "bg-white text-indigo-700 shadow-sm scale-[1.02]"
                  : "text-slate-500 hover:text-slate-800 hover:bg-white/40"
              }`}
            >
              <MapPin className="w-3.5 h-3.5" /> 2. Thửa Đất
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab("asset")}
              className={`flex-1 py-2 text-center rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                activeSubTab === "asset"
                  ? "bg-white text-indigo-700 shadow-sm scale-[1.02]"
                  : "text-slate-500 hover:text-slate-800 hover:bg-white/40"
              }`}
            >
              <Home className="w-3.5 h-3.5" /> 3. Tài sản
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab("request")}
              className={`flex-1 py-2 text-center rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                activeSubTab === "request"
                  ? "bg-white text-indigo-700 shadow-sm scale-[1.02]"
                  : "text-slate-500 hover:text-slate-800 hover:bg-white/40"
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" /> 4. Đề nghị
            </button>
          </div>

          {/* Form Content fields */}
          <div className="space-y-4">
            
            {/* SUB-TAB 1: APPLICANT INFO */}
            {activeSubTab === "owner" && (
              <div className="space-y-4 animate-fade-in">
                <div className="p-3.5 bg-indigo-50/40 rounded-xl border border-indigo-100/60 flex items-start gap-2.5 text-indigo-800/95 shadow-sm shadow-indigo-50/20 mb-2">
                  <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">
                    <strong>Footnote (1) & (2):</strong> Ghi rõ Cơ quan tiếp nhận xử lý hồ sơ và ghi tên người đăng ký bằng chữ IN HOA theo đúng căn cước công dân.
                  </p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Cơ quan tiếp nhận kính gửi (1)</label>
                  <textarea
                    name="authority"
                    value={formData.authority}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/30 hover:bg-white hover:border-slate-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 text-slate-800 font-semibold"
                    placeholder="Ủy ban nhân dân xã..."
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Họ và tên người sử dụng/Chủ sở hữu (2)</label>
                  <input
                    type="text"
                    name="ownerName"
                    value={formData.ownerName}
                    onChange={handleInputChange}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/30 hover:bg-white hover:border-slate-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 text-slate-800 font-bold uppercase tracking-wide"
                    placeholder="NGUYỄN VĂN A"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Giấy tờ nhân thân/pháp nhân (3)</label>
                  <input
                    type="text"
                    name="ownerId"
                    value={formData.ownerId}
                    onChange={handleInputChange}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/30 hover:bg-white hover:border-slate-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 text-slate-800 font-medium"
                    placeholder="Ví dụ: CCCD số 031095012345..."
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Địa chỉ thường trú/Trụ sở chính (4)</label>
                  <input
                    type="text"
                    name="ownerAddress"
                    value={formData.ownerAddress}
                    onChange={handleInputChange}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/30 hover:bg-white hover:border-slate-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 text-slate-800"
                    placeholder="Địa chỉ cư trú..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Điện thoại liên hệ</label>
                    <input
                      type="text"
                      name="ownerPhone"
                      value={formData.ownerPhone}
                      onChange={handleInputChange}
                      className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/30 hover:bg-white hover:border-slate-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 text-slate-800 font-mono"
                      placeholder="Số điện thoại..."
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Hộp thư điện tử (nếu có)</label>
                    <input
                      type="email"
                      name="ownerEmail"
                      value={formData.ownerEmail}
                      onChange={handleInputChange}
                      className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/30 hover:bg-white hover:border-slate-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 text-slate-800 font-mono"
                      placeholder="Email..."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SUB-TAB 2: LAND PLOT INFO */}
            {activeSubTab === "land" && (
              <div className="space-y-4 animate-fade-in">
                <div className="p-3.5 bg-amber-50/40 rounded-xl border border-amber-100/60 flex items-start gap-2.5 text-amber-800/90 shadow-sm shadow-amber-50/10 mb-2">
                  <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">
                    <strong>Footnote (6):</strong> Diện tích thửa đất đăng ký được ghi bằng số Ả Rập, làm tròn số đến 1 chữ số thập phân (e.g. 150.5 m²).
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Thửa đất số *</label>
                    <input
                      type="text"
                      name="plotNumber"
                      value={formData.plotNumber}
                      onChange={handleInputChange}
                      className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/30 hover:bg-white hover:border-slate-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 text-slate-800 font-bold"
                      placeholder="Ví dụ: 124"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tờ bản đồ số *</label>
                    <input
                      type="text"
                      name="mapSheetNumber"
                      value={formData.mapSheetNumber}
                      onChange={handleInputChange}
                      className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/30 hover:bg-white hover:border-slate-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 text-slate-800 font-bold"
                      placeholder="Ví dụ: 08"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Địa chỉ thửa đất (5)</label>
                  <input
                    type="text"
                    name="landAddress"
                    value={formData.landAddress}
                    onChange={handleInputChange}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/30 hover:bg-white hover:border-slate-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 text-slate-800"
                    placeholder="Vị trí thửa đất..."
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Diện tích (m2) *</label>
                    <input
                      type="text"
                      name="area"
                      value={formData.area}
                      onChange={handleInputChange}
                      className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/30 hover:bg-white hover:border-slate-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 text-slate-800 font-bold"
                      placeholder="Ví dụ: 150.5"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Dùng chung (m2)</label>
                    <input
                      type="text"
                      name="areaCommon"
                      value={formData.areaCommon}
                      onChange={handleInputChange}
                      className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/30 hover:bg-white hover:border-slate-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 text-slate-800"
                      placeholder="Ví dụ: 0.0"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Dùng riêng (m2)</label>
                    <input
                      type="text"
                      name="areaPrivate"
                      value={formData.areaPrivate}
                      onChange={handleInputChange}
                      className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/30 hover:bg-white hover:border-slate-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 text-slate-800"
                      placeholder="Ví dụ: 150.5"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Mục đích sử dụng (7)</label>
                    <input
                      type="text"
                      name="purpose"
                      value={formData.purpose}
                      onChange={handleInputChange}
                      className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/30 hover:bg-white hover:border-slate-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 text-slate-800 font-medium"
                      placeholder="Đất ở nông thôn..."
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Thời điểm sử dụng</label>
                    <input
                      type="text"
                      name="purposeStartDate"
                      value={formData.purposeStartDate}
                      onChange={handleInputChange}
                      className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/30 hover:bg-white hover:border-slate-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 text-slate-800"
                      placeholder="Ví dụ: Từ 2015"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Thời hạn đề nghị sử dụng (8)</label>
                  <input
                    type="text"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/30 hover:bg-white hover:border-slate-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 text-slate-800 font-medium"
                    placeholder="Lâu dài / Có thời hạn..."
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nguồn gốc sử dụng đất (9)</label>
                  <textarea
                    name="origin"
                    value={formData.origin}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/30 hover:bg-white hover:border-slate-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 text-slate-800 leading-normal"
                    placeholder="Ghi rõ nguồn gốc: Nhận chuyển nhượng, được giao..."
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Quyền / Hạn chế liền kề (10)</label>
                  <input
                    type="text"
                    name="restrictions"
                    value={formData.restrictions}
                    onChange={handleInputChange}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/30 hover:bg-white hover:border-slate-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 text-slate-800"
                    placeholder="Lối đi chung, hạn chế chiều cao..."
                  />
                </div>
              </div>
            )}

            {/* SUB-TAB 3: ASSET & BUILDINGS INFO */}
            {activeSubTab === "asset" && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200/60 shadow-sm">
                  <div className="space-y-0.5">
                    <label className="block text-xs font-black text-slate-700">Đăng ký tài sản gắn liền?</label>
                    <p className="text-[10px] text-slate-500">Khai báo nếu có Nhà ở, Công trình xây dựng</p>
                  </div>
                  <input
                    type="checkbox"
                    name="hasAsset"
                    checked={formData.hasAsset}
                    onChange={handleInputChange}
                    className="w-4.5 h-4.5 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                  />
                </div>

                {formData.hasAsset && (
                  <div className="space-y-4 border-l-2 border-indigo-500 pl-4.5 mt-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Loại nhà ở, công trình (11)</label>
                      <input
                        type="text"
                        name="assetType"
                        value={formData.assetType}
                        onChange={handleInputChange}
                        className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/30 hover:bg-white hover:border-slate-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 text-slate-800 font-semibold"
                        placeholder="Nhà ở riêng lẻ, căn hộ..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Diện tích xây dựng (12)</label>
                        <input
                          type="text"
                          name="assetArea"
                          value={formData.assetArea}
                          onChange={handleInputChange}
                          className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/30 hover:bg-white hover:border-slate-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 text-slate-800"
                          placeholder="m2"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">D.Tích sàn/sử dụng (13)</label>
                        <input
                          type="text"
                          name="assetFloorArea"
                          value={formData.assetFloorArea}
                          onChange={handleInputChange}
                          className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/30 hover:bg-white hover:border-slate-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 text-slate-800"
                          placeholder="m2"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Sở hữu chung (14)</label>
                        <input
                          type="text"
                          name="assetCommon"
                          value={formData.assetCommon}
                          onChange={handleInputChange}
                          className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/30 hover:bg-white hover:border-slate-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 text-slate-800"
                          placeholder="m2"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Sở hữu riêng (14)</label>
                        <input
                          type="text"
                          name="assetPrivate"
                          value={formData.assetPrivate}
                          onChange={handleInputChange}
                          className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/30 hover:bg-white hover:border-slate-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 text-slate-800"
                          placeholder="m2"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tổng số tầng</label>
                        <input
                          type="text"
                          name="floors"
                          value={formData.floors}
                          onChange={handleInputChange}
                          className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/30 hover:bg-white hover:border-slate-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 text-slate-800"
                          placeholder="Ví dụ: 3"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Số tầng nổi</label>
                        <input
                          type="text"
                          name="floorsNoi"
                          value={formData.floorsNoi}
                          onChange={handleInputChange}
                          className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/30 hover:bg-white hover:border-slate-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 text-slate-800"
                          placeholder="Ví dụ: 3"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Số tầng hầm</label>
                        <input
                          type="text"
                          name="floorsHam"
                          value={formData.floorsHam}
                          onChange={handleInputChange}
                          className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/30 hover:bg-white hover:border-slate-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 text-slate-800"
                          placeholder="Ví dụ: 0"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nguồn gốc hình thành (15)</label>
                      <input
                        type="text"
                        name="assetOrigin"
                        value={formData.assetOrigin}
                        onChange={handleInputChange}
                        className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/30 hover:bg-white hover:border-slate-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 text-slate-800"
                        placeholder="Tự đầu tư xây dựng, mua..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Năm hoàn thành (16)</label>
                        <input
                          type="text"
                          name="assetYear"
                          value={formData.assetYear}
                          onChange={handleInputChange}
                          className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/30 hover:bg-white hover:border-slate-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 text-slate-800 font-mono"
                          placeholder="2017"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Thời hạn sở hữu đến (17)</label>
                        <input
                          type="text"
                          name="assetDuration"
                          value={formData.assetDuration}
                          onChange={handleInputChange}
                          className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/30 hover:bg-white hover:border-slate-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 text-slate-800"
                          placeholder="-/- (Lâu dài)"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-2.5 bg-rose-50/60 rounded-xl text-rose-800 border border-rose-100/50 text-[11px] leading-relaxed">
                      <input
                        type="checkbox"
                        name="assetCommitment"
                        checked={formData.assetCommitment}
                        onChange={handleInputChange}
                        className="w-4 h-4 rounded text-rose-600 border-rose-300 focus:ring-rose-500 cursor-pointer flex-shrink-0"
                      />
                      <span><strong>Cam kết (18):</strong> Nhà ở/Công trình đủ điều kiện tồn tại theo quy định luật đất đai.</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SUB-TAB 4: DEMANDS & ATTACHMENTS */}
            {activeSubTab === "request" && (
              <div className="space-y-5 animate-fade-in">
                
                {/* Section 4: Demands */}
                <div className="space-y-3">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mục 4: Đề nghị (Đánh dấu tích)</span>
                  
                  <div className="space-y-3 bg-slate-50/50 p-4 rounded-xl border border-slate-200/80">
                    <label className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 cursor-pointer hover:text-slate-900 transition-colors">
                      <input
                        type="checkbox"
                        name="reqRegister"
                        checked={formData.reqRegister}
                        onChange={handleInputChange}
                        className="w-4.5 h-4.5 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 mt-0.5 cursor-pointer"
                      />
                      <span className="leading-normal">Đăng ký đất đai, tài sản gắn liền với đất</span>
                    </label>

                    <label className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 cursor-pointer hover:text-slate-900 transition-colors">
                      <input
                        type="checkbox"
                        name="reqCertificate"
                        checked={formData.reqCertificate}
                        onChange={handleInputChange}
                        className="w-4.5 h-4.5 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 mt-0.5 cursor-pointer"
                      />
                      <span className="leading-normal">Đề nghị cấp Giấy chứng nhận (Sổ đỏ mới)</span>
                    </label>

                    <label className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 cursor-pointer hover:text-slate-900 transition-colors">
                      <input
                        type="checkbox"
                        name="reqDebt"
                        checked={formData.reqDebt}
                        onChange={handleInputChange}
                        className="w-4.5 h-4.5 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 mt-0.5 cursor-pointer"
                      />
                      <span className="leading-normal">Ghi nợ tiền sử dụng đất (đối với cá nhân)</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Yêu cầu đề nghị khác (nếu có)</label>
                    <input
                      type="text"
                      name="reqOther"
                      value={formData.reqOther}
                      onChange={handleInputChange}
                      className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/30 hover:bg-white hover:border-slate-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 text-slate-800"
                      placeholder="Ghi rõ đề nghị khác..."
                    />
                  </div>
                </div>

                {/* Section 5: Attached Documents List */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mục 5: Giấy tờ nộp kèm theo ({formData.attachedDocuments.length})</span>
                  
                  {/* List of currently added docs */}
                  <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                    {formData.attachedDocuments.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic bg-slate-50/50 border border-dashed border-slate-200 p-3 rounded-lg text-center">Chưa có giấy tờ nào được kê khai.</p>
                    ) : (
                      formData.attachedDocuments.map((doc, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50/50 hover:bg-white rounded-xl border border-slate-200/80 hover:border-slate-300 transition-all text-[11px]">
                          <span className="font-bold text-slate-700 line-clamp-1 flex-1 pr-2">({idx + 1}) {doc}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveDocument(idx)}
                            className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 p-1.5 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add document widget */}
                  <form onSubmit={handleAddDocument} className="flex gap-2">
                    <input
                      type="text"
                      value={newDocName}
                      onChange={(e) => setNewDocName(e.target.value)}
                      className="flex-1 text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/30 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all"
                      placeholder="Nhập tên tệp tài liệu/giấy tờ..."
                    />
                    <button
                      type="submit"
                      className="px-4.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Thêm
                    </button>
                  </form>
                </div>

                {/* Section 6: Signing Location & Date */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ký & cam đoan</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Địa danh ký</label>
                      <input
                        type="text"
                        name="signLocation"
                        value={formData.signLocation}
                        onChange={handleInputChange}
                        className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/30 hover:bg-white hover:border-slate-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 text-slate-800"
                        placeholder="Ví dụ: Hoài Đức"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Ngày tháng năm</label>
                      <input
                        type="text"
                        name="signDate"
                        value={formData.signDate}
                        onChange={handleInputChange}
                        className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/30 hover:bg-white hover:border-slate-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 text-slate-800"
                        placeholder="Ngày ký..."
                      />
                    </div>
                  </div>
                </div>

              </div>
            )}
            </div>
            </>
          ) : (
            <div className="space-y-5 animate-fade-in">
              <div className="border-b border-slate-100 pb-3">
                <h4 className="font-extrabold text-slate-800 text-sm">Cấu hình Danh sách đồng sử dụng (15a)</h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">Kê khai thông tin những người cùng sử dụng chung thửa đất hoặc sở hữu chung tài sản.</p>
              </div>

              {/* Checkboxes */}
              <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200/80 space-y-3">
                <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 cursor-pointer hover:text-slate-900 transition-colors">
                  <input
                    type="checkbox"
                    checked={form15aData.isSharedLand}
                    onChange={(e) => setForm15aData(prev => ({ ...prev, isSharedLand: e.target.checked }))}
                    className="rounded text-indigo-600 focus:ring-indigo-500 h-4.5 w-4.5 cursor-pointer"
                  />
                  Sử dụng chung thửa đất
                </label>
                <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 cursor-pointer hover:text-slate-900 transition-colors">
                  <input
                    type="checkbox"
                    checked={form15aData.isSharedAsset}
                    onChange={(e) => setForm15aData(prev => ({ ...prev, isSharedAsset: e.target.checked }))}
                    className="rounded text-indigo-600 focus:ring-indigo-500 h-4.5 w-4.5 cursor-pointer"
                  />
                  Sở hữu chung tài sản gắn liền với đất
                </label>
              </div>

              {/* Co-owners list */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Danh sách người đồng sở hữu ({form15aData.coOwners.length})</span>
                  <button
                    type="button"
                    onClick={() => {
                      const newId = `owner-${Date.now()}`;
                      setForm15aData(prev => ({
                        ...prev,
                        coOwners: [
                          ...prev.coOwners,
                          {
                            id: newId,
                            name: "",
                            birthYear: "",
                            docType: "CCCD",
                            docNo: "",
                            docDate: "",
                            docPlace: "Cục Cảnh sát QLHC",
                            address: ""
                          }
                        ]
                      }));
                      onShowToast("Đã thêm một dòng người đồng sở hữu mới!", "success");
                    }}
                    className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100/80 text-indigo-700 text-[11px] font-bold rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-1 cursor-pointer shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm người mới
                  </button>
                </div>

                <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
                  {form15aData.coOwners.map((owner, idx) => (
                    <div key={owner.id} className="p-4.5 bg-slate-50/20 hover:bg-white border border-slate-200 rounded-2xl space-y-4 relative group shadow-sm hover:border-indigo-300/60 transition-all duration-200">
                      <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-85 group-hover:opacity-100 transition-opacity">
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-bold">
                          Người #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setForm15aData(prev => ({
                              ...prev,
                              coOwners: prev.coOwners.filter(o => o.id !== owner.id)
                            }));
                            onShowToast(`Đã xóa người thứ ${idx + 1}`, "info");
                          }}
                          className="p-1.5 bg-white hover:bg-rose-50 text-rose-500 hover:text-rose-700 border border-slate-100 rounded-lg transition-colors cursor-pointer shadow-sm"
                          title="Xóa người này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Input fields */}
                      <div className="grid grid-cols-1 gap-3.5 pt-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Họ và tên</label>
                          <input
                            type="text"
                            value={owner.name}
                            onChange={(e) => {
                              const val = e.target.value.toUpperCase();
                              setForm15aData(prev => ({
                                ...prev,
                                coOwners: prev.coOwners.map(o => o.id === owner.id ? { ...o, name: val } : o)
                              }));
                            }}
                            className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/30 hover:bg-white hover:border-slate-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 font-bold text-slate-800"
                            placeholder="NGUYỄN VĂN A"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Năm sinh</label>
                            <input
                              type="text"
                              value={owner.birthYear}
                              onChange={(e) => {
                                const val = e.target.value;
                                setForm15aData(prev => ({
                                  ...prev,
                                  coOwners: prev.coOwners.map(o => o.id === owner.id ? { ...o, birthYear: val } : o)
                                }));
                              }}
                              className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/30 hover:bg-white hover:border-slate-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 text-slate-800"
                              placeholder="1990"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Loại giấy tờ</label>
                            <input
                              type="text"
                              value={owner.docType}
                              onChange={(e) => {
                                const val = e.target.value;
                                setForm15aData(prev => ({
                                  ...prev,
                                  coOwners: prev.coOwners.map(o => o.id === owner.id ? { ...o, docType: val } : o)
                                }));
                              }}
                              className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/30 hover:bg-white hover:border-slate-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 text-slate-800 font-semibold"
                              placeholder="CCCD / Hộ chiếu"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div className="col-span-1">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Số giấy tờ</label>
                            <input
                              type="text"
                              value={owner.docNo}
                              onChange={(e) => {
                                const val = e.target.value;
                                setForm15aData(prev => ({
                                  ...prev,
                                  coOwners: prev.coOwners.map(o => o.id === owner.id ? { ...o, docNo: val } : o)
                                }));
                              }}
                              className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/30 hover:bg-white hover:border-slate-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 text-slate-800 font-mono"
                              placeholder="0310..."
                            />
                          </div>
                          <div className="col-span-1">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Ngày cấp</label>
                            <input
                              type="text"
                              value={owner.docDate}
                              onChange={(e) => {
                                const val = e.target.value;
                                setForm15aData(prev => ({
                                  ...prev,
                                  coOwners: prev.coOwners.map(o => o.id === owner.id ? { ...o, docDate: val } : o)
                                }));
                              }}
                              className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/30 hover:bg-white hover:border-slate-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 text-slate-800"
                              placeholder="12/10/2021"
                            />
                          </div>
                          <div className="col-span-1">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nơi cấp</label>
                            <input
                              type="text"
                              value={owner.docPlace}
                              onChange={(e) => {
                                const val = e.target.value;
                                setForm15aData(prev => ({
                                  ...prev,
                                  coOwners: prev.coOwners.map(o => o.id === owner.id ? { ...o, docPlace: val } : o)
                                }));
                              }}
                              className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/30 hover:bg-white hover:border-slate-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 text-slate-800"
                              placeholder="Cục CS QLHC"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Địa chỉ</label>
                          <textarea
                            rows={2}
                            value={owner.address}
                            onChange={(e) => {
                              const val = e.target.value;
                              setForm15aData(prev => ({
                                ...prev,
                                coOwners: prev.coOwners.map(o => o.id === owner.id ? { ...o, address: val } : o)
                              }));
                            }}
                            className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/30 hover:bg-white hover:border-slate-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 text-slate-800 leading-normal"
                            placeholder="Địa chỉ thường trú..."
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  {form15aData.coOwners.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 bg-slate-50/20">
                      <p className="text-xs font-semibold">Chưa có người đồng sử dụng nào.</p>
                      <p className="text-[10px] mt-1 text-slate-500">Bấm nút "Thêm người mới" ở trên để kê khai.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Sign location and date */}
              <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 tracking-wider">Nơi ký đơn</label>
                  <input
                    type="text"
                    value={form15aData.signLocation}
                    onChange={(e) => setForm15aData(prev => ({ ...prev, signLocation: e.target.value }))}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/30 hover:bg-white hover:border-slate-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 text-slate-800 font-semibold"
                    placeholder="Ví dụ: An Toàn"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 tracking-wider">Ngày ký đơn</label>
                  <input
                    type="text"
                    value={form15aData.signDate}
                    onChange={(e) => setForm15aData(prev => ({ ...prev, signDate: e.target.value }))}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/30 hover:bg-white hover:border-slate-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 text-slate-800 font-semibold"
                    placeholder="Ngày..."
                  />
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right Section: Print Preview Frame (7 Columns) */}
        <div className="lg:col-span-7 bg-slate-100 p-4 sm:p-6 rounded-2xl border border-slate-200 flex flex-col justify-center items-center shadow-inner overflow-hidden min-h-[600px]">
          
          <div className="w-full max-w-lg mb-3 flex items-center justify-between no-print">
            <span className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
              <Printer className="w-4 h-4 text-rose-600 animate-pulse" />
              Xem trước bản in thực tế (Trang A4 chuẩn)
            </span>
            <span className="text-[10px] text-slate-400">Ấn nút "Xuất File In" để in hoặc tải PDF</span>
          </div>

          {/* DOCUMENT IN PRINT FORM TEMPLATE */}
          <div 
            id="form15-print-area" 
            className="w-full bg-white shadow-2xl rounded-sm border border-slate-300 p-[1.5cm] text-[12px] leading-[1.4] text-black font-serif select-all select-none animate-fade-in relative min-h-[842px] max-w-[210mm]"
            style={{ fontFamily: "'Times New Roman', Times, serif" }}
          >
            {activeMainTab === "form15" ? (
              <>
                {/* Form standard header footnotes */}
            <div className="text-right font-bold text-[10px] mb-2 leading-tight">
              Mẫu số 15. Đơn đăng ký đất đai, tài sản gắn liền với đất
            </div>

            {/* National Motto */}
            <div className="text-center space-y-1 mb-5">
              <h2 className="font-bold text-[13px] uppercase tracking-wide">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h2>
              <h3 className="font-bold text-[12px] underline underline-offset-4">Độc lập - Tự do - Hạnh phúc</h3>
              <div className="text-slate-400 text-[10px] py-1">-------------------</div>
            </div>

            {/* Form Main Title */}
            <div className="text-center space-y-2 mb-6">
              <h1 className="font-extrabold text-[15px] uppercase tracking-tight">ĐƠN ĐĂNG KÝ ĐẤT ĐAI, TÀI SẢN GẮN LIỀN VỚI ĐẤT</h1>
              <div className="flex items-center justify-center gap-1 text-[11px]">
                <span className="italic">Kính gửi:</span>
                <span className="font-bold border-b border-dashed border-black/80 flex-1 max-w-[320px] px-1 text-center truncate">
                  {formData.authority || ""}
                </span>
              </div>
            </div>

            {/* Form body blocks */}
            <div className="space-y-4">
              
              {/* SECTION 1 */}
              <div>
                <h3 className="font-bold">1. Người sử dụng đất, chủ sở hữu tài sản gắn liền với đất, người quản lý đất:</h3>
                <p className="text-[10px] italic leading-tight text-slate-600 pl-4 mb-1">
                  (Trường hợp nhiều người cùng sử dụng đất, cùng sở hữu tài sản thì kê khai tên người cùng sử dụng đất, cùng sở hữu tài sản đó theo Mẫu số 15a)
                </p>
                <div className="pl-4 space-y-1.5">
                  <div className="flex items-end">
                    <span>a) Họ và tên:</span>
                    <span className="font-bold uppercase border-b border-dashed border-black flex-1 pl-2 pb-0.5">
                      {formData.ownerName || ""}
                    </span>
                  </div>
                  <div className="flex items-end">
                    <span>b) Giấy tờ nhân thân/pháp nhân:</span>
                    <span className="font-medium border-b border-dashed border-black flex-1 pl-2 pb-0.5">
                      {formData.ownerId || ""}
                    </span>
                  </div>
                  <div className="flex items-end">
                    <span>c) Địa chỉ:</span>
                    <span className="border-b border-dashed border-black flex-1 pl-2 pb-0.5">
                      {formData.ownerAddress || ""}
                    </span>
                  </div>
                  <div className="flex items-end flex-wrap">
                    <span>d) Điện thoại liên hệ (nếu có):</span>
                    <span className="border-b border-dashed border-black w-[150px] pl-2 pb-0.5 font-mono">
                      {formData.ownerPhone || ""}
                    </span>
                    <span className="ml-3">Hộp thư điện tử (nếu có):</span>
                    <span className="border-b border-dashed border-black flex-1 pl-2 pb-0.5 font-mono">
                      {formData.ownerEmail || ""}
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 2 */}
              <div>
                <h3 className="font-bold">2. Thửa đất đăng ký (người sử dụng đất là tổ chức thì không phải kê khai mục này):</h3>
                <p className="text-[10px] italic leading-tight text-slate-600 pl-4 mb-1">
                  (Trường hợp đăng ký nhiều thửa đất nông nghiệp mà không đề nghị cấp Giấy chứng nhận hoặc đề nghị cấp chung một Giấy chứng nhận cho nhiều thửa đất nông nghiệp thì không kê khai các nội dung tại Mục này mà chỉ ghi tổng số thửa và kê khai từng thửa đất theo Mẫu số 15b)
                </p>
                <div className="pl-4 space-y-1.5">
                  <div className="flex items-end flex-wrap">
                    <span>a) Thửa đất số:</span>
                    <span className="font-bold border-b border-dashed border-black w-[120px] pl-2 pb-0.5 text-center">
                      {formData.plotNumber || ""}
                    </span>
                    <span className="ml-3">; Tờ bản đồ số:</span>
                    <span className="font-bold border-b border-dashed border-black w-[120px] pl-2 pb-0.5 text-center">
                      {formData.mapSheetNumber || ""}
                    </span>
                  </div>
                  <div className="flex items-end">
                    <span>b) Địa chỉ thửa đất:</span>
                    <span className="border-b border-dashed border-black flex-1 pl-2 pb-0.5">
                      {formData.landAddress || ""}
                    </span>
                  </div>
                  <div className="flex items-end flex-wrap">
                    <span>c) Diện tích:</span>
                    <span className="font-bold border-b border-dashed border-black w-[100px] pl-2 pb-0.5 text-center">
                      {formData.area ? `${formData.area} m²` : ""}
                    </span>
                    <span className="ml-3">; sử dụng chung:</span>
                    <span className="border-b border-dashed border-black w-[100px] pl-2 pb-0.5 text-center">
                      {formData.areaCommon ? `${formData.areaCommon} m²` : ""}
                    </span>
                    <span className="ml-3">; sử dụng riêng:</span>
                    <span className="border-b border-dashed border-black flex-1 pl-2 pb-0.5 text-center font-bold">
                      {formData.areaPrivate ? `${formData.areaPrivate} m²` : ""}
                    </span>
                  </div>
                  <div className="flex items-end flex-wrap">
                    <span>d) Sử dụng vào mục đích:</span>
                    <span className="border-b border-dashed border-black w-[200px] pl-2 pb-0.5 font-bold">
                      {formData.purpose || ""}
                    </span>
                    <span className="ml-3">; từ thời điểm:</span>
                    <span className="border-b border-dashed border-black flex-1 pl-2 pb-0.5 text-center">
                      {formData.purposeStartDate || ""}
                    </span>
                  </div>
                  <div className="flex items-end">
                    <span>đ) Thời hạn đề nghị được sử dụng đất:</span>
                    <span className="border-b border-dashed border-black flex-1 pl-2 pb-0.5 font-semibold">
                      {formData.duration || ""}
                    </span>
                  </div>
                  <div className="flex items-end">
                    <span>e) Nguồn gốc sử dụng đất:</span>
                    <span className="border-b border-dashed border-black flex-1 pl-2 pb-0.5 text-[11px] leading-tight">
                      {formData.origin || ""}
                    </span>
                  </div>
                  <div className="flex items-end">
                    <span>g) Quyền hoặc hạn chế quyền đối với thửa đất liền kề (nếu có):</span>
                    <span className="border-b border-dashed border-black flex-1 pl-2 pb-0.5">
                      {formData.restrictions || ""}
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 3 */}
              <div>
                <h3 className="font-bold">3. Nhà ở, công trình xây dựng (người sử dụng đất là tổ chức thì không phải kê khai mục này):</h3>
                <p className="text-[10px] italic leading-tight text-slate-600 pl-4 mb-1">
                  (Chỉ kê khai nếu có nhu cầu đăng ký hoặc chứng nhận quyền sở hữu tài sản; Trường hợp có nhiều nhà ở, công trình xây dựng khác trên cùng 01 thửa đất thì chỉ kê khai các thông tin chung và tổng diện tích của các nhà ở, công trình xây dựng; đồng thời lập danh sách nhà ở, công trình theo Mẫu số 15c)
                </p>

                {formData.hasAsset ? (
                  <div className="pl-4 space-y-1.5">
                    <div className="flex items-end">
                      <span>a) Loại nhà ở, công trình xây dựng:</span>
                      <span className="border-b border-dashed border-black flex-1 pl-2 pb-0.5 font-semibold">
                        {formData.assetType || ""}
                      </span>
                    </div>
                    <div className="flex items-end flex-wrap">
                      <span>b) Diện tích xây dựng:</span>
                      <span className="border-b border-dashed border-black w-[150px] pl-2 pb-0.5 text-center">
                        {formData.assetArea ? `${formData.assetArea} m²` : ""}
                      </span>
                      <span className="ml-3">c) Diện tích sàn xây dựng/diện tích sử dụng:</span>
                      <span className="border-b border-dashed border-black flex-1 pl-2 pb-0.5 text-center">
                        {formData.assetFloorArea ? `${formData.assetFloorArea} m²` : ""}
                      </span>
                    </div>
                    <div className="flex items-end flex-wrap">
                      <span>d) Sở hữu chung:</span>
                      <span className="border-b border-dashed border-black w-[150px] pl-2 pb-0.5 text-center">
                        {formData.assetCommon ? `${formData.assetCommon} m²` : ""}
                      </span>
                      <span className="ml-3">, sở hữu riêng:</span>
                      <span className="border-b border-dashed border-black flex-1 pl-2 pb-0.5 text-center">
                        {formData.assetPrivate ? `${formData.assetPrivate} m²` : ""}
                      </span>
                    </div>
                    <div className="flex items-end flex-wrap">
                      <span>đ) Số tầng:</span>
                      <span className="border-b border-dashed border-black w-[100px] pl-2 pb-0.5 text-center font-bold">
                        {formData.floors || ""} {formData.floors ? "tầng" : ""}
                      </span>
                      <span className="ml-3">; trong đó, số tầng nổi:</span>
                      <span className="border-b border-dashed border-black w-[100px] pl-2 pb-0.5 text-center">
                        {formData.floorsNoi || ""} {formData.floorsNoi ? "tầng" : ""}
                      </span>
                      <span className="ml-3">, số tầng hầm:</span>
                      <span className="border-b border-dashed border-black flex-1 pl-2 pb-0.5 text-center">
                        {formData.floorsHam || ""} {formData.floorsHam ? "tầng" : ""}
                      </span>
                    </div>
                    <div className="flex items-end">
                      <span>e) Nguồn gốc hình thành:</span>
                      <span className="border-b border-dashed border-black flex-1 pl-2 pb-0.5">
                        {formData.assetOrigin || ""}
                      </span>
                    </div>
                    <div className="flex items-end flex-wrap">
                      <span>g) Năm hoàn thành xây dựng:</span>
                      <span className="border-b border-dashed border-black w-[150px] pl-2 pb-0.5 text-center font-bold">
                        {formData.assetYear || ""}
                      </span>
                      <span className="ml-3">h) Thời hạn sở hữu đến:</span>
                      <span className="border-b border-dashed border-black flex-1 pl-2 pb-0.5 text-center">
                        {formData.assetDuration || ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] mt-1">
                      <span>i) Cam kết về việc đủ điều kiện tồn tại nhà ở, công trình xây dựng (18):</span>
                      <span className="font-bold text-[13px] px-2 border border-black ml-2 rounded-sm bg-slate-50">
                        {formData.assetCommitment ? "☑" : "☐"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="pl-4 py-1 italic text-slate-400">--- Không có tài sản gắn liền với đất cần đăng ký ---</div>
                )}
              </div>

              {/* SECTION 4 */}
              <div>
                <h3 className="font-bold">4. Đề nghị của người sử dụng đất, chủ sở hữu tài sản gắn liền với đất:</h3>
                <div className="pl-4 space-y-1.5 mt-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[13px] border border-black px-1.5 rounded-xs">
                      {formData.reqRegister ? "☑" : "☐"}
                    </span>
                    <span>a) Đề nghị đăng ký đất đai, tài sản gắn liền với đất</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[13px] border border-black px-1.5 rounded-xs">
                      {formData.reqCertificate ? "☑" : "☐"}
                    </span>
                    <span>b) Đề nghị cấp Giấy chứng nhận quyền sử dụng đất, quyền sở hữu tài sản gắn liền với đất</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[13px] border border-black px-1.5 rounded-xs">
                      {formData.reqDebt ? "☑" : "☐"}
                    </span>
                    <span>c) Đề nghị ghi nợ tiền sử dụng đất (đối với cá nhân)</span>
                  </div>
                  {formData.reqOther && (
                    <div className="flex items-start">
                      <span className="whitespace-nowrap">d) Đề nghị khác:</span>
                      <span className="border-b border-dashed border-black flex-1 pl-2 pb-0.5 font-bold leading-normal">
                        {formData.reqOther}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 5 */}
              <div>
                <h3 className="font-bold">5. Những giấy tờ nộp kèm theo (19):</h3>
                <div className="pl-4 space-y-1 mt-1 font-serif">
                  {formData.attachedDocuments.length === 0 ? (
                    <div className="text-slate-400 italic text-[11px] py-1">--- Không có tài liệu nộp kèm ---</div>
                  ) : (
                    formData.attachedDocuments.map((doc, idx) => (
                      <div key={idx} className="flex items-end">
                        <span>({idx + 1})</span>
                        <span className="border-b border-dashed border-black flex-1 pl-2 pb-0.5 font-medium">
                          {doc}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* Form standard commitment and signature section */}
            <div className="mt-8 space-y-4">
              <p className="text-justify leading-relaxed italic text-[11px]">
                Tôi/chúng tôi xin cam đoan nội dung kê khai trên đơn là đúng sự thật, nếu sai tôi/chúng tôi hoàn toàn chịu trách nhiệm trước pháp luật.
              </p>

              <div className="grid grid-cols-2 gap-4 text-center">
                <div></div>
                <div className="space-y-1">
                  <p className="italic text-[11px]">
                    ..., ngày {formData.signDate.split("/")[0] || "..."} tháng {formData.signDate.split("/")[1] || "..."} năm {formData.signDate.split("/")[2] || "2026"}
                  </p>
                  <p className="font-bold uppercase text-[12px] leading-tight">
                    Người sử dụng đất/Người kê khai
                  </p>
                  <p className="text-[10px] text-slate-500 italic pb-12">
                    (Ký, ghi rõ họ tên hoặc đóng dấu nếu có)
                  </p>
                  <p className="font-bold uppercase text-[13px] text-indigo-700 tracking-wide mt-8 border-t border-dashed border-slate-200 pt-3">
                    {formData.ownerName}
                  </p>
                </div>
              </div>
            </div>
            </>
            ) : (
              <div className="space-y-6">
                {/* Form standard header footnotes */}
                <div className="text-right font-bold text-[10px] mb-2 leading-tight">
                  Mẫu số 15a. Danh sách những người sử dụng chung thửa đất, Sở hữu chung tài sản gắn liền với đất
                </div>

                {/* Main Header / Title */}
                <div className="text-center space-y-2 mb-6">
                  <h2 className="font-bold text-[14px] uppercase tracking-wide">DANH SÁCH</h2>
                  <h1 className="font-extrabold text-[13px] uppercase tracking-normal leading-relaxed">
                    NHỮNG NGƯỜI SỬ DỤNG CHUNG THỬA ĐẤT, SỞ HỮU CHUNG TÀI SẢN GẮN LIỀN VỚI ĐẤT
                  </h1>
                  <h3 className="italic text-[11px] font-normal tracking-wide">(Kèm theo Mẫu số 15)</h3>
                </div>

                {/* Subtitle / Checkboxes */}
                <div className="flex justify-center gap-12 font-semibold text-[11.5px] py-1 border-y border-dashed border-black/20 my-4 text-center">
                  <div className="flex items-center gap-2">
                    <span className="border border-black w-4 h-4 flex items-center justify-center font-bold text-xs text-black">
                      {form15aData.isSharedLand ? "✓" : ""}
                    </span>
                    <span>Sử dụng chung thửa đất: {form15aData.isSharedLand ? "☑" : "☐"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="border border-black w-4 h-4 flex items-center justify-center font-bold text-xs text-black">
                      {form15aData.isSharedAsset ? "✓" : ""}
                    </span>
                    <span>Sở hữu chung tài sản gắn liền với đất: {form15aData.isSharedAsset ? "☑" : "☐"}</span>
                  </div>
                </div>

                {/* Table containing lists of people */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-black text-[11px] leading-tight">
                    <thead>
                      <tr className="bg-slate-50 text-center font-bold">
                        <th className="border border-black p-1 text-center font-bold w-[35px]" rowSpan={2}>Số thứ tự</th>
                        <th className="border border-black p-1 min-w-[120px]" rowSpan={2}>
                          Tên người sử dụng đất, chủ sở hữu tài sản gắn liền với đất
                        </th>
                        <th className="border border-black p-1 w-[55px]" rowSpan={2}>Năm sinh</th>
                        <th className="border border-black p-1" colSpan={4}>Giấy tờ pháp nhân, nhân thân</th>
                        <th className="border border-black p-1 min-w-[140px]" rowSpan={2}>Địa chỉ</th>
                      </tr>
                      <tr className="bg-slate-50 text-center font-bold text-[10px]">
                        <th className="border border-black p-1 w-[60px]">Loại giấy tờ</th>
                        <th className="border border-black p-1 w-[80px]">Số</th>
                        <th className="border border-black p-1 w-[70px]">Ngày cấp</th>
                        <th className="border border-black p-1">Cơ quan cấp</th>
                      </tr>
                      <tr className="bg-slate-100 text-center text-[9px] text-slate-600">
                        <td className="border border-black p-0.5 font-normal">(1)</td>
                        <td className="border border-black p-0.5 font-normal">(2)</td>
                        <td className="border border-black p-0.5 font-normal">(3)</td>
                        <td className="border border-black p-0.5 font-normal">(4)</td>
                        <td className="border border-black p-0.5 font-normal">(5)</td>
                        <td className="border border-black p-0.5 font-normal">(6)</td>
                        <td className="border border-black p-0.5 font-normal">(7)</td>
                        <td className="border border-black p-0.5 font-normal">(8)</td>
                      </tr>
                    </thead>
                    <tbody>
                      {form15aData.coOwners.map((owner, idx) => (
                        <tr key={owner.id} className="align-middle">
                          <td className="border border-black p-2 text-center font-bold">{idx + 1}</td>
                          <td className="border border-black p-2 font-bold uppercase">{owner.name || "..."}</td>
                          <td className="border border-black p-2 text-center">{owner.birthYear || "..."}</td>
                          <td className="border border-black p-2 text-center">{owner.docType || "..."}</td>
                          <td className="border border-black p-2 text-center font-mono">{owner.docNo || "..."}</td>
                          <td className="border border-black p-2 text-center">{owner.docDate || "..."}</td>
                          <td className="border border-black p-2 text-center">{owner.docPlace || "..."}</td>
                          <td className="border border-black p-2">{owner.address || "..."}</td>
                        </tr>
                      ))}
                      {form15aData.coOwners.length === 0 && (
                        <tr>
                          <td className="border border-black p-3 text-center text-slate-400 italic" colSpan={8}>
                            --- Chưa khai báo người đồng sử dụng nào ---
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Footer Signature */}
                <div className="flex justify-between text-[11.5px] pt-4 mt-8">
                  <div></div>
                  <div className="text-center space-y-1 w-[260px]">
                    <div className="italic">
                      ..., ngày {form15aData.signDate.split("/")[0] || "..."} tháng {form15aData.signDate.split("/")[1] || "..."} năm {form15aData.signDate.split("/")[2] || "2026"}
                    </div>
                    <div className="font-bold uppercase text-[11px] leading-snug">Người sử dụng đất/Người kê khai</div>
                    <div className="text-[9.5px] italic text-slate-500 leading-tight">(Ký và ghi rõ họ tên)</div>
                    <div className="h-20"></div>
                    {form15aData.coOwners.length > 0 && (
                      <div className="font-bold uppercase text-[12px] text-indigo-700 tracking-wide mt-8 border-t border-dashed border-slate-100 pt-3">
                        {form15aData.coOwners[0]?.name}
                      </div>
                    )}
                  </div>
                </div>

                {/* Guidelines */}
                <div className="mt-12 text-[10.5px] border-t border-dashed border-slate-300 pt-4 font-sans text-justify leading-relaxed">
                  <div className="font-bold text-slate-800 uppercase mb-1">Hướng dẫn kê khai:</div>
                  <p className="text-slate-600">
                    Việc kê khai thông tin theo hướng dẫn tại Mẫu số 15. Ghi rõ loại giấy tờ pháp nhân/nhân thân (ví dụ: CCCD, Chứng minh nhân dân, Giấy chứng nhận đăng ký doanh nghiệp...). Tất cả người đồng sử dụng đều phải ký xác nhận tại danh sách này.
                  </p>
                </div>
              </div>
            )}

            {/* Official Watermark */}
            <div className="absolute right-[1.5cm] top-[1.5cm] pointer-events-none text-[8px] border border-emerald-600/30 text-emerald-600/40 px-2 py-0.5 rounded font-sans uppercase font-bold tracking-widest no-print">
              Hệ thống SmartGCN 100% Khớp
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
