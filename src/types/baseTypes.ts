import { TOutcomeMeasureId } from "./clinicianTypes";

export type TEuneoReferenceIds = {
  euneoProgramId: TEuneoProgramId;
};

export type TClinicianReferenceIds = {
  clinicianProgramId: string;
  clinicianId: string;
};

export type TClinicianClientReferenceIds = {
  clinicianClientId: string;
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

// TODO: Add more types
export type TExerciseSubType = "Static stretch" | "AROM" | "Isometric";

// TODO: Add more types
export type TMuscleGroup = "Forearms" | "Back" | "Deltoids" | "Arms";

// Muscles involved
// TODO: Add more types
export type TMuscle = "Rectus femoris" | "Extensor digitorum longus";

// TODO: Add more types
export type TExerciseArea = "Pelvic floor" | "Shoulder" | "Hip";

// Equipment needed
// TODO: Add more types
export type TEquipment = "Box" | "Weights";

export type TExercise = {
  id: string;
  name: string;
  otherNames: string[] | null; //? Breyta í synonyms?
  primaryTypes: TExerciseType[] | null;
  secondaryTypes: TExerciseType[] | null;
  subTypes: TExerciseSubType[] | null;
  variation: string | null;
  //TODO: Fara yfir með Dan
  //primaryMuscleGroups: TMuscleGroup[]; // Primary muscle groups //? Not the same types in muscle groups and primary muscle groups??
  //muscleGroups: TMuscleGroup[]; // All muscle groups
  isolatedMuscles: TMuscle[] | null; // Isolated muscles
  muscles: TMuscle[] | null; // All muscles involved
  primaryAreas: TExerciseArea[] | null;
  secondaryAreas: TExerciseArea[] | null;
  equipmentNeeded: TEquipment[] | null;
  keyWords: string[] | null;
  instructions?: string | null;
  defaultSets: number | null;
  defaultReps: number | null;
  defaultTime: number | null;
  editableFields: TExerciseField[];
  isConsoleLive: boolean;
  clinicianId?: string;
  isArchived?: boolean;
  //* Video related types
  startPreview: number | null;
  thumbnailTimestamp: number | null;
  videoLink: {
    displayID: string;
    assetID: string;
  };

  tips: string[] | null; //? Maybe deprecated

  /**
   * @deprecated use `instructions` instead
   */
  description: string; //? OLD field
  /**
   * @deprecated use `instructions` instead
   */
  steps: string[]; //? OLD Field
  /**
   * @deprecated use `primaryTypes` instead
   */
  type: TExerciseType; //? OLD Field
};

export type TSectionGroup = {
  title: string;
  options: { option: string; value: number | null }[];
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
  | "achilles-rupture"
  | "achilles-tendinopathy"
  | "adductor-strain"
  | "adductor-tendon-rupture"
  | "adductor-tendinopathy"
  | "ankle-fracture"
  | "ankle-impingement"
  | "ankle-osteoarthritis"
  | "ankle-sprain"
  | "anterior-cruciate-ligament-injury"
  | "bursitis"
  | "calf-muscle-strain"
  | "heel-spurs"
  | "chondromalacia-patella"
  | "chronic-ankle-instability"
  | "fat-pad-syndrome"
  | "femoral-fracture"
  | "greater-trochanteric-pain-syndrome"
  | "gluteal-tendinopathy"
  | "gluteal-strain"
  | "hamstring-strain"
  | "hamstring-tendon-tear"
  | "hamstring-tendinopathy"
  | "hernia"
  | "hip-fracture"
  | "hip-impingement"
  | "hip-osteoarthritis"
  | "hip-replacement"
  | "iliotibial-band-syndrome"
  | "iliopsoas-tendinopathy"
  | "iliopsoas-strain"
  | "labral-tear"
  | "lateral-collateral-ligament-injury"
  | "lisfranc-injury"
  | "lower-back-pain"
  | "medial-collateral-ligament-injury"
  | "meniscus-tear"
  | "metatarsal-fracture"
  | "mortons-neuroma"
  | "osgood-schlatter-disease"
  | "osteoporosis"
  | "osteochondritis-dissecans"
  | "patellar-dislocation"
  | "patellar-fracture"
  | "patellar-tendinopathy"
  | "patellofemoral-pain-syndrome"
  | "peroneal-tendinopathy"
  | "piriformis-syndrome"
  | "plantar-fasciitis"
  | "plantar-heel-pain"
  | "popliteus-strain"
  | "popliteus-tendinopathy"
  | "posterior-cruciate-ligament-injury"
  | "quadriceps-contusion"
  | "quadriceps-strain"
  | "quadriceps-tendon-tear"
  | "sciatica"
  | "severs-disease"
  | "shin-splints"
  | "stress-fracture"
  | "sports-hernia"
  | "tarsal-tunnel-syndrome"
  | "turf-toe"
  | "knee-replacement";

export type TEuneoProgramId =
  | "plantar-heel-pain"
  | "severs-disease"
  | "plantar-fasciitis"
  | "achilles-tendinopathy"
  | "osgood-schlatter-disease"
  | "lateral-ankle-sprain"
  | "knee-replacement";

// ! Write types

export type TExerciseWrite = {
  // TODO: þarf að vera á meðan gamla programmið er inni
  description: string;
  variation: string;
  startPreview: number;
  thumbnailTimestamp: number;
  name: string;
  steps: string[];
  instructions?: string;
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
  isConsoleLive: boolean;
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
