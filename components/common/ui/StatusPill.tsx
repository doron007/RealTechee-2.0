import React from 'react';
import { CardContent } from '../../Typography';

export type ProjectStatus = 'boosting' | 'completed' | 'servicing' | string;

interface StatusPillProps {
  status: ProjectStatus;
  className?: string;
}

/**
 * StatusPill component for displaying project status with appropriate styling
 * Extends the basic Pill component to add status-specific styling
 */
const StatusPill: React.FC<StatusPillProps> = ({ status, className = '' }) => {
  // Define styling based on status
  const getStatusStyles = (status: ProjectStatus) => {
    switch (status.toLowerCase()) {
      case 'boosting':
        return {
          bg: 'bg-[#EBFDF7]',
          text: 'text-[#2AA57D]'
        };
      case 'completed':
        return {
          bg: 'bg-[#F2F9FF]',
          text: 'text-[#17619C]'
        };
      case 'servicing':
      case 'buyer servicing':
        return {
          bg: 'bg-[#FFF7F5]',
          text: 'text-[#E9664A]'
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
      <CardContent spacing="none" className={`${styles.text} text-center`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </CardContent>
    </div>
  );
};

export default StatusPill;
