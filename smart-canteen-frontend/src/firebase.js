import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCQ5twX3bANk47zK-FZvUpwXCXqol0NHg8",
  authDomain: "canteen-system-48070.firebaseapp.com",
  projectId: "canteen-system-48070",
  storageBucket: "canteen-system-48070.firebasestorage.app",
  messagingSenderId: "729000337213",
  appId: "1:729000337213:web:c9f78a07657ef781f42f54",
  measurementId: "G-0PST3N4T0G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

export { app, analytics, db };
