import { CollectionObjectType, ComparisonElementId, ComparisonElementResponse, EloTimelineResponse } from '../types.js';
import React, { useEffect, useState } from 'react';

import Cookies from 'js-cookie';
import { getServerHost } from './utils.js';

const DEFAULT_ELO_RATING = 400;

interface EloCalculationProps {
  collectionId: string;
}

interface ElementEloMutation {
  elementId: string | number;
  objectId: string;
  eloAfter: number;
  eloBefore: number;
  winner: string | number;
}

export const fetchElo = async (collectionId: string) => {
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

interface EloEvolutionTableProps<ComparableObject extends CollectionObjectType<IdType>, IdType> {
  data: EloTimelineResponse<ComparableObject, IdType>;
  evolutionElements: ElementEloMutation[];
}

const EloEvolutionTable = <ComparableObject extends CollectionObjectType<IdType>, IdType>({
  data,
  evolutionElements,
}: EloEvolutionTableProps<ComparableObject, IdType>): JSX.Element => {
  return (
    <div key={`elo-${data.id}`}>
      {data.id?.toString()} -&gt; {data.winner?.toString()}
      <table>
        <tbody>
          <tr>
            {evolutionElements.map((e: ElementEloMutation) => (
              <td key={`${e.elementId}-before}`}>{e.eloBefore}</td>
            ))}
          </tr>
          <tr>
            {evolutionElements.map((e: ElementEloMutation) => (
              <td key={`${e.elementId}-id}`}>{e.winner === e.elementId ? <b>{e.objectId}</b> : e.objectId}</td>
            ))}
          </tr>
          <tr>
            {evolutionElements.map((e: ElementEloMutation) => (
              <td key={`${e.elementId}-after}`}>{e.eloAfter}</td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export const EloCalculation = <ComparableObject extends CollectionObjectType<IdType>, IdType extends object | number>({
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

  const convertTimelineElement = (data: EloTimelineResponse<ComparableObject, IdType>): ElementEloMutation[] => {
    return data.elements.flatMap((element: ComparisonElementResponse<ComparableObject>) => {
      const elementId: ComparisonElementId = element.elementId;
      return element.data.map((elementObject: ComparableObject) => {
        const searchId: number | string =
          typeof elementObject.id === 'number' ? (elementObject.id as number) : elementObject?.id.toString();
        return {
          elementId: elementId,
          eloAfter: data.eloRatingsAfter?.find((after) => after.objectId == searchId)?.rating || DEFAULT_ELO_RATING,
          eloBefore: data.eloRatingsBefore?.find((before) => before.objectId == searchId)?.rating || DEFAULT_ELO_RATING,
          objectId: searchId,
          winner: data.winner,
        } as ElementEloMutation;
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
          const allElements: ElementEloMutation[] = convertTimelineElement(data);
          return <EloEvolutionTable data={data} evolutionElements={allElements} />;
        })}
      </>
    );
  }
  return <></>;
};
