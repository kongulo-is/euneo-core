//TODO: Ætti þessi file að heita eitthvað annað? eins og t.d. writeTypes eða firebaseTypes?

import { db } from "../firebase/db";

import {
  TExercise,
  TExerciseWrite,
  TOutcomeMeasureId,
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
  TPhysioProgram,
  TProgramDayRead,
  TProgramDayWrite,
  TProgramPhase,
  TProgramPhaseRead,
  TProgramPhaseWrite,
  TProgramRead,
  TProgramWrite,
} from "../types/programTypes";
import {
  TOutcomeMeasureAnswers,
  TClientProgramDay,
  TClientProgramRead,
  TClientEuneoProgramRead,
  TClientProgramWrite,
  TClientProgramDayWrite,
  TClient,
} from "../types/clientTypes";
import runtimeChecks from "./runtimeChecks";
import {
  TPhysioClientRead,
  TPhysioClientWrite,
  TPrescription,
} from "../types/physioTypes";

// sdkofjdsalkfjsa

// Program Day converter
export const programDayConverter = {
  toFirestore(day: TProgramDayRead): TProgramDayWrite {
    return {
      exercises: day.exercises.map((e) => ({
        reference: doc(db, "exercises", e.exerciseId),
        quantity: e.quantity,
        reps: e.reps,
        sets: e.sets,
      })),
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
    return {
      ...phase,
      days: phase.days.map((day) =>
        doc(db, "testPrograms", programId, "days", day)
      ),
    };
  },

  fromFirestore(
    snapshot: QueryDocumentSnapshot<TProgramPhaseWrite>,
    options: SnapshotOptions
  ): TProgramPhaseRead {
    const data = snapshot.data(options);
    return {
      ...data,
      days: data.days.map((day) => day.id as `d${number}`),
    };
  },
};

export const programConverter = {
  toFirestore(program: TProgramRead): TProgramWrite {
    // * we only create/edit physio programs
    let outcomeMeasureRefs: DocumentReference[] = [];
    if (program.outcomeMeasureIds) {
      outcomeMeasureRefs = program.outcomeMeasureIds.map((id) =>
        doc(db, "outcomeMeasures", id)
      );
    }

    let conditionAssessment: TConditionAssessmentQuestion[] = [];
    if (program.conditionAssessment) {
      conditionAssessment = program.conditionAssessment;
    }

    const data: TProgramWrite = {
      name: program.name,
      conditionId: program.conditionId,
      mode: program.mode,
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
        (measure: DocumentReference) => measure.id as TOutcomeMeasureId
      ) || [];

    const datas: TProgramRead = {
      ...rest,
      ...(outcomeMeasureIds.length && { outcomeMeasureIds }),
    };
    return datas;
  },
};

export const physioClientConverter = {
  toFirestore(client: TPhysioClientRead): TPhysioClientWrite {
    const data: TPhysioClientWrite = {
      name: client.name,
      email: client.email,
      ...(client.conditionId && { conditionId: client.conditionId }),
    };

    if (client.prescription && client.prescription.programId) {
      data.prescription = {
        ...client.prescription,
        programRef: doc(
          db,
          "programs",
          client.prescription.programId
        ) as DocumentReference<TPhysioProgram>,
        prescriptionDate: Timestamp.fromDate(
          client.prescription.prescriptionDate
        ),
      };
    }

    if (client.clientId) {
      data.clientRef = doc(
        db,
        "clients",
        client.clientId
      ) as DocumentReference<TClient>;
    }

    return data;
  },

  fromFirestore(
    snapshot: QueryDocumentSnapshot<TPhysioClientWrite>,
    options: SnapshotOptions
  ): TPhysioClientRead {
    const data = snapshot.data(options);
    let { clientRef, prescription, ...rest } = data;

    const clientId = clientRef?.id;

    console.log("prescription", prescription);

    let prescriptionRead: TPrescription | undefined;
    if (prescription) {
      prescriptionRead = {
        status: prescription.status,
        prescriptionDate: prescription.prescriptionDate.toDate(),
        programId: prescription.programRef?.id,
      };
    }

    return {
      ...rest,
      ...(clientId && { clientId }),
      ...(prescriptionRead && { prescription: prescriptionRead }),
    };
  },
};

export const clientProgramConverter = {
  toFirestore(program: TClientProgramRead): TClientProgramWrite {
    // Perform runtime checks
    runtimeChecks.assertTClientProgram(program, true); // Assertion done here if needed

    const outcomeMeasuresAnswers = program.outcomeMeasuresAnswers.map(
      (measure) => ({
        ...measure,
        date: Timestamp.fromDate(measure.date),
      })
    );

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
    } else if ("physioId" in program) {
      programRef = doc(
        db,
        "physios",
        program.physioId,
        "programs",
        program.physioProgramId
      ) as DocumentReference<TProgramWrite>;
    } else {
      throw new Error("Program must have either euneoProgramId or physioId");
    }

    const data: TClientProgramWrite = {
      outcomeMeasuresAnswers,
      conditionId: program.conditionId,
      painLevels,
      programRef: programRef,
      trainingDays: program.trainingDays,
      physicalInformation: program.physicalInformation,
    };

    if ("conditionAssessmentAnswers" in program) {
      data.conditionAssessmentAnswers = program.conditionAssessmentAnswers;
    }

    if ("phases" in program) {
      data.phases = program.phases;
    }

    return data;
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot<TClientProgramWrite>,
    options: SnapshotOptions
  ): TClientProgramRead {
    // * Omit removes the days property from the return type because converters cant be async and then we cant get the days
    const data = snapshot.data(options);
    console.log("Here1");
    let { programRef, painLevels, ...rest } = data;

    //TODO: remove check... Þetta a að vera painLevels. Bara nota til að ná þessu i gegn með gamla painLevel.
    // if (!painLevels) painLevels = (data as any).painLevel;
    // create program id and by.

    // convert timestamps to dates in outcomeMeasures and painLevels
    let outcomeMeasuresAnswers: TOutcomeMeasureAnswers[] =
      data.outcomeMeasuresAnswers?.map((measure) => ({
        ...measure,
        date: measure.date.toDate(),
      }));
    console.log("Here2", painLevels);

    // TODO: Þetta er bara til að ná þessu i gegn með gamla assessments. þarf að eyða þessu!!
    // if (!outcomeMeasuresAnswers)
    //   outcomeMeasuresAnswers = (data as any).assessments;

    let clientProgram;

    const painLevelsClient = painLevels.map((pain) => ({
      ...pain,
      date: pain.date.toDate(),
    }));

    console.log("HERE4");

    // TODO: Þyrftum sennilega að hafa eh betra tékk hvort þetta sé euneo eða physio program, kannski tékka frekar á reffinum, hvort það sé parent.parent

    if (rest.conditionAssessmentAnswers && rest.phases) {
      clientProgram = {
        ...rest,
        conditionAssessmentAnswers: rest.conditionAssessmentAnswers,
        phases: rest.phases,
        outcomeMeasuresAnswers,
        painLevels: painLevelsClient,
        euneoProgramId: programRef.id,
      };
      runtimeChecks.assertTClientProgram(clientProgram, true);
    } else {
      const physioProgramId = programRef?.id;
      const physioId = programRef?.parent.parent!.id;
      clientProgram = {
        ...rest,
        outcomeMeasuresAnswers,
        painLevels: painLevelsClient,
        physioProgramId,
        physioId,
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

//     if (rest.mode === "phase") {
//     }

//     return {
//       ...rest,
//       ...(outcomeMeasureIds.length && { outcomeMeasureIds }),
//       // createdBy: "Euneo",
//       programId: snapshot.id,
//     };
//   },
// });
