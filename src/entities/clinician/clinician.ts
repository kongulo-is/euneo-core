import {
  collection,
  CollectionReference,
  doc,
  DocumentReference,
} from "firebase/firestore";
import { db } from "../../firebase/db";

export type TClinicianRef = DocumentReference<TClinicianRead, TClinicianWrite>;

export type TClinicianCollectionRef = CollectionReference<
  TClinicianRead,
  TClinicianWrite
>;

export type TClinicianRead = {
  email: string;
  name: string;
  isAdmin?: boolean;
};

export type TClinician = TClinicianRead;
// TODO: vantar videopool?

export type TClinicianWrite = {
  email: string;
  name: string;
};

export function createClinicianRef(clinicianId: string): TClinicianRef {
  return doc(db, "clinicians", clinicianId) as TClinicianRef;
}

export function createClinicianCollectionRef(): TClinicianCollectionRef {
  return collection(db, "clinicians") as TClinicianCollectionRef;
}

// TODO: create a converter
