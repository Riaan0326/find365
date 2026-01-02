import { useState, useEffect } from 'react';

interface HeaderProps {
  onDisclaimerClick?: () => void;
  onBackToSelection?: () => void;
  onTermsClick?: () => void;
  onPrivacyClick?: () => void;
}

export default function HeaderM({ onDisclaimerClick, onBackToSelection, onTermsClick, onPrivacyClick }: HeaderProps) {
  const [logoSrc] = useState<string | null>(null);
  const [showLegalDropdown, setShowLegalDropdown] = useState(false);
  const [showContactDropdown, setShowContactDropdown] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.legal-dropdown')) {
        setShowLegalDropdown(false);
      }
      if (!target.closest('.contact-dropdown')) {
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
        <div className="header-content" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'relative'
        }}>
          <div className="logo" style={{ display: 'flex', alignItems: 'center' }}>
            <div 
              onClick={onBackToSelection}
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
                backgroundImage: logoSrc ? `url(${logoSrc})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                border: 'none',
                color: 'white',
                fontSize: '11px',
                fontWeight: 'bold',
                transform: 'rotate(225deg)',
                cursor: 'pointer'
              }}
            >
              {!logoSrc && (
                <div style={{ textAlign: 'center', lineHeight: '1', transform: 'rotate(-225deg)' }}>
                  <div>Find</div>
                  <div style={{ fontSize: '6px', marginTop: '1px' }}>365</div>
                </div>
              )}
            </div>
            <span style={{ color: '#2a4365', fontSize: '1rem' }}>...let's go!</span>
          </div>
          
          <nav style={{
            display: 'flex',
            flexDirection: 'row',
            gap: '1rem',
            alignItems: 'center'
          }}>
            <a href="#serviceprovider" onClick={(e) => { e.preventDefault(); /* Add service provider handler */ }} 
			style={{ color: '#2a4365', textDecoration: 'none' }}>
              ServiceProvider
            </a>
            
            <div className="contact-dropdown" style={{ position: 'relative', display: 'inline-block' }}>
              <a href="#contact" onClick={(e) => { e.preventDefault(); setShowContactDropdown(!showContactDropdown); setShowLegalDropdown(false); }} style={{ color: '#2a4365', cursor: 'pointer', textDecoration: 'none' }}>
                Contact
              </a>
              {showContactDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  backgroundColor: '#374151',
                  minWidth: '200px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  borderRadius: '4px',
                  zIndex: 1000
                }}>
                  <a href="mailto:find365@mail.com" onClick={() => { setShowContactDropdown(false); }} 
                     style={{ display: 'block', padding: '0.5rem 1rem', color: 'white', textDecoration: 'none', borderBottom: '1px solid #4b5563', fontWeight: 'normal' }}
                     onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4b5563'}
                     onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    find365@mail.com
                  </a>
                  <a href="https://wa.me/27674455078" target="_blank" onClick={() => { setShowContactDropdown(false); }} 
                     style={{ display: 'block', padding: '0.5rem 1rem', color: 'white', textDecoration: 'none', fontWeight: 'normal' }}
                     onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4b5563'}
                     onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    WhatsApp<br/>
                    <span style={{ fontSize: '0.8rem', color: '#d1d5db' }}>+27 67 445 5078</span>
                  </a>
                </div>
              )}
            </div>
            
            <div className="legal-dropdown" style={{ position: 'relative', display: 'inline-block' }}>
              <a href="#legal" onClick={(e) => { e.preventDefault(); setShowLegalDropdown(!showLegalDropdown); setShowContactDropdown(false); }} style={{ color: '#2a4365', cursor: 'pointer', textDecoration: 'none' }}>
                Legal
              </a>
              {showLegalDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  backgroundColor: '#374151',
                  minWidth: '200px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  borderRadius: '4px',
                  zIndex: 1000
                }}>
                  <a href="#disclaimer" onClick={(e) => { e.preventDefault(); onDisclaimerClick?.(); setShowLegalDropdown(false); }} 
                     style={{ display: 'block', padding: '0.5rem 1rem', color: 'white', textDecoration: 'none', borderBottom: '1px solid #4b5563', fontWeight: 'normal' }}
                     onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4b5563'}
                     onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    Disclaimer
                  </a>
                  <a href="#terms" onClick={(e) => { e.preventDefault(); onTermsClick?.(); setShowLegalDropdown(false); }} 
                     style={{ display: 'block', padding: '0.5rem 1rem', color: 'white', textDecoration: 'none', borderBottom: '1px solid #4b5563', fontWeight: 'normal' }}
                     onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4b5563'}
                     onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    Terms & Conditions
                  </a>
                  <a href="#privacy" onClick={(e) => { e.preventDefault(); onPrivacyClick?.(); setShowLegalDropdown(false); }} 
                     style={{ display: 'block', padding: '0.5rem 1rem', color: 'white', textDecoration: 'none', fontWeight: 'normal' }}
                     onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4b5563'}
                     onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    Privacy Policy
                  </a>
                </div>
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}