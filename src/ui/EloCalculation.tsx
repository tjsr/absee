import './EloCalculation.css';

import {
  CollectionIdType,
  CollectionObject,
  CollectionObjectId,
  ComparisonElementId,
  ComparisonElementResponse,
  EloTimelineResponse
} from '../types.js';
import React, { useEffect, useState } from 'react';

import Cookies from 'js-cookie';
import { Pin } from '../pins/pinpanion.js';
import { PinInfo } from '../pins/PinInfo.js';
import { getServerHost } from './utils.js';

const DEFAULT_ELO_RATING = 2000;

interface EloCalculationProps {
  collectionId: string;
}

interface ElementEloMutation<IdType extends CollectionObjectId> {
  elementId: ComparisonElementId;
  objectId: IdType;
  objectData: CollectionObject<IdType>;
  eloAfter: number;
  eloBefore: number;
  winner: ComparisonElementId;
}

export const fetchElo = async (collectionId: CollectionIdType) => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    const sessionId = Cookies.get('sessionId');
    if (sessionId !== undefined && sessionId !== 'undefined') {
      headers['x-session-id'] = sessionId;
    }

    const response = await fetch(`${getServerHost()}/api/elo/${collectionId}`, {
      headers,
      method: 'GET',
    });

    const json = await response.json();
    return { data: json, success: true };
  } catch (error) {
    console.log(error);
    return { success: false };
  }
};

interface EloEvolutionTableProps<ComparableObject extends CollectionObject<IdType>, IdType extends CollectionObjectId> {
  data: EloTimelineResponse<ComparableObject, IdType>;
  evolutionElements: ElementEloMutation<IdType>[];
}

const EloEvolutionTable = <ComparableObject extends CollectionObject<IdType>, IdType extends CollectionObjectId>({
  data,
  evolutionElements,
}: EloEvolutionTableProps<ComparableObject, IdType>): JSX.Element => {
  return (
    <div key={`elo-${data.id}`}>
      {data.id?.toString()} -&gt; {data.winner?.toString()}
      <table>
        <tbody>
          <tr>
            {evolutionElements.map((e: ElementEloMutation<IdType>) => (
              <td key={`${e.elementId}-before}`}>{e.eloBefore}</td>
            ))}
          </tr>
          <tr>
            {evolutionElements.map((e: ElementEloMutation<IdType>) => {
              const isWinner = e.winner == e.elementId;
              const style = isWinner ? { backgroundColor: '#e1ffe1' } : {};
              const dataElement: CollectionObject<IdType> = e.objectData;
              // loader.getObjectForId(loader.collectionData!, e.objectId);
              return (<td key={`${e.elementId}-id}`}>{dataElement && <div className="eloPinInfo"><PinInfo
                minimal={true}
                pin={dataElement as unknown as Pin}
                key={`${e.elementId}-${e.objectId}`}
                style={style}
              /></div>}<div className={`eloObjectId${isWinner ? ' isWinner' : ''}`}>{e.objectId}</div></td>);
            })}
          </tr>
          <tr>
            {evolutionElements.map((e: ElementEloMutation<IdType>) => (
              <td key={`${e.elementId}-after}`}>{e.eloAfter}</td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export const EloCalculation = <ComparableObject extends CollectionObject<IdType>, IdType extends CollectionIdType>({
  collectionId,
}: EloCalculationProps): JSX.Element => {
  const [eloLoading, setEloLoading] = useState<boolean>(false);
  const [eloLoaded, setEloLoaded] = useState<boolean>(false);
  const [errorLoading, setErrorLoading] = useState<boolean>(false);
  const [eloTimelineData, setEloTimelineData] = useState<EloTimelineResponse<ComparableObject, IdType>[]>([]);
  useEffect(() => {
    (async () => {
      if (!eloLoading && !eloLoaded) {
        setEloLoading(true);
        setEloLoaded(false);
        const res = await fetchElo(collectionId);
        if (res.success) {
          const recentComparisonRequest: EloTimelineResponse<ComparableObject, IdType> = res.data;
          setEloTimelineData(recentComparisonRequest as any);
          setEloLoaded(true);
        } else {
          setErrorLoading(true);
        }
        setEloLoading(false);
      }
    })();
  }, [eloLoading]);

  const convertTimelineElement = (data: EloTimelineResponse<ComparableObject, IdType>):
  ElementEloMutation<IdType>[] => {
    return data.elements.flatMap((element: ComparisonElementResponse<ComparableObject, IdType>) => {
      const elementId: ComparisonElementId = element.elementId;
      return element.data.map((elementObject: ComparableObject) => {
        const searchId: number | string =
          typeof elementObject.id === 'number' ? (elementObject.id as number) : elementObject?.id.toString();
        const collectionObjectData: CollectionObject<IdType>|undefined =
          data.collectionObjects.find((co: CollectionObject<IdType>) => co.id == searchId);
        return {
          elementId: elementId,
          eloAfter: data.eloRatingsAfter?.find((after) => after.objectId == searchId)?.rating || DEFAULT_ELO_RATING,
          eloBefore: data.eloRatingsBefore?.find((before) => before.objectId == searchId)?.rating || DEFAULT_ELO_RATING,
          objectData: collectionObjectData,
          objectId: searchId,
          winner: data.winner,
        } as ElementEloMutation<IdType>;
      });
    });
  };

  if (!eloLoaded) {
    return <div>Loading recent comparisons...</div>;
  } else if (errorLoading) {
    return <div>Error loading comparisons.</div>;
  } else if (eloTimelineData) {
    return (
      <>
        <p>Timeline elements: {eloTimelineData.length}</p>
        {eloTimelineData.map((data: EloTimelineResponse<ComparableObject, IdType>) => {
          const allElements: ElementEloMutation<IdType>[] = convertTimelineElement(data);
          return <EloEvolutionTable data={data} evolutionElements={allElements} />;
        })}
      </>
    );
  }
  return <></>;
};
