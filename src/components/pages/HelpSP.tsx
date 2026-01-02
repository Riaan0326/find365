interface HelpSPProps {
  onBack?: () => void;
}

export default function HelpSP({ onBack }: HelpSPProps) {
  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', backgroundColor: 'white', minHeight: '100vh' }}>
      <div style={{ marginBottom: '1rem' }}>
        <button 
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            color: '#2a4365'
          }}
        >
          ← Back
        </button>
      </div>
      <h1 style={{ 
          fontSize: '1.5rem', 
          marginBottom: '2rem',
          color: '#fbbf24'
        }}>
          🚐 Service Provider Help Guide
        </h1>
      
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: '#2a4365', borderBottom: '2px solid #2a4365', paddingBottom: '0.5rem' }}>🗺️ Using the Map</h2>
        
        <div style={{ background: '#f8f9fa', padding: '1rem', margin: '1rem 0', borderLeft: '4px solid #2a4365', borderRadius: '5px' }}>
          <strong>📍 View Requests:</strong><br />
          See all client requests on the map with emoji markers showing different service types.
        </div>
        
        <div style={{ background: '#f8f9fa', padding: '1rem', margin: '1rem 0', borderLeft: '4px solid #2a4365', borderRadius: '5px' }}>
          <strong>🔍 Filter Services:</strong><br />
          Use the dropdown to filter and show only the services you provide. Select multiple services by checking the boxes.
        </div>
        
        <div style={{ background: '#f8f9fa', padding: '1rem', margin: '1rem 0', borderLeft: '4px solid #2a4365', borderRadius: '5px' }}>
          <strong>🔄 Real-time Updates:</strong><br />
          The map updates automatically when new client requests are submitted.
        </div>
      </div>
      
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: '#2a4365', borderBottom: '2px solid #2a4365', paddingBottom: '0.5rem' }}>🔑 Service Provider Dashboard</h2>
        
        <div style={{ background: '#f8f9fa', padding: '1rem', margin: '1rem 0', borderLeft: '4px solid #2a4365', borderRadius: '5px' }}>
          <strong>📊 Access Dashboard:</strong><br />
          Click "Service Provider Login" to access the full dashboard with detailed client information.
        </div>
        
        <div style={{ background: '#f8f9fa', padding: '1rem', margin: '1rem 0', borderLeft: '4px solid #2a4365', borderRadius: '5px' }}>
          <strong>📋 Request Details:</strong><br />
          View complete client details including contact information, pickup/destination addresses, and service requirements.
        </div>
        
        <div style={{ background: '#f8f9fa', padding: '1rem', margin: '1rem 0', borderLeft: '4px solid #2a4365', borderRadius: '5px' }}>
          <strong>🔍 Advanced Filtering:</strong><br />
          Filter requests by service type, location, or time to find the most suitable jobs.
        </div>
      </div>
      
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: '#2a4365', borderBottom: '2px solid #2a4365', paddingBottom: '0.5rem' }}>🚗 Service Types</h2>
        
        <div style={{ background: '#f8f9fa', padding: '1rem', margin: '1rem 0', borderLeft: '4px solid #2a4365', borderRadius: '5px' }}>
          <strong>🚕 Ride Request:</strong> Car, TukTuk, Taxi, Minibus, Motorcycle, Bus<br />
          <strong>📦 Delivery:</strong> Car, Motorcycle, TukTuk, Panel Van, Bakkie, Truck<br />
          <strong>🔧 Assistance:</strong> Moving, Towing, Rubble Removal, Ambulance<br />
          <strong>🏞️ Tours:</strong> Bus Tours, Minibus Tours, Motorcycle Tours, Party Bus, International
        </div>
      </div>
      
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: '#2a4365', borderBottom: '2px solid #2a4365', paddingBottom: '0.5rem' }}>💡 Tips for Success</h2>
        
        <div style={{ background: '#f8f9fa', padding: '1rem', margin: '1rem 0', borderLeft: '4px solid #2a4365', borderRadius: '5px' }}>
          <strong>⚡ Quick Response:</strong><br />
          Respond to requests quickly to increase your chances of getting the job.
        </div>
        
        <div style={{ background: '#f8f9fa', padding: '1rem', margin: '1rem 0', borderLeft: '4px solid #2a4365', borderRadius: '5px' }}>
          <strong>📱 Stay Connected:</strong><br />
          Keep your phone handy to receive notifications about new requests in your area.
        </div>
        
        <div style={{ background: '#f8f9fa', padding: '1rem', margin: '1rem 0', borderLeft: '4px solid #2a4365', borderRadius: '5px' }}>
          <strong>🎯 Focus on Your Services:</strong><br />
          Use filters to focus on the services you provide for maximum efficiency.
        </div>
      </div>
    </div>
  );
}