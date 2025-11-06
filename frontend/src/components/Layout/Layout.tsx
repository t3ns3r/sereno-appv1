import React, { useState } from 'react';
import Header from './Header';
import EmergencyButton from '../Emergency/EmergencyButton';
import BottomNavigation from '../Navigation/BottomNavigation';
import ConsentBanner from '../Privacy/ConsentBanner';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [showConsentBanner, setShowConsentBanner] = useState(false);

  const handleConsentGiven = (consents: any) => {
    console.log('Consents given:', consents);
    setShowConsentBanner(false);
  };

  return (
    <div className="min-h-screen bg-sky-gradient">
      <Header />
      <main className="container mx-auto px-4 py-6 pb-24 md:pb-6">
        {children}
      </main>
      <EmergencyButton />
      <BottomNavigation />
      
      {/* Consent Banner */}
      <ConsentBanner onConsentGiven={handleConsentGiven} />
    </div>
  );
};

export default Layout;