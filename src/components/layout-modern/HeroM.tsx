import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import Radar from 'radar-sdk-js';
import { saveClientRequest, getClientRequests, serviceTypeMapping } from '../../utils/database';
import { serviceOptions, getServiceEmoji } from '../../utils/serviceOptions';
import HelpCR from '../pages/HelpCR';
import HelpSP from '../pages/HelpSP';
import PWA from '../pwa/PWA';

interface HeroProps {
  showWelcome: boolean;
  setShowWelcome: (show: boolean) => void;
}

export default function Hero({ showWelcome, setShowWelcome }: HeroProps) {
  const mapRef = useRef<any>(null);
  const [selectedServices] = useState<string[]>([]);
  const [showServiceFilter, setShowServiceFilter] = useState(false);
  const [showClientServiceDropdown, setShowClientServiceDropdown] = useState(false);
  const [showHelpCR, setShowHelpCR] = useState(false);
  const [showHelpSP, setShowHelpSP] = useState(false);

  const [showCategoryDropdown, setShowCategoryDropdown] = useState(-1);
  const [selectedService, setSelectedService] = useState<{value: string, label: string, emoji: string, category: string} | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [showLocationStep, setShowLocationStep] = useState(false);
  const [showDestinationStep, setShowDestinationStep] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [coordinates, setCoordinates] = useState<{latitude: number, longitude: number} | null>(null);
  const [destinationCoordinates, setDestinationCoordinates] = useState<{latitude: number, longitude: number} | null>(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [destination, setDestination] = useState('');
  const [useGoogleGeocoding, setUseGoogleGeocoding] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<any[]>([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
  const timerIntervalRef = useRef<number | null>(null);
  const handleAddressSearch = async (query: string, isDestination = false) => {
    if (query.length < 3) {
      if (isDestination) {
        setDestinationSuggestions([]);
        setShowDestinationSuggestions(false);
      } else {
        setAddressSuggestions([]);
        setShowAddressSuggestions(false);
      }
      return;
    }
    
    try {
      if (useGoogleGeocoding && (window as any).google?.maps?.places) {
        const service = new (window as any).google.maps.places.AutocompleteService();
        service.getPlacePredictions(
          {
            input: query,
            componentRestrictions: { country: 'za' }
          },
          (predictions: any, status: any) => {
            if (status === (window as any).google.maps.places.PlacesServiceStatus.OK && predictions) {
              const addresses = predictions.map((prediction: any) => ({
                formattedAddress: prediction.description,
                placeId: prediction.place_id
              }));
              
              if (isDestination) {
                setDestinationSuggestions(addresses);
                setShowDestinationSuggestions(true);
              } else {
                setAddressSuggestions(addresses);
                setShowAddressSuggestions(true);
              }
            }
          }
        );
      } else {
        const result = await Radar.autocomplete({
          query,
          limit: 5
        });
        
        if (result && result.addresses && result.addresses.length > 0) {
          if (isDestination) {
            setDestinationSuggestions(result.addresses);
            setShowDestinationSuggestions(true);
            // Auto-geocode first result for coordinates
            const firstAddress = result.addresses[0];
            if (firstAddress.geometry?.coordinates) {
              setDestinationCoordinates({
                latitude: firstAddress.geometry.coordinates[1],
                longitude: firstAddress.geometry.coordinates[0]
              });
            }
          } else {
            setAddressSuggestions(result.addresses);
            setShowAddressSuggestions(true);
            // Auto-geocode first result for coordinates
            const firstAddress = result.addresses[0];
            if (firstAddress.geometry?.coordinates) {
              setCoordinates({
                latitude: firstAddress.geometry.coordinates[1],
                longitude: firstAddress.geometry.coordinates[0]
              });
            }
          }
        } else {
          if (isDestination) {
            setDestinationSuggestions([]);
            setShowDestinationSuggestions(false);
          } else {
            setAddressSuggestions([]);
            setShowAddressSuggestions(false);
          }
        }
      }
    } catch (error) {
      console.error('Address search error:', error);
      if (isDestination) {
        setDestinationSuggestions([]);
        setShowDestinationSuggestions(false);
      } else {
        setAddressSuggestions([]);
        setShowAddressSuggestions(false);
      }
    }
  };

  const geocodeAddress = async (address: string) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=AIzaSyAmPLdIpW2DWTm1xehg1MZFwo0IeQ3fcp4`
      );
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        return {
          latitude: location.lat,
          longitude: location.lng
        };
      }
    } catch (error) {
      console.error('Geocoding failed:', error);
    }
    return null;
  };

  const selectAddress = async (selectedAddress: any, isDestination = false) => {
    const addressText = selectedAddress.formattedAddress || selectedAddress.description;
    
    if (isDestination) {
      setDestination(addressText);
      setShowDestinationSuggestions(false);
      const coords = await geocodeAddress(addressText);
      if (coords) {
        setDestinationCoordinates(coords);
      }
    } else {
      setAddress(addressText);
      setShowAddressSuggestions(false);
      const coords = await geocodeAddress(addressText);
      if (coords) {
        setCoordinates(coords);
      }
    }
  };

  const switchToGoogle = () => {
    setUseGoogleGeocoding(true);
    setAddress('');
    setAddressSuggestions([]);
    setShowAddressSuggestions(false);
  };

  const requiresPickup = () => {
    if (!selectedService) return false;
    return selectedService.category !== 'Tour';
  };

  const requiresDestination = () => {
    if (!selectedService) return false;
    return selectedService.category === 'Ride' || selectedService.category === 'Delivery';
  };

  

  // Add manual timer stop function for when SP responds
  const stopTimerManually = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };
  
  // Make function globally available
  useEffect(() => {
    (window as any).stopClientTimer = stopTimerManually;
    return () => {
      delete (window as any).stopClientTimer;
    };
  }, []);


  




  




  useEffect(() => {
    const handleHomeClick = (e: Event) => {
      if ((e.target as HTMLElement)?.textContent === 'Home') {
        setShowHelpCR(false);
        setShowHelpSP(false);
      }
    };
    
    // Handle browser back button
    const handlePopState = () => {
      setShowHelpCR(false);
      setShowHelpSP(false);
    };
    
    document.addEventListener('click', handleHomeClick);
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      document.removeEventListener('click', handleHomeClick);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);


  useEffect(() => {
    Radar.initialize('prj_test_pk_e3b797668c3b56bb946e6610940826931a3b352b');
  }, []);



















  const handleLetsGo = () => {
    localStorage.setItem('rides911-visited', 'true');
    setShowWelcome(false);
    // Force map re-initialization after welcome closes
    setTimeout(() => {
      // Clean up existing map first
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      
      // Initialize new map
      const mapElement = document.getElementById('map');
      if (mapElement) {
        const map = L.map('map', {
          maxZoom: 5,
          minZoom: 5,
          zoomControl: false,
          scrollWheelZoom: false,
          doubleClickZoom: false,
          touchZoom: false,
          boxZoom: false,
          keyboard: false,
          dragging: false,
          maxBounds: [[-35, 16], [-22, 33]]
        }).setView([-30.5595, 22.9375], 5);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        
        mapRef.current = map;
        loadRequestsForLandingMap();
      }
    }, 200);
  };





  const loadRequestsForLandingMap = async () => {
    try {
      const clientRequests = await getClientRequests();
      
      if (mapRef.current && clientRequests.length > 0) {
        // Filter out tour requests for map display
        const mapRequests = clientRequests.filter(request => {
          const serviceInfo = serviceTypeMapping[request.transportType] || { category: 'Unknown' };
          return serviceInfo.category !== 'Tour';
        });
        
        mapRequests.forEach((request) => {
          if (!request.pickupLatitude || !request.pickupLongitude) return;
          
          if (selectedServices.length > 0 && !selectedServices.includes(request.transportType)) {
            return;
          }
          
          const lat = request.pickupLatitude;
          const lng = request.pickupLongitude;
          
          const emoji = getServiceEmoji(request.transportType);
          
          L.marker([lat, lng], {
            icon: L.divIcon({
              className: 'custom-marker',
              html: `<div style="font-size: 18px;">${emoji}</div>`,
              iconSize: [30, 30],
              iconAnchor: [15, 15]
            })
          }).addTo(mapRef.current);
        });
        
        // Update tour requests for banner
        clientRequests.filter(request => {
          const serviceInfo = serviceTypeMapping[request.transportType] || { category: 'Unknown' };
          const isTour = serviceInfo.category === 'Tour';
          
          // Apply service filter to tours
          if (selectedServices.length > 0 && !selectedServices.includes(request.transportType)) {
            return false;
          }
          
          return isTour && request.status === 1; // Only active tours
        });
      }
    } catch (error) {
      console.error('Error loading requests for landing map:', error);
    }
  };


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showServiceFilter && !(event.target as Element).closest('.service-filter-dropdown')) {
        setShowServiceFilter(false);
      }
      if (showClientServiceDropdown && !(event.target as Element).closest('.client-service-dropdown')) {
        setShowClientServiceDropdown(false);
      }
      if (showCategoryDropdown !== -1 && !(event.target as Element).closest('.category-button-container')) {
        setShowCategoryDropdown(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    
    setTimeout(() => {
      if (!mapRef.current && document.getElementById('map')) {
        const map = L.map('map', {
          maxZoom: 5,
          minZoom: 5,
          zoomControl: false,
          scrollWheelZoom: false,
          doubleClickZoom: false,
          touchZoom: false,
          boxZoom: false,
          keyboard: false,
          dragging: false,
          maxBounds: [[-35, 16], [-22, 33]]
        }).setView([-30.5595, 22.9375], 5);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        
        mapRef.current = map;
        loadRequestsForLandingMap();
      }
    }, 100);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      // Cleanup timers
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [showServiceFilter, showClientServiceDropdown, showHelpCR, showHelpSP, showCategoryDropdown]);

  useEffect(() => {
    loadRequestsForLandingMap();
  }, [selectedServices]);

  useEffect(() => {
    if (showHelpCR || showHelpSP) {
      window.history.pushState(null, '', window.location.href);
    }
  }, [showHelpCR, showHelpSP]);

  if (showHelpCR) {
    return <HelpCR onBack={() => {
      setShowHelpCR(false);
      window.history.back();
    }} />;
  }

  if (showHelpSP) {
    return <HelpSP onBack={() => {
      setShowHelpSP(false);
      window.history.back();
    }} />;
  }



  if (showWelcome) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '2rem'
      }}>
        <div style={{
          backgroundColor: '#374151',
          padding: '2rem',
          borderRadius: '12px',
          maxWidth: '600px',
          color: 'white',
          maxHeight: '80vh',
          overflowY: 'auto'
        }}>
          <h1 style={{ color: '#fbbf24', marginBottom: '1rem', fontSize: '1.5rem' }}>Welcome to Rides911</h1>
          <p style={{ marginBottom: '1rem' }}>We here to assist you in all your ride hailing needs and build a bridge between client
		  and service providers(SP).</p>
          
          <h3 style={{ color: '#fbbf24', marginBottom: '0.5rem' }}>Current services:</h3>
          <ul style={{ marginBottom: '1rem', paddingLeft: '1rem' }}>
            <li>Ride Requests</li>
            <li>Delivery</li>
            <li>Transport Assistance</li>
            <li>Emergency Assistance</li>
            <li>Tours</li>
          </ul>
          <p style={{ marginBottom: '1rem' }}>If you have any other service you want us to list, please mail or whatsapp us.</p>
          
          <h3 style={{ color: '#fbbf24', marginBottom: '0.5rem' }}>How to - Client Request:</h3>
          <p style={{ marginBottom: '1rem' }}>Select service type, fill in requested fields, submit and 
		  service providers(SP) will contact you. Icon will show on map representing your request. To zoom in or out, 
		  use (+) or (-) on the map or use 2 fingers as per device description.</p>
          
          <h3 style={{ color: '#fbbf24', marginBottom: '0.5rem' }}>How to - Service Provider(SP):</h3>
          <p style={{ marginBottom: '1rem' }}>Scroll down to Service Provider section on mobile phone.
		  Filter for service/s you only provide, which will show icon/s only for services you provide, national. 
		  To see only requests in your area, press "Use my location". You can also zoom in & out using the (+) or (-) on the map or 
		  use 2 fingers as per device description. You will find more "How to" on the Service Provider(SP) dashboard.</p>
          
          <p style={{ marginBottom: '1.5rem', fontStyle: 'italic' }}>For "Welcome" note not to show again, please install App Icon.</p>
          
          <button 
            onClick={handleLetsGo}
            style={{
              backgroundColor: '#fbbf24',
              color: '#1e40af',
              padding: '0.75rem 2rem',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
              width: '100%'
            }}
          >
            Let's go
          </button>
          
          <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#d1d5db' }}>PS: To see Welcome note again on mobile, 
		  click on hamburger icon ☰ → Welcome note.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PWA onShowLoginSP={() => {}} />
      
      <div className="container" style={{
        backgroundColor: '#36454F',
        color: 'white',
        padding: '1rem 0'
      }}>
        {!showForm ? (
          <>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              maxWidth: '600px',
              margin: '0 auto 0.5rem auto',
              padding: '0 1rem'
            }}>
              <h3 style={{
                color: 'white',
                fontSize: '1rem',
                margin: 0,
                fontWeight: 'normal'
              }}>
                Select Service
              </h3>
              <button
                onClick={() => setShowHelpCR(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  textDecoration: 'none',
                  fontWeight: 'normal',
                  fontStyle: 'italic',
                  fontFamily: '"Times New Roman", Times, serif'
                }}
              >
                info
              </button>
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.5rem',
              maxWidth: '600px',
              margin: '0.5rem auto',
              padding: '0 1rem'
            }}>
              {serviceOptions.map((category, index) => {
                const isSelected = selectedService?.category === category.category;
                const isGrayedOut = selectedService && selectedService.category !== category.category;
                
                return (
                <div key={index} style={{ position: 'relative' }} className="category-button-container">
                  <button
                    onClick={() => setShowCategoryDropdown(showCategoryDropdown === index ? -1 : index)}
                    style={{
                      width: '100%',
                      aspectRatio: '1',
                      backgroundColor: isGrayedOut ? '#f5f5f5' : 'white',
                      color: isGrayedOut ? '#999' : 'black',
                      border: '2px solid black',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      cursor: isGrayedOut ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      gap: '0.25rem',
                      opacity: isGrayedOut ? 0.5 : 1
                    }}
                    disabled={!!isGrayedOut}
                  >
                    {isSelected && selectedService ? (
                      <>
                        <img 
                          src={selectedService.emoji} 
                          alt={selectedService.label} 
                          style={{ width: '32px', height: '32px' }}
                        />
                        <div style={{ fontSize: '0.7rem' }}>{selectedService.category}</div>
                        <div style={{ fontSize: '0.6rem' }}>{selectedService.label}</div>
                      </>
                    ) : (
                      <>
                        {category.category === 'Ride' && (
                          <img 
                            src="https://res.cloudinary.com/duqmfy7z7/image/upload/v1766996319/ucjcj56scsuukzi3phh7.png" 
                            alt="Car" 
                            style={{ width: '32px', height: '32px' }}
                          />
                        )}
                        {category.category === 'Delivery' && (
                          <img 
                            src="https://res.cloudinary.com/duqmfy7z7/image/upload/v1767100017/y5amxtb7umqcn7x9njn7.png" 
                            alt="Delivery" 
                            style={{ width: '32px', height: '32px' }}
                          />
                        )}
                        {category.category === 'Assistance' && (
                          <img 
                            src="https://res.cloudinary.com/duqmfy7z7/image/upload/v1766996320/ktvhz1mihyj5srp9oqnq.png" 
                            alt="Moving Local" 
                            style={{ width: '32px', height: '32px' }}
                          />
                        )}
                        {category.category === 'Emergency' && (
                          <img 
                            src="https://res.cloudinary.com/duqmfy7z7/image/upload/v1766996321/fl0lme146swd4snkev6i.png" 
                            alt="Towing Car" 
                            style={{ width: '32px', height: '32px' }}
                          />
                        )}
                        {category.category === 'Frolic' && (
                          <img 
                            src="https://res.cloudinary.com/duqmfy7z7/image/upload/v1766996323/ljh6kyymbym72evbysve.png" 
                            alt="Party Bus" 
                            style={{ width: '32px', height: '32px' }}
                          />
                        )}
                        {category.category === 'Tour' && (
                          <img 
                            src="https://res.cloudinary.com/duqmfy7z7/image/upload/v1766996324/ilut1e5li9hdso4j6fqd.png" 
                            alt="Motorcycle" 
                            style={{ width: '32px', height: '32px' }}
                          />
                        )}
                      </>
                    )}
                    {isSelected && selectedService ? '' : category.category}
                  </button>
                  
                  {showCategoryDropdown === index && !isGrayedOut && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      backgroundColor: 'white',
                      border: '2px solid black',
                      borderRadius: '8px',
                      zIndex: 1000,
                      marginTop: '0.25rem'
                    }}>
                      {category.items.map((item, itemIndex) => (
                        <div
                          key={itemIndex}
                          onClick={() => {
                            setSelectedService({
                              value: item.value,
                              label: item.label,
                              emoji: item.emoji,
                              category: category.category
                            });
                            setShowCategoryDropdown(-1);
                          }}
                          style={{
                            padding: '0.5rem',
                            borderBottom: itemIndex < category.items.length - 1 ? '1px solid #eee' : 'none',
                            color: 'black',
                            fontSize: '0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            cursor: 'pointer'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                        >
                          <span style={{ fontSize: '14px' }}>
                            {item.emoji.startsWith('http') ? (
                              <img src={item.emoji} alt={item.label} style={{ width: '16px', height: '16px' }} />
                            ) : (
                              item.emoji
                            )}
                          </span>
                          {item.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                );
              })}
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              maxWidth: '600px',
              margin: '1rem auto',
              padding: '0 1rem'
            }}>
              <button
                onClick={() => selectedService && setSelectedService(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: selectedService ? 'white' : '#666',
                  fontSize: '0.9rem',
                  cursor: selectedService ? 'pointer' : 'default'
                }}
              >
                Reset
              </button>
              <button
                onClick={() => selectedService ? setShowForm(true) : null}
                style={{
                  background: 'none',
                  border: 'none',
                  color: selectedService ? 'white' : '#666',
                  fontSize: '0.9rem',
                  cursor: selectedService ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
              >
                Next <span>→</span>
              </button>
            </div>
          </>
        ) : (
          <>
            {console.log('Form section - showLocationStep:', showLocationStep, 'showDestinationStep:', showDestinationStep, 'showSummary:', showSummary)}
            {/* Single Summary Pill */}
            <div style={{
              maxWidth: '600px',
              margin: '0.5rem auto',
              padding: '0 1rem'
            }}>
              <div style={{
                backgroundColor: '#d1d5db',
                color: 'black',
                padding: '1rem',
                borderRadius: '25px',
                border: '1px solid #d1d5db',
                width: '100%',
                fontSize: '1rem',
                lineHeight: '1.5'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: fullName || phone || address || destination ? '0.5rem' : '0' }}>
                  <img 
                    src={selectedService?.emoji} 
                    alt={selectedService?.label} 
                    style={{ width: '20px', height: '20px' }}
                  />
                  <span style={{ fontWeight: '600' }}>
                    {selectedService?.category} - {selectedService?.label}
                  </span>
                </div>
                {fullName && <div style={{ display: 'flex', gap: '0.5rem' }}><span style={{ fontSize: '1.2rem', lineHeight: '1.5', flexShrink: 0, marginTop: '-0.1rem' }}>•</span> <span style={{ lineHeight: '1.5' }}>{fullName}</span></div>}
                {phone && <div style={{ display: 'flex', gap: '0.5rem' }}><span style={{ fontSize: '1.2rem', lineHeight: '1.5', flexShrink: 0, marginTop: '-0.1rem' }}>•</span> <span style={{ lineHeight: '1.5' }}>{phone}</span></div>}
                {(showLocationStep && address) && <div style={{ display: 'flex', gap: '0.5rem' }}><span style={{ fontSize: '1.2rem', lineHeight: '1.5', flexShrink: 0, marginTop: '-0.1rem' }}>•</span> <span style={{ lineHeight: '1.5' }}>{address}</span></div>}
                {(showDestinationStep && destination) && <div style={{ display: 'flex', gap: '0.5rem' }}><span style={{ fontSize: '1.2rem', lineHeight: '1.5', flexShrink: 0, marginTop: '-0.1rem' }}>•</span> <span style={{ lineHeight: '1.5' }}>{destination}</span></div>}
              </div>
            </div>
            
            {!showLocationStep && !showDestinationStep && !showSummary ? (
              <div style={{
                maxWidth: '600px',
                margin: '1rem auto',
                padding: '0 1rem'
              }}>
                <input
                  type="text"
                  placeholder="Full Name *"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    marginBottom: '1rem',
                    border: '2px solid #ccc',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
                <input
                  type="tel"
                  placeholder="Mobile/WhatsApp *"
                  value={phone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setPhone(value);
                  }}
                  maxLength={10}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    marginBottom: '1rem',
                    border: '2px solid #ccc',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <button
                    onClick={() => setShowForm(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#666',
                      fontSize: '0.9rem',
                      cursor: 'pointer'
                    }}
                  >
                    Back
                  </button>
                  <button
                    onClick={() => {
                      console.log('Name/Phone Next/Submit clicked, requiresPickup:', requiresPickup());
                      if (fullName && phone) {
                        if (requiresPickup()) {
                          console.log('Going to pickup step');
                          setShowLocationStep(true);
                        } else {
                          console.log('Tours - going to summary');
                          setShowSummary(true);
                        }
                      }
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: fullName && phone ? 'white' : '#666',
                      fontSize: '0.9rem',
                      cursor: fullName && phone ? 'pointer' : 'default',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                  >
                    {requiresPickup() ? 'Next' : 'Next'} <span>→</span>
                  </button>
                </div>
              </div>
            ) : showLocationStep && !showDestinationStep && !showSummary ? (
              <div style={{
                maxWidth: '600px',
                margin: '1rem auto',
                padding: '0 1rem',
                position: 'relative'
              }}>
                <input
                  type="text"
                  placeholder="Pickup Address *"
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    if (e.target.value.length >= 3) {
                      handleAddressSearch(e.target.value);
                    } else {
                      setAddressSuggestions([]);
                      setShowAddressSuggestions(false);
                      setCoordinates(null);
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    marginBottom: '0.5rem',
                    border: '2px solid #ccc',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
                {showAddressSuggestions && addressSuggestions.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '60px',
                    left: '1rem',
                    right: '1rem',
                    backgroundColor: 'white',
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    zIndex: 1000,
                    maxHeight: '200px',
                    overflowY: 'auto'
                  }}>
                    {addressSuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        onClick={() => selectAddress(suggestion)}
                        style={{
                          padding: '0.75rem',
                          borderBottom: index < addressSuggestions.length - 1 ? '1px solid #eee' : 'none',
                          cursor: 'pointer',
                          color: 'black'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                      >
                        {suggestion.formattedAddress || suggestion.description}
                      </div>
                    ))}
                  </div>
                )}
                {address && address.length >= 3 && addressSuggestions.length === 0 && !showAddressSuggestions && (
                  <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span style={{ color: 'white', fontSize: '0.9rem' }}>No results, click </span>
                    <button
                      onClick={switchToGoogle}
                      style={{
                        backgroundColor: 'transparent',
                        color: '#fbbf24',
                        border: 'none',
                        padding: '0',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        fontWeight: '600',
                        textDecoration: 'none'
                      }}
                    >
                      here
                    </button>
                    <span style={{ color: 'white', fontSize: '0.9rem' }}> and retry</span>
                  </div>
                )}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <button
                    onClick={() => setShowLocationStep(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#666',
                      fontSize: '0.9rem',
                      cursor: 'pointer'
                    }}
                  >
                    Back
                  </button>
                  <button
                    onClick={async () => {
                      console.log('Pickup Next clicked, requiresDestination:', requiresDestination());
                      if (address) {
                        // Ensure we have coordinates for the pickup address
                        if (!coordinates) {
                          const coords = await geocodeAddress(address);
                          if (coords) {
                            setCoordinates(coords);
                          }
                        }
                        
                        if (requiresDestination()) {
                          console.log('Going to destination step');
                          setShowDestinationStep(true);
                        } else {
                          console.log('Going to summary for Assistance/Emergency/Frolic');
                          setShowSummary(true);
                        }
                      }
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: address ? 'white' : '#666',
                      fontSize: '0.9rem',
                      cursor: address ? 'pointer' : 'default',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                  >
                    Next <span>→</span>
                  </button>
                </div>
              </div>
            ) : showDestinationStep && !showSummary ? (
              <div style={{
                maxWidth: '600px',
                margin: '1rem auto',
                padding: '0 1rem',
                position: 'relative'
              }}>
                <input
                  type="text"
                  placeholder="Destination Address *"
                  value={destination}
                  onChange={(e) => {
                    setDestination(e.target.value);
                    if (e.target.value.length >= 3) {
                      handleAddressSearch(e.target.value, true);
                    } else {
                      setDestinationSuggestions([]);
                      setShowDestinationSuggestions(false);
                      setDestinationCoordinates(null);
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    marginBottom: '0.5rem',
                    border: '2px solid #ccc',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
                {showDestinationSuggestions && destinationSuggestions.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '60px',
                    left: '1rem',
                    right: '1rem',
                    backgroundColor: 'white',
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    zIndex: 1000,
                    maxHeight: '200px',
                    overflowY: 'auto'
                  }}>
                    {destinationSuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        onClick={() => selectAddress(suggestion, true)}
                        style={{
                          padding: '0.75rem',
                          borderBottom: index < destinationSuggestions.length - 1 ? '1px solid #eee' : 'none',
                          cursor: 'pointer',
                          color: 'black'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                      >
                        {suggestion.formattedAddress || suggestion.description}
                      </div>
                    ))}
                  </div>
                )}
                {destination && destination.length >= 3 && destinationSuggestions.length === 0 && !showDestinationSuggestions && (
                  <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span style={{ color: 'white', fontSize: '0.9rem' }}>No results, click </span>
                    <button
                      onClick={switchToGoogle}
                      style={{
                        backgroundColor: 'transparent',
                        color: '#fbbf24',
                        border: 'none',
                        padding: '0',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        fontWeight: '600',
                        textDecoration: 'none'
                      }}
                    >
                      here
                    </button>
                    <span style={{ color: 'white', fontSize: '0.9rem' }}> and retry</span>
                  </div>
                )}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '1rem'
                }}>
                  <button
                    onClick={() => setShowDestinationStep(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#666',
                      fontSize: '0.9rem',
                      cursor: 'pointer'
                    }}
                  >
                    Back
                  </button>
                  <button
                    onClick={async () => {
                      console.log('Destination Next clicked');
                      if (destination) {
                        // Ensure we have coordinates for the destination address
                        if (!destinationCoordinates) {
                          const coords = await geocodeAddress(destination);
                          if (coords) {
                            setDestinationCoordinates(coords);
                          }
                        }
                        
                        console.log('Going to summary for Ride/Delivery');
                        setShowSummary(true);
                      }
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: destination ? 'white' : '#666',
                      fontSize: '0.9rem',
                      cursor: destination ? 'pointer' : 'default',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                  >
                    Next <span>→</span>
                  </button>
                </div>
              </div>
            ) : showSummary ? (
              <>
                {console.log('Rendering summary section, showSummary:', showSummary)}
                <div style={{
                  maxWidth: '600px',
                  margin: '2rem auto',
                  padding: '0 1rem'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '1rem'
                  }}>
                    <button
                      onClick={() => {
                        setShowSummary(false);
                        setShowForm(false);
                        setShowLocationStep(false);
                        setShowDestinationStep(false);
                        setSelectedService(null);
                        setFullName('');
                        setPhone('');
                        setAddress('');
                        setDestination('');
                      }}
                      style={{
                        backgroundColor: 'white',
                        color: 'black',
                        padding: '1rem 2rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (isSubmitted) {
                          if (window.navigator && (window.navigator as any).app) {
                            (window.navigator as any).app.exitApp();
                          } else if ((window as any).device && (window as any).device.exitApp) {
                            (window as any).device.exitApp();
                          } else {
                            window.close();
                            window.location.href = 'about:blank';
                          }
                        } else {
                          const saveRequest = async () => {
                            try {
                              setIsSubmitted(true); // Gray out buttons immediately
                              
                              let pickupCoords = coordinates;
                              if (!pickupCoords && address) {
                                pickupCoords = await geocodeAddress(address);
                              }
                              
                              let destCoords = destinationCoordinates;
                              if (!destCoords && destination) {
                                destCoords = await geocodeAddress(destination);
                              }
                              
                              // Extract city and suburb from address
                              const addressParts = address.split(',').map(part => part.trim());
                              let city = 'Unknown';
                              let suburb = 'Unknown';
                              
                              for (let i = 0; i < addressParts.length; i++) {
                                const part = addressParts[i];
                                if (part.match(/Johannesburg|Pretoria|Cape Town|Durban|Bloemfontein|Port Elizabeth|East London|Kimberley|Polokwane|Nelspruit|Rustenburg|Potchefstroom|Klerksdorp|Witbank|Vanderbijlpark|Centurion|Sandton|Randburg|Roodepoort|Soweto|Midrand|Benoni|Boksburg|Germiston|Kempton Park|Springs|Alberton|Edenvale|Bedfordview/i)) {
                                  city = part;
                                  if (i > 0 && !addressParts[i-1].match(/\d+/)) {
                                    suburb = addressParts[i-1];
                                  } else if (i > 1 && !addressParts[i-2].match(/\d+/)) {
                                    suburb = addressParts[i-2];
                                  }
                                  break;
                                }
                              }
                              
                              if (city === 'Unknown') {
                                for (let i = addressParts.length - 1; i >= 0; i--) {
                                  const part = addressParts[i];
                                  if (/^\d{4}$/.test(part) && i > 0) {
                                    suburb = addressParts[i - 1];
                                    if (i > 1) city = addressParts[i - 2];
                                    break;
                                  }
                                }
                              }
                              
                              const request = await saveClientRequest({
                                fullName,
                                phone,
                                pickup: address,
                                destination: destination || '',
                                transportType: selectedService?.value || '',
                                city,
                                suburb,
                                pickupLatitude: pickupCoords?.latitude,
                                pickupLongitude: pickupCoords?.longitude,
                                destinationLatitude: destCoords?.latitude,
                                destinationLongitude: destCoords?.longitude
                              });
                              
                              alert(`Request #${request['client-request-id']} submitted successfully!`);
                              
                              // Send FCM notification
                              try {
                                await fetch('https://rides911-fcm-api-server.vercel.app/api/notify-sps', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    requestId: request['client-request-id'],
                                    transportType: selectedService?.value || '',
                                    suburb,
                                    pickupLatitude: pickupCoords?.latitude,
                                    pickupLongitude: pickupCoords?.longitude
                                  })
                                });
                              } catch (error) {
                                console.error('FCM notification failed:', error);
                              }
                              
                              // Add marker to map and zoom to location immediately
                              if (pickupCoords && mapRef.current) {
                                // Recreate map with full interactions enabled
                                mapRef.current.remove();
                                
                                const map = L.map('map').setView([pickupCoords.latitude, pickupCoords.longitude], 16);
                                
                                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                                  attribution: '© OpenStreetMap contributors'
                                }).addTo(map);
                                
                                const emoji = getServiceEmoji(selectedService?.value || '');
                                L.marker([pickupCoords.latitude, pickupCoords.longitude], {
                                  icon: L.divIcon({
                                    className: 'custom-marker',
                                    html: `<div style="font-size: 24px;">${emoji}</div>`,
                                    iconSize: [40, 40],
                                    iconAnchor: [20, 20]
                                  })
                                }).addTo(map);
                                
                                mapRef.current = map;
                                
                                // Re-enable Exit button after map is ready
                                setTimeout(() => {
                                  // Keep isSubmitted true but allow Exit to work
                                }, 200);
                                
                                // Scroll to map
                                setTimeout(() => {
                                  const mapElement = document.getElementById('map');
                                  if (mapElement) {
                                    mapElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                  }
                                }, 100);
                              }
                              
                            } catch (error) {
                              console.error('Error saving request:', error);
                              alert('Error submitting request. Please try again.');
                              setIsSubmitted(false); // Re-enable buttons on error
                            }
                          };
                          
                          saveRequest();
                        }
                      }}
                      style={{
                        backgroundColor: 'white',
                        color: 'black',
                        padding: '1rem 2rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      {isSubmitted ? 'Exit' : 'Submit'}
                    </button>
                  </div>
                </div>
              </>
            ) : null}
          </>
        )}
      </div>
      
      <div style={{
        width: 'calc(100vw - 2rem)',
        height: '400px',
        marginLeft: 'calc(-50vw + 50% + 1rem)',
        backgroundColor: '#f5f5f5',
        borderRadius: '12px',
        overflow: 'hidden'
      }}>
        <div id="map" style={{ width: '100%', height: '100%' }}></div>
      </div>
      
      <div style={{
        display: 'flex',
        minHeight: '100vh'
      }}>
      </div>
    </>
  );
}