import React from 'react';
import { Checkbox } from '@mui/material';
import { CollapsibleSection } from '../common/ui';
import P2 from '../typography/P2';
import { formatCurrency } from '../../utils/formatUtils';

export interface Payment {
  paymentName: string;
  description?: string;
  paid: boolean;
  paymentAmount: number;
  order?: number;
  isSummaryRow?: boolean;
}

interface PaymentListProps {
  payments: Payment[];
  title?: string;
  initialExpanded?: boolean;
  className?: string;
  onPaymentToggle?: (payment: Payment) => void;
}

export default function PaymentList({
  payments,
  title = "Payment Schedule",
  initialExpanded = true,
  className = "",
  onPaymentToggle
}: PaymentListProps) {
  // Sort payments: summary rows at the end, others by paid status and order
  const sortedPayments = [...payments].sort((a, b) => {
    // Summary rows always go at the end
    if (a.isSummaryRow !== b.isSummaryRow) {
      return a.isSummaryRow ? 1 : -1;
    }

    // For non-summary rows, sort by paid status and order
    if (!a.isSummaryRow && !b.isSummaryRow) {
      if (a.paid !== b.paid) {
        return a.paid ? -1 : 1;
      }

      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }

      if (a.order !== undefined) return -1;
      if (b.order !== undefined) return 1;
    }

    return 0;
  });

  return (
    <div className={className}>
      <CollapsibleSection title={title} initialExpanded={initialExpanded}>
        <div className="space-y-1">
          {sortedPayments.map((payment, index) => (
            <div
              key={index}
              className={`flex items-start gap-4 py-1.5 px-2 ${payment.isSummaryRow
                  ? 'bg-gray-50'
                  : payment.paid
                    ? 'bg-gray-200'
                    : 'bg-gray-50'
                }`}
            >
              {!payment.isSummaryRow && (
                <Checkbox
                  checked={payment.paid}
                  onChange={() => onPaymentToggle?.(payment)}
                  color="default"
                  className="!pt-1"
                />
              )}
              <div className={`flex-1 ${payment.isSummaryRow ? 'ml-8' : ''}`}>
                <div className="flex justify-between items-center gap-4">
                  <P2 className={`mb-0 ${payment.isSummaryRow ? 'font-bold' : ''}`}>
                    {payment.paymentName}
                  </P2>
                  {!payment.isSummaryRow && (
                    <P2 className="mb-0 text-right">
                      ${formatCurrency((payment.paymentAmount || 0).toString())}
                    </P2>
                  )}
                </div>
                {payment.description && !payment.isSummaryRow && (
                  <P2 className="mb-0 text-gray-600 whitespace-pre-line">
                    {payment.description}
                  </P2>
                )}
              </div>
            </div>
          ))}
        </div>
      </CollapsibleSection>
    </div>
  );
}
