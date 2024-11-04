export const asyncHandlerWrap = (fn: Function) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (...args: any) => {
    return fn(...args).catch(args[2]);
  };
};
