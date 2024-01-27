import React, { useEffect } from 'react';

import { CollectionIdType } from '../types.js';
import { StatsResponse } from '../api/stats/stats.js';

interface StatsPageProps {
  collectionId: CollectionIdType;
}

export const StatsPage = ({ collectionId }: StatsPageProps ):JSX.Element => {
  const [elementsCompared, setElementsCompared] = React.useState<number|undefined>(undefined);
  const [usersContributed, setUsersContributed] = React.useState<number|undefined>(undefined);
  const [mostFrequentlyCompared, setMostFrequentlyCompared] = React.useState<[string, number]|undefined>(undefined);
  const [notReady, setNotReady] = React.useState<boolean>(true);

  useEffect(() => {
    (async () => {
      const response = await fetch(`/api/stats/elementsCompared/${collectionId}`);
      const json: StatsResponse = await response.json();
      setElementsCompared(json.elementsCompared);
      setUsersContributed(json.usersContributed);
      if (json.mostFrequentlyComparedElement && json.mostFrequentlyComparedElementCount) {
        setMostFrequentlyCompared([json.mostFrequentlyComparedElement, json.mostFrequentlyComparedElementCount]);
      }
      setNotReady(false);
    })();
  }, [collectionId]);

  if (!notReady) {
    return <><ul>
      { elementsCompared && <li>Number of comparison responses submitted: {elementsCompared}</li>}
      { usersContributed && <li>Number of users contributed: {usersContributed}</li>}
      { mostFrequentlyCompared && <li>Most frequently compared element:
        {mostFrequentlyCompared[0]} ({mostFrequentlyCompared[1]} times)</li>}
    </ul></>;
  } else {
    return <div>Not ready</div>;
  }
};
