import { db } from "../../firebase/db";
import { TClientProgram } from "../client/clientProgram";
import { Collection, TConditionId } from "../global";
import {
  prescriptionConverter,
  TPrescription,
  TPrescriptionWrite,
} from "./prescription";
import {
  collection,
  doc,
  DocumentReference,
  QueryDocumentSnapshot,
  SnapshotOptions,
  Timestamp,
} from "firebase/firestore";

export type TClinicianClientIdentifiers = {
  [Collection.Clinicians]: string;
  [Collection.Clients]: string;
};

export type TClinicianClientRef = DocumentReference<
  TClinicianClientRead,
  TClinicianClientWrite
>;

export type TClientStatus =
  | "Active"
  | "Invited"
  | "Inactive"
  | "No prescription";

export type TClinicianClientBase = {
  name: string;
  email: string;
  date: Date;
  conditionId: TConditionId | null; // TODO: this no longer exists right?
  prescription?: TPrescription;
};

export type TClinicianClientRead = TClinicianClientBase;

export type TClinicianClientWrite = {
  name: string;
  email: string;
  date: Timestamp;
  conditionId: TConditionId | null;
  prescription?: TPrescriptionWrite;
};

export type TClinicianClient = TClinicianClientBase & {
  clinicianClientRef: TClinicianClientRef;
  clinicianClientIdentifiers: TClinicianClientIdentifiers;
  status?: TClientStatus;
  clientProgram?: TClientProgram;
};

// Serialization Functions
export function serializeClinicianClientIdentifiers(
  obj: TClinicianClientIdentifiers,
): string {
  try {
    return `${Collection.Clinicians}/${obj.clinicians}/${Collection.Clients}/${obj.clients}`;
  } catch (error) {
    console.error("Error serializing clinician client identifiers: ", error);
    throw error;
  }
}

// Deserialization Functions
export function deserializeClinicianClientPath(
  path: string,
): TClinicianClientIdentifiers {
  try {
    const [_clinicians, clinicianId, _clients, clientId] = path.split("/");
    return {
      [Collection.Clinicians]: clinicianId,
      [Collection.Clients]: clientId,
    };
  } catch (error) {
    console.error("Error deserializing clinician client path: ", error);
    throw error;
  }
}

/**
 * @description Creates a reference to the client document for a given clinician and client id and
 * created a client id if it doesn't exist
 * @param clinicianId The id of the clinician
 * @param clientId The id of the client
 * @returns a reference to the client document
 */
export function createClinicianClientRef({
  clinicians,
  clients,
}: {
  clinicians: string;
  clients?: string;
}): TClinicianClientRef {
  const path = `${Collection.Clinicians}/${clinicians}/${Collection.Clients}`;
  const clientsCollection = collection(db, path);

  const clientRef = clients
    ? doc(clientsCollection, clients).withConverter(clinicianClientConverter)
    : doc(clientsCollection).withConverter(clinicianClientConverter);

  return clientRef;
}

export const clinicianClientConverter = {
  toFirestore(clinicianClient: TClinicianClientRead): TClinicianClientWrite {
    console.log("IS THIS CALLED");

    let prescription: TPrescriptionWrite | undefined;
    if (clinicianClient.prescription) {
      prescription = prescriptionConverter.toFirestore(
        clinicianClient.prescription,
      );
    }

    const clinicianClientWrite: TClinicianClientWrite = {
      name: clinicianClient.name,
      email: clinicianClient.email,
      conditionId: clinicianClient.conditionId,
      date: Timestamp.fromDate(clinicianClient.date),
      ...(prescription && {
        prescription: prescription,
      }),
    };

    return clinicianClientWrite;
  },

  fromFirestore(
    snapshot: QueryDocumentSnapshot<TClinicianClientWrite>,
    options: SnapshotOptions,
  ): TClinicianClientRead {
    const clinicianClientWrite = snapshot.data(options);

    let prescription: TPrescription | undefined;

    if (clinicianClientWrite.prescription) {
      prescription = prescriptionConverter.fromFirestore(
        clinicianClientWrite.prescription,
      );
    }

    const clinicianClient: TClinicianClientRead = {
      name: clinicianClientWrite.name,
      email: clinicianClientWrite.email,
      conditionId: clinicianClientWrite.conditionId,
      date: clinicianClientWrite.date.toDate(),
      ...(prescription && {
        prescription,
      }),
    };

    return clinicianClient;
  },
};
