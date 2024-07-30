import {
  DocumentReference,
  QueryDocumentSnapshot,
  SnapshotOptions,
  collection,
  doc,
} from "firebase/firestore";
import { Collection, TConditionId } from "../global";
import {
  TOutcomeMeasureId,
  TOutcomeMeasureWrite,
} from "../outcomeMeasure/outcomeMeasure";
import { TConditionAssessmentQuestion } from "./conditionAssessmentQuestion";
import { db } from "../../firebase/db";
import { createProgramRef, TProgramRef } from "./program";

export type TProgramVersionRef = DocumentReference<
  TProgramVersionRead,
  TProgramVersionWrite
>;

export type TEuneoProgramVersionIdentifiers = {
  [Collection.Programs]: string;
  [Collection.Versions]: string;
};

export type TClinicianProgramVersionIdentifiers = {
  [Collection.Clinicians]: string;
  [Collection.Programs]: string;
  [Collection.Versions]: string;
};

export type TProgramVersionWrite = {
  name: string; // can be empty string
  variation?: string;
  conditionAssessment: TConditionAssessmentQuestion[] | null;
  conditionId: TConditionId | null;
  outcomeMeasureRefs: DocumentReference<TOutcomeMeasureWrite>[];
};

type TProgramVersionBase = {
  /**
   * @description can be empty string
   */
  name: string;
  variation?: string;
  conditionAssessment: TConditionAssessmentQuestion[] | null;
  conditionId: TConditionId | null;
  outcomeMeasureIds: TOutcomeMeasureId[];
};

export type TProgramVersionRead = TProgramVersionBase;

export type TProgramVersion = TProgramVersionRead & {
  programVersionRef: DocumentReference<
    TProgramVersionRead,
    TProgramVersionWrite
  >;
};

// Type guard for TClinicianProgramVersionIdentifiers
export function isClinicianProgramVersionIdentifiers(
  identifiers:
    | TEuneoProgramVersionIdentifiers
    | TClinicianProgramVersionIdentifiers
): identifiers is TClinicianProgramVersionIdentifiers {
  return (
    (identifiers as TClinicianProgramVersionIdentifiers)[
      Collection.Clinicians
    ] !== undefined
  );
}

// Serialization function for TProgramIdentifiers
export function serializeProgramVersionIdentifiers(
  obj: TEuneoProgramVersionIdentifiers | TClinicianProgramVersionIdentifiers
): string {
  if ("clinicians" in obj) {
    return `${Collection.Clinicians}/${obj.clinicians}/${Collection.Programs}/${obj.programs}/${Collection.Versions}/${obj.versions}`;
  } else {
    return `${Collection.Programs}/${obj.programs}/${Collection.Versions}/${obj.versions}`;
  }
}

// Deserialization function for TProgramIdentifiers
export function deserializeProgramVersionPath(
  path: string
): TEuneoProgramVersionIdentifiers | TClinicianProgramVersionIdentifiers {
  const segments = path.split("/");

  if (
    segments.includes(Collection.Clinicians) &&
    segments.includes(Collection.Programs) &&
    segments.includes(Collection.Versions)
  ) {
    // Clinician Program
    const cliniciansIndex = segments.indexOf(Collection.Clinicians);
    const clinicianId = segments[cliniciansIndex + 1];
    const programsIndex = segments.indexOf(
      Collection.Programs,
      cliniciansIndex
    );
    const programId = segments[programsIndex + 1];
    const versionsIndex = segments.indexOf(Collection.Versions, programsIndex);
    const versionId = segments[versionsIndex + 1];

    return {
      [Collection.Clinicians]: clinicianId,
      [Collection.Programs]: programId,
      [Collection.Versions]: versionId,
    };
  } else if (
    segments.includes(Collection.Programs) &&
    segments.includes(Collection.Versions)
  ) {
    // Euneo Program
    const programsIndex = segments.indexOf(Collection.Programs);
    const programId = segments[programsIndex + 1];
    const versionsIndex = segments.indexOf(Collection.Versions, programsIndex);
    const versionId = segments[versionsIndex + 1];

    // check if the programId is a valid conditionId

    return {
      [Collection.Programs]: programId,
      [Collection.Versions]: versionId,
    };
  } else {
    throw new Error("Invalid path format");
  }
}

export function createProgramVersionRef({
  programRef,
  clinicians,
  programs,
  versions,
}: {
  programRef?: TProgramRef;
  clinicians?: string;
  programs?: string;
  versions?: string;
}): DocumentReference<TProgramVersionRead, TProgramVersionWrite> {
  programRef = programRef || createProgramRef({ clinicians, programs });

  const versionPath = `${programRef.path}/${Collection.Versions}`;

  const versionsCollection = collection(db, versionPath);

  // Return a document reference with a new ID if versionId is not provided
  return versions
    ? doc(versionsCollection, versions).withConverter(programVersionConverter)
    : doc(versionsCollection).withConverter(programVersionConverter);
}

export const programVersionConverter = {
  toFirestore(program: TProgramVersionRead): TProgramVersionWrite {
    const { outcomeMeasureIds, ...rest } = program;

    return {
      ...rest,
      outcomeMeasureRefs: outcomeMeasureIds.map(
        (id) =>
          doc(
            db,
            "outcomeMeasures",
            id
          ) as DocumentReference<TOutcomeMeasureWrite>
      ),
    };
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot<TProgramVersionWrite>,
    options: SnapshotOptions
  ): TProgramVersionRead {
    const data = snapshot.data(options);
    const { outcomeMeasureRefs, ...rest } = data;
    return {
      ...rest,
      outcomeMeasureIds: outcomeMeasureRefs.map(
        (ref) => ref.id as TOutcomeMeasureId
      ),
    };
  },
};
