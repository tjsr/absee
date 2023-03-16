import { ComparableObjectModel, ComparisonModel } from "./types/model";
import {describe, expect, test} from '@jest/globals';

import { SnowflakeType } from "./types";
import { assert } from "console";
import { getSnowflake } from "./snowflake";
import { storeComparisonRequest } from "./comparison";
import { v4 as uuidv4 } from "uuid";

describe('comparison', () => {
  test('Should write a comparison request to the DB', () => {
    const comparisonId: SnowflakeType = getSnowflake();
    const metaa: ComparableObjectModel<any> = {
      id: getSnowflake(),
      elementId: getSnowflake(),
      objectId: "1",
      // data: { id: "1" }
    }

    const metab: ComparableObjectModel<any> = {
      id: getSnowflake(),
      elementId: getSnowflake(),
      objectId: "2",
      // data: { id: "2" }
    }
    const comparisonRequest: ComparisonModel<any> = {
      id: comparisonId,
      a: [metaa],
      b: [metab],
      requestIp: "127.0.0.1",
      requestTime: "",
      userId: uuidv4()
    }

    expect(storeComparisonRequest(comparisonRequest)).resolves;
  });
});