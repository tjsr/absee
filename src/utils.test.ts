import { createdWeightedRandomizerList } from './utils';

describe('Should verify weighted list', () => {
  test('With 0 passed', () => {
    const result = createdWeightedRandomizerList(0);
    expect(result).toStrictEqual([]);
  });

  test('With 1 passed', () => {
    const result = createdWeightedRandomizerList(1);
    expect(result).toStrictEqual([1]);
  });

  test('With 2 passed', () => {
    const result = createdWeightedRandomizerList(2);
    expect(result).toStrictEqual([1, 1, 2]);
  });

  test('With 3 passed', () => {
    const result = createdWeightedRandomizerList(3);
    expect(result).toStrictEqual([1, 1, 1, 2, 2, 3]);
  });

  test('With 4 passed', () => {
    const result = createdWeightedRandomizerList(4);
    expect(result).toStrictEqual([1, 1, 1, 1, 2, 2, 2, 3, 3, 4]);
  });
});
