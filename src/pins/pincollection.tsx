import './pincollection.css';

import { Collection, CollectionPropTypes } from '../ui/collection';

import { Pin } from './pinpanion';
import { PinInfo } from './PinInfo';
import React from 'react';

const getCollectionItem = (data: Pin): JSX.Element => {
  return <PinInfo pin={data} />;
};

export const PinCollection = (props: CollectionPropTypes<Pin>): JSX.Element => {
  return (
    <Collection
      element={props.element}
      selectElement={props.selectElement}
      getCollectionItem={getCollectionItem}
    />
  );
};
