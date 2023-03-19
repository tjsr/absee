import { ComparisonSelectionResponse, CookieName, EmailAddress, SnowflakeType } from "../types";
import { ComparisonSubmissionRequestBody, RestCallResult } from "../types/apicalls";

import Cookies from "js-cookie";
import { getServerHost } from "./utils";

export const fetchNewSession = async () => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    let response = await fetch(`${getServerHost()}/session`, {
      method: 'GET',
      headers});

    let json = await response.json();
    if (json.sessionId) {
      Cookies.set('sessionId', json.sessionId);
    }
  } catch (err) {
  }
};

export const fetchNewComparison = async () => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    const sessionId = Cookies.get('sessionId');
    if (sessionId !== undefined && sessionId !== 'undefined') {
      headers['x-session-id'] = sessionId;
    }

    let response = await fetch(`${getServerHost()}`, {
      method: 'GET',
      headers});

    let json = await response.json();
    return { success: true, data: json };
  } catch (error) {
    console.log(error);
    return { success: false };
  }
};

export const submitComparisonChoice = async <T>(comparison: ComparisonSelectionResponse<T>, elementId: SnowflakeType): Promise<RestCallResult> => {
  let httpStatus: number = 0;
  try {
    const sessionId = Cookies.get('sessionId');
    const postBody: ComparisonSubmissionRequestBody = { comparisonId: comparison.id, selectedElementId: elementId };
    let response = await fetch(`${getServerHost()}/submit`,
    {
      method: "POST",
      body: JSON.stringify(postBody),
      headers: {
        //'Accept': 'application/json',
        'Content-Type': 'application/json',
        'x-session-id': sessionId!}
    });
    httpStatus = response.status;
    let json = await response.json();
    return { success: true, status: httpStatus, data: json };
  } catch (error) {
    console.log(error);
    return { success: false, status: httpStatus };
  }
};
