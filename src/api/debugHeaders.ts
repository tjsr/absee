import { ABSeeRequest } from '../session';
import express from 'express';

export const debugHeaders = (request: ABSeeRequest, response: express.Response) => {
  console.log('Received /debugHeaders request.');
  console.log(JSON.stringify(request.headers));
  response.status(200);
  response.end();
};
