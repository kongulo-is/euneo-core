export type TPhysicalActivity = "none" | "low" | "moderate" | "high";

/**
 * @memberof TClientProgram
 * @description Physical information about the client
 * */
export type TClientPhysicalInformation = {
  athlete: boolean;
  height: number;
  weight: number;
  unit: "metric" | "imperial";
  physicalActivity: TPhysicalActivity;
};
