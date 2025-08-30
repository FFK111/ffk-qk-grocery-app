// FIX: Reverted to use the Firebase v8 API to fix compilation errors likely caused by an older Firebase version in the environment.
import firebase from 'firebase/app';
import 'firebase/firestore';

import { GroceryItem, GroceryListInfo } from "./types";

const firebaseConfig = {
  apiKey: "AIzaSyD5XMfEYTKOEUMomtD4Wdqf88OjrCJtsBE",
  authDomain: "ffk-grocery-sync.firebaseapp.com",
  projectId: "ffk-grocery-sync",
  storageBucket: "ffk-grocery-sync.firebasestorage.app",
  messagingSenderId: "442396361973",
  appId: "1:442396361973:web:69ec493017e0373e5ff1bc"
};

// --- Lazy & Safe Initialization ---
// This prevents re-initialization during hot-reloads in development environments.
const app: firebase.app.App = !firebase.apps.length ? firebase.initializeApp(firebaseConfig) : firebase.app();
const db: firebase.firestore.Firestore = firebase.firestore(app);


// --- Utils ---
async function hashPin(pin: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(pin);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// --- Real-time Item Management ---
export const subscribeToItems = (
    listId: string, 
    onUpdate: (items: GroceryItem[]) => void, 
    onError: (error: Error) => void
) => {
  const itemsCollectionRef = db.collection("lists").doc(listId).collection("items");
  const unsubscribe = itemsCollectionRef.onSnapshot((querySnapshot) => {
    const items = querySnapshot.docs
        .map(doc => doc.data())
        .filter(data => data && typeof data.id === 'string' && typeof data.name === 'string')
        .map(data => data as GroceryItem);
    onUpdate(items);
  }, (error) => {
    console.error("Error subscribing to items:", error);
    onError(error);
  });
  return unsubscribe;
};

export const addItemToFirestore = async (item: GroceryItem, listId: string): Promise<void> => {
  const itemDocRef = db.collection("lists").doc(listId).collection("items").doc(item.id);
  await itemDocRef.set(item);
};

export const togglePurchasedByName = async (listId: string, itemName: string, newStatus: boolean): Promise<void> => {
    const itemsCollectionRef = db.collection("lists").doc(listId).collection("items");
    const q = itemsCollectionRef.where("name", "==", itemName);
    const querySnapshot = await q.get();
    
    if (querySnapshot.empty) return;
    
    const batch = db.batch();
    querySnapshot.forEach(document => {
        batch.update(document.ref, { purchased: newStatus });
    });
    await batch.commit();
};

export const deleteItemsByName = async (listId: string, itemName: string): Promise<void> => {
    const itemsCollectionRef = db.collection("lists").doc(listId).collection("items");
    const q = itemsCollectionRef.where("name", "==", itemName);
    const querySnapshot = await q.get();

    if (querySnapshot.empty) return;

    const batch = db.batch();
    querySnapshot.forEach(document => {
        batch.delete(document.ref);
    });
    await batch.commit();
}

export const deletePurchasedItems = async (listId: string): Promise<void> => {
    const itemsCollectionRef = db.collection("lists").doc(listId).collection("items");
    const q = itemsCollectionRef.where("purchased", "==", true);
    const querySnapshot = await q.get();
    
    if (querySnapshot.empty) return;

    const batch = db.batch();
    querySnapshot.forEach(document => {
        batch.delete(document.ref);
    });
    await batch.commit();
};

// --- List Management ---
export const getPublicLists = async (): Promise<GroceryListInfo[]> => {
    const listsCollectionRef = db.collection("lists");
    const querySnapshot = await listsCollectionRef.get();
    return querySnapshot.docs
      .map(doc => ({
          id: doc.id,
          name: doc.data().name,
          date: doc.data().date,
      }))
      .filter(list => list.name && list.date) 
      .map(list => list as GroceryListInfo);
};

export const createList = async (listName: string, pin: string, date: string): Promise<string> => {
    const listId = listName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    if (!listId) throw new Error("Invalid list name. Use letters and numbers.");

    const listDocRef = db.collection("lists").doc(listId);
    const docSnap = await listDocRef.get();
    if (docSnap.exists) {
        throw new Error("This list name is already taken. Please choose another.");
    }

    const pinHash = await hashPin(pin);
    await listDocRef.set({
        name: listName.trim(),
        pinHash,
        date,
        createdAt: new Date().toISOString(),
    });

    return listId;
};

export const verifyListPin = async (listId: string, pin:string): Promise<boolean> => {
    const listDocRef = db.collection("lists").doc(listId);
    const docSnap = await listDocRef.get();

    if (!docSnap.exists) {
        throw new Error("List not found.");
    }

    const listData = docSnap.data();
    if (!listData) { 
        throw new Error("List data is missing.");
    }
    const storedPinHash = listData.pinHash;
    const providedPinHash = await hashPin(pin);

    return storedPinHash === providedPinHash;
};

export const deleteList = async (listId: string): Promise<void> => {
    const listDocRef = db.collection("lists").doc(listId);
    
    // Delete all items in the subcollection first
    const itemsCollectionRef = listDocRef.collection("items");
    const snapshot = await itemsCollectionRef.get();
    if (!snapshot.empty) {
        const batch = db.batch();
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
    }
    
    // Then delete the list document itself
    await listDocRef.delete();
};
