// FIX: Rewritten to use the modern v9+ modular API, which is required by Firebase v12 and fixes the "blank screen" startup crash.
// FIX: Switched to named imports for `firebase/app` for compatibility with ES module standards. The namespace import was causing resolution errors.
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { 
    getFirestore, 
    collection, 
    doc, 
    onSnapshot,
    setDoc,
    query,
    where,
    getDocs,
    writeBatch,
    getDoc,
    deleteDoc,
    type Firestore
} from 'firebase/firestore';

import type { GroceryItem, GroceryListInfo } from "./types";

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
// FIX: Updated to use direct function calls from named imports.
const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db: Firestore = getFirestore(app);


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
  // FIX: Use Firebase v9+ modular API.
  const itemsCollectionRef = collection(db, "lists", listId, "items");
  const unsubscribe = onSnapshot(itemsCollectionRef, (querySnapshot) => {
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
  // FIX: Use Firebase v9+ modular API.
  const itemDocRef = doc(db, "lists", listId, "items", item.id);
  await setDoc(itemDocRef, item);
};

export const togglePurchasedByName = async (listId: string, itemName: string, newStatus: boolean): Promise<void> => {
    // FIX: Use Firebase v9+ modular API.
    const itemsCollectionRef = collection(db, "lists", listId, "items");
    const q = query(itemsCollectionRef, where("name", "==", itemName));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) return;
    
    // FIX: Use Firebase v9+ modular API.
    const batch = writeBatch(db);
    querySnapshot.forEach(document => {
        batch.update(document.ref, { purchased: newStatus });
    });
    await batch.commit();
};

export const deleteItemsByName = async (listId: string, itemName: string): Promise<void> => {
    // FIX: Use Firebase v9+ modular API.
    const itemsCollectionRef = collection(db, "lists", listId, "items");
    const q = query(itemsCollectionRef, where("name", "==", itemName));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) return;

    // FIX: Use Firebase v9+ modular API.
    const batch = writeBatch(db);
    querySnapshot.forEach(document => {
        batch.delete(document.ref);
    });
    await batch.commit();
}

export const deletePurchasedItems = async (listId: string): Promise<void> => {
    // FIX: Use Firebase v9+ modular API.
    const itemsCollectionRef = collection(db, "lists", listId, "items");
    const q = query(itemsCollectionRef, where("purchased", "==", true));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) return;

    // FIX: Use Firebase v9+ modular API.
    const batch = writeBatch(db);
    querySnapshot.forEach(document => {
        batch.delete(document.ref);
    });
    await batch.commit();
};

// --- List Management ---
export const getPublicLists = async (): Promise<GroceryListInfo[]> => {
    // FIX: Use Firebase v9+ modular API.
    const listsCollectionRef = collection(db, "lists");
    const querySnapshot = await getDocs(listsCollectionRef);
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

    // FIX: Use Firebase v9+ modular API.
    const listDocRef = doc(db, "lists", listId);
    const docSnap = await getDoc(listDocRef);
    if (docSnap.exists()) { // FIX: Use exists() method
        throw new Error("This list name is already taken. Please choose another.");
    }

    const pinHash = await hashPin(pin);
    // FIX: Use Firebase v9+ modular API.
    await setDoc(listDocRef, {
        name: listName.trim(),
        pinHash,
        date,
        createdAt: new Date().toISOString(),
    });

    return listId;
};

export const verifyListPin = async (listId: string, pin: string): Promise<boolean> => {
    // FIX: Use Firebase v9+ modular API.
    const listDocRef = doc(db, "lists", listId);
    const docSnap = await getDoc(listDocRef);

    if (!docSnap.exists()) { // FIX: Use exists() method
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
    // FIX: Use Firebase v9+ modular API.
    const listDocRef = doc(db, "lists", listId);
    
    // Delete all items in the subcollection first
    const itemsCollectionRef = collection(listDocRef, "items");
    const snapshot = await getDocs(itemsCollectionRef);
    if (!snapshot.empty) {
        // FIX: Use Firebase v9+ modular API.
        const batch = writeBatch(db);
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
    }
    
    // Then delete the list document itself
    // FIX: Use Firebase v9+ modular API.
    await deleteDoc(listDocRef);
};