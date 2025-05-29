import React from 'react';
import Image from 'next/image';
import { CollapsibleSection } from '../common/ui';
import { CardTitle, BodyContent } from '../Typography';
import { formatCurrency } from '../../utils/formatUtils';

export interface Payment {
  PaymentName: string;
  Description?: string;
  Paid: boolean;
  'Payment Amount': number;
  Order?: number;
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
    if (a.Paid !== b.Paid) {
      return a.Paid ? -1 : 1;
    }
    
    // Then sort by order if both have order defined
    if (a.Order !== undefined && b.Order !== undefined) {
      return a.Order - b.Order;
    }
    
    // If only one has order defined, put the one with order first
    if (a.Order !== undefined) return -1;
    if (b.Order !== undefined) return 1;
    
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
                payment.Paid ? 'bg-gray-200' : 'bg-gray-50'
              }`}
            >
              <div className="flex-shrink-0">
                <Image 
                  src={payment.Paid 
                    ? '/assets/icons/btn-checkbox-checked.svg'
                    : '/assets/icons/btn-checkbox-not-checked.svg'
                  }
                  alt={payment.Paid ? "Payment Paid" : "Outstanding payment"}
                  width={20}
                  height={20}
                />
              </div>
             
              <div className="flex-1 flex items-center">
                <div className="flex-1">
                  <div className="flex justify-between items-center gap-4">
                    <BodyContent className="!mb-0 text-[#2A2B2E]">{payment.PaymentName}</BodyContent>
                    <BodyContent className="!mb-0 text-right">
                      ${formatCurrency(payment['Payment Amount'].toString())}
                    </BodyContent>
                  </div>
                  {payment.Description && (
                    <BodyContent className="!mb-0 text-gray-600 whitespace-pre-line">{payment.Description}</BodyContent>
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
