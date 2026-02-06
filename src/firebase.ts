// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBQDwVv2h6n2bNSb0ngejuag3oC_5q3Xs4",
  authDomain: "templatex-a5385.firebaseapp.com",
  projectId: "templatex-a5385",
  storageBucket: "templatex-a5385.firebasestorage.app",
  messagingSenderId: "233204350462",
  appId: "1:233204350462:web:ec598ec9bcf16e3f4bd4af",
  measurementId: "G-FCL4FWY4GN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
export {app, analytics, db };