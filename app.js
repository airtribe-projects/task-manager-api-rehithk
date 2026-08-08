const express = require('express');
const seedData = require('./task.json');

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PRIORITY_LEVELS = ['low', 'medium', 'high'];

let tasks = seedData.tasks.map((task, index) => ({
    ...task,
    priority: isValidPriority(task.priority) ? task.priority : 'medium',
    createdAt: new Date(Date.now() - (seedData.tasks.length - index) * 1000).toISOString(),
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

function validateNewTask(body) {
    const errors = [];
    if (!isNonEmptyString(body.title)) errors.push('title is required and must be a non-empty string');
    if (!isNonEmptyString(body.description)) errors.push('description is required and must be a non-empty string');
    if (!isBoolean(body.completed)) errors.push('completed is required and must be a boolean');
    if (body.priority !== undefined && !isValidPriority(body.priority)) {
        errors.push(`priority must be one of: ${PRIORITY_LEVELS.join(', ')}`);
    }
    return errors;
}

function validateTaskUpdate(body) {
    const errors = [];
    if (body.title !== undefined && !isNonEmptyString(body.title)) errors.push('title must be a non-empty string');
    if (body.description !== undefined && !isNonEmptyString(body.description)) errors.push('description must be a non-empty string');
    if (body.completed !== undefined && !isBoolean(body.completed)) errors.push('completed must be a boolean');
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
    const id = Number(req.params.id);
    const task = tasks.find((t) => t.id === id);
    if (!task) {
        return res.status(404).json({ error: `Task with id ${req.params.id} not found` });
    }
    res.status(200).json(task);
});

app.post('/tasks', (req, res) => {
    const body = req.body || {};
    const errors = validateNewTask(body);
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
    const id = Number(req.params.id);
    const index = findTaskIndexById(id);
    if (index === -1) {
        return res.status(404).json({ error: `Task with id ${req.params.id} not found` });
    }

    const body = req.body || {};
    const errors = validateTaskUpdate(body);
    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }

    const task = tasks[index];
    if (body.title !== undefined) task.title = body.title.trim();
    if (body.description !== undefined) task.description = body.description.trim();
    if (body.completed !== undefined) task.completed = body.completed;
    if (body.priority !== undefined) task.priority = body.priority;

    res.status(200).json(task);
});

app.delete('/tasks/:id', (req, res) => {
    const id = Number(req.params.id);
    const index = findTaskIndexById(id);
    if (index === -1) {
        return res.status(404).json({ error: `Task with id ${req.params.id} not found` });
    }

    const [deletedTask] = tasks.splice(index, 1);
    res.status(200).json(deletedTask);
});

app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
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
