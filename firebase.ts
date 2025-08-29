// FIX: The Firebase v9 modular API was causing import errors. Refactored to use the v8 namespaced API for broader compatibility.
import firebase from "firebase/app";
import "firebase/firestore";
import type { GroceryItem, UserProfile, NewGroceryItem } from "./types";

const firebaseConfig = {
  apiKey: "AIzaSyD5XMfEYTKOEUMomtD4Wdqf88OjrCJtsBE",
  authDomain: "ffk-grocery-sync.firebaseapp.com",
  projectId: "ffk-grocery-sync",
  storageBucket: "ffk-grocery-sync.firebasestorage.app",
  messagingSenderId: "442396361973",
  appId: "1:442396361973:web:69ec493017e0373e5ff1bc"
};

// --- Lazy Initializaion ---
// This prevents the app from crashing on startup if the config is invalid.
let db: firebase.firestore.Firestore;

const initializeDb = () => {
    if (!db) {
        if (firebase.apps.length === 0) {
            firebase.initializeApp(firebaseConfig);
        }
        db = firebase.firestore();
    }
    return db;
}

// --- Real-time Item Management ---

export const subscribeToItems = (
    listId: string, 
    onUpdate: (items: GroceryItem[]) => void, 
    onError: (error: Error) => void
) => {
  const db = initializeDb();
  const itemsCollectionRef = db.collection("lists").doc(listId).collection("items");
  const unsubscribe = itemsCollectionRef.onSnapshot((querySnapshot) => {
    const items = querySnapshot.docs
        .map(doc => doc.data())
        .filter(data => data && typeof data.id === 'string' && typeof data.name === 'string') // Data validation
        .map(data => data as GroceryItem);
    onUpdate(items);
  }, (error) => {
    console.error("Error subscribing to items:", error);
    onError(error);
  });
  return unsubscribe;
};

export const addItemToFirestore = async (item: GroceryItem, listId: string): Promise<void> => {
  const db = initializeDb();
  const itemDocRef = db.collection("lists").doc(listId).collection("items").doc(item.id);
  await itemDocRef.set(item);
};

export const addMultipleItemsToFirestore = async (items: NewGroceryItem[], listId: string): Promise<void> => {
    const db = initializeDb();
    const batch = db.batch();

    items.forEach(item => {
        const id = `${Date.now().toString(36)}-${Math.random().toString(36).substring(2)}`;
        const newItemWithId: GroceryItem = {
            ...item,
            id,
            dateAdded: new Date().toISOString(),
            purchased: false,
        };
        const itemDocRef = db.collection("lists").doc(listId).collection("items").doc(id);
        batch.set(itemDocRef, newItemWithId);
    });

    await batch.commit();
};

export const togglePurchasedByName = async (listId: string, itemName: string, newStatus: boolean): Promise<void> => {
    const db = initializeDb();
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
    const db = initializeDb();
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
    const db = initializeDb();
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

// --- User Management ---

export const getUsersForList = async (listId: string): Promise<UserProfile[]> => {
    const db = initializeDb();
    const usersCollectionRef = db.collection("lists").doc(listId).collection("users");
    const querySnapshot = await usersCollectionRef.get();
    return querySnapshot.docs
        .map(doc => doc.data())
        .filter(data => data && typeof data.name === 'string' && typeof data.pinHash === 'string') // Data validation
        .map(data => data as UserProfile);
};

export const createUserInList = async (listId: string, username: string, pinHash: string): Promise<void> => {
    const db = initializeDb();
    const usersCollectionRef = db.collection("lists").doc(listId).collection("users");

    // The first user added to a list will automatically become an admin.
    const querySnapshot = await usersCollectionRef.get();
    const isAdmin = querySnapshot.empty;

    const userDocRef = db.collection("lists").doc(listId).collection("users").doc(username);
    const newUser: UserProfile = {
        name: username,
        pinHash,
        isAdmin,
    };
    await userDocRef.set(newUser);
};

export const deleteUserFromList = async (listId: string, username: string): Promise<void> => {
    const db = initializeDb();
    const userDocRef = db.collection("lists").doc(listId).collection("users").doc(username);
    await userDocRef.delete();
};
