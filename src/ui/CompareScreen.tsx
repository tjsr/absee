import './CompareScreen.css';

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
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { ElementPicker } from './simplePicker';
import { FaRegCopy } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { LoginControl } from './auth/LoginControl';
import { slide as Menu } from 'react-burger-menu';
import { Pin } from '../pins/pinpanion';
import { RestCallResult } from '../types/apicalls';
import SuperJSON from 'superjson';
import { useSearchParams } from 'react-router-dom';

type CompareScreenProps = {
  collectionId: string;
}

const getCookieUserId = (): string | undefined => {
  const userIdValue: string|undefined = Cookies.get('user_id');
  if (userIdValue === 'undefined') {
    return undefined;
  }
  return userIdValue;
};

type ComparisonLinkProps<T> = {
  comparison: ComparisonSelectionResponse<T> | undefined;
}

const ComparisonLink = ({ comparison }: ComparisonLinkProps<Pin>): JSX.Element => {
  if (!comparison) {
    return <div>No comparison loaded</div>;
  }
  const linkString = `${location.protocol}//${location.host}/?objects=` +
    comparison.a.objects.join(',') + '|' + comparison.b.objects.join(',');
  return (
    <div className="copyToClipboard">
      Copy link clipboard <CopyToClipboard text={linkString}>
        <FaRegCopy />
      </CopyToClipboard>
    </div>
  );
};

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-constraint
const CompareScreen = <T extends unknown>({ collectionId } : CompareScreenProps): JSX.Element => {
  const [comparison, setComparison] = useState<ComparisonSelectionResponse<T> | undefined>(undefined);
  const [comparisonLoaded, setComparisonLoaded] = useState<boolean>(false);
  const [comparisonLoading, setComparisonLoading] = useState<boolean>(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const fakeEmails = false;

  const [isLoggedIn, setLoggedIn] = useState<boolean>(false);
  const [email, setEmail] = useState<EmailAddress | undefined>(undefined);
  const dropRef: React.MutableRefObject<HTMLDivElement | null> = useRef<HTMLDivElement|null>(null);

  const queryString = new URLSearchParams(window.location.search);
  const preselectedObjects = queryString.get('objects'); // searchParams.get('options'); // queryString.get('objects');
  let preselectedObjectArr: string[][]|undefined = undefined;
  if (preselectedObjects) {
    preselectedObjectArr = preselectedObjects.split('|').map(
      (objectList: string) => objectList.split(','));
    console.log(`Got a preselected list of ${preselectedObjectArr.join('|')}`);
  }
  // const params = useParams<{ group1: string, group2: string }>();
  // if (params.group1 && params.group2) {

  // }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  useGoogleLogin({
    onSuccess: (tokenResponse: Omit<TokenResponse, 'error' | 'error_description' | 'error_uri'>) => {
      // const decodedJwt = jwt_decode(tokenResponse.access_token);
      console.log(`Google login success with token: ${tokenResponse}`);
    },
  });

  const selectElement = async (elementId: SnowflakeType): Promise<void> => {
    const result: RestCallResult = await submitComparisonChoice(comparison!, elementId);
    const optionsParam = `?${new URLSearchParams({ })}`;
    if (result.success) {
      setSearchParams(optionsParam);
      setComparisonLoaded(false);
      console.debug(`Successfully submitted choice of ${elementId} for comparison ${comparison!.id}`);
    } else {
      setSearchParams(optionsParam);
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
      console.log(`User ID: ${userId}  Email: ${cookieEmail}`);
      if (userId && cookieEmail) {
        setLoggedIn(true);
        setEmail(cookieEmail);
        console.log(`Email: ${cookieEmail} (as cookie: ${Cookies.get('displayName')})`);
      }

      if (!comparisonLoading && !comparisonLoaded) {
        setComparisonLoading(true);
        setComparisonLoaded(false);
        const res = await fetchNewComparison(collectionId, preselectedObjectArr);
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
      <div className="elementPickerContent">
        {comparisonLoaded ? (
          <>
            <ElementPicker
              selectElement={selectElement}
              itemSelected={itemSelected}
              dropRef={dropRef}
              leftElement={comparison!.a as ComparableObjectResponse<Pin>}
              rightElement={comparison!.b as ComparableObjectResponse<Pin>} />
            <ComparisonLink comparison={comparison as ComparisonSelectionResponse<Pin>}/>
            <Link to="/recent">Recent comparisons</Link>
          </>
        ) : (
          <div>Loading...</div>
        )}
      </div>
    </>
  );
};

export default CompareScreen;
