import { TConditionId } from "../entities/global";

export type TEuneoMixpanelData =
  | {
      event: "Prescription sent";
      data: {
        distinct_id: string;
        condition_id: TConditionId | null;
        clinician_id: string;
        program_id: string;
      };
    }
  | {
      event: "Prescription code activated";
      data: {
        distinct_id?: string;
        condition_id: TConditionId | null;
        clinician_id: string;
        program_id: string;
        client_id: string;
      };
    };
