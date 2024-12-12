import { Timestamp } from "firebase/firestore";

export type TPainLevelWrite = {
  painIndex: number;
  date: Timestamp;
  submittedAt?: Timestamp;
};

/**
 * @description Pain level of client
 * @param painIndex 0-9
 */
export type TPainLevel = {
  painIndex: number;
  date: Date;
  submittedAt?: Date;
};
