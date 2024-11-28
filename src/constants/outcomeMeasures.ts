// import { TOutcomeMeasureId } from "../entities/outcomeMeasure/outcomeMeasure";

import { TOutcomeMeasureId } from "../entities/outcomeMeasure/outcomeMeasure";

// This is used for trigger in console

export type TOutcomeMeasure = {
  id: TOutcomeMeasureId;
  name: string;
  acronym: string;
};

type OutcomeMeasures = Record<TOutcomeMeasureId, TOutcomeMeasure>;

export const outcomeMeasures: OutcomeMeasures = {
  faam: {
    id: "faam",
    name: "Foot and Ankle Ability Measure",
    acronym: "FAAM",
  },
  "sf-36": {
    id: "sf-36",
    name: "Short Form 36",
    acronym: "SF-36",
  },
  "visa-a": {
    id: "visa-a",
    name: "Victorian Institute of Sport Assessment-Achilles",
    acronym: "VISA-A",
  },
  promis: {
    id: "promis",
    name: "Patient-Reported Outcomes Measurement Information System",
    acronym: "PROMIS",
  },
  odi: {
    id: "odi",
    name: "Oswestry Disability Index",
    acronym: "ODI",
  },
  pgq: {
    id: "pgq",
    name: "Patient Global Question",
    acronym: "PGQ",
  },
  hoos: {
    id: "hoos",
    name: "Hip disability and Osteoarthritis Outcome Score",
    acronym: "HOOS",
  },
  koos: {
    id: "koos",
    name: "Knee injury and Osteoarthritis Outcome Score",
    acronym: "KOOS",
  },
  lefs: {
    id: "lefs",
    name: "Lower Extremity Functional Scale",
    acronym: "LEFS",
  },
  spadi: {
    id: "spadi",
    name: "Shoulder Pain and Disability Index",
    acronym: "SPADI",
  },
  wosi: {
    id: "wosi",
    name: "Western Ontario Shoulder Instability Index",
    acronym: "WOSI",
  },
  rmdq: {
    id: "rmdq",
    name: "Roland Morris Disability Questionnaire",
    acronym: "RMDQ",
  },
  csi: {
    id: "csi",
    name: "Central Sensitization Inventory",
    acronym: "CSI",
  },
  dash: {
    id: "dash",
    name: "Disabilities of the Arm, Shoulder and Hand",
    acronym: "DASH",
  },
  uefi: {
    id: "uefi",
    name: "Upper Extremity Functional Index",
    acronym: "UEFI",
  },
  worc: {
    id: "worc",
    name: "Western Ontario Rotator Cuff Index",
    acronym: "WORC",
  },
  ndi: {
    id: "ndi",
    name: "Neck Disability Index",
    acronym: "NDI",
  },
};

export const outcomeMeasureOptions = Object.entries(outcomeMeasures).map(
  ([value, measure]) => ({
    value,
    label: measure.name,
  })
);

export const outcomeMeasureIdEnum = Object.keys(outcomeMeasures) as [
  keyof typeof outcomeMeasures,
];
