import { Collection, CollectionPropTypes } from './collection';

import { PinInfo } from './types';
import React from 'react';

const getCollectionItem = (data: PinInfo): JSX.Element => {
  return (
    <>
      Pin ID: {data.id}
      {data.img && <img src={data.img} />}
    </>
  );
};

export const PinCollection = (props: CollectionPropTypes<PinInfo>): JSX.Element => {
  return (
    <Collection element={props.element} selectElement={props.selectElement} getCollectionItem={getCollectionItem} />
  );
};
