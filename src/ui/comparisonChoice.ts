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
  const serverHost = getServerHost();
  let connectionUrl: string;
  try {
    const comparisonParams = comparisonObjects?.length == 2 ?
      `?objects=${comparisonObjects[0].join(QUERYSTRING_ELEMENT_DELIMETER)}`+
        `${QUERYSTRING_ARRAY_DELIMETER}${comparisonObjects[1].join(QUERYSTRING_ELEMENT_DELIMETER)}` : '';
    connectionUrl = `${serverHost}/collection/${collectionId}${comparisonParams}`;
  } catch (error) {
    console.error(`Failed to create connection url for ${serverHost}`, error);
    return { success: false };
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  const sessionId = Cookies.get('sessionId');
  if (sessionId !== undefined && sessionId !== 'undefined') {
    headers['x-session-id'] = sessionId;
  }

  try {
    const response = await fetch(connectionUrl,
      {
        headers,
        method: 'GET',
      }
    );

    console.log(`Received response from ${connectionUrl} with status ${response.status}, returning success.`);
    const json = await response.json();
    return { data: json, success: true };
  } catch (error: any) {
    // if (error.status === 404) {
    //   throw new CollectionNotFoundError(collectionId);
    //   return { success: false };
    // }
    // if (error instanceof Error) {
    //   if (error.httpStatus) {

    //   }
    //   console.error(`Failed fetching from url ${serverHost}`, error);
    // }
    console.error(`Failed fetching from url ${serverHost}`, error.message, error);
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
