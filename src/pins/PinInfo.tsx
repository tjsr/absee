import './pincolours.css';

import { Pin } from './pinpanion';
import React from 'react';
import { titleCase } from 'title-case';

type PinInfoPropTypes = {
  pin: Pin;
  style?: any;
};
const PINPANION_IMAGE_LOCATION = 'https://pinpanion.com/imgs';

export const PinInfo = ({ pin, style }: PinInfoPropTypes): JSX.Element => {
  const url = `${PINPANION_IMAGE_LOCATION}/${pin.imageUrl}`;

  let pinClasses = 'pin-normal';
  let paxCssClass = 'pax';
  let setCssClass = 'set';

  if (pin.paxName) {
    pinClasses = pinClasses + ' ' + 'pin' + pin.cssClass;
    paxCssClass = paxCssClass + ' ' + 'pax' + pin.cssClass;
    setCssClass = setCssClass + ' ' + 'pax' + pin.cssClass;
  }

  return (
    <>
      <div className={pinClasses} id={`pin_${pin.id}`} style={style}>
        <div className="pinInfo">
          <h3>{pin.name}</h3>
          {pin.setName ? (
            <div className={setCssClass}>
              {pin.year} {pin.setName}
            </div>
          ) : pin.paxName ? (
            <div className={paxCssClass}>
              {pin.year} {pin.paxName}
            </div>
          ) : (
            <></>
          )}
          <img className="pinImage" alt={pin.name} src={url} />
        </div>
      </div>
    </>
  );
};
