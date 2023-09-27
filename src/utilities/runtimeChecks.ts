import { TConditionId } from "../types/baseTypes";
import {
  TOutcomeMeasureAnswers,
  TPainLevel,
  TClientProgramDay,
  TConditionAssessmentAnswer,
  TClientPhysicalInformation,
  TClientProgram,
  TPhase,
  TClientProgramRead,
} from "../types/clientTypes";
import { conditions } from "../constants/conditions";
import {
  TConditionAssessmentQuestion,
  TPhysioProgram,
  TProgramDayExercise,
} from "../types/programTypes";

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

type AssertFunction<T> = (item: T, fieldName: string) => void;

const assertArray = <T>(
  arr: any[],
  assertFunc: AssertFunction<T>,
  fieldName: string
): void => {
  if (
    !Array.isArray(arr) ||
    !arr.every((item) => {
      try {
        assertFunc(item, fieldName);
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
    obj: TClientProgram | TClientProgramRead,
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
      obj.conditionAssessmentAnswers &&
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
    "days" in obj && assertArray(obj.days, assertTClientProgramDay, "days");

    if ("phases" in obj && obj.phases !== undefined) {
      assertArray(obj.phases, assertTPhase, "phases");
    }

    if (obj.physicalInformation !== undefined) {
      assertTClientPhysicalInformation(obj.physicalInformation);
    }
  },
  assertTPhysioProgram(obj: TPhysioProgram): void {
    assertTypeString(obj.name, "name");
    assertTypeString(obj.physioProgramId, "physioProgramId");
    assertTypeString(obj.physioId, "physioId");
    assertTypeString(obj.mode, "mode");

    assertTConditionId(obj.conditionId);

    if (obj.outcomeMeasureIds) {
      assertArray<string>(
        obj.outcomeMeasureIds,
        assertTypeString,
        "outcomeMeasureIds"
      );
    }

    if (obj.conditionAssessment) {
      assertArray<TConditionAssessmentQuestion>(
        obj.conditionAssessment,
        (item: TConditionAssessmentQuestion) => {
          assertTypeString(item.question, "question");
          assertTypeString(item.title, "title");
          assertTypeString(item.type, "type");
          assertArray<string>(item.options, assertTypeString, "options");
        },
        "conditionAssessment"
      );
    }

    Object.keys(obj.days).forEach((dayKey: string) => {
      const day = obj.days[dayKey as `d${number}`];
      assertArray<TProgramDayExercise>(
        day.exercises,
        (exercise: TProgramDayExercise) => {
          assertTypeString(exercise.exerciseId, "exerciseId");
          if (
            typeof exercise.quantity !== "number" ||
            typeof exercise.sets !== "number" ||
            typeof exercise.reps !== "number"
          ) {
            throw new Error("Invalid TProgramDayExercise");
          }
        },
        "exercises"
      );
    });

    if (obj.mode === "continuous") {
      // Continuous mode specific validation, if any
    } else {
      throw new Error("Invalid mode");
    }
  },
};

export default runtimeChecks;
