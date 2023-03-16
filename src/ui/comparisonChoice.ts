import { ComparisonSubmissionRequestBody, RestCallResult } from "../types/apicalls";

import { ComparisonSelectionResponse } from "../types";

const SERVER_HOST = 'http://localhost:8280';

export const fetchNewComparison = async () => {
  try {
    let response = await fetch(`${SERVER_HOST}`);
    let json = await response.json();
    return { success: true, data: json };
  } catch (error) {
    console.log(error);
    return { success: false };
  }
};

export const submitComparisonChoice = async <T>(comparison: ComparisonSelectionResponse<T>, elementId: string): Promise<RestCallResult> => {
  let httpStatus: number = 0;
  try {
    const postBody: ComparisonSubmissionRequestBody = { comparisonId: comparison.id, selectedElementId: elementId };
    let response = await fetch(`${SERVER_HOST}/submit`,
    {
      method: "POST",
      body: JSON.stringify(postBody),
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json'}
    });
    httpStatus = response.status;
    let json = await response.json();
    return { success: true, status: httpStatus, data: json };
  } catch (error) {
    console.log(error);
    return { success: false, status: httpStatus };
  }
};
