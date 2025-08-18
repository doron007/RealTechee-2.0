// Need to use dynamic import for ES modules in Next.js environment
async function testTemplateAPI() {
  console.log('🔍 Testing NotificationTemplate API...');
  
  try {
    // Import the module dynamically
    const { notificationTemplatesAPI } = await import('./utils/amplifyAPI.js');
    const result = await notificationTemplatesAPI.list();
    
    console.log('📊 API Response:');
    console.log('Success:', result.success);
    console.log('Data length:', result.data?.length || 0);
    
    if (result.data && result.data.length > 0) {
      console.log('\n📋 First template details:');
      const first = result.data[0];
      console.log('ID:', first.id);
      console.log('Name:', first.name);
      console.log('Form Type:', first.formType);
      console.log('Email Subject:', first.emailSubject || 'NOT AVAILABLE');
      console.log('Email Content HTML:', first.emailContentHtml ? `${first.emailContentHtml.substring(0, 100)}...` : 'NOT AVAILABLE');
      console.log('SMS Content:', first.smsContent || 'NOT AVAILABLE');
      console.log('Variables:', first.variables);
      
      console.log('\n📋 All template names:');
      result.data.forEach((template, index) => {
        console.log(`${index + 1}. ${template.name}`);
        console.log(`   Email Subject: ${template.emailSubject || 'MISSING'}`);
        console.log(`   SMS Content: ${template.smsContent || 'MISSING'}`);
      });
    } else {
      console.log('❌ No templates returned');
    }
    
  } catch (error) {
    console.error('❌ API test failed:', error);
  }
}

testTemplateAPI();