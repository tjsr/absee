// import './DualSwiper.css';

import React, { MutableRefObject } from 'react';
import { SwipableBox, SwipeDirection } from '../SwipableBox';

import { DragDirection } from '../SwipableBox/types';
import { SelectionAction } from './types';
import { SwiperSharedProps } from '..';

// export const TargetDropArea = styled.div`
//   width: 8rem;
//   height: 15rem;
//   text-align: center;
//   vertical-align: center;
//   align: center;
//   touch-action: none;
//   -webkit-user-select: none; /* Safari */
//   -ms-user-select: none; /* IE 10 and IE 11 */
//   user-select: none; /* Standard syntax */
// `;

// export const DualSwiperBox = styled.div`
//   display: flex;
//   align-items: center;
//   position: relative;
//   justify-content: center;
//   align: center;
//   vertical-align: center;
// `;

export interface DualSwiperProps extends SwiperSharedProps {
  children?: React.ReactNode | null;
  refDiv: MutableRefObject<HTMLDivElement | null>;
  itemSelected: (side: SwipeDirection, action: SelectionAction) => void;
  leftContent: React.ReactNode;
  rightContent: React.ReactNode;
}

export const DualSwiper = (props: DualSwiperProps): JSX.Element => {
  // console.debug(props.refDiv);
  // const dragoverRef = useRef<HTMLDivElement>(props.refDiv || null);
  // const refDiv: React.MutableRefObject<HTMLDivElement | null> = React.useRef<HTMLDivElement|null>(null);

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

  // const refTargetDropArea = <TargetDropArea>{props.children}</TargetDropArea>

  console.log('Rendered DualSwiper');

  return (
    <>
      <div className="dualSwiperBox">
        <SwipableBox
          targetDragDirection={DragDirection.RIGHT}
          dropArea={props.refDiv}
          itemSelected={leftSelected}
          itemSwiped={leftSwiped}
          {...sharedProps}
        >
          {props.leftContent}
        </SwipableBox>
        <div className="targetDropArea">{props.children}</div>
        <SwipableBox
          targetDragDirection={DragDirection.LEFT}
          dropArea={props.refDiv}
          itemSelected={rightSelected}
          itemSwiped={rightSwiped}
          {...sharedProps}
        >
          {props.rightContent}
        </SwipableBox>
      </div>
    </>
  );
};

export default DualSwiper;
