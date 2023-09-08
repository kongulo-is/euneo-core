//TODO: Ætti þessi file að heita eitthvað annað? eins og t.d. writeTypes eða firebaseTypes?

import {
  ProgramDayWrite,
  PhysioProgramWrite,
  EuneoProgramWrite,
  PhysioClientWrite,
} from "../types/converterTypes";
import {
  TEuneoProgram,
  TOutcomeMeasureId,
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

// Program Day converter
export const dayConverter = (db: Firestore) => ({
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
      key: snapshot.id,
      exercises: convertedExercises,
    };
  },
});

export const physioProgramConverter = (db: Firestore) => ({
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
});

export const euneoProgramConverter = (db: Firestore) => ({
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
});

export const physioClientConverter = (db: Firestore) => ({
  toFirestore(client: TPhysioClient): PhysioClientWrite {
    const data: PhysioClientWrite = {
      name: client.name,
      email: client.email,
    };

    if (client.status) {
      data.status = client.status;
    }

    if (client.conditionId) {
      data.condition = client.conditionId;
    }

    if (client.prescription && client.prescription.programId) {
      data.prescription = {
        ...client.prescription,
        programRef: doc(db, "programs", client.prescription.programId),
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
});

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
