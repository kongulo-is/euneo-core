import {
  doc,
  DocumentReference,
  collection,
  getDocs,
  getDoc,
} from "firebase/firestore";
import { db } from "../../../firebase/db";
import {
  TClinicianProgram,
  TClinicianProgramVersion,
  TProgramBase,
  TProgramDayKey,
  TProgramPhaseKey,
  TProgramWrite,
} from "../../../types/programTypes";
import {
  programConverter,
  programDayConverter,
  programPhaseConverter,
  programVersionConverter,
} from "../../converters";
import { _getProgramFromRef } from "../../programHelpers";
import { upgradeDeprecatedProgram } from "../../programs/update";

export async function getClinicianProgramWithDays(
  clinicianId: string,
  clinicianProgramId: string,
  version: string,
  clinicianClientId?: string,
  excludeMaintenance: boolean = false
): Promise<TClinicianProgram> {
  let programRef = doc(
    db,
    "clinicians",
    clinicianId,
    "programs",
    clinicianProgramId,
    "versions",
    version
  ) as DocumentReference<TProgramWrite>;

  const clinicianProgram = await _getProgramFromRef(
    programRef,
    excludeMaintenance
  );

  if (!("clinicianId" in clinicianProgram)) {
    throw new Error("Program is not a clinician program");
  }

  // TODO: Review á filteringu hér
  if (clinicianClientId) {
    Object.keys(clinicianProgram.phases).forEach((key) => {
      if (key.includes("_") && !key.includes(clinicianClientId)) {
        delete clinicianProgram.phases[key as TProgramPhaseKey];
      }
    });

    Object.keys(clinicianProgram.days).forEach((key) => {
      if (key.includes("_") && !key.includes(clinicianClientId)) {
        delete clinicianProgram.days[key as TProgramDayKey];
      }
    });
  }

  return clinicianProgram;
}

export async function getClinicianProgramsWithSubcollections(
  clinicianId: string
): Promise<TClinicianProgram[]> {
  try {
    const clinicianRef = doc(db, "clinicians", clinicianId);
    const programsRef = collection(clinicianRef, "programs");
    const programsSnap = await getDocs(
      programsRef.withConverter(programVersionConverter)
    );
    const programsData = programsSnap.docs.map((doc) => doc.data());
    const programsCurrentVersionSnap = await Promise.all(
      programsData.map(async (program) => {
        if (program.currentVersion) {
          return await getDoc(
            doc(
              programsRef,
              program.programId,
              "versions",
              program.currentVersion
            ).withConverter(programConverter)
          );
        } else {
          throw new Error("Deprecated program!");
        }
      })
    );

    // for each program, get the phases and days
    const phasesSnap = await Promise.all(
      programsCurrentVersionSnap.map((programSnap) => {
        return getDocs(
          collection(programSnap.ref, "phases").withConverter(
            programPhaseConverter
          )
        );
      })
    );
    const daysSnap = await Promise.all(
      programsCurrentVersionSnap.map((programSnap) => {
        return getDocs(
          collection(programSnap.ref, "days").withConverter(programDayConverter)
        );
      })
    );
    // map the days to the programs
    const programs: TClinicianProgram[] = programsCurrentVersionSnap.map(
      (programSnap, i) => {
        const programBaseInfo = programsData[i] as TClinicianProgramVersion;
        const { clinicianId, programId, currentVersion, ...baseProps } =
          programBaseInfo;

        const phases = Object.fromEntries(
          phasesSnap[i].docs.map((doc) => [doc.id, doc.data()])
        );

        const days = Object.fromEntries(
          daysSnap[i].docs.map((doc) => [doc.id, doc.data()])
        );

        return {
          ...(programSnap.data() as TProgramBase),
          phases,
          days,
          clinicianProgramId: programSnap.ref.parent.parent?.id || "",
          clinicianId,
          version: programSnap.id || "",
          ...baseProps,
        };
      }
    );

    return programs;
  } catch (error) {
    console.error("Error fetching clinician programs:", error);
    throw error;
  }
}

// TODO: Functions for deprecated programs
export async function getAndUpgradeDeprecatedClinicianPrograms(
  clinicianId: string
): Promise<TClinicianProgram[]> {
  try {
    const clinicianRef = doc(db, "clinicians", clinicianId);
    const programsRef = collection(clinicianRef, "programs");
    const programsSnap = await getDocs(
      programsRef.withConverter(programVersionConverter)
    );
    const programsData = programsSnap.docs.map((doc) => doc.data());
    const programsCurrentVersionSnap = await Promise.all(
      programsData.map(async (program) => {
        if (program.currentVersion) {
          return await getDoc(
            doc(
              programsRef,
              program.programId,
              "versions",
              program.currentVersion
            ).withConverter(programConverter)
          );
        } else {
          const upgradedProgram = await upgradeDeprecatedProgram(
            doc(
              programsRef,
              program.programId
            ) as DocumentReference<TProgramWrite>
          );
          console.log("upgradedProgram", upgradedProgram);
          return await getDoc(
            doc(
              programsRef,
              program.programId,
              "versions",
              upgradedProgram.version
            ).withConverter(programConverter)
          );
        }
      })
    );

    // for each program, get the phases and days
    const phasesSnap = await Promise.all(
      programsCurrentVersionSnap.map((programSnap) => {
        return getDocs(
          collection(programSnap.ref, "phases").withConverter(
            programPhaseConverter
          )
        );
      })
    );
    const daysSnap = await Promise.all(
      programsCurrentVersionSnap.map((programSnap) => {
        return getDocs(
          collection(programSnap.ref, "days").withConverter(programDayConverter)
        );
      })
    );
    // map the days to the programs
    const programs: TClinicianProgram[] = programsCurrentVersionSnap.map(
      (programSnap, i) => {
        const phases = Object.fromEntries(
          phasesSnap[i].docs.map((doc) => [doc.id, doc.data()])
        );
        const days = Object.fromEntries(
          daysSnap[i].docs.map((doc) => [doc.id, doc.data()])
        );

        return {
          ...(programSnap.data() as TProgramBase),
          phases,
          days,
          clinicianProgramId: programSnap.ref.parent.parent?.id || "",
          clinicianId,
          version: programSnap.id,
        };
      }
    );

    return programs;
  } catch (error) {
    console.error("Error fetching clinician programs:", error);
    throw error;
  }
}
