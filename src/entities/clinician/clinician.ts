import {
  collection,
  CollectionReference,
  doc,
  DocumentReference,
  QueryDocumentSnapshot,
  SnapshotOptions,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../firebase/db";
import { TClinic, TClinicRef } from "../clinic/clinic";

export type TSubscriptionGifts = {
  remaining: number;
  expires: Date;
};

export type TSubscriptionGiftsWrite = {
  remaining: number;
  expires: Timestamp;
};

export type TClinicianRef = DocumentReference<TClinicianRead, TClinicianWrite>;

export type TClinicianCollectionRef = CollectionReference<
  TClinicianRead,
  TClinicianWrite
>;

export type TClinicianRead = {
  email: string;
  name: string;
  /**
   * @description uid for admin: 4xs2zP7nEhYVTZWVGsS9GHW4yug2
   */
  isAdmin?: boolean;
  favouriteExercises?: string[];
  subscriptionGifts?: TSubscriptionGifts;
  clinicsRef?: TClinicRef[];
};

export type TClinicianWrite = {
  email: string;
  name: string;
  isAdmin?: boolean;
  favouriteExercises?: string[];
  subscriptionGifts?: TSubscriptionGiftsWrite;
  clinicsRef?: TClinicRef[];
};

export function createClinicianRef(clinicianId: string): TClinicianRef {
  return doc(db, "clinicians", clinicianId) as TClinicianRef;
}

export function createClinicianCollectionRef(): TClinicianCollectionRef {
  return collection(db, "clinicians") as TClinicianCollectionRef;
}

export function createSubscriptionGifts(): TSubscriptionGifts {
  const giftsExpireDate = new Date();
  giftsExpireDate.setDate(giftsExpireDate.getDate() + 29);
  giftsExpireDate.setHours(23, 59, 59, 59);

  return {
    remaining: 10,
    expires: giftsExpireDate,
  };
}

export function canGiftClients(
  subscriptionGifts: TSubscriptionGifts | undefined
): boolean {
  if (!subscriptionGifts) return false;

  const { remaining, expires } = subscriptionGifts;

  if (remaining === 0) return false;
  if (expires <= new Date()) return false;
  return true;
}

export const clinicianConverter = {
  toFirestore(clinician: TClinicianRead): TClinicianWrite {
    const clinicianWrite: TClinicianWrite = {
      email: clinician.email,
      name: clinician.name,
      ...(clinician.isAdmin && { isAdmin: clinician.isAdmin }),
      ...(clinician.favouriteExercises && {
        favouriteExercises: clinician.favouriteExercises,
      }),
      ...(clinician.subscriptionGifts && {
        subscriptionGifts: {
          remaining: clinician.subscriptionGifts.remaining,
          expires: Timestamp.fromDate(clinician.subscriptionGifts.expires),
        },
      }),
      ...(clinician.clinicsRef && {
        clinicsRef: clinician.clinicsRef,
      }),
    };

    return clinicianWrite;
  },

  fromFirestore(
    snapshot: QueryDocumentSnapshot<TClinicianWrite>,
    options: SnapshotOptions
  ): TClinicianRead {
    const clinicianWrite = snapshot.data(options);

    const clinicianClient: TClinicianRead = {
      email: clinicianWrite.email,
      name: clinicianWrite.name,
      ...(clinicianWrite.isAdmin && { isAdmin: clinicianWrite.isAdmin }),
      ...(clinicianWrite.favouriteExercises && {
        favouriteExercises: clinicianWrite.favouriteExercises,
      }),
      ...(clinicianWrite.subscriptionGifts && {
        subscriptionGifts: {
          remaining: clinicianWrite.subscriptionGifts.remaining,
          expires: clinicianWrite.subscriptionGifts.expires.toDate(),
        },
      }),
      ...(clinicianWrite.clinicsRef && {
        clinicsRef: clinicianWrite.clinicsRef,
      }),
    };

    return clinicianClient;
  },
};

export type TClinician = TClinicianRead & {
  clinics?: TClinic[];
};
