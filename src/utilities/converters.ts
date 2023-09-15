//TODO: Ætti þessi file að heita eitthvað annað? eins og t.d. writeTypes eða firebaseTypes?

import { db } from "../firebase/db";
import {
  ProgramDayWrite,
  PhysioProgramWrite,
  EuneoProgramWrite,
  PhysioClientWrite,
  ClientProgramDayWrite,
  ClientProgramWrite,
  ExerciseWrite,
} from "../types/converterTypes";
import {
  TExercise,
  TOutcomeMeasureId,
  TPhysioClient,
  TProgramDay,
} from "../types/baseTypes";

import {
  doc,
  DocumentReference,
  QueryDocumentSnapshot,
  SnapshotOptions,
  Timestamp,
} from "@firebase/firestore";
import {
  TEuneoProgramOmitted,
  TPhysioProgram,
  TPhysioProgramOmitted,
} from "../types/programTypes";
import {
  TClientProgramCommon,
  TClientProgramSpecific,
  TOutcomeMeasureAnswers,
  TPainLevel,
  TClientProgramDay,
  TClientProgramOmitted,
  TClientProgram,
} from "../types/clientTypes";
import { DocumentData } from "firebase/firestore";
import runtimeChecks from "./runtimeChecks";

// sdkofjdsalkfjsa

// Program Day converter
export const programDayConverter = {
  toFirestore(day: TProgramDay): ProgramDayWrite {
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
    snapshot: QueryDocumentSnapshot<ProgramDayWrite>,
    options: SnapshotOptions
  ): TProgramDay {
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

export const physioProgramConverter = {
  toFirestore(program: TPhysioProgram): PhysioProgramWrite {
    // * we only create/edit physio programs
    let outcomeMeasureRefs: DocumentReference[] = [];
    if (program.outcomeMeasureIds) {
      outcomeMeasureRefs = program.outcomeMeasureIds.map((id) =>
        doc(db, "outcomeMeasures", id)
      );
    }
    const data: PhysioProgramWrite = {
      name: program.name,
      conditionId: program.conditionId,
      mode: program.mode,
      outcomeMeasureRefs,
    };
    return data;
  },

  fromFirestore(
    snapshot: QueryDocumentSnapshot<PhysioProgramWrite>,
    options: SnapshotOptions
  ): TPhysioProgramOmitted<"days"> {
    // * Omit removes the days property from the return type because converters cant be async and then we cant get the days
    const data = snapshot.data(options);
    let { outcomeMeasureRefs, ...rest } = data;

    const outcomeMeasureIds =
      outcomeMeasureRefs?.map(
        (measure: DocumentReference) => measure.id as TOutcomeMeasureId
      ) || [];

    return {
      ...rest,
      ...(outcomeMeasureIds.length && { outcomeMeasureIds }),
      physioId: snapshot.ref.parent.parent!.id,
      physioProgramId: snapshot.id,
      mode: "continuous",
    };
  },
};

export const euneoProgramConverter = {
  fromFirestore(
    snapshot: QueryDocumentSnapshot<EuneoProgramWrite>,
    options: SnapshotOptions
  ): TEuneoProgramOmitted<"days"> {
    // * Omit removes the days property from the return type because converters cant be async and then we cant get the days
    const data = snapshot.data(options);
    let { outcomeMeasureRefs, ...rest } = data;

    const outcomeMeasureIds =
      outcomeMeasureRefs?.map(
        (measure: DocumentReference) => measure.id as TOutcomeMeasureId
      ) || [];

    if (rest.mode === "phase") {
    }

    return {
      ...rest,
      outcomeMeasureIds,
      // createdBy: "Euneo",
      programId: snapshot.id,
    };
  },
};

export const physioClientConverter = {
  toFirestore(client: TPhysioClient): PhysioClientWrite {
    const data: PhysioClientWrite = {
      name: client.name,
      email: client.email,
    };

    if (client.prescription && client.prescription.programId) {
      data.prescription = {
        ...client.prescription,
        programRef: doc(
          db,
          "programs",
          client.prescription.programId
        ) as DocumentReference<EuneoProgramWrite>,
        prescriptionDate: Timestamp.fromDate(
          client.prescription.prescriptionDate
        ),
      };
    }

    if (client.clientId) {
      data.clientRef = doc(db, "clients", client.clientId);
    }

    return data;
  },

  fromFirestore(
    snapshot: QueryDocumentSnapshot<PhysioClientWrite>,
    options: SnapshotOptions
  ): TPhysioClient {
    const data = snapshot.data(options);
    let { clientRef, prescription, ...rest } = data;

    const clientId = clientRef?.id;

    const newPrescription = prescription
      ? {
          ...prescription,
          prescriptionDate: prescription.prescriptionDate.toDate(),
          programId: prescription.programRef?.id,
        }
      : undefined;

    return {
      ...rest,
      ...(clientId && { clientId }),
      ...(newPrescription && { prescription: newPrescription }),
      physioClientId: snapshot.id,
    };
  },
};

export const clientProgramConverter = {
  // ! TODO: ég þurfti að breyta þessu úr TClientProgramOmitted<"days" | "clientProgramId"> því
  // ! það sem fer í firestore þarf að vera sama týpa og kemur úr firestore
  toFirestore(
    program: TClientProgramOmitted<"days" | "clientProgramId">
  ): ClientProgramWrite {
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

    let programRef: DocumentReference<EuneoProgramWrite | PhysioProgramWrite>;

    if ("programId" in program) {
      programRef = doc(
        db,
        "programs",
        program?.programId
      ) as DocumentReference<EuneoProgramWrite>;
    } else {
      programRef = doc(
        db,
        "physios",
        program.physioId,
        "programs",
        program.physioProgramId
      ) as DocumentReference<PhysioProgramWrite>;
    }

    const data: ClientProgramWrite = {
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
    snapshot: QueryDocumentSnapshot<ClientProgramWrite>,
    options: SnapshotOptions
  ): TClientProgramOmitted<"days" | "clientProgramId"> {
    // * Omit removes the days property from the return type because converters cant be async and then we cant get the days
    const data = snapshot.data(options);
    console.log("Here1");
    let { programRef, painLevels, ...rest } = data;

    // create program id and by.

    // convert timestamps to dates in outcomeMeasures and painLevels
    const outcomeMeasuresAnswers: TOutcomeMeasureAnswers[] =
      data.outcomeMeasuresAnswers.map((measure) => ({
        ...measure,
        date: measure.date.toDate(),
      }));
    console.log("Here2", painLevels);

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
        programId: programRef.id,
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
  toFirestore(day: TClientProgramDay): ClientProgramDayWrite {
    const data: ClientProgramDayWrite = {
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
    snapshot: QueryDocumentSnapshot<ClientProgramDayWrite>,
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
  toFirestore(exercise: TExercise): ExerciseWrite {
    const { id, ...rest } = exercise;
    const data: ExerciseWrite = {
      ...rest,
    };

    return data;
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot<ExerciseWrite>,
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
