// import { initializeApp } from "firebase/app";
// import { getAuth } from "firebase/auth";
// import { getFirestore } from "firebase/firestore";

// // Firebase configuration
// const firebaseConfig = {
//   apiKey: "AIzaSyCKoIajnfOrhixgSn6GeuAEWFaOsaSRo_c",
//   authDomain: "todo-list-ac0bc.firebaseapp.com",
//   projectId: "todo-list-ac0bc",
//   storageBucket: "todo-list-ac0bc.appspot.com",
//   messagingSenderId: "841705522118",
//   appId: "1:841705522118:web:7cce50451e805553d6e8c7",
//   measurementId: "G-QTETQGP7MK",

// };

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);

// // Initialize Firebase services
// const auth = getAuth(app);
// const db = getFirestore(app);

// export { auth, db };
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCKoIajnfOrhixgSn6GeuAEWFaOsaSRo_c",
  authDomain: "todo-list-ac0bc.firebaseapp.com",
  projectId: "todo-list-ac0bc",
  storageBucket: "todo-list-ac0bc.appspot.com",
  messagingSenderId: "841705522118",
  appId: "1:841705522118:web:7cce50451e805553d6e8c7",
  measurementId: "G-QTETQGP7MK",
  databaseURL: "https://todo-list-ac0bc-default-rtdb.firebaseio.com",
};
// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);