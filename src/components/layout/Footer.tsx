export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div>
            <h3>Rides<sup style={{ fontSize: '0.7em' }}>911</sup></h3>
            <p>Submit a ride, delivery, assistance, emergency or tour request</p>
          </div>
          
          <div>
            <h4>Legal</h4>
            <ul>
              <li><a href="#about">Terms & Conditions</a></li>
              <li><a href="#contact">Privacy Policy</a></li>
            </ul>
          </div>
          
          <div>
            <h4>Contact</h4>
            <div>
              <p>Email: rides911@mail.com</p>
              <p>Whatsapp: +27674455078</p>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; 2024 Rides<sup style={{ fontSize: '0.7em' }}>911</sup>. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}