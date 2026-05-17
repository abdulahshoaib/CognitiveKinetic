import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail, 
  signInAnonymously, 
  signOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithCredential
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (usr) => {
      setUser(usr);
      if (initializing) setInitializing(false);
    });
    return unsubscribe;
  }, [initializing]);

  const login = async (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const signup = async (fullName, email, password) => {
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    const currentUser = userCred.user;
    
    // Update display name
    await updateProfile(currentUser, { displayName: fullName });
    
    // Create DB profile
    await createOrUpdateUserProfile(currentUser, { fullName, provider: 'password' });
    
    return userCred;
  };

  const loginAnonymously = async () => {
    const userCred = await signInAnonymously(auth);
    await createOrUpdateUserProfile(userCred.user, { provider: 'anonymous' });
    return userCred;
  };

  const loginWithGoogle = async (idToken) => {
    const credential = GoogleAuthProvider.credential(idToken);
    const userCred = await signInWithCredential(auth, credential);
    const currentUser = userCred.user;
    await createOrUpdateUserProfile(currentUser, { 
      fullName: currentUser.displayName, 
      provider: 'google' 
    });
    return userCred;
  };

  const resetPassword = async (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  const logout = async () => {
    return signOut(auth);
  };

  const createOrUpdateUserProfile = async (usr, extraData = {}) => {
    if (!usr) return;
    const userRef = doc(db, 'users', usr.uid);
    await setDoc(userRef, {
      uid: usr.uid,
      email: usr.email || null,
      isAnonymous: usr.isAnonymous,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      ...extraData
    }, { merge: true });
  };

  return (
    <AuthContext.Provider value={{
      user,
      initializing,
      login,
      signup,
      loginAnonymously,
      loginWithGoogle,
      resetPassword,
      logout,
      createOrUpdateUserProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
