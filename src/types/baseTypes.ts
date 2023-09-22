export type TEuneoReferenceIds = {
  euneoProgramId: TEuneoProgramId;
};

export type TPhysioReferenceIds = {
  physioProgramId: string;
  physioId: string;
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

export type TExerciseType = "Stretch" | "Strength" | "Release" | "Other";

export type TOutcomeMeasureBase = {
  name: string;
  acronym: string;
};

export type TOutcomeMeasure = TOutcomeMeasureBase & {
  id: string;
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
  | "no-condition";

export type TEuneoProgramId = "plantar-heel-pain";

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

// TODO: Store this in app instead?
export type TGender = "male" | "female" | "other";
export type TPlatform = "ios" | "android" | "windows" | "macos" | "web";
export type TMeasurementUnit = "metric" | "imperial";
export type TPhysicalActivity = "none" | "low" | "moderate" | "high";

export type TReminder = {
  enabled: boolean;
  hour?: number;
  minute?: number;
};
