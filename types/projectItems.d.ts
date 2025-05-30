import 'reflect-metadata';
import { jsonObject, jsonMember } from 'typedjson';

export interface ProjectMilestoneData {
  ID: string;
  'Project ID': string;
  Name: string;
  Description?: string; // Making this optional
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

export interface ProjectPaymentData {
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
  isSummaryRow?: boolean; // To indicate if this is a special summary row
}

export interface ProjectCommentData {
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

@jsonObject
export class ProjectMilestone implements ProjectMilestoneData {
  @jsonMember
  ID!: string;

  @jsonMember({ name: 'Project ID' })
  'Project ID'!: string;

  @jsonMember
  Name!: string;

  @jsonMember
  Description?: string; // Making this optional

  @jsonMember({ name: 'Is Complete' })
  'Is Complete'!: boolean;

  @jsonMember({ type: Number })
  Order?: number;

  @jsonMember({ name: 'Created Date' })
  'Created Date'?: string;

  @jsonMember({ name: 'Updated Date' })
  'Updated Date'?: string;

  @jsonMember
  Owner?: string;

  @jsonMember({ name: 'Is Category' })
  'Is Category'?: boolean;

  @jsonMember({ name: 'Is Internal' })
  'Is Internal'?: boolean;

  @jsonMember({ name: 'Estimated Start' })
  'Estimated Start'?: string;

  @jsonMember({ name: 'Estimated Finish' })
  'Estimated Finish'?: string;
}

@jsonObject
export class ProjectPayment implements ProjectPaymentData {
  @jsonMember
  ID!: string;

  @jsonMember
  projectID!: string;

  @jsonMember
  PaymentName!: string;

  @jsonMember({ name: 'Payment Amount' })
  'Payment Amount'!: number;

  @jsonMember
  Description?: string;

  @jsonMember
  Order?: number;

  @jsonMember
  Paid!: boolean;

  @jsonMember
  Type?: string;

  @jsonMember
  paymentDue?: string;

  @jsonMember({ name: 'Parent Payment ID' })
  'Parent Payment ID'?: string;

  @jsonMember({ name: 'Is Category' })
  'Is Category'?: boolean;

  @jsonMember
  Internal?: boolean;

  @jsonMember({ name: 'Created Date' })
  'Created Date'?: string;

  @jsonMember({ name: 'Updated Date' })
  'Updated Date'?: string;

  @jsonMember
  Owner?: string;

  @jsonMember
  isSummaryRow?: boolean;
}

@jsonObject
export class ProjectComment implements ProjectCommentData {
  @jsonMember
  ID!: string;

  @jsonMember({ name: 'Project ID' })
  'Project ID'!: string;

  @jsonMember({ name: 'Posted By' })
  'Posted By'!: string;

  @jsonMember
  Nickname!: string;

  @jsonMember
  Comment!: string;

  @jsonMember
  Files?: string;

  @jsonMember({ name: 'Is Private' })
  'Is Private'!: boolean;

  @jsonMember({ name: 'Posted By Profile Image' })
  'Posted By Profile Image'?: string;

  @jsonMember({ name: 'Add To Gallery' })
  'Add To Gallery'?: string;

  @jsonMember({ name: 'Created Date' })
  'Created Date'!: string;

  @jsonMember({ name: 'Updated Date' })
  'Updated Date'!: string;

  @jsonMember
  Owner!: string;
}
