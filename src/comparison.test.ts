import { ComparableObjectMetadata, ComparisonSelection, SnowflakeType } from "./types";
import {describe, expect, test} from '@jest/globals';

import { assert } from "console";
import { getSnowflake } from "./snowflake";
import { storeComparisonRequest } from "./comparison";
import { v4 as uuidv4 } from "uuid";

describe('comparison', () => {
  test('Should write a comparison request to the DB', () => {
    const comparisonId: SnowflakeType = getSnowflake();
    const metaa: ComparableObjectMetadata<any> = {
      id: getSnowflake(),
      elementId: getSnowflake(),
      objectId: "1",
      data: { id: "1" }
    }

    const metab: ComparableObjectMetadata<any> = {
      id: getSnowflake(),
      elementId: getSnowflake(),
      objectId: "2",
      data: { id: "2" }
    }
    const comparisonRequest: ComparisonSelection<any> = {
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