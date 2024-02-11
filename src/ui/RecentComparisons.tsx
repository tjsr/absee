import './RecentComparisons.css';

import {
  CollectionObject,
  CollectionObjectId,
  ComparisonElementResponse,
  ComparisonResultResponse
} from '../types.js';
import { QUERYSTRING_ARRAY_DELIMETER, QUERYSTRING_ELEMENT_DELIMETER, getServerHost } from './utils.js';
import React, { useEffect, useState } from 'react';

import Cookies from 'js-cookie';
import CopyToClipboard from 'react-copy-to-clipboard';
import { Link } from 'react-router-dom';
import { Pin } from '../pins/pinpanion.js';
import { PinInfo } from '../pins/PinInfo.js';
import { Snackbar } from './Snackbar.js';
import { calculateRelativeValues } from '../rankings/value.js';

// const eloRating: CollectionEloMap = new Map<SnowflakeType | string | number, number>();
// const elementValues: Map<SnowflakeType | object | number, number> =
// new Map<SnowflakeType | object | number, number>();
const objectValues: Map<CollectionObjectId, number> = new Map<CollectionObjectId, number>();

export const fetchRecentComparisons = async (collectionId: string, currentUser = false, maxComparisons?: number) => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    const sessionId = Cookies.get('sessionId');
    const maxString = maxComparisons !== undefined && maxComparisons > 0 ? `?max=${maxComparisons}` : '';
    if (sessionId !== undefined && sessionId !== 'undefined') {
      headers['x-session-id'] = sessionId;
    }

    const response = await fetch(
      `${getServerHost()}/api/recent/${collectionId}${currentUser ? '/me' : ''}${maxString}`,
      {
        headers,
        method: 'GET',
      }
    );

    const json = await response.json();
    return { data: json, success: true };
  } catch (error) {
    console.log(error);
    return { success: false };
  }
};

type RecentComparisonsProps = {
  collectionId: string;
  currentUser?: boolean;
  maxComparisons?: number;
};

const createComparisonUrl = <CO extends CollectionObject<IdType>, IdType extends CollectionObjectId>(
  comparison: ComparisonResultResponse<CO, IdType>
): string => {
  const server = `${location.protocol}//${location.host}`;
  const objectString: string = comparison.elements
    .map((e) => e.data.map((p: CO) => p.id).join(QUERYSTRING_ELEMENT_DELIMETER))
    .join(QUERYSTRING_ARRAY_DELIMETER);
  const linkString = `${server}/?objects=${objectString}`;
  return linkString;
};

export const RecentComparisons = <CO extends CollectionObject<IdType>, IdType extends CollectionObjectId>({
  currentUser = false,
  collectionId,
  maxComparisons,
}: RecentComparisonsProps): JSX.Element => {
  // const collectionId = '83fd0b3e-dd08-4707-8135-e5f138a43f00';
  const [recentLoading, setRecentLoading] = useState<boolean>(false);
  const [recentLoaded, setRecentLoaded] = useState<boolean>(false);
  const [errorLoading, setErrorLoading] = useState<boolean>(false);
  const [recentComparisons, setRecentComparisons] = useState<ComparisonResultResponse<CO, IdType>[]>([]);
  const [copyMessageState, setCopyMessageState] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      if (!recentLoading && !recentLoaded) {
        setRecentLoading(true);
        setRecentLoaded(false);
        const res = await fetchRecentComparisons(collectionId, currentUser, maxComparisons);
        if (res.success) {
          // console.log(`Loaded ${SuperJSON.stringify(res.data)}`);
          // console.log(`As json: ${res.data}`);
          const recentComparisonRequest: ComparisonResultResponse<CO, IdType> = res.data;
          setRecentComparisons(recentComparisonRequest as any);
          // console.log(`Recent comparisons is now ${recentComparisons}`);
          setRecentLoaded(true);
        } else {
          setErrorLoading(true);
        }
        setRecentLoading(false);
      }
    })();
  }, [recentLoading]);

  if (!recentLoaded) {
    return <div>Loading recent comparisons...</div>;
  } else if (errorLoading) {
    return <div>Error loading comparisons.</div>;
  } else if (recentComparisons) {
    // calculateEloRatings(eloRating, recentComparisons);
    calculateRelativeValues(objectValues, recentComparisons);

    return (
      <>
        <h3 className="recentComparisons">Recent comparisons</h3>
        <div>
          {recentComparisons?.map((comparison: ComparisonResultResponse<CO, IdType>) => {
            return (
              <div className="comparisonGroup" key={comparison.id}>
                {comparison.elements?.map((element: ComparisonElementResponse<CO, IdType>) => {
                  const clipboardLink = createComparisonUrl(comparison);
                  const style = comparison.winner == element.elementId ? { backgroundColor: '#e1ffe1' } : {};
                  return (
                    <CopyToClipboard text={clipboardLink} onCopy={() => setCopyMessageState(true)}>
                      <div style={style} key={element.elementId}>
                        {element.data.map((dataElement: CO) => {
                          // const pinInfo: Pin = getPinForId(dataElement);
                          return (
                            <PinInfo
                              minimal={true}
                              pin={dataElement as unknown as Pin}
                              key={`${dataElement.id}`}
                              style={style}
                            />
                          );
                        })}
                      </div>
                    </CopyToClipboard>
                  );
                })}
                <Snackbar showPopup={copyMessageState} onTransitionEnd={() => setCopyMessageState(false)}>
                  Link copied to clipboard!
                </Snackbar>
              </div>
            );
          })}
        </div>
        <Link to="/">Home</Link>
      </>
    );
  } else {
    return <>Somethings wrong</>;
  }
};
