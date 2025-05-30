import React from 'react';
import { Checkbox } from '@mui/material';
import { CollapsibleSection } from '../common/ui';
import { BodyContent } from '../Typography';
import { formatCurrency } from '../../utils/formatUtils';

export interface Payment {
  PaymentName: string;
  Description?: string;
  Paid: boolean;
  'Payment Amount': number;
  Order?: number;
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
      if (a.Paid !== b.Paid) {
        return a.Paid ? -1 : 1;
      }

      if (a.Order !== undefined && b.Order !== undefined) {
        return a.Order - b.Order;
      }

      if (a.Order !== undefined) return -1;
      if (b.Order !== undefined) return 1;
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
                  : payment.Paid
                    ? 'bg-gray-200'
                    : 'bg-gray-50'
                }`}
            >
              {!payment.isSummaryRow && (
                <Checkbox
                  checked={payment.Paid}
                  onChange={() => onPaymentToggle?.(payment)}
                  color="default"
                  className="!pt-1"
                />
              )}
              <div className={`flex-1 ${payment.isSummaryRow ? 'ml-8' : ''}`}>
                <div className="flex justify-between items-center gap-4">
                  <BodyContent className={`!mb-0 ${payment.isSummaryRow ? 'font-bold' : ''}`}>
                    {payment.PaymentName}
                  </BodyContent>
                  {!payment.isSummaryRow && (
                    <BodyContent className="!mb-0 text-right">
                      ${formatCurrency(payment['Payment Amount'].toString())}
                    </BodyContent>
                  )}
                </div>
                {payment.Description && !payment.isSummaryRow && (
                  <BodyContent className="!mb-0 text-gray-600 whitespace-pre-line">
                    {payment.Description}
                  </BodyContent>
                )}
              </div>
            </div>
          ))}
        </div>
      </CollapsibleSection>
    </div>
  );
}
