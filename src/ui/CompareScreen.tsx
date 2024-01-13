import './CompareScreen.css';

import {
  ComparableObjectResponse,
  ComparisonSelectionResponse,
  EmailAddress,
  SnowflakeType
} from '../types';
import { Link, useLocation } from 'react-router-dom';
import { QUERYSTRING_ARRAY_DELIMETER, QUERYSTRING_ELEMENT_DELIMETER } from './utils';
import React, { useEffect, useRef, useState } from 'react';
import { TokenResponse, useGoogleLogin } from '@react-oauth/google';
import { fetchNewComparison, submitComparisonChoice } from './comparisonChoice';

import { CopyToClipboard } from 'react-copy-to-clipboard';
import { ElementPicker } from './simplePicker';
import { FaRegCopy } from 'react-icons/fa';
import { LoginControl } from './auth/LoginControl';
import { Pin } from '../pins/pinpanion';
import { RestCallResult } from '../types/apicalls';
import SuperJSON from 'superjson';
import { styled } from 'styled-components';
import { useSearchParams } from 'react-router-dom';

const HIDE_MESSAGE_TIMEOUT = 3000;

type CompareScreenProps = {
  collectionId: string;
  setEmail: (email: EmailAddress|undefined) => void;
  email: EmailAddress | undefined;
  isLoggedIn: boolean;
  setLoggedIn: (loggedIn: boolean) => void;
}

type ComparisonLinkProps<T> = {
  comparison: ComparisonSelectionResponse<T> | undefined;
}

const Snackbar = styled.span<{showPopup: boolean, backgroundColor?: string}>`
  transition: opacity 3s ease-out 0s;
  padding: 0.8rem;
  font-size: 12pt;
  position: absolute;
  right: 1rem;
  bottom: 1rem;
  font-family: sans-serif;
  background-color: ${({ backgroundColor }) => `${backgroundColor ? backgroundColor : '#000'}`};
  color: #fff;
  opacity: ${({ showPopup }) => (showPopup ? '1' : '0')};
`;

const ComparisonLink = ({ comparison }: ComparisonLinkProps<Pin>): JSX.Element => {
  const [copyMessageState, setCopyMessageState] = useState<boolean>(false);

  if (!comparison) {
    return <div>No comparison loaded</div>;
  }
  const server = `${location.protocol}//${location.host}`;
  const objectString: string = [
    comparison.a.objects.join(QUERYSTRING_ELEMENT_DELIMETER),
    comparison.b.objects.join(QUERYSTRING_ELEMENT_DELIMETER),
  ].join(QUERYSTRING_ARRAY_DELIMETER);
  const linkString = `${server}/?objects=${objectString}`;
  return (
    <div className="copyToClipboard">
      Copy link clipboard <CopyToClipboard text={linkString} onCopy={() => setCopyMessageState(true)}>
        <FaRegCopy style={{ cursor: 'pointer' }} />
      </CopyToClipboard>
      <Snackbar
        showPopup={copyMessageState}
        onTransitionEnd={() => setCopyMessageState(false)}
      >Link copied to clipboard!</Snackbar>
    </div>
  );
};
//         className={`copyMessage ${copyMessageState ? 'fadeOut' : ''}`}

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-constraint
const CompareScreen = <T extends unknown>({
  collectionId,
  setEmail,
  email,
  isLoggedIn,
  setLoggedIn,
} : CompareScreenProps): JSX.Element => {
  const [comparison, setComparison] = useState<ComparisonSelectionResponse<T> | undefined>(undefined);
  const [comparisonLoaded, setComparisonLoaded] = useState<boolean>(false);
  const [comparisonLoading, setComparisonLoading] = useState<boolean>(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const fakeEmails = false;

  const dropRef: React.MutableRefObject<HTMLDivElement | null> = useRef<HTMLDivElement|null>(null);

  const queryString = new URLSearchParams(window.location.search);
  const preselectedObjects = queryString.get('objects'); // searchParams.get('options'); // queryString.get('objects');
  let preselectedObjectArr: string[][]|undefined = undefined;
  if (preselectedObjects) {
    preselectedObjectArr = preselectedObjects.split(QUERYSTRING_ARRAY_DELIMETER).map(
      (objectList: string) => objectList.split(QUERYSTRING_ELEMENT_DELIMETER));
    console.log(`Got a preselected list of ${preselectedObjectArr.join(QUERYSTRING_ARRAY_DELIMETER)}`);
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
  const location = useLocation();

  const selectElement = async (elementId: SnowflakeType): Promise<void> => {
    const result: RestCallResult = await submitComparisonChoice(comparison!, elementId);
    const updatedSearchParams = new URLSearchParams(location.search);
    updatedSearchParams.delete('objects');
    const optionsParam = `?${updatedSearchParams}`;
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
    (async () => {
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
    if (!comparison) {
      console.error(`No comparison loaded`);
    } else {
      if (side == 0) {
        selectElement(comparison.a.elementId);
      } else {
        selectElement(comparison.b.elementId);
      }
    }
  };

  return (
    <>
      <LoginControl
        isLoggedIn={isLoggedIn}
        fakeEmails={fakeEmails}
        setLoggedIn={setLoggedIn} setEmail={setEmail} email={email} />
      <div className="elementPickerContent">
        {comparisonLoaded && comparison ? (
          <>
            <ElementPicker
              selectElement={selectElement}
              itemSelected={itemSelected}
              dropRef={dropRef}
              leftElement={comparison.a as ComparableObjectResponse<Pin>}
              rightElement={comparison.b as ComparableObjectResponse<Pin>} />
            <ComparisonLink comparison={comparison as ComparisonSelectionResponse<Pin>}/>
            <Link to="/recent">Recent comparisons</Link> (<Link to="/recent/me">mine</Link>)
          </>
        ) : (
          <div>Loading...</div>
        )}
      </div>
    </>
  );
};

export default CompareScreen;
