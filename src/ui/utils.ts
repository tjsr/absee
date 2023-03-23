export const getServerHost = (): string => {
  const port: string = window.location.port;
  if (['80', '443', '8280', ''].includes(port)) {
    return '';
  }
  return 'http://localhost:8280';
};
