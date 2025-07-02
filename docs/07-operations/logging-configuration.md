# Logging Strategy for RealTechee

This document outlines the logging strategy and best practices for the RealTechee application.

## Overview

We use a centralized logging utility that provides environment-aware logging with different levels to ensure clean production deployments while maintaining rich debugging capabilities in development.

## Log Levels

### Development Environment
- **DEBUG**: Detailed debugging info, API responses, state changes (only shown in development)
- **INFO**: User actions, successful operations, important state changes
- **WARN**: Recoverable errors, deprecated usage, performance issues
- **ERROR**: Critical errors, exceptions, failed operations

### Production Environment
- **INFO**: User actions, successful operations, important state changes
- **WARN**: Recoverable errors, deprecated usage, performance issues  
- **ERROR**: Critical errors, exceptions, failed operations
- **DEBUG**: Filtered out completely

### Test Environment
- **NONE**: All logs suppressed for clean test output

## Usage

### Basic Usage

```typescript
import { createLogger } from '../utils/logger';

const logger = createLogger('ComponentName');

// Development only - detailed debugging
logger.debug('User clicked button', { buttonId, userId });

// Production safe - important events
logger.info('User logged in successfully', { userId });

// Always shown - warnings and errors
logger.warn('API rate limit approaching', { requests: 95, limit: 100 });
logger.error('Failed to save user data', error);
```

### Module-Specific Loggers

Create module-specific loggers for better organization:

```typescript
// In a component
const logger = createLogger('AgentInfoCard');

// In a service
const apiLogger = createLogger('AmplifyAPI');
const projectsLogger = createLogger('ProjectsAPI');
```

## Best Practices

### What to Log at Each Level

#### DEBUG Level (Development Only)
- Detailed state changes
- API request/response data
- Complex object structures
- Debugging information
- Performance timing data

```typescript
logger.debug('Contact data loaded', {
  hasAgent: !!project.agent,
  agentId: project.agentContactId,
  fullAgentData: project.agent
});
```

#### INFO Level (Production Safe)
- User actions (login, save, delete)
- Successful operations
- Important state transitions
- Feature usage tracking

```typescript
logger.info('Project loaded successfully', { projectId });
logger.info('Agent contact loaded successfully', { agentName });
```

#### WARN Level (Always Shown)
- Recoverable errors
- Fallback scenarios
- Performance warnings
- Deprecated feature usage

```typescript
logger.warn('No agent contact data available, using fallback', { projectId });
logger.warn('API rate limit approaching', { requests: 95, limit: 100 });
```

#### ERROR Level (Always Shown)
- Critical errors
- Failed operations
- Exceptions
- Data corruption issues

```typescript
logger.error('Failed to load project contacts', error);
logger.error('Database connection failed', { retryCount, maxRetries });
```

### Guidelines

1. **Never log sensitive data** (passwords, tokens, PII) at any level
2. **Use structured logging** with objects rather than string concatenation
3. **Include relevant context** (IDs, operation names, relevant state)
4. **Keep production logs concise** - avoid verbose debugging information
5. **Use meaningful module names** that reflect the component/service

### Environment Configuration

The logger automatically configures itself based on `NODE_ENV`:

- **Development**: Shows all logs with timestamps and colors
- **Production**: Shows INFO/WARN/ERROR only, clean format
- **Test**: Suppresses all logs for clean test output

### Module-Specific Overrides

For production troubleshooting, you can enable debug logs for specific modules:

```typescript
// In logger.config.ts
export const moduleOverrides = {
  ProjectsAPI: LogLevel.DEBUG,  // Enable debug logs for this module in production
};
```

## Migration from console.log

### Before (Problematic)
```typescript
console.log('Debug info that will show in production');
console.log('User data:', sensitiveUserObject);
```

### After (Proper)
```typescript
const logger = createLogger('ComponentName');

logger.debug('Debug info for development only', { relevantData });
logger.info('User action completed', { userId, action: 'save' });
```

## Performance Considerations

- Log statements are evaluated even if not output
- Use functions for expensive log data preparation:

```typescript
// Expensive object serialization only happens if debug is enabled
logger.debug('Complex state', () => ({
  expensiveCalculation: calculateComplexState(),
  largeObject: JSON.stringify(largeDataStructure)
}));
```

## Monitoring and Alerting

In production, consider:
- Collecting ERROR logs for alerting
- Monitoring WARN logs for trends
- Using structured logging for better searchability
- Implementing log aggregation (ELK stack, CloudWatch, etc.)

## Examples from Codebase

### Component Logging
```typescript
// components/projects/AgentInfoCard.tsx
const logger = createLogger('AgentInfoCard');

logger.debug('Agent data loaded', { hasAgent: !!project.agent });
logger.info('Agent contact loaded successfully', { agentName });
logger.warn('No agent contact data available, using fallback', { projectId });
```

### API Logging
```typescript
// utils/amplifyAPI.ts
const projectsLogger = createLogger('ProjectsAPI');

projectsLogger.info('Loading project by projectID', { projectId });
projectsLogger.debug('Project query result', { success, count, filter });
projectsLogger.error('Projects query failed', error);
```

### Hook Logging
```typescript
// hooks/useProjectData.ts
const logger = createLogger('useProjectData');

logger.info('Loading project data', { projectId, forceRefresh });
logger.info('Related data loaded', { milestones, payments, comments });
```