import { TEuneoProgramId } from "../types/baseTypes";

type Programs = Record<TEuneoProgramId, string>;

export const programs: Programs = {
  "plantar-heel-pain": "Plantar Heel Pain",
  "severs-disease": "Sever's disease",
  "plantar-fasciitis": "Plantar Fasciitis",
  "achilles-tendinopathy": "Achilles Tendinopathy",
  "osgood-schlatter-disease": "Osgood-Schlatter Disease",
  "ankle-sprain": "Ankle Sprain",
};

export const programOptions = Object.entries(programs).map(
  ([value, label]) => ({
    value,
    label,
  })
);
