import { IPAddress, UserId } from '../types.js';
import express, { NextFunction } from 'express';
import { getUserId, getUserIdentificationString } from '../auth/user.js';

import { ABSeeRequest } from '../session.js';
import { getIp } from '../server.js';
import { isSnowflake } from '../validate.js';
import { saveComparisonSelection } from '../comparisonresponse.js';
import { verifyComparisonOwner } from '../comparison.js';

export const submit = (request: ABSeeRequest, response: express.Response, next: NextFunction) => {
  try {
    // const comparisonId = request.params.comparisonId;
    const userId: UserId = getUserId(request);
    const ipAddress: IPAddress = getIp(request);
    const comparisonId = request.body.comparisonId;

    if (!isSnowflake(comparisonId)) {
      response.status(400);
      response.send({ message: 'Invalid comparisonId' });
      return;
    }

    const elementId = request.body.selectedElementId;
    if (!isSnowflake(elementId)) {
      response.status(400);
      response.send({ message: 'Invalid selectedElementId' });
      return;
    }

    const responseJson = {
      success: true,
    };

    try {
      verifyComparisonOwner(comparisonId, userId, ipAddress)
        .then(() => {
          saveComparisonSelection(comparisonId, elementId);
          const idString: string = getUserIdentificationString(request);

          console.debug(
            `Saved response: ${elementId} for ${comparisonId} by ${userId} (${idString}).`
          );
          // Now write the user selected element to the DB.
          response.status(200);
        })
        .catch((err) => {
          responseJson.success = false;
          console.warn(`Error while saving comparison selection: ${err}`);
          response.status(401);
        });
    } catch (err) {
      responseJson.success = false;
      console.warn(`Error while saving comparison selection: ${err}`);
      response.status(500);
    }

    response.send(responseJson);
    // getComparisonData(comparisonId);
    // verify that this comparison has the correct owner
    // verify that it comes from the same IP
    next();
  } catch (err) {
    console.error(`Failure in POST /submit`, err);
    next();
  } finally {
    response.end();
  }
};
