import './frontend.css';

import {
  ComparableObjectResponse,
  ComparisonSelectionResponse,
  EmailAddress,
  SnowflakeType
} from '../types';
import { CredentialResponse, GoogleLogin } from '@react-oauth/google';
import React, { useEffect, useState } from 'react';
import { fetchNewComparison, fetchNewSession, submitComparisonChoice } from './comparisonChoice';

import Cookies from 'js-cookie';
import { DualSwiper } from './components';
// import { DualSwiper } from '@tjsr/abswipe';
import { FreeformEmailLoginBox } from './freeformEmailLogin';
import { InfoBlurb } from './InfoBlurb';
import { Pin } from '../pins/pinpanion';
import { PinCollection } from '../pins/pincollection';
import { RestCallResult } from '../types/apicalls';
import SuperJSON from 'superjson';
import { isMobile } from 'react-device-detect';

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-constraint
const Frontend = <T extends unknown>(): JSX.Element => {
  const [comparison, setComparison] = useState<ComparisonSelectionResponse<T> | undefined>(undefined);
  const [comparisonLoaded, setComparisonLoaded] = useState<boolean>(false);
  const [comparisonLoading, setComparisonLoading] = useState<boolean>(false);
  const fakeEmails = false;
  const collectionId = '83fd0b3e-dd08-4707-8135-e5f138a43f00';
  // const isMobile = (): boolean => {

  // }
  const [isSwiperEnabled, setSwiperEnabled] = useState<boolean>(isMobile);
  const [tapToSelect, enableTapToSelect] = useState<boolean>(!isMobile);

  const [isLoggedIn, setLoggedIn] = useState<boolean>(false);
  const [email, setEmail] = useState<EmailAddress | undefined>(undefined);

  const selectElement = async (elementId: SnowflakeType): Promise<void> => {
    const result: RestCallResult = await submitComparisonChoice(comparison!, elementId);
    if (result.success) {
      setComparisonLoaded(false);
      console.debug(`Successfully submitted choice of ${elementId} for comparison ${comparison!.id}`);
    } else {
      console.warn(`Failed selecting element ${elementId} for comparison ${comparison?.id}`);
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

  const onTapSelect = async (elementId: SnowflakeType): Promise<void> => {
    if (tapToSelect) selectElement(elementId);
  };

  const itemSelected = (side: number) => {
    if (side == 0) {
      selectElement(comparison!.a.elementId);
    } else {
      selectElement(comparison!.b.elementId);
    }
  };

  return (
    <>
      {isLoggedIn ? (
        <div>
          {/* Display content for logged in users */}
          <p>You are logged in!</p>
        </div>
      ) : (
        fakeEmails ? <FreeformEmailLoginBox /> : <GoogleLogin
          onSuccess={(credentialResponse: CredentialResponse) => {
            console.log(credentialResponse);
            setEmail(credentialResponse.credential);
            setLoggedIn(true);
          }}
          onError={() => {
            setLoggedIn(false);
            console.log('Login Failed');
          }}
        />
      )}
      <div className="devOptions">
        <div>
          <label htmlFor="enableMobile">Enable swipe mode</label>
          <input
            type="checkbox"
            checked={isSwiperEnabled}
            name="enableMobile"
            onChange={() => setSwiperEnabled(!isSwiperEnabled)}
          />
        </div>
        <div>
          <label htmlFor="enableTapToSelect">Immediately select when touching an option</label>
          <input
            type="checkbox"
            checked={tapToSelect}
            name="enableTapToSelect"
            onChange={() => enableTapToSelect(!tapToSelect)}
          />
        </div>
      </div>
      <div>
        {comparisonLoaded ? (
          <>
            <h3 className="comparisonHelp">Select the pin(s) you would prefer to have</h3>
            {isSwiperEnabled ? (
              <div className="comparisonContainer">
                <DualSwiper
                  boxMinHeight={8}
                  boxMinWidth={8}
                  itemSelected={itemSelected}
                  leftContent={
                    <PinCollection
                      element={comparison!.a as ComparableObjectResponse<Pin>}
                      selectElement={onTapSelect}
                    />
                  }
                  rightContent={
                    <PinCollection
                      element={comparison!.b as ComparableObjectResponse<Pin>}
                      selectElement={onTapSelect}
                    />
                  }
                >
                  <div className="comparisonText">Swipe your selection towards the centre.</div>
                </DualSwiper>
              </div>
            ) : (
              <div className="comparisonContainer desktopSelector">
                <PinCollection element={comparison!.a as ComparableObjectResponse<Pin>} selectElement={selectElement} />
                <PinCollection element={comparison!.b as ComparableObjectResponse<Pin>} selectElement={selectElement} />
              </div>
            )}
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
