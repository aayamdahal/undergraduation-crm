declare module "firebase/app" {
  export type FirebaseApp = {
    readonly name?: string;
  };

  export type FirebaseOptions = Record<string, unknown>;

  export function initializeApp(options: FirebaseOptions): FirebaseApp;
  export function getApps(): FirebaseApp[];
  export function getApp(): FirebaseApp;
}

declare module "firebase/firestore" {
  import type { FirebaseApp } from "firebase/app";

  export type DocumentData = Record<string, unknown>;

  export type Firestore = {
    readonly app?: FirebaseApp;
  };

  export type DocumentReference<T = DocumentData> = {
    readonly id?: string;
    readonly __type?: T;
  };

  export type CollectionReference<T = DocumentData> = {
    readonly id?: string;
    readonly __type?: T;
  };

  export type QueryDocumentSnapshot<T = DocumentData> = {
    id: string;
    data(): T;
    ref: DocumentReference<T>;
  };

  export type QuerySnapshot<T = DocumentData> = {
    docs: QueryDocumentSnapshot<T>[];
  };

  export type Unsubscribe = () => void;

  export class Timestamp {
    toDate(): Date;
  }

  export function getFirestore(app?: FirebaseApp): Firestore;
  export function collection<T = DocumentData>(
    reference: Firestore | DocumentReference,
    path: string
  ): CollectionReference<T>;
  export function doc<T = DocumentData>(
    reference: Firestore | CollectionReference,
    path: string
  ): DocumentReference<T>;
  export function getDocs<T = DocumentData>(
    reference: CollectionReference<T>
  ): Promise<QuerySnapshot<T>>;
  export function onSnapshot<T = DocumentData>(
    reference: CollectionReference<T>,
    onNext: (snapshot: QuerySnapshot<T>) => void,
    onError?: (error: Error) => void
  ): Unsubscribe;
  export function addDoc<T = DocumentData>(
    reference: CollectionReference<T>,
    data: T
  ): Promise<{ id: string }>;
  export function updateDoc<T = DocumentData>(
    reference: DocumentReference<T>,
    data: Partial<T>
  ): Promise<void>;
  export function deleteDoc(reference: DocumentReference): Promise<void>;
}
