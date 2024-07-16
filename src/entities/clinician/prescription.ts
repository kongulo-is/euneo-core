import { DocumentReference, Timestamp, doc } from "firebase/firestore";

import { Collection } from "../global";

import {
  TClientProgramIdentifiers,
  TClientProgramWrite,
  deserializeClientProgramPath,
} from "../clientProgram/clientProgram";
import {
  TClinicianProgramIdentifiers,
  TEuneoProgramIdentifiers,
  TProgramWrite,
  deserializeProgramPath,
  serializeProgramIdentifiers,
} from "../program/program";
import { db } from "../../firebase/db";

type TPrescriptionStatus = "Invited" | "Accepted" | "Started";

export type TPrescriptionWrite = {
  programRef: DocumentReference<TProgramWrite>;
  prescriptionDate: Timestamp;
  status: TPrescriptionStatus;
  clientProgramRef?: DocumentReference<TClientProgramWrite>;
};

export type TPrescription = {
  prescriptionDate: Date;
  status: TPrescriptionStatus;
  programRef: DocumentReference<TProgramWrite>;
  programIdentifiers: TEuneoProgramIdentifiers | TClinicianProgramIdentifiers;
  clientProgramRef?: DocumentReference<TClientProgramWrite>;
  clientProgramIdentifiers?: TClientProgramIdentifiers;
};

export const prescriptionConverter = {
  toFirestore(prescription: TPrescription): TPrescriptionWrite {
    let clientProgramRef: DocumentReference<TClientProgramWrite> | undefined;

    if (prescription.clientProgramIdentifiers) {
      clientProgramRef = doc(
        db,
        `${Collection.Clients}/${prescription.clientProgramIdentifiers.clients}/${Collection.Programs}/${prescription.clientProgramIdentifiers.programs}`,
      ) as DocumentReference<TClientProgramWrite>;
    }

    return {
      programRef: doc(
        db,
        serializeProgramIdentifiers(prescription.programIdentifiers),
      ) as DocumentReference<TProgramWrite>,
      prescriptionDate: Timestamp.fromDate(prescription.prescriptionDate),
      status: prescription.status,
      ...(clientProgramRef && { clientProgramRef }),
    };
  },

  fromFirestore(prescriptionWrite: TPrescriptionWrite): TPrescription {
    const { programRef, clientProgramRef, ...rest } = prescriptionWrite;

    let clientProgramIdentifiers: TClientProgramIdentifiers | undefined;
    if (clientProgramRef) {
      const clientProgramPath = clientProgramRef.path;
      clientProgramIdentifiers =
        deserializeClientProgramPath(clientProgramPath);
    }

    const programPath = programRef.path;
    const programIdentifiers = deserializeProgramPath(programPath);

    const prescription: TPrescription = {
      ...rest,
      prescriptionDate: rest.prescriptionDate.toDate(),
      programRef: programRef,
      programIdentifiers: programIdentifiers,
      ...(clientProgramIdentifiers && { clientProgramIdentifiers }),
    };

    return prescription;
  },
};
