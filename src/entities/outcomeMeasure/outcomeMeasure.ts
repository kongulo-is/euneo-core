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

// export type TSectionGroupBase = {
//   title: string;
//   questions: string[];
// };

// export type TOptionsGroup = TSectionGroupBase & {
//   options: { option: string; value: number | null }[];
// };

// export type TRatingGroup = TSectionGroupBase & {
//   options: number[];
//   optionExplanation: string;
//   isSkippable?: boolean | null;
// };
// export type TSectionGroup = TOptionsGroup | TRatingGroup;

// export type TOutcomeMeasureSection = {
//   sectionName: string;
//   results: {
//     title: string;
//     description: string;
//   };
//   athlete: boolean;
//   groups: {
//     questions: {
//       title: string;
//       higherIsBetter: boolean;
//       options: string[];
//     }[];
//     options: { option: string; value: number | null } | number[];
//     title: string; // group title / description
//     optionExplanation: string;
//     isSkippable?: boolean | null;
//   }[];
// };

type TConditionalOption = {
  option: string;
  value: string; // a, b, c...
  subQuestionId: string;
};

type TConditionalQuestion = {
  id: string; // q1, q2, q3...
  title: string;
  optionsWithSubQuestions: TConditionalOption[];
  type: "conditional";
};

type TOption = {
  option: string;
  value: number | null;
};

type TQuestion = {
  id: string; // q1, q2, q3...
  title: string;
  higherIsBetter: boolean;
  type: "option" | "rating" | "boolean" | "multiple-choice";
  options: TOption[];
  optionExplanation: string;
  isSkippable?: boolean | null;
  maxPoints?: number | null;
};

type TGroup = {
  id: string; // g1, g2, g3...
  title: string; // group title / description
  questionIds: string[]; // q1, q2, q3... ()
};

type TConditionalSectionQuestion = {
  title: string;
  options: { option: string; value: boolean }[];
};

type TSection = {
  name: string;
  groups: TGroup[]; // g1, g2, g3...
  conditionalSectionQuestion?: TConditionalSectionQuestion | null;
};

export type TOutcomeMeasureBase = {
  name: string;
  acronym: string;
  instructions: string;
  expectedTime: string;
  sections: TSection[]; // sections
  isConsoleLive: boolean;
  maxPoints?: number | null; // total points
  scoringMethod?: "points" | "percentage" | null;
  formula?: string | null; //? maybe add this

  // Only used if there is a custom scoring order (questions are not scored in the same order as displayed)
  scoringSections?: {
    name: string;
    description: string;
    questionsIds: string[];
  }[];
};

export type TOutcomeMeasure = TOutcomeMeasureBase & {
  id: TOutcomeMeasureId;
};

export type TOutcomeMeasureWrite = TOutcomeMeasureBase;

export const outcomeMeasureConverter = {
  toFirestore(measure: TOutcomeMeasure): TOutcomeMeasureWrite {
    const { id, ...rest } = measure;
    const data: TOutcomeMeasureWrite = {
      ...rest,
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
      id: snapshot.id as TOutcomeMeasureId,
    };

    return measure;
  },
};
