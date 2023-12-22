import mixpanel from "mixpanel-browser";
import { TConditionId } from "../types/baseTypes";
import { TClinician } from "../types/clinicianTypes";

mixpanel.init("797e64277a6a3f8fb37e98dc8c1ff223");

type EuneoMixpanelData = {
  event: "Prescription sent" | "Invitation";
  data: {
    distinct_id?: string;
    clinicianClient_id: string;
    condition_id: TConditionId | null;
    clinician_id: string;
    program_id: string;
  };
};

export function mixpanelTrack({ event, data }: EuneoMixpanelData) {
  console.log("mixpanelTrack", event, data);
  try {
    mixpanel.track(event, data);
  } catch (error) {
    console.error("Error tracking event", error, event, data);
  }
}

export function mixpanelIdentify(userId: string) {
  console.log("mixpanelIdentify", userId);
  try {
    mixpanel.identify(userId);
  } catch (error) {
    console.error("Error identifying user", error, userId);
  }
}

export function mixpanelAlias(userId: string) {
  console.log("mixpanelAlias", userId);
  try {
    mixpanel.alias(userId);
  } catch (error) {
    console.error("Error aliasing user", error, userId);
  }
}

export function mixpanelPeopleSet(userId: string, name: string, email: string) {
  try {
    mixpanel.people.set_once("$name", name);
    mixpanel.people.set_once("$email", email);
  } catch (error) {
    console.error("Error setting people", error, userId, name, email);
  }
}

export function mixpanelReset() {
  console.log("mixpanelReset");
  try {
    mixpanel.reset();
  } catch (error) {
    console.error("Error resetting mixpanel", error);
  }
}
