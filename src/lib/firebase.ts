// Import the functions you need from the SDKs you need

import { initializeApp } from "firebase/app";
import {getAuth} from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore} from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use

// https://firebase.google.com/docs/web/setup#available-libraries


// Your web app's Firebase configuration

// For Firebase JS SDK v7.20.0 and later, measurementId is optional

const firebaseConfig = {

  apiKey: "AIzaSyCO9ZdsxjF41wz7bkF3J6FZCFHI-JcGXn4",

  authDomain: "calendar-553eb.firebaseapp.com",

  projectId: "calendar-553eb",

  storageBucket: "calendar-553eb.appspot.com",

  messagingSenderId: "237198651794",

  appId: "1:237198651794:web:5af807ec41ff262342d14b",

  measurementId: "G-WW0VZZ7VBT"

};


// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);