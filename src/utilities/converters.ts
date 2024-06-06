import {
  TEuneoProgramId,
  TExercise,
  TExerciseWrite,
  TOutcomeMeasure,
  TOutcomeMeasureWrite,
} from "../types/baseTypes";

import {
  doc,
  DocumentReference,
  QueryDocumentSnapshot,
  SnapshotOptions,
  Timestamp,
} from "@firebase/firestore";
import {
  TConditionAssessmentQuestion,
  TProgramBase,
  TProgramContinuousPhase,
  TProgramDayKey,
  TProgramDayRead,
  TProgramDayWrite,
  TProgramFinitePhase,
  TProgramPhaseKey,
  TProgramPhaseRead,
  TProgramPhaseWrite,
  TProgramRead,
  TProgramVersion,
  TProgramVersionRead,
  TProgramVersionWrite,
  TProgramWrite,
} from "../types/programTypes";
import {
  TOutcomeMeasureAnswers,
  TClientProgramDay,
  TClientProgramRead,
  TClientProgramWrite,
  TClientProgramDayWrite,
  TClient,
  TClientProgram,
  TClientWrite,
  TClientRead,
  TOutcomeMeasureAnswerWrite,
} from "../types/clientTypes";
import runtimeChecks from "./runtimeChecks";
import {
  TOutcomeMeasureId,
  TClinicianClientRead,
  TClinicianClientWrite,
  TPrescription,
  TPrescriptionWrite,
  TPrescriptionBase,
} from "../types/clinicianTypes";
import { db } from "../firebase/db";
import { isEmptyObject } from "./basicHelpers";

// sdkofjdsalkfjsa

// Program Day converter
export const programDayConverter = {
  toFirestore(day: TProgramDayRead): TProgramDayWrite {
    return {
      exercises: day.exercises.map((e) => {
        return {
          reference: doc(db, "exercises", e.exerciseId),
          time: e.time,
          reps: e.reps,
          sets: e.sets,
        };
      }),
    };
  },

  fromFirestore(
    snapshot: QueryDocumentSnapshot<TProgramDayWrite>,
    options: SnapshotOptions
  ): TProgramDayRead {
    const data = snapshot.data(options);
    let { exercises } = data;

    const convertedExercises =
      exercises?.map((exercise) => {
        const { reference, ...rest } = exercise;

        // @ts-ignore this is for users with deprecated programs
        if (typeof exercise.quantity === "number") {
          const time = exercise.reps >= 15 ? exercise.reps : 0;
          // @ts-ignore
          const reps = exercise.reps >= 15 ? exercise.quantity : exercise.reps;
          return {
            ...rest,
            time: time,
            reps: reps === 1 && exercise.sets === 1 ? 0 : reps,
            sets: exercise.sets,
            exerciseId: reference.id,
          };
        }

        return {
          ...rest,
          exerciseId: reference.id,
        };
      }) || [];

    return {
      exercises: convertedExercises,
    };
  },
};

export const programPhaseConverter = {
  toFirestore(phase: TProgramPhaseRead): TProgramPhaseWrite {
    if ("clinicianId" in phase && phase.clinicianId) {
      const { clinicianId, programId, version, ...rest } = phase;
      return {
        ...rest,
        days: phase.days.map((day) =>
          doc(
            db,
            "clinicians",
            clinicianId,
            "programs",
            programId,
            "versions",
            version,
            "days",
            day
          )
        ),
      };
    } else {
      const { programId, version, ...rest } = phase;
      return {
        ...rest,
        days: phase.days.map((day) =>
          doc(db, "testPrograms", programId, "versions", version, "days", day)
        ),
      };
    }
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot<TProgramPhaseWrite>,
    options: SnapshotOptions
  ): TProgramPhaseRead {
    const data = snapshot.data(options);

    const programId = snapshot.ref.parent.parent!.parent!.parent!.id;
    const clinicianId =
      snapshot.ref.parent.parent?.parent?.parent?.parent?.parent?.id;

    // TODO: remove this when all users have updated programs, this is for users with deprecated programs
    // @ts-ignore this is for users with deprecated programs
    if (data?.nextPhase?.length && data.nextPhase[0].id) {
      // @ts-ignore this is for users with deprecated programs
      return {
        ...data,
        days: data.days.map((day) => day.id as TProgramDayKey),
        nextPhase: data.nextPhase.map((phase) => {
          // @ts-ignore
          const { id, minPain, maxPain, ...rest } = phase;
          return {
            ...rest,
            phaseId: id,
            minPainLevel: minPain,
            maxPainLevel: maxPain,
          };
        }),
      };
    }

    if (data.mode === "finite" && data.length) {
      const finitePhase: TProgramFinitePhase = {
        ...data,
        days: data.days.map((day) => day.id as TProgramDayKey),
        length: data.length,
        mode: data.mode,
      };
      return {
        ...finitePhase,
        programId,
        version: snapshot.ref.parent.parent!.id,
        ...(clinicianId && { clinicianId }),
      };
    } else if (data.mode === "continuous" || data.mode === "maintenance") {
      const continuousPhase: TProgramContinuousPhase = {
        ...data,
        days: data.days.map((day) => day.id as TProgramDayKey),
        mode: data.mode,
      };
      return {
        ...continuousPhase,
        programId,
        version: snapshot.ref.parent.parent!.id,
        ...(clinicianId && { clinicianId }),
      };
    } else {
      throw new Error("Invalid program phase");
    }
  },
};

export const programConverter = {
  toFirestore(program: TProgramRead): TProgramWrite {
    // * we only create/edit clinician programs
    let outcomeMeasureRefs: DocumentReference<TOutcomeMeasureWrite>[] = [];
    if (program.outcomeMeasureIds) {
      outcomeMeasureRefs = program.outcomeMeasureIds.map(
        (id) =>
          doc(
            db,
            "outcomeMeasures",
            id
          ) as DocumentReference<TOutcomeMeasureWrite>
      );
    }

    let conditionAssessment: TConditionAssessmentQuestion[] = [];
    if (program.conditionAssessment) {
      conditionAssessment = program.conditionAssessment;
    }

    const data: TProgramWrite = {
      ...(program.name && { name: program.name }),
      conditionId: program.conditionId,
      outcomeMeasureRefs,
      conditionAssessment,
      ...(program.variation && { variation: program.variation }),
    };
    return data;
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot<TProgramWrite>,
    options: SnapshotOptions
  ): TProgramRead {
    const programWrite = snapshot.data(options);
    let { outcomeMeasureRefs, ...rest } = programWrite;

    const outcomeMeasureIds =
      outcomeMeasureRefs?.map(
        (measure: DocumentReference<TOutcomeMeasureWrite>) =>
          measure.id as TOutcomeMeasureId
      ) || [];

    const data: TProgramRead = {
      ...rest,
      ...(outcomeMeasureIds.length && { outcomeMeasureIds }),
      version: snapshot.id,
    };
    return data;
  },
};

export const programVersionConverter = {
  toFirestore(program: TProgramVersion): TProgramVersionWrite {
    const {
      programId,
      currentVersion,
      createdAt,
      lastUpdatedAt,
      ...otherProps
    } = program;

    const programProps = {
      ...otherProps,
      ...(createdAt && { createdAt: Timestamp.fromDate(createdAt) }),
      ...(lastUpdatedAt && {
        lastUpdatedAt: Timestamp.fromDate(lastUpdatedAt),
      }),
    };

    const getCurrentVersionDocRef = (
      clinicianId?: string
    ): DocumentReference<TProgramWrite> => {
      if (clinicianId) {
        return doc(
          db,
          "clinicians",
          clinicianId,
          "programs",
          programId,
          "versions",
          currentVersion
        ) as DocumentReference<TProgramWrite>;
      }
      return doc(
        db,
        "programs",
        programId,
        "versions",
        currentVersion
      ) as DocumentReference<TProgramWrite>;
    };

    if ("clinicianId" in programProps) {
      const { clinicianId, ...otherProps } = programProps;
      return {
        currentVersion: getCurrentVersionDocRef(clinicianId),
        ...otherProps,
      };
    }

    return {
      currentVersion: getCurrentVersionDocRef(),
      ...programProps,
    };
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot<TProgramVersionWrite>,
    options: SnapshotOptions
  ): TProgramVersion {
    const data = snapshot.data(options);
    try {
      const currentVersionRef = data.currentVersion;
      const clinicianId =
        currentVersionRef.parent.parent?.parent?.parent?.id || "";
      const programId = currentVersionRef.parent.parent?.id || "";
      const currentVersion = currentVersionRef.id;
      return {
        programId,
        currentVersion,
        ...(clinicianId && { clinicianId }),
        ...("isConsoleLive" in data && { isConsoleLive: data.isConsoleLive }),
        ...("isLive" in data && { isLive: data.isLive }),
        ...("isArchived" in data && { isArchived: data.isArchived }),
        ...(data.isSaved && { isSaved: data.isSaved }),
        ...(data.createdAt && { createdAt: data.createdAt.toDate() }),
        ...(data.lastUpdatedAt && {
          lastUpdatedAt: data.lastUpdatedAt.toDate(),
        }),
      };
    } catch (error) {
      throw new Error("Could not return program version data");
    }
  },
};

export const clinicianClientConverter = {
  toFirestore(client: TClinicianClientRead): TClinicianClientWrite {
    const data: TClinicianClientWrite = {
      name: client.name,
      email: client.email,
      conditionId: client.conditionId,
      // ...(client.conditionId && { conditionId: client.conditionId }),
      date: Timestamp.fromDate(client.date),
    };

    if (client.prescription) {
      data.prescription = prescriptionConverter.toFirestore(
        client.prescription
      );
    }

    return data;
  },

  fromFirestore(
    snapshot: QueryDocumentSnapshot<TClinicianClientWrite>,
    options: SnapshotOptions
  ): TClinicianClientRead {
    const data = snapshot.data(options);
    let { prescription, ...rest } = data;

    let prescriptionRead: TPrescription | undefined;
    if (prescription) {
      prescriptionRead = prescriptionConverter.fromFirestore(prescription);
    }

    return {
      ...rest,
      ...(prescriptionRead && { prescription: prescriptionRead }),
      date: rest.date.toDate(),
    };
  },
};

export const clientProgramConverter = {
  toFirestore(program: TClientProgramRead): TClientProgramWrite {
    // Perform runtime checks
    runtimeChecks.assertTClientProgram(program, true); // Assertion done here if needed

    const { clinicianId, clinicianClientId } = program;

    const outcomeMeasuresAnswers = {} as Record<
      TOutcomeMeasureId,
      TOutcomeMeasureAnswerWrite[]
    > | null;

    if (program.outcomeMeasuresAnswers) {
      Object.keys(program.outcomeMeasuresAnswers).forEach((measureId) => {
        const measureAnswers =
          program.outcomeMeasuresAnswers![measureId as TOutcomeMeasureId];
        outcomeMeasuresAnswers![measureId as TOutcomeMeasureId] =
          measureAnswers.map((answer) => ({
            ...answer,
            date: Timestamp.fromDate(answer.date),
          }));
      });
    }

    const painLevels = program.painLevels.map((pain) => ({
      ...pain,
      date: Timestamp.fromDate(pain.date),
    }));

    let programRef: DocumentReference<TProgramWrite>;

    if ("euneoProgramId" in program && program.euneoProgramId) {
      programRef = doc(
        db,
        "testPrograms",
        program.euneoProgramId,
        "versions",
        program.programVersion
      ) as DocumentReference<TProgramWrite>;
    } else if ("clinicianProgramId" in program) {
      programRef = doc(
        db,
        "clinicians",
        program.clinicianId,
        "programs",
        program.clinicianProgramId,
        "versions",
        program.programVersion
      ) as DocumentReference<TProgramWrite>;
    } else {
      throw new Error("Program must have either euneoProgramId or clinicianId");
    }

    let clinicianClientRef:
      | DocumentReference<TClinicianClientWrite>
      | undefined;
    if (clinicianId && clinicianClientId) {
      clinicianClientRef = doc(
        db,
        "clinicians",
        clinicianId,
        "clients",
        clinicianClientId
      ) as DocumentReference<TClinicianClientWrite>;
    }

    const data: TClientProgramWrite = {
      outcomeMeasuresAnswers,
      conditionId: program.conditionId,
      painLevels,
      programRef: programRef,
      trainingDays: program.trainingDays,
      physicalInformation: program.physicalInformation,
      phases: program.phases,
      ...(clinicianClientRef && { clinicianClientRef }),
    };

    if ("conditionAssessmentAnswers" in program) {
      data["conditionAssessmentAnswers"] = program.conditionAssessmentAnswers;
    }

    return data;
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot<TClientProgramWrite>,
    options: SnapshotOptions
  ): TClientProgramRead {
    // * Omit removes the days property from the return type because converters cant be async and then we cant get the days
    const data = snapshot.data(options);
    let { programRef, painLevels, clinicianClientRef, ...rest } = data;

    // convert timestamps to dates in outcomeMeasures and painLevels
    const outcomeMeasuresAnswers = {} as Record<
      TOutcomeMeasureId,
      TOutcomeMeasureAnswers[]
    > | null;
    if (
      data.outcomeMeasuresAnswers &&
      !isEmptyObject(data.outcomeMeasuresAnswers)
    ) {
      Object.keys(data.outcomeMeasuresAnswers)?.forEach((measureId) => {
        const measureAnswers =
          data.outcomeMeasuresAnswers![measureId as TOutcomeMeasureId];
        outcomeMeasuresAnswers![measureId as TOutcomeMeasureId] =
          measureAnswers.map((answer) => ({
            ...answer,
            date: answer.date.toDate(),
          }));
      });
    }

    let clientProgram: TClientProgramRead | TClientProgram;

    const painLevelsClient = painLevels.map((pain) => ({
      ...pain,
      date: pain.date.toDate(),
    }));

    let clinicianId: string | undefined;
    let clinicianClientId: string | undefined;
    if (clinicianClientRef) {
      clinicianId = clinicianClientRef.parent.parent!.id;
      clinicianClientId = clinicianClientRef.id;
    }

    if (!programRef?.parent.parent?.parent?.parent) {
      clientProgram = {
        ...rest,
        outcomeMeasuresAnswers,
        painLevels: painLevelsClient,
        euneoProgramId: programRef.parent.parent!.id as TEuneoProgramId,
        programVersion: programRef.id,
      };
      runtimeChecks.assertTClientProgram(clientProgram, true);
    } else {
      const clinicianProgramId = programRef.parent.parent.id;
      const clinicianId = programRef.parent.parent.parent.parent.id;
      clientProgram = {
        ...rest,
        outcomeMeasuresAnswers,
        painLevels: painLevelsClient,
        clinicianProgramId,
        clinicianId,
        programVersion: programRef.id,
      };
      runtimeChecks.assertTClientProgram(clientProgram, true);
    }

    // Add clinicianClientIds if they exist
    clientProgram = {
      ...clientProgram,
      ...(clinicianClientId &&
        clinicianId && { clinicianClientId, clinicianId }),
    };

    return clientProgram;
  },
};

export const clientProgramDayConverter = {
  toFirestore(day: TClientProgramDay): TClientProgramDayWrite {
    const data: TClientProgramDayWrite = {
      dayId: day.dayId,
      date: Timestamp.fromDate(day.date),
      finished: day.finished,
      adherence: day.adherence,
      restDay: day.restDay,
      exercises: day.exercises,
    };

    if (day.phaseId) {
      data.phaseId = day.phaseId;
    }

    return data;
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot<TClientProgramDayWrite>,
    options: SnapshotOptions
  ): TClientProgramDay {
    const data = snapshot.data(options);
    const clientProgramDay: TClientProgramDay = {
      ...data,
      phaseId: data.phaseId as TProgramPhaseKey,
      date: data.date.toDate(),
    };

    return clientProgramDay;
  },
};

export const exerciseConverter = {
  toFirestore(exercise: TExercise): TExerciseWrite {
    const { id, ...rest } = exercise;
    const data: TExerciseWrite = {
      ...rest,
    };

    return data;
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot<TExerciseWrite>,
    options: SnapshotOptions
  ): TExercise {
    const data = snapshot.data(options);

    const exercise: TExercise = {
      ...data,
      id: snapshot.id,
    };

    return exercise;
  },
};

export const outcomeMeasureConverter = {
  toFirestore(measure: TOutcomeMeasure): TOutcomeMeasureWrite {
    const { id, ...rest } = measure;
    const data: TOutcomeMeasureWrite = {
      ...rest,
    };

    return data;
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot<TOutcomeMeasureWrite>,
    options: SnapshotOptions
  ): TOutcomeMeasure {
    const data = snapshot.data(options);

    const measure: TOutcomeMeasure = {
      ...data,
      id: snapshot.id as TOutcomeMeasureId,
    };

    return measure;
  },
};

export const prescriptionConverter = {
  toFirestore(prescription: TPrescription): TPrescriptionWrite {
    let clientProgramRef: DocumentReference<TClientProgramWrite> | undefined;

    if (prescription.clientId && prescription.clientProgramId) {
      clientProgramRef = doc(
        db,
        "clients",
        prescription.clientId,
        "programs",
        prescription.clientProgramId
      ) as DocumentReference<TClientProgramWrite>;
    }

    if ("euneoProgramId" in prescription) {
      return {
        programRef: doc(
          db,
          "testPrograms",
          prescription.euneoProgramId,
          "versions",
          prescription.version
        ) as DocumentReference<TProgramWrite>,
        prescriptionDate: Timestamp.fromDate(prescription.prescriptionDate),
        status: prescription.status,
        ...(clientProgramRef && { clientProgramRef }),
      };
    } else {
      return {
        programRef: doc(
          db,
          "clinicians",
          prescription.clinicianId,
          "programs",
          prescription.clinicianProgramId,
          "versions",
          prescription.version
        ) as DocumentReference<TProgramWrite>,
        prescriptionDate: Timestamp.fromDate(prescription.prescriptionDate),
        status: prescription.status,
        ...(clientProgramRef && { clientProgramRef }),
      };
    }
  },

  fromFirestore(prescriptionWrite: TPrescriptionWrite): TPrescription {
    let { programRef, clientProgramRef, ...rest } = prescriptionWrite;

    let clientProgramObj:
      | {
          clientId: string;
          clientProgramId: string;
        }
      | undefined;

    if (clientProgramRef && clientProgramRef.parent.parent) {
      clientProgramObj = {
        clientId: clientProgramRef.parent.parent.id,
        clientProgramId: clientProgramRef.id,
      };
    }
    let prescription: TPrescription;

    if (programRef.parent.parent?.parent?.parent) {
      prescription = {
        ...rest,
        prescriptionDate: rest.prescriptionDate.toDate(),
        clinicianId: programRef.parent.parent.parent.parent.id,
        clinicianProgramId: programRef.parent.parent.id,
        version: programRef.id,
        ...(clientProgramObj && { ...clientProgramObj }),
      };
    } else {
      prescription = {
        ...rest,
        prescriptionDate: rest.prescriptionDate.toDate(),
        euneoProgramId: programRef.parent.parent!.id as TEuneoProgramId,
        version: programRef.id,
        ...(clientProgramObj && { ...clientProgramObj }),
      };
    }

    return prescription;
  },
};

export const clientConverter = {
  // only needs to convert clientProgramRef to id
  fromFirestore(
    snapshot: QueryDocumentSnapshot<TClientWrite>,
    options: SnapshotOptions
  ): TClientRead {
    const data = snapshot.data(options);
    let { currentProgramRef, ...rest } = data;

    let client: TClientRead = {
      ...rest,
      ...(currentProgramRef && { currentProgramId: currentProgramRef.id }),
    };

    return client;
  },
  toFirestore(client: TClient): TClientWrite {
    const { currentProgramId, ...rest } = client;
    return {
      ...rest,
      ...(currentProgramId && {
        currentProgramRef: doc(
          db,
          "clients",
          client.clientId,
          "programs",
          currentProgramId
        ) as DocumentReference<TClientProgramWrite>,
      }),
    };
  },
};

// TODO: Converters for deprecated programs
export const oldClinicianClientConverter = {
  toFirestore(client: TClinicianClientRead): TClinicianClientWrite {
    const data: TClinicianClientWrite = {
      name: client.name,
      email: client.email,
      conditionId: client.conditionId,
      date: Timestamp.fromDate(client.date),
    };

    if (client.prescription) {
      data.prescription = oldPrescriptionConverter.toFirestore(
        client.prescription
      );
    }

    return data;
  },

  fromFirestore(
    snapshot: QueryDocumentSnapshot<TClinicianClientWrite>,
    options: SnapshotOptions
  ): TClinicianClientRead {
    const data = snapshot.data(options);
    let { prescription, ...rest } = data;

    let prescriptionRead: TPrescription | undefined;
    if (prescription) {
      prescriptionRead = oldPrescriptionConverter.fromFirestore(prescription);
    }

    return {
      ...rest,
      ...(prescriptionRead && { prescription: prescriptionRead }),
      date: rest.date.toDate(),
    };
  },
};

export const oldClientProgramConverter = {
  toFirestore(program: TClientProgramRead): TClientProgramWrite {
    // Perform runtime checks
    runtimeChecks.assertTClientProgram(program, true); // Assertion done here if needed

    const { clinicianId, clinicianClientId } = program;

    const outcomeMeasuresAnswers = {} as Record<
      TOutcomeMeasureId,
      TOutcomeMeasureAnswerWrite[]
    > | null;

    if (program.outcomeMeasuresAnswers) {
      Object.keys(program.outcomeMeasuresAnswers).forEach((measureId) => {
        const measureAnswers =
          program.outcomeMeasuresAnswers![measureId as TOutcomeMeasureId];
        outcomeMeasuresAnswers![measureId as TOutcomeMeasureId] =
          measureAnswers.map((answer) => ({
            ...answer,
            date: Timestamp.fromDate(answer.date),
          }));
      });
    }

    const painLevels = program.painLevels.map((pain) => ({
      ...pain,
      date: Timestamp.fromDate(pain.date),
    }));

    let programRef: DocumentReference<TProgramWrite>;

    if ("euneoProgramId" in program && program.euneoProgramId) {
      program;
      programRef = doc(
        db,
        "testPrograms",
        program.euneoProgramId
      ) as DocumentReference<TProgramWrite>;
    } else if ("clinicianProgramId" in program) {
      programRef = doc(
        db,
        "clinicians",
        program.clinicianId,
        "programs",
        program.clinicianProgramId
      ) as DocumentReference<TProgramWrite>;
    } else {
      throw new Error("Program must have either euneoProgramId or clinicianId");
    }

    let clinicianClientRef:
      | DocumentReference<TClinicianClientWrite>
      | undefined;
    if (clinicianId && clinicianClientId) {
      clinicianClientRef = doc(
        db,
        "clinicians",
        clinicianId,
        "clients",
        clinicianClientId
      ) as DocumentReference<TClinicianClientWrite>;
    }

    const data: TClientProgramWrite = {
      outcomeMeasuresAnswers,
      conditionId: program.conditionId,
      painLevels,
      programRef: programRef,
      trainingDays: program.trainingDays,
      physicalInformation: program.physicalInformation,
      phases: program.phases,
      ...(clinicianClientRef && { clinicianClientRef }),
    };

    if ("conditionAssessmentAnswers" in program) {
      data["conditionAssessmentAnswers"] = program.conditionAssessmentAnswers;
    }

    return data;
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot<TClientProgramWrite>,
    options: SnapshotOptions
  ): TClientProgramRead {
    // * Omit removes the days property from the return type because converters cant be async and then we cant get the days
    const data = snapshot.data(options);
    let { programRef, painLevels, clinicianClientRef, ...rest } = data;

    // convert timestamps to dates in outcomeMeasures and painLevels
    const outcomeMeasuresAnswers = {} as Record<
      TOutcomeMeasureId,
      TOutcomeMeasureAnswers[]
    > | null;
    if (
      data.outcomeMeasuresAnswers &&
      !isEmptyObject(data.outcomeMeasuresAnswers)
    ) {
      Object.keys(data.outcomeMeasuresAnswers)?.forEach((measureId) => {
        const measureAnswers =
          data.outcomeMeasuresAnswers![measureId as TOutcomeMeasureId];
        outcomeMeasuresAnswers![measureId as TOutcomeMeasureId] =
          measureAnswers.map((answer) => ({
            ...answer,
            date: answer.date.toDate(),
          }));
      });
    }

    let clientProgram: TClientProgramRead | TClientProgram;

    const painLevelsClient = painLevels.map((pain) => ({
      ...pain,
      date: pain.date.toDate(),
    }));

    let clinicianId: string | undefined;
    let clinicianClientId: string | undefined;
    if (clinicianClientRef) {
      clinicianId = clinicianClientRef.parent.parent!.id;
      clinicianClientId = clinicianClientRef.id;
    }

    if (programRef?.parent.id === "versions") {
      if (!programRef?.parent.parent?.parent?.parent) {
        clientProgram = {
          ...rest,
          outcomeMeasuresAnswers,
          painLevels: painLevelsClient,
          euneoProgramId: programRef.parent.parent!.id as TEuneoProgramId,
          programVersion: programRef.id,
        };
        runtimeChecks.assertTClientProgram(clientProgram, true);
      } else {
        const clinicianProgramId = programRef.parent.parent.id;
        const clinicianId = programRef.parent.parent.parent.parent.id;
        clientProgram = {
          ...rest,
          outcomeMeasuresAnswers,
          painLevels: painLevelsClient,
          clinicianProgramId,
          clinicianId,
          programVersion: programRef.id,
        };
        runtimeChecks.assertTClientProgram(clientProgram, true);
      }
    } else {
      if (!programRef?.parent.parent) {
        clientProgram = {
          ...rest,
          outcomeMeasuresAnswers,
          painLevels: painLevelsClient,
          euneoProgramId: programRef.id as TEuneoProgramId,
          programVersion: "",
        };
        runtimeChecks.assertTClientProgram(clientProgram, true);
      } else {
        const clinicianProgramId = programRef.id;
        const clinicianId = programRef.parent.parent.id;
        clientProgram = {
          ...rest,
          outcomeMeasuresAnswers,
          painLevels: painLevelsClient,
          clinicianProgramId,
          clinicianId,
          programVersion: "",
        };
        runtimeChecks.assertTClientProgram(clientProgram, true);
      }
    }

    // Add clinicianClientIds if they exist
    clientProgram = {
      ...clientProgram,
      ...(clinicianClientId &&
        clinicianId && { clinicianClientId, clinicianId }),
    };

    return clientProgram;
  },
};

export const oldClientProgramDayConverter = {
  toFirestore(day: TClientProgramDay): TClientProgramDayWrite {
    const data: TClientProgramDayWrite = {
      dayId: day.dayId,
      date: Timestamp.fromDate(day.date),
      finished: day.finished,
      adherence: day.adherence,
      restDay: day.restDay,
      exercises: day.exercises,
    };

    if (day.phaseId) {
      data.phaseId = day.phaseId;
    }

    return data;
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot<TClientProgramDayWrite>,
    options: SnapshotOptions
  ): TClientProgramDay {
    const data = snapshot.data(options);
    const clientProgramDay: TClientProgramDay = {
      ...data,
      phaseId: data.phaseId as TProgramPhaseKey,
      date: data.date.toDate(),
    };

    return clientProgramDay;
  },
};

export const oldProgramConverter = {
  toFirestore(program: TProgramRead): TProgramWrite {
    // * we only create/edit clinician programs
    let outcomeMeasureRefs: DocumentReference<TOutcomeMeasureWrite>[] = [];
    if (program.outcomeMeasureIds) {
      outcomeMeasureRefs = program.outcomeMeasureIds.map(
        (id) =>
          doc(
            db,
            "outcomeMeasures",
            id
          ) as DocumentReference<TOutcomeMeasureWrite>
      );
    }

    let conditionAssessment: TConditionAssessmentQuestion[] = [];
    if (program.conditionAssessment) {
      conditionAssessment = program.conditionAssessment;
    }

    const data: TProgramWrite = {
      ...(program.name && { name: program.name }),
      conditionId: program.conditionId,
      outcomeMeasureRefs,
      conditionAssessment,
      ...(program.variation && { variation: program.variation }),
    };
    return data;
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot<TProgramWrite>,
    options: SnapshotOptions
  ): TProgramRead {
    const programWrite = snapshot.data(options);
    let { outcomeMeasureRefs, ...rest } = programWrite;

    const outcomeMeasureIds =
      outcomeMeasureRefs?.map(
        (measure: DocumentReference<TOutcomeMeasureWrite>) =>
          measure.id as TOutcomeMeasureId
      ) || [];

    const data: TProgramRead = {
      ...rest,
      ...(outcomeMeasureIds.length && { outcomeMeasureIds }),
      version: "1.0",
    };
    return data;
  },
};

export const oldProgramPhaseConverter = {
  toFirestore(phase: TProgramPhaseRead): TProgramPhaseWrite {
    if ("clinicianId" in phase && phase.clinicianId) {
      const { clinicianId, programId, ...rest } = phase;
      return {
        ...rest,
        days: phase.days.map((day) =>
          doc(
            db,
            "clinicians",
            clinicianId,
            "programs",
            programId,
            "versions",
            "1.0",
            "days",
            day
          )
        ),
      };
    } else {
      const { programId, ...rest } = phase;
      return {
        ...rest,
        days: phase.days.map((day) =>
          doc(db, "testPrograms", programId, "versions", "1.0", "days", day)
        ),
      };
    }
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot<TProgramPhaseWrite>,
    options: SnapshotOptions
  ): TProgramPhaseRead {
    const data = snapshot.data(options);

    const programId = snapshot.ref.parent.parent!.id;
    const clinicianId = snapshot.ref.parent.parent?.parent?.parent?.id;

    // TODO: remove this when all users have updated programs, this is for users with deprecated programs
    // @ts-ignore this is for users with deprecated programs
    if (data?.nextPhase?.length && data.nextPhase[0].id) {
      // @ts-ignore this is for users with deprecated programs
      return {
        ...data,
        days: data.days.map((day) => day.id as TProgramDayKey),
        nextPhase: data.nextPhase.map((phase) => {
          // @ts-ignore
          const { id, minPain, maxPain, ...rest } = phase;
          return {
            ...rest,
            phaseId: id,
            minPainLevel: minPain,
            maxPainLevel: maxPain,
          };
        }),
      };
    }

    if (data.mode === "finite" && data.length) {
      const finitePhase: TProgramFinitePhase = {
        ...data,
        days: data.days.map((day) => day.id as TProgramDayKey),
        length: data.length,
        mode: data.mode,
      };
      return {
        ...finitePhase,
        programId,
        version: "1.0",
        ...(clinicianId && { clinicianId }),
      };
    } else if (data.mode === "continuous" || data.mode === "maintenance") {
      const continuousPhase: TProgramContinuousPhase = {
        ...data,
        days: data.days.map((day) => day.id as TProgramDayKey),
        mode: data.mode,
      };
      return {
        ...continuousPhase,
        programId,
        version: "1.0",
        ...(clinicianId && { clinicianId }),
      };
    } else {
      throw new Error("Invalid program phase");
    }
  },
};

export const oldProgramDayConverter = {
  toFirestore(day: TProgramDayRead): TProgramDayWrite {
    return {
      exercises: day.exercises.map((e) => {
        return {
          reference: doc(db, "exercises", e.exerciseId),
          time: e.time,
          reps: e.reps,
          sets: e.sets,
        };
      }),
    };
  },

  fromFirestore(
    snapshot: QueryDocumentSnapshot<TProgramDayWrite>,
    options: SnapshotOptions
  ): TProgramDayRead {
    const data = snapshot.data(options);
    let { exercises } = data;

    const convertedExercises =
      exercises?.map((exercise) => {
        const { reference, ...rest } = exercise;

        // @ts-ignore this is for users with deprecated programs
        if (typeof exercise.quantity === "number") {
          const time = exercise.reps >= 15 ? exercise.reps : 0;
          // @ts-ignore
          const reps = exercise.reps >= 15 ? exercise.quantity : exercise.reps;
          return {
            ...rest,
            time: time,
            reps: reps === 1 && exercise.sets === 1 ? 0 : reps,
            sets: exercise.sets,
            exerciseId: reference.id,
          };
        }

        return {
          ...rest,
          exerciseId: reference.id,
        };
      }) || [];

    return {
      exercises: convertedExercises,
    };
  },
};

export const oldPrescriptionConverter = {
  toFirestore(prescription: TPrescription): TPrescriptionWrite {
    let clientProgramRef: DocumentReference<TClientProgramWrite> | undefined;

    if (prescription.clientId && prescription.clientProgramId) {
      clientProgramRef = doc(
        db,
        "clients",
        prescription.clientId
      ) as DocumentReference<TClientProgramWrite>;
    }

    if ("euneoProgramId" in prescription) {
      return {
        programRef: doc(
          db,
          "testPrograms",
          prescription.euneoProgramId,
          "versions",
          prescription.version || "1.0"
        ) as DocumentReference<TProgramWrite>,
        prescriptionDate: Timestamp.fromDate(prescription.prescriptionDate),
        status: prescription.status,
        ...(clientProgramRef && { clientProgramRef }),
      };
    } else {
      return {
        programRef: doc(
          db,
          "clinicians",
          prescription.clinicianId,
          "programs",
          prescription.clinicianProgramId,
          "versions",
          prescription.version || "1.0"
        ) as DocumentReference<TProgramWrite>,
        prescriptionDate: Timestamp.fromDate(prescription.prescriptionDate),
        status: prescription.status,
        ...(clientProgramRef && { clientProgramRef }),
      };
    }
  },

  fromFirestore(prescriptionWrite: TPrescriptionWrite): TPrescription {
    let { programRef, clientProgramRef, ...rest } = prescriptionWrite;

    let clientProgramObj:
      | {
          clientId: string;
          clientProgramId: string;
        }
      | undefined;

    if (clientProgramRef && clientProgramRef.parent.parent) {
      clientProgramObj = {
        clientId: clientProgramRef.parent.parent.id,
        clientProgramId: clientProgramRef.id,
      };
    }
    let prescription: TPrescription;

    // TODO: Deprecated program stuff (Do not have versions)
    if (programRef.parent.id !== "versions") {
      if (programRef.parent.parent) {
        prescription = {
          ...rest,
          prescriptionDate: rest.prescriptionDate.toDate(),
          clinicianId: programRef.parent.parent.id,
          clinicianProgramId: programRef.id,
          version: "",
          ...(clientProgramObj && { ...clientProgramObj }),
        };
      } else {
        prescription = {
          ...rest,
          prescriptionDate: rest.prescriptionDate.toDate(),
          euneoProgramId: programRef.id as TEuneoProgramId,
          version: "",
          ...(clientProgramObj && { ...clientProgramObj }),
        };
      }
    } else {
      if (programRef.parent.parent?.parent?.parent) {
        prescription = {
          ...rest,
          prescriptionDate: rest.prescriptionDate.toDate(),
          clinicianId: programRef.parent.parent.parent.parent.id,
          clinicianProgramId: programRef.parent.parent.id,
          version: programRef.id,
          ...(clientProgramObj && { ...clientProgramObj }),
        };
      } else {
        prescription = {
          ...rest,
          prescriptionDate: rest.prescriptionDate.toDate(),
          euneoProgramId: programRef.parent.parent!.id as TEuneoProgramId,
          version: programRef.id,
          ...(clientProgramObj && { ...clientProgramObj }),
        };
      }
    }

    return prescription;
  },
};
