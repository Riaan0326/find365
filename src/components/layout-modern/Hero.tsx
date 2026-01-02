import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import Radar from 'radar-sdk-js';
import { saveClientRequest, getClientRequests, serviceTypeMapping } from '../../utils/database';
import { serviceOptions, getServiceEmoji } from '../../utils/serviceOptions';
import HelpCR from '../pages/HelpCR';
import HelpSP from '../pages/HelpSP';

interface HeroProps {
  showWelcome: boolean;
  setShowWelcome: (show: boolean) => void;
  onShowLoginSP: () => void;
}

export default function Hero({ showWelcome, setShowWelcome, onShowLoginSP }: HeroProps) {
  const mapRef = useRef<any>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    pickup: '',
    destination: '',
    transportType: '',
    latitude: null as number | null,
    longitude: null as number | null,
    destinationLatitude: null as number | null,
    destinationLongitude: null as number | null
  });
  const [pickupSuggestions, setPickupSuggestions] = useState<any[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<any[]>([]);
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [showServiceFilter, setShowServiceFilter] = useState(false);
  const [showClientServiceDropdown, setShowClientServiceDropdown] = useState(false);
  const [useGoogleGeocoding, setUseGoogleGeocoding] = useState(false);
  const [showHelpCR, setShowHelpCR] = useState(false);
  const [showHelpSP, setShowHelpSP] = useState(false);




  const [clientLocationLoading, setClientLocationLoading] = useState(false);
  const [spLocationLoading, setSpLocationLoading] = useState(false);
  const [showRetryPrompt, setShowRetryPrompt] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<any>(null);
  const [activeRequestId, setActiveRequestId] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [showTimer, setShowTimer] = useState(false);
  const [timerMessage, setTimerMessage] = useState('');
  const timerIntervalRef = useRef<number | null>(null);
  const [lastFormData, setLastFormData] = useState<any>(null);
  const [retryInProgress, setRetryInProgress] = useState(false);
  const [landingTourRequests, setLandingTourRequests] = useState<any[]>([]);
  // Determine field requirements based on service type
  const getFieldRequirements = (transportType: string) => {
    if (!transportType) return { pickupRequired: true, destinationRequired: false, pickupDisabled: false, destinationDisabled: false };
    
    // Check service category
    const serviceInfo = serviceOptions.find(cat => 
      cat.items.find(item => item.value === transportType)
    );
    const category = serviceInfo?.category || '';
    
    if (category === 'Ride' || category === 'Delivery') {
      return { pickupRequired: true, destinationRequired: true, pickupDisabled: false, destinationDisabled: false };
    } else if (category === 'Assistance' || category === 'Emergency' || category === 'Frolic') {
      return { pickupRequired: true, destinationRequired: false, pickupDisabled: false, destinationDisabled: true };
    } else if (category === 'Tour') {
      return { pickupRequired: false, destinationRequired: false, pickupDisabled: true, destinationDisabled: true };
    }
    
    return { pickupRequired: true, destinationRequired: false, pickupDisabled: false, destinationDisabled: false };
  };
  
  const fieldReqs = getFieldRequirements(formData.transportType);
  
  // Add polling for clickCount changes
  const startClickCountPolling = (requestId: number) => {
    // Start polling after 15 second delay
    setTimeout(() => {
      let pollCount = 0;
      const maxPolls = 19; // 19 polls over 5 minutes (15s + 19*15s = 300s)
      
      const pollInterval = setInterval(async () => {
        pollCount++;
        console.log(`Polling attempt ${pollCount}/${maxPolls} for request ${requestId}`);
        
        try {
          const response = await fetch('https://rides911-fcm-api-server.vercel.app/api/check-request-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requestId })
          });
          
          const result = await response.json();
          console.log('Polling response:', result);
          
          if (result.success && result.clickCount >= 1) {
            // SP responded with payment - hide client timer but keep it running
            console.log('SP responded! Hiding client timer.');
            clearInterval(pollInterval);
            
            // Hide timer display but keep countdown running in background
            setShowTimer(false);
            
            // Show success message
            alert('Great news! Service Providers on it.... Check your WhatsApp. Don\'t have WhatsApp, no problem SP\'s will contact you.');
            
            return;
          }
        } catch (error) {
          console.log('Polling error:', error);
        }
        
        // Stop polling after max attempts
        if (pollCount >= maxPolls) {
          console.log('Polling completed - no SP responses detected');
          clearInterval(pollInterval);
        }
      }, 15000); // Poll every 15 seconds
    }, 15000); // Initial 15 second delay
  };
  // Add manual timer stop function for when SP responds
  const stopTimerManually = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setShowTimer(false);
    setTimerMessage('Service Providers are responding! Check WhatsApp for offers.');
    setShowTimer(true);
    
    // Hide message after 10 seconds
    setTimeout(() => {
      setShowTimer(false);
      setActiveRequestId(null);
    }, 10000);
  };
  
  // Make function globally available
  useEffect(() => {
    (window as any).stopClientTimer = stopTimerManually;
    return () => {
      delete (window as any).stopClientTimer;
    };
  }, []);

  // Timer and polling functions
  const startTimer = (requestId: number) => {
    setActiveRequestId(requestId);
    setTimeRemaining(300); // 5 minutes in seconds
    setShowTimer(true);
    setTimerMessage('Time remaining for Service Providers to respond');
    setRetryInProgress(false); // Reset retry state when timer starts
    
    // Start countdown timer
    timerIntervalRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Clear the timer interval first
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
          }
          
          // Timer expired - set status to 0 and show retry option
          fetch('https://rides911-fcm-api-server.vercel.app/api/update-request-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              requestId, 
              action: 'expire' 
            })
          })
          .then(response => response.json())
          .then(result => {
            console.log('Request expired successfully:', result);
          })
          .catch(error => {
            console.error('Error expiring request:', error);
          });
          
          setTimerMessage('No Service Providers responded in time.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    // Disable polling due to server errors - manual stop when SP responds
    // pollIntervalRef.current = setInterval(() => {
    //   checkRequestStatus(requestId);
    // }, 15000);
  };
  



  const handleRetryRequest = async () => {
    if (!activeRequestId || !lastFormData) return;
    
    setRetryInProgress(true);
    
    try {
      // First, reset the request status to 1 in the database
      const retryResponse = await fetch('https://rides911-fcm-api-server.vercel.app/api/retry-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: activeRequestId })
      });
      
      const retryResult = await retryResponse.json();
      
      if (retryResult.success) {
        console.log('Request status reset to active:', retryResult);
        
        // Restart timer
        startTimer(activeRequestId);
        
        // Start polling for SP responses
        startClickCountPolling(activeRequestId);
        
        // Send notification with original form data
        await fetch('https://rides911-fcm-api-server.vercel.app/api/notify-sps', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requestId: activeRequestId,
            transportType: lastFormData.transportType,
            suburb: lastFormData.suburb,
            pickupLatitude: lastFormData.pickupLatitude,
            pickupLongitude: lastFormData.pickupLongitude,
            destinationLatitude: lastFormData.destinationLatitude,
            destinationLongitude: lastFormData.destinationLongitude
          })
        });
      } else {
        console.error('Failed to reset request status:', retryResult);
        alert('Failed to retry request. Please try again.');
        setRetryInProgress(false);
      }
    } catch (error) {
      console.error('Retry request error:', error);
      alert('Failed to retry request. Please try again.');
      setRetryInProgress(false);
    }
  };
  
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleSPUseMyLocation = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    setSpLocationLoading(true);
    
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const { latitude, longitude } = position.coords;
      
      // Zoom map to SP location with 30km radius
      if (mapRef.current) {
        mapRef.current.setView([latitude, longitude], 11.5); // Zoom level 12 ≈ 30km radius
      }
      
      // Keep loading state for 2 seconds
      setTimeout(() => {
        setSpLocationLoading(false);
      }, 2000);
      
    } catch (error) {
      console.error('Location error:', error);
      alert('Could not get your location. Please try again.');
      setSpLocationLoading(false);
    }
  };

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



  const geocodeAddress = async (address: string) => {
    try {
      // Skip Radar for now, go straight to Google
    } catch (error) {
      // Radar geocoding failed, trying Google
    }

    try {
      // Fallback to Google
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
      // Google geocoding failed
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.transportType) {
      alert('Please select service type');
      return;
    }
    
    if (fieldReqs.pickupRequired && !formData.pickup) {
      alert('Please fill in pickup location');
      return;
    }
    
    if (fieldReqs.destinationRequired && !formData.destination) {
      alert('Please fill in destination address');
      return;
    }

    try {
      // If no coordinates yet, try to geocode the pickup address (skip for tours)
      let pickupCoordinates = { latitude: formData.latitude, longitude: formData.longitude };
      if (fieldReqs.pickupRequired && (!formData.latitude || !formData.longitude)) {
        const geocoded = await geocodeAddress(formData.pickup);
        if (geocoded) {
          pickupCoordinates = geocoded;
        }
      }
      
      // Use destination coordinates from formData or geocode if not available
      let destinationCoordinates = null;
      if (formData.destination) {
        if (formData.destinationLatitude && formData.destinationLongitude) {
          destinationCoordinates = {
            latitude: formData.destinationLatitude,
            longitude: formData.destinationLongitude
          };
        } else {
          destinationCoordinates = await geocodeAddress(formData.destination);
        }
      }

      // Extract city and suburb from pickup address
      const addressParts = formData.pickup.split(',').map(part => part.trim());
      let city = 'Unknown';
      let suburb = 'Unknown';
      
      // Look for South African city names first
      for (let i = 0; i < addressParts.length; i++) {
        const part = addressParts[i];
        if (part.match(/Johannesburg|Pretoria|Cape Town|Durban|Bloemfontein|Port Elizabeth|East London|Kimberley|Polokwane|Nelspruit|Rustenburg|Potchefstroom|Klerksdorp|Witbank|Vanderbijlpark|Centurion|Sandton|Randburg|Roodepoort|Soweto|Midrand|Benoni|Boksburg|Germiston|Kempton Park|Springs|Alberton|Edenvale|Bedfordview/i)) {
          city = part;
          // Look for suburb (usually before city or after street)
          if (i > 0 && !addressParts[i-1].match(/\d+/)) {
            suburb = addressParts[i-1];
          } else if (i > 1 && !addressParts[i-2].match(/\d+/)) {
            suburb = addressParts[i-2];
          }
          break;
        }
      }
      
      // If no city found, look for postal code pattern
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
      
      // Check if coordinates are available (skip for tours)
      if (fieldReqs.pickupRequired && (!pickupCoordinates.latitude || !pickupCoordinates.longitude)) {
        setPendingFormData({
          fullName: formData.fullName,
          phone: formData.phone,
          pickup: formData.pickup,
          destination: formData.destination,
          transportType: formData.transportType,
          city,
          suburb,
          destinationCoordinates
        });
        setShowRetryPrompt(true);
        return;
      }
      
      const request = await saveClientRequest({
        fullName: formData.fullName,
        phone: formData.phone,
        pickup: formData.pickup,
        destination: formData.destination,
        transportType: formData.transportType,
        city,
        suburb,
        pickupLatitude: pickupCoordinates.latitude || undefined,
        pickupLongitude: pickupCoordinates.longitude || undefined,
        destinationLatitude: destinationCoordinates?.latitude || undefined,
        destinationLongitude: destinationCoordinates?.longitude || undefined
      });
      
      // Store form data for retry notifications
      setLastFormData({
        transportType: formData.transportType,
        suburb,
        pickupLatitude: pickupCoordinates.latitude,
        pickupLongitude: pickupCoordinates.longitude,
        destinationLatitude: destinationCoordinates?.latitude,
        destinationLongitude: destinationCoordinates?.longitude
      });
      
      // Reset form
      setFormData({
        fullName: '',
        phone: '',
        pickup: '',
        destination: '',
        transportType: '',
        latitude: null,
        longitude: null,
        destinationLatitude: null,
        destinationLongitude: null
      });
      
      alert(`Request #${request['client-request-id']} submitted successfully!`);
      
      // Start the 5-minute timer
      startTimer(request['client-request-id']);
      
      // Start polling for SP responses
      startClickCountPolling(request['client-request-id']);
      
      // Trigger FCM notification to relevant SPs
      try {
        // Send notification data to your server endpoint
        await fetch('https://rides911-fcm-api-server.vercel.app/api/notify-sps', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requestId: request['client-request-id'],
            transportType: formData.transportType,
            suburb,
            pickupLatitude: pickupCoordinates.latitude,
            pickupLongitude: pickupCoordinates.longitude,
            destinationLatitude: destinationCoordinates?.latitude,
            destinationLongitude: destinationCoordinates?.longitude
          })
        });
        console.log('FCM notification triggered');
      } catch (error) {
        console.error('FCM notification failed:', error);
      }
      
      // Refresh map after 2 seconds to show new request
      setTimeout(() => {
        loadRequestsForLandingMap();
        
        // Auto-scroll to Service Provider map and zoom to pickup location
        if (pickupCoordinates.latitude && pickupCoordinates.longitude) {
          const mapElement = document.getElementById('map');
          if (mapElement) {
            mapElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Zoom to max level at pickup location
            if (mapRef.current) {
              mapRef.current.setView([pickupCoordinates.latitude, pickupCoordinates.longitude], 16);
            }
          }
        }
      }, 2000);
    } catch (error) {
      console.error('Error submitting request:', error);
      alert('Error submitting request. Please try again.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Handle address autocomplete
    if (name === 'pickup' && value.length > 2) {
      handleAddressSearch(value, 'pickup');
    } else if (name === 'destination' && value.length > 2) {
      handleAddressSearch(value, 'destination');
    }
  };

  const handleAddressSearch = async (query: string, field: 'pickup' | 'destination') => {
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
              
              if (field === 'pickup') {
                setPickupSuggestions(addresses);
                setShowPickupSuggestions(true);
              } else {
                setDestinationSuggestions(addresses);
                setShowDestinationSuggestions(true);
              }
            }
          }
        );
      } else {
        // Use Radar autocomplete
        try {
          const result = await Radar.autocomplete({
            query,
            limit: 5
          });
          
          if (result && result.addresses && result.addresses.length > 0) {
            if (field === 'pickup') {
              setPickupSuggestions(result.addresses);
              setShowPickupSuggestions(true);
            } else {
              setDestinationSuggestions(result.addresses);
              setShowDestinationSuggestions(true);
            }
          }
        } catch (radarError) {
          console.error('Radar search failed:', radarError);
        }
      }
    } catch (error) {
      console.error('Address search error:', error);
    }
  };

  const selectAddress = async (address: any, field: 'pickup' | 'destination') => {

    
    const updatedData = { ...formData, [field]: address.formattedAddress };
    
    if (useGoogleGeocoding && address.placeId && (window as any).google) {
      // Get coordinates from Google Place ID
      const service = new (window as any).google.maps.places.PlacesService(document.createElement('div'));
      service.getDetails(
        { placeId: address.placeId },
        (place: any, status: any) => {
          if (status === (window as any).google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
            if (field === 'pickup') {
              updatedData.latitude = place.geometry.location.lat();
              updatedData.longitude = place.geometry.location.lng();
            } else {
              updatedData.destinationLatitude = place.geometry.location.lat();
              updatedData.destinationLongitude = place.geometry.location.lng();
            }
            setFormData(updatedData);
          }
        }
      );
    } else {
      // Try different coordinate properties from Radar for both pickup and destination
      if (address.geometry?.coordinates) {
        if (field === 'pickup') {
          updatedData.latitude = address.geometry.coordinates[1];
          updatedData.longitude = address.geometry.coordinates[0];
        } else {
          updatedData.destinationLatitude = address.geometry.coordinates[1];
          updatedData.destinationLongitude = address.geometry.coordinates[0];
        }
      } else if (address.latitude && address.longitude) {
        if (field === 'pickup') {
          updatedData.latitude = address.latitude;
          updatedData.longitude = address.longitude;
        } else {
          updatedData.destinationLatitude = address.latitude;
          updatedData.destinationLongitude = address.longitude;
        }
      } else if (address.center) {
        if (field === 'pickup') {
          updatedData.latitude = address.center[1];
          updatedData.longitude = address.center[0];
        } else {
          updatedData.destinationLatitude = address.center[1];
          updatedData.destinationLongitude = address.center[0];
        }
      }
      setFormData(updatedData);
    }
    
    if (field === 'pickup') {
      setShowPickupSuggestions(false);

    } else {
      setShowDestinationSuggestions(false);
    }
  };



  const handleServiceToggle = (serviceValue: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceValue) 
        ? prev.filter(s => s !== serviceValue)
        : [...prev, serviceValue]
    );
  };

  const handleRetry = async () => {
    setShowRetryPrompt(false);
    
    if (!pendingFormData) return;
    
    try {
      // Try to geocode the pickup address again
      const geocoded = await geocodeAddress(pendingFormData.pickup);
      
      if (geocoded && geocoded.latitude && geocoded.longitude) {
        // Success - save the request
        const request = await saveClientRequest({
          fullName: pendingFormData.fullName,
          phone: pendingFormData.phone,
          pickup: pendingFormData.pickup,
          destination: pendingFormData.destination,
          transportType: pendingFormData.transportType,
          city: pendingFormData.city,
          suburb: pendingFormData.suburb,
          pickupLatitude: geocoded.latitude,
          pickupLongitude: geocoded.longitude,
          destinationLatitude: pendingFormData.destinationCoordinates?.latitude || undefined,
          destinationLongitude: pendingFormData.destinationCoordinates?.longitude || undefined
        });
        
        // Reset form
        setFormData({
          fullName: '',
          phone: '',
          pickup: '',
          destination: '',
          transportType: '',
          latitude: null,
          longitude: null,
          destinationLatitude: null,
          destinationLongitude: null
        });
        
        alert(`Request #${request['client-request-id']} submitted successfully!`);
        
        // Start the 5-minute timer
        startTimer(request['client-request-id']);
        
        // Refresh map and scroll
        setTimeout(() => {
          loadRequestsForLandingMap();
          
          if (geocoded.latitude && geocoded.longitude) {
            const mapElement = document.getElementById('map');
            if (mapElement) {
              mapElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
              
              if (mapRef.current) {
                mapRef.current.setView([geocoded.latitude, geocoded.longitude], 16);
              }
            }
          }
        }, 2000);
      } else {
        // Still no coordinates - show retry again
        setShowRetryPrompt(true);
      }
    } catch (error) {
      console.error('Retry error:', error);
      setShowRetryPrompt(true);
    }
    
    setPendingFormData(null);
  };

  const handleLetsGo = () => {
    localStorage.setItem('rides911-visited', 'true');
    setShowWelcome(false);
    // Trigger map initialization after popup closes
    setTimeout(() => {
      if (!mapRef.current && document.getElementById('map')) {
        const map = L.map('map', {
          maxZoom: 11.5,
          minZoom: 4,
          maxBounds: [[-35, 16], [-22, 33]]
        }).setView([-30.5595, 22.9375], window.innerWidth <= 768 ? 4.5 : 5);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        
        mapRef.current = map;
        loadRequestsForLandingMap();
      }
    }, 100);
  };



  const handleUseMyLocation = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    setClientLocationLoading(true);
    
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const { latitude, longitude } = position.coords;
      
      let result;
      if (useGoogleGeocoding) {
        // Use Google reverse geocoding
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=AIzaSyAmPLdIpW2DWTm1xehg1MZFwo0IeQ3fcp4`
        );
        const data = await response.json();
        result = {
          addresses: data.results.map((r: any) => ({
            formattedAddress: r.formatted_address
          }))
        };
      } else {
        // Use Radar reverse geocoding
        result = await Radar.reverseGeocode({
          latitude,
          longitude
        });
      }

      if (result.addresses && result.addresses.length > 0) {
        const address = result.addresses[0];
        setFormData({
          ...formData,
          pickup: address.formattedAddress || 'Location found',
          latitude,
          longitude
        });
      } else {
        // Show coordinates if Radar can't resolve address
        setFormData({
          ...formData,
          pickup: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
          latitude,
          longitude
        });
      }
      
      setClientLocationLoading(false);
    } catch (error) {
      console.error('Location error:', error);
      alert('Could not get your location. Please enter address manually.');
      setClientLocationLoading(false);
    }
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
        const tourRequests = clientRequests.filter(request => {
          const serviceInfo = serviceTypeMapping[request.transportType] || { category: 'Unknown' };
          const isTour = serviceInfo.category === 'Tour';
          
          // Apply service filter to tours
          if (selectedServices.length > 0 && !selectedServices.includes(request.transportType)) {
            return false;
          }
          
          return isTour && request.status === 1; // Only active tours
        });
        
        setLandingTourRequests(tourRequests);
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
    };

    document.addEventListener('mousedown', handleClickOutside);
    
    setTimeout(() => {
      if (!mapRef.current && document.getElementById('map')) {
        const map = L.map('map', {
          maxZoom: 11.5,
          minZoom: 4,
          maxBounds: [[-35, 16], [-22, 33]]
        }).setView([-30.5595, 22.9375], window.innerWidth <= 768 ? 4.5 : 5);
        
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
  }, [showServiceFilter, showClientServiceDropdown, showHelpCR, showHelpSP]);

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
      {showRetryPrompt && (
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
            maxWidth: '400px',
            color: 'white',
            textAlign: 'center'
          }}>
            <h2 style={{ color: '#fbbf24', marginBottom: '1rem' }}>Location Error</h2>
            <p style={{ marginBottom: '2rem' }}>Unable to get coordinates for your pickup address. Please retry to attempt location lookup again.</p>
            
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button 
                onClick={handleRetry}
                style={{
                  backgroundColor: '#fbbf24',
                  color: '#1e40af',
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600'
                }}
              >
                Retry
              </button>
              
              <button 
                onClick={() => {
                  setShowRetryPrompt(false);
                  setPendingFormData(null);
                }}
                style={{
                  backgroundColor: 'transparent',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  border: '2px solid white',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      

      <section id="home" className="hero">
        <div className="container">
        <div className="hero-split">
          {/* Client Request Side */}
          <div className="hero-left" style={{
         // backgroundImage: 'url("https://res.cloudinary.com/duqmfy7z7/image/upload/v1766323051/lltnzyt4juq9jjv4tege.jpg")',
		    backgroundImage: 'url("https://res.cloudinary.com/duqmfy7z7/image/upload/v1765035423/xndfv3ufi0a2vj5upfha.jpg")',
		 // backgroundImage: 'url("https://res.cloudinary.com/duqmfy7z7/image/upload/v1766323040/aw5bs6aqsmiwfevdcer0.jpg")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ 
                margin: 0,
                fontSize: '1.5rem',
                color: '#fbbf24'
              }}>Client Request</h2>
              <span 
                style={{ cursor: 'pointer', color: '#fbbf24', textDecoration: 'underline', fontSize: '0.9rem' }}
                onClick={() => setShowHelpCR(true)}
              >
                Help
              </span>
            </div>
                        
            <form onSubmit={handleSubmit} autoComplete="new-password">
              <div className="form-group client-service-dropdown" style={{ position: 'relative' }}>
                <label>{(() => {
                  if (!formData.transportType) return 'Service Type';
                  const serviceInfo = serviceOptions.find(cat => 
                    cat.items.find(item => item.value === formData.transportType)
                  );
                  return serviceInfo?.category || 'Service Type';
                })()}</label>
                <div 
                  onClick={() => setShowClientServiceDropdown(!showClientServiceDropdown)}
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
                  <span>{formData.transportType ? serviceOptions.find(cat => cat.items.find(item => item.value === formData.transportType))?.
				  items.find(item => item.value === formData.transportType)?.label || formData.transportType : '-- Select Service Type --'}</span>
                  <span>▼</span>
                </div>
                
                {showClientServiceDropdown && (
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
                          <div
                            key={itemIndex}
                            onClick={() => {
                              setFormData({ ...formData, transportType: item.value });
                              setShowClientServiceDropdown(false);
                            }}
                            style={{
                              padding: '0.75rem',
                              cursor: 'pointer',
                              borderBottom: '1px solid #eee',
                              color: 'black',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                          >
                            <span style={{ fontSize: '16px' }}>
                              {item.emoji.startsWith('http') ? (
                              <img src={item.emoji} alt={item.label} style={{ width: '28px', height: '28px' }} />
                              ) : (
                                item.emoji
                              )}
                            </span>
                            {item.label}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}

                <p style={{ lineHeight: '1.2', fontSize: '0.85rem', marginTop: '0.5rem', marginBottom: '1rem' }}>
                  What is TowMe: see{' '}
                  <span 
                    style={{ cursor: 'pointer', color: '#fbbf24', textDecoration: 'underline' }}
                    onClick={() => setShowHelpCR(true)}
                  >
                    Help
                  </span>
                </p>
              </div>
              
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="John Doe"
                  autoComplete="new-password"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Phone/WhatsApp</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setFormData({ ...formData, phone: value });
                  }}
                  placeholder="0821234567"
                  maxLength={10}
                  autoComplete="new-password"
                  required
                />
              </div>
              
              {!fieldReqs.pickupDisabled && (
              <div className="form-group" style={{ position: 'relative' }}>
                <label style={{ display: 'block', marginBottom: '0' }}>Pickup/Assist Address</label>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ 
                    display: 'block', 
                    width: 'auto', 
                    padding: '0.75rem 0.8rem', 
                    fontSize: '0.75rem', 
                    marginBottom: '0.5rem', 
                    backgroundColor: clientLocationLoading ? '#6b7280' : (formData.latitude && formData.longitude ? '#10b981' : '#374151'),
                    border: '1px solid #000000',
                    cursor: clientLocationLoading ? 'not-allowed' : 'pointer'
                  }}
                  onClick={handleUseMyLocation}
                  disabled={clientLocationLoading}
                >
                  {clientLocationLoading ? 'Getting location...' : (formData.latitude && formData.longitude ? '✓ Location found' : 'Use my location')}
                </button>
                
                <label style={{ fontSize: '0.9rem', color: '#d1d5db', marginBottom: '0.5rem', display: 'block' }}>
				I want to use a different address</label>
                <input
                  type="text"
                  name="pickup"
                  value={formData.pickup}
                  onChange={handleChange}
                  onFocus={() => formData.pickup.length > 2 && setShowPickupSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowPickupSuggestions(false), 200)}
                  onInput={() => setShowPickupSuggestions(false)}
                  placeholder="Enter pickup/assist address"
                  autoComplete="new-password"
                  data-lpignore="true"
                  data-form-type="other"
                  required={fieldReqs.pickupRequired}
                />
                {showPickupSuggestions && pickupSuggestions.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #ccc',
				  borderRadius: '4px', zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
                    {pickupSuggestions.map((address, index) => (
                      <div
                        key={index}
                        onClick={() => selectAddress(address, 'pickup')}
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
                      console.log('HERE clicked, current useGoogleGeocoding:', useGoogleGeocoding);
                      const newValue = !useGoogleGeocoding;
                      console.log('Switching to:', newValue ? 'Google' : 'Radar');
                      setFormData({ ...formData, pickup: '' });
                      setUseGoogleGeocoding(newValue);
                      
                      // If switching to Google, wait for API to load
                      if (newValue && formData.pickup.length > 2) {
                        console.log('Checking Google API availability...');
                        const checkGoogleAndSearch = () => {
                          console.log('Google API check:', !!(window as any).google?.maps?.places);
                          if ((window as any).google?.maps?.places) {
                            console.log('Google API ready, triggering search');
                            handleAddressSearch(formData.pickup, 'pickup');
                          } else {
                            console.log('Google API not ready, retrying...');
                            setTimeout(checkGoogleAndSearch, 500);
                          }
                        };
                        setTimeout(checkGoogleAndSearch, 200);
                      } else if (!newValue && formData.pickup.length > 2) {
                        console.log('Switching to Radar, triggering search');
                        setTimeout(() => handleAddressSearch(formData.pickup, 'pickup'), 200);
                      }
                    }}
                    style={{ 
                      cursor: 'pointer', 
                      textDecoration: 'underline', 
                      color: '#fbbf24',
                      fontWeight: 'bold'
                    }}
                  >
                    {useGoogleGeocoding ? '✓' : 'HERE'}
                  </span>
                  {' '}and try again
                </div>
              </div>
              )}
              
              {!fieldReqs.destinationDisabled && (
              <div className="form-group" style={{ position: 'relative' }}>
                <label>Destination Address</label>
                <input
                  type="text"
                  name="destination"
                  value={formData.destination}
                  onChange={handleChange}
                  onFocus={() => formData.destination.length > 2 && setShowDestinationSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowDestinationSuggestions(false), 200)}
                  onInput={() => setShowDestinationSuggestions(false)}
                  placeholder="Enter destination address"
                  autoComplete="new-password"
                  data-lpignore="true"
                  data-form-type="other"
                  required={fieldReqs.destinationRequired}
                />
                {showDestinationSuggestions && destinationSuggestions.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #ccc', 
				  borderRadius: '4px', zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
                    {destinationSuggestions.map((address, index) => (
                      <div
                        key={index}
                        onClick={() => selectAddress(address, 'destination')}
                        style={{ padding: '0.5rem', cursor: 'pointer', borderBottom: '1px solid #eee', color: 'black' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                      >
                        {address.formattedAddress}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              )}
              
              <button type="submit" className="btn btn-primary">
                Submit Request
              </button>
            </form>
          </div>
          
          {/* Service Provider Map Side */}
          <div className="hero-left">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h2 style={{ 
                margin: 0, 
                fontSize: '1.5rem',
                color: '#fbbf24'
              }}>Service Provider</h2>
              <span 
                style={{ cursor: 'pointer', color: '#fbbf24', textDecoration: 'underline', fontSize: '0.9rem' }}
                onClick={() => setShowHelpSP(true)}
              >
                Help
              </span>
            </div>
            
            <div className="service-filter-dropdown" style={{ marginBottom: '1rem', position: 'relative' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'white' }}>Filter Services:</label>
              <div 
                onClick={() => setShowServiceFilter(!showServiceFilter)}
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
                <span>{selectedServices.length === 0 ? 'All Services' : `${selectedServices.length} Selected`}</span>
                <span>▼</span>
              </div>
              
              {showServiceFilter && (
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
                            checked={selectedServices.includes(item.value)}
                            onChange={() => handleServiceToggle(item.value)}
                            style={{ marginRight: '0.5rem' }}
                          />
                          <span style={{ fontSize: '16px' }}>
                            {item.emoji.startsWith('http') ? (
                              <img src={item.emoji} alt={item.label} style={{ width: '28px', height: '28px' }} />
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
              
              {selectedServices.length > 0 && (
                <div style={{
                  marginTop: '0.5rem',
                  padding: '0.5rem',
                  backgroundColor: '#1f2937',
                  borderRadius: '4px',
                  fontSize: '0.85rem'
                }}>
                  <strong style={{ color: '#fbbf24' }}>Selected services:</strong>
                  <div style={{ marginTop: '0.25rem', display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                    {selectedServices.map(serviceValue => {
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
                            onClick={() => handleServiceToggle(serviceValue)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#fbbf24',
                              cursor: 'pointer',
                              padding: '0',
                              marginLeft: '0.25rem',
                              fontSize: '0.9rem',
                              fontWeight: 'bold'
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
            
            <button 
              type="button" 
              className="btn btn-secondary" 
              style={{ 
                display: 'block', 
                width: 'auto', 
                padding: '0.7rem 0.8rem', 
                fontSize: '0.9rem', 
                marginBottom: '1rem', 
                color: '#000',
                backgroundColor: spLocationLoading ? '#6b7280' : '#ffffff',
                cursor: spLocationLoading ? 'not-allowed' : 'pointer'
              }}
              onClick={handleSPUseMyLocation}
              disabled={spLocationLoading}
            >
              {spLocationLoading ? 'Getting location...' : 'Use my location'}
            </button>
            
            {/* Timer Display */}
            {showTimer && (
              <div style={{
                backgroundColor: timeRemaining > 0 ? '#374151' : '#dc2626',
                color: 'white',
                padding: '1rem',
                borderRadius: '8px',
                marginBottom: '1rem',
                textAlign: 'center'
              }}>
                {timeRemaining > 0 ? (
                  <>
                    <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                      {timerMessage}
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fbbf24' }}>
                      {formatTime(timeRemaining)}
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
                      {timerMessage}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      <button
                        onClick={handleRetryRequest}
                        disabled={retryInProgress}
                        style={{
                          backgroundColor: retryInProgress ? '#6b7280' : '#fbbf24',
                          color: retryInProgress ? '#9ca3af' : '#000',
                          padding: '0.75rem 1.5rem',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: retryInProgress ? 'not-allowed' : 'pointer',
                          fontSize: '1rem',
                          fontWeight: 'bold'
                        }}
                      >
                        {retryInProgress ? 'Retrying...' : 'Retry Request'}
                      </button>
                      <button
                        onClick={() => {
                          setShowTimer(false);
                          setActiveRequestId(null);
                        }}
                        disabled={retryInProgress}
                        style={{
                          backgroundColor: 'transparent',
                          color: 'white',
                          padding: '0.75rem 1.5rem',
                          border: '2px solid white',
                          borderRadius: '6px',
                          cursor: retryInProgress ? 'not-allowed' : 'pointer',
                          fontSize: '1rem',
                          fontWeight: 'bold'
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
            
            <div className="map-container">
              <div id="map"></div>
            </div>
            
            {/* Tour Requests Banner for Landing Page */}
            {landingTourRequests.length > 0 && (
              <div style={{
                backgroundColor: '#1f2937',
                padding: '1rem',
                borderRadius: '8px',
                marginTop: '1rem'
              }}>
                <h3 style={{ color: '#fbbf24', marginBottom: '0.5rem', fontSize: '1rem' }}>Tour Requests:</h3>
                {landingTourRequests.map((request) => {
                  const serviceInfo = serviceTypeMapping[request.transportType] || { vehicle: 'Unknown' };
                  return (
                    <div key={request['client-request-id']} style={{
                      backgroundColor: '#374151',
                      padding: '0.75rem',
                      borderRadius: '6px',
                      marginBottom: '0.5rem',
                      color: 'white',
                      fontSize: '0.9rem'
                    }}>
                      Tour request: {serviceInfo.vehicle}
                    </div>
                  );
                })}
              </div>
            )}
            
            <button 
              className="btn btn-primary"
              onClick={onShowLoginSP}
            >
              SP Login/Register
            </button>
          </div>
        </div>
        </div>
      </section>
    </>
  );
}