import { CollectionIdType } from '../types.js';

export class RequiredEnvError extends Error {
  _varname: string;

  public get varname(): string {
    return this._varname;
  }

  constructor(varname: string, message: string) {
    super(message);
    this._varname = varname;
    this.name = 'RequiredEnvError';
  }
}

export class ABSeeError extends Error {
  constructor(message: string, cause?: Error) {
    super(message, cause);
    this.name = 'ABSeeError';
  }
}

export class LoaderNotFoundError extends ABSeeError {
  constructor(id: CollectionIdType, cause?: Error) {
    super(`No loader found for id ${id}`, cause);
    this.name = 'LoaderNotFoundError';
  }
}
