import { styled } from 'styled-components';

const HIDE_MESSAGE_TIMEOUT = 3000;
export const Snackbar = styled.span<{showPopup: boolean, backgroundColor?: string}>`
  transition: opacity ${HIDE_MESSAGE_TIMEOUT}ms ease-out 0s;
  padding: 0.8rem;
  font-size: 12pt;
  position: absolute;
  right: 1rem;
  bottom: 1rem;
  font-family: sans-serif;
  background-color: ${({ backgroundColor }) => `${backgroundColor ? backgroundColor : '#000'}`};
  color: #fff;
  opacity: ${({ showPopup }) => (showPopup ? '1' : '0')};
`;
