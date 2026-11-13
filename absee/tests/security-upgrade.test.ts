import assert from 'node:assert/strict';
import { test } from 'node:test';
import app from '../src/index.ts';

test('OpenAPI schemas still generate after the Zod migration', async () => {
  const response = await app.request('/openapi.json');
  assert.equal(response.status, 200);
  const schema = await response.json();
  assert.ok(schema.paths['/api/tasks'].post);
  assert.ok(schema.paths['/api/tasks/{taskSlug}'].get);
});

test('list and fetch routes accept typed parameters', async () => {
  assert.equal((await app.request('/api/tasks?page=0&isCompleted=false')).status, 200);
  const response = await app.request('/api/tasks/example');
  assert.equal(response.status, 200);
  assert.equal((await response.json()).task.slug, 'example');
});

test('task creation retains optional fields and default false', async () => {
  const response = await app.request('/api/tasks', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Example', slug: 'example', due_date: '2026-11-13T00:00:00Z' }),
  });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.task.completed, false);
  assert.equal(body.task.slug, 'example');
});

test('malformed task input is rejected', async () => {
  const response = await app.request('/api/tasks', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: 42, slug: 'example', due_date: 'not-a-date' }),
  });
  assert.equal(response.status, 400);
});
