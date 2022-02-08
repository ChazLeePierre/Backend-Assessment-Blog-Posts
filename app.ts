import { Express } from "express";
import express from 'express';

const app: Express = express();

// middleware to parse urlencoded & JSON payloads
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

export default app;