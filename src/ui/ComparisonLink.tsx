import { QUERYSTRING_ARRAY_DELIMETER, QUERYSTRING_ELEMENT_DELIMETER } from './utils';
import React, { useState } from 'react';

import { ComparisonSelectionResponse } from '../types';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { FaRegCopy } from 'react-icons/fa';
import { Pin } from '../pins/pinpanion';
import { styled } from 'styled-components';

const HIDE_MESSAGE_TIMEOUT = 3000;

type ComparisonLinkProps<T> = {
  comparison: ComparisonSelectionResponse<T> | undefined;
}

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

export const createComparisonUrl = (comparison: ComparisonSelectionResponse<Pin>): string => {
  const server = `${location.protocol}//${location.host}`;
  const objectString: string = [
    comparison.a.objects.join(QUERYSTRING_ELEMENT_DELIMETER),
    comparison.b.objects.join(QUERYSTRING_ELEMENT_DELIMETER),
  ].join(QUERYSTRING_ARRAY_DELIMETER);
  const linkString = `${server}/?objects=${objectString}`;
  return linkString;
};

export const ComparisonLink = ({ comparison }: ComparisonLinkProps<Pin>): JSX.Element => {
  const [copyMessageState, setCopyMessageState] = useState<boolean>(false);

  if (!comparison) {
    return <div>No comparison loaded</div>;
  }
  const linkString = createComparisonUrl(comparison);
  return (
    <div className="copyToClipboard">
      Copy link clipboard <CopyToClipboard text={linkString} onCopy={() => setCopyMessageState(true)}>
        <FaRegCopy style={{ cursor: 'pointer' }} />
      </CopyToClipboard>
      <Snackbar
        showPopup={copyMessageState}
        onTransitionEnd={() => setCopyMessageState(false)}
      >Link copied to clipboard!</Snackbar>
    </div>
  );
};
//         className={`copyMessage ${copyMessageState ? 'fadeOut' : ''}`}
