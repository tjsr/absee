import { ComparisonSelectionResponse, PinInfo } from './types';
import React, { useEffect, useState } from 'react';

import { Collection } from './pincollection';

const SERVER_HOST = 'http://localhost:8280/';

const Frontend = (): JSX.Element => {
  const [comparison, setComparison] = useState<ComparisonSelectionResponse<PinInfo> | undefined>(undefined);
  const [comparisonLoaded, setComparisonLoaded] = useState<boolean>(false);
  const [comparisonLoading, setComparisonLoading] = useState<boolean>(false);

  const fetchComparison = async () => {
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
        let res = await fetchComparison();
        if (res.success) {
          console.log(`Loaded ${JSON.stringify(res.data)}`);
          const comparisonRequest: ComparisonSelectionResponse<PinInfo> = res.data;
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
            <Collection element={comparison!.a} />
            <Collection element={comparison!.b} />
          </div>
        </>
      ) : (
        <div>Loading...</div>
      )}
    </div>
  );
};

export default Frontend;
