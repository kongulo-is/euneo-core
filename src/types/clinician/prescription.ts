import { DocumentReference, Timestamp, doc } from "firebase/firestore";
import { TClientProgramWrite } from "../clientTypes";
import { TProgramWrite } from "../programTypes";
import { db } from "../../firebase/db";

type TPrescriptionStatus = "Invited" | "Accepted" | "Started";

enum Collection {
  Clients = "clients",
  Programs = "programs",
  Clinicians = "clinicians",
  Versions = "versions",
}

type TClientProgramObject = {
  [Collection.Clients]: string;
  [Collection.Programs]: string;
};

type TEuneoProgram = {
  [Collection.Programs]: string;
  [Collection.Versions]: string;
};

type TClinicianProgram = {
  [Collection.Clinicians]: string;
  [Collection.Programs]: string;
  [Collection.Versions]: string;
};

/**
 * @description Type for the prescription document in the database
 * @path /clinicians/{clinicianId}/clients/{clinicianClientId}/prescriptions/{prescriptionId}
 */
type TPrescriptionWrite = {
  programRef: DocumentReference<TProgramWrite>;
  prescriptionDate: Timestamp;
  status: TPrescriptionStatus;
  clientProgramRef?: DocumentReference<TClientProgramWrite>;
};

type TPrescription = {
  prescriptionDate: Date;
  status: TPrescriptionStatus;
  programRef: DocumentReference<TProgramWrite>;
  programObject: TEuneoProgram | TClinicianProgram; // TODO: new name for programObject
  clientProgramRef?: DocumentReference<TClientProgramWrite>;
  clientProgramObject?: TClientProgramObject;
};

// Helper functions for serialization/deserialization
function serializeClientProgramObject(obj: TClientProgramObject): string {
  return `${Collection.Clients}/${obj.clients}/${Collection.Programs}/${obj.programs}`;
}

function deserializeClientProgramPath(path: string): TClientProgramObject {
  const [_clients, clientId, _programs, programId] = path.split("/");
  return {
    [Collection.Clients]: clientId,
    [Collection.Programs]: programId,
  };
}

// Serialization function for TProgramObject
function serializeProgramObject(
  obj: TEuneoProgram | TClinicianProgram,
): string {
  if ("clinicians" in obj) {
    return `${Collection.Clinicians}/${obj.clinicians}/${Collection.Programs}/${obj.programs}/${Collection.Versions}/${obj.versions}`;
  } else {
    return `${Collection.Programs}/${obj.programs}/${Collection.Versions}/${obj.versions}`;
  }
}

// Deserialization function for TProgramObject
function deserializeProgramPath(
  path: string,
): TEuneoProgram | TClinicianProgram {
  const segments = path.split("/");

  if (segments.includes(Collection.Clinicians)) {
    // Clinician Program
    const cliniciansIndex = segments.indexOf(Collection.Clinicians);
    const clinicianId = segments[cliniciansIndex + 1];
    const programsIndex = segments.indexOf(
      Collection.Programs,
      cliniciansIndex,
    );
    const programId = segments[programsIndex + 1];
    const versionsIndex = segments.indexOf(Collection.Versions, programsIndex);
    const versionId = segments[versionsIndex + 1];

    return {
      [Collection.Clinicians]: clinicianId,
      [Collection.Programs]: programId,
      [Collection.Versions]: versionId,
    };
  } else if (segments.includes(Collection.Programs)) {
    // Euneo Program
    const programsIndex = segments.indexOf(Collection.Programs);
    const programId = segments[programsIndex + 1];
    const versionsIndex = segments.indexOf(Collection.Versions, programsIndex);
    const versionId = segments[versionsIndex + 1];

    return {
      [Collection.Programs]: programId,
      [Collection.Versions]: versionId,
    };
  } else {
    throw new Error("Invalid path format");
  }
}

export const prescriptionConverter = {
  toFirestore(prescription: TPrescription): TPrescriptionWrite {
    let clientProgramRef: DocumentReference<TClientProgramWrite> | undefined;

    if (prescription.clientProgramObject) {
      clientProgramRef = doc(
        db,
        `${Collection.Clients}/${prescription.clientProgramObject.clients}/${Collection.Programs}/${prescription.clientProgramObject.programs}`,
      ) as DocumentReference<TClientProgramWrite>;
    }

    return {
      programRef: doc(
        db,
        serializeProgramObject(prescription.programObject),
      ) as DocumentReference<TProgramWrite>,
      prescriptionDate: Timestamp.fromDate(prescription.prescriptionDate),
      status: prescription.status,
      ...(clientProgramRef && { clientProgramRef }),
    };
  },

  fromFirestore(prescriptionWrite: TPrescriptionWrite): TPrescription {
    const { programRef, clientProgramRef, ...rest } = prescriptionWrite;

    let clientProgramObject: TClientProgramObject | undefined;
    if (clientProgramRef && clientProgramRef.parent.parent) {
      clientProgramObject = {
        clients: clientProgramRef.parent.parent.id,
        programs: clientProgramRef.id,
      };
    }

    const programPath = programRef.path;
    const programObject = deserializeProgramPath(programPath);

    const prescription: TPrescription = {
      ...rest,
      prescriptionDate: rest.prescriptionDate.toDate(),
      programRef: programRef,
      programObject: programObject,
      ...(clientProgramObject && { clientProgramObject }),
    };

    return prescription;
  },
};
