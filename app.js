const express = require('express');

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PRIORITY_LEVELS = ['low', 'medium', 'high'];

const initialTasks = [
    { id: 1, title: 'Set up environment', description: 'Install Node.js, npm, and git', completed: true },
    { id: 2, title: 'Create a new project', description: 'Create a new project using the Express application generator', completed: true },
    { id: 3, title: 'Install nodemon', description: 'Install nodemon as a development dependency', completed: true },
    { id: 4, title: 'Install Express', description: 'Install Express', completed: false },
    { id: 5, title: 'Install Mongoose', description: 'Install Mongoose', completed: false },
    { id: 6, title: 'Install Morgan', description: 'Install Morgan', completed: false },
    { id: 7, title: 'Install body-parser', description: 'Install body-parser', completed: false },
    { id: 8, title: 'Install cors', description: 'Install cors', completed: false },
    { id: 9, title: 'Install passport', description: 'Install passport', completed: false },
    { id: 10, title: 'Install passport-local', description: 'Install passport-local', completed: false },
    { id: 11, title: 'Install passport-local-mongoose', description: 'Install passport-local-mongoose', completed: false },
    { id: 12, title: 'Install express-session', description: 'Install express-session', completed: false },
    { id: 13, title: 'Install connect-mongo', description: 'Install connect-mongo', completed: false },
    { id: 14, title: 'Install dotenv', description: 'Install dotenv', completed: false },
    { id: 15, title: 'Install jsonwebtoken', description: 'Install jsonwebtoken', completed: false },
];

let tasks = initialTasks.map((task, index) => ({
    ...task,
    priority: 'medium',
    createdAt: new Date(Date.now() - (initialTasks.length - index) * 1000).toISOString(),
}));

let nextId = tasks.reduce((max, task) => Math.max(max, task.id), 0) + 1;

function isValidPriority(value) {
    return PRIORITY_LEVELS.includes(value);
}

function isNonEmptyString(value) {
    return typeof value === 'string' && value.trim().length > 0;
}

function isBoolean(value) {
    return typeof value === 'boolean';
}

function findTaskIndexById(id) {
    return tasks.findIndex((task) => task.id === id);
}

function parseTaskId(rawId) {
    if (!/^\d+$/.test(rawId)) return null;
    return Number(rawId);
}

function validateTaskFields(body) {
    const errors = [];
    if (!isNonEmptyString(body.title)) errors.push('title is required and must be a non-empty string');
    if (!isNonEmptyString(body.description)) errors.push('description is required and must be a non-empty string');
    if (!isBoolean(body.completed)) errors.push('completed is required and must be a boolean');
    if (body.priority !== undefined && !isValidPriority(body.priority)) {
        errors.push(`priority must be one of: ${PRIORITY_LEVELS.join(', ')}`);
    }
    return errors;
}

app.get('/tasks', (req, res) => {
    let result = [...tasks];

    if (req.query.completed !== undefined) {
        if (req.query.completed !== 'true' && req.query.completed !== 'false') {
            return res.status(400).json({ error: "completed query parameter must be 'true' or 'false'" });
        }
        const completed = req.query.completed === 'true';
        result = result.filter((task) => task.completed === completed);
    }

    if (req.query.sort !== undefined) {
        if (req.query.sort !== 'asc' && req.query.sort !== 'desc') {
            return res.status(400).json({ error: "sort query parameter must be 'asc' or 'desc'" });
        }
        result = [...result].sort((a, b) => {
            const diff = new Date(a.createdAt) - new Date(b.createdAt);
            return req.query.sort === 'asc' ? diff : -diff;
        });
    }

    res.status(200).json(result);
});

app.get('/tasks/priority/:level', (req, res) => {
    const { level } = req.params;
    if (!isValidPriority(level)) {
        return res.status(400).json({ error: `priority level must be one of: ${PRIORITY_LEVELS.join(', ')}` });
    }
    res.status(200).json(tasks.filter((task) => task.priority === level));
});

app.get('/tasks/:id', (req, res) => {
    const id = parseTaskId(req.params.id);
    if (id === null) {
        return res.status(400).json({ error: `Invalid task id: ${req.params.id}` });
    }
    const task = tasks.find((t) => t.id === id);
    if (!task) {
        return res.status(404).json({ error: `Task with id ${id} not found` });
    }
    res.status(200).json(task);
});

app.post('/tasks', (req, res) => {
    const body = req.body || {};
    const errors = validateTaskFields(body);
    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }

    const newTask = {
        id: nextId++,
        title: body.title.trim(),
        description: body.description.trim(),
        completed: body.completed,
        priority: body.priority || 'medium',
        createdAt: new Date().toISOString(),
    };

    tasks.push(newTask);
    res.status(201).json(newTask);
});

app.put('/tasks/:id', (req, res) => {
    const id = parseTaskId(req.params.id);
    if (id === null) {
        return res.status(400).json({ error: `Invalid task id: ${req.params.id}` });
    }
    const index = findTaskIndexById(id);
    if (index === -1) {
        return res.status(404).json({ error: `Task with id ${id} not found` });
    }

    const body = req.body || {};
    const errors = validateTaskFields(body);
    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }

    const task = tasks[index];
    task.title = body.title.trim();
    task.description = body.description.trim();
    task.completed = body.completed;
    if (body.priority !== undefined) task.priority = body.priority;

    res.status(200).json(task);
});

app.delete('/tasks/:id', (req, res) => {
    const id = parseTaskId(req.params.id);
    if (id === null) {
        return res.status(400).json({ error: `Invalid task id: ${req.params.id}` });
    }
    const index = findTaskIndexById(id);
    if (index === -1) {
        return res.status(404).json({ error: `Task with id ${id} not found` });
    }

    const [deletedTask] = tasks.splice(index, 1);
    res.status(200).json(deletedTask);
});

app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
    if (err && err.type === 'entity.parse.failed') {
        return res.status(400).json({ error: 'Invalid JSON payload' });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, (err) => {
    if (err) {
        return console.log('Something bad happened', err);
    }
    console.log(`Server is listening on ${port}`);
});

module.exports = app;
