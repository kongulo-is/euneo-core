import {
  TClientEuneoProgram,
  TClientPhysioProgram,
  TClientProgram,
} from "../types/clientTypes";
import { TProgramDay } from "../types/programTypes";

type InputProps = {
  clientId: string;
  clientProgram: TClientProgram;
  days: { [key: string]: TProgramDay };
};

function yourFunction(
  props: InputProps & { clientProgram: TClientEuneoProgram }
): TClientEuneoProgram;
function yourFunction(
  props: InputProps & { clientProgram: TClientPhysioProgram }
): TClientPhysioProgram;
function yourFunction(
  props: InputProps
): TClientEuneoProgram | TClientPhysioProgram {
  if ("euneoProgramId" in props.clientProgram) {
    return props.clientProgram as TClientEuneoProgram;
  } else {
    return props.clientProgram as TClientPhysioProgram;
  }
}

// Usage
const euneoProgramProps: InputProps = {
  clientId: "client1",
  clientProgram: {
    conditionId: "plantar-heel-pain",
    euneoProgramId: "euneo1",
    outcomeMeasuresAnswers: [],
    painLevels: [],
    physicalInformation: {
      athlete: false,
      height: 0,
      weight: 0,
      unit: "metric",
      physicalActivity: "None",
    },
    trainingDays: [],
    days: {} as any,
    conditionAssessmentAnswers: [],
    clientProgramId: "client1",
  },
  days: {},
};

const physioProgramProps: InputProps = {
  clientId: "client2",
  clientProgram: {
    conditionId: "plantar-heel-pain",
    physioProgramId: "physio1",
    physioId: "physio2",
    outcomeMeasuresAnswers: [],
    painLevels: [],
    physicalInformation: {
      athlete: false,
      height: 0,
      weight: 0,
      unit: "metric",
      physicalActivity: "None",
    },
    trainingDays: [],
    days: {} as any,
    conditionAssessmentAnswers: [],
    clientProgramId: "client1",
    physioId: "physio1",
    physioProgramId: "physio1",
  },
  days: {},
};

const euneoResult = yourFunction(euneoProgramProps);
const physioResult = yourFunction(physioProgramProps);
