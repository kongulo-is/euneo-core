import mixpanel from "mixpanel-browser";
import { TConditionId } from "../types/baseTypes";

mixpanel.init("797e64277a6a3f8fb37e98dc8c1ff223");

type EuneoMixpanelData = {
  event: "Prescription sent";
  data: {
    distinct_id: string;
    condition_id: TConditionId | null;
    clinician_id: string;
    program_id: string;
  };
};

export function mixpanelTrack({ event, data }: EuneoMixpanelData) {
  try {
    mixpanel.track(event, data);
  } catch (error) {
    console.error("Error tracking event", error, event, data);
  }
}
