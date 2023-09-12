//TODO: Ætti þessi file að heita eitthvað annað? eins og t.d. writeTypes eða firebaseTypes?

import { db } from "../firebase/db";
import {
  ProgramDayWrite,
  PhysioProgramWrite,
  EuneoProgramWrite,
  PhysioClientWrite,
  ClientWrite,
  ClientProgramDayWrite,
  ClientProgramWrite,
} from "../types/converterTypes";
import {
  TClientProgram,
  TClientProgramDay,
  TClientPhysicalInformation,
  TConditionAssessmentAnswer,
  TConditionId,
  TEuneoProgram,
  TOutcomeMeasureAnswer,
  TOutcomeMeasureId,
  TPainLevel,
  TPhase,
  TPhysioClient,
  TPhysioProgram,
  TProgramDay,
} from "../types/datatypes";

import {
  doc,
  DocumentReference,
  Firestore,
  QueryDocumentSnapshot,
  SnapshotOptions,
  Timestamp,
} from "@firebase/firestore";

// sdkofjdsalkfjsa

// Program Day converter
export const dayConverter = {
  toFirestore(day: TProgramDay): ProgramDayWrite {
    return {
      exercises: day.exercises.map((e) => ({
        reference: doc(db, "exercises", e.id),
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
          id: reference.id,
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
    return {
      name: program.name,
      conditionId: program.conditionId,
      mode: program.mode,
      outcomeMeasureRefs: program.outcomeMeasureIds.map((id) =>
        doc(db, "outcomeMeasures", id)
      ),
    } as PhysioProgramWrite;
  },

  fromFirestore(
    snapshot: QueryDocumentSnapshot<PhysioProgramWrite>,
    options: SnapshotOptions
  ): Omit<TPhysioProgram, "days"> {
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
      physioId: snapshot.ref.parent.parent?.id,
      physioProgramId: snapshot.id,
      // createdBy: "Physio",
      mode: "continuous",
    };
  },
};

export const euneoProgramConverter = {
  fromFirestore(
    snapshot: QueryDocumentSnapshot<EuneoProgramWrite>,
    options: SnapshotOptions
  ): Omit<TEuneoProgram, "days"> {
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
      ...(outcomeMeasureIds.length && { outcomeMeasureIds }),
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
  toFirestore(program: TClientProgram): ClientProgramWrite {
    const data: ClientProgramWrite = {
      outcomeMeasuresAnswers: program.outcomeMeasuresAnswers,
      conditionId: program.conditionId,
      painLevels: program.painLevel,
      programRef: doc(db, "programs", program.programId),
    };

    if (program.physioId) {
      data.programRef = doc(
        db,
        "physios",
        program.physioId,
        "programs",
        program.programId
      );
    }
    if (program.phases) {
      data.phases = program.phases;
    }

    if (program.physicalInformation) {
      data.physicalInformation = program.physicalInformation;
    }

    if (program.trainingDays) {
      data.trainingDays = program.trainingDays;
    }

    if (program.conditionAssessmentAnswers) {
      data.conditionAssessmentAnswers = program.conditionAssessmentAnswers;
    }

    return data;
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot<ClientProgramWrite>,
    options: SnapshotOptions
  ): Omit<TClientProgram, "days"> {
    // * Omit removes the days property from the return type because converters cant be async and then we cant get the days
    const data = snapshot.data(options);

    let { programRef, ...rest } = data;

    // create program id and by.
    const programId = programRef?.id;
    const programBy = programRef?.parent.parent?.id;

    // convert timestamps to dates in outcomeMeasures and painLevels
    const outcomeMeasuresAnswers: TOutcomeMeasureAnswer[] =
      data.outcomeMeasuresAnswers.map((measure) => ({
        ...measure,
        date: measure.date.toDate(),
      }));
    const painLevel: TPainLevel[] = data.painLevel.map((pain) => ({
      ...pain,
      date: pain.date.toDate(),
    }));

    const clientProgram = {
      ...rest,
      ...(programId && { programId }),
      ...(programBy && { programBy }),
      outcomeMeasuresAnswers,
      painLevel,
    };

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
