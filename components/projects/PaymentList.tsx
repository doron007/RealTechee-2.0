import React from 'react';
import Image from 'next/image';
import { CollapsibleSection } from '../common/ui';
import { CardTitle, BodyContent } from '../Typography';
import { formatCurrency } from '../../utils/formatUtils';

export interface Payment {
  name: string;
  description: string;
  isPaid: boolean;
  price: number;
  order?: number;
}

interface PaymentListProps {
  payments: Payment[];
  title?: string;
  initialExpanded?: boolean;
  className?: string;
}

export default function PaymentList({ 
  payments,
  title = "Payment Schedule",
  initialExpanded = true,
  className = ""
}: PaymentListProps) {
  // Sort payments: paid first, then by order
  const sortedPayments = [...payments].sort((a, b) => {
    // First sort by payment status (paid items first)
    if (a.isPaid !== b.isPaid) {
      return a.isPaid ? -1 : 1;
    }
    
    // Then sort by order if both have order defined
    if (a.order !== undefined && b.order !== undefined) {
      return a.order - b.order;
    }
    
    // If only one has order defined, put the one with order first
    if (a.order !== undefined) return -1;
    if (b.order !== undefined) return 1;
    
    // If neither has order, maintain original order
    return 0;
  });

  return (
    <div className={className}>
      <CollapsibleSection title={title} initialExpanded={initialExpanded}>
        <div className="space-y-1">
          {sortedPayments.map((payment, index) => (
            <div 
              key={index} 
              className={`flex items-center gap-4 py-1.5 px-2 ${
                payment.isPaid ? 'bg-gray-200' : 'bg-gray-50'
              }`}
            >
              <div className="flex-shrink-0">
                <Image 
                  src={payment.isPaid 
                    ? '/assets/icons/btn-checkbox-checked.svg'
                    : '/assets/icons/btn-checkbox-not-checked.svg'
                  }
                  alt={payment.isPaid ? "Payment Paid" : "Oustanding payment"}
                  width={20}
                  height={20}
                />
              </div>
             
              <div className="flex-1 flex items-center">
                <div className="flex-1">
                  <div className="flex justify-between items-center gap-4">
                    <BodyContent className="!mb-0 text-[#2A2B2E]">{payment.name}</BodyContent>
                    <BodyContent className="!mb-0 text-right">
                      ${formatCurrency(payment.price.toString())}
                    </BodyContent>
                  </div>
                  {payment.description && (
                    <BodyContent className="!mb-0 text-gray-600 whitespace-pre-line">{payment.description}</BodyContent>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CollapsibleSection>
    </div>
  );
}
