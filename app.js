const express = require('express');
const tasksRouter = require('./routes/tasks');

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/tasks', tasksRouter);

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

if (require.main === module) {
    app.listen(port, () => {
        console.log(`Server is listening on ${port}`);
    });
}

module.exports = app;
