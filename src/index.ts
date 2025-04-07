import dotenv from 'dotenv';
import { useContainer } from 'routing-controllers';
import Container from 'typedi';
import { DataSource } from 'typeorm';
import { createApp } from './app';
import { dataSource } from './dataSource';

dotenv.config();

useContainer(Container);

const PORT = process.env.SERVER_PORT || 3000;

async function bootstrap() {
    dataSource
        .initialize()
        .then(async () => {
            console.log("Data Source has been initialized!");

            Container.set("data-source", dataSource);
            Container.set(DataSource, dataSource);

            const app = await createApp();

            app.listen(PORT, () => {
                console.log(`Server is running on port ${PORT}`);
            });
        })
        .catch((err) => {
            console.error("Error during Data Source initialization:", err);
        });
}

bootstrap().catch(console.error);
