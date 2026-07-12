export interface UserInputData {
  plotNumber: string;
  identityNumber: string;
  phoneNumber: string;
}

export interface ExtractedData {
  plotNumber: string;
  mapSheetNumber?: string;
  ownerId: string;
  ownerName: string;
  address?: string;
  area?: string;
  issueDate?: string;
  phone?: string;
  origin?: string;
}

export interface MatchField {
  extracted: string;
  inputted: string;
  isMatched: boolean;
  explanation: string;
}

export interface ComparisonData {
  plotNumberMatch: MatchField;
  ownerIdMatch: MatchField;
  phoneMatch: MatchField;
}

export interface OcrResult {
  isLandCertificate: boolean;
  extractedData: ExtractedData;
  comparison: ComparisonData;
  isOverallValid: boolean;
  summary: string;
}

export interface SavedRecord {
  id: string;
  plotNumber: string;
  mapSheetNumber: string;
  ownerName: string;
  ownerId: string;
  address: string;
  area: string;
  issueDate: string;
  phoneNumber: string;
  verifiedAt: string;
  status: "matched" | "mismatched" | "manual";
  notes?: string;
  origin?: string;
}

export interface SimulationParams {
  ownerName: string;
  identityNumber: string;
  plotNumber: string;
  mapSheetNumber: string;
  area: string;
  address: string;
  issueDate: string;
}

export interface UploadedImage {
  id: string;
  preview: string; // Base64 data URI
  mimeType: string;
  fileName: string;
}

export interface Form15Data {
  authority: string;
  ownerName: string;
  ownerId: string;
  ownerAddress: string;
  ownerPhone: string;
  ownerEmail: string;
  plotNumber: string;
  mapSheetNumber: string;
  landAddress: string;
  area: string;
  areaCommon: string;
  areaPrivate: string;
  purpose: string;
  purposeStartDate: string;
  duration: string;
  origin: string;
  restrictions: string;
  hasAsset: boolean;
  assetType: string;
  assetArea: string;
  assetFloorArea: string;
  assetCommon: string;
  assetPrivate: string;
  floors: string;
  floorsNoi: string;
  floorsHam: string;
  assetOrigin: string;
  assetYear: string;
  assetDuration: string;
  assetCommitment: boolean;
  reqRegister: boolean;
  reqCertificate: boolean;
  reqDebt: boolean;
  reqOther: string;
  attachedDocuments: string[];
  signLocation: string;
  signDate: string;
}

export interface CoOwner {
  id: string;
  name: string;
  birthYear: string;
  docType: string;
  docNo: string;
  docDate: string;
  docPlace: string;
  address: string;
}

export interface Form15aData {
  isSharedLand: boolean;
  isSharedAsset: boolean;
  coOwners: CoOwner[];
  signLocation: string;
  signDate: string;
}


