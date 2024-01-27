import './frontend.css';

import { CollectionIdType, EmailAddress } from '../types.js';
import React, { useEffect, useState } from 'react';
import {
  RouterProvider,
  createBrowserRouter
} from 'react-router-dom';

import { AboutPage } from './AboutPage.js';
import CompareScreen from './CompareScreen.js';
import Cookies from 'js-cookie';
import { slide as Menu } from 'react-burger-menu';
import { RecentComparisons } from './RecentComparisons.js';
import { StatsPage } from './StatsPage.js';
import { doGoogleLogout } from './auth/LoginControl.js';
import { fetchNewSession } from './session.js';
import { submitLogout } from './auth/apicalls.js';

type FrontendProps = {
  collectionId: CollectionIdType;
}

const getCookieUserId = (): string | undefined => {
  const userIdValue: string|undefined = Cookies.get('user_id');
  if (userIdValue === 'undefined') {
    return undefined;
  }
  return userIdValue;
};

const DEFAULT_COLLECTION: CollectionIdType = '83fd0b3e-dd08-4707-8135-e5f138a43f00';
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-constraint
const Frontend = ({ collectionId } : FrontendProps): JSX.Element => {
  const [isLoggedIn, setLoggedIn] = useState<boolean>(false);
  const [email, setEmail] = useState<EmailAddress | undefined>(undefined);

  useEffect(() => {
    const sessionId = Cookies.get('sessionId');

    (async () => {
      if (sessionId === undefined || sessionId == 'undefined') {
        await fetchNewSession();
      }

      const userId = getCookieUserId();
      const cookieEmail = Cookies.get('email') || Cookies.get('displayName');
      console.log(`User ID: ${userId}  Email: ${cookieEmail}`);
      if (userId && cookieEmail) {
        setLoggedIn(true);
        setEmail(cookieEmail);
        console.log(`Email: ${cookieEmail} (as cookie: ${Cookies.get('displayName')})`);
      }
    })();
  }, []);

  const router = createBrowserRouter([
    {
      element: (
        <>
          <CompareScreen
            collectionId={collectionId}
            email={email}
            setEmail={setEmail}
            isLoggedIn={isLoggedIn}
            setLoggedIn={setLoggedIn} />
          {/* <RecentComparisons collectionId={DEFAULT_COLLECTION} currentUser={true}/> */}
        </>
      ),
      path: '',
    },
    {
      element: <CompareScreen
        collectionId={collectionId}
        email={email}
        setEmail={setEmail}
        isLoggedIn={isLoggedIn}
        setLoggedIn={setLoggedIn}
      />,
      path: '/compare/(?<group1>)/(?<group2>)',
    },
    {
      element: <RecentComparisons collectionId={DEFAULT_COLLECTION} currentUser={true}/>,
      path: '/recent/me',
    },
    {
      element: <RecentComparisons collectionId={DEFAULT_COLLECTION} maxComparisons={9999} />,
      path: '/recent',
    },
    {
      element: <StatsPage collectionId={DEFAULT_COLLECTION} />,
      path: '/stats',
    },
    {
      element: <AboutPage />,
      path: '/about',
    },
  ]);

  return (
    <>
      <div id="outer-container">
        <Menu pageWrapId="page-wrap" outerContainerId="outer-container">
          { email && (<><div className="loggedIn">Logged in as {email}</div>
            <a id="logout" href="/" className="bm-item menu-item" onClick={() => {
              doGoogleLogout(setLoggedIn, setEmail);
              submitLogout();
            }}>Logout</a></>) }
          <a id="home" className="menu-item" href="/">Home</a>
          <a id="about" className="menu-item" href="/about">About</a>
          <a id="stats" className="menu-item" href="/stats">Stats</a>
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
