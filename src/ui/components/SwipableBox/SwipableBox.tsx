import { DragDirection, SwipeDirection } from './types';
import React, { MutableRefObject, useRef } from 'react';
import { animated, useSpring } from '@react-spring/web';
import { useDrag, useGesture } from '@use-gesture/react';

import { SwipableBoxContent } from './SwipableBox.styles';
import { SwiperSharedProps } from '../index';

export interface SwipableBoxProps extends SwiperSharedProps {
  boxMinHeight?: number;
  boxMinWidth?: number;
  children: React.ReactNode;
  dropArea?: MutableRefObject<HTMLDivElement | null>;
  itemSelected: () => void;
  itemSwiped?: (direction: SwipeDirection) => void;
  targetDragDirection: DragDirection;
}

export const SwipableBox = ({
  children,
  dropArea,
  itemSelected,
  itemSwiped,
  maxRotationDegrees = 20,
  maxRotationDistance = 175,
  moveDistanceBeforeRotate = 50,
  selectGlowColor = '#0f3',
  selectBackgroundColor = 'rgba(0, 255, 48, 0.5)',
  selectGrowScale = 1.35,
  swipeDelay = 1000,
  swipeDistance = 400,
  swipeDuration = 400,
  swipeThreshold = 50,
  boxMinHeight,
  boxMinWidth,
  targetDragDirection = DragDirection.RIGHT,
}: SwipableBoxProps): JSX.Element => {
  const divRef = useRef<HTMLDivElement | null>(null);
  // const divRef = forwardRef<HTMLDivElement | null>({}, {});
  // const divRef: MutableRefObject<HTMLDivElement | null> | null = null;
  const [{ rotate, scale, x, y }, api] = useSpring(() => ({
    rotate: '0deg',
    scale: 1,
    x: 0,
    y: 0,
  }));

  const sharedOptions = {
    enabled: true,
  };

  const dragOptions = {
    delay: swipeDelay,
    swipe: { distance: swipeDistance, duration: swipeDuration },
    threshold: swipeThreshold,
  };

  // Set the drag hook and define component movement based on gesture data
  const bindDragHandler = useDrag(
    ({ event, down, movement: [mx, my], swipe: [swipeX] }) => {
      api.start({
        immediate: down,
        rotate: getRotationDegrees(down ? mx : 0, maxRotationDegrees),
        scale: down ? scaleSizeTo(mx, 1.0, selectGrowScale, moveDistanceBeforeRotate, maxRotationDistance) : 1.0,
        x: down ? mx : 0,
        y: down ? my : 0,
      });
      if (!down && divRef) {
        removeGlow(divRef);
      }
      if ((event.type === 'pointermove' || event.type === 'pointerup') && dropArea) {
        const pointerEvent = event as PointerEvent;
        const targetDropRects = dropArea.current?.getBoundingClientRect();
        if (
          isDraggedInDirection(targetDragDirection, mx) ||
          (targetDropRects && intersectsDropArea(pointerEvent, targetDropRects))
        ) {
          if (down && divRef) {
            makeGlow(divRef);
          }
          if (!down) {
            itemSelected();
          }
        } else if (divRef) {
          removeGlow(divRef);
        }
      }

      if (swipeX !== 0) {
        if (!itemSwiped) {
          itemSelected();
        } else {
          itemSwiped(getSwipeDirection(swipeX));
        }
      }
    },
    { ...sharedOptions, ...dragOptions }
  );

  useGesture(
    {},
    {
      // global options such as `target`
      ...sharedOptions,
      // gesture specific options
      drag: dragOptions,
    }
  );

  const scaleSizeTo = (value: number, minScale: number, maxScale: number, minX: number, maxX: number): number => {
    let offset = value;
    if (offset < 0) {
      offset *= -1;
    }

    offset -= minX;
    if (offset < 0) {
      return minScale;
    }

    if (offset > maxX) {
      return maxScale;
    }
    const scaleRange = maxScale - minScale;
    const xratio = offset / maxX;
    const ratio = minScale + xratio * scaleRange;
    return ratio;
  };

  const getRotationDegrees = (x: number, maxAngle: number): string => {
    let angle = x / 10;
    if (angle < 0 && angle < 0 - maxAngle) {
      angle = 0 - maxAngle;
    } else if (angle > 0 && angle > maxAngle) {
      angle = maxAngle;
    }
    return `${angle}deg`;
  };

  const cursorIntersectsX = (x: number, rect: DOMRect): boolean => x > rect.left && x < rect.right;

  const isDraggedInDirection = (targetDirection: DragDirection, mx: number): boolean => {
    const draggedDirection = getDragDirection(mx);
    const totalMovement = Math.abs(mx);
    return draggedDirection === targetDirection && totalMovement > swipeThreshold;
  };

  const getSwipeDirection = (swipeX: number): SwipeDirection =>
    swipeX === -1 ? SwipeDirection.LEFT : SwipeDirection.RIGHT;

  const getDragDirection = (mx: number): DragDirection => (mx < 0 ? DragDirection.LEFT : DragDirection.RIGHT);

  const intersectsDropArea = (pointerEvent: PointerEvent, targetDropRects: DOMRect): boolean => {
    const cursorX = pointerEvent.clientX;
    if (cursorIntersectsX(cursorX, targetDropRects)) {
      return true;
    }

    return false;
  };

  const makeGlow = (ref: MutableRefObject<HTMLDivElement | null>): void => {
    if (ref && ref.current) {
      ref.current.style.boxShadow = '0px 0px 40px 20px ' + selectGlowColor;
      ref.current.style.backgroundColor = selectBackgroundColor;
      /* in order: x offset, y offset, blur size, spread size, color */
      /* blur size and spread size are optional (they default to 0) */
    }
  };

  type RefType = MutableRefObject<HTMLDivElement | null>;
  // type RefType = React.ForwardRefExoticComponent<React.RefAttributes<HTMLDivElement | null>>;

  const removeGlow = (ref: RefType): void => {
    if (ref && ref.current) {
      ref.current.style.boxShadow = '';
      ref.current.style.backgroundColor = '';
    }
  };

  return (
    <animated.div ref={divRef} {...bindDragHandler()} style={{ rotate, scale, touchAction: 'none', x, y }}>
      <SwipableBoxContent boxMinHeight={boxMinHeight} boxMinWidth={boxMinWidth}>
        {children}
      </SwipableBoxContent>
    </animated.div>
  );
};

export default SwipableBox;
