import { ABSeeRequest } from '../session.ts';
import { IPAddress } from '../types.ts';
import express from 'express';
import { getIp } from '../server.ts';
import { getUserIdentificationString } from '../auth/user.ts';
import { isSnowflake } from '../validate.ts';
import { saveComparisonSelection } from '../comparisonresponse.ts';
import { verifyComparisonOwner } from '../comparison.ts';

export const submit = (request: ABSeeRequest, response: express.Response) => {
  try {
    // const comparisonId = request.params.comparisonId;
    const userId = request.session.userId;
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

    const prisma = request.app.locals.prismaClient;
    return verifyComparisonOwner(prisma, comparisonId, userId, ipAddress)
      .then(() => saveComparisonSelection(prisma, comparisonId, elementId))
      .then(() => {
        const idString: string = getUserIdentificationString(request);
        console.debug(`Saved response: ${elementId} for ${comparisonId} by ${userId} (${idString}).`);
        response.status(200).send({ success: true });
      })
      .catch((err) => {
        console.error(`Failure in POST /submit`, err);
        response.status(401).send({ success: false });
      });
  } catch (err) {
    console.error(`Failure in POST /submit`, err);
    response.status(401).send({ success: false });
    return;
  }
};
