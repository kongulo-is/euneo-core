import { Timestamp } from "firebase/firestore";
import { TOutcomeMeasureId } from "../outcomeMeasure/outcomeMeasure";

type TQuestionId = string;

type TOutcomeMeasureAnswersBase = {
  outcomeMeasureId: TOutcomeMeasureId;
  answers: Record<TQuestionId, TOutcomeMeasureAnswer | null>;
  scoredPoints: number; // sum of all answered questions points
  maxPoints: number; // max points of all answered questions or maxPoint given from OM.
  percentageScore: number; // scoredPoints / maxPoints
  sectionScorings: TSectionScoring[];
  customScoring?: boolean;
  scoringMethod?: "points" | "percentage" | "adjusted" | null;
};

export type TOutcomeMeasureAnswersWrite = TOutcomeMeasureAnswersBase & {
  date: Timestamp;
};

export type TSectionScoring = {
  sectionName: string;
  maxPoints: number;
  scoredPoints: number;
  percentageScore: number;
  questionIds: TQuestionId[]; // questionIds of questions in section, not nessecaraly in the same order as displayed
  skipped: boolean;
};

export type TOutcomeMeasureAnswers = TOutcomeMeasureAnswersBase & {
  date: Date;
};

export type TOutcomeMeasureAnswer =
  | TOutcomeMeasureStandardAnswer
  | TOutcomeMeasureConditionalAnswer;
// | TOutcomeMeasureInputAnswer;

export type TOutcomeMeasureStandardAnswer = TOutcomeMeasureAnswerBase & {
  type: "option" | "rating" | "multiple-choice" | "input";
};

// export type TOutcomeMeasureInputAnswer = TOutcomeMeasureAnswerBase & {
//   type: "input";
//   input?: string | null;
// };

export type TOutcomeMeasureConditionalAnswer = TOutcomeMeasureAnswerBase & {
  conditionalValue?: string; // a, b, c...
  type: "conditional";
  subtype?: "option" | "rating" | "multiple-choice" | "input";
};

type TOutcomeMeasureAnswerBase = {
  value?: number | number[] | null;
  input?: string | null;
};

//TODO: converters...
