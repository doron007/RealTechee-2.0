import React from 'react';
import { P3 } from '../../typography/P3' 

export type StatusType = 
  // Shared statuses
  'new' | 'archived' | 'expired' |
  // Project statuses
  'boosting' | 'buyer servicing' | 'pre-listing' | 'listed' | 'in-escrow' | 'sold' | 'completed' |
  // Request statuses
  'pending walk-thru' | 'move to quoting' |
  // Quote statuses
  'sent' | 'opened' | 'underwriting' | 'approved' | 'contracting' | 'contract sent' | 
  'accounting' | 'converted' | 'rejected' |
  string;

interface StatusPillProps {
  status: StatusType;
  className?: string;
}

/**
 * StatusPill component for displaying status with appropriate styling
 * Used for Projects, Requests, and Quotes status displays
 */
const StatusPill: React.FC<StatusPillProps> = ({ status, className = '' }) => {
  // Define styling based on status
  const getStatusStyles = (status: StatusType) => {
    switch (status.toLowerCase()) {
      // Shared statuses with consistent styling
      case 'new':
        return {
          bg: 'bg-[#EDFCFC]',
          text: 'text-[#117B89]'
        };
      case 'archived':
        return {
          bg: 'bg-[#F0F0F0]',
          text: 'text-[#6E6E73]'
        };
      case 'expired':
        return {
          bg: 'bg-[#F5F5F7]',
          text: 'text-[#8E8E93]'
        };
        
      // Project statuses
      case 'boosting':
        return {
          bg: 'bg-[#EBFDF7]',
          text: 'text-[#208061]'
        };
      case 'servicing':
      case 'buyer servicing':
        return {
          bg: 'bg-[#FFF7F5]',
          text: 'text-[#D45D43]'
        };
      case 'pre-listing':
        return {
          bg: 'bg-[#F2EFFA]',
          text: 'text-[#5632BA]'
        };
      case 'listed':
        return {
          bg: 'bg-[#FFF8E6]',
          text: 'text-[#8C6600]'
        };
      case 'in-escrow':
        return {
          bg: 'bg-[#FFF6F6]',
          text: 'text-[#BE1717]'
        };
      case 'sold':
        return {
          bg: 'bg-[#F6F6F6]',
          text: 'text-[#6E6E73]'
        };
      case 'completed':
        return {
          bg: 'bg-[#F2F9FF]',
          text: 'text-[#17619C]'
        };
        
      // Request statuses
      case 'pending walk-thru':
        return {
          bg: 'bg-[#F0F7FF]',
          text: 'text-[#3E7CB9]'
        };
      case 'move to quoting':
        return {
          bg: 'bg-[#EFF8F9]',
          text: 'text-[#2B9EB0]'
        };
        
      // Quote statuses
      case 'sent':
        return {
          bg: 'bg-[#F0F7FF]', // Light blue
          text: 'text-[#4086C6]'
        };
      case 'opened':
        return {
          bg: 'bg-[#EEF9FF]', // Light blue/cyan
          text: 'text-[#0B87BD]'
        };
      case 'underwriting':
        return {
          bg: 'bg-[#F5F9E8]', // Light olive
          text: 'text-[#698204]'
        };
      case 'approved':
        return {
          bg: 'bg-[#F1FAEC]', // Light green
          text: 'text-[#438522]'
        };
      case 'contracting':
        return {
          bg: 'bg-[#FFF5E6]', // Light amber
          text: 'text-[#B26C00]'
        };
      case 'contract sent':
        return {
          bg: 'bg-[#FFF8E1]', // Light amber
          text: 'text-[#A67C00]'
        };
      case 'accounting':
        return {
          bg: 'bg-[#F9F5FF]', // Light purple
          text: 'text-[#7E4DDE]'
        };
      case 'converted':
        return {
          bg: 'bg-[#F1F8FF]', // Light blue
          text: 'text-[#0073E6]'
        };
      case 'rejected':
        return {
          bg: 'bg-[#FEECEC]', // Light red
          text: 'text-[#D32F2F]'
        };
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-600'
        };
    }
  };

  const styles = getStatusStyles(status);
  
  return (
    <div className={`inline-flex px-3 py-1.5 rounded-full ${styles.bg} ${className}`}>
      <P3 className={`${styles.text} text-center`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </P3>
    </div>
  );
};

export default StatusPill;
