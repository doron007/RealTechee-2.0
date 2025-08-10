import React, { useState } from 'react';
import Head from 'next/head';
import Button from '../components/common/buttons/Button';
import H1 from '../components/typography/H1';
import H2 from '../components/typography/H2';
import H3 from '../components/typography/H3';
import P1 from '../components/typography/P1';

interface TestResult {
  form: string;
  success: boolean;
  notificationId: string;
  environment: string;
  debugMode: boolean;
}

interface TestSummary {
  testSession: string;
  timestamp: string;
  expected: {
    emails: number;
    sms: number;
    total: number;
  };
  actual: {
    formsQueued: number;
    totalExpectedNotifications: number;
    architecture: string;
    processingMode: string;
  };
  results: TestResult[];
  status: string;
  message: string;
}

const TestNotificationsPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<TestSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runTest = async () => {
    setIsLoading(true);
    setError(null);
    setTestResults(null);

    try {
      const response = await fetch('/api/test-notifications');
      const data = await response.json();

      if (response.ok) {
        setTestResults(data);
      } else {
        setError(data.error || 'Test failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <Head>
        <title>Test Notification Architecture - RealTechee</title>
        <meta name="description" content="Test the new decoupled notification architecture" />
      </Head>

      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <H1 className="text-center mb-8">🧪 Notification Architecture Test</H1>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <H3 className="text-blue-800 mb-4">Test Overview</H3>
            <P1 className="text-blue-700 mb-4">
              This test validates the new decoupled notification architecture by sending test notifications for all 4 forms:
            </P1>
            <ul className="text-blue-700 space-y-2 mb-4">
              <li>📧 <strong>Contact Us Form</strong> - Customer inquiry</li>
              <li>🎯 <strong>Get Qualified Form</strong> - Agent application</li>
              <li>🔧 <strong>Affiliate Form</strong> - Service provider application</li>
              <li>💰 <strong>Get Estimate Form</strong> - Project estimate request</li>
            </ul>
            <div className="bg-blue-100 rounded p-4">
              <P1 className="text-blue-800 font-semibold">Expected Result: 8 total notifications</P1>
              <P1 className="text-blue-600">4 emails + 4 SMS messages (one of each per form)</P1>
            </div>
          </div>

          <div className="text-center mb-8">
            <Button
              variant="primary"
              size="lg"
              onClick={runTest}
              disabled={isLoading}
            >
              {isLoading ? '🔄 Running Test...' : '🚀 Run Notification Test'}
            </Button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
              <H3 className="text-red-800 mb-2">❌ Test Failed</H3>
              <P1 className="text-red-700">{error}</P1>
            </div>
          )}

          {testResults && (
            <div className="space-y-6">
              {/* Status Overview */}
              <div className={`border rounded-lg p-6 ${
                testResults.status === 'ALL_TESTS_PASSED' 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-yellow-50 border-yellow-200'
              }`}>
                <H2 className={`mb-4 ${
                  testResults.status === 'ALL_TESTS_PASSED' 
                    ? 'text-green-800' 
                    : 'text-yellow-800'
                }`}>
                  {testResults.status === 'ALL_TESTS_PASSED' ? '🎉 All Tests Passed!' : '⚠️ Partial Success'}
                </H2>
                <P1 className={
                  testResults.status === 'ALL_TESTS_PASSED' 
                    ? 'text-green-700' 
                    : 'text-yellow-700'
                }>
                  {testResults.message}
                </P1>
              </div>

              {/* Test Details */}
              <div className="bg-gray-50 rounded-lg p-6">
                <H3 className="mb-4">📊 Test Details</H3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Test Session:</strong> {testResults.testSession}
                  </div>
                  <div>
                    <strong>Timestamp:</strong> {new Date(testResults.timestamp).toLocaleString()}
                  </div>
                  <div>
                    <strong>Architecture:</strong> {testResults.actual.architecture}
                  </div>
                  <div>
                    <strong>Processing:</strong> {testResults.actual.processingMode}
                  </div>
                </div>
              </div>

              {/* Expected vs Actual */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <H3 className="text-blue-800 mb-3">🎯 Expected</H3>
                  <div className="space-y-2 text-blue-700">
                    <div>📧 Emails: {testResults.expected.emails}</div>
                    <div>📱 SMS: {testResults.expected.sms}</div>
                    <div><strong>Total: {testResults.expected.total}</strong></div>
                  </div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <H3 className="text-green-800 mb-3">📈 Actual</H3>
                  <div className="space-y-2 text-green-700">
                    <div>✅ Forms Queued: {testResults.actual.formsQueued}/4</div>
                    <div>📬 Total Notifications: {testResults.actual.totalExpectedNotifications}</div>
                    <div><strong>Success Rate: {Math.round((testResults.actual.formsQueued / 4) * 100)}%</strong></div>
                  </div>
                </div>
              </div>

              {/* Individual Form Results */}
              <div>
                <H3 className="mb-4">📋 Individual Form Results</H3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {testResults.results.map((result, index) => (
                    <div
                      key={index}
                      className={`border rounded-lg p-4 ${
                        result.success 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">
                          {result.success ? '✅' : '❌'} {result.form}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          result.success 
                            ? 'bg-green-200 text-green-800' 
                            : 'bg-red-200 text-red-800'
                        }`}>
                          {result.success ? 'SUCCESS' : 'FAILED'}
                        </span>
                      </div>
                      <div className="text-sm space-y-1">
                        <div><strong>ID:</strong> {result.notificationId}</div>
                        <div><strong>Env:</strong> {result.environment}</div>
                        <div><strong>Debug:</strong> {result.debugMode ? 'Yes' : 'No'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Next Steps */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <H3 className="text-yellow-800 mb-3">📱 Next Steps</H3>
                <P1 className="text-yellow-700 mb-3">
                  If the test was successful, you should receive notifications at:
                </P1>
                <div className="text-yellow-700 space-y-1 text-sm">
                  <div>📧 <strong>Email:</strong> Check your debug email (usually info@realtechee.com)</div>
                  <div>📱 <strong>SMS:</strong> Check your debug phone number</div>
                  <div>⏱️ <strong>Timing:</strong> Notifications are processed by Lambda every few minutes</div>
                  <div>🔍 <strong>AWS Console:</strong> Check DynamoDB NotificationQueue table for queued items</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestNotificationsPage;