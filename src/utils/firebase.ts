import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyBU2xarVI0TLp2bAQwcVg5MKqWHmMA7DxM",
  authDomain: "rides911-7c105.firebaseapp.com",
  projectId: "rides911-7c105",
  storageBucket: "rides911-7c105.firebasestorage.app",
  messagingSenderId: "244837489506",
  appId: "1:244837489506:web:f5bad7f5fceb67b269aa3b"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export { messaging, getToken, onMessage };