# Task Manager API

A RESTful API for managing tasks, built with Node.js and Express.js using in-memory storage (no database). Supports full CRUD operations, input validation, filtering, sorting, and task prioritization.

## Overview

Tasks are stored in memory (they reset whenever the server restarts) and follow this schema:

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

- `id`, `title`, `description`, `completed` are the core fields required by the assignment.
- `priority` (`low` | `medium` | `high`) is an optional extension field — it defaults to `medium` if omitted.
- `createdAt` is set automatically when a task is created and is used for sorting.

The server seeds its initial in-memory task list from a hardcoded array in [`app.js`](app.js) — there is no file or database backing the store, so all data resets on restart.

## Setup Instructions

**Requirements:** Node.js >= 18

```bash
# Install dependencies
npm install

# Start the server (listens on port 3000)
node app.js
```

The API will be available at `http://localhost:3000`.

## Running Tests

```bash
npm run test
```

This runs the `tap` test suite in `test/server.test.js` against the app using `supertest`.

## API Endpoints

### `GET /tasks`

Retrieve all tasks. Supports optional query parameters:

| Query param  | Values           | Description                                   |
|--------------|------------------|------------------------------------------------|
| `completed`  | `true` / `false` | Filter tasks by completion status              |
| `sort`       | `asc` / `desc`   | Sort tasks by creation date                    |

```bash
curl http://localhost:3000/tasks
curl "http://localhost:3000/tasks?completed=true"
curl "http://localhost:3000/tasks?sort=desc"
curl "http://localhost:3000/tasks?completed=false&sort=asc"
```

**Responses:** `200 OK` with an array of tasks, or `400 Bad Request` if `completed`/`sort` has an invalid value.

### `GET /tasks/priority/:level`

Retrieve all tasks with the given priority (`low`, `medium`, or `high`).

```bash
curl http://localhost:3000/tasks/priority/high
```

**Responses:** `200 OK` with an array of tasks, or `400 Bad Request` if `:level` is not a valid priority.

### `GET /tasks/:id`

Retrieve a single task by its numeric `id`.

```bash
curl http://localhost:3000/tasks/1
```

**Responses:** `200 OK` with the task, `400 Bad Request` if `:id` isn't a valid integer, or `404 Not Found` if no task has that id.

### `POST /tasks`

Create a new task.

**Body:**

```json
{
  "title": "Buy groceries",
  "description": "Milk, eggs, bread",
  "completed": false,
  "priority": "low"
}
```

- `title` — required, non-empty string.
- `description` — required, non-empty string.
- `completed` — required, boolean.
- `priority` — optional, one of `low` / `medium` / `high` (defaults to `medium`).

```bash
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Buy groceries","description":"Milk, eggs, bread","completed":false,"priority":"low"}'
```

**Responses:** `201 Created` with the new task, or `400 Bad Request` if validation fails.

### `PUT /tasks/:id`

Replace an existing task's fields by id. `title`, `description`, and `completed` are required (same validation rules as `POST`); `priority` is optional and left unchanged if omitted.

```bash
curl -X PUT http://localhost:3000/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"title":"Set up environment","description":"Install Node.js, npm, and git","completed":true,"priority":"high"}'
```

**Responses:** `200 OK` with the updated task, `400 Bad Request` if `:id` is malformed or a required field is missing/invalid, or `404 Not Found` if the id doesn't exist.

### `DELETE /tasks/:id`

Delete a task by id.

```bash
curl -X DELETE http://localhost:3000/tasks/1
```

**Responses:** `200 OK` with the deleted task, `400 Bad Request` if `:id` isn't a valid integer, or `404 Not Found` if the id doesn't exist.

## Error Handling

- `400 Bad Request` — invalid input (missing/invalid fields, invalid query params, malformed JSON body).
- `404 Not Found` — task id or priority level not found, or an undefined route.
- `500 Internal Server Error` — unexpected server error.
