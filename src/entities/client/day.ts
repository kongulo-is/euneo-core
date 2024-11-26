import {
  doc,
  DocumentReference,
  QueryDocumentSnapshot,
  SnapshotOptions,
  Timestamp,
} from "firebase/firestore";
import { TProgramPhaseKey } from "../program/programPhase";
import { TProgramDayKey } from "../program/programDay";
import { Collection } from "../global";
import { db } from "../../firebase/db";

export type TClientProgramDayRef = DocumentReference<
  TClientProgramDayRead,
  TClientProgramDayWrite
>;

export type TClientProgramDayWrite = {
  dayId: TProgramDayKey;
  phaseId: TProgramPhaseKey;
  date: Timestamp;
  finished: boolean;
  adherence: number;
  restDay: boolean;
  exercises: number[];
};

/**
 * @description Each day in clients program, progress. (date, adherence, restDay, etc.)
 * @param dayId (d1, d2, d3...)
 * @param phaseId (p1, p2, p3...)
 * @param adherence 0-100%
 * @param exercises array completed exercises in a day (0 = not completed, 1 = completed)
 */
export type TClientProgramDayRead = {
  dayId: TProgramDayKey;
  phaseId: TProgramPhaseKey;
  date: Date;
  finished: boolean;
  adherence: number;
  restDay: boolean;
  exercises: number[];
};

export type TClientProgramDay = TClientProgramDayRead;

export function createClientProgramDayRef({
  clients,
  programs,
  days,
}: {
  clients: string;
  programs: string;
  days: string;
}): DocumentReference<TClientProgramDayRead, TClientProgramDayWrite> {
  const path = `${Collection.Clients}/${clients}/${Collection.Programs}/${programs}/${Collection.Days}/${days}`;

  return doc(db, path).withConverter(clientProgramDayConverter);
}

// Converter
export const clientProgramDayConverter = {
  toFirestore(day: TClientProgramDayRead): TClientProgramDayWrite {
    const data: TClientProgramDayWrite = {
      dayId: day.dayId,
      date: Timestamp.fromDate(day.date),
      finished: day.finished,
      adherence: day.adherence,
      restDay: day.restDay,
      exercises: day.exercises,
      phaseId: day.phaseId,
    };

    return data;
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot<TClientProgramDayWrite>,
    options: SnapshotOptions
  ): TClientProgramDayRead {
    const data = snapshot.data(options);
    const clientProgramDay: TClientProgramDay = {
      ...data,
      phaseId: data.phaseId,
      date: data.date.toDate(),
    };

    return clientProgramDay;
  },
};
