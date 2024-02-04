import './RecentComparisons.css';

import {
  CollectionObject,
  CollectionObjectIdType,
  ComparisonElementResponse,
  ComparisonResultResponse,
  SnowflakeType
} from '../types.js';
import {
  QUERYSTRING_ARRAY_DELIMETER,
  QUERYSTRING_ELEMENT_DELIMETER,
  getServerHost
} from './utils.js';
import React, { useEffect, useState } from 'react';

import Cookies from 'js-cookie';
import CopyToClipboard from 'react-copy-to-clipboard';
import { Link } from 'react-router-dom';
import { Pin } from '../pins/pinpanion.js';
import { PinInfo } from '../pins/PinInfo.js';
import { Snackbar } from './Snackbar.js';
import { calculateRelativeValues } from '../rankings/value.js';

const eloRating: Map<SnowflakeType|object|number, number> = new Map<SnowflakeType|object|number, number>();
const elementValues: Map<SnowflakeType|object|number, number> = new Map<SnowflakeType|object|number, number>();
const objectValues: Map<CollectionObjectIdType, number> = new Map<CollectionObjectIdType, number>();

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
}

const createComparisonUrl = <ComparableObjectType extends CollectionObject<IdType>, IdType extends object|number>
  (comparison: ComparisonResultResponse<ComparableObjectType>): string => {
  const server = `${location.protocol}//${location.host}`;
  const objectString: string =
    comparison.elements.map((e) =>
      e.data.map((p: ComparableObjectType) => p.id).join(QUERYSTRING_ELEMENT_DELIMETER))
      .join(QUERYSTRING_ARRAY_DELIMETER);
  const linkString = `${server}/?objects=${objectString}`;
  return linkString;
};

export const RecentComparisons = <ComparableObjectType extends CollectionObject<IdType>, IdType extends object|number>(
  {
    currentUser = false,
    collectionId,
    maxComparisons,
  } : RecentComparisonsProps): JSX.Element => {
  // const collectionId = '83fd0b3e-dd08-4707-8135-e5f138a43f00';
  const [recentLoading, setRecentLoading] = useState<boolean>(false);
  const [recentLoaded, setRecentLoaded] = useState<boolean>(false);
  const [errorLoading, setErrorLoading] = useState<boolean>(false);
  const [recentComparisons, setRecentComparisons] = useState<ComparisonResultResponse<ComparableObjectType>[]>([]);
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
          const recentComparisonRequest: ComparisonResultResponse<ComparableObjectType> = res.data;
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
    calculateRelativeValues(objectValues, elementValues, recentComparisons);

    return (
      <>
        <h3 className="recentComparisons">Recent comparisons</h3>
        <div>
          {recentComparisons?.map((comparison: ComparisonResultResponse<ComparableObjectType>) => {
            return (
              <div className='comparisonGroup' key={comparison.id}>
                {comparison.elements?.map((element: ComparisonElementResponse<ComparableObjectType>) => {
                  const clipboardLink = createComparisonUrl(comparison);
                  const style = comparison.winner == element.elementId ? { backgroundColor: '#e1ffe1' } : {};
                  return <CopyToClipboard text={clipboardLink}
                    onCopy={() => setCopyMessageState(true)}>
                    <div style={style}
                      key={element.elementId}>
                      {element.data.map((dataElement: CollectionObject<IdType>) => {
                        // const pinInfo: Pin = getPinForId(dataElement);
                        return (<PinInfo
                          minimal={true}
                          pin={dataElement as unknown as Pin}
                          key={`${dataElement.id}`}
                          style={style}
                        />);
                      }) }
                    </div></CopyToClipboard>;
                })}
                <Snackbar
                  showPopup={copyMessageState}
                  onTransitionEnd={() => setCopyMessageState(false)}
                >Link copied to clipboard!</Snackbar>
              </div>
            );
          })}
        </div>
        <Link to="/">Home</Link>
      </>
    );
  } else {
    return (<>Somethings wrong</>);
  }
};
