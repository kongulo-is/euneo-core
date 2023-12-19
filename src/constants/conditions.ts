import { TConditionId } from "../types/baseTypes";

type Conditions = Record<TConditionId, string>;

export const conditions: Conditions = {
  "plantar-heel-pain": "Plantar Heel Pain",
  "severs-disease": "Sever's disease",
  "plantar-fasciitis": "Plantar fasciitis",
  "achilles-tendinopathy": "Achilles tendinopathy",
  "osgood-schlatter-disease": "Osgood-Schlatter disease",
  "ankle-sprain": "Ankle sprain",
  "knee-replacement": "Knee replacement",
  // "no-condition": "No Condition",
};

export const conditionOptions = Object.entries(conditions).map(
  ([value, label]) => ({
    value,
    label,
  })
);
