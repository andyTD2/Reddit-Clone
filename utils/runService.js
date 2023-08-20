'use strict'
const { Worker } = require('worker_threads');

const runService = async function(serviceFileLocation, serviceRepeatInterval)
{
    const workerThread = new Worker(serviceFileLocation, { workerData: {baseDir: baseDir} });
    workerThread.on("message", (msg) => {
        console.log(`Message from service ${serviceFileLocation}: ${msg}`);
    });
    workerThread.on("error", (err) => {
        console.log(`Service ${serviceFileLocation} encountered an error: ${err}`);
    });
    workerThread.on("exit", (code) => {
        console.log(`Service ${serviceFileLocation} exited with code ${code}`);
        if (serviceRepeatInterval)
        {
            setTimeout(runService, serviceRepeatInterval, serviceFileLocation, serviceRepeatInterval);
        }
    });
}

module.exports = {runService};