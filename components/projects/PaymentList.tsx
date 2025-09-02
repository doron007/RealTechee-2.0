import React from 'react';
import { Checkbox } from '@mui/material';
import { CollapsibleSection } from '../common/ui';
import P2 from '../typography/P2';
import { formatCurrency } from '../../utils/formatUtils';

// Function to mask payment amounts with dots
const maskPaymentAmount = (amount: number): string => {
  const formattedAmount = formatCurrency((amount || 0).toString());
  const digitsOnly = formattedAmount.replace(/[^0-9]/g, '');
  const maskedDigits = '•'.repeat(digitsOnly.length);
  return '$' + maskedDigits;
};

export interface Payment {
  paymentName: string;
  description?: string;
  paid: boolean;
  paymentAmount: number;
  order?: number;
  isSummaryRow?: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdDate?: string;
  updatedDate?: string;
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
  // Sort payments: summary rows at the end, others by paid status, order, then creation date (legacy first)
  const sortedPayments = [...payments].sort((a, b) => {
    // Summary rows always go at the end
    if (a.isSummaryRow !== b.isSummaryRow) {
      return a.isSummaryRow ? 1 : -1;
    }

    // For non-summary rows, sort by paid status, order, then date
    if (!a.isSummaryRow && !b.isSummaryRow) {
      if (a.paid !== b.paid) {
        return a.paid ? -1 : 1;
      }

      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }

      if (a.order !== undefined) return -1;
      if (b.order !== undefined) return 1;

      // If neither has order, sort by creation date (legacy business date first)
      // Priority: createdDate (legacy) > createdAt (Amplify auto-generated)
      const dateA = new Date(a.createdDate || a.createdAt || 0);
      const dateB = new Date(b.createdDate || b.createdAt || 0);
      return dateA.getTime() - dateB.getTime(); // Earliest first for payment terms
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
                    <P2 className="mb-0 text-right font-mono">
                      {maskPaymentAmount(payment.paymentAmount)}
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
