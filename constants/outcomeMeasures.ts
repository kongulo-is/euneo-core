import { OutcomeMeasuresId } from "../types/dataTypes";

export type TOutcomeMeasure = {
  id: string;
  name: string;
  acronym: string;
};

type OutcomeMeasures = Record<OutcomeMeasuresId, TOutcomeMeasure>;

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
};

export const outcomeMeasureOptions = Object.entries(outcomeMeasures).map(
  ([value, measure]) => ({
    value,
    label: measure.name,
  })
);
