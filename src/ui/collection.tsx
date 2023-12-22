import './collection.css';

import { ComparableObjectResponse, SnowflakeType } from '../types';

import { ComparisonElement } from './collection.styles';
import { Pin } from '../pins/pinpanion';
import React from 'react';
import SuperJSON from 'superjson';

export type CollectionPropTypes<T> = {
  element: ComparableObjectResponse<T>;
  selectElement?: (elementId: SnowflakeType) => void;
  isSelected?: boolean;
};

export type ICollectionPropTypes<T> = {
  element: ComparableObjectResponse<T>;
  selectElement?: (elementId: SnowflakeType) => void;
  getCollectionItem: (data: T) => JSX.Element;
  usePreselect?: boolean;
  isSelected?: boolean;
};

export const Collection = (props: ICollectionPropTypes<Pin>): JSX.Element => {
  if (props.element == undefined) {
    return <div>Error: element undefined.</div>;
  }
  if (props.element.data == undefined) {
    return <div>Error: element.data undefined: ${SuperJSON.stringify(props.element)}.</div>;
  }
  return (
    <>
      <ComparisonElement
        paddingLeft={0}
        paddingRight={0}
        isHighlighted={props.isSelected}
        onClick={() => {
          if (props.selectElement) {
            props.selectElement(props.element.elementId);
          }
        }}
      >
        {props.element.data.map((data, idx) => {
          return (
            <div key={props.element.objects[idx]} className="collectionItem">
              {props.getCollectionItem(data)}
            </div>
          );
        })}
      </ComparisonElement>
    </>
  );
};
