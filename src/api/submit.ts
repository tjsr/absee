import { ABSeeRequest } from '../session';
import { UserId } from '../types';
import express from 'express';
import { getIp } from '../server';
import { getUserId } from '../auth/user';
import { saveComparisonSelection } from '../comparisonresponse';
import { verifyComparisonOwner } from '../comparison';

export const submit = (request: ABSeeRequest, response: express.Response) => {
  try {
    // const comparisonId = request.params.comparisonId;
    const userId: UserId = getUserId(request);
    const ipAddress = getIp(request);
    const comparisonId = request.body.comparisonId;

    const responseJson = {
      success: true,
    };

    try {
      verifyComparisonOwner(comparisonId, userId, ipAddress)
        .then(() => {
          const elementId = request.body.selectedElementId;
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
};
