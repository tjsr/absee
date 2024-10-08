import { CollectionObject, CollectionObjectId, ComparableObjectResponse, SnowflakeType } from '../types.js';
import { DualSwiper, SelectionAction, StaticDualSwiper, SwipeDirection } from './components/index.js';
import React, { SetStateAction, useRef, useState } from 'react';

import { Pin } from '../pins/pinpanion.js';
import { PinCollection } from '../pins/pincollection.js';
import { isMobile } from 'react-device-detect';

type SelectionTypeOptions = 'click' | 'swipe' | 'static';

interface ElementPickerProps<CO extends CollectionObject<IdType>, IdType extends CollectionObjectId>
  extends React.HTMLProps<HTMLDivElement> {
  selectElement: (elementId: SnowflakeType) => Promise<void>;
  itemSelected: (side: SwipeDirection, action: SelectionAction) => void;
  leftElement: ComparableObjectResponse<CO>;
  rightElement: ComparableObjectResponse<CO>;
  dropRef?: React.MutableRefObject<HTMLDivElement | null>;
  devmode?: boolean;
}

interface SwipeComparisonContainerProps<CO extends CollectionObject<IdType>, IdType extends CollectionObjectId>
  extends React.HTMLProps<HTMLDivElement> {
  itemSelected: (side: SwipeDirection, action: SelectionAction) => void;
  leftElement: ComparableObjectResponse<CO>;
  rightElement: ComparableObjectResponse<CO>;
  selectElement: (elementId: SnowflakeType) => Promise<void>;
  externalDropRef: React.MutableRefObject<HTMLDivElement | null>;
}

const SwipeComparisonContainer = <CO extends CollectionObject<IdType>, IdType extends CollectionObjectId>({
  externalDropRef,
  leftElement,
  rightElement,
  selectElement,
}: SwipeComparisonContainerProps<CO, IdType>): JSX.Element => {
  const [currentSelectedElement, setCurrentSelectedElement] = useState<SnowflakeType | undefined>(undefined);

  const elementSelect = (elementId: SnowflakeType, side: SwipeDirection, action: SelectionAction): void => {
    if (action == SelectionAction.SWIPE || currentSelectedElement === elementId) {
      selectElement(elementId);
      setCurrentSelectedElement(undefined);
    } else {
      console.log(`Set currently selected element to ${elementId}`);
      setCurrentSelectedElement(elementId);
    }
  };

  interface getContentElementProps {
    elementType: 'pin';
    element: ComparableObjectResponse<CollectionObject<CollectionObjectId>>;
  }

  // <CO extends CollectionObject<IdType>, IdType extends CollectionObjectIdType>
  const getContentElement = ({ elementType, element }: getContentElementProps): JSX.Element => {
    if (elementType === 'pin') {
      return (
        <PinCollection
          element={element as unknown as ComparableObjectResponse<Pin>}
          selectElement={selectElement}
          isSelected={currentSelectedElement == element.elementId}
        />
      );
    }
    return <></>;
  };

  return (
    <div className="comparisonContainer">
      <DualSwiper
        boxMinHeight={8}
        boxMinWidth={8}
        itemSelected={(side: SwipeDirection, action: SelectionAction) => {
          elementSelect(leftElement.elementId, side, action);
        }}
        leftContent={getContentElement({
          element: leftElement,
          elementType: 'pin',
        })}
        rightContent={getContentElement({
          element: rightElement,
          elementType: 'pin',
        })}
        refDiv={externalDropRef}
      >
        <div className="comparisonText">Swipe your selection towards the centre.</div>
      </DualSwiper>
    </div>
  );
};

export const ElementPicker = <CO extends CollectionObject<IdType>, IdType extends CollectionObjectId>(
  props: ElementPickerProps<CO, IdType>
): JSX.Element => {
  const [displayMode, setDisplayMode] = useState<SelectionTypeOptions>('click');
  const [isSwiperEnabled, setSwiperEnabled] = useState<boolean>(isMobile);
  const [tapToSelect, enableTapToSelect] = useState<boolean>(!isMobile);
  const { itemSelected, selectElement, leftElement, rightElement } = props;
  const localDropRef = useRef<HTMLDivElement | null>(null);
  const externalDropRef: React.MutableRefObject<HTMLDivElement | null> = props.dropRef || localDropRef;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _onTapSelect = async (elementId: SnowflakeType): Promise<void> => {
    if (tapToSelect) props.selectElement(elementId);
  };

  interface getContentElementProps {
    elementType: 'pin';
    element: ComparableObjectResponse<CO>;
  }

  const getContentElement = ({ elementType, element }: getContentElementProps): JSX.Element => {
    if (elementType === 'pin') {
      return (
        <PinCollection element={element as unknown as ComparableObjectResponse<Pin>} selectElement={selectElement} />
      );
    }
    return <></>;
  };

  return (
    <>
      {props.devmode && (
        <div className="devOptions">
          <div className="devContent">
            <select
              onChange={(e: React.SyntheticEvent<HTMLSelectElement, Event>) => {
                if (['click', 'swipe', 'static'].includes(e.currentTarget.value)) {
                  console.log(`Switching to ${e.currentTarget.value} mode`);
                  setDisplayMode(e.currentTarget.value as SetStateAction<SelectionTypeOptions>);
                } else {
                  console.warn(`Invalid display mode ${e.currentTarget.value}`);
                }
              }}
            >
              <option value="click">Click</option>
              <option value="swipe">Swipe</option>
              <option value="static">Static</option>
            </select>
            <label htmlFor="enableMobile">Enable swipe mode</label>
            <input
              type="checkbox"
              checked={isSwiperEnabled}
              name="enableMobile"
              onChange={() => setSwiperEnabled(!isSwiperEnabled)}
            />
          </div>
          <div className="selectDelayOptions">
            <label htmlFor="enableTapToSelect">Immediately select when touching an option</label>
            <input
              type="checkbox"
              checked={tapToSelect}
              name="enableTapToSelect"
              onChange={() => enableTapToSelect(!tapToSelect)}
            />
          </div>
        </div>
      )}

      <h3 className="comparisonHelp">Select the pin(s) you would prefer to have</h3>
      {displayMode === 'swipe' ? (
        <SwipeComparisonContainer
          externalDropRef={externalDropRef}
          itemSelected={itemSelected}
          leftElement={leftElement}
          rightElement={rightElement}
          selectElement={selectElement}
        />
      ) : (
        <div className="comparisonContainer">
          <StaticDualSwiper
            boxMinHeight={8}
            boxMinWidth={8}
            itemSelected={itemSelected}
            staticContent={getContentElement({
              element: leftElement,
              elementType: 'pin',
            })}
            comparisonContent={getContentElement({
              element: rightElement,
              elementType: 'pin',
            })}
          />
        </div>
      )}
    </>
  );
};
