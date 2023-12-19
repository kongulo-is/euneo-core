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
  TProgramContinuousPhase,
  TProgramDayRead,
  TProgramDayWrite,
  TProgramFinitePhase,
  TProgramPhaseRead,
  TProgramPhaseWrite,
  TProgramRead,
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
      const { clinicianId, programId, ...rest } = phase;
      return {
        ...rest,
        days: phase.days.map((day) =>
          doc(db, "clinicians", clinicianId, "programs", programId, "days", day)
        ),
      };
    } else {
      const { programId, ...rest } = phase;
      return {
        ...rest,
        days: phase.days.map((day) =>
          doc(db, "programs", programId, "days", day)
        ),
      };
    }
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot<TProgramPhaseWrite>,
    options: SnapshotOptions
  ): TProgramPhaseRead {
    const data = snapshot.data(options);

    const programId = snapshot.id;
    const clinicianId = snapshot.ref.parent.parent?.id;

    // TODO: remove this when all users have updated programs, this is for users with deprecated programs
    // @ts-ignore this is for users with deprecated programs
    if (data?.nextPhase?.length && data.nextPhase[0].id) {
      // @ts-ignore this is for users with deprecated programs
      return {
        ...data,
        days: data.days.map((day) => day.id as `d${number}`),
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
        days: data.days.map((day) => day.id as `d${number}`),
        length: data.length,
        mode: data.mode,
      };
      return {
        ...finitePhase,
        programId,
        ...(clinicianId && { clinicianId }),
      };
    } else if (data.mode === "continuous" || data.mode === "maintenance") {
      const continuousPhase: TProgramContinuousPhase = {
        ...data,
        days: data.days.map((day) => day.id as `d${number}`),
        mode: data.mode,
      };
      return {
        ...continuousPhase,
        programId,
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
      name: program.name,
      conditionId: program.conditionId,
      outcomeMeasureRefs,
      conditionAssessment,
      version: "1",
    };
    return data;
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot<TProgramWrite>,
    options: SnapshotOptions
  ): TProgramRead {
    const data = snapshot.data(options);
    let { outcomeMeasureRefs, ...rest } = data;

    const outcomeMeasureIds =
      outcomeMeasureRefs?.map(
        (measure: DocumentReference<TOutcomeMeasureWrite>) =>
          measure.id as TOutcomeMeasureId
      ) || [];

    const datas: TProgramRead = {
      ...rest,
      ...(outcomeMeasureIds.length && { outcomeMeasureIds }),
    };
    return datas;
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
        "programs",
        program.euneoProgramId
      ) as DocumentReference<TProgramWrite>;
    } else if ("clinicianId" in program) {
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

    const data: TClientProgramWrite = {
      outcomeMeasuresAnswers,
      conditionId: program.conditionId,
      painLevels,
      programRef: programRef,
      trainingDays: program.trainingDays,
      physicalInformation: program.physicalInformation,
      phases: program.phases,
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
    let { programRef, painLevels, ...rest } = data;

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

    if (!programRef?.parent.parent) {
      clientProgram = {
        ...rest,
        outcomeMeasuresAnswers,
        painLevels: painLevelsClient,
        euneoProgramId: programRef.id as TEuneoProgramId,
      };
      runtimeChecks.assertTClientProgram(clientProgram, true);
    } else {
      const clinicianProgramId = programRef?.id;
      const clinicianId = programRef?.parent.parent!.id;
      clientProgram = {
        ...rest,
        outcomeMeasuresAnswers,
        painLevels: painLevelsClient,
        clinicianProgramId,
        clinicianId,
      };
      runtimeChecks.assertTClientProgram(clientProgram, true);
    }
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
      phaseId: data.phaseId as `p${number}`,
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
        prescription.clientId
      ) as DocumentReference<TClientProgramWrite>;
    }

    if ("euneoProgramId" in prescription) {
      return {
        programRef: doc(
          db,
          "programs",
          prescription.euneoProgramId
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
          prescription.clinicianProgramId
        ) as DocumentReference<TProgramWrite>,
        prescriptionDate: Timestamp.fromDate(prescription.prescriptionDate),
        status: prescription.status,
        ...(clientProgramRef && { clientProgramRef }),
      };
    }
  },

  fromFirestore(prescriptionWrite: TPrescriptionWrite): TPrescription {
    let { programRef, clientProgramRef, ...rest } = prescriptionWrite;

    let prescription: TPrescription;

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

    if (programRef.parent.parent) {
      prescription = {
        ...rest,
        prescriptionDate: rest.prescriptionDate.toDate(),
        clinicianId: programRef.parent.parent.id,
        clinicianProgramId: programRef.id,
        ...(clientProgramObj && { ...clientProgramObj }),
      };
    } else {
      prescription = {
        ...rest,
        prescriptionDate: rest.prescriptionDate.toDate(),
        euneoProgramId: programRef.id as TEuneoProgramId,
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

// export const invitationConverter = (db: Firestore) => ({
//   fromFirestore(
//     snapshot: QueryDocumentSnapshot<InvitationWrite>,
//     options: SnapshotOptions
//   ): Omit<TEuneoProgram, "days"> {
//     // * Omit removes the days property from the return type because converters cant be async and then we cant get the days
//     const data = snapshot.data(options);
//     let { outcomeMeasureRefs, ...rest } = data;

//     const outcomeMeasureIds =
//       outcomeMeasureRefs?.map(
//         (measure: DocumentReference) => measure.id as TOutcomeMeasureId
//       ) || [];
//     return {
//       ...rest,
//       ...(outcomeMeasureIds.length && { outcomeMeasureIds }),
//       // createdBy: "Euneo",
//       programId: snapshot.id,
//     };
//   },
// });
