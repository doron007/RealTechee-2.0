import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

export type ContactScenario = 'estimate' | 'inquiry' | 'qualified' | 'affiliate';

interface ContactScenarioOption {
  id: ContactScenario;
  title: string;
  description: string;
  href: string;
  isDefault?: boolean;
}

interface ContactScenarioSelectorProps {
  currentPage?: ContactScenario | 'main';
}

const CONTACT_SCENARIOS: ContactScenarioOption[] = [
  {
    id: 'estimate',
    title: 'Get an Estimate',
    description: 'For customers seeking project estimates and quotes',
    href: '/contact/get-estimate',
    isDefault: true
  },
  {
    id: 'inquiry',
    title: 'Contact Us',
    description: 'Standard contact us form for general questions',
    href: '/contact',
    isDefault: false
  },
  {
    id: 'qualified',
    title: 'Get Qualified',
    description: 'For Real Estate agents seeking platform qualification',
    href: '/contact/get-qualified',
    isDefault: false
  },
  {
    id: 'affiliate',
    title: 'Affiliate Inquiry',
    description: 'For service providers seeking partnership opportunities',
    href: '/contact/affiliate',
    isDefault: false
  }
];

export default function ContactScenarioSelector({ 
  currentPage = 'main'
}: ContactScenarioSelectorProps) {
  const router = useRouter();

  // Determine if a scenario is currently selected based on the current route
  const getCurrentScenario = (): ContactScenario | null => {
    if (currentPage !== 'main') return currentPage;
    
    const path = router.asPath;
    if (path.includes('get-estimate')) return 'estimate';
    if (path === '/contact') return 'inquiry';
    if (path.includes('get-qualified')) return 'qualified';
    if (path.includes('affiliate')) return 'affiliate';
    return null;
  };

  const currentScenario = getCurrentScenario();

  return (
    <>
      {CONTACT_SCENARIOS.map((scenario) => {
        const isSelected = currentScenario === scenario.id;
        
        return (
          <Link
            key={scenario.id}
            href={scenario.href}
            className={`
              px-6 py-4 rounded font-bold text-base transition-all duration-200 whitespace-nowrap
              focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
              ${isSelected 
                ? 'bg-primary text-white border border-primary' 
                : 'bg-white text-primary border border-primary hover:bg-gray-50'
              }
            `}
          >
            {scenario.title}
          </Link>
        );
      })}
    </>
  );
}