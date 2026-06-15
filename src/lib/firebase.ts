import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, OAuthProvider, ActionCodeSettings } from 'firebase/auth';
const firebaseConfig = {
  apiKey: "AIzaSyDJbaRME4RjBPMVIJr569sL9c4MSo3jzBk",
  authDomain: "tradezen-47071.firebaseapp.com",
  projectId: "tradezen-47071",
  storageBucket: "tradezen-47071.firebasestorage.app",
  messagingSenderId: "70779506915",
  appId: "1:70779506915:web:0224c2889203067d7db5d6",
  measurementId: "G-P9NT3WRFSS"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});
export const appleProvider = new OAuthProvider('apple.com');

export const actionCodeSettings: ActionCodeSettings = {
  url: window.location.origin,
  handleCodeInApp: true,
};
