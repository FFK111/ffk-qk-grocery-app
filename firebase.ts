// FIX: Using namespace import for firebase/app to resolve module loading errors, as named exports were not found.
import * as FirebaseApp from "firebase/app";
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
    deleteDoc,
    collectionGroup,
} from "firebase/firestore";
import type { GroceryItem, UserProfile } from "./types";

const firebaseConfig = {
  apiKey: "AIzaSyD5XMfEYTKOEUMomtD4Wdqf88OjrCJtsBE",
  authDomain: "ffk-grocery-sync.firebaseapp.com",
  projectId: "ffk-grocery-sync",
  storageBucket: "ffk-grocery-sync.firebasestorage.app",
  messagingSenderId: "442396361973",
  appId: "1:442396361973:web:69ec493017e0373e5ff1bc"
};

// --- Lazy Initialization ---
const getDb = () => {
    if (FirebaseApp.getApps().length === 0) {
        FirebaseApp.initializeApp(firebaseConfig);
    }
    return getFirestore(FirebaseApp.getApp());
};

// --- Real-time Item Management ---

export const subscribeToItems = (
    listId: string, 
    onUpdate: (items: GroceryItem[]) => void, 
    onError: (error: Error) => void
) => {
  const db = getDb();
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
  const db = getDb();
  const itemDocRef = doc(db, "lists", listId, "items", item.id);
  await setDoc(itemDocRef, item);
};

export const togglePurchasedByName = async (listId: string, itemName: string, newStatus: boolean): Promise<void> => {
    const db = getDb();
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
    const db = getDb();
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
    const db = getDb();
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
    const db = getDb();
    const usersCollectionRef = collection(db, "lists", listId, "users");
    const querySnapshot = await getDocs(usersCollectionRef);
    return querySnapshot.docs
        .map(doc => doc.data())
        .filter(data => data && typeof data.name === 'string' && typeof data.pinHash === 'string') // Data validation
        .map(data => data as UserProfile);
};

export const createUserInList = async (listId: string, username: string, pinHash: string): Promise<UserProfile> => {
    const db = getDb();
    const usersCollectionRef = collection(db, "lists", listId, "users");

    const querySnapshot = await getDocs(usersCollectionRef);
    const isAdmin = querySnapshot.empty; // First user is admin

    const userDocRef = doc(db, "lists", listId, "users", username);
    const newUser: UserProfile = {
        name: username,
        pinHash,
        isAdmin,
    };
    await setDoc(userDocRef, newUser);
    return newUser;
};

export const deleteUserFromList = async (listId: string, username: string): Promise<void> => {
    const db = getDb();
    const userDocRef = doc(db, "lists", listId, "users", username);
    await deleteDoc(userDocRef);
};

// --- List Management ---

export const getAllListIds = async (): Promise<string[]> => {
    const db = getDb();
    const listsCollectionRef = collection(db, "lists");
    const querySnapshot = await getDocs(listsCollectionRef);
    return querySnapshot.docs.map(doc => doc.id);
};

export const deleteList = async (listId: string): Promise<void> => {
    const db = getDb();
    const listDocRef = doc(db, "lists", listId);
    
    // Firestore does not support deleting subcollections from the client SDK directly.
    // We must delete all documents within each subcollection first.
    const collectionsToDelete = ["items", "users"];
    
    for (const subcollection of collectionsToDelete) {
        const subcollectionRef = collection(db, "lists", listId, subcollection);
        const snapshot = await getDocs(subcollectionRef);
        if (!snapshot.empty) {
            const batch = writeBatch(db);
            snapshot.docs.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
        }
    }
    
    // After subcollections are empty, delete the main list document.
    await deleteDoc(listDocRef);
};