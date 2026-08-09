# Task Manager API

This is a simple REST API for managing a to-do list. It is built with Node.js and Express. There is no database — all tasks are kept in memory, so they reset when you restart the server.

The API can create, read, update, and delete tasks. It also checks your input and gives clear errors when something is wrong. On top of that, it supports filtering, sorting, and task priority.

## What a task looks like

```json
{
  "id": 1,
  "title": "Set up environment",
  "description": "Install Node.js, npm, and git",
  "completed": true,
  "priority": "medium",
  "createdAt": "2026-08-08T17:53:36.025Z"
}
```

- `id`, `title`, `description`, and `completed` are the main fields.
- `priority` can be `low`, `medium`, or `high`. If you don't set it, it defaults to `medium`.
- `createdAt` is added automatically when a task is created. It's used for sorting.

The starting tasks are written directly in `app.js` — there's no file or database behind them, so once you restart the server, you're back to the original list.

## How to run it

You need Node.js version 18 or higher.

```bash
# Install the dependencies
npm install

# Start the server
node app.js
```

The server runs at `http://localhost:3000`.

## How to run the tests

```bash
npm run test
```

This runs the tests in `test/server.test.js`.

## The endpoints

### `GET /tasks` — get all tasks

You can narrow down or reorder the results with two optional query params:

| Param       | Values           | What it does                     |
|-------------|------------------|-----------------------------------|
| `completed` | `true` / `false` | Only show tasks with that status |
| `sort`      | `asc` / `desc`   | Sort tasks by when they were made |

```bash
curl http://localhost:3000/tasks
curl "http://localhost:3000/tasks?completed=true"
curl "http://localhost:3000/tasks?sort=desc"
```

Returns `200` with the list of tasks. Returns `400` if `completed` or `sort` is given something other than the values above.

### `GET /tasks/priority/:level` — get tasks by priority

`:level` must be `low`, `medium`, or `high`.

```bash
curl http://localhost:3000/tasks/priority/high
```

Returns `200` with the matching tasks. Returns `400` if `:level` isn't one of the three values.

### `GET /tasks/:id` — get one task

```bash
curl http://localhost:3000/tasks/1
```

Returns `200` with the task. Returns `400` if `:id` isn't a number. Returns `404` if no task has that id.

### `POST /tasks` — create a task

Send a JSON body like this:

```json
{
  "title": "Buy groceries",
  "description": "Milk, eggs, bread",
  "completed": false,
  "priority": "low"
}
```

Rules:
- `title` — must be a non-empty piece of text.
- `description` — must be a non-empty piece of text.
- `completed` — must be `true` or `false`.
- `priority` — optional. If you set it, it must be `low`, `medium`, or `high`. Defaults to `medium`.

```bash
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Buy groceries","description":"Milk, eggs, bread","completed":false,"priority":"low"}'
```

Returns `201` with the new task. Returns `400` if the input breaks any of the rules above.

### `PUT /tasks/:id` — update a task

You must send `title`, `description`, and `completed`, following the same rules as `POST`. `priority` is optional — if you leave it out, the task keeps its current priority.

```bash
curl -X PUT http://localhost:3000/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"title":"Set up environment","description":"Install Node.js, npm, and git","completed":true,"priority":"high"}'
```

Returns `200` with the updated task. Returns `400` if `:id` isn't a number, or if a field breaks the rules. Returns `404` if no task has that id.

### `DELETE /tasks/:id` — delete a task

```bash
curl -X DELETE http://localhost:3000/tasks/1
```

Returns `200` with the deleted task. Returns `400` if `:id` isn't a number. Returns `404` if no task has that id.

## Errors, in short

- `400` — something about your request was wrong (bad input, bad query param, broken JSON).
- `404` — the task (or route) you asked for doesn't exist.
- `500` — something went wrong on the server side.
