import { Hono } from 'hono';
import { TaskCreate } from './endpoints/taskCreate.ts';
import { TaskDelete } from './endpoints/taskDelete.ts';
import { TaskFetch } from './endpoints/taskFetch.ts';
import { TaskList } from './endpoints/taskList.ts';
import { fromHono } from 'chanfana';

// Start a Hono app
const app = new Hono<{ Bindings: Env }>();

// Setup OpenAPI registry
const openapi = fromHono(app, {
  docs_url: '/',
});

// Register OpenAPI endpoints
openapi.get('/api/tasks', TaskList);
openapi.post('/api/tasks', TaskCreate);
openapi.get('/api/tasks/:taskSlug', TaskFetch);
openapi.delete('/api/tasks/:taskSlug', TaskDelete);

// You may also register routes for non OpenAPI directly on Hono
// app.get('/test', (c) => c.text('Hono!'))

// Export the Hono app
export default app;
