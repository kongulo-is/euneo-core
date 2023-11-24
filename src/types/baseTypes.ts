import { TOutcomeMeasureId } from "./clinicianTypes";

export type TEuneoReferenceIds = {
  euneoProgramId: TEuneoProgramId;
};

export type TClinicianReferenceIds = {
  clinicianProgramId: string;
  clinicianId: string;
};

// Component types
// export type TOption = {
//   value: string;
//   label: string;
// };

// export type TChartPoint = {
//   day: Date;
//   value: number;
// };

// export type TBarChartPoint = {
//   day: Date;
//   sections: {
//     type: string;
//     value: number;
//   }[];
// };

export type TExerciseField = "Sets" | "Reps" | "Time";

export type TExerciseType =
  | "Strength"
  | "Planks"
  | "Mobility"
  | "Stretch"
  | "Release"
  | "Balance"
  | "Jumps"
  | "Taping";

/**
 * @description Exercise in exercise collection
 * @param steps Instructions for the exercise
 * @param tips Tips for the exercise
 * @param displayID url video
 * @param assetID id of video in mux
 */
export type TExercise = {
  id: string;
  variation: string;
  description: string;
  startPreview: number;
  thumbnailTimestamp: number;
  name: string;
  steps: string[];
  tips: string[];
  videoLink: {
    displayID: string;
    assetID: string;
  };
  defaultSets: number | null;
  defaultReps: number | null;
  defaultTime: number | null;
  type: TExerciseType;
  editableFields: TExerciseField[];
};

export type TSectionGroup = {
  title: string;
  options: { option: string; value: number | null }[]; // TODO: Skoða týpu
  questions: string[];
};

export type TOutcomeMeasureSection = {
  sectionName: string;
  results: {
    title: string;
    description: string;
  };
  athlete: boolean;
  groups: TSectionGroup[];
};

export type TOutcomeMeasureBase = {
  name: string;
  acronym: string;
  instructions: string;
  expectedTime: string;
  higherIsBetter: boolean;
  sections: TOutcomeMeasureSection[];
};

export type TOutcomeMeasure = TOutcomeMeasureBase & {
  id: TOutcomeMeasureId;
};

export type TOutcomeMeasureWrite = TOutcomeMeasureBase;

export type TConditionId =
  | "plantar-heel-pain"
  | "acl-treatment"
  | "pulled-hamstring"
  | "calf-injury"
  | "hip-replacement"
  | "dislocated-shoulder"
  | "post-surgery"
  | "ankle-sprain"
  | "knee-replacement"
  | "achilles-tendonitis"
  | "severs-disease";
// | "no-condition";

export type TEuneoProgramId =
  | "plantar-heel-pain"
  | "plantar-heel-pain-2.0"
  | "plantar-heel-pain-3.0";

// ! Write types

export type TExerciseWrite = {
  description: string;
  variation: string;
  startPreview: number;
  thumbnailTimestamp: number;
  name: string;
  steps: string[];
  tips: string[];
  videoLink: {
    displayID: string;
    assetID: string;
  };
  defaultSets: number | null;
  defaultReps: number | null;
  defaultTime: number | null;
  type: TExerciseType;
  editableFields: TExerciseField[];
};

export type TGender = "male" | "female" | "other";
export type TPlatform = "ios" | "android" | "windows" | "macos" | "web";
export type TMeasurementUnit = "metric" | "imperial";
export type TPhysicalActivity = "none" | "low" | "moderate" | "high";

export type TReminder = {
  enabled: boolean;
  hour?: number;
  minute?: number;
};

export type TFeedbackAnswer = {
  question: string;
  description: string;
  answer: string | number;
};
