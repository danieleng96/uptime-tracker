const express = require('express');
const app = express();
//port is configurable through command line, could add as option to frontend but didn't seem necessary

const args = process.argv.slice(2);
const port = args[0] || 1234;
const uptime = args[1] || 0.75;
//default in case of no args

// console.log('port:', port, 'uptime:',uptime)
//simple server middleware,
const simulateDowntime = (req, res, next) => {
    const randomize = Math.random();
    if (randomize > uptime) {
        res.status(503).send('down');
    } else {
        res.status(200).send('functional')
        // next();
    }
};

app.use(simulateDowntime);
//use middleware
app.get('/', (req, res) => {
    // res.send('bleep blorp');
});

//start server
app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});