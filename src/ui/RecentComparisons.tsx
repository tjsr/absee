import './RecentComparisons.css';

import { ComparisonElementResponse, ComparisonResultResponse } from '../types';
import {
  QUERYSTRING_ARRAY_DELIMETER,
  QUERYSTRING_ELEMENT_DELIMETER,
  getServerHost
} from './utils';
import React, { useEffect, useState } from 'react';

import Cookies from 'js-cookie';
import CopyToClipboard from 'react-copy-to-clipboard';
import { Link } from 'react-router-dom';
import { Pin } from '../pins/pinpanion';
import { PinInfo } from '../pins/PinInfo';
import { Snackbar } from './ComparisonLink';

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
    const elementRatings: number[] = comparison.elements?.map((element) => getEloRatingForElement(element));
    const winningElement = comparison.elements?.filter((element) => element.elementId == comparison.winner)[0];
    const otherElement = comparison.elements?.filter((element) => element.elementId != comparison.winner)[0];

    if (winningElement && otherElement) {
      updateEloRatings(winningElement, otherElement);
      console.log(`Camparison ${elementRatings.join(' vs ')} on ${comparison.requestTime}`);
    } else {
      console.warn('Didnt get both a winning and other element.');
    }

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

const createComparisonUrl = (comparison: ComparisonResultResponse<Pin>): string => {
  const server = `${location.protocol}//${location.host}`;
  const objectString: string =
    comparison.elements.map((e) =>
      e.data.map((p: Pin) => p.id).join(QUERYSTRING_ELEMENT_DELIMETER))
      .join(QUERYSTRING_ARRAY_DELIMETER);
  const linkString = `${server}/?objects=${objectString}`;
  return linkString;
};


export const RecentComparisons = (
  {
    currentUser = false,
    collectionId,
    maxComparisons,
  } : RecentComparisonsProps): JSX.Element => {
  // const collectionId = '83fd0b3e-dd08-4707-8135-e5f138a43f00';
  const [recentLoading, setRecentLoading] = useState<boolean>(false);
  const [recentLoaded, setRecentLoaded] = useState<boolean>(false);
  const [errorLoading, setErrorLoading] = useState<boolean>(false);
  const [recentComparisons, setRecentComparisons] = useState<ComparisonResultResponse<Pin>[]>([]);
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
          const recentComparisonRequest: ComparisonResultResponse<Pin> = res.data;
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
    calculateEloRatings(recentComparisons);

    return (
      <>
        <h3 className="recentComparisons">Recent comparisons</h3>
        <div>
          {recentComparisons?.map((comparison: ComparisonResultResponse<Pin>) => {
            function copyComparisonLink(comparison: ComparisonResultResponse<Pin>): void {
              throw new Error('Function not implemented.');
            }

            return (
              <div className='comparisonGroup' key={comparison.id} onClick={() => copyComparisonLink(comparison)}>
                {comparison.elements?.map((element: ComparisonElementResponse<Pin>) => {
                  const clipboardLink = createComparisonUrl(comparison);
                  const style = comparison.winner == element.elementId ? { backgroundColor: '#e1ffe1' } : {};
                  return <CopyToClipboard text={clipboardLink}
                    onCopy={() => setCopyMessageState(true)}>
                    <div style={style}
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
