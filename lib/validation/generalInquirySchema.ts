/**
 * Validation schema for GeneralInquiryForm
 * Uses shared schemas for consistency
 */

import * as yup from 'yup';
import { baseContactInfoSchema, addressSchema, productSchema, requiredStringSchema } from './commonSchemas';

export const generalInquiryValidationSchema = yup.object({
  contactInfo: baseContactInfoSchema,
  address: addressSchema,
  product: productSchema,
  subject: requiredStringSchema,
  message: requiredStringSchema
}).required();