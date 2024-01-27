import { styled } from 'styled-components';

export const SizedPin = styled.div<{ maxWidth?: number, minHeight?: number }>`
  max-width: ${( { maxWidth } ) => maxWidth !== undefined ? `${maxWidth}rem;` : null}
  min-height: ${( { minHeight } ) => minHeight !== undefined ? `${minHeight}rem;` : null}
`;

export const PinName = styled.h3<{ maxWidth?: number }>`
  max-width: ${( { maxWidth } ) => maxWidth !== undefined ? `${maxWidth}rem;` : null}
`;

export const SetInfo = styled.div<{ fromTop?: number }>`
  margin-top: ${( { fromTop } ) => fromTop !== undefined ? `${fromTop}rem;` : null}
  font-weight: bold;
  color: #e1e1e1;
  font-size: 0.8rem;
  position: relative;
  padding-top: 0.1rem;
  padding-bottom: 0.1rem;
  overflow: hidden;
`;

export const PaxInfo = styled.div<{ fromTop?: number }>`
  margin-top: ${( { fromTop } ) => fromTop !== undefined ? `${fromTop}rem;` : null}
  font-weight: bold;
  color: #e1e1e1;
  font-size: 0.8rem;
  position: relative;
  padding-top: 0.1rem;
  padding-bottom: 0.1rem;
  overflow: hidden;
`;
