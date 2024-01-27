import './pincollection.css';

import { Collection, CollectionPropTypes } from '../ui/collection.js';

import { Pin } from './pinpanion.js';
import { PinInfo } from './PinInfo.js';
import React from 'react';

const getCollectionItem = (data: Pin): JSX.Element => {
  return <PinInfo pin={data} />;
};

export const PinCollection = (props: CollectionPropTypes<Pin, number>): JSX.Element => {
  return (
    <Collection
      element={props.element}
      selectElement={props.selectElement}
      getCollectionItem={getCollectionItem}
    />
  );
};
