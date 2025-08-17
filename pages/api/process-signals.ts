/**
 * API Endpoint: Manual Signal Processing
 * 
 * For testing and manual trigger of signal processing.
 * In production, this would be triggered by a scheduled Lambda or event.
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { signalProcessor } from '../../services/signalProcessor';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('🔄 Manual signal processing triggered');

  try {
    const results = await signalProcessor.processPendingSignals();
    
    const summary = {
      timestamp: new Date().toISOString(),
      totalSignals: results.length,
      totalHooksProcessed: results.reduce((sum, r) => sum + r.hooksProcessed, 0),
      totalNotificationsCreated: results.reduce((sum, r) => sum + r.notificationsCreated, 0),
      errors: results.flatMap(r => r.errors),
      results
    };

    console.log('✅ Signal processing completed:', summary);

    return res.status(200).json({
      success: true,
      message: 'Signal processing completed',
      ...summary
    });

  } catch (error) {
    console.error('❌ Signal processing failed:', error);
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    });
  }
}