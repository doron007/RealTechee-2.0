import React from 'react';
import Card, { CardProps } from '../../common/ui/Card';

/**
 * CardWrapper - A simple wrapper around the base Card component that makes title optional
 * for admin interface usage where cards are used purely as layout containers
 */
interface CardWrapperProps extends Omit<CardProps, 'title'> {
  title?: string | React.ReactNode;
  children?: React.ReactNode;
}

const CardWrapper: React.FC<CardWrapperProps> = ({ 
  title = '', 
  children,
  ...props 
}) => {
  return (
    <Card title={title} {...props}>
      {children}
    </Card>
  );
};

export default CardWrapper;