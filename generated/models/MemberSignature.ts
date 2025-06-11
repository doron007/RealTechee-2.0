// Generated TypeScript model for MemberSignature
// Source: MemberSignature.csv (38 records)

export interface MemberSignature {
  memberEmail?: string;
  signature?: string;
  initials?: string;
  ip?: string;
  fullName?: string;
  initialsPublicUrl?: string;
  initialsWixUrl?: string;
  signaturePublicUrl?: string;
  signatureWixUrl?: string;
  ID: string;
  createdDate?: string;
  updatedDate?: string;
  owner?: string;
}

export interface CreateMemberSignatureInput {
  memberEmail?: string;
  signature?: string;
  initials?: string;
  ip?: string;
  fullName?: string;
  initialsPublicUrl?: string;
  initialsWixUrl?: string;
  signaturePublicUrl?: string;
  signatureWixUrl?: string;
  ID: string;
  createdDate?: string;
  updatedDate?: string;
  owner?: string;
}

export interface UpdateMemberSignatureInput {
  ID: string;
  memberEmail?: string;
  signature?: string;
  initials?: string;
  ip?: string;
  fullName?: string;
  initialsPublicUrl?: string;
  initialsWixUrl?: string;
  signaturePublicUrl?: string;
  signatureWixUrl?: string;
  createdDate?: string;
  updatedDate?: string;
  owner?: string;
}