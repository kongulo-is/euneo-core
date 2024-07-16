import {
  DocumentReference,
  QueryDocumentSnapshot,
  SnapshotOptions,
  Timestamp,
} from "firebase/firestore";
import { Collection } from "../global";

export type TEuneoProgramVersionIdentifiers = {
  [Collection.Programs]: string;
  [Collection.Versions]: string;
};

export type TClinicianProgramVersionIdentifiers = {
  [Collection.Clinicians]: string;
  [Collection.Programs]: string;
  [Collection.Versions]: string;
};

type TProgramWrite = {
  currentVersionRef: DocumentReference<TProgramWrite>;
  isConsoleLive?: boolean;
  isLive?: boolean;
  isSaved?: boolean;
  isArchived?: boolean;
  createdAt?: Timestamp;
  lastUpdatedAt?: Timestamp;
};

export type TProgramBase = {
  currentVersionRef: DocumentReference<TProgramWrite>;
};

type TEuneoProgramBase = {
  currentVersionIdentifiers: TEuneoProgramVersionIdentifiers;
  isConsoleLive: boolean;
  isLive: boolean;
};

type TClinicianProgramBase = {
  currentVersionIdentifiers: TClinicianProgramVersionIdentifiers;
  createdAt: Date;
  lastUpdatedAt: Date;
  isSaved: boolean;
  isArchived: boolean;
};

type TProgramRead = TProgramBase & (TEuneoProgramBase | TClinicianProgramBase);

// Serialization function for TProgramIdentifiers
export function serializeProgramIdentifiers(
  obj: TEuneoProgramVersionIdentifiers | TClinicianProgramVersionIdentifiers,
): string {
  if ("clinicians" in obj) {
    return `${Collection.Clinicians}/${obj.clinicians}/${Collection.Programs}/${obj.programs}/${Collection.Versions}/${obj.versions}`;
  } else {
    return `${Collection.Programs}/${obj.programs}/${Collection.Versions}/${obj.versions}`;
  }
}

// Deserialization function for TProgramIdentifiers
export function deserializeProgramPath(
  path: string,
): TEuneoProgramVersionIdentifiers | TClinicianProgramVersionIdentifiers {
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

export const programConverter = {
  toFirestore(program: TProgramRead): TProgramWrite {
    let data: TProgramWrite = {
      currentVersionRef: program.currentVersionRef,
      isConsoleLive:
        "isConsoleLive" in program ? program.isConsoleLive : undefined,
      isLive: "isLive" in program ? program.isLive : undefined,
      isSaved: "isSaved" in program ? program.isSaved : undefined,
      isArchived: "isArchived" in program ? program.isArchived : undefined,
    };

    return data;
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot<TProgramWrite>,
    options: SnapshotOptions,
  ): TProgramRead {
    const programWrite = snapshot.data(options);
    const { createdAt, lastUpdatedAt, ...rest } = programWrite;
    const programPath = snapshot.ref.path;
    const programIdentifiers = deserializeProgramPath(programPath);

    if (
      (programIdentifiers as TClinicianProgramVersionIdentifiers)[
        Collection.Clinicians
      ]
    ) {
      // Clinician Program
      const clinicianProgram: TClinicianProgramBase = {
        ...rest,
        currentVersionIdentifiers:
          programIdentifiers as TClinicianProgramVersionIdentifiers,
        createdAt: createdAt ? createdAt.toDate() : new Date(),
        lastUpdatedAt: lastUpdatedAt ? lastUpdatedAt.toDate() : new Date(),
        isSaved: rest.isSaved ?? false,
        isArchived: rest.isArchived ?? false,
      };
      return {
        ...clinicianProgram,
        currentVersionRef: programWrite.currentVersionRef,
      };
    } else {
      // Euneo Program
      const euneoProgram: TEuneoProgramBase = {
        ...rest,
        currentVersionIdentifiers:
          programIdentifiers as TEuneoProgramVersionIdentifiers,
        isConsoleLive: rest.isConsoleLive ?? false,
        isLive: rest.isLive ?? false,
      };
      return {
        ...euneoProgram,
        currentVersionRef: programWrite.currentVersionRef,
      };
    }
  },
};

/**
 * @description This program type merges the base program type with the version information along with phases and days
 */
type TProgram = {
  programInfo: TEuneoProgramBase | TClinicianProgramBase;
  versionInfo: {};
  days: any;
  phases: any;
};
