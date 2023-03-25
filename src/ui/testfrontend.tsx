'use strict';

// import { DualSwiper, SwipableBox } from '@tjsr/abswipe';

import { DualSwiper } from './components';
import React from 'react';

export const TestFrontend = (): JSX.Element => {
  const itemSelected = (): void => {
    console.log('itemSelected');
  };
  return (
    // <SwipableBox itemSelected={itemSelected}>
    //   <div>Contents!</div>
    // </SwipableBox>
    <DualSwiper itemSelected={itemSelected} leftContent={<div>Left</div>} rightContent={<div>Right</div>}>
      <div>Trophy?</div>
    </DualSwiper>
  );
};
