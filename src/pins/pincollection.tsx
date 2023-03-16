import { Collection, CollectionPropTypes } from '../collection';

import { Pin } from './pinpanion';
// import { PinInfo } from '../types';
import React from 'react';

const PINPANION_IMAGE_LOCATION = 'https://pinpanion.com/imgs';

const getCollectionItem = (data: Pin): JSX.Element => {
  return (
    <>
      Pin ID: {data.id}
      {data.image_name && <img src={`${PINPANION_IMAGE_LOCATION}/${data.image_name}`} />}
      <h3>{data.name}</h3>
      <div className="pinPax">
        {data.year} {data.pax_id}
      </div>
    </>
  );
};

export const PinCollection = (props: CollectionPropTypes<Pin>): JSX.Element => {
  return (
    <Collection element={props.element} selectElement={props.selectElement} getCollectionItem={getCollectionItem} />
  );
};
