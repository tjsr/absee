import { CollectionObjectType, EloTimelineResponse } from '../types.js';
import React, { useEffect, useState } from 'react';

import Cookies from 'js-cookie';
import { getServerHost } from './utils.js';

const DEFAULT_ELO_RATING = 400;

interface EloCalculationProps {
  collectionId: string;
}

interface EleementEloMutation {
  elementId: string | number;
  eloAfter: number;
  eloBefore: number;
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

  if (!eloLoaded) {
    return <div>Loading recent comparisons...</div>;
  } else if (errorLoading) {
    return <div>Error loading comparisons.</div>;
  } else if (eloTimelineData) {
    return (
      <>
        <p>Timeline elements: {eloTimelineData.length}</p>
        {eloTimelineData.map((data) => {
          const allElements: EleementEloMutation[] = data.elements
            .flatMap((element) => element.data)
            .map((element) => {
              const searchId: number | string =
                typeof element?.id === 'number' ? (element?.id as number) : element?.id?.toString();
              return {
                elementId: searchId,
                eloAfter:
                  data.eloRatingsAfter?.find((after) => after.elementId == searchId)?.rating || DEFAULT_ELO_RATING,
                eloBefore:
                  data.eloRatingsBefore?.find((before) => before.elementId == searchId)?.rating || DEFAULT_ELO_RATING,
              } as EleementEloMutation;
            });
          return (
            <div key={`elo-${data.id}`}>
              {data.id?.toString()} -&gt; {data.winner?.toString()}
              <table>
                <tbody>
                  <tr>
                    {allElements.map((e) => (
                      <td key={`${e.elementId}-before}`}>{e.eloBefore}</td>
                    ))}
                  </tr>
                  <tr>
                    {allElements.map((e) => (
                      <td key={`${e.elementId}-id}`}>{e.elementId}</td>
                    ))}
                  </tr>
                  <tr>
                    {allElements.map((e) => (
                      <td key={`${e.elementId}-after}`}>{e.eloAfter}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          );
        })}
      </>
    );
  }
  return <></>;
};
