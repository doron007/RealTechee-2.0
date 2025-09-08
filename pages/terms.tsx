import type { NextPage } from 'next';
import SEOHead from '../components/seo/SEOHead';
import H1 from '../components/typography/H1';
import H2 from '../components/typography/H2';
import H3 from '../components/typography/H3';
import P1 from '../components/typography/P1';
import P2 from '../components/typography/P2';

const TermsPage: NextPage = () => {
  return (
    <>
      <SEOHead 
        pageKey="terms"
        customTitle="Terms of Use - RealTechee"
        customDescription="Terms of Use and Service Agreement for RealTechee's real estate technology platform and services."
      />
        <div className="max-w-4xl mx-auto px-6 py-12">
          <H1>Terms of Use</H1>
          <P2 className="text-gray-600 mb-8">Effective Date: September 8, 2025</P2>

          <H2>Binding Contractual Terms</H2>
          <P1 className="mb-8">
            By using the website of RealTechee Inc. (together with its affiliates, "RealTechee"), or by downloading or using our mobile applications, including all Content (as defined below), or by accessing the Services (as defined below), You signify that: (i) You have read and You understand these terms and conditions ("Terms of Use"); and (ii) these Terms of Use have the same force and effect as a signed agreement on paper.
          </P1>

          <H2>"You" Defined; Your Status</H2>
          <P1 className="mb-6">
            RealTechee offers the Services that are subject to these Terms of Use, as well as other financial products or services, to various types of persons. Under these Terms of Use, the term "You" is defined, and each person that uses any part of the Services is bound, as follows:
          </P1>

          <div className="ml-6 mb-8">
            <H3>(i) Homeowner</H3>
            <P2 className="mb-4">
              In the case of an individual person acting for his or her own purposes ("Homeowner"), which purposes shall not be limited to any activity primarily for personal, family, or household purposes, "You" means the Homeowner that: (a) uses the Services; or (b) obtains, or seeks to obtain, from us any financial product or service offered or provided by us.
            </P2>

            <H3>(ii) Real Estate Pro</H3>
            <P2 className="mb-4">
              In the case of an individual person who is engaged in any activity relating to real estate sales or brokerage ("Real Estate Pro"), "You" means Real Estate Pro that uses the Services. Real Estate Pro who is bound to these Terms of Service hereby represents and warrants to RealTechee that, at all times that Real Estate Pro uses the Services, Real Estate Pro shall: (a) only act within the scope of Real Estate Pro's business; and (b) only use the Services in connection with Real Estate Pro's business relationship with Homeowner.
            </P2>

            <H3>(iii) Service Provider</H3>
            <P2 className="mb-4">
              In the case of an individual person who is engaged in any activity relating to any building trade, construction, staging, or any activity relating to presentation or home improvement of real property (other than real estate sales or brokerage) ("Service Provider" or "Service Pro"), "You" means Service Provider that uses the Services.
            </P2>
          </div>

          <H2>Services</H2>
          <P1 className="mb-6">
            Each of the Services is, or collectively are, the services provided by, or hosted by, one or more of the RealTechee entities. The Services include:
          </P1>
          <ul className="list-disc ml-8 mb-8 space-y-2">
            <li><P2>The provision of RealTechee's websites (each "RealTechee's Site" or a "Site")</P2></li>
            <li><P2>The mobile application of RealTechee ("RealTechee's App")</P2></li>
            <li><P2>Subject to applicable qualifications and to RealTechee's approval, the provision of any account (a "RealTechee Account")</P2></li>
            <li><P2>Any financial product or service offered, or provided, by us, which product or service may be obtained in connection with any of the Services</P2></li>
          </ul>

          <H2>Eligibility</H2>
          <P1 className="mb-8">
            You affirm that You are at least 18 years of age and are fully able and competent, in accordance with applicable laws and regulations, to enter into the terms, conditions, obligations, affirmations, representations, warranties, and indemnification set forth in these Terms of Use.
          </P1>

          <H2>Acceptable Use</H2>
          <P1 className="mb-4">You agree to use RealTechee's Services only for lawful purposes and in accordance with these Terms of Use. You agree not to:</P1>
          <ul className="list-disc ml-8 mb-8 space-y-2">
            <li><P2>Use the Services for any unlawful purpose or to solicit others to perform unlawful acts</P2></li>
            <li><P2>Violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</P2></li>
            <li><P2>Infringe upon or violate our intellectual property rights or the intellectual property rights of others</P2></li>
            <li><P2>Submit false or misleading information</P2></li>
            <li><P2>Upload or transmit viruses or any other type of malicious code</P2></li>
            <li><P2>Spam, phish, pharm, pretext, spider, crawl, or scrape</P2></li>
          </ul>

          <H2>Intellectual Property Rights</H2>
          <P1 className="mb-8">
            The Service and its original content, features, and functionality are and will remain the exclusive property of RealTechee Inc. and its licensors. The Service is protected by copyright, trademark, and other laws. Our trademarks and trade dress may not be used in connection with any product or service without our prior written consent.
          </P1>

          <H2>Privacy Policy</H2>
          <P1 className="mb-8">
            Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Service, to understand our practices.
          </P1>

          <H2>Termination</H2>
          <P1 className="mb-8">
            We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.
          </P1>

          <H2>Limitation of Liability</H2>
          <P1 className="mb-8">
            In no event shall RealTechee Inc., nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of the Service.
          </P1>

          <H2>Disclaimer</H2>
          <P1 className="mb-8">
            Your use of Service is at your sole risk. Service is provided on an "AS IS" and "AS AVAILABLE" basis. Service is provided without warranties of any kind, whether express or implied, including, but not limited to, implied warranties of merchantability, fitness for a particular purpose, non-infringement or course of performance.
          </P1>

          <H2>Governing Law</H2>
          <P1 className="mb-8">
            These Terms shall be interpreted and governed by the laws of the State of California, without regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.
          </P1>

          <H2>Contact Information</H2>
          <P1 className="mb-4">
            If you have any questions about these Terms of Use, please contact us:
          </P1>
          <div className="ml-6">
            <P2>Email: legal@realtechee.com</P2>
            <P2>Address: RealTechee Inc., Los Angeles, CA</P2>
          </div>

          <H2>Changes to Terms</H2>
          <P1 className="mb-8">
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
          </P1>
        </div>
    </>
  );
};

export default TermsPage;