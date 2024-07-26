// import { conditions } from "../constants/conditions";

// import { isEmptyObject } from "./basicHelpers";
// import { TConditionId } from "../entities/global";
// import { TOutcomeMeasureId } from "../entities/outcomeMeasure/outcomeMeasure";
// import { TClinicianProgram } from "../entities/program/program";
// import { TOutcomeMeasureAnswers } from "../entities/client/outcomeMeasureAnswer";
// import { TPainLevel } from "../entities/client/painLevel";
// import { TClientProgramDay } from "../entities/client/day";
// import { TPhase } from "../entities/client/phase";
// import { TConditionAssessmentAnswer } from "../entities/client/conditionAssessmentAnswer";
// import { TClientPhysicalInformation } from "../entities/client/physicalInformation";
// import { TClientProgram, TClientProgramRead } from "../entities/client/clientProgram";
// import { TProgramDayExercise, TProgramDayKey } from "../entities/program/programDay";
// import { TConditionAssessmentQuestion } from "../entities/program/conditionAssessmentQuestion";

// const assertTConditionId = (id: TConditionId | null): void => {
//   const validIds = Object.keys(conditions);
//   if (id !== null && !validIds.includes(id))
//     throw new Error(`Invalid TConditionId: ${id}`);
// };

// const assertTOutcomeMeasureAnswers = (obj: TOutcomeMeasureAnswers): void => {
//   if (
//     !obj ||
//     !(obj.date instanceof Date) ||
//     typeof obj.outcomeMeasureId !== "string" ||
//     !Array.isArray(obj.sections)
//   ) {
//     throw new Error("Invalid TOutcomeMeasureAnswers");
//   }
// };

// const assertTPainLevel = (obj: TPainLevel): void => {
//   if (
//     !obj ||
//     typeof obj.painIndex !== "number" ||
//     !(obj.date instanceof Date)
//   ) {
//     throw new Error("Invalid TPainLevel");
//   }
// };

// const assertTClientProgramDay = (obj: TClientProgramDay): void => {
//   if (
//     !obj ||
//     typeof obj.dayId !== "string" ||
//     !(obj.date instanceof Date) ||
//     typeof obj.finished !== "boolean"
//   ) {
//     throw new Error("Invalid TClientProgramDay");
//   }
// };

// const assertTPhase = (obj: TPhase): void => {
//   if (!obj || typeof obj.key !== "string" || typeof obj.value !== "number") {
//     throw new Error("Invalid TPhase");
//   }
// };

// const assertConditionAssessmentAnswer = (
//   answer: TConditionAssessmentAnswer,
// ): void => {
//   if (typeof answer !== "boolean" && typeof answer !== "string") {
//     throw new Error("Invalid TConditionAssessmentAnswer");
//   }
// };

// const assertTClientPhysicalInformation = (
//   obj: TClientPhysicalInformation,
// ): void => {
//   if (
//     !obj ||
//     typeof obj.athlete !== "boolean" ||
//     typeof obj.height !== "number"
//   ) {
//     throw new Error("Invalid TClientPhysicalInformation");
//   }
// };

// const assertTypeString = (val: any, fieldName: string): void => {
//   if (typeof val !== "string") {
//     throw new Error(`assertTypeString: Invalid ${fieldName}`);
//   }
// };

// type AssertFunction<T> = (item: T, fieldName: string) => void;

// const assertArray = <T>(
//   arr: any[],
//   assertFunc: AssertFunction<T>,
//   fieldName: string,
// ): void => {
//   if (
//     !Array.isArray(arr) ||
//     !arr.every((item) => {
//       try {
//         assertFunc(item, fieldName);
//         return true;
//       } catch {
//         return false;
//       }
//     })
//   ) {
//     throw new Error(`assertArray: Invalid ${fieldName}`);
//   }
// };

// const runtimeChecks = {
//   assertTClientProgram(
//     obj: TClientProgram | TClientProgramRead,
//     write?: boolean,
//   ): void {
//     if (
//       (!obj ||
//         ("clientProgramId" in obj &&
//           typeof obj.clientProgramId !== "string")) &&
//       !write
//     ) {
//       throw new Error("Invalid TClientProgram");
//     }

//     // assertTConditionId(obj.conditionId as TConditionId);

//     // Handle the union type
//     if ("clinicianProgramId" in obj) {
//       assertTypeString(obj.clinicianProgramId, "clinicianProgramId");
//       assertTypeString(obj.clinicianId, "clinicianId");
//     } else if ("programId" in obj) {
//       assertTypeString(obj.programId, "programId");
//       obj.conditionAssessmentAnswers &&
//         assertArray(
//           obj.conditionAssessmentAnswers,
//           assertConditionAssessmentAnswer,
//           "conditionAssessmentAnswers",
//         );
//     }

//     if (
//       obj.outcomeMeasuresAnswers &&
//       !isEmptyObject(obj.outcomeMeasuresAnswers)
//     ) {
//       Object.keys(obj.outcomeMeasuresAnswers).forEach((measureId) => {
//         const measureAnswers =
//           obj.outcomeMeasuresAnswers![measureId as TOutcomeMeasureId];
//         assertArray(
//           measureAnswers,
//           assertTOutcomeMeasureAnswers,
//           `outcomeMeasuresAnswers.${measureId}`,
//         );
//       });
//     }
//     assertArray(obj.painLevels, assertTPainLevel, "painLevels");
//     "days" in obj && assertArray(obj.days, assertTClientProgramDay, "days");

//     if ("phases" in obj && obj.phases !== undefined) {
//       assertArray(obj.phases, assertTPhase, "phases");
//     }

//     if (obj.physicalInformation !== undefined) {
//       assertTClientPhysicalInformation(obj.physicalInformation);
//     }
//   },
//   assertTClinicianProgram(obj: TClinicianProgram): void {
//     assertTypeString(obj.name, "name");
//     assertTypeString(obj.clinicianProgramId, "clinicianProgramId");
//     assertTypeString(obj.clinicianId, "clinicianId");
//     // assertTypeString(obj.mode, "mode");

//     obj.conditionId && assertTConditionId(obj.conditionId);

//     if (obj.outcomeMeasureIds) {
//       assertArray<string>(
//         obj.outcomeMeasureIds,
//         assertTypeString,
//         "outcomeMeasureIds",
//       );
//     }

//     if (obj.conditionAssessment) {
//       assertArray<TConditionAssessmentQuestion>(
//         obj.conditionAssessment,
//         (item: TConditionAssessmentQuestion) => {
//           assertTypeString(item.question, "question");
//           assertTypeString(item.title, "title");
//           assertTypeString(item.type, "type");
//           assertArray<string>(item.options, assertTypeString, "options");
//         },
//         "conditionAssessment",
//       );
//     }

//     Object.keys(obj.days).forEach((dayKey: string) => {
//       const day = obj.days[dayKey as TProgramDayKey];
//       assertArray<TProgramDayExercise>(
//         day.exercises,
//         (exercise: TProgramDayExercise) => {
//           assertTypeString(exercise.exerciseId, "exerciseId");
//           if (
//             typeof exercise.time !== "number" ||
//             typeof exercise.sets !== "number" ||
//             typeof exercise.reps !== "number"
//           ) {
//             throw new Error("Invalid TProgramDayExercise");
//           }
//         },
//         "exercises",
//       );
//     });
//   },
// };

// export default runtimeChecks;
