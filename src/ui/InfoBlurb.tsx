import React from 'react';

export const InfoBlurb = (): JSX.Element => {
  return (
    <>
      <div className="info">
        This is an early beta version of a new Pin Comparison tool. It is intended to help collect data and help Pinny
        Arcade community members make decisions about pin trading - particular for those new to the community who might
        be uncertain or unconfident in their knowledge of what they might be able to ask for from the pins they have.
      </div>
      <div className='info'>
        Long-term, I intend to offer incentives in the form of regular prizes to encourage users to submit data.  To
        combat poisoning submitted data, entries will be based on users meeting a minimum quota of comparisons which
        the wider community agree on each users own submissions.
      </div>
    </>
  );
};
