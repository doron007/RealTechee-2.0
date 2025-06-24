/**
 * Shared validation schemas for contact forms
 * Centralizes all validation logic to eliminate duplication
 */

import * as yup from 'yup';

// Base contact information validation schema
export const baseContactInfoSchema = yup.object({
  fullName: yup.string().required('Full name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  phone: yup.string().matches(/^\d{10}$/, 'Invalid phone number (10 digits required)').required('Phone number is required')
}).required('Contact information is required');

// Optional contact information validation schema (for homeowner info)
export const optionalContactInfoSchema = yup.object({
  fullName: yup.string().optional(),
  email: yup.string().test('email-optional', 'Invalid email', function(value) {
    if (!value || value.length === 0) return true; // Allow empty
    return yup.string().email().isValidSync(value); // Validate if has value
  }),
  phone: yup.string().test('phone-optional', 'Invalid phone number', function(value) {
    if (!value || value.length === 0) return true; // Allow empty
    return /^\d{10}$/.test(value); // Validate if has value
  })
}).optional();

// Address validation schema
export const addressSchema = yup.object({
  streetAddress: yup.string().required('Street address is required'),
  city: yup.string().required('City is required'),
  state: yup.string().required('State is required'),
  zip: yup.string().matches(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code').required('ZIP code is required')
}).required('Address is required');

// Agent information validation schema (extends base contact info)
export const agentInfoSchema = yup.object({
  fullName: yup.string().required('Agent full name is required'),
  email: yup.string().email('Invalid email').required('Agent email is required'),
  phone: yup.string().matches(/^\d{10}$/, 'Invalid phone number').required('Agent phone is required'),
  brokerage: yup.string().required('Brokerage is required'),
  customBrokerage: yup.string().when('brokerage', {
    is: 'Other',
    then: (schema) => schema.required('Please enter the brokerage name'),
    otherwise: (schema) => schema.optional()
  })
}).required('Agent information is required');

// Relation to property validation options
export const relationToPropertyOptions = [
  'Retailer',
  'Architect / Designer', 
  'Loan Officer',
  'Broker',
  'Real Estate Agent',
  'Homeowner',
  'Other'
] as const;

export const relationToPropertySchema = yup.string()
  .oneOf([...relationToPropertyOptions, ''], 'Please select your relation to the property')
  .required('Please select your relation to the property');

// Business years validation options
export const businessYearsOptions = [
  '0-2 years',
  '3-5 years', 
  '6-10 years',
  '11-15 years',
  '16+ years'
] as const;

export const businessYearsSchema = yup.string()
  .oneOf([...businessYearsOptions, ''], 'Please select business years')
  .required('Please select business years');

// Project count validation options
export const projectCountOptions = [
  '1-5',
  '6-10',
  '11-20', 
  '21-50',
  '50+'
] as const;

export const projectCountSchema = yup.string()
  .oneOf([...projectCountOptions, ''], 'Please select project count')
  .required('Please select project count');

// Work type validation options
export const workTypeOptions = [
  'Kitchen',
  'Living Areas',
  'Full Home',
  'Bath',
  'Commercial'
] as const;

export const workTypeSchema = yup.string()
  .oneOf([...workTypeOptions, ''], 'Please select work type')
  .required('Please select work type');

// Product validation options (for general inquiry)
export const productOptions = [
  'Kitchen',
  'Living Areas', 
  'Full Home',
  'Bath',
  'Commercial'
] as const;

export const productSchema = yup.string()
  .oneOf([...productOptions, ''], 'Please select a product')
  .required('Please select a product');

// RT Digital selection validation options
export const rtDigitalSelectionOptions = [
  'upload',
  'video-call',
  'in-person'
] as const;

export const rtDigitalSelectionSchema = yup.string()
  .oneOf(rtDigitalSelectionOptions, 'Please select meeting type')
  .required('Please select meeting type');

// Boolean validation helpers
export const requiredBooleanSchema = yup.boolean().required('This field is required');
export const optionalBooleanSchema = yup.boolean().optional();

// String validation helpers
export const requiredStringSchema = yup.string().required('This field is required');
export const optionalStringSchema = yup.string().optional();

// Date/time validation with conditional logic
export const conditionalDateTimeSchema = (dependentField: string, excludeValue: string) => 
  yup.string().when(dependentField, {
    is: (val: string) => val !== excludeValue,
    then: (schema) => schema.required('Meeting date and time is required'),
    otherwise: (schema) => schema.optional()
  });

// License validation with conditional logic
export const conditionalLicenseSchema = (dependentField: string, triggerValue: any) =>
  yup.string().when(dependentField, {
    is: triggerValue,
    then: (schema) => schema.required('License is required'),
    otherwise: (schema) => schema.optional()
  });