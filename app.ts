import { Express } from "express";
import express from 'express';

const app: Express = express();

// middleware to parse urlencoded & JSON payloads
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// default HTTP port
const HTTP_PORT = 8080;

// start listening for requests on specified port
app.listen(HTTP_PORT, () => {
    console.log("Express http server listening on: " + HTTP_PORT);
});

export default app;