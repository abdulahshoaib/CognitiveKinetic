import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from './firebase';

const PROFILE_SUBCOLLECTION = 'profile';
const PROFILE_DOC_ID = 'main';
const LOCAL_PROFILE_KEY = '@relay_profile_';

export const getProfile = async (uid) => {
  if (!uid) return null;
  try {
    // 1. Try fetching from Firestore first
    const docRef = doc(db, 'users', uid, PROFILE_SUBCOLLECTION, PROFILE_DOC_ID);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = { id: docSnap.id, ...docSnap.data() };
      // Cache locally
      await AsyncStorage.setItem(LOCAL_PROFILE_KEY + uid, JSON.stringify(data));
      return data;
    }
  } catch (error) {
    console.warn('Error fetching from Firestore, trying local cache:', error);
  }

  // 2. Fallback to local AsyncStorage
  try {
    const localData = await AsyncStorage.getItem(LOCAL_PROFILE_KEY + uid);
    if (localData) {
      return JSON.parse(localData);
    }
  } catch (localError) {
    console.error('Error fetching profile from AsyncStorage:', localError);
  }
  return null;
};

export const saveProfile = async (uid, profileData) => {
  if (!uid) return;
  const timestamp = new Date().toISOString();
  let existingLocal = {};
  try {
    const localData = await AsyncStorage.getItem(LOCAL_PROFILE_KEY + uid);
    existingLocal = localData ? JSON.parse(localData) : {};
  } catch (localError) {
    console.error('Error reading existing profile locally:', localError);
  }

  const dataToSave = {
    ...existingLocal,
    ...profileData,
    createdAt: existingLocal.createdAt || timestamp,
    updatedAt: timestamp,
  };

  // 1. Always save locally first to guarantee success
  try {
    await AsyncStorage.setItem(LOCAL_PROFILE_KEY + uid, JSON.stringify({ id: uid, ...dataToSave }));
  } catch (localError) {
    console.error('Error saving profile locally:', localError);
  }

  // 2. Attempt saving to Firestore
  try {
    const docRef = doc(db, 'users', uid, PROFILE_SUBCOLLECTION, PROFILE_DOC_ID);
    await setDoc(docRef, {
      ...profileData,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.warn('Firestore save failed, local cache preserved:', error);
    // Do not throw if local save succeeded, ensuring smooth UX
  }
};

export const updateProfile = async (uid, profileData) => {
  if (!uid) return;
  const timestamp = new Date().toISOString();

  // 1. Update locally first
  try {
    const localData = await AsyncStorage.getItem(LOCAL_PROFILE_KEY + uid);
    const current = localData ? JSON.parse(localData) : {};
    const updated = { ...current, ...profileData, updatedAt: timestamp };
    await AsyncStorage.setItem(LOCAL_PROFILE_KEY + uid, JSON.stringify(updated));
  } catch (localError) {
    console.error('Error updating profile locally:', localError);
  }

  // 2. Attempt updating Firestore
  try {
    const docRef = doc(db, 'users', uid, PROFILE_SUBCOLLECTION, PROFILE_DOC_ID);
    await setDoc(docRef, {
      ...profileData,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.warn('Firestore update failed, local cache preserved:', error);
  }
};
