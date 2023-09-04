import { TConditionId } from "../types/datatypes";

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
  "achilles-tendonitis": "Achilles Tendonitis",
  "no-condition": "No Condition",
};

export const conditionOptions = Object.entries(conditions).map(
  ([value, label]) => ({
    value,
    label,
  })
);
