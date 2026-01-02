interface DisclaimerProps {
  onBack: () => void;
}

export default function Disclaimer({ onBack }: DisclaimerProps) {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#000000',
      color: 'white',
      padding: '2rem'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        backgroundColor: '#374151',
        padding: '2rem',
        borderRadius: '12px'
      }}>
        <button 
          onClick={onBack}
          style={{
            backgroundColor: '#fbbf24',
            color: '#1e40af',
            padding: '0.5rem 1rem',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            marginBottom: '2rem',
            fontWeight: '600'
          }}
        >
          ← Back
        </button>

        <h1 style={{ 
          color: '#fbbf24', 
          marginBottom: '2rem',
          fontSize: '2rem'
        }}>
          Disclaimer
        </h1>

        <div style={{ 
          lineHeight: '1.6', 
          fontSize: '1rem',
          marginBottom: '1.5rem'
        }}>
          <p style={{ marginBottom: '1.5rem' }}>
            Find365 will try it's best to find service provider or retailer and anything you can think of.
          </p>
        </div>
      </div>
    </div>
  );
}