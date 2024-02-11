import { CollectionObject, CollectionObjectIdType, ComparisonSelectionResponse } from '../types.js';
import { QUERYSTRING_ARRAY_DELIMETER, QUERYSTRING_ELEMENT_DELIMETER } from './utils.js';
import React, { useState } from 'react';

import { CopyToClipboard } from 'react-copy-to-clipboard';
import { FaClone } from 'react-icons/fa';
import { Snackbar } from './Snackbar.js';

type ComparisonLinkProps<CO extends CollectionObject<IdType>, IdType extends CollectionObjectIdType> = {
  comparison: ComparisonSelectionResponse<CO> | undefined;
};

const createComparisonUrl = <CO extends CollectionObject<IdType>, IdType extends CollectionObjectIdType>(
  comparison: ComparisonSelectionResponse<CO>
): string => {
  const server = `${location.protocol}//${location.host}`;
  const objectString: string = [
    comparison.a.objects.join(QUERYSTRING_ELEMENT_DELIMETER),
    comparison.b.objects.join(QUERYSTRING_ELEMENT_DELIMETER),
  ].join(QUERYSTRING_ARRAY_DELIMETER);
  const linkString = `${server}/?objects=${objectString}`;
  return linkString;
};

export const ComparisonLink = <CO extends CollectionObject<IdType>, IdType extends CollectionObjectIdType>({
  comparison,
}: ComparisonLinkProps<CO, IdType>): JSX.Element => {
  const [copyMessageState, setCopyMessageState] = useState<boolean>(false);

  if (!comparison) {
    return <div>No comparison loaded</div>;
  }
  const linkString = createComparisonUrl(comparison);
  return (
    <div className="copyToClipboard">
      Copy link clipboard{' '}
      <CopyToClipboard text={linkString} onCopy={() => setCopyMessageState(true)}>
        <FaClone style={{ cursor: 'pointer' }} />
      </CopyToClipboard>
      <Snackbar showPopup={copyMessageState} onTransitionEnd={() => setCopyMessageState(false)}>
        Link copied to clipboard!
      </Snackbar>
    </div>
  );
};
