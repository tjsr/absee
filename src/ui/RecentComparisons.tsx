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

const eloRating: Map<SnowflakeType|object|number, number> = new Map<SnowflakeType|object|number, number>();
const elementValues: Map<SnowflakeType|object|number, number> = new Map<SnowflakeType|object|number, number>();
const objectValues: Map<CollectionObjectIdType, number> = new Map<CollectionObjectIdType, number>();
const STARTING_ELO_RATING = 400;
const ELO_WIN_DELTA = 32;
const DEFAULT_ELEMENT_VALUE = 15;

const getCurrentValue = <CollectionObjectType extends CollectionObject<IdType>, IdType extends object|number>
  (element: CollectionObjectType): number => {
  const currentValue = elementValues.get(element.id);
  if (currentValue === undefined) {
    return DEFAULT_ELEMENT_VALUE;
  }
  return currentValue;
};

const getCurrentEloRating = <CollectionObjectType extends CollectionObject<IdType>, IdType extends object|number>
  (element: CollectionObjectType): number => {
  const currentRating = eloRating.get(element.id);
  if (currentRating === undefined) {
    return STARTING_ELO_RATING;
  }
  return currentRating;
};

const getObjectValue = <T extends CollectionObject<IdType>, IdType extends object|number>(
  comparableObject: T
): number|undefined => {
  const id = getComparableObjectId<T, IdType>(comparableObject);
  const objectValue = objectValues.get(id);
  return objectValue;
};

const getElementValue = <T extends CollectionObject<IdType>, IdType extends object|number>
  (element: ComparisonElementResponse<T>): number => {
  const elementRating = element.data.map(
    (elementData: T) => getCurrentValue(elementData)).reduce((acc, cur) => acc + cur);
  return elementRating;
};

const getEloRatingForElement = <CollectionObjectType extends CollectionObject<IdType>, IdType extends object|number>
  (element: ComparisonElementResponse<CollectionObjectType>): number => {
  const elementRating = element.data.map(
    (objectElement: CollectionObjectType) => getCurrentEloRating(objectElement))
    .reduce((acc, cur) => acc + cur);
  return elementRating;
};

const updateEloRating = <ComparableObjectType extends CollectionObject<IdType>, IdType extends object|number>
  (element: ComparisonElementResponse<ComparableObjectType>, ratingUpdate: number): void => {
  const elo = getEloRatingForElement(element);
  element.data.forEach((objectElement: ComparableObjectType) => {
    eloRating.set(objectElement.id, elo + ratingUpdate);
  });
};

const getComparableObjectId = <T extends CollectionObject<IdType>,
  IdType>(object: T): IdType => {
  return object.id;
};

const updateObjectValue = <T extends CollectionObject<IdType>,
  IdType extends object|number>(comparableObject: T, updatedValue: number): void => {
  const objectId = getComparableObjectId<CollectionObject<IdType>, IdType>(
    comparableObject
  );
  console.log(`Updating ${objectId} to ${updatedValue}`);
  objectValues.set(objectId, updatedValue);
};

const calculateExpectedOutcome = (eloRating1: number, eloRating2: number): number => 1 / (1 +
  Math.pow(10, (
    eloRating2 - eloRating1
  ) / STARTING_ELO_RATING));

const updateEloRatings = (
  winningElement: ComparisonElementResponse<CollectionObject<any>>,
  otherElement: ComparisonElementResponse<CollectionObject<any>>
) => {
  const existingWinnerElo = getEloRatingForElement(winningElement);
  const existingOtherElo = getEloRatingForElement(otherElement);
  const expectedOutcomeA = calculateExpectedOutcome(existingWinnerElo, existingOtherElo);
  const expectedOutcomeB = calculateExpectedOutcome(existingOtherElo, existingWinnerElo);

  const pointsForRatingA = ELO_WIN_DELTA * (1 - expectedOutcomeA);
  const pointsForRatingB = ELO_WIN_DELTA * (0 - expectedOutcomeB);
  console.log(`Expected outcome: ${existingWinnerElo}/${pointsForRatingA} vs ${existingOtherElo}/${pointsForRatingB}`);
  updateEloRating(winningElement, pointsForRatingA);
  updateEloRating(otherElement, pointsForRatingB);
};

const calculateRelativeValues = <ComparableObjectType extends CollectionObject<IdType>, IdType extends object|number>
  (recentComparisons: ComparisonResultResponse<ComparableObjectType>[]) => {
  const filteredComparisons: ComparisonResultResponse<ComparableObjectType>[] = recentComparisons
    ?.filter((comparison: ComparisonResultResponse<ComparableObjectType>) =>
      comparison.elements?.every((element) => element.data.length > 0))
    .sort((a, b) => a.requestTime?.toString().localeCompare(b.requestTime?.toString()));
  filteredComparisons.forEach((comparison) => {
    // const elementValues: number[] = comparison.elements?.map((element) => getElementValue(element));
    const winningElement = comparison.elements?.filter((element) => element.elementId == comparison.winner)[0];
    const otherElement = comparison.elements?.filter((element) => element.elementId != comparison.winner)[0];
    if (winningElement && otherElement) {
      if (winningElement.data.length === 1) {
        const otherElementValue = getElementValue<ComparableObjectType, IdType>(otherElement);
        // const otherElementValue = getObjectValue<ComparableObjectType, IdType>(otherElement.data[0]) ??
        //   DEFAULT_ELEMENT_VALUE * (otherElement.data?.length ?? 1);
        const winningElementValue = getElementValue<ComparableObjectType, IdType>(winningElement);
        const comparisonElementString = comparison.elements?.map(
          (e) => {
            const elementDataItemsString = e.data.map((d) =>
              getComparableObjectId<ComparableObjectType, IdType>(d)).join(',');
            return elementDataItemsString;
          }).join(' vs ');

        if (otherElementValue > winningElementValue) {
          const updatedElementValue = otherElementValue ? otherElementValue + 1 : DEFAULT_ELEMENT_VALUE;
          updateObjectValue<ComparableObjectType, IdType>(
            winningElement.data[0], updatedElementValue
          );
          const individualValues = otherElement.data.map(
            (elementData: ComparableObjectType) => getCurrentValue(elementData)).join('+');
          console.log(`Camparison ${comparisonElementString} on ${comparison.requestTime} ${otherElementValue} ` +
            `updated to ${individualValues}=${updatedElementValue}`);
        } else {
          console.log(`Comparison of ${comparisonElementString} winning ` +
          `value ${winningElementValue} already exceeds other value ${otherElementValue}.`);
        }
      }
    }
  });
};

const calculateEloRatings = <ComparableObjectType extends CollectionObject<IdType>, IdType extends object|number>
  (recentComparisons: ComparisonResultResponse<ComparableObjectType>[]) => {
  const filteredComparisons: ComparisonResultResponse<ComparableObjectType>[] = recentComparisons
    ?.filter((comparison: ComparisonResultResponse<ComparableObjectType>) =>
      comparison.elements?.every((element) => element.data.length > 0))
    .sort((a, b) => a.requestTime?.toString().localeCompare(b.requestTime?.toString()));
  console.log(`Filtered to ${filteredComparisons.length} comparisons`);

  filteredComparisons.forEach((comparison) => {
    if (comparison.elements?.every((element) => element.data.length == 1)) {
      const elementRatings: number[] = comparison.elements?.map((element) => getEloRatingForElement(element));
      const winningElement = comparison.elements?.filter((element) => element.elementId == comparison.winner)[0];
      const otherElement = comparison.elements?.filter((element) => element.elementId != comparison.winner)[0];

      if (winningElement && otherElement) {
        updateEloRatings(winningElement, otherElement);
        console.log(`Camparison ${elementRatings.join(' vs ')} on ${comparison.requestTime}`);
      } else {
        console.warn('Didnt get both a winning and other element.');
      }
    } else {
      // Might have more than 1 on one side of the comparison
      console.warn(`Comparison ${comparison.id} has more than 1 element on one side`);
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
    // calculateEloRatings(recentComparisons);
    calculateRelativeValues(recentComparisons);

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
