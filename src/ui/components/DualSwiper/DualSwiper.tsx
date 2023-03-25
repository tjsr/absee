import { DualSwiperBox, TargetDropArea } from './DualSwiper.styles';
import React, { useRef } from 'react';
import { SwipableBox, SwipeDirection } from '../SwipableBox';

import { DragDirection } from '../SwipableBox/types';
import { SelectionAction } from './types';
import { SwiperSharedProps } from '../';

export interface DualSwiperProps extends SwiperSharedProps {
  children: React.ReactNode;
  itemSelected: (side: SwipeDirection, action: SelectionAction) => void;
  leftContent: React.ReactNode;
  rightContent: React.ReactNode;
}

export const DualSwiper = (props: DualSwiperProps): JSX.Element => {
  const dragoverRef = useRef<HTMLDivElement | null>(null);

  const sharedProps: SwiperSharedProps = {
    boxMinHeight: props.boxMinHeight,
    boxMinWidth: props.boxMinWidth,
    maxRotationDegrees: props.maxRotationDegrees,
    maxRotationDistance: props.maxRotationDistance,
    moveDistanceBeforeRotate: props.moveDistanceBeforeRotate,
    selectBackgroundColor: props.selectBackgroundColor,
    selectGlowColor: props.selectGlowColor,
    selectGrowScale: props.selectGrowScale,
    swipeDelay: props.swipeDelay,
    swipeDistance: props.swipeDistance,
    swipeDuration: props.swipeDuration,
    swipeThreshold: props.swipeThreshold,
  };

  const leftSwiped = (direction: SwipeDirection) => {
    if (direction === SwipeDirection.LEFT) {
      props.itemSelected(SwipeDirection.RIGHT, SelectionAction.SWIPE);
    } else {
      props.itemSelected(SwipeDirection.LEFT, SelectionAction.SWIPE);
    }
  };

  const rightSwiped = (direction: SwipeDirection) => {
    if (direction === SwipeDirection.LEFT) {
      props.itemSelected(SwipeDirection.RIGHT, SelectionAction.SWIPE);
    } else {
      props.itemSelected(SwipeDirection.LEFT, SelectionAction.SWIPE);
    }
  };

  const leftSelected = (): void => {
    props.itemSelected(SwipeDirection.LEFT, SelectionAction.SELECT);
  };

  const rightSelected = (): void => {
    props.itemSelected(SwipeDirection.RIGHT, SelectionAction.SELECT);
  };

  return (
    <>
      <DualSwiperBox>
        <SwipableBox
          targetDragDirection={DragDirection.RIGHT}
          dropArea={dragoverRef}
          itemSelected={leftSelected}
          itemSwiped={leftSwiped}
          {...sharedProps}
        >
          {props.leftContent}
        </SwipableBox>
        <TargetDropArea ref={dragoverRef}>{props.children}</TargetDropArea>
        <SwipableBox
          targetDragDirection={DragDirection.LEFT}
          dropArea={dragoverRef}
          itemSelected={rightSelected}
          itemSwiped={rightSwiped}
          {...sharedProps}
        >
          {props.rightContent}
        </SwipableBox>
      </DualSwiperBox>
    </>
  );
};

export default DualSwiper;
