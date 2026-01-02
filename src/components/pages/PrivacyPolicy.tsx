interface PrivacyPolicyProps {
  onBack: () => void;
}

export default function PrivacyPolicy({ onBack }: PrivacyPolicyProps) {
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
          Privacy Policy
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
            1. Information We Collect
          </h2>
          <p style={{ marginBottom: '1rem' }}>
            We collect information you provide directly to us, such as:
          </p>
          <ul style={{ marginBottom: '1.5rem', paddingLeft: '2rem' }}>
            <li style={{ marginBottom: '0.5rem' }}>Name and contact information (phone number, email)</li>
            <li style={{ marginBottom: '0.5rem' }}>Location data (pickup and destination addresses)</li>
            <li style={{ marginBottom: '0.5rem' }}>Service preferences and request details</li>
            <li style={{ marginBottom: '0.5rem' }}>Payment information (processed by third-party providers)</li>
            <li style={{ marginBottom: '0.5rem' }}>Device information and usage data</li>
          </ul>

          <h2 style={{ color: '#fbbf24', fontSize: '1.3rem', marginBottom: '1rem' }}>
            2. How We Use Your Information
          </h2>
          <p style={{ marginBottom: '1rem' }}>
            We use the information we collect to:
          </p>
          <ul style={{ marginBottom: '1.5rem', paddingLeft: '2rem' }}>
            <li style={{ marginBottom: '0.5rem' }}>Connect you with appropriate service providers</li>
            <li style={{ marginBottom: '0.5rem' }}>Process and fulfill service requests</li>
            <li style={{ marginBottom: '0.5rem' }}>Send notifications about your requests</li>
            <li style={{ marginBottom: '0.5rem' }}>Improve our platform and services</li>
            <li style={{ marginBottom: '0.5rem' }}>Ensure safety and security of our platform</li>
            <li style={{ marginBottom: '0.5rem' }}>Comply with legal obligations</li>
          </ul>

          <h2 style={{ color: '#fbbf24', fontSize: '1.3rem', marginBottom: '1rem' }}>
            3. Information Sharing
          </h2>
          <p style={{ marginBottom: '1rem' }}>
            We may share your information with:
          </p>
          <ul style={{ marginBottom: '1.5rem', paddingLeft: '2rem' }}>
            <li style={{ marginBottom: '0.5rem' }}>Service providers to fulfill your requests</li>
            <li style={{ marginBottom: '0.5rem' }}>Third-party service providers who assist our operations</li>
            <li style={{ marginBottom: '0.5rem' }}>Law enforcement when required by law</li>
            <li style={{ marginBottom: '0.5rem' }}>Emergency services when necessary for safety</li>
          </ul>
          <p style={{ marginBottom: '1.5rem' }}>
            We do not sell your personal information to third parties for marketing purposes.
          </p>

          <h2 style={{ color: '#fbbf24', fontSize: '1.3rem', marginBottom: '1rem' }}>
            4. Location Data
          </h2>
          <p style={{ marginBottom: '1.5rem' }}>
            We collect location data to provide our core services. This includes pickup and destination addresses, 
            and may include real-time location data during service provision. You can control location sharing 
            through your device settings, but this may limit platform functionality.
          </p>

          <h2 style={{ color: '#fbbf24', fontSize: '1.3rem', marginBottom: '1rem' }}>
            5. Data Security
          </h2>
          <p style={{ marginBottom: '1.5rem' }}>
            We implement appropriate technical and organizational measures to protect your personal information 
            against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission 
            over the internet is 100% secure.
          </p>

          <h2 style={{ color: '#fbbf24', fontSize: '1.3rem', marginBottom: '1rem' }}>
            6. Data Retention
          </h2>
          <p style={{ marginBottom: '1.5rem' }}>
            We retain your information for as long as necessary to provide our services and comply with legal 
            obligations. Request data may be retained for safety and security purposes even after service completion.
          </p>

          <h2 style={{ color: '#fbbf24', fontSize: '1.3rem', marginBottom: '1rem' }}>
            7. Your Rights
          </h2>
          <p style={{ marginBottom: '1rem' }}>
            You have the right to:
          </p>
          <ul style={{ marginBottom: '1.5rem', paddingLeft: '2rem' }}>
            <li style={{ marginBottom: '0.5rem' }}>Access your personal information</li>
            <li style={{ marginBottom: '0.5rem' }}>Correct inaccurate information</li>
            <li style={{ marginBottom: '0.5rem' }}>Request deletion of your information</li>
            <li style={{ marginBottom: '0.5rem' }}>Object to processing of your information</li>
            <li style={{ marginBottom: '0.5rem' }}>Request data portability</li>
          </ul>

          <h2 style={{ color: '#fbbf24', fontSize: '1.3rem', marginBottom: '1rem' }}>
            8. Cookies and Tracking
          </h2>
          <p style={{ marginBottom: '1.5rem' }}>
            We use cookies and similar technologies to improve your experience, analyze usage patterns, 
            and provide personalized content. You can control cookie settings through your browser preferences.
          </p>

          <h2 style={{ color: '#fbbf24', fontSize: '1.3rem', marginBottom: '1rem' }}>
            9. Third-Party Services
          </h2>
          <p style={{ marginBottom: '1.5rem' }}>
            Our platform may integrate with third-party services (mapping, payment processing, notifications). 
            These services have their own privacy policies, and we encourage you to review them.
          </p>

          <h2 style={{ color: '#fbbf24', fontSize: '1.3rem', marginBottom: '1rem' }}>
            10. Changes to Privacy Policy
          </h2>
          <p style={{ marginBottom: '1.5rem' }}>
            We may update this Privacy Policy from time to time. We will notify you of any material changes 
            by posting the new Privacy Policy on this page and updating the "Last Updated" date.
          </p>

          <h2 style={{ color: '#fbbf24', fontSize: '1.3rem', marginBottom: '1rem' }}>
            11. Contact Us
          </h2>
          <p style={{ marginBottom: '1.5rem' }}>
            If you have any questions about this Privacy Policy, please contact us at:
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
            By using Rides911, you consent to the collection and use of your information as described in this Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}