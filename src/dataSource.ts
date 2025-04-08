import { DataSource } from 'typeorm';
import { Employee } from './entities/Employee';
import { Project } from './entities/Project';
import { Assignment } from './entities/Assignment';

export const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATA_SOURCE_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    username: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'blackdeep',
    database: process.env.POSTGRES_DB || 'blackdeep',
    entities: [Employee, Project, Assignment],
    logging: true,
    synchronize: true,
});
