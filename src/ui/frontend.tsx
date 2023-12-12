import './frontend.css';

import {
  ComparableObjectResponse,
  ComparisonSelectionResponse,
  EmailAddress,
  SnowflakeType
} from '../types';
import React, { useEffect, useRef, useState } from 'react';
import { TokenResponse, useGoogleLogin } from '@react-oauth/google';
import { fetchNewComparison, fetchNewSession, submitComparisonChoice } from './comparisonChoice';

import Cookies from 'js-cookie';
import { ElementPicker } from './simplePicker';
import { InfoBlurb } from './InfoBlurb';
import { LoginControl } from './auth/LoginControl';
import { Pin } from '../pins/pinpanion';
import { RestCallResult } from '../types/apicalls';
import SuperJSON from 'superjson';
import jwt_decode from 'jwt-decode';

// import { DualSwiper, StaticDualSwiper } from '@tjsrowe/abswipe';


const getCookieUserId = (): string | undefined => {
  const userIdValue: string|undefined = Cookies.get('user_id');
  if (userIdValue === 'undefined') {
    return undefined;
  }
  return userIdValue;
};

type FrontendProps = {
  collectionId: string;
}

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-constraint
const Frontend = <T extends unknown>({ collectionId } : FrontendProps): JSX.Element => {
  const [comparison, setComparison] = useState<ComparisonSelectionResponse<T> | undefined>(undefined);
  const [comparisonLoaded, setComparisonLoaded] = useState<boolean>(false);
  const [comparisonLoading, setComparisonLoading] = useState<boolean>(false);
  const fakeEmails = false;

  const [isLoggedIn, setLoggedIn] = useState<boolean>(false);
  const [email, setEmail] = useState<EmailAddress | undefined>(undefined);
  const dropRef: React.MutableRefObject<HTMLDivElement | null> = useRef<HTMLDivElement|null>(null);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  useGoogleLogin({
    onSuccess: (tokenResponse: Omit<TokenResponse, 'error' | 'error_description' | 'error_uri'>) => {
      const decodedJwt = jwt_decode(tokenResponse.access_token);
      console.log(`Google login success with token: ${tokenResponse}`);
    },
  });

  const selectElement = async (elementId: SnowflakeType): Promise<void> => {
    const result: RestCallResult = await submitComparisonChoice(comparison!, elementId);
    if (result.success) {
      setComparisonLoaded(false);
      console.debug(`Successfully submitted choice of ${elementId} for comparison ${comparison!.id}`);
    } else {
      setComparisonLoaded(false);
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

      const userId = getCookieUserId();
      const cookieEmail = Cookies.get('email') || Cookies.get('displayName');
      console.log(`User ID: ${userId}`);
      if (userId && cookieEmail) {
        setLoggedIn(true);
        setEmail(cookieEmail);
        console.log(`Email: ${cookieEmail} (as cookie: ${Cookies.get('displayName')})`);
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

  const itemSelected = (side: number) => {
    if (side == 0) {
      selectElement(comparison!.a.elementId);
    } else {
      selectElement(comparison!.b.elementId);
    }
  };

  // const googleSuccess = (resp: CredentialResponse) => {
  //   let decoded = jwt_decode(resp?.credential);
  //   const email = decoded?.email;
  //   const name = decoded?.name;
  //   const token = resp?.tokenId;
  //   const googleId = resp?.googleId;
  //   const result = { email, name, token, googleId };
  //   dispatch(googleLogin({ result, navigate, toast }));
  //   console.log(result);
  // };

  return (
    <>
      <LoginControl
        isLoggedIn={isLoggedIn}
        fakeEmails={fakeEmails}
        setLoggedIn={setLoggedIn} setEmail={setEmail} email={email} />
      <div>
        {comparisonLoaded ? (
          <>
            <ElementPicker
              selectElement={selectElement}
              itemSelected={itemSelected}
              dropRef={dropRef}
              leftElement={comparison!.a as ComparableObjectResponse<Pin>}
              rightElement={comparison!.b as ComparableObjectResponse<Pin>} />
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
