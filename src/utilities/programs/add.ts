import { doc, DocumentReference, setDoc, collection } from "firebase/firestore";
import { db } from "../../firebase/db";
import {
  TProgramRead,
  TProgramPhaseKey,
  TProgramPhaseRead,
  TProgramDayKey,
  TProgramDayRead,
  TClinicianProgram,
  TProgramVersionWrite,
  TProgramWrite,
  TProgram,
  TEuneoProgram,
} from "../../types/programTypes";
import {
  programConverter,
  programDayConverter,
  programPhaseConverter,
} from "../converters";

export async function createVersionForDeprecatedProgram(
  program: TProgramRead,
  phases: Record<TProgramPhaseKey, TProgramPhaseRead>,
  days: Record<TProgramDayKey, TProgramDayRead>,
  clinicianId?: string,
  clinicianProgramId?: string
): Promise<TProgram> {
  try {
    if (clinicianId && clinicianProgramId) {
      const clinicianProgram = program as TClinicianProgram;
      const programRef = doc(
        db,
        "clinicians",
        clinicianId,
        "programs",
        clinicianProgramId
      ) as DocumentReference<TProgramVersionWrite>;
      console.log("programRef", programRef);

      const newProgramVersionRef = doc(
        programRef,
        "versions",
        "1.0"
      ) as DocumentReference<TProgramWrite>;
      console.log("newProgramVersionRef", newProgramVersionRef);
      console.log("HERE 1");

      // Update current version
      await setDoc(
        programRef,
        {
          currentVersion: newProgramVersionRef,
        },
        {
          merge: true,
        }
      );
      console.log("HERE 2");
      console.log("new currentVersion added!");
      // convert and create new program version.
      const programVersionConverted =
        programConverter.toFirestore(clinicianProgram);
      await setDoc(newProgramVersionRef, programVersionConverted);
      console.log("new program version created!");
      // create days and phases for new version
      const daysRef = collection(newProgramVersionRef, "days");

      await Promise.all(
        Object.keys(days).map((id) => {
          const dayId = id as `d${number}`;
          return setDoc(
            doc(daysRef.withConverter(programDayConverter), dayId),
            days[dayId],
            { merge: true }
          );
        })
      );
      console.log("days created!");

      const phasesRef = collection(newProgramVersionRef, "phases");

      await Promise.all(
        Object.keys(phases).map((id) => {
          const phaseId = id as `p${number}`;
          const phase = { ...phases[phaseId], programId: programRef.id };
          return setDoc(
            doc(phasesRef.withConverter(programPhaseConverter), phaseId),
            phase,
            { merge: true }
          );
        })
      );
      console.log("phases created!");
      return {
        ...clinicianProgram,
        phases,
        days,
      };
    } else {
      const euneoProgram = program as TEuneoProgram;
      const programRef = doc(
        db,
        "testPrograms",
        euneoProgram.euneoProgramId
      ) as DocumentReference<TProgramVersionWrite>;
      console.log("programRef", programRef);

      const newProgramVersionRef = doc(
        programRef,
        "versions",
        "1.0"
      ) as DocumentReference<TProgramWrite>;
      console.log("newProgramVersionRef", newProgramVersionRef);
      console.log("HERE 1");

      // Update current version
      await setDoc(programRef, {
        currentVersion: newProgramVersionRef,
        isConsoleLive: program.isConsoleLive || false,
        isLive: program.isLive || false
      });
      console.log("HERE 2");
      console.log("new currentVersion added!");
      // convert and create new program version.
      const programVersionConverted =
        programConverter.toFirestore(euneoProgram);
      await setDoc(newProgramVersionRef, programVersionConverted);
      console.log("new program version created!");
      // create days and phases for new version
      const daysRef = collection(newProgramVersionRef, "days");

      await Promise.all(
        Object.keys(days).map((id) => {
          const dayId = id as `d${number}`;
          return setDoc(
            doc(daysRef.withConverter(programDayConverter), dayId),
            days[dayId],
            { merge: true }
          );
        })
      );
      console.log("days created!");

      const phasesRef = collection(newProgramVersionRef, "phases");

      await Promise.all(
        Object.keys(phases).map((id) => {
          const phaseId = id as `p${number}`;
          const phase = { ...phases[phaseId], programId: programRef.id };
          return setDoc(
            doc(phasesRef.withConverter(programPhaseConverter), phaseId),
            phase,
            { merge: true }
          );
        })
      );
      console.log("phases created!");
      return {
        ...euneoProgram,
        phases,
        days,
      };
    }
  } catch (error) {
    console.error(
      "Error creating new version: ",
      error,
      program,
      days,
      clinicianProgramId,
      clinicianId
    );
  }
  throw new Error("Error updating clinician program");
}
