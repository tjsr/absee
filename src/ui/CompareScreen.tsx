import './CompareScreen.css';

import {
  CollectionObject,
  CollectionObjectId,
  ComparisonSelectionResponse,
  EmailAddress,
  SnowflakeType
} from '../types.js';
import { Link, useLocation } from 'react-router-dom';
import { QUERYSTRING_ARRAY_DELIMETER, QUERYSTRING_ELEMENT_DELIMETER } from './utils.js';
import React, { useEffect, useRef, useState } from 'react';
import { TokenResponse, useGoogleLogin } from '@react-oauth/google';
import { fetchNewComparison, submitComparisonChoice } from './comparisonChoice.js';

import { ComparisonLink } from './ComparisonLink.js';
import { ElementPicker } from './simplePicker.js';
import { LoginControl } from './auth/LoginControl.js';
import { RestCallResult } from '../types/apicalls.js';
import SuperJSON from 'superjson';
import { useSearchParams } from 'react-router-dom';

type CompareScreenProps = {
  collectionId: string;
  setEmail: (email: EmailAddress | undefined) => void;
  email: EmailAddress | undefined;
  isLoggedIn: boolean;
  setLoggedIn: (loggedIn: boolean) => void;
};

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-constraint
const CompareScreen = <CO extends CollectionObject<IdType>, IdType extends CollectionObjectId>({
  collectionId,
  setEmail,
  email,
  isLoggedIn,
  setLoggedIn,
}: CompareScreenProps): JSX.Element => {
  const [comparison, setComparison] = useState<ComparisonSelectionResponse<CO> | undefined>(undefined);
  const [comparisonLoaded, setComparisonLoaded] = useState<boolean>(false);
  const [comparisonLoading, setComparisonLoading] = useState<boolean>(false);
  const [comparisonLoadingFailure, setComparisonLoadingFailure] = useState<number|undefined>(undefined);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [searchParams, setSearchParams] = useSearchParams();
  const fakeEmails = false;

  const dropRef: React.MutableRefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);

  const queryString = new URLSearchParams(window.location.search);
  const preselectedObjects = queryString.get('objects'); // searchParams.get('options'); // queryString.get('objects');
  let preselectedObjectArr: string[][] | undefined = undefined;
  if (preselectedObjects) {
    preselectedObjectArr = preselectedObjects
      .split(QUERYSTRING_ARRAY_DELIMETER)
      .map((objectList: string) => objectList.split(QUERYSTRING_ELEMENT_DELIMETER));
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
      setComparisonLoadingFailure(undefined);
      console.debug(`Successfully submitted choice of ${elementId} for comparison ${comparison!.id}`);
    } else {
      setSearchParams(optionsParam);
      setComparisonLoaded(false);
      setComparisonLoadingFailure(result.success ? undefined : (result.status || 503));
      console.warn(`Failed selecting element ${elementId} for comparison ${comparison?.id}`);
      throw new Error(`Failed with HTTP status ${result.status}`);
    }
  };

  useEffect(() => {
    (async () => {
      if (!comparisonLoading && !comparisonLoaded && !comparisonLoadingFailure) {
        setComparisonLoading(true);
        setComparisonLoaded(false);
        const res = await fetchNewComparison(collectionId, preselectedObjectArr);
        if (res.success) {
          console.log(`Successfully loaded ${SuperJSON.stringify(res.data)}`);
          const comparisonRequest: ComparisonSelectionResponse<CO> = res.data.json;
          setComparison(comparisonRequest);
          setComparisonLoaded(true);
          setComparisonLoadingFailure(undefined);
        } else {
          setComparisonLoadingFailure(res.success ? undefined : (res.status || 503));
        }
        setComparisonLoading(false);
      }
    })();
  }, [comparisonLoaded, collectionId, comparisonLoading, preselectedObjectArr, comparisonLoadingFailure]);

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
        setLoggedIn={setLoggedIn}
        setEmail={setEmail}
        email={email}
      />
      <div className="elementPickerContent">
        {comparisonLoaded && comparison ? (
          <>
            <ElementPicker
              selectElement={selectElement}
              itemSelected={itemSelected}
              dropRef={dropRef}
              leftElement={comparison.a}
              rightElement={comparison.b}
            />
            <ComparisonLink comparison={comparison as ComparisonSelectionResponse<CO>} />
            <Link to="/recent">Recent comparisons</Link> (<Link to="/recent/me">mine</Link>)
          </>
        ) : comparisonLoadingFailure === 404 ? <div>Couldn't find collection {collectionId}</div> :
          comparisonLoadingFailure ? <div>Failed to load comparison: {comparisonLoadingFailure}</div> :
          <div>Loading...</div>
        }
      </div>
    </>
  );
};

export default CompareScreen;
