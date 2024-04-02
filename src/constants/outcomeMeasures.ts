import { TOutcomeMeasureId } from "../types/clinicianTypes";

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
  pgq: {
    id: "pgq",
    name: "Patient Global Question",
    acronym: "PGQ",
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
