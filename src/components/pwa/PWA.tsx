import { useState, useEffect } from 'react';

interface PWAProps {
  onShowLoginSP?: () => void;
}

export default function PWA({}: PWAProps) {
  const [isPWAInstalled, setIsPWAInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Check if PWA is installed
    const checkPWAInstalled = () => {
      const isInstalled = window.matchMedia('(display-mode: standalone)').matches || 
                         (window.navigator as any).standalone === true;
      setIsPWAInstalled(isInstalled);
    };
    
    checkPWAInstalled();
    
    // Listen for PWA install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (isPWAInstalled) return null;

  return (
    <div style={{
      backgroundColor: '#d3d3d3',
      color: 'black',
      padding: '0.5rem 0.75rem',
      border: '2px solid black',
      borderRadius: '25px',
      margin: '0.5rem auto',
      width: 'fit-content'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <div style={{ fontSize: '0.9rem' }}>
          <div>• Users only, to install App icon, click button</div>
        </div>
        <div 
          onClick={async () => {
            if (deferredPrompt) {
              try {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                  setIsPWAInstalled(true);
                }
                setDeferredPrompt(null);
              } catch (error) {
                console.error('PWA install error:', error);
              }
            } else {
              setIsPWAInstalled(true);
            }
          }}
          style={{
            width: '40px',
            height: '40px',
            backgroundColor: '#2a4365',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '10px',
            fontWeight: 'bold',
            textAlign: 'center',
            lineHeight: '1',
            flexShrink: 0,
            cursor: 'pointer'
          }}
        >
          <div>
            <div>Find</div>
            <div style={{ fontSize: '5px', marginTop: '1px' }}>365</div>
          </div>
        </div>
      </div>
    </div>
  );
}