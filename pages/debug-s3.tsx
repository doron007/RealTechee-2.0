import { useState } from 'react';
import { uploadData } from 'aws-amplify/storage';
import { getCurrentUser } from 'aws-amplify/auth';
import { Amplify } from 'aws-amplify';

const DebugS3Page = () => {
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const checkAmplifyConfig = () => {
    setStatus('Checking Amplify configuration...');
    setError('');
    
    try {
      const config = Amplify.getConfig();
      console.log('Amplify Configuration:', config);
      setStatus('Amplify config retrieved successfully. Check console for details.');
    } catch (err) {
      setError(`Config error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const checkAuth = async () => {
    setStatus('Checking authentication status...');
    setError('');
    
    try {
      const user = await getCurrentUser();
      setStatus(`Authenticated as: ${user.username}`);
    } catch (err) {
      setStatus('User is not authenticated (using guest access)');
      console.log('Auth check:', err instanceof Error ? err.message : String(err));
    }
  };

  const testS3Upload = async () => {
    setStatus('Testing S3 upload...');
    setError('');
    
    try {
      const testContent = `Test upload at ${new Date().toISOString()}`;
      const testKey = `debug-test-project/${Date.now()}-test.txt`;
      
      console.log('Starting upload with key:', testKey);
      
      const uploadTask = uploadData({
        key: testKey,
        data: testContent,
        options: {
          accessLevel: 'guest'
        }
      });
      
      console.log('Upload task created:', uploadTask);
      
      const result = await uploadTask.result;
      console.log('Upload completed:', result);
      
      setStatus(`✅ Upload successful! Key: ${testKey}`);
    } catch (err) {
      console.error('Upload error:', err);
      setError(`Upload failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>S3 Upload Debug Page</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button onClick={checkAmplifyConfig} style={{ marginRight: '10px' }}>
          Check Amplify Config
        </button>
        <button onClick={checkAuth} style={{ marginRight: '10px' }}>
          Check Auth Status
        </button>
        <button onClick={testS3Upload}>
          Test S3 Upload
        </button>
      </div>
      
      {status && (
        <div style={{ background: '#e8f5e8', padding: '10px', margin: '10px 0' }}>
          <strong>Status:</strong> {status}
        </div>
      )}
      
      {error && (
        <div style={{ background: '#f5e8e8', padding: '10px', margin: '10px 0' }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      
      <div style={{ marginTop: '20px', fontSize: '12px' }}>
        <p>This debug page helps identify S3 upload issues in the browser environment.</p>
        <p>Open browser console for detailed logs.</p>
      </div>
    </div>
  );
};

export default DebugS3Page;