import 'reflect-metadata';
import * as express from 'express';
import { createExpressServer, useContainer } from 'routing-controllers';
import { EmployeeController } from './controllers/EmployeeController';
import { ProjectController } from './controllers/ProjectController';
import { AssignmentController } from './controllers/AssignmentController';
import { AuthController } from './controllers/AuthController';
import { GlobalErrorHandler } from './middlewares/GlobalErrorHandler';

export async function createApp() {
    // Create express app
    const app = createExpressServer({
        routePrefix: '/api',
        controllers: [
            EmployeeController,
            ProjectController,
            AssignmentController,
            AuthController,
        ],
        middlewares: [GlobalErrorHandler],
        cors: true,
        defaultErrorHandler: false,
    });

    app.disable('x-powered-by');

    app.use(express.json());

    return app;
}
