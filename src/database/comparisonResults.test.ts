import { describe, expect, test, vi } from 'vitest';
import type { PrismaClient } from '@prisma/client';
import { retrieveComparisonResults } from './comparisonResults.ts';

describe('retrieveComparisonResults', () => {
  test('filters to answered comparisons and maps the response and element relations', async () => {
    const findMany = vi.fn().mockResolvedValue([{
      id: 12n,
      userId: 'user',
      requestTime: new Date('2026-01-01T00:00:00Z'),
      responses: [{ selectedComparisonElementId: 42n }],
      elements: [{ id: 13n, comparisonId: 12n, elementId: 42n, objectId: 'pin' }],
    }]);
    const client = { comparison: { findMany } } as unknown as PrismaClient;
    const result = await retrieveComparisonResults(client, 'collection', undefined, 5);
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      take: 5,
      where: { collectionId: 'collection', responses: { some: {} } },
    }));
    expect(result).toEqual([{
      id: '12', userId: 'user', requestTime: '2026-01-01T00:00:00.000Z', winner: '42',
      elements: [{ id: '13', comparisonId: '12', elementId: '42', objectId: 'pin' }],
    }]);
  });
});
