import { Timestamp } from "firebase/firestore";
import { TOutcomeMeasureId } from "../outcomeMeasure/outcomeMeasure";

export type TOutcomeMeasureAnswersWrite = {
  date: Timestamp;
  outcomeMeasureId: TOutcomeMeasureId;
  answers: Record<string, TOutcomeMeasureAnswer>;
};

export type TOutcomeMeasureAnswers = {
  date: Date;
  outcomeMeasureId: TOutcomeMeasureId;
  answers: Record<string, TOutcomeMeasureAnswer>;
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
  questionId: string;
  value?: number | number[] | null;
};

//TODO: converters...
