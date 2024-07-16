import { DocumentData, DocumentReference } from "firebase/firestore";
import { Collection, TConditionId } from "../global";
import { TOutcomeMeasureId } from "../outcomeMeasure/outcomeMeasure";
import { TOutcomeMeasureAnswerWrite } from "./outcomeMeasureAnswer";


// Types Definitions
export type TClientProgramIdentifiers = {
  [Collection.Clients]: string;
  [Collection.Programs]: string;
};


// Write Type

export type TClientProgramWrite = {
  programRef: DocumentReference<TProgramWrite, DocumentData>;
  conditionId: TConditionId | null;
  outcomeMeasuresAnswers: Record<
    TOutcomeMeasureId,
    TOutcomeMeasureAnswerWrite[]
  > | null;
  painLevels: TPainLevelWrite[];
  conditionAssessmentAnswers?: Array<boolean | string>;
  trainingDays: boolean[];
  physicalInformation: TClientPhysicalInformation;
  phases: TPhase[];
  clinicianClientRef?: DocumentReference<TClinicianClientWrite, DocumentData>;
  completed?: boolean;
  shouldRefetch?: boolean;
};

// Main Type
export type TClientProgram 




// Serialization Functions
export function serializeClientProgramIdentifiers(
  obj: TClientProgramIdentifiers,
): string {
  return `${Collection.Clients}/${obj.clients}/${Collection.Programs}/${obj.programs}`;
}

export function deserializeClientProgramPath(
  path: string,
): TClientProgramIdentifiers {
  const [_clients, clientId, _programs, programId] = path.split("/");
  return {
    [Collection.Clients]: clientId,
    [Collection.Programs]: programId,
  };
}

// Converter
