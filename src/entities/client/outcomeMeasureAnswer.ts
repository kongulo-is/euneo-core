import { Timestamp } from "firebase/firestore";
import { TOutcomeMeasureId } from "../outcomeMeasure/outcomeMeasure";

type TQuestionId = string;

export type TOutcomeMeasureAnswersWrite = TOutcomeMeasureAnswersBase & {
  date: Timestamp;
};

export type TOutcomeMeasureAnswers = TOutcomeMeasureAnswersBase & {
  date: Date;
};

type TOutcomeMeasureAnswersBase = {
  outcomeMeasureId: TOutcomeMeasureId;
  answers: Record<TQuestionId, TOutcomeMeasureAnswer | null>;
  scoredPoints: number; // sum of all answered questions points
  maxPoints: number; // max points of all answered questions or maxPoint given from OM. (null when converting old answers)
  percentageScore: number; //%
  sectionScorings: TSectionScoring[];
  customScoring?: boolean;
  scoringMethod: "points" | "percentage" | "adjusted" | null;
};

export type TSectionScoring = {
  sectionName: string;
  maxPoints: number;
  scoredPoints: number;
  percentageScore: number;
  questionIds: TQuestionId[]; // questionIds of questions in section, not necessarily in the same order as displayed
  skipped: boolean;
  notScored?: boolean;
};

// Base type for an answer
export type TOutcomeMeasureAnswerBase = {
  value?: number | null;
  input?: string | null;
};

export type TOutcomeMeasureAnswer =
  | TOutcomeMeasureStandardAnswer
  | TOutcomeMeasureMultipleChoiceAnswer
  | TOutcomeMeasureConditionalAnswer;

export type TOutcomeMeasureStandardAnswer = TOutcomeMeasureAnswerBase & {
  type: "option" | "rating" | "input";
};

export type TOutcomeMeasureMultipleChoiceAnswer = Omit<
  TOutcomeMeasureAnswerBase,
  "value"
> & {
  value?: number[] | null;
  type: "multiple-choice";
};

// export type TOutcomeMeasureMultipleChoiceAnswer = TOutcomeMeasureAnswerBase & {
//   value?: number[] | null; // Overriding the value type from the base
//   type: "multiple-choice";
// };

export type TOutcomeMeasureConditionalAnswer = TOutcomeMeasureAnswerBase & {
  type: "conditional";
};

type TQuestiontype =
  | "option"
  | "rating"
  | "multiple-choice"
  | "input"
  | "conditional";

//! deprecated --------

export type TOutcomeMeasureAnswersOld = {
  date: Date;
  outcomeMeasureId: TOutcomeMeasureId;
  sections: TOutcomeMeasureAnswerSectionOld[];
};

export type TOutcomeMeasureAnswerSectionOld = {
  sectionName: string;
  score: number;
  answers: (number | null)[];
};
