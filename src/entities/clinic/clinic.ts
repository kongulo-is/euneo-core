import {
  doc,
  DocumentReference,
  QueryDocumentSnapshot,
  SnapshotOptions,
} from "firebase/firestore";
import { TClinicianRef } from "../clinician/clinician";
import { Collection } from "../global";
import { db } from "../../firebase/db";

export type TClinicRead = {
  branding: {
    logo: string;
    color: string;
  };
  name: string;
  website: string;
  cliniciansRef: TClinicianRef[];
};

export type TClinicWrite = {
  branding: {
    logo: string;
    color: string;
  };
  name: string;
  website: string;
  cliniciansRef: TClinicianRef[];
};

export type TClinicIdentifiers = {
  [Collection.Clinics]: string;
};

export type TClinicRef = DocumentReference<TClinicRead, TClinicWrite>;

export function serializeClinicIdentifiers(obj: TClinicIdentifiers) {
  return `${Collection.Clinics}/${obj.clinics}`;
}

export function deserializeClinicPath(path: string): TClinicIdentifiers {
  const segments = path.split("/");
  return {
    [Collection.Clinics]: segments[1],
  };
}

export function createClinicRef(clinicId: string): TClinicRef {
  return doc(db, Collection.Clinics, clinicId).withConverter(clinicConverter);
}

export const clinicConverter = {
  toFirestore(clinic: TClinicRead): TClinicWrite {
    return clinic;
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot<TClinicWrite>,
    options: SnapshotOptions
  ): TClinicRead {
    const clinicWrite = snapshot.data(options);

    return clinicWrite;
  },
};

export type TClinic = TClinicRead & {
  clinicRef: TClinicRef;
  clinicIdentifiers: TClinicIdentifiers;
};
