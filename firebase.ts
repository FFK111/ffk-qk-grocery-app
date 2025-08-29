// FIX: Changed to a namespace import to resolve potential module resolution errors with Firebase.
import * as firebase from "firebase/app";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  writeBatch,
  onSnapshot,
  query,
  where,
  Firestore,
  deleteDoc,
} from "firebase/firestore";
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
// FIX: Use the FirebaseApp type from the imported firebase namespace.
let app: firebase.FirebaseApp;
let db: Firestore;

const initializeDb = () => {
    if (!app) {
        // FIX: Call initializeApp from the imported firebase namespace.
        app = firebase.initializeApp(firebaseConfig);
        db = getFirestore(app);
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
  const itemsCollectionRef = collection(db, "lists", listId, "items");
  const unsubscribe = onSnapshot(itemsCollectionRef, (querySnapshot) => {
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
  const itemDocRef = doc(db, "lists", listId, "items", item.id);
  await setDoc(itemDocRef, item);
};

export const addMultipleItemsToFirestore = async (items: NewGroceryItem[], listId: string): Promise<void> => {
    const db = initializeDb();
    const batch = writeBatch(db);

    items.forEach(item => {
        const id = `${Date.now().toString(36)}-${Math.random().toString(36).substring(2)}`;
        const newItemWithId: GroceryItem = {
            ...item,
            id,
            dateAdded: new Date().toISOString(),
            purchased: false,
        };
        const itemDocRef = doc(db, "lists", listId, "items", id);
        batch.set(itemDocRef, newItemWithId);
    });

    await batch.commit();
};

export const togglePurchasedByName = async (listId: string, itemName: string, newStatus: boolean): Promise<void> => {
    const db = initializeDb();
    const itemsCollectionRef = collection(db, "lists", listId, "items");
    const q = query(itemsCollectionRef, where("name", "==", itemName));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) return;
    
    const batch = writeBatch(db);
    querySnapshot.forEach(document => {
        batch.update(document.ref, { purchased: newStatus });
    });
    await batch.commit();
};

export const deleteItemsByName = async (listId: string, itemName: string): Promise<void> => {
    const db = initializeDb();
    const itemsCollectionRef = collection(db, "lists", listId, "items");
    const q = query(itemsCollectionRef, where("name", "==", itemName));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) return;

    const batch = writeBatch(db);
    querySnapshot.forEach(document => {
        batch.delete(document.ref);
    });
    await batch.commit();
}

export const deletePurchasedItems = async (listId: string): Promise<void> => {
    const db = initializeDb();
    const itemsCollectionRef = collection(db, "lists", listId, "items");
    const q = query(itemsCollectionRef, where("purchased", "==", true));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) return;

    const batch = writeBatch(db);
    querySnapshot.forEach(document => {
        batch.delete(document.ref);
    });
    await batch.commit();
};

// --- User Management ---

export const getUsersForList = async (listId: string): Promise<UserProfile[]> => {
    const db = initializeDb();
    const usersCollectionRef = collection(db, "lists", listId, "users");
    const querySnapshot = await getDocs(usersCollectionRef);
    return querySnapshot.docs
        .map(doc => doc.data())
        .filter(data => data && typeof data.name === 'string' && typeof data.pinHash === 'string') // Data validation
        .map(data => data as UserProfile);
};

export const createUserInList = async (listId: string, username: string, pinHash: string): Promise<void> => {
    const db = initializeDb();
    const usersCollectionRef = collection(db, "lists", listId, "users");

    // The first user added to a list will automatically become an admin.
    const querySnapshot = await getDocs(usersCollectionRef);
    const isAdmin = querySnapshot.empty;

    const userDocRef = doc(db, "lists", listId, "users", username);
    const newUser: UserProfile = {
        name: username,
        pinHash,
        isAdmin,
    };
    await setDoc(userDocRef, newUser);
};

export const deleteUserFromList = async (listId: string, username: string): Promise<void> => {
    const db = initializeDb();
    const userDocRef = doc(db, "lists", listId, "users", username);
    await deleteDoc(userDocRef);
};
