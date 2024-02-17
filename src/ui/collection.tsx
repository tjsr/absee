import './collection.css';

import { CollectionObject, CollectionObjectId, ComparableObjectResponse, SnowflakeType } from '../types.js';

import { ComparisonElement } from './collection.styles.js';
import React from 'react';
import SuperJSON from 'superjson';

export type CollectionPropTypes<CO extends CollectionObject<IdType>, IdType extends CollectionObjectId> = {
  element: ComparableObjectResponse<CO>;
  selectElement?: (elementId: SnowflakeType) => void;
  isSelected?: boolean;
};

export type ICollectionPropTypes<CO extends CollectionObject<IdType>, IdType extends CollectionObjectId> = {
  element: ComparableObjectResponse<CO>;
  selectElement?: (elementId: SnowflakeType) => void;
  getCollectionItem: (data: CO) => JSX.Element;
  usePreselect?: boolean;
  isSelected?: boolean;
};

export const Collection = <CO extends CollectionObject<IdType>, IdType extends CollectionObjectId>(
  props: ICollectionPropTypes<CO, IdType>
): JSX.Element => {
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
