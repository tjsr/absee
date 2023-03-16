import { SnowflakeType } from "../types";

export type ComparisonSubmissionRequestBody = {
  comparisonId: SnowflakeType;
  selectedElementId: SnowflakeType;
}

export type RestCallResult = {
  success: boolean;
  data?: any;
  status: number;
}
