import { DocumentReference, Timestamp, doc } from "firebase/firestore";

import {
  TClientProgramIdentifiers,
  TClientProgramRead,
  TClientProgramWrite,
  clientProgramConverter,
  deserializeClientProgramPath,
} from "../client/clientProgram";

import { db } from "../../firebase/db";
import {
  TClinicianProgramVersionIdentifiers,
  TEuneoProgramVersionIdentifiers,
  TProgramVersionRead,
  TProgramVersionWrite,
  deserializeProgramVersionPath,
  programVersionConverter,
  serializeProgramVersionIdentifiers,
} from "../program/version";
import {
  normalizeDateToUTC,
  toUTCStartOfDay,
} from "../../utilities/basicHelpers";

type TPrescriptionStatus = "Invited" | "Accepted" | "Started";

export type TPrescriptionWrite = {
  programVersionRef?: DocumentReference<
    TProgramVersionRead,
    TProgramVersionWrite
  >;
  status: TPrescriptionStatus;
  prescriptionDate: Timestamp;
  lastActive?: Timestamp;
  clientProgramRef?: DocumentReference<TClientProgramRead, TClientProgramWrite>;
  /**
   * @deprecated Use programVersionRef instead
   */
  programRef?: DocumentReference<TProgramVersionRead, TProgramVersionWrite>;
};

export type TPrescriptionBase = {
  status: TPrescriptionStatus;
  prescriptionDate: Date;
  lastActive?: Date;
  programVersionRef: DocumentReference<
    TProgramVersionRead,
    TProgramVersionWrite
  >;
  programVersionIdentifiers:
    | TEuneoProgramVersionIdentifiers
    | TClinicianProgramVersionIdentifiers;
};

export type TPrescriptionRead =
  | TPrescriptionBase
  | (TPrescriptionBase & {
      clientProgramRef: DocumentReference<
        TClientProgramRead,
        TClientProgramWrite
      >;
      clientProgramIdentifiers: TClientProgramIdentifiers;
    });

export type TPrescription = TPrescriptionRead;

export const prescriptionConverter = {
  toFirestore(prescription: TPrescriptionRead): TPrescriptionWrite {
    const programVersionRef: DocumentReference<
      TProgramVersionRead,
      TProgramVersionWrite
    > = doc(
      db,
      serializeProgramVersionIdentifiers(prescription.programVersionIdentifiers)
    ).withConverter(programVersionConverter);

    const prescriptionWrite: TPrescriptionWrite = {
      programVersionRef,
      prescriptionDate: Timestamp.fromDate(prescription.prescriptionDate),
      status: prescription.status,
      ...("clientProgramRef" in prescription && {
        clientProgramRef: prescription.clientProgramRef,
      }),
      ...(prescription.lastActive && {
        lastActive: Timestamp.fromDate(
          toUTCStartOfDay(prescription.lastActive)
        ),
      }),
    };

    return prescriptionWrite;
  },

  fromFirestore(prescriptionWrite: TPrescriptionWrite): TPrescriptionRead {
    const { programRef, lastActive, ...rest } = prescriptionWrite;

    const programVersionRef = (
      prescriptionWrite.programVersionRef || programRef
    )?.withConverter(programVersionConverter);

    if (!programVersionRef) {
      throw new Error("Program version ref not found");
    }

    const clientProgramRef = prescriptionWrite.clientProgramRef?.withConverter(
      clientProgramConverter
    );

    let clientProgramIdentifiers: TClientProgramIdentifiers | undefined;
    if (clientProgramRef) {
      const clientProgramPath = clientProgramRef.path;
      clientProgramIdentifiers =
        deserializeClientProgramPath(clientProgramPath);
    }

    const programVersionPath = programVersionRef.path;
    const programVersionIdentifiers =
      deserializeProgramVersionPath(programVersionPath);

    const prescription: TPrescriptionRead = {
      ...rest,
      prescriptionDate: rest.prescriptionDate.toDate(),
      programVersionRef: programVersionRef,
      programVersionIdentifiers: programVersionIdentifiers,
      ...(clientProgramIdentifiers && {
        clientProgramIdentifiers,
        clientProgramRef,
      }),
      ...(lastActive && {
        lastActive: normalizeDateToUTC(lastActive.toDate()),
      }),
    };

    return prescription;
  },
};
