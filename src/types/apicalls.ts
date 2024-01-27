import { EmailAddress, SnowflakeType } from '../types.js';

export type ComparisonSubmissionRequestBody = {
  comparisonId: SnowflakeType;
  selectedElementId: SnowflakeType;
};

export type RestCallResult = {
  success: boolean;
  data?: any;
  status: number;
};

export type AuthenticationRestResult = {
  email: EmailAddress | undefined;
  isLoggedIn: boolean;
  message?: string;
  sessionId?: string;
};
