const tap = require("tap");
const supertest = require("supertest");
const app = require("../app");
const server = supertest(app);

tap.test("GET /tasks?completed=true only returns completed tasks", async (t) => {
  const response = await server.get("/tasks?completed=true");
  t.equal(response.status, 200);
  t.ok(response.body.length > 0);
  t.ok(response.body.every((task) => task.completed === true));
  t.end();
});

tap.test("GET /tasks?completed=false only returns incomplete tasks", async (t) => {
  const response = await server.get("/tasks?completed=false");
  t.equal(response.status, 200);
  t.ok(response.body.length > 0);
  t.ok(response.body.every((task) => task.completed === false));
  t.end();
});

tap.test("GET /tasks with invalid completed value", async (t) => {
  const response = await server.get("/tasks?completed=maybe");
  t.equal(response.status, 400);
  t.end();
});

tap.test("GET /tasks?sort=asc orders tasks oldest first", async (t) => {
  const response = await server.get("/tasks?sort=asc");
  t.equal(response.status, 200);
  const dates = response.body.map((task) => new Date(task.createdAt).getTime());
  const sorted = [...dates].sort((a, b) => a - b);
  t.same(dates, sorted);
  t.end();
});

tap.test("GET /tasks?sort=desc orders tasks newest first", async (t) => {
  const response = await server.get("/tasks?sort=desc");
  t.equal(response.status, 200);
  const dates = response.body.map((task) => new Date(task.createdAt).getTime());
  const sorted = [...dates].sort((a, b) => b - a);
  t.same(dates, sorted);
  t.end();
});

tap.test("GET /tasks with invalid sort value", async (t) => {
  const response = await server.get("/tasks?sort=sideways");
  t.equal(response.status, 400);
  t.end();
});

tap.test("GET /tasks/priority/medium returns tasks with that priority", async (t) => {
  const response = await server.get("/tasks/priority/medium");
  t.equal(response.status, 200);
  t.ok(response.body.length > 0);
  t.ok(response.body.every((task) => task.priority === "medium"));
  t.end();
});

tap.test("GET /tasks/priority/:level with invalid level", async (t) => {
  const response = await server.get("/tasks/priority/urgent");
  t.equal(response.status, 400);
  t.end();
});

tap.test("POST /tasks without priority defaults to medium", async (t) => {
  const response = await server.post("/tasks").send({
    title: "Default priority task",
    description: "Should default to medium",
    completed: false,
  });
  t.equal(response.status, 201);
  t.equal(response.body.priority, "medium");
  t.end();
});

tap.test("POST /tasks with an explicit priority", async (t) => {
  const response = await server.post("/tasks").send({
    title: "High priority task",
    description: "Should keep the given priority",
    completed: false,
    priority: "high",
  });
  t.equal(response.status, 201);
  t.equal(response.body.priority, "high");
  t.end();
});

tap.test("POST /tasks with an invalid priority", async (t) => {
  const response = await server.post("/tasks").send({
    title: "Bad priority task",
    description: "Should be rejected",
    completed: false,
    priority: "urgent",
  });
  t.equal(response.status, 400);
  t.end();
});

tap.test("GET /tasks/:id with a non-numeric id", async (t) => {
  const response = await server.get("/tasks/abc");
  t.equal(response.status, 400);
  t.end();
});

tap.test("PUT /tasks/:id with a non-numeric id", async (t) => {
  const response = await server.put("/tasks/abc").send({
    title: "Updated",
    description: "Updated",
    completed: true,
  });
  t.equal(response.status, 400);
  t.end();
});

tap.test("DELETE /tasks/:id with a non-numeric id", async (t) => {
  const response = await server.delete("/tasks/abc");
  t.equal(response.status, 400);
  t.end();
});

tap.test("PUT /tasks/:id requires the full set of fields", async (t) => {
  const response = await server.put("/tasks/2").send({ completed: true });
  t.equal(response.status, 400);
  t.end();
});

tap.test("PUT /tasks/:id keeps existing priority when omitted", async (t) => {
  const before = await server.get("/tasks/2");
  const response = await server.put("/tasks/2").send({
    title: "Create a new project",
    description: "Create a new project using the Express application generator",
    completed: true,
  });
  t.equal(response.status, 200);
  t.equal(response.body.priority, before.body.priority);
  t.end();
});

tap.test("PUT /tasks/:id updates priority when provided", async (t) => {
  const response = await server.put("/tasks/2").send({
    title: "Create a new project",
    description: "Create a new project using the Express application generator",
    completed: true,
    priority: "low",
  });
  t.equal(response.status, 200);
  t.equal(response.body.priority, "low");
  t.end();
});

tap.teardown(() => {
  process.exit(0);
});
