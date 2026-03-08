const { initializeApp } = require("firebase/app");
const { getFirestore } = require("firebase/firestore");

const firebaseConfig = {
  apiKey: "AIzaSyCQ5twX3bANk47zK-FZvUpwXCXqol0NHg8",
  authDomain: "canteen-system-48070.firebaseapp.com",
  projectId: "canteen-system-48070",
  storageBucket: "canteen-system-48070.firebasestorage.app",
  messagingSenderId: "729000337213",
  appId: "1:729000337213:web:c9f78a07657ef781f42f54",
  measurementId: "G-0PST3N4T0G"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

module.exports = { db };
