import React from 'react';
import StatusPill, { StatusType } from '../common/ui/StatusPill';
import { SectionTitle, Subtitle, Body2 } from '../Typography';

interface StatusFlowProps {
  title: string;
  statuses: StatusType[];
}

/**
 * StatusFlow component to display a workflow of statuses in order from start to finish
 */
const StatusFlow: React.FC<StatusFlowProps> = ({ title, statuses }) => {
  return (
    <div className="flex-1">
      <Subtitle className="mb-4">{title}</Subtitle>
      <div className="flex flex-col space-y-1">
        {statuses.map((status, index) => (
          <div key={status} className="flex items-center space-x-3">
            <span className="text-sm font-semibold text-gray-500">{index + 1}.</span>
            <StatusPill status={status} />
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * StatusPillShowcase component that demonstrates all status pill variants
 * Organized in three columns showing the workflow progression for each entity type
 */
const StatusPillShowcase: React.FC = () => {
  // Request workflow statuses in order
  const requestStatuses: StatusType[] = [
    'new',
    'pending walk-thru', 
    'move to quoting',
    'expired',
    'archived'
  ];
  
  // Quote workflow statuses in order
  const quoteStatuses: StatusType[] = [
    'new',
    'sent',
    'opened',
    'underwriting',
    'approved',
    'contracting',
    'contract sent',
    'accounting',
    'converted',
    'rejected',
    'expired',
    'archived'
  ];
  
  // Project workflow statuses in order
  const projectStatuses: StatusType[] = [
    'new',
    'boosting', 
    'buyer servicing', 
    'pre-listing', 
    'listed', 
    'in-escrow', 
    'sold', 
    'completed',
    'archived'
  ];

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <SectionTitle className="mb-6">Status Pills</SectionTitle>
      
      <Body2 className="mb-8">
        Status pills are used to visually indicate the status of Projects, Requests, and Quotes throughout the platform.
        Each column below shows the workflow progression for each entity type, from start to finish.
      </Body2>
      
      <div className="flex flex-col md:flex-row gap-8">
        <StatusFlow title="Request Statuses" statuses={requestStatuses} />
        <StatusFlow title="Quote Statuses" statuses={quoteStatuses} />
        <StatusFlow title="Project Statuses" statuses={projectStatuses} />
      </div>
    </div>
  );
};

export default StatusPillShowcase;