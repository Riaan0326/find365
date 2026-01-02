interface HelpCRProps {
  onBack?: () => void;
}

export default function HelpCR({ onBack }: HelpCRProps) {
  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', backgroundColor: 'white', minHeight: '100vh' }}>
      <div style={{ marginBottom: '1rem' }}>
        <button 
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '1rem',
            cursor: 'pointer',
            color: '#2a4365'
          }}
        >
          ← Back
        </button>
      </div>
            
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: '#2a4365', marginBottom: '1rem', fontSize: '1.5rem' }}>Using Find365, why?</h2>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <ul style={{ fontSize: '1rem', lineHeight: '1.6', paddingLeft: '1.5rem' }}>
            <li style={{ marginBottom: '0.5rem' }}>Find any service or product you need with just keywords</li>
            <li style={{ marginBottom: '0.5rem' }}>Get multiple responses from service providers & retailers</li>
            <li style={{ marginBottom: '0.5rem' }}>Choose local (30km radius) or national coverage</li>
            <li style={{ marginBottom: '0.5rem' }}>Control how many responses you want to receive</li>
            <li style={{ marginBottom: '0.5rem' }}>Compare options and negotiate directly with providers & retailers</li>
          </ul>
        </div>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ color: '#2a4365', fontSize: '1.2rem', marginBottom: '0.5rem' }}>App Icon:</h3>
          <p style={{ fontSize: '1rem', lineHeight: '1.6', marginBottom: '0.5rem' }}>The App Icon is a shortcut button created on your phone's home screen. It allows you to quickly access Find365 without opening your browser. Once installed, the app works like a native mobile app with faster loading and offline capabilities.</p>
        </div>
      </div>
    </div>
  );
}