import './pincollection.css';

import { ComparableObjectResponse, PinInfo } from './types';

import React from 'react';

type CollectionPropTypes<T> = {
  element: ComparableObjectResponse<PinInfo>;
};

export const Collection = (collectionProps: CollectionPropTypes<PinInfo>): JSX.Element => {
  return (
    <>
      <div data-elementId={collectionProps.element.elementId} className="comparisonElement">
        {collectionProps.element.data.map((data) => (
          <div className="collectionItem">
            Pin ID: {data.id}
            {data.img && <img src={data.img} />}
          </div>
        ))}
      </div>
    </>
  );
};
