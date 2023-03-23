import './frontend.css';

import {
  ComparableObjectResponse,
  ComparisonSelectionResponse,
  EmailAddress,
  SnowflakeType
} from '../types';
import React, { useEffect, useState } from 'react';
import {
  fetchNewComparison,
  fetchNewSession,
  submitComparisonChoice
} from './comparisonChoice';

import Cookies from 'js-cookie';
import { FreeformEmailLoginBox } from './freeformEmailLogin';
import { GoogleLoginBox } from './googleLogin';
import { InfoBlurb } from './InfoBlurb';
import { Pin } from '../pins/pinpanion';
import { PinCollection } from '../pins/pincollection';
import { RestCallResult } from '../types/apicalls';
import SuperJSON from 'superjson';

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-constraint
const Frontend = <T extends unknown>(): JSX.Element => {
  const [comparison, setComparison] = useState<ComparisonSelectionResponse<T> | undefined>(undefined);
  const [comparisonLoaded, setComparisonLoaded] = useState<boolean>(false);
  const [comparisonLoading, setComparisonLoading] = useState<boolean>(false);
  const fakeEmails = true;
  const collectionId = '83fd0b3e-dd08-4707-8135-e5f138a43f00';

  const [isLoggedIn, setLoggedIn] = useState<boolean>(false);
  const [email, setEmail] = useState<EmailAddress | undefined>(undefined);

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
    const sessionId = Cookies.get('sessionId');

    (async () => {
      if (sessionId === undefined || sessionId == 'undefined') {
        await fetchNewSession();
      }

      const isLoggedIn = Cookies.get('isLoggedIn');
      const cookieEmail = Cookies.get('email');
      if (isLoggedIn === 'true' && cookieEmail !== undefined) {
        setLoggedIn(true);
        setEmail(cookieEmail);
      }
      if (!comparisonLoading && !comparisonLoaded) {
        setComparisonLoading(true);
        setComparisonLoaded(false);
        const res = await fetchNewComparison(collectionId);
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
    <>
      {fakeEmails ? <FreeformEmailLoginBox /> : <GoogleLoginBox />}
      <div>
        {comparisonLoaded ? (
          <>
            <div className="comparisonContainer">
              <PinCollection element={comparison!.a as ComparableObjectResponse<Pin>} selectElement={selectElement} />
              <div className="vs">vs</div>
              <PinCollection element={comparison!.b as ComparableObjectResponse<Pin>} selectElement={selectElement} />
            </div>
            <InfoBlurb />
          </>
        ) : (
          <div>Loading...</div>
        )}
      </div>
    </>
  );
};

export default Frontend;
