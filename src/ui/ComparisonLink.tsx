import { QUERYSTRING_ARRAY_DELIMETER, QUERYSTRING_ELEMENT_DELIMETER } from './utils';
import React, { useState } from 'react';

import { ComparisonSelectionResponse } from '../types';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { FaRegCopy } from 'react-icons/fa';
import { Pin } from '../pins/pinpanion';
import { Snackbar } from './Snackbar';

type ComparisonLinkProps<T> = {
  comparison: ComparisonSelectionResponse<T> | undefined;
}

const createComparisonUrl = (comparison: ComparisonSelectionResponse<Pin>): string => {
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
