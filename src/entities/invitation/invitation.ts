import {
  collection,
  CollectionReference,
  doc,
  DocumentReference,
  QueryDocumentSnapshot,
  SnapshotOptions,
  Timestamp,
} from "firebase/firestore";
import {
  clinicianClientConverter,
  deserializeClinicianClientPath,
  TClinicianClientIdentifiers,
  TClinicianClientRef,
} from "../clinician/clinicianClient";
import { Collection } from "../global";
import { db } from "../../firebase/db";

export type TInvitationIdentifiers = {
  [Collection.Invitations]: string;
};

export type TInvitationRef = DocumentReference<
  TInvitationRead,
  TInvitationWrite
>;

export type TInvitationCollectionRef = CollectionReference<
  TInvitationRead,
  TInvitationWrite
>;

/**
 * @description clinician invite to client.
 * @path /invitations/{invitationId}
 */
export type TInvitationWrite = {
  code: string;
  clinicianClientRef: TClinicianClientRef;
  date: Timestamp;
  oneMonthFree?: boolean;
  clinicianName?: string;
};

export type TInvitationRead = {
  code: string;
  date: Date;
  clinicianClientRef: TClinicianClientRef;
  clinicianClientIdentifiers: TClinicianClientIdentifiers;
  oneMonthFree?: boolean;
  clinicianName?: string;
};

export type TInvitation = TInvitationRead & {
  invitationRef: TInvitationRef;
  invitationIdentifiers: TInvitationIdentifiers;
};

export function serializeInvitationIdentifiers(
  obj: TInvitationIdentifiers
): string {
  try {
    return `${Collection.Invitations}/${obj.invitations}`;
  } catch (error) {
    console.error("Error serializing invitation identifiers: ", error);
    throw error;
  }
}

export function deserializeInvitationPath(
  path: string
): TInvitationIdentifiers {
  try {
    const [_invitations, invitationId] = path.split("/");
    return {
      [Collection.Invitations]: invitationId,
    };
  } catch (error) {
    console.error("Error deserializing invitation path: ", error);
    throw error;
  }
}

export function createInvitationRef(
  invitations?: string
): DocumentReference<TInvitationRead, TInvitationWrite> {
  const path = `${Collection.Invitations}`;
  const invitationsCollection = collection(db, path);

  const invitationRef = invitations
    ? doc(invitationsCollection, invitations).withConverter(invitationConverter)
    : doc(invitationsCollection).withConverter(invitationConverter);

  return invitationRef;
}

export function createInvitationCollectionRef(): TInvitationCollectionRef {
  const path = `${Collection.Invitations}`;
  const invitationsCollection = collection(db, path).withConverter(
    invitationConverter
  );

  return invitationsCollection;
}

export const invitationConverter = {
  toFirestore(invitation: TInvitationRead): TInvitationWrite {
    return {
      code: invitation.code,
      clinicianClientRef: invitation.clinicianClientRef,
      date: Timestamp.fromDate(invitation.date),
      ...(invitation.oneMonthFree && { oneMonthFree: invitation.oneMonthFree }),
      ...(invitation.clinicianName && {
        clinicianName: invitation.clinicianName,
      }),
    };
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot<TInvitationWrite>,
    options: SnapshotOptions
  ): TInvitationRead {
    const data = snapshot.data(options);

    const invitation: TInvitationRead = {
      ...data,
      date: data.date.toDate(),
      clinicianClientRef: data.clinicianClientRef.withConverter(
        clinicianClientConverter
      ),
      clinicianClientIdentifiers: deserializeClinicianClientPath(
        data.clinicianClientRef.path
      ),
    };

    return invitation;
  },
};
