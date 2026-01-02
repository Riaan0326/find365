import { useState, useEffect } from 'react';

interface HeaderProps {
  onHomeClick?: () => void;
  onWelcomeClick?: () => void;
  onDisclaimerClick?: () => void;
}

export default function Header({ onHomeClick, onWelcomeClick, onDisclaimerClick }: HeaderProps) {
  const [logoSrc, setLogoSrc] = useState<string | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showLegalDropdown, setShowLegalDropdown] = useState(false);
  const [showContactDropdown, setShowContactDropdown] = useState(false);

  const handleLogoClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setLogoSrc(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.legal-dropdown') && !target.closest('.contact-dropdown')) {
        setShowLegalDropdown(false);
        setShowContactDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);



  return (
    <header className="header" style={{
      backgroundColor: 'white'
    }}>
      <div className="container">
        <div className="header-content">
          <div className="logo">
            <div 
              onClick={handleLogoClick}
              style={{
                width: '40px',
                height: '40px',
                backgroundColor: logoSrc ? 'transparent' : '#2a4365',
                borderRadius: '8px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '12px',
                verticalAlign: 'middle',
                cursor: 'pointer',
                backgroundImage: logoSrc ? `url(${logoSrc})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                border: 'none',
                color: 'white',
                fontSize: '11px',
                fontWeight: 'bold',
                transform: 'rotate(45deg)'
              }}
              title="Click to select logo"
            >
              {!logoSrc && (
                <div style={{ textAlign: 'center', lineHeight: '1' }}>
                  <div>Rides</div>
                  <div style={{ fontSize: '6px', marginTop: '1px' }}>911</div>
                </div>
              )}
            </div>
          </div>
          {/* <div 
            onClick={handlePwaLogoClick}
            style={{
              width: '40px',
              height: '40px',
              backgroundColor: pwaLogoSrc ? 'transparent' : '#ddd',
              border: '2px dashed #999',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              color: '#666',
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              cursor: 'pointer',
              backgroundImage: pwaLogoSrc ? `url(${pwaLogoSrc})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
            title="Click to select PWA logo"
          >
            {!pwaLogoSrc && 'PWA'}
          </div> */}
          <button 
            className="hamburger" 
            style={{ color: '#2a4365', backgroundColor: 'transparent', border: 'none', fontSize: '1.5rem' }}
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            <i className="fas fa-bars" style={{ color: '#2a4365', fontSize: '1.2rem' }}></i>
          </button>
          <nav className={`nav ${showMobileMenu ? 'nav-open' : ''}`}>
            <a href="#home" onClick={(e) => { e.preventDefault(); onHomeClick?.(); setShowMobileMenu(false); }} style={{ color: '#2a4365' }}>Home</a>
            
            <div className="legal-dropdown" style={{ position: 'relative', display: 'inline-block' }}>
              <a href="#legal" onClick={(e) => { e.preventDefault(); setShowLegalDropdown(!showLegalDropdown); }} style={{ color: '#2a4365', cursor: 'pointer' }}>Legal</a>
              {showLegalDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  backgroundColor: '#374151',
                  minWidth: '200px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  borderRadius: '4px',
                  zIndex: 1000
                }}>
                  <a href="#disclaimer" onClick={(e) => { e.preventDefault(); onDisclaimerClick?.(); setShowLegalDropdown(false); setShowMobileMenu(false); }} 
                     style={{ display: 'block', padding: '0.5rem 1rem', color: 'white', textDecoration: 'none', borderBottom: '1px solid #4b5563', fontWeight: 'normal' }}
                     onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4b5563'}
                     onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    Disclaimer
                  </a>
                  <a href="#terms" onClick={() => { setShowLegalDropdown(false); setShowMobileMenu(false); }} 
                     style={{ display: 'block', padding: '0.5rem 1rem', color: 'white', textDecoration: 'none', borderBottom: '1px solid #4b5563', fontWeight: 'normal' }}
                     onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4b5563'}
                     onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    Terms & Conditions
                  </a>
                  <a href="#privacy" onClick={() => { setShowLegalDropdown(false); setShowMobileMenu(false); }} 
                     style={{ display: 'block', padding: '0.5rem 1rem', color: 'white', textDecoration: 'none', fontWeight: 'normal' }}
                     onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4b5563'}
                     onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    Privacy Policy
                  </a>
                </div>
              )}
            </div>
            
            <div className="contact-dropdown" style={{ position: 'relative', display: 'inline-block' }}>
              <a href="#contact" onClick={(e) => { e.preventDefault(); setShowContactDropdown(!showContactDropdown); }} style={{ color: '#2a4365', cursor: 'pointer' }}>Contact</a>
              {showContactDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  backgroundColor: '#374151',
                  minWidth: '200px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  borderRadius: '4px',
                  zIndex: 1000
                }}>
                  <a href="mailto:rides911@mail.com" onClick={() => { setShowContactDropdown(false); setShowMobileMenu(false); }} 
                     style={{ display: 'block', padding: '0.5rem 1rem', color: 'white', textDecoration: 'none', borderBottom: '1px solid #4b5563', fontWeight: 'normal' }}
                     onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4b5563'}
                     onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    rides911@mail.com
                  </a>
                  <a href="https://wa.me/27674455078" target="_blank" onClick={() => { setShowContactDropdown(false); setShowMobileMenu(false); }} 
                     style={{ display: 'block', padding: '0.5rem 1rem', color: 'white', textDecoration: 'none', fontWeight: 'normal' }}
                     onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4b5563'}
                     onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    WhatsApp<br/>
                    <span style={{ fontSize: '0.8rem', color: '#d1d5db' }}>+27 67 445 5078</span>
                  </a>
                </div>
              )}
            </div>
            
            <a href="#welcome" onClick={(e) => { e.preventDefault(); onWelcomeClick?.(); setShowMobileMenu(false); }} 
			style={{ color: '#2a4365' }}>Welcome</a>
          </nav>
        </div>
      </div>
    </header>
  );
}