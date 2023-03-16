import './collection.css';

import { ComparableObjectResponse } from './types';
import { Pin } from './pins/pinpanion';
import React from 'react';

export type CollectionPropTypes<T> = {
  element: ComparableObjectResponse<T>;
  selectElement: (elementId: string) => void;
};

export type ICollectionPropTypes<T> = {
  element: ComparableObjectResponse<T>;
  selectElement: (elementId: string) => void;
  getCollectionItem: (data: T) => JSX.Element;
};

export const Collection = (props: ICollectionPropTypes<Pin>): JSX.Element => {
  return (
    <>
      <div
        onClick={() => {
          props.selectElement(props.element.elementId);
        }}
        className="comparisonElement"
      >
        {props.element.data.map((data, idx) => {
          return (
            <div key={props.element.objects[idx]} className="collectionItem">
              {props.getCollectionItem(data)}
            </div>
          );
        })}
      </div>
    </>
  );
};
