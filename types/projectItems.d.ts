export interface ProjectMilestone {
  ID: string;
  'Project ID': string;
  Name: string;
  Description: string;
  'Is Complete': boolean;
  Order?: number;
  'Created Date'?: string;
  'Updated Date'?: string;
  Owner?: string;
  'Is Category'?: boolean;
  'Is Internal'?: boolean;
  'Estimated Start'?: string;
  'Estimated Finish'?: string;
}

export interface ProjectPayment {
  ID: string;
  projectID: string;
  PaymentName: string;
  'Payment Amount': number;
  Description?: string;
  Order?: number;
  Paid: boolean;
  Type?: string;
  paymentDue?: string;
  'Parent Payment ID'?: string;
  'Is Category'?: boolean;
  Internal?: boolean;
  'Created Date'?: string;
  'Updated Date'?: string;
  Owner?: string;
}

export interface ProjectComment {
  ID: string;
  'Project ID': string;
  'Posted By': string;
  Nickname: string;
  Comment: string;
  Files?: string;
  'Is Private': boolean;
  'Posted By Profile Image'?: string;
  'Add To Gallery'?: string;
  'Created Date': string;
  'Updated Date': string;
  Owner: string;
}
