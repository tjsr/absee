import { SnowflakeType } from './types';
import { Worker } from 'snowflake-uuid';

const generator = new Worker(0, 1, {
	workerIdBits: 5,
	datacenterIdBits: 5,
	sequenceBits: 12,
});

export const getSnowflake = (): SnowflakeType => {
  return generator.nextId().toString();
};
