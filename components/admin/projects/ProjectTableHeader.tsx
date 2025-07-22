import Image from 'next/image';
import { P3 } from '../../typography';

interface ProjectTableHeaderProps {
  selectedCount: number;
  totalCount: number;
  sortField: string;
  sortDirection: 'asc' | 'desc';
  onSort: (field: string) => void;
  onSelectAll: () => void;
  onRefresh: () => void;
  onUndo: () => void;
  allSelected: boolean;
}

const ProjectTableHeader: React.FC<ProjectTableHeaderProps> = ({
  selectedCount,
  totalCount,
  sortField,
  sortDirection,
  onSort,
  onSelectAll,
  onRefresh,
  onUndo,
  allSelected
}) => {
  const columns = [
    { key: 'status', label: 'Status', width: '112px', sortable: false },
    { key: 'address', label: 'Address', width: '168px', sortable: false },
    { key: 'created', label: 'Created', sortable: true },
    { key: 'owner', label: 'Owner', sortable: true },
    { key: 'agent', label: 'Agent', sortable: true },
    { key: 'price', label: 'Price', sortable: true },
    { key: 'type', label: 'Type', sortable: true },
    { key: 'brokerage', label: 'Brokerage', sortable: true }
  ];

  const getSortIcon = (columnKey: string) => {
    if (sortField === columnKey) {
      return sortDirection === 'asc' ? (
        <Image
          src="/assets/icons/ic-sort-up.svg"
          alt="Sort ascending"
          width={16}
          height={16}
          className="ml-1"
        />
      ) : (
        <Image
          src="/assets/icons/ic-sort-up.svg"
          alt="Sort descending"
          width={16}
          height={16}
          className="ml-1 rotate-180"
        />
      );
    }
    return null;
  };

  return (
    <div className="bg-[#2A2B2E] flex items-center gap-2 px-4 py-3 rounded-b-sm">
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={allSelected}
        onChange={onSelectAll}
        className="w-4 h-4 border-2 border-white rounded-sm bg-transparent focus:ring-0 focus:ring-offset-0"
        style={{ 
          borderRadius: '2px',
          backgroundColor: 'transparent'
        }}
      />

      {/* Column Headers */}
      <div className="flex-1 flex items-center gap-[90px] pl-2 pr-6">
        {/* Status Column */}
        <div className="flex items-center gap-1" style={{ width: '112px', minWidth: '112px' }}>
          <P3 
            className="text-white leading-relaxed"
            style={{ 
              fontFamily: 'Roboto',
              fontWeight: 400,
              fontSize: '13px',
              lineHeight: '1.6',
              color: '#FFFFFF'
            }}
          >
            Status
          </P3>
        </div>

        {/* Address Column */}
        <P3 
          className="text-white leading-relaxed"
          style={{ 
            fontFamily: 'Roboto',
            fontWeight: 400,
            fontSize: '13px',
            lineHeight: '1.6',
            color: '#FFFFFF',
            width: '120px'
          }}
        >
          Address
        </P3>

        {/* Positioned Columns (matching Figma absolute positioning) */}
        <div className="relative flex-1">
          {/* Created Column */}
          <div 
            className="absolute flex items-center gap-1 cursor-pointer hover:opacity-80"
            style={{ left: '90px', top: '-1px' }}
            onClick={() => onSort('created')}
          >
            <P3 
              className="text-white leading-relaxed"
              style={{ 
                fontFamily: 'Roboto',
                fontWeight: 400,
                fontSize: '13px',
                lineHeight: '1.6',
                color: '#FFFFFF'
              }}
            >
              Created
            </P3>
            {getSortIcon('created')}
          </div>

          {/* Owner Column */}
          <div 
            className="absolute flex items-center gap-1 cursor-pointer hover:opacity-80"
            style={{ left: '196px', top: '-1px' }}
            onClick={() => onSort('owner')}
          >
            <P3 
              className="text-white leading-relaxed"
              style={{ 
                fontFamily: 'Roboto',
                fontWeight: 400,
                fontSize: '13px',
                lineHeight: '1.6',
                color: '#FFFFFF'
              }}
            >
              Owner
            </P3>
            {getSortIcon('owner')}
          </div>

          {/* Agent Column */}
          <div 
            className="absolute flex items-center gap-1 cursor-pointer hover:opacity-80"
            style={{ left: '326px', top: '-1px' }}
            onClick={() => onSort('agent')}
          >
            <P3 
              className="text-white leading-relaxed"
              style={{ 
                fontFamily: 'Roboto',
                fontWeight: 400,
                fontSize: '13px',
                lineHeight: '1.6',
                color: '#FFFFFF'
              }}
            >
              Agent
            </P3>
            {getSortIcon('agent')}
          </div>

          {/* Price Column */}
          <div 
            className="absolute flex items-center gap-1 cursor-pointer hover:opacity-80"
            style={{ left: '448px', top: '-1px' }}
            onClick={() => onSort('price')}
          >
            <P3 
              className="text-white leading-relaxed"
              style={{ 
                fontFamily: 'Roboto',
                fontWeight: 400,
                fontSize: '13px',
                lineHeight: '1.6',
                color: '#FFFFFF'
              }}
            >
              Price
            </P3>
            {getSortIcon('price')}
          </div>

          {/* Type Column */}
          <div 
            className="absolute flex items-center gap-1 cursor-pointer hover:opacity-80"
            style={{ left: '557px', top: '-1px' }}
            onClick={() => onSort('type')}
          >
            <P3 
              className="text-white leading-relaxed"
              style={{ 
                fontFamily: 'Roboto',
                fontWeight: 400,
                fontSize: '13px',
                lineHeight: '1.6',
                color: '#FFFFFF'
              }}
            >
              Type
            </P3>
            {getSortIcon('type')}
          </div>

          {/* Brokerage Column */}
          <div 
            className="absolute flex items-center gap-1 cursor-pointer hover:opacity-80"
            style={{ left: '634px', top: '-1px' }}
            onClick={() => onSort('brokerage')}
          >
            <P3 
              className="text-white leading-relaxed"
              style={{ 
                fontFamily: 'Roboto',
                fontWeight: 400,
                fontSize: '13px',
                lineHeight: '1.6',
                color: '#FFFFFF'
              }}
            >
              Brokerage
            </P3>
            {getSortIcon('brokerage')}
          </div>
        </div>
      </div>

      {/* Action Icons */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Undo Icon */}
        <button
          onClick={onUndo}
          className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-gray-700 transition-colors"
          title="Undo"
        >
          <Image
            src="/assets/icons/ic-undo.svg"
            alt="Undo"
            width={20}
            height={20}
            className="w-5 h-5"
          />
        </button>

        {/* Refresh Icon */}
        <button
          onClick={onRefresh}
          className="w-5 h-5 flex items-center justify-center rounded-full bg-[#3D3D3F] hover:bg-gray-600 transition-colors"
          title="Refresh"
        >
          <Image
            src="/assets/icons/ic-refresh.svg"
            alt="Refresh"
            width={20}
            height={20}
            className="w-5 h-5"
          />
        </button>
      </div>
    </div>
  );
};

export default ProjectTableHeader;