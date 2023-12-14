import { TConditionId } from "../types/baseTypes";

type Conditions = Record<TConditionId, string>;

export const conditions: Conditions = {
  "plantar-heel-pain": "Plantar Heel Pain",
  "acl-treatment": "ACL Treatment",
  "pulled-hamstring": "Pulled Hamstring",
  "calf-injury": "Calf Injury",
  "hip-replacement": "Hip Replacement",
  "dislocated-shoulder": "Dislocated Shoulder",
  "post-surgery": "Post Surgery",
  "ankle-sprain": "Ankle Sprain",
  "knee-replacement": "Knee Replacement",
  "severs-disease": "Sever's disease",
  "plantar-fasciitis": "Plantar Fasciitis",
  "achilles-tendinopathy": "Achilles Tendinopathy",
  "patellar-tendinopathy": "Patellar Tendinopathy",
  "osgood-schlatter-disease": "Osgood Schlatter Disease",
  // "no-condition": "No Condition",
};

export const conditionOptions = Object.entries(conditions).map(
  ([value, label]) => ({
    value,
    label,
  })
);
