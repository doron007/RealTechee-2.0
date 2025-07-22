import { useState, useEffect } from 'react';
import { H4, P2, P3 } from '../../typography';
import { createLogger } from '../../../utils/logger';

const logger = createLogger('StatusAuditTrail');

interface StatusAuditEntry {
  timestamp: string;
  fromStatus: string;
  toStatus: string;
  user: string;
  reason?: string;
  type: 'manual' | 'automatic' | 'system';
}

interface StatusAuditTrailProps {
  requestId: string;
  officeNotes?: string;
  className?: string;
}

/**
 * Component to display status change audit trail
 * Parses office notes to extract status change history
 */
const StatusAuditTrail: React.FC<StatusAuditTrailProps> = ({
  requestId,
  officeNotes = '',
  className = ''
}) => {
  const [auditEntries, setAuditEntries] = useState<StatusAuditEntry[]>([]);

  useEffect(() => {
    if (!officeNotes) {
      setAuditEntries([]);
      return;
    }

    try {
      // Parse office notes to extract status change entries
      const entries: StatusAuditEntry[] = [];
      const lines = officeNotes.split('\n');

      for (const line of lines) {
        // Look for status change patterns
        // Format: [timestamp] Status changed from 'oldStatus' to 'newStatus' by user - Reason: reason
        const statusChangeMatch = line.match(
          /\[([^\]]+)\]\s*Status changed from '([^']+)' to '([^']+)' by ([^-\n]+)(?:\s*-\s*(?:Reason:\s*)?(.+))?/
        );

        if (statusChangeMatch) {
          const [, timestamp, fromStatus, toStatus, user, reason] = statusChangeMatch;
          
          // Determine type based on user
          let type: 'manual' | 'automatic' | 'system' = 'manual';
          if (user.trim() === 'system') {
            type = 'system';
          } else if (reason?.includes('automatically')) {
            type = 'automatic';
          }

          entries.push({
            timestamp: timestamp.trim(),
            fromStatus: fromStatus.trim(),
            toStatus: toStatus.trim(),
            user: user.trim(),
            reason: reason?.trim(),
            type
          });
        }
      }

      // Sort by timestamp (newest first)
      entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setAuditEntries(entries);

      logger.debug('Parsed audit entries', { 
        requestId, 
        entriesCount: entries.length,
        entries 
      });
    } catch (error) {
      logger.error('Failed to parse audit trail', { error, requestId });
      setAuditEntries([]);
    }
  }, [officeNotes, requestId]);

  const formatTimestamp = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch {
      return timestamp;
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'new':
        return 'text-blue-600 bg-blue-50';
      case 'pending walk-thru':
        return 'text-yellow-600 bg-yellow-50';
      case 'move to quoting':
        return 'text-purple-600 bg-purple-50';
      case 'expired':
        return 'text-red-600 bg-red-50';
      case 'archived':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getTypeIcon = (type: 'manual' | 'automatic' | 'system'): string => {
    switch (type) {
      case 'manual':
        return '👤'; // User icon
      case 'automatic':
        return '⚡'; // Lightning bolt
      case 'system':
        return '🤖'; // Robot
      default:
        return '📝';
    }
  };

  const getTypeLabel = (type: 'manual' | 'automatic' | 'system'): string => {
    switch (type) {
      case 'manual':
        return 'Manual';
      case 'automatic':
        return 'Automatic';
      case 'system':
        return 'System';
      default:
        return 'Unknown';
    }
  };

  if (auditEntries.length === 0) {
    return (
      <div className={`bg-gray-50 rounded-lg p-4 ${className}`}>
        <H4 className="mb-2 text-gray-600">Status History</H4>
        <P3 className="text-gray-500 italic">No status changes recorded</P3>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <H4 className="mb-4 text-gray-800">Status History ({auditEntries.length})</H4>
      
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {auditEntries.map((entry, index) => (
          <div
            key={index}
            className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-100"
          >
            <div className="flex-shrink-0">
              <span className="text-lg" title={getTypeLabel(entry.type)}>
                {getTypeIcon(entry.type)}
              </span>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(entry.fromStatus)}`}>
                  {entry.fromStatus}
                </span>
                <span className="text-gray-400">→</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(entry.toStatus)}`}>
                  {entry.toStatus}
                </span>
              </div>
              
              <P3 className="text-gray-600 mb-1">
                {formatTimestamp(entry.timestamp)} • {entry.user}
              </P3>
              
              {entry.reason && (
                <P3 className="text-gray-500 italic">
                  {entry.reason}
                </P3>
              )}
            </div>
            
            <div className="flex-shrink-0">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                entry.type === 'manual' ? 'bg-blue-100 text-blue-800' :
                entry.type === 'automatic' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {getTypeLabel(entry.type)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatusAuditTrail;