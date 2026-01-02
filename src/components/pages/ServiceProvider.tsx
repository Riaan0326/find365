import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { getClientRequests, serviceTypeMapping } from '../../utils/database';
import { serviceOptions, getServiceEmoji } from '../../utils/serviceOptions';
import { getSPProfile } from '../../utils/geoFilter';
import { getCreditsForService } from '../../utils/pricing';

export default function ServiceProvider() {
  const mapRef = useRef<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [tourRequests, setTourRequests] = useState<any[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [showServiceFilter, setShowServiceFilter] = useState(false);
  const [spLocationLoading, setSpLocationLoading] = useState(false);
  const [updateLocationLoading, setUpdateLocationLoading] = useState(false);
  const [lastRequestCount, setLastRequestCount] = useState(0);
  const lastRequestCountRef = useRef(0);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(50);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const fcmRetryCountRef = useRef(0);
  const [showOnlyNewest, setShowOnlyNewest] = useState(false);
  const [newestRequestTime, setNewestRequestTime] = useState<number | null>(null);


  const handleUpdateLocation = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    setUpdateLocationLoading(true);
    
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const { latitude, longitude } = position.coords;
      
      // Get SP profile to get spCode
      const spProfile = getSPProfile();
      if (!spProfile) {
        alert('SP profile not found. Please login again.');
        setUpdateLocationLoading(false);
        return;
      }
      
      // Update location in database
      const response = await fetch('https://rides911-fcm-api-server.vercel.app/api/update-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spCode: spProfile.spCode,
          latitude,
          longitude
        })
      });
      
      if (response.ok) {
        // Update local GPS storage
        localStorage.setItem('rides911-sp-gps', JSON.stringify({ latitude, longitude }));
        
        alert('Location updated successfully!');
        
        // Move map to new location with current zoom
        if (mapRef.current) {
          const currentZoom = mapRef.current.getZoom();
          mapRef.current.setView([latitude, longitude], currentZoom);
        }
        
        addSPMarker(); // Add SP marker at new location
      } else {
        alert('Failed to update location. Please try again.');
      }
      
      setUpdateLocationLoading(false);
      
    } catch (error) {
      console.error('Location update error:', error);
      alert('Could not get your location. Please try again.');
      setUpdateLocationLoading(false);
    }
  };

  const handleUseMyLocation = async () => {
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
        mapRef.current.setView([latitude, longitude], 12); // Zoom level 12 ≈ 30km radius
        addSPMarker(); // Add SP marker after zooming
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

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c * 1.40 * 10) / 10; // Apply 1.40 correction factor and round to 1 decimal
  };

  const handleServiceToggle = (serviceValue: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceValue) 
        ? prev.filter(s => s !== serviceValue)
        : [...prev, serviceValue]
    );
  };



  const addSPMarker = () => {
    const spGPS = localStorage.getItem('rides911-sp-gps');
    if (spGPS && mapRef.current) {
      const coords = JSON.parse(spGPS);
      
      // Remove existing SP marker by class name
      mapRef.current.eachLayer((layer: any) => {
        if (layer.getElement && layer.getElement()?.classList.contains('sp-marker')) {
          mapRef.current.removeLayer(layer);
        }
      });
      
      // Add new SP marker
      const spMarker = L.marker([coords.latitude, coords.longitude], {
        icon: L.divIcon({
          className: 'sp-marker',
          html: `<div style="font-size: 20px; transform: rotate(180deg);">💧</div>`,
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        })
      }).addTo(mapRef.current);
      
      spMarker.bindPopup(`
        <div style="color: black; font-size: 12px; text-align: center;">
          <strong>You are here</strong>
        </div>
      `);
    }
  };
  const loadRequests = async () => {
    try {
      console.log('Loading requests...');
      
      const clientRequests = await getClientRequests();
      console.log('Raw requests from DB:', clientRequests.length);
      
      // Handle old requests without TTL fields - treat them as active
      const processedRequests = clientRequests.map(request => ({
        ...request,
        status: request.status !== undefined ? request.status : 1, // Default to active
        clickCount: request.clickCount || 0,
        createdAt: request.createdAt || request.timestamp
      }));
      
      // Filter only active requests (status = 1)
      const activeRequests = processedRequests.filter(request => request.status === 1);
      console.log('Active requests after filtering:', activeRequests.length);
      
      setRequests(activeRequests);
      
      // Initialize request count on first load
      if (lastRequestCount === 0) {
        lastRequestCountRef.current = activeRequests.length;
        setLastRequestCount(activeRequests.length);
      }
      
      // Add SP marker after loading requests
      addSPMarker();
    } catch (error) {
      console.error('Error loading requests:', error);
    }
  };

  // Make function globally available for popup buttons
  useEffect(() => {
    // Check if page was opened from notification
    const urlParams = new URLSearchParams(window.location.search);
    const fromNotification = urlParams.get('from') === 'notification';
    
    console.log('ServiceProvider: Page loaded - URL:', window.location.href);
    console.log('ServiceProvider: Page loaded - from notification:', fromNotification);
    console.log('ServiceProvider: Page loaded - URL params:', urlParams.toString());
    
    // Only trigger showOnlyNewest if explicitly from notification
    if (fromNotification) {
      console.log('Opened from notification - showing newest requests');
      const storedTime = localStorage.getItem('newest-request-time');
      console.log('Stored timestamp:', storedTime);
      if (storedTime) {
        setNewestRequestTime(parseInt(storedTime));
        setShowOnlyNewest(true);
      } else {
        // Fallback - show all requests if no timestamp
        console.log('No stored timestamp - showing all requests');
        setShowOnlyNewest(false);
      }
    }
    
    // Handle payment success/cancel from URL params
    const paymentStatus = urlParams.get('payment');
    
    if (paymentStatus === 'success') {
      alert('Payment successful! Credits added to your account. Click on Pricing to check.');
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (paymentStatus === 'cancelled') {
      alert('Payment was cancelled.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    (window as any).checkCreditsAndShowDetails = async (requestId: string) => {
      try {
        const spProfile = getSPProfile();
        if (!spProfile) {
          alert('SP profile not found. Please login again.');
          return;
        }
        
        // FIRST: Get current request status from database
        const statusResponse = await fetch('https://rides911-fcm-api-server.vercel.app/api/check-request-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestId: parseInt(requestId) })
        });
        
        const statusResult = await statusResponse.json();
        if (!statusResult.success) {
          alert('Request not found.');
          return;
        }
        
        // Check TTL - if request is older than 5 minutes, expire it
        const requestTime = new Date(statusResult.createdAt || statusResult.timestamp).getTime();
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;
        
        if (now - requestTime > fiveMinutes) {
          // Auto-expire by TTL
          await fetch('https://rides911-fcm-api-server.vercel.app/api/update-request-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              requestId: parseInt(requestId), 
              action: 'expire' 
            })
          });
          alert('This request has expired (5 minutes TTL).');
          return;
        }
        
        // Check if already at 5 clicks
        if ((statusResult.clickCount || 0) >= 5) {
          // Auto-expire by click count
          await fetch('https://rides911-fcm-api-server.vercel.app/api/update-request-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              requestId: parseInt(requestId), 
              action: 'expire' 
            })
          });
          alert('This request has expired (5/5 responses).');
          return;
        }
        
        // ONLY NOW: Check credits and proceed
        const request = requests.find(r => r['client-request-id'] === parseInt(requestId));
        if (!request) {
          alert('Request not found.');
          return;
        }
        
        const response = await fetch('https://rides911-fcm-api-server.vercel.app/api/check-credits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ spCode: spProfile.spCode })
        });
        
        const result = await response.json();
        const requiredCredits = getCreditsForService(request.transportType);
        
        if (result.success && result.credits >= requiredCredits) {
          // Deduct credits and show details
          const deductResponse = await fetch('https://rides911-fcm-api-server.vercel.app/api/deduct-credits', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ spCode: spProfile.spCode, amount: requiredCredits })
          });
          
          if (deductResponse.ok) {
            // Increment click count after successful payment
            await fetch('https://rides911-fcm-api-server.vercel.app/api/update-request-status', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                requestId: parseInt(requestId), 
                action: 'increment_click' 
              })
            });
            
            // Stop client timer if it's running
            if ((window as any).stopClientTimer) {
              console.log('Stopping client timer manually');
              (window as any).stopClientTimer();
            } else {
              console.log('stopClientTimer function not found');
            }
            
            // Show request details
            setSelectedRequest(request);
            setShowDetailModal(true);
          }
        } else {
          // Show insufficient credits modal
          alert(`Insufficient credits. This service requires ${requiredCredits} credits. Please make payment. Minimum R50. Thanks\n\nFor credit requests, please send Rides911 a whatsapp or email`);
        }
      } catch (error) {
        console.error('Credit check error:', error);
        alert('Error processing request. Please try again.');
      }
    };
    
    return () => {
      delete (window as any).checkCreditsAndShowDetails;
    };
  }, [requests]);

  // Listen for service worker messages
  useEffect(() => {
    const handleSWMessage = (event: MessageEvent) => {
      if (event.data.action === 'notification-click') {
        console.log('Notification clicked - refreshing dashboard and showing only newest');
        setShowOnlyNewest(true);
        loadRequests();
      }
    };
    
    navigator.serviceWorker.addEventListener('message', handleSWMessage);
    
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleSWMessage);
    };
  }, []);

  useEffect(() => {
    // Listen for service worker refresh messages
    const handleSWMessage = (event: MessageEvent) => {
      if (event.data.action === 'refreshSPDashboard') {
        console.log('Refreshing SP Dashboard from notification click and showing only newest');
        setShowOnlyNewest(true);
        loadRequests(); // Refresh the map data
      }
    };
    
    navigator.serviceWorker.addEventListener('message', handleSWMessage);
    
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showServiceFilter && !target.closest('.service-filter-dropdown')) {
        setShowServiceFilter(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    
    setTimeout(() => {
      if (!mapRef.current && document.getElementById('service-map')) {
        const map = L.map('service-map', {
          maxZoom: 14,
          maxBounds: [[-35, 16], [-22, 33]]
        }).setView([-30.5595, 22.9375], 3.5);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        
        mapRef.current = map;
        
        // Auto-zoom to SP location if GPS coordinates are available
        const spGPS = localStorage.getItem('rides911-sp-gps');
        if (spGPS) {
          const coords = JSON.parse(spGPS);
          map.setView([coords.latitude, coords.longitude], 12);
          
          // Add SP location marker
          L.marker([coords.latitude, coords.longitude], {
            icon: L.divIcon({
              className: 'sp-marker',
              html: `<div style="font-size: 20px; transform: rotate(180deg);">💧</div>`,
              iconSize: [40, 40],
              iconAnchor: [20, 20]
            })
          }).addTo(map).bindPopup(`
            <div style="color: black; font-size: 12px; text-align: center;">
              <strong>You are here</strong>
            </div>
          `);
        }
        
        loadRequests();
      }
    }, 100);
    
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleSWMessage);
      document.removeEventListener('mousedown', handleClickOutside);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [showServiceFilter]);

  // FCM setup for push notifications
  useEffect(() => {
    const setupFCM = async () => {
      try {
        const { messaging, getToken, onMessage } = await import('../../utils/firebase');
        
        // Request notification permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          console.log('Notification permission denied');
          return;
        }
        

        
        // Get FCM token
        const token = await getToken(messaging, {
          vapidKey: 'BK0IDCtDjwEAkPHZbFAQWF9J-2ksLE9_hKPVQOaqVf161Aj1utSq3H6t1864j2NA5GB-PHRegrCKbpfAxCCsuKs'
        });
        
        if (token) {
          console.log('FCM Token:', token);
          // Store token with SP profile
          const spProfile = getSPProfile();
          if (spProfile) {
            localStorage.setItem('fcm-token', token);
            
            // Update SP profile in database with FCM token
            try {
              await fetch('https://rides911-fcm-api-server.vercel.app/api/update-fcm-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  spCode: spProfile.spCode,
                  fcmToken: token
                })
              });
              console.log('FCM token saved to database');
            } catch (error) {
              console.error('Failed to save FCM token:', error);
            }
          }
        }
        
        // Listen for foreground messages
        onMessage(messaging, (payload) => {
          console.log('FCM message received:', payload);
          // Set to show only newest when notification received
          const notificationTime = Date.now();
          console.log('Setting notification time:', notificationTime);
          setNewestRequestTime(notificationTime);
          localStorage.setItem('newest-request-time', notificationTime.toString());
          setShowOnlyNewest(true);
          
          // Delay loading requests to ensure state is set
          setTimeout(() => {
            loadRequests();
          }, 100);
          
          // Show notification when app is in foreground
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(registration => {
              registration.showNotification(payload.notification?.title || 'New Request', {
                body: payload.notification?.body,
                icon: '/icon-192x192.png',
                requireInteraction: true,
                data: { url: '/service-provider' },
                tag: 'ride-request'
              });
            });
          }
        });
        
      } catch (error) {
        console.error('FCM setup failed:', error);
        
        if (fcmRetryCountRef.current < 3) {
          // Retry up to 3 times
          fcmRetryCountRef.current += 1;
          alert(`Push notifications setup failed (Attempt ${fcmRetryCountRef.current}/3). Retrying in 2 seconds...`);
          setTimeout(() => {
            setupFCM();
          }, 2000);
        } else {
          // After 3 failed attempts, show troubleshooting options
          const resolved = confirm(
            'Push notifications setup failed after 3 attempts.\n\n' +
            'Please check following:\n' +
            '• Internet connectivity: Not connected or poor/unstable internet connection.\n' +
            '• Browser settings: If notifications is disabled or strict privacy settings.\n\n' +
            'Click YES if RESOLVED, or NO if NOT RESOLVED to report error to Rides911.'
          );
          
          if (!resolved) {
            // Send error report to WhatsApp
            const spProfile = getSPProfile();
            const errorMessage = `Hi Rides911,\n\nFCM Setup Error Report:\n\nSP Details:\n• Full Name: ${spProfile?.name || 'Unknown'}\n• SP Code: ${spProfile?.spCode || 'Unknown'}\n\nError Details:\n${error instanceof Error ? error.message : String(error)}\n\nPlease assist with push notifications setup.`;
            
            window.open(`https://wa.me/27674455078?text=${encodeURIComponent(errorMessage)}`, '_blank');
          }
        }
      }
    };
    
    setupFCM();
  }, []);

  useEffect(() => {
    console.log('Map effect triggered - showOnlyNewest:', showOnlyNewest, 'newestRequestTime:', newestRequestTime, 'requests:', requests.length);
    
    if (mapRef.current && requests.length > 0) {
      // Remove only request markers, not SP marker
      mapRef.current.eachLayer((layer: any) => {
        if (layer instanceof L.Marker && !layer.getElement()?.classList.contains('sp-marker')) {
          mapRef.current.removeLayer(layer);
        }
      });

      // Filter requests based on showOnlyNewest state
      let requestsToShow = requests;

      
      if (showOnlyNewest && newestRequestTime) {
        // Show requests created within 30 seconds of notification time
        requestsToShow = requests.filter(request => {
          const requestTime = new Date(request.timestamp || request.createdAt || 0).getTime();
          return Math.abs(requestTime - newestRequestTime) <= 30000;
        });
        console.log('Filtered by timestamp:', requestsToShow.length, 'requests');
      } else if (showOnlyNewest) {
        // Fallback to show last request
        requestsToShow = [requests[requests.length - 1]];
        console.log('Showing last request only');
      } else {
        console.log('Showing all requests:', requestsToShow.length);
      }

      // Separate tour requests from map requests
      const tourRequestsFiltered = requestsToShow.filter(request => {
        const serviceInfo = serviceTypeMapping[request.transportType] || { category: 'Unknown' };
        const isTour = serviceInfo.category === 'Tour';
        
        // Apply service filter to tours
        if (selectedServices.length > 0 && !selectedServices.includes(request.transportType)) {
          return false;
        }
        
        return isTour;
      });
      
      setTourRequests(tourRequestsFiltered);

      requestsToShow.forEach((request) => {
        if (!request.pickupLatitude || !request.pickupLongitude) return;
        
        if (selectedServices.length > 0 && !selectedServices.includes(request.transportType)) {
          return;
        }
        
        const lat = request.pickupLatitude;
        const lng = request.pickupLongitude;
        const serviceInfo = serviceTypeMapping[request.transportType] || { category: 'Unknown', vehicle: 'Unknown' };
        const emoji = getServiceEmoji(request.transportType);
        
        // Calculate distance between pickup and destination
        let tripDistance = 'N/A';
        if (request.destinationLatitude && request.destinationLongitude) {
          tripDistance = calculateDistance(request.pickupLatitude, request.pickupLongitude, request.destinationLatitude, request.destinationLongitude).toFixed(1);
        }
        
        // Calculate distance from SP to pickup (assuming SP location from GPS)
        const spProfile = getSPProfile();
        let distanceAway = 'N/A';
        if (spProfile?.location?.latitude && spProfile?.location?.longitude) {
          distanceAway = calculateDistance(spProfile.location.latitude, spProfile.location.longitude, request.pickupLatitude, request.pickupLongitude).toFixed(1);
        }
        
        const marker = L.marker([lat, lng], {
          icon: L.divIcon({
            className: 'custom-marker',
            html: `<div style="font-size: 18px;">${emoji}</div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15]
          })
        }).addTo(mapRef.current);
        
        marker.bindPopup(`
          <div style="color: black; font-size: 12px;">
            <strong>Service: ${serviceInfo.category}</strong><br>
            <strong>Type: ${serviceInfo.vehicle}</strong><br>
            <strong>Suburb: ${request.suburb}</strong><br>
            <strong>City: ${request.city}</strong><br>
            <strong>Distance away: ${distanceAway}km</strong><br>
            <strong>Trip distance: ${tripDistance}km</strong><br>
            ${request.status === 0 ? 
              `<button disabled style="background: #6b7280; border: none; padding: 5px 10px; margin-top: 5px; border-radius: 4px; cursor: not-allowed; color: white;">Expired</button>` :
              `<button id="letsgo-${request['client-request-id']}" onclick="
                console.log('Lets go button clicked for request:', '${request['client-request-id']}');
                this.disabled=true; 
                this.style.backgroundColor='#6b7280'; 
                this.style.cursor='not-allowed'; 
                this.innerText='Processing...'; 
                window.checkCreditsAndShowDetails('${request['client-request-id']}');
                setTimeout(function() {
                  this.disabled=false;
                  this.style.backgroundColor='#fbbf24';
                  this.style.cursor='pointer';
                  this.innerText='Lets go';
                }.bind(this), 8000);
              " style="background: #fbbf24; border: none; padding: 5px 10px; margin-top: 5px; border-radius: 4px; cursor: pointer;">Let's go</button>`
            }
          </div>
        `);
      });
    }
  }, [requests, selectedServices, showOnlyNewest]);

  return (
    <>
      {showPaymentModal && (
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
            width: '100%'
          }}>
            <h2 style={{ color: '#fbbf24', marginBottom: '1rem' }}>Buy Credits</h2>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'white' }}>Select Amount:</label>
              
              <div style={{ marginBottom: '1rem' }}>
                {[50, 75, 100, 200].map(amount => (
                  <label key={amount} style={{ display: 'block', marginBottom: '0.5rem', color: 'white', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="paymentAmount"
                      value={amount}
                      checked={paymentAmount === amount}
                      onChange={() => setPaymentAmount(amount)}
                      style={{ marginRight: '0.5rem' }}
                    />
                    R{amount}
                  </label>
                ))}
              </div>
              
              <p style={{ fontSize: '0.8rem', color: '#d1d5db' }}>R1.00 = 1 Credit</p>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={async () => {
                  setPaymentLoading(true);
                  const spProfile = getSPProfile();
                  if (!spProfile) {
                    alert('SP profile not found. Please login again.');
                    setPaymentLoading(false);
                    return;
                  }
                  
                  // Create PayFast form with proper merchant details
                  const form = document.createElement('form');
                  form.method = 'POST';
                  form.action = 'https://sandbox.payfast.co.za/eng/process';
                  
                  const paymentData = {
                    merchant_id: '10000100',
                    merchant_key: '46f0cd694581a',
                    return_url: 'https://rides911.com/service-provider?payment=success',
                    cancel_url: 'https://rides911.com/service-provider?payment=cancelled',
                    notify_url: 'https://rides911-fcm-api-server.vercel.app/api/payfast-payment',
                    name_first: spProfile.name,
                    name_last: spProfile.surname,
                    email_address: spProfile.email,
                    m_payment_id: `${spProfile.spCode}_${Date.now()}`,
                    amount: paymentAmount.toFixed(2),
                    item_name: `Rides911 Credits - R${paymentAmount}`,
                    item_description: `Credit top-up for SP ${spProfile.spCode}`
                  };
                  
                  Object.keys(paymentData).forEach(key => {
                    const input = document.createElement('input');
                    input.type = 'hidden';
                    input.name = key;
                    input.value = paymentData[key as keyof typeof paymentData];
                    form.appendChild(input);
                  });
                  
                  document.body.appendChild(form);
                  form.submit();
                }}
                disabled={paymentLoading}
                style={{
                  backgroundColor: paymentLoading ? '#6b7280' : '#10b981',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: paymentLoading ? 'not-allowed' : 'pointer',
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                {paymentLoading && (
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid #ffffff',
                    borderTop: '2px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                )}
                {paymentLoading ? 'Processing...' : 'Pay with PayFast'}
              </button>
              
              <button
                onClick={() => setShowPaymentModal(false)}
                style={{
                  backgroundColor: '#6b7280',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showPricingModal && (
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
            backgroundColor: '#ffffff',
            padding: '2rem',
            borderRadius: '12px',
            maxWidth: '500px',
            color: '#000000',
            width: '100%'
          }}>
            <h2 style={{ color: '#000000', marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'normal' }}>Amount of credits Rides911 ask per "Let's go" to get full Client Details:</h2>
            
            <div style={{ marginBottom: '1rem', fontSize: '0.85rem', lineHeight: '1.4' }}>
              <h3 style={{ color: '#000000', marginBottom: '0.5rem', fontSize: '0.95rem', fontWeight: 'normal' }}>Rides:</h3>
              <p style={{ margin: '0.2rem 0', fontWeight: 'normal' }}>Car, Minibus: 15</p>
              <p style={{ margin: '0.2rem 0', fontWeight: 'normal' }}>TukTuk, Taxi, Motorcycle: 2</p>
              <p style={{ margin: '0.2rem 0', fontWeight: 'normal' }}>Bus: 50</p>
              
              <h3 style={{ color: '#000000', marginBottom: '0.5rem', marginTop: '1rem', fontSize: '0.95rem', fontWeight: 'normal' }}>Delivery:</h3>
              <p style={{ margin: '0.2rem 0', fontWeight: 'normal' }}>Car, Motorcycle, TukTuk: 5</p>
              <p style={{ margin: '0.2rem 0', fontWeight: 'normal' }}>Panel Van, Bakkie: 20</p>
              <p style={{ margin: '0.2rem 0', fontWeight: 'normal' }}>Truck: 50</p>
              
              <h3 style={{ color: '#000000', marginBottom: '0.5rem', marginTop: '1rem', fontSize: '0.95rem', fontWeight: 'normal' }}>Assistance:</h3>
              <p style={{ margin: '0.2rem 0', fontWeight: 'normal' }}>Moving - City: 50</p>
              <p style={{ margin: '0.2rem 0', fontWeight: 'normal' }}>Moving - National: 100</p>
              <p style={{ margin: '0.2rem 0', fontWeight: 'normal' }}>TowMe (all): 35</p>
              <p style={{ margin: '0.2rem 0', fontWeight: 'normal' }}>Rubble Removal (all): 50</p>
              
              <h3 style={{ color: '#000000', marginBottom: '0.5rem', marginTop: '1rem', fontSize: '0.95rem', fontWeight: 'normal' }}>Emergency:</h3>
              <p style={{ margin: '0.2rem 0', fontWeight: 'normal' }}>All: 50</p>
              
              <h3 style={{ color: '#000000', marginBottom: '0.5rem', marginTop: '1rem', fontSize: '0.95rem', fontWeight: 'normal' }}>Tours:</h3>
              <p style={{ margin: '0.2rem 0', fontWeight: 'normal' }}>All: 100</p>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
              <button
                onClick={async () => {
                  try {
                    const spProfile = getSPProfile();
                    if (!spProfile) {
                      alert('SP profile not found. Please login again.');
                      return;
                    }
                    
                    const response = await fetch('https://rides911-fcm-api-server.vercel.app/api/check-credits', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ spCode: spProfile.spCode })
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                      alert(`Your current credits: ${result.credits}`);
                    } else {
                      alert('Error checking credits. Please try again.');
                    }
                  } catch (error) {
                    console.error('Credit check error:', error);
                    alert('Error checking credits. Please try again.');
                  }
                }}
                style={{
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                Credit Check
              </button>
              
              <button
                onClick={() => setShowPricingModal(false)}
                style={{
                  backgroundColor: '#000000',
                  color: '#ffffff',
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showDetailModal && selectedRequest && (
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
            maxWidth: '500px',
            color: 'white',
            width: '100%'
          }}>
            <h2 style={{ color: '#fbbf24', marginBottom: '1rem' }}>Client Details</h2>
            
            <div style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
              <p><strong>Service:</strong> {(() => {
                const serviceInfo = serviceTypeMapping[selectedRequest.transportType] || { category: 'Unknown' };
                return serviceInfo.category;
              })()}</p>
              <p><strong>Type:</strong> {(() => {
                const serviceInfo = serviceTypeMapping[selectedRequest.transportType] || { vehicle: 'Unknown' };
                return serviceInfo.vehicle;
              })()}</p>
              <p><strong>Full Name:</strong> {selectedRequest.fullName}</p>
              <p><strong>Cell:</strong> {selectedRequest.phone}</p>
              {(() => {
                const serviceInfo = serviceTypeMapping[selectedRequest.transportType] || { category: 'Unknown' };
                if (serviceInfo.category === 'Tour') {
                  return null; // Only show Service, Type, Full Name, and Cell for tours
                }
                return (
                  <>
                    <p><strong>Pickup address:</strong> {selectedRequest.pickup}</p>
                    <p><strong>Destination address:</strong> {selectedRequest.destination || 'Not specified'}</p>
                    <p><strong>Distance away:</strong> {(() => {
                      const spProfile = getSPProfile();
                      if (spProfile?.location?.latitude && spProfile?.location?.longitude) {
                        return calculateDistance(spProfile.location.latitude, spProfile.location.longitude, selectedRequest.pickupLatitude, selectedRequest.pickupLongitude).toFixed(1);
                      }
                      return 'N/A';
                    })()}km</p>
                    <p><strong>Trip distance:</strong> {selectedRequest.destinationLatitude && selectedRequest.destinationLongitude ? calculateDistance(selectedRequest.pickupLatitude, selectedRequest.pickupLongitude, selectedRequest.destinationLatitude, selectedRequest.destinationLongitude).toFixed(1) : 'N/A'}km</p>
                    <p><strong>Total distance:</strong> {(() => {
                      const spProfile = getSPProfile();
                      const distanceAway = spProfile?.location?.latitude && spProfile?.location?.longitude ? 
                        parseFloat(calculateDistance(spProfile.location.latitude, spProfile.location.longitude, selectedRequest.pickupLatitude, selectedRequest.pickupLongitude).toFixed(1)) : 0;
                      const tripDistance = selectedRequest.destinationLatitude && selectedRequest.destinationLongitude ? 
                        parseFloat(calculateDistance(selectedRequest.pickupLatitude, selectedRequest.pickupLongitude, selectedRequest.destinationLatitude, selectedRequest.destinationLongitude).toFixed(1)) : 0;
                      const total = distanceAway + tripDistance;
                      return total > 0 ? total.toFixed(1) : 'N/A';
                    })()}km</p>
                    <p><strong>Suggested cost:</strong> R{(() => {
                      const spProfile = getSPProfile();
                      const distanceAway = spProfile?.location?.latitude && spProfile?.location?.longitude ? 
                        parseFloat(calculateDistance(spProfile.location.latitude, spProfile.location.longitude, selectedRequest.pickupLatitude, selectedRequest.pickupLongitude).toFixed(1)) : 0;
                      const tripDistance = selectedRequest.destinationLatitude && selectedRequest.destinationLongitude ? 
                        parseFloat(calculateDistance(selectedRequest.pickupLatitude, selectedRequest.pickupLongitude, selectedRequest.destinationLatitude, selectedRequest.destinationLongitude).toFixed(1)) : 0;
                      const total = distanceAway + tripDistance;
                      const basePrice = total * 4.95;
                      const finalPrice = basePrice * 1.5; // Add 50%
                      return total > 0 ? Math.round(finalPrice) : 'N/A';
                    })()}</p>
                  </>
                );
              })()}
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'white' }}>Save Client Details to WhatsApp no:</label>
              <input
                type="tel"
                value={whatsappNumber || (() => {
                  // Get SP's phone from localStorage
                  const spData = localStorage.getItem('rides911-sp-profile');
                  if (spData) {
                    const profile = JSON.parse(spData);
                    return profile.phone || '';
                  }
                  return '';
                })()}
                onChange={(e) => setWhatsappNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: 'none' }}
                maxLength={10}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  const currentNumber = whatsappNumber || (() => {
                    const spData = localStorage.getItem('rides911-sp-profile');
                    if (spData) {
                      const profile = JSON.parse(spData);
                      return profile.phone || '';
                    }
                    return '';
                  })();
                  
                  if (currentNumber.length === 10) {
                    const spProfile = getSPProfile();
                    const distanceAway = spProfile?.location?.latitude && spProfile?.location?.longitude ? 
                      calculateDistance(spProfile.location.latitude, spProfile.location.longitude, selectedRequest.pickupLatitude, selectedRequest.pickupLongitude).toFixed(1) : 'N/A';
                    const tripDistance = selectedRequest.destinationLatitude && selectedRequest.destinationLongitude ? 
                      calculateDistance(selectedRequest.pickupLatitude, selectedRequest.pickupLongitude, selectedRequest.destinationLatitude, selectedRequest.destinationLongitude).toFixed(1) : 'N/A';
                    const serviceInfo = serviceTypeMapping[selectedRequest.transportType] || { category: 'Unknown' };
                    
                    const totalDistance = (() => {
                      const distanceAwayNum = distanceAway !== 'N/A' ? parseFloat(distanceAway) : 0;
                      const tripDistanceNum = tripDistance !== 'N/A' ? parseFloat(tripDistance) : 0;
                      const total = distanceAwayNum + tripDistanceNum;
                      return total > 0 ? total.toFixed(1) : 'N/A';
                    })();
                    
                    const suggestedCost = (() => {
                      const distanceAwayNum = distanceAway !== 'N/A' ? parseFloat(distanceAway) : 0;
                      const tripDistanceNum = tripDistance !== 'N/A' ? parseFloat(tripDistance) : 0;
                      const total = distanceAwayNum + tripDistanceNum;
                      const basePrice = total * 4.95;
                      const finalPrice = basePrice * 1.5;
                      return total > 0 ? Math.round(finalPrice) : 'N/A';
                    })();
                    
                    const message = `New ride request:\nService: ${serviceInfo.category}\nClient: ${selectedRequest.fullName}\nCell: ${selectedRequest.phone}\nPickup: ${selectedRequest.pickup}\nDestination: ${selectedRequest.destination || 'Not specified'}\nSuburb: ${selectedRequest.suburb}\nCity: ${selectedRequest.city}\nDistance away: ${distanceAway}km\nTrip distance: ${tripDistance}km\nTotal distance: ${totalDistance}km\nSuggested cost: R${suggestedCost}`;
                    window.open(`https://wa.me/27${currentNumber}?text=${encodeURIComponent(message)}`, '_blank');
                  } else {
                    alert('Please enter a valid 10-digit phone number');
                  }
                }}
                style={{
                  backgroundColor: '#10b981',
                  color: 'white',
                  padding: '0.75rem 1rem',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  width: '100%',
                  marginBottom: '0.5rem'
                }}
              >
                Save to WhatsApp
              </button>
              
              <button
                onClick={() => {
                  const spProfile = getSPProfile();
                  if (!spProfile) {
                    alert('SP profile not found. Please login again.');
                    return;
                  }
                  
                  const message = `Dear ${selectedRequest.fullName},\n\nI am responding to your Rides911 request.\n\nKind regards\n\n${spProfile.name}`;
                  window.open(`https://wa.me/27${selectedRequest.phone}?text=${encodeURIComponent(message)}`, '_blank');
                }}
                style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  padding: '0.75rem 1rem',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  width: '100%',
                  marginBottom: '0.5rem'
                }}
              >
                Send client a response
              </button>
              
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedRequest(null);
                  setWhatsappNumber('');
                }}
                style={{
                  backgroundColor: '#6b7280',
                  color: 'white',
                  padding: '0.75rem 1rem',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  width: '100%'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#000000', 
        padding: '1.0rem',
        color: 'white'
      }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', padding: '0 1rem' }}>
          <h1 style={{ 
            fontSize: '1.5rem', 
            margin: 0,
            color: '#fbbf24'
          }}>
            DashSP
          </h1>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <span 
              style={{ cursor: 'pointer', color: '#fbbf24', fontSize: '0.9rem' }}
              onClick={() => setShowPaymentModal(true)}
            >
              Buy Credits
            </span>
            <span 
              style={{ cursor: 'pointer', color: '#fbbf24', fontSize: '0.9rem' }}
              onClick={() => setShowPricingModal(true)}
            >
              Pricing
            </span>
          </div>
        </div>
        
        <div style={{
          backgroundColor: '#374151',
          padding: '1.0rem',
          borderRadius: '12px'
        }}>
                   
          <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span
              style={{ 
                color: updateLocationLoading ? '#6b7280' : '#ffffff',
                fontSize: '0.75rem', 
                cursor: updateLocationLoading ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap'
              }}
              onClick={updateLocationLoading ? undefined : handleUpdateLocation}
            >
              🌍 {updateLocationLoading ? 'Updating...' : 'Update Location'}
            </span>
            
            <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>|</span>
            
            <span
              style={{ 
                color: '#ffffff',
                fontSize: '0.75rem', 
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Refresh button clicked');
                // Clear only request markers, not SP marker
                if (mapRef.current) {
                  mapRef.current.eachLayer((layer: any) => {
                    if (layer instanceof L.Marker && !layer.getElement()?.classList.contains('sp-marker')) {
                      mapRef.current.removeLayer(layer);
                    }
                  });
                }
                setShowOnlyNewest(false); // Show all requests on manual refresh
                setNewestRequestTime(null); // Clear timestamp
                localStorage.removeItem('newest-request-time');
                console.log('Manual refresh - cleared showOnlyNewest and timestamp');
                loadRequests();
                addSPMarker();
              }}
            >
              🔄 Refresh
            </span>
            
            <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>|</span>
            
            <span
              style={{ 
                color: spLocationLoading ? '#6b7280' : '#ffffff',
                fontSize: '0.75rem', 
                cursor: spLocationLoading ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap'
              }}
              onClick={spLocationLoading ? undefined : handleUseMyLocation}
            >
              <span style={{ display: 'inline-block', transform: 'rotate(180deg)' }}>💧</span> {spLocationLoading ? 'Getting location...' : 'Use my Location'}
            </span>
          </div>
          
            <div className="service-filter-dropdown" style={{ marginBottom: '1rem', position: 'relative', width: '100%' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'white' }}>Filter Services:</label>
              <div 
                onClick={() => setShowServiceFilter(!showServiceFilter)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
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
          
          <p style={{ 
            fontSize: '0.85rem', 
            color: '#d1d5db', 
            textAlign: 'center', 
            marginBottom: '1rem',
            fontStyle: 'italic'
          }}>
            Press emoji/icon on map to see request details
          </p>
          
          {/* Tour Requests Banner */}
          {tourRequests.length > 0 && (
            <div style={{
              backgroundColor: '#1f2937',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1rem'
            }}>
              <h3 style={{ color: '#fbbf24', marginBottom: '0.5rem', fontSize: '1rem' }}>Tour Requests:</h3>
              {tourRequests.map((request) => {
                const serviceInfo = serviceTypeMapping[request.transportType] || { vehicle: 'Unknown' };
                return (
                  <div key={request['client-request-id']} style={{
                    backgroundColor: '#374151',
                    padding: '0.75rem',
                    borderRadius: '6px',
                    marginBottom: '0.5rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ color: 'white', fontSize: '0.9rem' }}>
                      Tour request: {serviceInfo.vehicle}
                    </span>
                    {request.status === 0 ? (
                      <button disabled style={{
                        background: '#6b7280',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '4px',
                        cursor: 'not-allowed',
                        color: 'white',
                        fontSize: '0.8rem'
                      }}>Expired</button>
                    ) : (
                      <button
                        onClick={() => {
                          console.log('Tour Lets go button clicked for request:', request['client-request-id']);
                          (window as any).checkCreditsAndShowDetails(request['client-request-id'].toString());
                        }}
                        style={{
                          background: '#fbbf24',
                          border: 'none',
                          padding: '0.5rem 1rem',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          color: '#000',
                          fontSize: '0.8rem',
                          fontWeight: 'bold'
                        }}
                      >
                        Let's go
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          
          <div className="map-container">
            <div id="service-map"></div>
          </div>
          
         
        </div>
      </div>
      </div>
    </>
  );
}