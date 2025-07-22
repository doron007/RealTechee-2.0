import { useState } from 'react';
import Image from 'next/image';
import { P3 } from '../../typography';
import Button from '../../common/buttons/Button';

interface ProjectCardProps {
  id: string;
  title?: string;
  status: string;
  propertyAddress?: string;
  clientName?: string;
  agentName?: string;
  estimatedValue?: number;
  projectType?: string;
  brokerage?: string;
  businessCreatedDate?: string;
  createdAt?: string;
  selected: boolean;
  onSelect: (id: string) => void;
  onOpen: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  id,
  title,
  status,
  propertyAddress,
  clientName,
  agentName,
  estimatedValue,
  projectType,
  brokerage,
  businessCreatedDate,
  createdAt,
  selected,
  onSelect,
  onOpen,
  onEdit,
  onDelete
}) => {
  // Status chip styling based on Figma design
  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'Pre-listing':
        return { bg: '#F2EFFA', text: '#5632BA' };
      case 'New':
        return { bg: '#E8F5E8', text: '#2E7D2E' };
      case 'Active':
      case 'Boosting':
      case 'Listed':
        return { bg: '#E3F2FD', text: '#1976D2' };
      case 'In-escrow':
        return { bg: '#FFF3E0', text: '#F57C00' };
      case 'Sold':
      case 'Completed':
        return { bg: '#F3E5F5', text: '#7B1FA2' };
      default:
        return { bg: '#F5F5F5', text: '#666666' };
    }
  };

  const statusStyles = getStatusStyles(status);

  // Format currency according to Figma
  const formatCurrency = (value?: number): string => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Format date according to Figma (MM/DD/YYYY)
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-white border-b border-[#F6F6F6] px-4 py-3 flex items-center justify-center">
      {/* Checkbox Column */}
      <div className="w-4 h-4 flex-shrink-0">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect(id)}
          className="w-4 h-4 border-2 border-[#2A2B2E] rounded-sm focus:ring-0 focus:ring-offset-0"
          style={{
            borderRadius: '2px',
          }}
        />
      </div>

      {/* Details Column */}
      <div className="flex-1 flex items-center gap-4 pl-2 pr-6">
        {/* Status Chip */}
        <div 
          className="flex items-center justify-center px-4 py-1.5 rounded-full"
          style={{
            backgroundColor: statusStyles.bg,
            color: statusStyles.text,
            width: '112px',
            minWidth: '112px'
          }}
        >
          <P3 
            className="text-center leading-relaxed"
            style={{ 
              fontFamily: 'Roboto',
              fontWeight: 400,
              fontSize: '13px',
              lineHeight: '1.6',
              color: statusStyles.text
            }}
          >
            {status}
          </P3>
        </div>

        {/* Project Details */}
        <div className="flex-1 flex items-center gap-2">
          {/* Address Block */}
          <div className="flex-shrink-0" style={{ width: '168px' }}>
            <P3 
              className="leading-relaxed"
              style={{ 
                fontFamily: 'Roboto',
                fontWeight: 400,
                fontSize: '13px',
                lineHeight: '1.6',
                color: '#2A2B2E'
              }}
            >
              {propertyAddress || title || 'No address provided'}
            </P3>
          </div>

          {/* Other Parameters Row */}
          <div className="flex items-center gap-11 flex-1">
            {/* Date */}
            <P3 
              className="leading-relaxed whitespace-nowrap"
              style={{ 
                fontFamily: 'Roboto',
                fontWeight: 400,
                fontSize: '13px',
                lineHeight: '1.6',
                color: '#2A2B2E'
              }}
            >
              {formatDate(businessCreatedDate || createdAt)}
            </P3>

            {/* Agent */}
            <P3 
              className="leading-relaxed whitespace-nowrap"
              style={{ 
                fontFamily: 'Roboto',
                fontWeight: 400,
                fontSize: '13px',
                lineHeight: '1.6',
                color: '#2A2B2E'
              }}
            >
              {agentName || 'N/A'}
            </P3>

            {/* Homeowner */}
            <P3 
              className="leading-relaxed whitespace-nowrap"
              style={{ 
                fontFamily: 'Roboto',
                fontWeight: 400,
                fontSize: '13px',
                lineHeight: '1.6',
                color: '#2A2B2E'
              }}
            >
              {clientName || 'N/A'}
            </P3>

            {/* Price */}
            <P3 
              className="leading-relaxed whitespace-nowrap"
              style={{ 
                fontFamily: 'Roboto',
                fontWeight: 400,
                fontSize: '13px',
                lineHeight: '1.6',
                color: '#2A2B2E'
              }}
            >
              {formatCurrency(estimatedValue)}
            </P3>

            {/* Type */}
            <P3 
              className="leading-relaxed whitespace-nowrap"
              style={{ 
                fontFamily: 'Roboto',
                fontWeight: 400,
                fontSize: '13px',
                lineHeight: '1.6',
                color: '#2A2B2E'
              }}
            >
              {projectType || 'Buyer'}
            </P3>

            {/* Brokerage */}
            <P3 
              className="leading-relaxed whitespace-nowrap"
              style={{ 
                fontFamily: 'Roboto',
                fontWeight: 400,
                fontSize: '13px',
                lineHeight: '1.6',
                color: '#2A2B2E'
              }}
            >
              {brokerage || 'Brokerage'}
            </P3>
          </div>
        </div>
      </div>

      {/* Actions Column */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Open Button */}
        <button
          onClick={() => onOpen(id)}
          className="w-[18px] h-[18px] flex items-center justify-center rounded border-0 bg-transparent hover:bg-gray-100 transition-colors p-2"
          title="Open Project"
        >
          <Image
            src="/assets/icons/ic-newpage.svg"
            alt="Open"
            width={18}
            height={18}
            className="w-[18px] h-[18px]"
          />
        </button>

        {/* Edit Button */}
        <button
          onClick={() => onEdit(id)}
          className="w-[18px] h-[18px] flex items-center justify-center rounded border-0 bg-transparent hover:bg-gray-100 transition-colors p-2"
          title="Edit Project"
        >
          <Image
            src="/assets/icons/ic-edit.svg"
            alt="Edit"
            width={18}
            height={18}
            className="w-[18px] h-[18px]"
          />
        </button>

        {/* Delete Button */}
        <button
          onClick={() => onDelete(id)}
          className="w-[18px] h-[18px] flex items-center justify-center rounded border-0 bg-transparent hover:bg-gray-100 transition-colors p-2"
          title="Delete Project"
        >
          <Image
            src="/assets/icons/ic-delete.svg"
            alt="Delete"
            width={18}
            height={18}
            className="w-[18px] h-[18px]"
          />
        </button>
      </div>
    </div>
  );
};

export default ProjectCard;