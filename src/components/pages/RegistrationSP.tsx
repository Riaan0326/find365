import { useState, useEffect } from 'react';
import Radar from 'radar-sdk-js';
import { serviceOptions } from '../../utils/serviceOptions';
import { saveServiceProvider } from '../../utils/spDatabase';

interface RegistrationSPProps {
  onCancel: () => void;
}

export default function RegistrationSP({ onCancel }: RegistrationSPProps) {
  const [formData, setFormData] = useState({
    serviceTypes: [] as string[],
    name: '',
    surname: '',
    address: '',
    phone: '',
    email: '',
    password: '',
    verifyPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [useGoogleGeocoding, setUseGoogleGeocoding] = useState(false);

  useEffect(() => {
    // Initialize Radar
    Radar.initialize('prj_live_pk_b8d0b8b5b8b5b8b5b8b5b8b5b8b5b8b5b8b5b8b5');
    
    const handleClickOutside = (event: MouseEvent) => {
      if (showServiceDropdown && !(event.target as Element).closest('.service-dropdown')) {
        setShowServiceDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showServiceDropdown]);

  const handleServiceToggle = (serviceValue: string) => {
    setFormData(prev => ({
      ...prev,
      serviceTypes: prev.serviceTypes.includes(serviceValue)
        ? prev.serviceTypes.filter(s => s !== serviceValue)
        : [...prev.serviceTypes, serviceValue]
    }));
  };

  const handleAddressSearch = async (query: string) => {
    if (query.length > 2) {
      try {
        if (useGoogleGeocoding && (window as any).google?.maps?.places) {
          // Use Google Places autocomplete
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
                setAddressSuggestions(addresses);
                setShowAddressSuggestions(true);
              }
            }
          );
        } else {
          // Use Radar autocomplete
          const result = await Radar.autocomplete({ query, limit: 5 });
          setAddressSuggestions(result.addresses || []);
          setShowAddressSuggestions(true);
        }
      } catch (error) {
        console.error('Address search error:', error);
      }
    }
  };

  const selectAddress = (address: any) => {
    setFormData({ ...formData, address: address.formattedAddress });
    setShowAddressSuggestions(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.serviceTypes.length === 0) {
      alert('Please select at least one service type');
      return;
    }
    
    if (formData.password !== formData.verifyPassword) {
      alert('Passwords do not match');
      return;
    }
    
    if (formData.phone.length !== 10) {
      alert('Phone number must be 10 digits');
      return;
    }
    
    try {
      const result = await saveServiceProvider({
        serviceTypes: formData.serviceTypes,
        name: formData.name,
        surname: formData.surname,
        address: formData.address,
        phone: formData.phone,
        email: formData.email,
        password: formData.password
      });
      
      alert(`Registration successful! Your SP Code is: ${result['sp-code']}`);
      onCancel();
    } catch (error) {
      console.error('Registration error:', error);
      alert('Registration failed. Please try again.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#000000', padding: '2rem', color: 'white' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#374151', padding: '2rem', borderRadius: '12px' }}>
        <h1 style={{ 
          fontSize: '1.5rem', 
          marginBottom: '2rem',
          color: '#fbbf24'
        }}>
          Service Provider Registration
        </h1>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem', position: 'relative' }} className="service-dropdown">
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'white' }}>Service Types</label>
            <div 
              onClick={() => setShowServiceDropdown(!showServiceDropdown)}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '6px',
                border: 'none',
                background: '#ffffff',
                color: '#000000',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span>
                {formData.serviceTypes.length === 0 
                  ? 'Select Service Types' 
                  : `${formData.serviceTypes.length} service${formData.serviceTypes.length > 1 ? 's' : ''} selected`
                }
              </span>
              <span>▼</span>
            </div>
            
            {showServiceDropdown && (
              <div style={{
                position: 'absolute',
                zIndex: 1000,
                width: '100%',
                background: 'white',
                border: '1px solid #ccc',
                borderRadius: '6px',
                maxHeight: '300px',
                overflowY: 'auto',
                marginTop: '0.25rem'
              }}>
                {serviceOptions.map((category, categoryIndex) => (
                  <div key={categoryIndex}>
                    <div style={{
                      padding: '0.5rem',
                      backgroundColor: '#f5f5f5',
                      fontWeight: 'bold',
                      color: '#333',
                      fontSize: '0.9rem'
                    }}>
                      {category.category}:
                    </div>
                    {category.items.map((item, itemIndex) => (
                      <label
                        key={itemIndex}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '0.5rem',
                          cursor: 'pointer',
                          borderBottom: '1px solid #eee',
                          color: 'black',
                          gap: '0.5rem'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                      >
                        <input
                          type="checkbox"
                          checked={formData.serviceTypes.includes(item.value)}
                          onChange={() => handleServiceToggle(item.value)}
                          style={{ marginRight: '0.5rem' }}
                        />
                        <span style={{ fontSize: '16px' }}>
                          {item.emoji.startsWith('http') ? (
                            <img src={item.emoji} alt={item.label} style={{ width: '20px', height: '20px' }} />
                          ) : (
                            item.emoji
                          )}
                        </span>
                        {item.label}
                      </label>
                    ))}
                  </div>
                ))}
              </div>
            )}
            
            {formData.serviceTypes.length > 0 && (
              <div style={{
                marginTop: '0.5rem',
                padding: '0.5rem',
                backgroundColor: '#1f2937',
                borderRadius: '4px',
                fontSize: '0.85rem'
              }}>
                <strong style={{ color: '#fbbf24' }}>Selected services:</strong>
                <div style={{ marginTop: '0.25rem', display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                  {formData.serviceTypes.map(serviceValue => {
                    const service = serviceOptions.flatMap(cat => cat.items).find(item => item.value === serviceValue);
                    return service ? (
                      <span key={serviceValue} style={{
                        backgroundColor: '#374151',
                        color: 'white',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '12px',
                        fontSize: '0.8rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        {service.emoji.startsWith('http') ? (
                          <img src={service.emoji} alt={service.label} style={{ width: '14px', height: '14px' }} />
                        ) : (
                          service.emoji
                        )}
                        {service.label}
                        <button
                          type="button"
                          onClick={() => handleServiceToggle(serviceValue)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#fbbf24',
                            cursor: 'pointer',
                            marginLeft: '0.25rem',
                            fontSize: '0.8rem',
                            padding: '0',
                            lineHeight: '1'
                          }}
                        >
                          ×
                        </button>
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'white' }}>Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: 'none' }}
              autoComplete="new-password"
              data-lpignore="true"
              data-form-type="other"
              required
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'white' }}>Surname</label>
            <input
              type="text"
              value={formData.surname}
              onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: 'none' }}
              autoComplete="new-password"
              data-lpignore="true"
              data-form-type="other"
              required
            />
          </div>

          <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'white' }}>Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => {
                setFormData({ ...formData, address: e.target.value });
                handleAddressSearch(e.target.value);
              }}
              onFocus={() => formData.address.length > 2 && setShowAddressSuggestions(true)}
              onBlur={() => setTimeout(() => setShowAddressSuggestions(false), 200)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: 'none' }}
              placeholder="Enter your address"
              autoComplete="new-password"
              data-lpignore="true"
              data-form-type="other"
              required
            />
            {showAddressSuggestions && addressSuggestions.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #ccc', borderRadius: '4px', zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
                {addressSuggestions.map((address, index) => (
                  <div
                    key={index}
                    onClick={() => selectAddress(address)}
                    style={{ padding: '0.5rem', cursor: 'pointer', borderBottom: '1px solid #eee', color: 'black' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                  >
                    {address.formattedAddress}
                  </div>
                ))}
              </div>
            )}
            <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#d1d5db' }}>
              No results, click{' '}
              <span 
                onClick={() => {
                  const newValue = !useGoogleGeocoding;
                  setFormData({ ...formData, address: '' });
                  setUseGoogleGeocoding(newValue);
                  
                  if (newValue && formData.address.length > 2) {
                    const checkGoogleAndSearch = () => {
                      if ((window as any).google?.maps?.places) {
                        handleAddressSearch(formData.address);
                      } else {
                        setTimeout(checkGoogleAndSearch, 500);
                      }
                    };
                    setTimeout(checkGoogleAndSearch, 200);
                  } else if (!newValue && formData.address.length > 2) {
                    setTimeout(() => handleAddressSearch(formData.address), 200);
                  }
                }}
                style={{ 
                  cursor: 'pointer', 
                  textDecoration: 'underline', 
                  color: '#fbbf24',
                  fontWeight: 'bold'
                }}
              >
                {useGoogleGeocoding ? '✓' : 'here'}
              </span>
              {' '}and try again
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'white' }}>Phone Number</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                setFormData({ ...formData, phone: value });
              }}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: 'none' }}
              placeholder="0821234567"
              maxLength={10}
              autoComplete="new-password"
              data-lpignore="true"
              data-form-type="other"
              required
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'white' }}>Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: 'none' }}
              autoComplete="new-password"
              data-lpignore="true"
              data-form-type="other"
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
              autoComplete="new-password"
              data-lpignore="true"
              data-form-type="other"
              required
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'white' }}>Verify Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.verifyPassword}
              onChange={(e) => setFormData({ ...formData, verifyPassword: e.target.value })}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: 'none' }}
              autoComplete="new-password"
              data-lpignore="true"
              data-form-type="other"
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
              Show passwords
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
              style={{
                backgroundColor: '#fbbf24',
                color: '#1e40af',
                padding: '0.75rem 2rem',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600'
              }}
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}