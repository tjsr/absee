import styled from 'styled-components';

export const SwipableBoxContent = styled.div<{boxMinHeight?: number, boxMinWidth?: number}>`
  border-radius: 10px;
  font-weight: strong;
  display: block;
  border: 2px solid #000000;
  min-width: ${({ boxMinWidth }) => boxMinWidth !== undefined ? boxMinWidth : 20}rem;
  min-height: ${({ boxMinHeight }) => boxMinHeight !== undefined ? boxMinHeight : 20}rem;
  text-align: center;
  vertical-align: center;
  cursor: grab;
  touch-action: none;
  align-items: center;
  align: center;

  -webkit-user-select: none; /* Safari */
  -ms-user-select: none; /* IE 10 and IE 11 */
  user-select: none; /* Standard syntax */
`;
