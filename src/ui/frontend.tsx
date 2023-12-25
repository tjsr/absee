import React, { useEffect, useState } from 'react';
import {
  RouterProvider,
  createBrowserRouter
} from 'react-router-dom';

import CompareScreen from './CompareScreen';
import { ComparisonResult } from '../types';
import Cookies from 'js-cookie';
import { Pin } from '../pins/pinpanion';
import SuperJSON from 'superjson';
import { getServerHost } from './utils';

type FrontendProps = {
  collectionId: string;
}

export const fetchRecentComparisons = async (collectionId: string) => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    const sessionId = Cookies.get('sessionId');
    if (sessionId !== undefined && sessionId !== 'undefined') {
      headers['x-session-id'] = sessionId;
    }

    const response = await fetch(
      `${getServerHost()}/api/recent/${collectionId}`,
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

const RecentComparisons = (): JSX.Element => {
  const collectionId = '83fd0b3e-dd08-4707-8135-e5f138a43f00';
  const [recentLoading, setRecentLoading] = useState<boolean>(false);
  const [recentLoaded, setRecentLoaded] = useState<boolean>(false);
  const [recentComparisons, setRecentComparisons] = useState<ComparisonResult<Pin>[]>([]);
  useEffect(() => {
    (async () => {
      if (!recentLoading && !recentLoaded) {
        setRecentLoading(true);
        setRecentLoaded(false);
        const res = await fetchRecentComparisons(collectionId);
        if (res.success) {
          console.log(`Loaded ${SuperJSON.stringify(res.data)}`);
          const recentComparisonRequest: ComparisonResult<Pin> = res.data.json;
          setRecentComparisons(recentComparisonRequest as any);
          setRecentLoaded(true);
        }
        setRecentLoading(false);
      }
    })();
  }, [recentLoading]);
  return <div>Recent comparisons</div>;
};

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-constraint
const Frontend = ({ collectionId } : FrontendProps): JSX.Element => {
  const router = createBrowserRouter([
    {
      element: (
        <CompareScreen collectionId={collectionId}/>
      ),
      path: '/',
    },
    {
      element: <RecentComparisons />,
      path: 'recent',
    },
  ]);

  return <RouterProvider router={router} />;
};

export default Frontend;
