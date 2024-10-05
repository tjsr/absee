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
