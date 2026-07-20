import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    onAuthStateChanged,
    User 
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBSwOkHne1g_QuLj2zy_918qvKet9Ro8l4",
  authDomain: "mylife-online.firebaseapp.com",
  projectId: "mylife-online",
  storageBucket: "mylife-online.firebasestorage.app",
  messagingSenderId: "524790740973",
  appId: "1:524790740973:web:1be6d29e82bbdffeddd9e4",
  measurementId: "G-KPW99CYMLM"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// 監聽當前登入狀態
export const listenAuthState = (callback: (user: User | null) => void) => {
    onAuthStateChanged(auth, (user) => {
        callback(user);
    });
};

// 帳密註冊
export const registerUser = async (email: string, pass: string) => {
    return await createUserWithEmailAndPassword(auth, email, pass);
};

// 帳密登入
export const loginUser = async (email: string, pass: string) => {
    return await signInWithEmailAndPassword(auth, email, pass);
};