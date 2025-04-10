import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import * as fs from 'fs/promises';

const createTableStatement = `
CREATE TABLE factories (
    id INTEGER PRIMARY KEY,
    factory_name TEXT NOT NULL,
    address TEXT NOT NULL,
    country TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    yearly_revenue INTEGER NOT NULL
);
`;

const insertTableStatement = `
INSERT INTO factories (factory_name, address, country, latitude, longitude, yearly_revenue)
VALUES (?, ?, ?, ?, ?, ?);
`;

(async () => {
    const db = await open({
        filename: 'db.sqlite3',
        driver: sqlite3.Database
    })

    await db.exec(createTableStatement);

    const factoriesData = await fs.readFile('./scripts/factories.json', 'utf8');
    const factories = JSON.parse(factoriesData);

    for (const factory of factories) {
        await db.run(insertTableStatement,
            factory.factory_name,
            factory.address,
            factory.country,
            factory.latitude,
            factory.longitude,
            factory.yearly_revenue
        );
    }

    await db.close();
})()