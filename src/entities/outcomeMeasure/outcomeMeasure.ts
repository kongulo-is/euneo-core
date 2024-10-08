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

type TConditionalOption = {
  option: string;
  value: string; // a, b, c...
  subQuestion: TQuestion;
};

type TOption = {
  option: string;
  value: number | null;
};

export type TConditionalQuestion = {
  id: string; // q1, q2, q3...
  title: string;
  optionsWithSubQuestions: TConditionalOption[];
  type: "conditional";
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
  // maxPoints?: number | null;
};

type TQuestionBase = {
  id: string; // q1, q2, q3...
  title: string;
  higherIsBetter: boolean;
  optionExplanation?: string;
  isSkippable?: boolean | null;
  maxPoints?: number | null;
};

export type TQuestion =
  | TOptionQuestion
  | TMultipleChoiceQuestion
  | TRatingQuestion;

// export type TConditionalQuestion

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
  conditionalSectionQuestionId?: string; // also sqx (section question id)
};

export type TOutcomeMeasureBase = {
  name: string;
  acronym: string;
  instructions: string;
  expectedTime: string;
  sections: TOutcomeMeasureSection[]; // sections
  isConsoleLive: boolean;
  maxPoints?: number | null; // total points
  scoringMethod?: "points" | "percentage" | "adjusted" | null;
  formula?: string | null; //? maybe add this

  // Only used if there is a custom scoring order (questions are not scored in the same order as displayed)
  customScoringSections?: {
    name: string;
    description: string;
    questionsIds: string[];
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
