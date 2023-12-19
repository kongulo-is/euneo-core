import { TEuneoProgramId } from "../types/baseTypes";

type Programs = Record<TEuneoProgramId, string>;

export const programs: Programs = {
  "plantar-heel-pain": "Plantar Heel Pain",
  "severs-disease": "Sever's disease",
  "plantar-fasciitis": "Plantar fasciitis",
  "achilles-tendinopathy": "Achilles tendinopathy",
  "osgood-schlatter-disease": "Osgood-Schlatter disease",
  "lateral-ankle-sprain": "Lateral ankle sprain",
  "knee-replacement": "Knee replacement",
};

export const programOptions = Object.entries(programs).map(
  ([value, label]) => ({
    value,
    label,
  })
);
