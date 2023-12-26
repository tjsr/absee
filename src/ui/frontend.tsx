import {
  RouterProvider,
  createBrowserRouter
} from 'react-router-dom';

import CompareScreen from './CompareScreen';
import React from 'react';
import { RecentComparisons } from './RecentComparisons';

type FrontendProps = {
  collectionId: string;
}

const DEFAULT_COLLECTION = '83fd0b3e-dd08-4707-8135-e5f138a43f00';
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-constraint
const Frontend = ({ collectionId } : FrontendProps): JSX.Element => {
  const router = createBrowserRouter([
    {
      element: (
        <>
          <CompareScreen collectionId={collectionId}/>
          {/* <RecentComparisons collectionId={DEFAULT_COLLECTION} currentUser={true}/> */}
        </>
      ),
      path: '/',
    },
    {
      element: <CompareScreen collectionId={collectionId}/>,
      path: '/compare/(?<group1>)/(?<group2>)',
    },
    {
      element: <RecentComparisons collectionId={DEFAULT_COLLECTION} currentUser={true}/>,
      path: 'recent/me',
    },
    {
      element: <RecentComparisons collectionId={DEFAULT_COLLECTION} />,
      path: 'recent',
    },
  ]);

  return <RouterProvider router={router} />;
};

export default Frontend;
