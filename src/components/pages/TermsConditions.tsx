interface TermsConditionsProps {
  onBack: () => void;
}

export default function TermsConditions({ onBack }: TermsConditionsProps) {
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
          Terms & Conditions
        </h1>

        <div style={{ 
          lineHeight: '1.6', 
          fontSize: '1rem',
          marginBottom: '1.5rem'
        }}>
          <p style={{ marginBottom: '1.5rem' }}>
            <strong>Last Updated:</strong> [Date]
          </p>

          <h2 style={{ color: '#fbbf24', fontSize: '1.3rem', marginBottom: '1rem' }}>
            1. Acceptance of Terms
          </h2>
          <p style={{ marginBottom: '1.5rem' }}>
            By accessing and using Rides911, you accept and agree to be bound by the terms and provision of this agreement. 
            If you do not agree to abide by the above, please do not use this service.
          </p>

          <h2 style={{ color: '#fbbf24', fontSize: '1.3rem', marginBottom: '1rem' }}>
            2. Service Description
          </h2>
          <p style={{ marginBottom: '1.5rem' }}>
            Rides911 is a platform that connects clients with independent service providers for various services including 
            rides, delivery, assistance, emergency help, tours, and frolic activities. We act as an intermediary and do not 
            directly provide these services.
          </p>

          <h2 style={{ color: '#fbbf24', fontSize: '1.3rem', marginBottom: '1rem' }}>
            3. User Responsibilities
          </h2>
          <ul style={{ marginBottom: '1.5rem', paddingLeft: '2rem' }}>
            <li style={{ marginBottom: '0.5rem' }}>Provide accurate and truthful information</li>
            <li style={{ marginBottom: '0.5rem' }}>Use the service in compliance with applicable laws</li>
            <li style={{ marginBottom: '0.5rem' }}>Treat service providers with respect and courtesy</li>
            <li style={{ marginBottom: '0.5rem' }}>Pay agreed-upon fees for services rendered</li>
            <li style={{ marginBottom: '0.5rem' }}>Not use the platform for illegal activities</li>
          </ul>

          <h2 style={{ color: '#fbbf24', fontSize: '1.3rem', marginBottom: '1rem' }}>
            4. Service Provider Terms
          </h2>
          <ul style={{ marginBottom: '1.5rem', paddingLeft: '2rem' }}>
            <li style={{ marginBottom: '0.5rem' }}>Service providers are independent contractors</li>
            <li style={{ marginBottom: '0.5rem' }}>Must have valid licenses and insurance as required by law</li>
            <li style={{ marginBottom: '0.5rem' }}>Responsible for their own tax obligations</li>
            <li style={{ marginBottom: '0.5rem' }}>Must provide services safely and professionally</li>
            <li style={{ marginBottom: '0.5rem' }}>Subject to background checks and verification</li>
          </ul>

          <h2 style={{ color: '#fbbf24', fontSize: '1.3rem', marginBottom: '1rem' }}>
            5. Payment Terms
          </h2>
          <p style={{ marginBottom: '1.5rem' }}>
            Payment arrangements are made directly between clients and service providers. Rides911 may facilitate 
            payment processing but is not responsible for payment disputes. All fees and pricing are determined 
            by individual service providers.
          </p>

          <h2 style={{ color: '#fbbf24', fontSize: '1.3rem', marginBottom: '1rem' }}>
            6. Limitation of Liability
          </h2>
          <p style={{ marginBottom: '1.5rem' }}>
            Rides911 shall not be liable for any direct, indirect, incidental, special, or consequential damages 
            resulting from the use of our platform or services obtained through our platform. Users engage with 
            service providers at their own risk.
          </p>

          <h2 style={{ color: '#fbbf24', fontSize: '1.3rem', marginBottom: '1rem' }}>
            7. Termination
          </h2>
          <p style={{ marginBottom: '1.5rem' }}>
            We reserve the right to terminate or suspend access to our service immediately, without prior notice 
            or liability, for any reason whatsoever, including without limitation if you breach the Terms.
          </p>

          <h2 style={{ color: '#fbbf24', fontSize: '1.3rem', marginBottom: '1rem' }}>
            8. Changes to Terms
          </h2>
          <p style={{ marginBottom: '1.5rem' }}>
            We reserve the right to modify or replace these Terms at any time. If a revision is material, 
            we will try to provide at least 30 days notice prior to any new terms taking effect.
          </p>

          <h2 style={{ color: '#fbbf24', fontSize: '1.3rem', marginBottom: '1rem' }}>
            9. Contact Information
          </h2>
          <p style={{ marginBottom: '1.5rem' }}>
            If you have any questions about these Terms & Conditions, please contact us at:
            <br />
            Email: find365@mail.com
            <br />
            WhatsApp: +27 67 445 5078
          </p>

          <p style={{ 
            fontStyle: 'italic',
            fontSize: '0.9rem',
            color: '#d1d5db'
          }}>
            By using Rides911, you acknowledge that you have read, understood, and agree to be bound by these Terms & Conditions.
          </p>
        </div>
      </div>
    </div>
  );
}