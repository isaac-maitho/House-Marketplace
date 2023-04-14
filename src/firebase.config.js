import { initializeApp } from "firebase/app";
import { getFirestore }from 'firebase/firestore'


// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBWeVRs2fhvN0lr649FCtSYzn_eB7qIf40",
  authDomain: "house-marketplace-app-a24c3.firebaseapp.com",
  projectId: "house-marketplace-app-a24c3",
  storageBucket: "house-marketplace-app-a24c3.appspot.com",
  messagingSenderId: "960227354403",
  appId: "1:960227354403:web:6638b47f7c5e834d86ce96"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore()