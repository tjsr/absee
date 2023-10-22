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
