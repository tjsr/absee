import { InfoBlurb } from './InfoBlurb';
import { Link } from 'react-router-dom';
import React from 'react';

export const AboutPage = (): JSX.Element => {
  return (<div id="aboutPage">
    <h1>About this tool</h1>
    <InfoBlurb />
    <Link to="/">Back Home</Link>
  </div>);
};
