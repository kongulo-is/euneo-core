import { Timestamp } from "firebase/firestore";
import { TOutcomeMeasureId } from "../outcomeMeasure/outcomeMeasure";

export type TOutcomeMeasureAnswerWrite = {
  date: Timestamp;
  outcomeMeasureId: TOutcomeMeasureId;
  // type: string | "foot&ankle";
  sections: TOutcomeMeasureAnswerSection[];
};

/**
 * @memberof TClientProgram
 * @description Assessment of client during program.
 * @param name (FAAM, SF-36, VISA-A, PROMIS,...)
 */
export type TOutcomeMeasureAnswers = {
  date: Date;
  outcomeMeasureId: TOutcomeMeasureId;
  // type: string | "foot&ankle";
  sections: TOutcomeMeasureAnswerSection[];
};

/**
 * @memberof TOutcomeMeasureAnswers
 * @description Assessment result and answers.
 * @param score 0-100%
 * @param answers array of answeres to questions (0-4)
 */
export type TOutcomeMeasureAnswerSection = {
  sectionName: string;
  score: number;
  answers: (number | null)[];
};
