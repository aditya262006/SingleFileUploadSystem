const express = require('express');

const app = express();

app.get('/welcome', (req, res) => {
    res.json({
        message: "Welcome to Express.js Application"
    });
});

app.listen(3000, () => {
    console.log("Server running on port 3000");
});