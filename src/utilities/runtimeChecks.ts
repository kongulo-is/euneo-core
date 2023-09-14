import { TConditionId, TPhase } from "../types/baseTypes";
import {
  TOutcomeMeasureAnswers,
  TPainLevel,
  TClientProgramDay,
  TConditionAssessmentAnswer,
  TClientPhysicalInformation,
  TClientProgram,
} from "../types/clientTypes";
import { conditions } from "../constants/conditions";

const assertTConditionId = (id: TConditionId): void => {
  const validIds = Object.keys(conditions);
  if (!validIds.includes(id)) throw new Error(`Invalid TConditionId: ${id}`);
};

const assertTOutcomeMeasureAnswers = (obj: TOutcomeMeasureAnswers): void => {
  if (
    !obj ||
    !(obj.date instanceof Date) ||
    typeof obj.name !== "string" ||
    !Array.isArray(obj.sections)
  ) {
    throw new Error("Invalid TOutcomeMeasureAnswers");
  }
};

const assertTPainLevel = (obj: TPainLevel): void => {
  if (
    !obj ||
    typeof obj.painIndex !== "number" ||
    !(obj.date instanceof Date)
  ) {
    throw new Error("Invalid TPainLevel");
  }
};

const assertTClientProgramDay = (obj: TClientProgramDay): void => {
  if (
    !obj ||
    typeof obj.dayId !== "string" ||
    !(obj.date instanceof Date) ||
    typeof obj.finished !== "boolean"
  ) {
    throw new Error("Invalid TClientProgramDay");
  }
};

const assertTPhase = (obj: TPhase): void => {
  if (!obj || typeof obj.key !== "string" || typeof obj.value !== "number") {
    throw new Error("Invalid TPhase");
  }
};

const assertConditionAssessmentAnswer = (
  answer: TConditionAssessmentAnswer
): void => {
  if (typeof answer !== "boolean" && typeof answer !== "string") {
    throw new Error("Invalid TConditionAssessmentAnswer");
  }
};

const assertTClientPhysicalInformation = (
  obj: TClientPhysicalInformation
): void => {
  if (
    !obj ||
    typeof obj.athlete !== "boolean" ||
    typeof obj.height !== "number"
  ) {
    throw new Error("Invalid TClientPhysicalInformation");
  }
};

const assertTypeString = (val: any, fieldName: string): void => {
  if (typeof val !== "string") {
    throw new Error(`assertTypeString: Invalid ${fieldName}`);
  }
};

type AssertFunction<T> = (item: T) => void;

const assertArray = <T>(
  arr: any[],
  assertFunc: AssertFunction<T>,
  fieldName: string
): void => {
  if (
    !Array.isArray(arr) ||
    !arr.every((item) => {
      try {
        assertFunc(item);
        return true;
      } catch {
        return false;
      }
    })
  ) {
    throw new Error(`assertArray: Invalid ${fieldName}`);
  }
};

const runtimeChecks = {
  assertTClientProgram(
    obj: TClientProgram | Omit<TClientProgram, "clientProgramId">,
    write?: boolean
  ): void {
    if (
      (!obj ||
        ("clientProgramId" in obj &&
          typeof obj.clientProgramId !== "string")) &&
      !write
    ) {
      throw new Error("Invalid TClientProgram");
    }

    assertTConditionId(obj.conditionId);

    // Handle the union type
    if ("physioProgramId" in obj) {
      assertTypeString(obj.physioProgramId, "physioProgramId");
      assertTypeString(obj.physioId, "physioId");
    } else if ("programId" in obj) {
      assertTypeString(obj.programId, "programId");
      assertArray(
        obj.conditionAssessmentAnswers,
        assertConditionAssessmentAnswer,
        "conditionAssessmentAnswers"
      );
    }

    assertArray(
      obj.outcomeMeasuresAnswers,
      assertTOutcomeMeasureAnswers,
      "outcomeMeasuresAnswers"
    );
    assertArray(obj.painLevels, assertTPainLevel, "painLevels");
    assertArray(obj.days, assertTClientProgramDay, "days");

    if (obj.phases !== undefined) {
      assertArray(obj.phases, assertTPhase, "phases");
    }

    if (obj.physicalInformation !== undefined) {
      assertTClientPhysicalInformation(obj.physicalInformation);
    }
  },
  getClientProgram(clientProgram: TClientProgram) {},
};

export default runtimeChecks;
