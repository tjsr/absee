// import './StaticDualSwiper.css';

import { DragDirection, SelectionAction, SwipableBox, SwipeDirection, SwiperSharedProps } from '..';

import React from 'react';

export interface StaticDualSwiperProps extends SwiperSharedProps {
  itemSelected: (side: SwipeDirection, action: SelectionAction) => void;
  staticContent: React.ReactNode;
  comparisonContent: React.ReactNode;
}

// interface StaticDualSwiperFCProps extends React.HTMLProps<HTMLDivElement> {
//   itemSelected: (side: SwipeDirection, action: SelectionAction) => void;
//   staticContent: React.ReactNode;
//   comparisonContent: React.ReactNode;
// }
// const StaticDualSwiperFC: React.FC<StaticDualSwiperFCProps> = ({ ...props }) => {
//   return (<div {...props}>{props.children}</div>);
// };

export const StaticDualSwiper = (props: StaticDualSwiperProps): JSX.Element => {
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

  return <><div className="StaticSwiperContent">{props.staticContent}</div>
    <br />
    <div className="StaticSwiperSelectionBox">
      <SwipableBox itemSelected={(swipeDirection: SwipeDirection) => {
        props.itemSelected(swipeDirection, SelectionAction.SWIPE);
      } } targetDragDirection={DragDirection.RIGHT} {...sharedProps}>{props.comparisonContent}</SwipableBox>
    </div>
  </>;
};

export default StaticDualSwiper;
