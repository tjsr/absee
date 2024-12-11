import { GoogleAuthSettings } from "./types.js";
import { requireEnv } from "@tjsr/simple-env-utils";

export const getGoogleAuthSettings = (): GoogleAuthSettings => {
  const authSettings: GoogleAuthSettings = {
    id: requireEnv('GOOGLE_CLIENT_ID'),
    secret: requireEnv('GOOGLE_CLIENT_SECRET'),
    serverPrefix: requireEnv('SERVER_PREFIX'),
  };
  if (process.env.GOOGLE_CALLBACK_URL) {
    authSettings.callbackUrl = process.env.GOOGLE_CALLBACK_URL;
  } else {
    authSettings.callbackUrl = `${requireEnv('SERVER_PREFIX')}/auth/google/callback`;
  }
  return authSettings;
};
