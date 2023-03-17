import './frontend.css';

import { ComparableObjectResponse, ComparisonSelectionResponse, SnowflakeType } from './types';
import React, { useEffect, useState } from 'react';
import { fetchNewComparison, submitComparisonChoice } from './ui/comparisonChoice';

import { Pin } from './pins/pinpanion';
import { PinCollection } from './pins/pincollection';
import { RestCallResult } from './types/apicalls';
import SuperJSON from 'superjson';

const Frontend = <T extends unknown>(): JSX.Element => {
  const [comparison, setComparison] = useState<ComparisonSelectionResponse<T> | undefined>(undefined);
  const [comparisonLoaded, setComparisonLoaded] = useState<boolean>(false);
  const [comparisonLoading, setComparisonLoading] = useState<boolean>(false);

  const selectElement = async (elementId: SnowflakeType): Promise<void> => {
    console.log(`Selected element ${elementId} for comparison ${comparison?.id}`);
    const result: RestCallResult = await submitComparisonChoice(comparison!, elementId);
    if (result.success) {
      setComparisonLoaded(false);
      console.log(`Successfully submitted choice of ${elementId} for comparison ${comparison!.id}`);
    } else {
      throw new Error(`Failed with HTTP status ${result.status}`);
    }
  };

  useEffect(() => {
    (async () => {
      if (!comparisonLoading && !comparisonLoaded) {
        setComparisonLoading(true);
        setComparisonLoaded(false);
        let res = await fetchNewComparison();
        if (res.success) {
          console.log(`Loaded ${SuperJSON.stringify(res.data)}`);
          const comparisonRequest: ComparisonSelectionResponse<T> = res.data.json;
          setComparison(comparisonRequest);
          setComparisonLoaded(true);
        }
        setComparisonLoading(false);
      }
    })();
  }, [comparisonLoaded]);

  return (
    <div>
      {comparisonLoaded ? (
        <>
          <div className="comparisonContainer">
            <PinCollection element={comparison!.a as ComparableObjectResponse<Pin>} selectElement={selectElement} />
            <PinCollection element={comparison!.b as ComparableObjectResponse<Pin>} selectElement={selectElement} />
          </div>
        </>
      ) : (
        <div>Loading...</div>
      )}
    </div>
  );
};

export default Frontend;
