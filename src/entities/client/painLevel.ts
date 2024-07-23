import { Timestamp } from "firebase/firestore";

export type TPainLevelWrite = {
  date: Timestamp;
  painIndex: number;
};

/**
 * @description Pain level of client
 * @param painIndex 0-9
 */
export type TPainLevel = {
  painIndex: number;
  date: Date;
};
