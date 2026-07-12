import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

// Initialize Gemini SDK server-side
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Set body parser limits for large image base64 uploads
  app.use(express.json({ limit: "25mb" }));
  app.use(express.urlencoded({ limit: "25mb", extended: true }));

  // API Route for health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", mode: process.env.NODE_ENV || "development" });
  });

  // API Route for OCR and Comparison
  app.post("/api/ocr", async (req, res) => {
    try {
      const { plotNumber, identityNumber, phoneNumber, imageBase64, mimeType, images } = req.body;

      let imageList: Array<{ base64: string, mimeType: string }> = [];

      if (images && Array.isArray(images) && images.length > 0) {
        imageList = images;
      } else if (imageBase64) {
        imageList = [{ base64: imageBase64, mimeType: mimeType || "image/jpeg" }];
      }

      if (imageList.length === 0) {
        return res.status(400).json({ error: "Vui lòng cung cấp ít nhất một hình ảnh sổ đỏ để xác thực." });
      }

      if (!apiKey) {
        return res.status(500).json({ 
          error: "GEMINI_API_KEY chưa được cấu hình trên server. Vui lòng kiểm tra lại thiết lập Secrets." 
        });
      }

      // Prepare image parts for Gemini
      const imageParts = imageList.map(img => ({
        inlineData: {
          mimeType: img.mimeType || "image/jpeg",
          data: img.base64,
        },
      }));

      const promptText = `
Hãy thực hiện OCR để trích xuất thông tin từ các ảnh chụp Giấy chứng nhận quyền sử dụng đất (Sổ đỏ/Sổ hồng - có thể bao gồm nhiều trang, nhiều mặt) sau đây. Hãy tổng hợp thông tin từ tất cả các hình ảnh được cung cấp để có kết quả chính xác và đầy đủ nhất.
Sau đó, đối chiếu với thông tin do người dùng cung cấp:
- Số thửa đất cần đối chiếu: "${plotNumber || "không cung cấp"}"
- Số CMND/CCCD cần đối chiếu: "${identityNumber || "không cung cấp"}"
- Số điện thoại cần đối chiếu: "${phoneNumber || "không cung cấp"}"

Yêu cầu cụ thể:
            1. Xác định xem các ảnh tải lên có phải là Giấy chứng nhận quyền sử dụng đất (hoặc trang bổ sung, trang vẽ sơ đồ, trang ghi chủ sở hữu, giấy tờ liên quan quyền sử dụng đất) hay không. Nếu không phải hình nào liên quan, hãy báo lỗi trong phần tóm tắt.
2. Trích xuất thông tin tổng hợp từ tất cả các hình ảnh được cung cấp:
   - Số thửa đất (thường có dạng "Thửa đất số: ...")
   - Số tờ bản đồ (thường có dạng "Tờ bản đồ số: ...")
   - Số CMND/CCCD/Hộ chiếu người sử dụng đất (thường ở mục "I. Người sử dụng đất, chủ sở hữu nhà ở...", ví dụ "Số định danh cá nhân:...", "CMND số:...", "CCCD số:...")
   - Họ và tên người sử dụng đất (chủ sở hữu)
   - Địa chỉ thửa đất (nơi có đất)
   - Diện tích (m2)
   - Ngày cấp/Ký sổ đỏ
   - Nguồn gốc sử dụng đất (thường ghi ở mục "g) Nguồn gốc sử dụng: ...", ví dụ "Nhận chuyển nhượng...", "Công nhận quyền sử dụng đất...", "Nhà nước giao đất...", "Được thừa kế...", v.v.)
   - Số điện thoại (hầu như không có trên sổ đỏ, nhưng hãy trích xuất nếu tìm thấy)
3. Đối chiếu so khớp dữ liệu:
   - So khớp số thửa đất: So sánh số thửa đất trích xuất được với số thửa đất người dùng nhập. Hãy so sánh linh hoạt (ví dụ: "102" so với "Thửa số 102" là Khớp).
   - So khớp số CMND/CCCD: So sánh số CMND/CCCD trích xuất được với số do người dùng nhập. Xem có trùng khớp hoàn toàn hoặc trùng khớp một phần không.
   - So khớp số điện thoại: Thường sổ đỏ không ghi số điện thoại. Do đó nếu không tìm thấy số điện thoại trên sổ đỏ, hãy ghi rõ "Không tìm thấy số điện thoại trên sổ đỏ" và đánh dấu Match là false hoặc không khớp vì lý do thiếu thông tin (đây là điều bình thường, không làm mất tính hợp lệ của sổ đỏ).
4. Đưa ra kết luận tổng quan (isOverallValid): Khớp hoàn toàn nếu thửa đất và CMND/CCCD đều khớp.
5. Cung cấp một bản tóm tắt phân tích chi tiết bằng Tiếng Việt thân thiện, rõ ràng, mô tả những thông tin trích xuất được từ mỗi trang ảnh khác nhau (ví dụ: Trang 1 chứa thông tin chủ đất, Trang 2 chứa thông tin thửa đất).
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [...imageParts, { text: promptText }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isLandCertificate: { 
                type: Type.BOOLEAN, 
                description: "True nếu hình ảnh là Giấy chứng nhận quyền sử dụng đất/tài sản gắn liền với đất hoặc liên quan, False nếu không phải" 
              },
              extractedData: {
                type: Type.OBJECT,
                properties: {
                  plotNumber: { type: Type.STRING, description: "Số thửa đất trích xuất được (ví dụ: '124')" },
                  mapSheetNumber: { type: Type.STRING, description: "Số tờ bản đồ trích xuất được (ví dụ: '12')" },
                  ownerId: { type: Type.STRING, description: "Số CMND/CCCD/Hộ chiếu của chủ sở hữu được ghi trên sổ" },
                  ownerName: { type: Type.STRING, description: "Tên chủ sở hữu đất" },
                  address: { type: Type.STRING, description: "Địa chỉ thửa đất" },
                  area: { type: Type.STRING, description: "Diện tích đất trích xuất được (ví dụ: '100 m2')" },
                  issueDate: { type: Type.STRING, description: "Ngày cấp phát sổ đỏ" },
                  phone: { type: Type.STRING, description: "Số điện thoại tìm thấy trên sổ đỏ (thường trống hoặc không có)" },
                  origin: { type: Type.STRING, description: "Nguồn gốc sử dụng đất trích xuất được (ví dụ: 'Nhận chuyển nhượng...')" }
                },
                required: ["plotNumber", "ownerName"]
              },
              comparison: {
                type: Type.OBJECT,
                properties: {
                  plotNumberMatch: {
                    type: Type.OBJECT,
                    properties: {
                      extracted: { type: Type.STRING, description: "Giá trị thửa đất trích xuất được" },
                      inputted: { type: Type.STRING, description: "Giá trị thửa đất người dùng nhập" },
                      isMatched: { type: Type.BOOLEAN, description: "True nếu khớp, False nếu không khớp" },
                      explanation: { type: Type.STRING, description: "Mô tả chi tiết việc so sánh bằng tiếng Việt" }
                    },
                    required: ["extracted", "inputted", "isMatched", "explanation"]
                  },
                  ownerIdMatch: {
                    type: Type.OBJECT,
                    properties: {
                      extracted: { type: Type.STRING, description: "Giá trị CMND/CCCD trích xuất được" },
                      inputted: { type: Type.STRING, description: "Giá trị CMND/CCCD người dùng nhập" },
                      isMatched: { type: Type.BOOLEAN, description: "True nếu khớp, False nếu không khớp" },
                      explanation: { type: Type.STRING, description: "Mô tả chi tiết bằng tiếng Việt" }
                    },
                    required: ["extracted", "inputted", "isMatched", "explanation"]
                  },
                  phoneMatch: {
                    type: Type.OBJECT,
                    properties: {
                      extracted: { type: Type.STRING, description: "Giá trị số điện thoại trích xuất được" },
                      inputted: { type: Type.STRING, description: "Giá trị số điện thoại người dùng nhập" },
                      isMatched: { type: Type.BOOLEAN, description: "True nếu khớp, False nếu không khớp" },
                      explanation: { type: Type.STRING, description: "Mô tả chi tiết bằng tiếng Việt (thường là ghi nhận Sổ đỏ không lưu số điện thoại)" }
                    },
                    required: ["extracted", "inputted", "isMatched", "explanation"]
                  }
                },
                required: ["plotNumberMatch", "ownerIdMatch", "phoneMatch"]
              },
              isOverallValid: { 
                type: Type.BOOLEAN, 
                description: "True nếu cả thửa đất và CMND/CCCD đều khớp chính xác, hoặc khớp hợp lệ." 
              },
              summary: { 
                type: Type.STRING, 
                description: "Bản tóm tắt kết quả phân tích bằng Tiếng Việt, nêu rõ điểm khớp và không khớp, hướng dẫn nếu cần." 
              }
            },
            required: ["isLandCertificate", "extractedData", "comparison", "isOverallValid", "summary"]
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        return res.status(500).json({ error: "Không nhận được phản hồi từ mô hình phân tích OCR." });
      }

      const ocrResult = JSON.parse(responseText.trim());
      return res.json(ocrResult);

    } catch (error: any) {
      console.error("OCR API error:", error);
      return res.status(500).json({ 
        error: "Có lỗi xảy ra trong quá trình nhận diện và xác thực OCR.",
        details: error?.message || error
      });
    }
  });

  // Vite development / production setup
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
    console.log(`Server is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

startServer();
