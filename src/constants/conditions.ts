import { TConditionId } from "../types/baseTypes";

type Conditions = Record<TConditionId, string>;

export const conditions: Conditions = {
  "plantar-heel-pain": "Plantar Heel Pain",
  "severs-disease": "Sever's disease",
  "plantar-fasciitis": "Plantar Fasciitis",
  "achilles-tendinopathy": "Achilles Tendinopathy",
  "osgood-schlatter-disease": "Osgood-Schlatter Disease",
  "ankle-sprain": "Ankle Sprain",
  // "no-condition": "No Condition",
};

export const conditionOptions = Object.entries(conditions).map(
  ([value, label]) => ({
    value,
    label,
  })
);
