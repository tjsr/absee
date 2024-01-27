import {
  ComparisonSelectionResponse,
  SnowflakeType
} from '../types.js';
import {
  ComparisonSubmissionRequestBody,
  RestCallResult
} from '../types/apicalls.js';
import { QUERYSTRING_ARRAY_DELIMETER, QUERYSTRING_ELEMENT_DELIMETER, getServerHost } from './utils.js';

import Cookies from 'js-cookie';

export const fetchNewComparison = async (collectionId: string, comparisonObjects?: string[][]) => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    const sessionId = Cookies.get('sessionId');
    if (sessionId !== undefined && sessionId !== 'undefined') {
      headers['x-session-id'] = sessionId;
    }

    const comparisonParams = comparisonObjects?.length == 2 ?
      `?objects=${comparisonObjects[0].join(QUERYSTRING_ELEMENT_DELIMETER)}`+
        `${QUERYSTRING_ARRAY_DELIMETER}${comparisonObjects[1].join(QUERYSTRING_ELEMENT_DELIMETER)}` : '';

    const response = await fetch(
      `${getServerHost()}/collection/${collectionId}${comparisonParams}`,
      {
        headers,
        method: 'GET',
      }
    );

    const json = await response.json();
    return { data: json, success: true };
  } catch (error) {
    console.log(error);
    return { success: false };
  }
};

export const submitComparisonChoice = async <T>(
  comparison: ComparisonSelectionResponse<T>,
  elementId: SnowflakeType
): Promise<RestCallResult> => {
  let httpStatus = 0;
  const submitUrl = `${getServerHost()}/submit`;
  try {
    const sessionId = Cookies.get('sessionId');
    const postBody: ComparisonSubmissionRequestBody = {
      comparisonId: comparison.id,
      selectedElementId: elementId,
    };
    const response = await fetch(submitUrl, {
      body: JSON.stringify(postBody),
      headers: {
        // 'Accept': 'application/json',
        'Content-Type': 'application/json',
        'x-session-id': sessionId!,
      },
      method: 'POST',
    });
    httpStatus = response.status;
    const json = await response.json();
    return { data: json, status: httpStatus, success: true };
  } catch (error) {
    console.log(`Failed while fetching ${submitUrl}`, error);
    return { status: httpStatus, success: false };
  }
};
