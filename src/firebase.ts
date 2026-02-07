import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBQDwVv2h6n2bNSbOngejuag3oC_5q3Xs4",
  authDomain: "templatex-a5385.firebaseapp.com",
  projectId: "templatex-a5385",
  storageBucket: "templatex-a5385.firebasestorage.app",
  messagingSenderId: "233204350462",
  appId: "1:233204350462:web:ec598ec9bcf16e3f4bd4af"
};

// Проверка: если мы на сервере, просто создаем заглушку, если в браузере - инициализируем
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };