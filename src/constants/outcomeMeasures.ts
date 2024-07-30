// import { TOutcomeMeasureId } from "../entities/outcomeMeasure/outcomeMeasure";

// export type TOutcomeMeasure = {
//   id: TOutcomeMeasureId;
//   name: string;
//   acronym: string;
// };

// type OutcomeMeasures = Record<TOutcomeMeasureId, TOutcomeMeasure>;

// export const outcomeMeasures: OutcomeMeasures = {
//   faam: {
//     id: "faam",
//     name: "Foot and Ankle Ability Measure",
//     acronym: "FAAM",
//   },
//   "sf-36": {
//     id: "sf-36",
//     name: "Short Form 36",
//     acronym: "SF-36",
//   },
//   "visa-a": {
//     id: "visa-a",
//     name: "Victorian Institute of Sport Assessment-Achilles",
//     acronym: "VISA-A",
//   },
//   promis: {
//     id: "promis",
//     name: "Patient-Reported Outcomes Measurement Information System",
//     acronym: "PROMIS",
//   },
//   odi: {
//     id: "odi",
//     name: "Oswestry Disability Index",
//     acronym: "ODI",
//   },
//   pgq: {
//     id: "pgq",
//     name: "Patient Global Question",
//     acronym: "PGQ",
//   },
//   hoos: {
//     id: "hoos",
//     name: "Hip disability and Osteoarthritis Outcome Score",
//     acronym: "HOOS",
//   },
//   koos: {
//     id: "koos",
//     name: "Knee injury and Osteoarthritis Outcome Score",
//     acronym: "KOOS",
//   },
//   lefs: {
//     id: "lefs",
//     name: "Lower Extremity Functional Scale",
//     acronym: "LEFS",
//   },
// };

// export const outcomeMeasureOptions = Object.entries(outcomeMeasures).map(
//   ([value, measure]) => ({
//     value,
//     label: measure.name,
//   }),
// );

// export const outcomeMeasureIdEnum = Object.keys(outcomeMeasures) as [
//   keyof typeof outcomeMeasures,
// ];
