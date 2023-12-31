import './RecentComparisons.css';

import { ComparisonElementResponse, ComparisonResultResponse } from '../types';
import React, { useEffect, useState } from 'react';

import Cookies from 'js-cookie';
import { Link } from 'react-router-dom';
import { Pin } from '../pins/pinpanion';
import { PinInfo } from '../pins/PinInfo';
import SuperJSON from 'superjson';
import { getServerHost } from './utils';

const eloRating: Map<number, number> = new Map<number, number>();

const getCurrentEloRating = (pin: Pin): number => {
  const currentRating = eloRating.get(pin.id);
  if (currentRating === undefined) {
    return 2500;
  }
  return currentRating;
};

const getEloRatingForElement = (element: ComparisonElementResponse<Pin>): number => {
  const elementRating = element.data.map((pin: Pin) => getCurrentEloRating(pin)).reduce((acc, cur) => acc + cur);
  return elementRating;
};

const updateEloRating = (element: ComparisonElementResponse<Pin>, ratingUpdate: number) => {
  const elo = getEloRatingForElement(element);
  element.data.forEach((pin: Pin) => {
    eloRating.set(pin.id, elo + ratingUpdate);
  });
};

const updateEloRatings = (
  winningElement: ComparisonElementResponse<Pin>,
  otherElement: ComparisonElementResponse<Pin>
) => {
  updateEloRating(winningElement, 25);
  updateEloRating(otherElement, -25);
};

const calculateEloRatings = (recentComparisons: ComparisonResultResponse<Pin>[]) => {
  const filteredComparisons: ComparisonResultResponse<Pin>[] = recentComparisons
    ?.filter((comparison: ComparisonResultResponse<Pin>) =>
      comparison.elements?.every((element) => element.data.length == 1))
    .sort((a, b) => a.requestTime?.toString().localeCompare(b.requestTime?.toString()));
  console.log(`Filtered to ${filteredComparisons.length} comparisons`);

  filteredComparisons.forEach((comparison) => {
    const elementRatings: number[] = comparison.elements.map((element) => getEloRatingForElement(element));
    const winningElement = comparison.elements.filter((element) => element.elementId == comparison.winner)[0];
    const otherElement = comparison.elements.filter((element) => element.elementId != comparison.winner)[0];

    updateEloRatings(winningElement, otherElement);

    console.log(`Camparison ${elementRatings.join(' vs ')} on ${comparison.requestTime}`);
  //   const currentElo = comparison.elements.forEach((element) => {
  //     element.data.filter((d) => d.=> {
  //     element.data.filter((d) => d.forEach((data) => {
  //
  //     });
  //   });
  });
};

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
          // console.log(`Loaded ${SuperJSON.stringify(res.data)}`);
          // console.log(`As json: ${res.data}`);
          const recentComparisonRequest: ComparisonResultResponse<Pin> = res.data;
          setRecentComparisons(recentComparisonRequest as any);
          // console.log(`Recent comparisons is now ${recentComparisons}`);
          setRecentLoaded(true);
        }
        setRecentLoading(false);
      }
    })();
  }, [recentLoading]);

  if (!recentLoaded) {
    return <div>Loading recent comparisons...</div>;
  } else if (recentComparisons) {
    calculateEloRatings(recentComparisons);

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
