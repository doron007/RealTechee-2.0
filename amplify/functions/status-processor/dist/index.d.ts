import type { ScheduledHandler } from 'aws-lambda';
/**
 * Scheduled Lambda function to process request status expiration
 * Runs daily to check for requests that should be expired due to 14-day inactivity rule
 */
export declare const handler: ScheduledHandler;
