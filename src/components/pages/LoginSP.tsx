import { useState, useEffect } from 'react';
import { validateServiceProvider } from '../../utils/spDatabase';
import GPSLogin from '../utilities/GPSLogin';

interface LoginSPProps {
  onCancel: () => void;
  onLogin: () => void;
  onRegister: () => void;
}

export default function LoginSP({ onCancel, onLogin, onRegister }: LoginSPProps) {
  const [formData, setFormData] = useState({
    email: '',
    spCode: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPWAInstalled, setIsPWAInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);


  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
    
    // Switch to SP manifest
    const manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
    if (manifestLink) {
      manifestLink.href = '/manifest-sp.json';
    }
    
    // Check if PWA is installed
    const checkPWAInstalled = () => {
      const isInstalled = window.matchMedia('(display-mode: standalone)').matches || 
                         (window.navigator as any).standalone === true;
      setIsPWAInstalled(isInstalled);
      console.log('PWA installed:', isInstalled);
    };
    
    checkPWAInstalled();
    
    // Listen for PWA install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      console.log('beforeinstallprompt event fired');
      e.preventDefault();
      setDeferredPrompt(e);
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    console.log('PWA event listener added');
    

    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      // Restore client manifest when leaving
      const manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
      if (manifestLink) {
        manifestLink.href = '/manifest.json';
      }
    };
  }, []);



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.spCode || !formData.password) {
      alert('Please fill in all fields');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const sp = await validateServiceProvider(formData.email, formData.spCode, formData.password);
      
      if (sp) {
        alert(`Welcome back, ${sp.name}!`);
        
        try {
          // Get and save GPS coordinates to database
          const gpsCoords = await GPSLogin.updateSPLoginGPS(sp['driver-id']);
          
          // Extract city from address
          const addressParts = sp.address.split(',').map(part => part.trim());
          const city = addressParts[addressParts.length - 1] || 'Unknown';
          
          // Store SP profile with GPS location
          const spProfile = {
            driverId: sp['driver-id'],
            spCode: sp['sp-code'],
            name: sp.name,
            email: sp.email,
            phone: sp.phone,
            serviceTypes: sp.serviceTypes,
            city: city.toLowerCase(),
            location: {
              latitude: gpsCoords.latitude,
              longitude: gpsCoords.longitude
            },
            deviceId: `${sp['sp-code']}-${Date.now()}`
          };
          
          localStorage.setItem('rides911-sp-profile', JSON.stringify(spProfile));
          localStorage.setItem('rides911-sp-pwa', 'true');
          
          // Store GPS coordinates for auto-zoom
          localStorage.setItem('rides911-sp-gps', JSON.stringify({
            latitude: gpsCoords.latitude,
            longitude: gpsCoords.longitude
          }));
          
          onLogin();
        } catch (gpsError) {
          console.error('GPS error:', gpsError);
          alert('GPS access required for location-based notifications. Please enable location access and try again.');
        }
      } else {
        alert('Invalid credentials. Please check your email, SP code, and password.');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#000000', color: 'white' }}>
      <div style={{ padding: '1rem' }}>
      <div style={{ maxWidth: '400px', margin: '0 auto', backgroundColor: '#374151', padding: '2rem', borderRadius: '12px' }}>
        <h1 style={{ 
          fontSize: '1.5rem', 
          marginBottom: '1rem',
          color: '#fbbf24'
        }}>
          SP Login
        </h1>
        
        {!isPWAInstalled && (
          <div style={{
            backgroundColor: '#1f2937',
            border: '1px solid #374151',
            borderRadius: '8px',
            padding: '1rem',
            textAlign: 'center',
            marginBottom: '2rem'
          }}>
            Click{' '}
            <span 
              style={{ 
                cursor: 'pointer', 
                color: '#fbbf24', 
                textDecoration: 'underline',
                fontWeight: 'bold'
              }}
              onClick={async () => {
                if (deferredPrompt && typeof deferredPrompt.prompt === 'function') {
                  try {
                    deferredPrompt.prompt();
                    const { outcome } = await deferredPrompt.userChoice;
                    if (outcome === 'accepted') {
                      setIsPWAInstalled(true);
                      localStorage.setItem('rides911-sp-pwa', 'true');
                    }
                    setDeferredPrompt(null);
                  } catch (error) {
                    console.error('PWA install error:', error);
                  }
                } else {
                  setIsPWAInstalled(true);
                }
              }}
            >
              HERE
            </span>
            {' '} first, to create App Icon.{' '}
           </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'white' }}>Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: 'none' }}
              placeholder="Enter your email"
              required
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'white' }}>SP Code</label>
            <input
              type="text"
              value={formData.spCode}
              onChange={(e) => setFormData({ ...formData, spCode: e.target.value.toUpperCase() })}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: 'none', textTransform: 'uppercase' }}
              placeholder="Enter your SP code"
              required
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'white' }}>Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: 'none' }}
              placeholder="Enter your password"
              required
            />
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
              />
              Show password
            </label>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={onCancel}
              style={{
                backgroundColor: '#6b7280',
                color: 'white',
                padding: '0.75rem 2rem',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              style={{
                backgroundColor: isLoading ? '#6b7280' : '#fbbf24',
                color: '#1e40af',
                padding: '0.75rem 2rem',
                border: 'none',
                borderRadius: '6px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: '600'
              }}
            >
              {isLoading ? 'Logging in...' : 'Submit'}
            </button>
          </div>
        </form>
        
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <span style={{ color: '#d1d5db', fontSize: '0.9rem' }}>
            Don't have an account?{' '}
            <span 
              style={{ color: '#fbbf24', cursor: 'pointer', textDecoration: 'underline' }}
              onClick={onRegister}
            >
              Register here
            </span>
          </span>
        </div>
      </div>
      </div>
    </div>
  );
}