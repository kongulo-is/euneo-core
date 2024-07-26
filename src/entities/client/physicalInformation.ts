export type TPhysicalActivity = "none" | "low" | "moderate" | "high";
export type TMeasurementUnit = "metric" | "imperial";

/**
 * @memberof TClientProgram
 * @description Physical information about the client
 * */
export type TClientPhysicalInformation = {
  athlete: boolean;
  height: number;
  weight: number;
  unit: TMeasurementUnit;
  physicalActivity: TPhysicalActivity;
};
