export { DualSwiper } from './DualSwiper/index.ts';
export { StaticDualSwiper } from './StaticDualSwiper/index.ts';
export { SwipableBox } from './SwipableBox/index.ts';

export { SwipeDirection, DragDirection } from './SwipableBox/types.ts';
export { SelectionAction } from './DualSwiper/types.ts';
export type { DualSwiperProps } from './DualSwiper/index.ts';
export type { StaticDualSwiperProps } from './StaticDualSwiper/index.ts';
export type { SwipableBoxProps } from './SwipableBox/index.ts';

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
