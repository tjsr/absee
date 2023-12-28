import './frontend.css';

import {
  RouterProvider,
  createBrowserRouter
} from 'react-router-dom';

import { AboutPage } from './AboutPage';
import CompareScreen from './CompareScreen';
import { slide as Menu } from 'react-burger-menu';
import React from 'react';
import { RecentComparisons } from './RecentComparisons';
import { submitLogout } from './auth/apicalls';

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
    {
      element: <AboutPage />,
      path: 'about',
    },
  ]);

  return (
    <>
      <div id="outer-container">
        <Menu pageWrapId="page-wrap" outerContainerId="outer-container">
          <span className="loggedIn">Logged in as x@y.com</span>
          <a id="logout" className="menu-item" onClick={submitLogout}>Logout</a>
          <a id="home" className="menu-item" href="/">Home</a>
          <a id="about" className="menu-item" href="/about">About</a>
          <a id="recent" className="menu-item" href="/recent">Recent comparisons</a>
        </Menu>
        <br />
        <br />
        <br />
      </div>
      <main id="page-wrap">
        <RouterProvider router={router} />
        {/* <CompareScreen collectionId={DEFAULT_COLLECTION}/> */}
      </main>
    </>);
};

export default Frontend;
