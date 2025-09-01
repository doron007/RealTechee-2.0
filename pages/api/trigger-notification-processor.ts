import type { NextApiRequest, NextApiResponse } from 'next';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import logger from '../../lib/logger';

const lambdaClient = new LambdaClient({ region: process.env.AWS_REGION || 'us-west-1' });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    logger.info('🚀 Manual notification processor trigger requested', {
      reason: req.body.reason || 'manual',
      signalId: req.body.signalId
    });

    // Get the notification processor Lambda function name from environment
    const functionName = process.env.NOTIFICATION_PROCESSOR_FUNCTION_NAME || 
                        'amplify-realtecheeclone-d-notificationprocessorlam-sLgeFvCfN0xX';

    // Invoke the notification processor Lambda directly
    const command = new InvokeCommand({
      FunctionName: functionName,
      InvocationType: 'Event', // Asynchronous invocation
      Payload: JSON.stringify({
        source: 'manual-trigger',
        reason: req.body.reason || 'form_submission',
        signalId: req.body.signalId,
        timestamp: new Date().toISOString()
      })
    });

    const response = await lambdaClient.send(command);
    
    logger.info('✅ Notification processor invoked successfully', {
      statusCode: response.StatusCode,
      functionName
    });

    res.status(200).json({ 
      success: true, 
      message: 'Notification processor triggered',
      statusCode: response.StatusCode
    });

  } catch (error) {
    logger.error('❌ Failed to trigger notification processor', {
      error: error instanceof Error ? error.message : String(error)
    });

    // Fallback: Try using alternative function name patterns
    try {
      const sandboxFunctionName = 'amplify-d200k2wsaf8th3-st-notificationprocessorlam-CyqmoAmXrj2F';
      
      const fallbackCommand = new InvokeCommand({
        FunctionName: sandboxFunctionName,
        InvocationType: 'Event',
        Payload: JSON.stringify({
          source: 'manual-trigger-fallback',
          reason: req.body.reason || 'form_submission',
          signalId: req.body.signalId,
          timestamp: new Date().toISOString()
        })
      });

      const fallbackResponse = await lambdaClient.send(fallbackCommand);
      
      logger.info('✅ Notification processor invoked via fallback', {
        statusCode: fallbackResponse.StatusCode,
        functionName: sandboxFunctionName
      });

      res.status(200).json({ 
        success: true, 
        message: 'Notification processor triggered via fallback',
        statusCode: fallbackResponse.StatusCode
      });

    } catch (fallbackError) {
      logger.error('❌ Fallback notification processor trigger also failed', {
        error: fallbackError instanceof Error ? fallbackError.message : String(fallbackError)
      });

      res.status(500).json({ 
        success: false, 
        error: 'Failed to trigger notification processor',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }
}