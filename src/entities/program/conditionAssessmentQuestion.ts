import { TProgramPhaseKey } from "./programPhase";

export type TConditionAssessmentQuestion = {
  question: string;
  title: string;
  type: "boolean" | "option";
  options: string[];
  initialPhases?: { phaseId: TProgramPhaseKey; length?: number }[];
};
