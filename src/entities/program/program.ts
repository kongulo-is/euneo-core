import {
  collection,
  doc,
  DocumentReference,
  QueryDocumentSnapshot,
  SnapshotOptions,
  Timestamp,
} from "firebase/firestore";
import {
  TClinicianProgramVersionIdentifiers,
  TClinicProgramVersionIdentifiers,
  TEuneoProgramVersionIdentifiers,
  TProgramVersion,
  TProgramVersionRead,
  TProgramVersionRef,
  TProgramVersionWrite,
} from "./version";
import { TProgramDay, TProgramDayKey } from "./programDay";
import { TProgramPhase, TProgramPhaseKey } from "./programPhase";
import { db } from "../../firebase/db";
import { Collection } from "../global";
import { updateDoc } from "../../utilities/updateDoc";

export type TProgramRef = DocumentReference<TProgramRead, TProgramWrite>;

export type TEuneoProgramIdentifiers = {
  [Collection.Programs]: string;
};

export type TClinicianProgramIdentifiers = {
  [Collection.Clinicians]: string;
  [Collection.Programs]: string;
};

export type TClinicProgramIdentifiers = {
  [Collection.Clinics]: string;
  [Collection.Programs]: string;
};

export type TProgramIdentifiers =
  | TEuneoProgramIdentifiers
  | TClinicianProgramIdentifiers;

export type TProgramWrite = {
  currentVersionRef: DocumentReference<
    TProgramVersionRead,
    TProgramVersionWrite
  >;

  isConsoleLive?: boolean;
  isLive?: boolean;
  isSaved?: boolean;
  isArchived?: boolean;
  createdAt?: Timestamp;
  lastUpdatedAt?: Timestamp;
};

type TProgramBase = {
  currentVersionRef: DocumentReference<
    TProgramVersionRead,
    TProgramVersionWrite
  >;
  programRef: TProgramRef;
};

export type TEuneoProgramRead = TProgramBase & {
  isConsoleLive: boolean;
  isLive: boolean;
};

export type TClinicianProgramRead = TProgramBase & {
  createdAt: Date;
  lastUpdatedAt: Date;
  isSaved: boolean;
  isArchived: boolean;
};

export type TClinicProgramRead = TProgramBase & {
  // TODO: Make this mandatory?
};

export type TProgramRead = TEuneoProgramRead | TClinicianProgramRead;

export function isClinicianProgramInfo(
  program: TProgramInfo
): program is TClinicianProgramInfo {
  return (program as TClinicianProgramInfo).createdAt !== undefined;
}

export function isEuneoProgramInfo(
  program: TProgramInfo
): program is TEuneoProgramInfo {
  return (program as TEuneoProgramInfo).isConsoleLive !== undefined;
}

// TODO: fix this
export function isClinicProgramInfo(
  program: TProgramInfo
): program is TClinicProgramInfo {
  return (program as TClinicProgramInfo).programRef.path !== undefined;
}

export function isClinicianProgramIdentifiers(
  identifiers: TProgramIdentifiers
): identifiers is TClinicianProgramIdentifiers {
  return (
    (identifiers as TClinicianProgramIdentifiers)[Collection.Clinicians] !==
    undefined
  );
}

export function serializeProgramIdentifiers(obj: TProgramIdentifiers): string {
  if ("clinicians" in obj) {
    return `${Collection.Clinicians}/${obj.clinicians}/${Collection.Programs}/${obj.programs}`;
  } else {
    return `${Collection.Programs}/${obj.programs}`;
  }
}

export function deserializeProgramPath(path: string): TProgramIdentifiers {
  const segments = path.split("/");

  if (
    segments.includes(Collection.Clinicians) &&
    segments.includes(Collection.Programs)
  ) {
    // Clinician Program
    const cliniciansIndex = segments.indexOf(Collection.Clinicians);
    const clinicianId = segments[cliniciansIndex + 1];
    const programsIndex = segments.indexOf(
      Collection.Programs,
      cliniciansIndex
    );
    const programId = segments[programsIndex + 1];

    return {
      clinicians: clinicianId,
      programs: programId,
    };
  } else if (segments.includes(Collection.Programs)) {
    // Euneo Program
    const programsIndex = segments.indexOf(Collection.Programs);
    const programId = segments[programsIndex + 1];

    return {
      programs: programId,
    };
  } else {
    throw new Error("Invalid path format");
  }
}

export function createProgramRef({
  clinicians,
  programs,
}: {
  clinicians?: string;
  programs?: string;
}): TProgramRef {
  const identifiers: TProgramIdentifiers = clinicians
    ? { clinicians: clinicians, programs: programs || "" }
    : { programs: programs || "" };

  const path = serializeProgramIdentifiers(identifiers);

  if (programs) {
    return doc(db, path).withConverter(programConverter);
  }
  const programsCollection = collection(db, path);

  return doc(programsCollection).withConverter(programConverter);
}

export const programConverter = {
  toFirestore(program: TProgramRead): TProgramWrite {
    const createdAt =
      "createdAt" in program
        ? Timestamp.fromDate(program.createdAt)
        : undefined;
    const lastUpdatedAt =
      "lastUpdatedAt" in program
        ? Timestamp.fromDate(program.lastUpdatedAt)
        : createdAt;

    const programWrite: TProgramWrite = {
      currentVersionRef: program.currentVersionRef,
      // Convert dates to Timestamps if they exist
      createdAt: createdAt,
      lastUpdatedAt: lastUpdatedAt,
      isConsoleLive:
        "isConsoleLive" in program ? program.isConsoleLive : undefined,
      isLive: "isLive" in program ? program.isLive : undefined,
      isSaved: "isSaved" in program ? program.isSaved : undefined,
      isArchived: "isArchived" in program ? program.isArchived : undefined,
    };

    // Remove undefined fields before returning because Firestore will throw an error if we try to set undefined values
    Object.keys(programWrite).forEach((key) => {
      const typedKey = key as keyof TProgramWrite;
      if (programWrite[typedKey] === undefined) {
        delete programWrite[typedKey];
      }
    });

    return programWrite;
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot<
      TProgramWrite & {
        /**
         * @deprecated use currentVersionRef instead
         */
        currentVersion?: DocumentReference<
          TProgramVersionRead,
          TProgramVersionWrite
        >;
      }
    >,
    options: SnapshotOptions
  ): TProgramRead {
    const programWrite = snapshot.data(options);
    const { createdAt, lastUpdatedAt, currentVersion, ...rest } = programWrite;

    const clinicianProgram: TClinicianProgramRead = {
      createdAt: createdAt ? createdAt.toDate() : new Date(),
      lastUpdatedAt: lastUpdatedAt
        ? lastUpdatedAt.toDate()
        : createdAt
          ? createdAt.toDate()
          : new Date("2024-01-01T00:00:00"),
      isSaved: rest.isSaved ?? false,
      isArchived: rest.isArchived ?? false,
      currentVersionRef: currentVersion ?? programWrite.currentVersionRef, // TODO: remove currentVersion when all clients have updated programs, this is for users with deprecated programs
      programRef: snapshot.ref.withConverter(programConverter),
    };

    const euneoProgram: TEuneoProgramRead = {
      isConsoleLive: rest.isConsoleLive ?? false,
      isLive: rest.isLive ?? false,
      currentVersionRef: currentVersion ?? programWrite.currentVersionRef, // TODO: remove currentVersion when all clients have updated programs, this is for users with deprecated programs
      programRef: snapshot.ref.withConverter(programConverter),
    };

    return {
      ...clinicianProgram,
      ...euneoProgram,
    };
  },
};

export type TEuneoProgramInfo = TEuneoProgramRead & {
  programRef: TProgramRef;
};

export type TClinicianProgramInfo = TClinicianProgramRead & {
  programRef: TProgramRef;
};

export type TClinicProgramInfo = TClinicProgramRead & {
  programRef: TProgramRef;
};

export type TProgramInfo =
  | TEuneoProgramInfo
  | TClinicianProgramInfo
  | TClinicProgramInfo;

// The types here below are used to merge the base program type with the version information along with phases and days

export type TEuneoProgram = {
  programInfo: TEuneoProgramInfo;
  versionInfo: TProgramVersion;
  // TODO: Move these to versionInfo?
  programVersionIdentifiers: TEuneoProgramVersionIdentifiers;
  programVersionRef: TProgramVersionRef;
  days: Record<TProgramDayKey, TProgramDay>;
  phases: Record<TProgramPhaseKey, TProgramPhase>;
  creator: "euneo";
};

export type TEuneoProgramWithoutSubCollections = Omit<
  TEuneoProgram,
  "days" | "phases"
>;

export type TClinicianProgram = {
  programInfo: TClinicianProgramInfo;
  versionInfo: TProgramVersion;
  // TODO: Move these to versionInfo?
  programVersionIdentifiers: TClinicianProgramVersionIdentifiers;
  programVersionRef: TProgramVersionRef;
  days: Record<TProgramDayKey, TProgramDay>;
  phases: Record<TProgramPhaseKey, TProgramPhase>;
  creator: "clinician";
};

export type TClinicianProgramWithoutSubCollections = Omit<
  TClinicianProgram,
  "days" | "phases"
>;

export type TClinicProgram = {
  programInfo: TClinicProgramInfo;
  versionInfo: TProgramVersion;
  // TODO: Move these to versionInfo?
  programVersionIdentifiers: TClinicProgramVersionIdentifiers;
  programVersionRef: TProgramVersionRef;
  days: Record<TProgramDayKey, TProgramDay>;
  phases: Record<TProgramPhaseKey, TProgramPhase>;
  creator: "clinic";
};

export type TClinicProgramWithoutSubCollections = Omit<
  TClinicProgram,
  "days" | "phases"
>;

export type TProgramWithoutSubCollections =
  | TEuneoProgramWithoutSubCollections
  | TClinicianProgramWithoutSubCollections
  | TClinicProgramWithoutSubCollections;

/**
 * @description This program type merges the base program type with the version information along with phases and days
 */
export type TProgram = TEuneoProgram | TClinicianProgram | TClinicProgram;
