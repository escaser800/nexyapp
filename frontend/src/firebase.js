// Substitua pelos dados do seu projeto Firebase
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
    apiKey: "AIzaSyDth9K6wGuKJGMSJZtiYeY_2zv52eegMCk",
    authDomain: "nexy-app-d5116.firebaseapp.com",
    projectId: "nexy-app-d5116",
    storageBucket: "nexy-app-d5116.firebasestorage.app",
    messagingSenderId: "957905222974",
    appId: "1:957905222974:web:c71552fca7110cee15c06f",
    measurementId: "G-FJXC2MW4W8",
  };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const rtdb = getDatabase(app);
const provider = new GoogleAuthProvider();

export { app, auth, db, provider, rtdb }; 