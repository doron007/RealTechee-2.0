import React from 'react';

export type GridColumns = 1 | 2 | 3 | 4;
export type GridGap = 'small' | 'medium' | 'large';

interface GridContainerProps {
  children: React.ReactNode;
  className?: string;
  columns?: GridColumns;
  mobileColumns?: GridColumns;
  tabletColumns?: GridColumns;
  gap?: GridGap;
}

export default function GridContainer({
  children,
  className = '',
  columns = 2,
  mobileColumns = 1,
  tabletColumns = columns <= 2 ? columns : 2,
  gap = 'medium',
}: GridContainerProps) {
  const gapClasses = {
    small: 'gap-4',
    medium: 'gap-6 sm:gap-8',
    large: 'gap-8 sm:gap-10 md:gap-12',
  };

  const getColumnsClass = (cols: GridColumns) => {
    return `grid-cols-${cols}`;
  };

  const gridClass = `grid ${getColumnsClass(mobileColumns)} sm:${getColumnsClass(tabletColumns)} md:${getColumnsClass(columns)} ${gapClasses[gap]} ${className}`;

  return (
    <div className={gridClass}>
      {children}
    </div>
  );
}