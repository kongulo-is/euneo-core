// // import mixpanel from "mixpanel-browser";
// const mixpanel = process.env.PROJECT === "Web" && require("mixpanel-browser");

// import { TConditionId } from "../types/baseTypes";

// // only init if not app
// if (mixpanel) {
//   mixpanel.init("797e64277a6a3f8fb37e98dc8c1ff223");
// }

// type EuneoMixpanelData =
//   | {
//       event: "Prescription sent";
//       data: {
//         distinct_id: string;
//         condition_id: TConditionId | null;
//         clinician_id: string;
//         program_id: string;
//       };
//     }
//   | {
//       event: "Prescription code activated";
//       data: {
//         distinct_id: string;
//         condition_id: TConditionId | null;
//         clinician_id: string;
//         program_id: string;
//         client_id: string;
//       };
//     };

// export function mixpanelTrack({ event, data }: EuneoMixpanelData) {
//   try {
//     mixpanel.track(event, data);
//   } catch (error) {
//     console.error("Error tracking event", error, event, data);
//   }
// }

// // export function mixpanelAlias({
// //   distinct_id,
// //   alias,
// // }: {
// //   distinct_id: string;
// //   alias: string;
// // }) {
// //   try {
// //     mixpanel.alias(alias, distinct_id);
// //   } catch (error) {
// //     console.error("Error aliasing", error, distinct_id, alias);
// //   }
// // }

// // export function mixpanelIdentify({ distinct_id }: { distinct_id: string }) {
// //   try {
// //     mixpanel.identify(distinct_id);
// //   } catch (error) {
// //     console.error("Error identifying", error, distinct_id);
// //   }
// // }

// // export function mixpanelSetUser({
// //   distinct_id,
// //   data,
// // }: {
// //   distinct_id: string;
// //   data: any;
// // }) {
// //   try {
// //     mixpanel.people.set(distinct_id, data);
// //   } catch (error) {
// //     console.error("Error setting user", error, distinct_id, data);
// //   }
// // }
