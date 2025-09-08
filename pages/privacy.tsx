import type { NextPage } from 'next';
import SEOHead from '../components/seo/SEOHead';
import H1 from '../components/typography/H1';
import H2 from '../components/typography/H2';
import H3 from '../components/typography/H3';
import P1 from '../components/typography/P1';
import P2 from '../components/typography/P2';

const PrivacyPage: NextPage = () => {
  return (
    <>
      <SEOHead 
        pageKey="privacy"
        customTitle="Privacy Policy - RealTechee"
        customDescription="Learn how RealTechee protects your personal information and privacy in our real estate technology platform."
      />
        <div className="max-w-4xl mx-auto px-6 py-12">
          <H1>Privacy Policy</H1>
          <P2 className="text-gray-600 mb-8">Effective Date: September 8, 2025</P2>
          
          <P1 className="mb-8">
            Thank you for choosing RealTechee Inc. and Subsidiaries' products and services. We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy outlines how we collect, use, disclose, and protect your data when you use our software applications, websites, and services.
          </P1>

          <P1 className="mb-8">
            RealTechee Inc. and Subsidiaries, each for itself and its other affiliates (each entity referred to as "RealTechee"), provides this consumer Privacy Policy ("RealTechee's Privacy Policy") to describe the privacy policies that apply to the RealTechee Services. RealTechee's Privacy Policy applies in connection with an individual's use of RealTechee's website ("RealTechee's Site"), or any transaction relating to one or more of RealTechee's products or services.
          </P1>

          <P1 className="mb-8">
            For the purposes of RealTechee's Privacy Policy, the term "you" or "your" relates to the individual who: (i) uses RealTechee's Site; (ii) downloads (even without using) the RealTechee platform; or (iii) applies for, or obtains, any one or more of RealTechee's products or services. The term "RealTechee," "we," or "our" refers to RealTechee Inc. and Subsidiaries.
          </P1>

          <P1 className="mb-8">
            RealTechee's Privacy Policy applies to personally identifiable information about you, which we refer to as "your information." In connection with RealTechee's treatment of your information, RealTechee's Privacy Policy describes the policies and procedures (including a summary of the relevant security controls) that RealTechee uses when collecting, maintaining, using, or transmitting (or "disclosing") to others any of your information. Please carefully read RealTechee's Privacy Policy.
          </P1>

          <H2>Consumer Privacy Notice</H2>
          <P1 className="mb-6">
            <strong>Financial Privacy Rights Under Federal Law</strong>
          </P1>
          
          <P1 className="mb-8">
            Federal law gives a consumer the right to limit some, but not all, forms of disclosing or sharing personally identifiable information that a financial institution collects about the consumer. Federal law also requires a financial institution, such as RealTechee Subsidiaries, to tell the consumer about how the institution collects, shares, and protects the consumer's personal information.
          </P1>

          <H3>What Information We Collect</H3>
          <P1 className="mb-4">We collect and may share the following types of personal information:</P1>
          <ul className="list-disc ml-8 mb-8 space-y-2">
            <li><P2><strong>Information you provide:</strong> Applications, forms, identification, financial information</P2></li>
            <li><P2><strong>Information about your transactions:</strong> Account balances, payment history, parties to transactions</P2></li>
            <li><P2><strong>Information from consumer reporting agencies:</strong> Credit history, creditworthiness</P2></li>
          </ul>

          <H3>How We Protect Your Information</H3>
          <P1 className="mb-8">
            We restrict access to personal information about you to employees who need to know that information to provide products or services to you. We maintain physical, electronic, and procedural safeguards that comply with federal regulations to guard your personal information.
          </P1>

          <P1 className="mb-8">
            RealTechee reserves the right to modify any aspect of RealTechee's Privacy Policy, and RealTechee may make these modifications at any time. In some circumstances, RealTechee may modify RealTechee's Privacy Policy in one or more ways that may affect the treatment of your information without first notifying you of those modifications. Please review the date of RealTechee's Privacy Policy (designated "Effective As Of") each time you use RealTechee's Site, or use any of the RealTechee Services.
          </P1>

          <H2>Information We Collect</H2>
          <P1 className="mb-6">We collect the following types of information:</P1>
          
          <div className="ml-6 mb-8">
            <H3>1. Personal Information</H3>
            <P2 className="mb-4">This includes data that identifies you personally, such as your name, email address, phone number, and billing information.</P2>
            
            <H3>2. Usage Data</H3>
            <P2 className="mb-4">We collect information about how you interact with our software, including log files, device information, IP addresses, and browsing history.</P2>
            
            <H3>3. Cookies and Tracking Technologies</H3>
            <P2 className="mb-4">We use cookies and similar technologies to enhance your experience and analyze usage patterns.</P2>
          </div>

          <H2>How We Use Your Information</H2>
          <P1 className="mb-4">We use data for the following purposes:</P1>
          <ul className="list-disc ml-8 mb-8 space-y-2">
            <li><P2>To operate, provide, and maintain RealTechee's platform</P2></li>
            <li><P2>To improve, modify, or further develop RealTechee's products or services</P2></li>
            <li><P2>To protect you, RealTechee's service providers, or RealTechee from fraud, malicious activity, or other privacy and security-related concerns</P2></li>
            <li><P2>To provide customer service to you or to develop or provide new services to you or to other consumers</P2></li>
            <li><P2>To investigate any act (or omission) that could be a misuse of RealTechee's Site, RealTechee's Platform, or the RealTechee Services</P2></li>
          </ul>

          <H2>Data Sharing and Disclosure</H2>
          <P1 className="mb-6">
            We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as set forth in this Privacy Policy.
          </P1>
          
          <P1 className="mb-4">We may share your information with:</P1>
          <ul className="list-disc ml-8 mb-8 space-y-2">
            <li><P2><strong>Third-Party Service Providers:</strong> We may share information with third-party service providers who assist us in operating our website, conducting our business, or servicing you.</P2></li>
            <li><P2><strong>Legal Compliance:</strong> We may disclose information when required by law or in response to lawful requests by public authorities.</P2></li>
          </ul>

          <P1 className="mb-6">
            Data disclosure laws vary between countries, and even within countries, they can be subject to federal, state/provincial, and local regulations. In the United States, data disclosure laws encompass a combination of federal and state regulations, such as:
          </P1>

          <div className="ml-6 mb-8">
            <H3>United States:</H3>
            <ul className="list-disc ml-6 mb-4 space-y-2">
              <li><P2><strong>Federal Trade Commission Act (FTC Act):</strong> The FTC Act broadly prohibits unfair and deceptive practices in commerce, including the unauthorized disclosure of personal information.</P2></li>
              <li><P2><strong>Gramm-Leach-Bliley Act (GLBA):</strong> Primarily applicable to financial institutions, GLBA requires these institutions to protect the privacy and security of consumer financial information.</P2></li>
              <li><P2><strong>California Consumer Privacy Act (CCPA):</strong> State-level legislation granting California residents specific privacy rights and imposing obligations on businesses handling their personal information.</P2></li>
            </ul>
          </div>

          <H2>Data Security</H2>
          <P1 className="mb-6">
            We implement industry-standard security measures to protect your data from unauthorized access, alteration, or disclosure.
          </P1>
          
          <P1 className="mb-8">
            We take steps designed to protect your information that we collect, maintain, or disclose. These steps include maintaining information security controls, such as encryption technologies when transferring data or storing data, firewalls, and controls over the physical access to our systems. We regularly evaluate the security controls we use and those that our service providers use for protecting the security and confidentiality of your information.
          </P1>

          <P1 className="mb-8">
            RealTechee may keep your information for as long as necessary to fulfill the purposes for the information is collected. In addition, for some types of your information, RealTechee may apply a longer retention period, such as for research or statistical analyses, except when storing or using that information for longer periods of time is not permitted under applicable law.
          </P1>

          <H2>Your Rights</H2>
          <P1 className="mb-6">
            Under some circumstances you may be allowed to prevent RealTechee from sharing your information, by exercising your right to "opt out" of certain sharing.
          </P1>

          <P1 className="mb-4">You have the right to:</P1>
          <ul className="list-disc ml-8 mb-8 space-y-2">
            <li><P2><strong>Opt-out of marketing communications:</strong> You may unsubscribe from marketing emails at any time</P2></li>
            <li><P2><strong>Opt-out of Platform-related SMS/text messaging</strong></P2></li>
            <li><P2><strong>Request data access:</strong> You may request information about the personal data we have about you</P2></li>
            <li><P2><strong>Request data deletion:</strong> You may request that we delete your personal information</P2></li>
          </ul>

          <P1 className="mb-8">
            Depending on your state of residence, you may have additional rights under that state's law that affect whether and to what extent RealTechee may disclose your information to other persons, including an affiliate of RealTechee.
          </P1>

          <H2>Opt-Out Notice: How to Limit Our Cookies and Sharing</H2>
          <div className="ml-6 mb-8">
            <H3>Cookies:</H3>
            <P2 className="mb-4">
              We process your personal information to measure and improve our sites and service, to assist our marketing campaigns, and to provide personalized content. You may adjust your cookie preferences through your browser settings.
            </P2>

            <H3>Opting Out of Sharing:</H3>
            <P2 className="mb-4">
              If you wish to limit RealTechee from sharing your information with persons that are not affiliates of RealTechee, you must exercise your opt-out right by contacting RealTechee at privacy@realtechee.com.
            </P2>
          </div>

          <H2>Disclosures Not Subject to Your Opt-Out Right</H2>
          <P1 className="mb-6">
            RealTechee makes various types of disclosures of your information to a range of persons as permitted by law. Your election to opt-out of sharing your information does not affect these types of disclosures that we may are permitted to make. RealTechee also discloses, or reserves the right to disclose, your information:
          </P1>
          <ul className="list-disc ml-8 mb-8 space-y-2">
            <li><P2>With RealTechee's service providers or contractors in connection with the services they perform for RealTechee</P2></li>
            <li><P2>If RealTechee believes in good faith that disclosure is appropriate to comply with applicable law, regulation, or legal process (such as a court order or subpoena)</P2></li>
            <li><P2>In connection with a change in ownership or control of all or a part of RealTechee's business (such as a merger, acquisition, or bankruptcy)</P2></li>
            <li><P2>Between and among RealTechee and RealTechee's future affiliates (such as subsidiaries or other companies under common control or ownership)</P2></li>
            <li><P2>With your consent (by any reasonable method, including when you orally give your consent), unless you timely revoke your consent</P2></li>
          </ul>

          <H2>For California Residents</H2>
          <P1 className="mb-6">
            <strong>CCPA/CPRA – Privacy Policy Disclosure</strong>
          </P1>

          <H3>Your Personal Information Protections</H3>
          <P1 className="mb-6">
            <strong>What is Personal Information?</strong> Under California law your "Personal Information" includes data that identifies, relates to, or may be associated with you, including demographic information, unique identifiers, account information, online activity, and browsing history.
          </P1>

          <H3>Categories of Personal Information We Collect</H3>
          <P1 className="mb-4">Your personal information that we collect may include:</P1>
          <ul className="list-disc ml-8 mb-8 space-y-2">
            <li><P2><strong>Personal identifier information:</strong> name, address, birth date, email address, IP address, information regarding your interaction with our website</P2></li>
            <li><P2><strong>Account and transaction information:</strong> account number, account information, transaction information, and credit information and required consents</P2></li>
          </ul>

          <H3>Your Rights to Protect Your Personal Information</H3>
          <ul className="list-disc ml-8 mb-8 space-y-2">
            <li><P2><strong>Right to Request Access:</strong> You have a right to access your personal information that we have collected</P2></li>
            <li><P2><strong>Right to Request Deletion:</strong> You may request that we delete personal information about you that we have collected</P2></li>
            <li><P2><strong>Right to Correct Inaccurate Information:</strong> You have the right to request RealTechee to correct any personal information of yours that is inaccurate</P2></li>
            <li><P2><strong>Right to Equal Services & Pricing:</strong> You have the right to receive equal service and pricing from us even if you choose to exercise any of your privacy rights</P2></li>
          </ul>

          <H3>Your Sensitive Personal Information Protections</H3>
          <P1 className="mb-6">
            <strong>What is Sensitive Personal Information?</strong> Under California law your "Sensitive Personal Information" means Personal Information that reveals information about your Social Security Number, driver's license, account access credentials, precise geolocation, or biometric identification data.
          </P1>

          <P1 className="mb-8">
            <strong>Right to Limit Use and Disclosure:</strong> You have the right to request RealTechee to limit the use and disclosure of sensitive personal information for purposes other than what is reasonable and beneficial to you.
          </P1>

          <H2>Do Not Track Disclosures</H2>
          <P1 className="mb-8">
            Certain web browsers offer a "Do Not Track" (DNT) option that permits users to select a preference not to have information about web browsing activities monitored and collected. Our website will not honor DNT signals from you and we will not monitor or collect information of your browsing activity.
          </P1>

          <H2>Agreement for Electronic Transactions</H2>
          <P1 className="mb-6">
            <strong>Consent to Electronic Communications and Transactions</strong>
          </P1>

          <P1 className="mb-6">
            By using RealTechee's services, you consent to receive communications from us electronically. We will communicate with you by email, text message, or by posting notices on our website. You agree that all agreements, notices, disclosures, and other communications that we provide to you electronically satisfy any legal requirement that such communications be in writing.
          </P1>

          <H3>Electronic Signatures and Records</H3>
          <P1 className="mb-4">You agree that:</P1>
          <ul className="list-disc ml-8 mb-8 space-y-2">
            <li><P2>Electronic signatures, contracts, and other records have the same legal effect as traditional paper documents</P2></li>
            <li><P2>You consent to the use of electronic signatures for all transactions and communications</P2></li>
            <li><P2>Electronic records will be stored according to our retention policies and may be accessed through your account</P2></li>
          </ul>

          <H3>Technical Requirements</H3>
          <P1 className="mb-4">To access and retain electronic communications, you must have:</P1>
          <ul className="list-disc ml-8 mb-8 space-y-2">
            <li><P2>A computer or mobile device with internet access</P2></li>
            <li><P2>A current web browser that supports HTML and JavaScript</P2></li>
            <li><P2>The ability to receive and access email</P2></li>
            <li><P2>Sufficient storage space to save or print documents</P2></li>
          </ul>

          <H3>Withdrawal of Consent</H3>
          <P1 className="mb-8">
            You may withdraw your consent to receive electronic communications at any time by contacting us at privacy@realtechee.com. However, withdrawal of consent may result in termination of your account or inability to access certain services. Any electronic communications sent before withdrawal of consent will remain valid and enforceable.
          </P1>

          <H2>Contact Information</H2>
          <P1 className="mb-4">
            If you have any questions about this Privacy Policy or our data practices, please contact us:
          </P1>
          <div className="ml-6 mb-8">
            <P2>Email: privacy@realtechee.com</P2>
            <P2>Phone: (805) 419-3114</P2>
            <P2>Address: RealTechee Inc., Los Angeles, CA</P2>
          </div>

          <P1 className="mb-8">
            You may designate an authorized agent to submit requests on your behalf by providing us with your written authorization of the agent and the nature of your request.
          </P1>

          <H2>Changes to This Policy</H2>
          <P1 className="mb-8">
            RealTechee may update this Privacy Policy at any time to reflect changes in our business, legal or regulatory requirements. If we make any material changes to this Privacy Policy, we will notify you before the changes are effective by mail or email if you have chosen email communication. Any changes to this Privacy Policy will be effective on the date we designate as the effective date or as required by law. Please visit www.realtechee.com for our current Privacy Policy.
          </P1>
        </div>
    </>
  );
};

export default PrivacyPage;