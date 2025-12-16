import 'dotenv/config';

import fs from "fs";

const LOG_VERBOSITY = process.env.LOG_VERBOSITY;

const logStream = fs.createWriteStream(".log", { flags: "a" });

export function log(level, description, message=null) {
    if(level > LOG_VERBOSITY) return;
    const timestamp = new Date().toISOString();
    if(message !== null && typeof message === 'object') {
        message = JSON.stringify(message, null, 2);
    }
    (message != null)?
        logStream.write(`[${timestamp}] ${description} \n-----\n${message}\n-----\n`):
        logStream.write(`[${timestamp}] ${description}\n-----\n`);
}