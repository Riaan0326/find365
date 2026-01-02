import { useState, useEffect } from 'react';
import Header from './components/layout/Header';
import Hero from './components/layout/Hero';
import HeaderModern from './components/layout-modern/HeaderM';
import HeroModern from './components/layout-modern/HeroM';
import ServiceProvider from './components/pages/ServiceProvider';
import LoginSP from './components/pages/LoginSP';
import RegistrationSP from './components/pages/RegistrationSP';
import Disclaimer from './components/pages/Disclaimer';
import TermsConditions from './components/pages/TermsConditions';
import PrivacyPolicy from './components/pages/PrivacyPolicy';

function App() {
  const [selectedStyle, setSelectedStyle] = useState<'classic' | 'modern' | null>('modern');
  const [currentPage, setCurrentPage] = useState(() => {
    const savedPage = localStorage.getItem('rides911-currentPage') || 'home';
    
    // Check URL parameters for PWA type
    const urlParams = new URLSearchParams(window.location.search);
    const pwaType = urlParams.get('pwa');
    
    // Check if URL is /service-provider (from notification)
    if (window.location.pathname === '/service-provider') {
      return 'serviceProvider';
    }
    
    if (pwaType === 'sp') {
      localStorage.setItem('rides911-sp-pwa', 'true');
      return 'home'; // Will show SP login
    }
    
    return savedPage;
  });
  const [showWelcome, setShowWelcome] = useState(false);
  const [showLoginSP, setShowLoginSP] = useState(() => {
    // Auto-show SP login if opened from SP PWA
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('pwa') === 'sp';
  });
  const [showRegistrationSP, setShowRegistrationSP] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [showTermsConditions, setShowTermsConditions] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);

  const handleServiceProviderLogin = () => {
    // Preserve notification parameter when redirecting to dashboard
    const urlParams = new URLSearchParams(window.location.search);
    const fromNotification = urlParams.get('from') === 'notification';
    
    setCurrentPage('serviceProvider');
    localStorage.setItem('rides911-currentPage', 'serviceProvider');
    
    const dashboardUrl = fromNotification ? '/dashboard?from=notification' : '/dashboard';
    window.history.pushState({ page: 'serviceProvider' }, '', dashboardUrl);
    
    setShowLoginSP(false);
    setShowRegistrationSP(false);
  };

  const handleCancelLogin = () => {
    setShowLoginSP(false);
    setShowRegistrationSP(false);
  };

  const handleShowRegistration = () => {
    setShowLoginSP(false);
    setShowRegistrationSP(true);
  };

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state?.page) {
        setCurrentPage(event.state.page);
        localStorage.setItem('rides911-currentPage', event.state.page);
      } else {
        setCurrentPage('home');
        localStorage.setItem('rides911-currentPage', 'home');
      }
    };

    window.addEventListener('popstate', handlePopState);
    
    // Set initial history state
    if (!window.history.state) {
      window.history.replaceState({ page: currentPage }, '', currentPage === 'serviceProvider' ? '/dashboard' : '/');
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [currentPage]);

  const handleShowDisclaimer = () => {
    setShowDisclaimer(true);
  };

  const handleShowTermsConditions = () => {
    setShowTermsConditions(true);
  };

  const handleShowPrivacyPolicy = () => {
    setShowPrivacyPolicy(true);
  };

  if (showLoginSP) {
    return <LoginSP onCancel={handleCancelLogin} onLogin={handleServiceProviderLogin} onRegister={handleShowRegistration} />;
  }

  if (showRegistrationSP) {
    return <RegistrationSP onCancel={handleCancelLogin} />;
  }

  if (!selectedStyle && currentPage !== 'serviceProvider') {
    // Go directly to modern style landing page
    setSelectedStyle('modern');
  }

  if (showDisclaimer) {
    return <Disclaimer onBack={() => setShowDisclaimer(false)} />;
  }

  if (showTermsConditions) {
    return <TermsConditions onBack={() => setShowTermsConditions(false)} />;
  }

  if (showPrivacyPolicy) {
    return <PrivacyPolicy onBack={() => setShowPrivacyPolicy(false)} />;
  }

  const LayoutHeader = selectedStyle === 'modern' ? HeaderModern : Header;
  const LayoutHero = selectedStyle === 'modern' ? HeroModern : Hero;

  return (
    <div className="App">
      <LayoutHeader onDisclaimerClick={handleShowDisclaimer} onTermsClick={handleShowTermsConditions} onPrivacyClick={handleShowPrivacyPolicy} />
      {currentPage === 'home' ? (
        <LayoutHero showWelcome={showWelcome} setShowWelcome={setShowWelcome} />
      ) : (
        <ServiceProvider />
      )}
    </div>
  );
}

export default App;