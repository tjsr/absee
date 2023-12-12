export { DualSwiper } from './DualSwiper';
export { StaticDualSwiper } from './StaticDualSwiper';
export { SwipableBox } from './SwipableBox';

export { SwipeDirection, DragDirection } from './SwipableBox/types';
export { SelectionAction } from './DualSwiper/types';
export type { DualSwiperProps } from './DualSwiper';
export type { StaticDualSwiperProps } from './StaticDualSwiper';
export type { SwipableBoxProps } from './SwipableBox';

export type RGB = `rgb(${number}, ${number}, ${number})`;
export type RGBA = `rgba(${number}, ${number}, ${number}, ${number})`;
export type HEX = `#${string}`;

export type Color = RGB | RGBA | HEX;

export interface SwiperSharedProps {
  boxMinHeight?: number;
  boxMinWidth?: number;
  maxRotationDistance?: number;
  maxRotationDegrees?: number;
  moveDistanceBeforeRotate?: number;
  selectGlowColor?: Color;
  selectBackgroundColor?: Color;
  selectGrowScale?: number;
  swipeDelay?: number;
  swipeDistance?: number;
  swipeDuration?: number;
  swipeThreshold?: number;
}
