import { Timestamp } from "firebase/firestore";
import { TOutcomeMeasureId } from "../outcomeMeasure/outcomeMeasure";

type TQuestionId = string;

export type TOutcomeMeasureAnswersWrite = {
  date: Timestamp;
  outcomeMeasureId: TOutcomeMeasureId;
  answers: Record<TQuestionId, TOutcomeMeasureAnswer>;
};

export type TSectionScoring = {
  sectionName: string;
  maxPoints: number;
  scoredPoints: number;
  percentScore: number;
  questionIds: TQuestionId[]; // questionIds of questions in section, not nessecaraly in the same order as displayed
};

export type TOutcomeMeasureAnswers = {
  date: Date;
  outcomeMeasureId: TOutcomeMeasureId;
  answers: Record<TQuestionId, TOutcomeMeasureAnswer>;
  scoredPoints?: number; // sum of all answered questions points
  maxPoints?: number; // max points of all answered questions or maxPoint given from OM.
  percentScore?: number; // scoredPoints / maxPoints
  sectionScorings?: TSectionScoring[];
  customScoring?: boolean; // if true, questionIds are not scored in the same order as displayed
};

export type TOutcomeMeasureAnswer =
  | TOutcomeMeasureStandardAnswer
  | TOutcomeMeasureConditionalAnswer;

type TOutcomeMeasureStandardAnswer = TOutcomeMeasureAnswerBase & {
  type: "option" | "rating" | "multiple-choice";
};

type TOutcomeMeasureConditionalAnswer = TOutcomeMeasureAnswerBase & {
  conditionalValue?: string; // a, b, c...
  type: "conditional";
  subtype?: "option" | "rating" | "multiple-choice";
};

type TOutcomeMeasureAnswerBase = {
  value?: number | number[] | null;
};

//TODO: converters...
