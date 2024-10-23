import { QueryDocumentSnapshot, SnapshotOptions } from "firebase/firestore";

export type TOutcomeMeasureId =
  | "faam"
  | "sf-36"
  | "visa-a"
  | "promis"
  | "odi"
  | "pgq"
  | "hoos"
  | "koos"
  | "lefs"
  | "spadi"
  | "wosi";

export type TConditionalOption = {
  option: string;
  value: string; // a, b, c...
  subQuestion: TQuestion;
};

export type TOption = {
  option: string;
  value: number | null;
};

export type TConditionalQuestion = {
  id: string; // q1, q2, q3...
  title: string;
  optionsWithSubQuestions: TConditionalOption[];
  type: "conditional";
  isSkippable?: boolean;
  excludeScore?: boolean; // when a quesiton is not used in total score calculation
};

type TRatingQuestion = TQuestionBase & {
  type: "rating";
  options: number[];
};

type TOptionQuestion = TQuestionBase & {
  type: "option";
  options: TOption[];
};

type TMultipleChoiceQuestion = TQuestionBase & {
  type: "multiple-choice";
  options: TOption[];
};

export type TInputQuestion = TQuestionBase & {
  type: "input";
  options?: TOption[];
  inputType: "number" | "year" | "text";
  min?: number;
  max?: number;
  placeHolder?: string;
};

type TQuestionBase = {
  id: string; // q1, q2, q3...
  title: string;
  reverseScore?: boolean; // flip score, maxPoints for question - score. (maxPoints good, 0 bad)
  optionExplanation?: string;
  isSkippable?: boolean | null; // skippable question, not the same as when there is a option to skip (e.g. option: "not applicable", value: null)
  maxPoints?: number | null;
  excludeScore?: boolean; // when a quesiton is not used in total score calculation
};

export type TQuestion =
  | TOptionQuestion
  | TMultipleChoiceQuestion
  | TRatingQuestion
  | TInputQuestion;

export type TSectionGroup = {
  title: string; // group title / description
  questionIds: string[]; // q1, q2, q3... ()
};

export type TOutcomeMeasureSection = {
  sectionName: string;
  id: string; // s1, s2, s3...
  groups: TSectionGroup[];
  results?: {
    title: string;
    description: string;
  } | null;
  conditionalSectionQuestion?: TConditionalSectionQuestion | null;
};

type TConditionalSectionQuestion = {
  description: string;
  questionId: string;
};

export type TScoringMethod = "points" | "percentage" | "adjusted" | null;

export type TOutcomeMeasureBase = {
  name: string;
  acronym: string;
  instructions: string;
  expectedTime: string;
  sections: TOutcomeMeasureSection[]; // sections
  isConsoleLive: boolean;
  maxPoints?: number | null; // total points
  scoringMethod: TScoringMethod | null;
  reverseScore?: boolean; // flip score, 100% - score. (100 good, 0 bad).
  higherIsBetter?: boolean; // Does the client want to score low or high on the om

  // Only used if there is a custom scoring order (questions are not scored in the same order as displayed)
  customScoringSections?: {
    sectionName: string;
    questionIds: string[];
    // description?: string;
  }[];
};

export type TOutcomeMeasure = TOutcomeMeasureBase & {
  questions: Record<string, TQuestion | TConditionalQuestion>;
  id: TOutcomeMeasureId;
};

export type TOutcomeMeasureWrite = TOutcomeMeasureBase & {
  questions: (TQuestion | TConditionalQuestion)[];
};

export const outcomeMeasureConverter = {
  toFirestore(measure: TOutcomeMeasure): TOutcomeMeasureWrite {
    const { id, ...rest } = measure;

    // convert questions of type record to array
    const questions = Object.values(measure.questions);

    const data: TOutcomeMeasureWrite = {
      ...rest,
      questions,
    };

    return data;
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot<TOutcomeMeasureWrite>,
    options: SnapshotOptions
  ): TOutcomeMeasure {
    const data = snapshot.data(options);

    const measure: TOutcomeMeasure = {
      ...data,
      questions: Object.fromEntries(
        data.questions.map((question) => [question.id, question])
      ),
      id: snapshot.id as TOutcomeMeasureId,
    };

    return measure;
  },
};
