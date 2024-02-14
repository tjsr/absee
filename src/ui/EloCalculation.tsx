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

interface ElementEloMutation<CollectionObjectType extends CollectionObject<IdType>, IdType extends CollectionObjectId> {
  elementId: ComparisonElementId;
  objectId: IdType;
  objectData: CollectionObjectType;
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

interface EloEvolutionTableProps<
CollectionObjectType extends CollectionObject<IdType>, IdType extends CollectionObjectId> {
  data: EloTimelineResponse<CollectionObjectType, IdType>;
  evolutionElements: ElementEloMutation<CollectionObjectType, IdType>[];
  toggleObjectSearch: (comparableObject: CollectionObjectType) => void;
}

const EloEvolutionTable = <CollectionObjectType extends CollectionObject<IdType>, IdType extends CollectionObjectId>({
  data,
  evolutionElements,
  toggleObjectSearch,
}: EloEvolutionTableProps<CollectionObjectType, IdType>): JSX.Element => {
  return (
    <div key={`elo-${data.id}`}>
      {data.id?.toString()} -&gt; {data.winner?.toString()}
      <table>
        <tbody>
          <tr>
            {evolutionElements.map((e: ElementEloMutation<CollectionObjectType, IdType>) => (
              <td key={`${e.elementId}-${e.objectId}-before}`}>{e.eloBefore}</td>
            ))}
          </tr>
          <tr>
            {evolutionElements.map((e: ElementEloMutation<CollectionObjectType, IdType>) => {
              const isWinner = e.winner == e.elementId;
              const style = isWinner ? { backgroundColor: '#e1ffe1' } : {};
              const dataElement: CollectionObjectType = e.objectData;
              // loader.getObjectForId(loader.collectionData!, e.objectId);
              return (<td key={`${e.elementId}-${e.objectId}}`}>{dataElement && <div
                onClick={() => toggleObjectSearch(dataElement)} className="eloPinInfo"><PinInfo
                  minimal={true}
                  pin={dataElement as unknown as Pin}
                  key={`${e.elementId}-${e.objectId}`}
                  style={style}
                /></div>}<div className={`eloObjectId${isWinner ? ' isWinner' : ''}`}>{e.objectId}</div></td>);
            })}
          </tr>
          <tr>
            {evolutionElements.map((e: ElementEloMutation<CollectionObjectType, IdType>) => (
              <td key={`${e.elementId}-${e.objectId}-after}`}>{e.eloAfter}</td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
};

interface FilteredElementsProps<
CollectionObjectType extends CollectionObject<IdType>, IdType extends CollectionObjectId> {
  filtered: Map<IdType, CollectionObjectType>;
  toggleObjectSearch: (filteredObject: CollectionObjectType) => void;
}

const FilteredElements = <CollectionObjectType extends CollectionObject<IdType>, IdType extends CollectionObjectId>(
  { filtered, toggleObjectSearch } : FilteredElementsProps<CollectionObjectType, IdType>): JSX.Element => {
  const elementKeys: IdType[] = Array.from(filtered.keys());
  // elementKeys.forEach((ek) => console.log(ek));
  const collectionObjects: CollectionObjectType[] = elementKeys.map((objectId: IdType) => filtered.get(objectId))
    .filter((co) => co !== undefined) as CollectionObjectType[];

  return <>{collectionObjects.map((e: CollectionObjectType) => (<div key={`filteredElement-${e!.id}`}
    onClick={() => toggleObjectSearch(e!)} className="eloInfo">
    <PinInfo
      minimal={true}
      pin={e as unknown as Pin}
    /></div>)
  )}</>;
};

export const EloCalculation = <CollectionObjectType extends CollectionObject<IdType>, IdType extends CollectionIdType>({
  collectionId,
}: EloCalculationProps): JSX.Element => {
  const [eloLoading, setEloLoading] = useState<boolean>(false);
  const [eloLoaded, setEloLoaded] = useState<boolean>(false);
  const [errorLoading, setErrorLoading] = useState<boolean>(false);
  const [eloTimelineData, setEloTimelineData] = useState<EloTimelineResponse<CollectionObjectType, IdType>[]>([]);
  const [filteredElementData, setFilteredElementData] = useState<Map<IdType, CollectionObjectType>>(new Map());
  const [objectsFilteredCount, setObjectsFilteredCount] = useState<number>(0);
  useEffect(() => {
    (async () => {
      if (!eloLoading && !eloLoaded) {
        setEloLoading(true);
        setEloLoaded(false);
        const res = await fetchElo(collectionId);
        if (res.success) {
          const recentComparisonRequest: EloTimelineResponse<CollectionObjectType, IdType> = res.data;
          setEloTimelineData(recentComparisonRequest as any);
          setEloLoaded(true);
        } else {
          setErrorLoading(true);
        }
        setEloLoading(false);
      }
    })();
  }, [eloLoading]);

  const convertTimelineElement = (data: EloTimelineResponse<CollectionObjectType, IdType>):
  ElementEloMutation<CollectionObjectType, IdType>[] => {
    return data.elements.flatMap((element: ComparisonElementResponse<CollectionObjectType, IdType>) => {
      const elementId: ComparisonElementId = element.elementId;
      return element.data.map((elementObject: CollectionObjectType) => {
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
        } as ElementEloMutation<CollectionObjectType, IdType>;
      });
    });
  };

  const responseHasObject = (data: EloTimelineResponse<CollectionObjectType, IdType>,
    filteredElementData: Map<IdType, CollectionObjectType>): boolean => {
    const objectIdList = data.elements.flatMap((elements) => elements.data);
    // console.log(JSON.stringify(objectIdList));
    // console.log(filteredElementData);
    // return true;
    return objectIdList.some(
      (co: CollectionObjectType) => filteredElementData.has(co.id));
  };

  const toggleObjectSearch = (filteredObject: CollectionObjectType):void => {
    const objectId: IdType = filteredObject.id.toString() as IdType;
    if (!filteredElementData.has(objectId)) {
      filteredElementData.set(objectId, filteredObject);
      console.log(`Removing ${objectId} from showObjects which now has ${filteredElementData.size} elements.`);
    } else {
      filteredElementData.delete(objectId);
      console.log(`Adding ${objectId} from showObjects which now has ${filteredElementData.size} elements.`);
    }
    setObjectsFilteredCount(filteredElementData.size);
    setFilteredElementData(new Map(filteredElementData));
  };

  if (!eloLoaded) {
    return <div>Loading recent comparisons...</div>;
  } else if (errorLoading) {
    return <div>Error loading comparisons.</div>;
  } else if (eloTimelineData) {
    return (
      <>
        <p>Timeline elements: {eloTimelineData.length}</p>
        { objectsFilteredCount > 0 && (
          <div>Filtered to:
            <FilteredElements filtered={filteredElementData} toggleObjectSearch={toggleObjectSearch} />
          </div>
        )}
        {eloTimelineData
          .map((data: EloTimelineResponse<CollectionObjectType, IdType>) => {
            const hasObject: boolean = responseHasObject(data, filteredElementData);
            // if (hasObject) {
            //   console.log(`Num filtered: ${objectsFilteredCount}  has Object ${JSON.stringify(data)} ${hasObject}`);
            // }
            if (objectsFilteredCount == 0 || hasObject) {
              // data.elements.forEach((ek) => console.log(`Response has object: ${JSON.stringify(ek)}`));
              const allElements: ElementEloMutation<CollectionObjectType, IdType>[] = convertTimelineElement(data);
              return <EloEvolutionTable
                data={data}
                evolutionElements={allElements}
                toggleObjectSearch={toggleObjectSearch} />;
            } else {
              return (<></>);
            }
          })}
      </>
    );
  }
  return <></>;
};
