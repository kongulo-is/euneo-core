import { Timestamp } from "firebase/firestore";
import { TOutcomeMeasureId } from "../outcomeMeasure/outcomeMeasure";

export type TOutcomeMeasureAnswerWrite = {
  date: Timestamp;
  outcomeMeasureId: TOutcomeMeasureId;
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
  // score: number;
  answers: {
    questionId: string;
    conditionalOption?: string; // a, b, c...
    value: number | number[] | null;
    type: "option" | "rating" | "boolean" | "multiple-choice" | "conditional";
  }[];
};
