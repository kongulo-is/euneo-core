import {
  TPhysioProgram,
  TPainLevel,
  TOutcomeMeasureAnswers,
} from "@src/types/datatypes";

const runtimeChecks = {
  addProgramToUser(
    clientId: string,
    physioProgram: TPhysioProgram,
    trainingDays: boolean[],
    painLevel: TPainLevel,
    outcomeMeasureAnswers: TOutcomeMeasureAnswers
  ) {
    if (!clientId || typeof clientId !== "string") {
      throw new Error("Invalid clientId");
    }

    if (
      !Array.isArray(trainingDays) ||
      !trainingDays.every((day) => typeof day === "boolean")
    ) {
      throw new Error("Invalid trainingDays");
    }

    // Validate painLevel
    if (
      !painLevel ||
      typeof painLevel.painIndex !== "number" ||
      painLevel.painIndex < 0 ||
      painLevel.painIndex > 10 ||
      !(painLevel.date instanceof Date)
    ) {
      throw new Error("Invalid painLevel");
    }

    // Validate outcomeMeasuresAnswer
    if (!outcomeMeasureAnswers) {
      throw new Error("outcomeMeasureAnswers is missing");
    }

    if (!(outcomeMeasureAnswers.date instanceof Date)) {
      console.log(typeof outcomeMeasureAnswers.date, outcomeMeasureAnswers);

      throw new Error("Invalid outcomeMeasureAnswers.date");
    }

    if (typeof outcomeMeasureAnswers.name !== "string") {
      throw new Error("Invalid outcomeMeasureAnswers.name");
    }

    if (
      typeof outcomeMeasureAnswers.type !== "string" &&
      outcomeMeasureAnswers.type !== "foot&ankle"
    ) {
      throw new Error("Invalid outcomeMeasureAnswers.type");
    }

    if (
      !Array.isArray(outcomeMeasureAnswers.sections) ||
      outcomeMeasureAnswers.sections.length === 0
    ) {
      throw new Error("Invalid outcomeMeasuresAnswer.sections");
    }

    // Validate physioProgram
    if (
      !physioProgram ||
      typeof physioProgram.name !== "string" ||
      typeof physioProgram.conditionId !== "string" ||
      !Array.isArray(physioProgram.outcomeMeasureIds) ||
      physioProgram.outcomeMeasureIds.length === 0 ||
      typeof physioProgram.mode !== "string" ||
      (physioProgram.mode !== "continuous" && physioProgram.mode !== "phase") ||
      typeof physioProgram.physioProgramId !== "string" ||
      typeof physioProgram.physioId !== "string"
    ) {
      throw new Error("Invalid physioProgram");
    }
  },
};

export default runtimeChecks;
