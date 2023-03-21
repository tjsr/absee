import { IPAddress, UserId } from '../types';

import { ABSeeRequest } from '../session';
import express from 'express';
import { getIp } from '../server';
import { getUserId } from '../auth/user';
import { isSnowflake } from '../validate';
import { saveComparisonSelection } from '../comparisonresponse';
import { verifyComparisonOwner } from '../comparison';

export const submit = (request: ABSeeRequest, response: express.Response) => {
  try {
    // const comparisonId = request.params.comparisonId;
    const userId: UserId = getUserId(request);
    const ipAddress: IPAddress = getIp(request);
    const comparisonId = request.body.comparisonId;

    if (!isSnowflake(comparisonId)) {
      response.status(400);
      response.send({message: 'Invalid comparisonId'});
      return;
    }

    const elementId = request.body.selectedElementId;
    if (!isSnowflake(elementId)) {
      response.status(400);
      response.send({message: 'Invalid selectedElementId'});
      return;
    }

    const responseJson = {
      success: true,
    };

    try {
      verifyComparisonOwner(comparisonId, userId, ipAddress)
        .then(() => {
          saveComparisonSelection(comparisonId, elementId);
          console.debug(
            `Saved response: ${elementId} for ${comparisonId} by ${userId}.`
          );
          // Now write the user selected element to the DB.
          response.status(200);
        })
        .catch((err) => {
          responseJson.success = false;
          response.status(401);
        });
    } catch (err) {
      responseJson.success = false;
      response.status(500);
    }

    response.send(responseJson);
    // getComparisonData(comparisonId);
    // verify that this comparison has the correct owner
    // verify that it comes from the same IP
  } catch (err) {
    console.error(`Failure in POST /submit`, err);
  }
  finally {
    response.end();
  }
};
