export { DualSwiper } from './DualSwiper/index.js';
export { StaticDualSwiper } from './StaticDualSwiper/index.js';
export { SwipableBox } from './SwipableBox/index.js';

export { SwipeDirection, DragDirection } from './SwipableBox/types.js';
export { SelectionAction } from './DualSwiper/types.js';
export type { DualSwiperProps } from './DualSwiper/index.js';
export type { StaticDualSwiperProps } from './StaticDualSwiper/index.js';
export type { SwipableBoxProps } from './SwipableBox/index.js';

export type RGB = `rgb(${number}, ${number}, ${number})`;
export type RGBA = `rgba(${number}, ${number}, ${number}, ${number})`;
export type HEX = `#${string}`;

export type Color = RGB | RGBA | HEX;

export interface SwiperSharedProps {
  boxMinHeight?: number | undefined;
  boxMinWidth?: number | undefined;
  maxRotationDistance?: number | undefined;
  maxRotationDegrees?: number | undefined;
  moveDistanceBeforeRotate?: number | undefined;
  selectGlowColor?: Color | undefined;
  selectBackgroundColor?: Color | undefined;
  selectGrowScale?: number | undefined;
  swipeDelay?: number | undefined;
  swipeDistance?: number | undefined;
  swipeDuration?: number | undefined;
  swipeThreshold?: number | undefined;
}
