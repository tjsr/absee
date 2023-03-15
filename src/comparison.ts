import { ComparisonRequestPutBody, ComparisonSelection } from "./types";

import axios from "axios";
import { sqlinsert } from "./sqlrest";
import { storeComparisonElements } from "./comparisonelement";

export const storeComparisonRequest = async <T>(comparisonRequest: ComparisonSelection<T>): Promise<void> => {
  const postRequest: ComparisonRequestPutBody = {
    id: comparisonRequest.id,
    userId: comparisonRequest.userId,
    requestTime: comparisonRequest.requestTime,
    requestIp: comparisonRequest.requestIp,
  };
  const allPromises: Promise<void>[] = [
    ...storeComparisonElements(comparisonRequest.id, comparisonRequest.a),
    ...storeComparisonElements(comparisonRequest.id, comparisonRequest.b),
    sqlinsert('comparison', postRequest),
  ];
  const resolved = Promise.all(allPromises).then((resolved) => {
    return Promise.resolve();
  }).catch((err) => {
    console.error(err);
    return Promise.reject(err);
  });
  return resolved;
};