export type DocumentType =
  | 'IDENTITY'
  | 'INVOICE'
  | 'POLICE_REPORT'
  | 'MEDICAL'
  | 'PHOTOGRAPH'
  | 'OTHER';

export type DocumentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Document {
  id: string;
  claimId: string;
  name: string;
  type: DocumentType;
  url: string;
  uploadedAt: string;
  status: DocumentStatus;
}
