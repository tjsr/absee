import { ComparableObjectResponse, ComparisonSelectionResponse } from './types';
import React, { useEffect, useState } from 'react';

import { Pin } from './pins/pinpanion';
import { PinCollection } from './pins/pincollection';

const SERVER_HOST = 'http://localhost:8280/';

const Frontend = <T extends unknown>(): JSX.Element => {
  const [comparison, setComparison] = useState<ComparisonSelectionResponse<T> | undefined>(undefined);
  const [comparisonLoaded, setComparisonLoaded] = useState<boolean>(false);
  const [comparisonLoading, setComparisonLoading] = useState<boolean>(false);

  const selectElement = (elementId: string): void => {
    console.log(`Selected element ${elementId} for comparison ${comparison?.id}`);
  };

  const fetchNewComparison = async () => {
    try {
      let response = await fetch(`${SERVER_HOST}`);
      let json = await response.json();
      return { success: true, data: json };
    } catch (error) {
      console.log(error);
      return { success: false };
    }
  };

  useEffect(() => {
    (async () => {
      if (!comparisonLoading && !comparisonLoaded) {
        setComparisonLoading(true);
        setComparisonLoaded(false);
        let res = await fetchNewComparison();
        if (res.success) {
          console.log(`Loaded ${JSON.stringify(res.data)}`);
          const comparisonRequest: ComparisonSelectionResponse<T> = res.data;
          setComparison(comparisonRequest);
          setComparisonLoaded(true);
        }
        setComparisonLoading(false);
      }
    })();
  }, []);

  return (
    <div>
      {comparisonLoaded ? (
        <>
          <div>Comparison data: ${JSON.stringify(comparison)}</div>
          <div>
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
