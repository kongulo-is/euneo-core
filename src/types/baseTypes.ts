// export type TPrescriptionBase = {
//   prescriptionDate: Date;
//   status: TPrescriptionStatus;
// };

// export type TEuneoPrescription = TPrescriptionBase & {
//   euneoProgramId: TEuneoProgramId;
// };

// export type TPhysioPrescription = TPrescriptionBase & {
//   physioProgramId: string;
// };

export type TOutcomeMeasureId = "faam" | "sf-36" | "visa-a" | "promis";

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

export type TOutcomeMeasure = {
  id: TOutcomeMeasureId;
  name: string;
  acronym: string;
};

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
