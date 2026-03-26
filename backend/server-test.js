const express = require('express');
const app = express();

app.get('/api/hello', (req, res) => {
  res.json({ message: "Hello from a minimal server!" });
});

app.get('/(.*)', (req, res) => {
    res.json({ message: "Root reached", env: process.env.NODE_ENV });
});

module.exports = app;
