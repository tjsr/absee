export const getServerHost = (): string => {
  const port: string = window.location.port;
  if (['80', '443', '8283', '5175', ''].includes(port)) {
    return '';
  }
  return `http://${window.location.hostname}:8283`;
};

export const QUERYSTRING_ARRAY_DELIMETER = '~';
export const QUERYSTRING_ELEMENT_DELIMETER = ',';
