import './RecentComparisons.css';

import { ComparisonElementResponse, ComparisonResultResponse } from '../types';
import React, { useEffect, useState } from 'react';

import Cookies from 'js-cookie';
import { Link } from 'react-router-dom';
import { Pin } from '../pins/pinpanion';
import { PinInfo } from '../pins/PinInfo';
import SuperJSON from 'superjson';
import { getServerHost } from './utils';

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

export const RecentComparisons = (
  {
    currentUser = false,
    collectionId,
    maxComparisons,
  } : RecentComparisonsProps): JSX.Element => {
  // const collectionId = '83fd0b3e-dd08-4707-8135-e5f138a43f00';
  const [recentLoading, setRecentLoading] = useState<boolean>(false);
  const [recentLoaded, setRecentLoaded] = useState<boolean>(false);
  const [recentComparisons, setRecentComparisons] = useState<ComparisonResultResponse<Pin>[]>([]);
  useEffect(() => {
    (async () => {
      if (!recentLoading && !recentLoaded) {
        setRecentLoading(true);
        setRecentLoaded(false);
        const res = await fetchRecentComparisons(collectionId, currentUser, maxComparisons);
        if (res.success) {
          console.log(`Loaded ${SuperJSON.stringify(res.data)}`);
          console.log(`As json: ${res.data}`);
          const recentComparisonRequest: ComparisonResultResponse<Pin> = res.data;
          setRecentComparisons(recentComparisonRequest as any);
          console.log(`Recent comparisons is now ${recentComparisons}`);
          setRecentLoaded(true);
        }
        setRecentLoading(false);
      }
    })();
  }, [recentLoading]);

  if (!recentLoaded) {
    return <div>Loading recent comparisons...</div>;
  } else if (recentComparisons) {
    return (
      <>
        <h3 className="recentComparisons">Recent comparisons</h3>
        <div>
          {recentComparisons?.map((comparison) => {
            return (
              <div className='comparisonGroup' key={comparison.id}>
                {comparison.elements.map((element: ComparisonElementResponse<Pin>) => {
                  const style = comparison.winner == element.elementId ? { backgroundColor: '#e1ffe1' } : {};
                  return <div style={style}
                    key={element.elementId}>
                    {element.data.map((dataElement) => {
                      // const pinInfo: Pin = getPinForId(dataElement);
                      return (<PinInfo
                        minimal={true}
                        pin={dataElement}
                        key={dataElement.id}
                        style={style}
                      />);
                    }) }
                  </div>;
                })}
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
