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

export type TExerciseType =
  | "Stretch"
  | "Strength"
  | "Release"
  | "Balance"
  | "Planks"
  | "MobilityTime"
  | "MobilityReps"
  | "Massage"
  | "Jumps"
  | "Taping"
  | "Other"; //TODO: remove other when all exercises have the new types in database

/**
 * @description Exercise in exercise collection
 * @param steps Instructions for the exercise
 * @param tips Tips for the exercise
 * @param displayID url video
 * @param assetID id of video in mux
 */
export type TExercise = {
  id: string;
  description: string;
  name: string;
  steps: string[];
  tips: string[];
  videoLink: {
    displayID: string;
    assetID: string;
  };
  type: TExerciseType;
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
  name: string;
  steps: string[];
  tips: string[];
  videoLink: {
    displayID: string;
    assetID: string;
  };
  type: TExerciseType;
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
