import './pincolours.css';
import './pinpanion.css';

import { PaxInfo, PinName, SetInfo, SizedPin } from './PinInfo.styles';

import { Pin } from './pinpanion';
import React from 'react';

type PinInfoPropTypes = {
  pin: Pin;
  style?: any;
};
const PINPANION_IMAGE_LOCATION = 'https://pinpanion.com/imgs';

export const PinInfo = ({ pin, style }: PinInfoPropTypes): JSX.Element => {
  const url = `${PINPANION_IMAGE_LOCATION}/${pin.imageUrl}`;

  let pinClasses = 'pin';
  let paxCssClass = 'pax';
  let setCssClass = 'set';

  if (pin.paxName) {
    pinClasses = pinClasses + ' ' + 'pin' + pin.cssClass;
    paxCssClass = paxCssClass + ' ' + 'pax' + pin.cssClass;
    setCssClass = setCssClass + ' ' + 'pax' + pin.cssClass;
  }

  return (
    <>
      <SizedPin className={pinClasses} id={`pin_${pin.id}`} maxWidth={12} style={style}>
        <div
          className="pinInfo"
          style={{
            backgroundImage: `url(${url})`,
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'contain',
            maxHeight: '10rem',
            maxWidth: '10rem',
            minHeight: '8rem',
            minWidth: '8rem',
          }}
        >
          <PinName maxWidth={12}>{pin.name}</PinName>
          {pin.setName ? (
            <SetInfo fromTop={8} className={setCssClass}>
              {pin.year} {pin.setName}
            </SetInfo>
          ) : pin.paxName ? (
            <PaxInfo fromTop={8} className={paxCssClass}>
              {pin.year} {pin.paxName}
            </PaxInfo>
          ) : (
            <></>
          )}
        </div>
      </SizedPin>
    </>
  );
};
