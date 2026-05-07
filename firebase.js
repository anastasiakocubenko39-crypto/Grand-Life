// firebase.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyATPexSn7etxoBsTsBd3JXND5R9MsrtvJk",
  authDomain: "grand-life-7c3a9.firebaseapp.com",
  projectId: "grand-life-7c3a9",
  storageBucket: "grand-life-7c3a9.firebasestorage.app",
  messagingSenderId: "855282740287",
  appId: "1:855282740287:web:10081c86ad3a0c9c235c8a"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);