import { serve } from '@hono/node-server';
import { Hono, Context } from 'hono';
import { cors } from 'hono/cors';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

import { IFactory, IFactoriesPage } from '@climadex/types';
import { IDbFactory } from './types';

import { getMeanTemperatureWarmestQuarter, TIMEFRAMES } from './indicators';

const app = new Hono();

const dbClientPromise = open({
  filename: '../../db.sqlite3',
  driver: sqlite3.Database,
});

app.use('/*', cors());

app.get('/', (c) => {
  // Here is an example of how to read temperatures previsions from the dataset

  const values = [];

  for (const timeframe of TIMEFRAMES) {
    values.push({
      [timeframe]: `${getMeanTemperatureWarmestQuarter({
        latitude: 48.8711312,
        longitude: 2.3462203,
        timeframe: timeframe,
      })}°C`,
    });
  }

  return c.text(
    `Example evolution of temperatures over timeframes : ${JSON.stringify(
      values
    )}`
  );
});

// Function to compute the temperature risk based on the mean temperature for the warmest quarter
// The risk is High:
// - if the temperature > 28°C (critical temperature threshold)
// - and the temperature rising > 2°C (capacity of the factory to adapt to climate change)
const criticalTemperatureThreshold = 28;
const criticalTemperatureRising = 2;
function getTemperatureRisk(latitude: number, longitude: number) : IFactory['temperatureRisk'] {
  const temperatures = [];
  for (const timeframe of TIMEFRAMES) {
    temperatures.push(getMeanTemperatureWarmestQuarter({
      latitude: latitude,
      longitude: longitude,
      timeframe: timeframe,
    }));
  }

  const temperature2030 = temperatures[0];
  const temperature2090 = temperatures[3];

  let temperatureRisk: IFactory['temperatureRisk'] = 'Undefined';
  if (temperature2030 && temperature2090) {
    const risingTemperature = temperature2090 - temperature2030;
    temperatureRisk = temperature2030 > criticalTemperatureThreshold && risingTemperature > criticalTemperatureRising ? 'High' : 'Low';
  }

  return temperatureRisk;
}

app.get('/factory/:id', async (c: Context) => {
  const client = await dbClientPromise;
  const id = c.req.param('id');
  const factory = await client.get(`SELECT * FROM factories WHERE id = ?;`, [id]);
  if (!factory) {
    return c.text(`Factory ${id} not found.`, 404);
  }
  return c.json({
    id: factory.id,
    factoryName: factory.factory_name,
    address: factory.address,
    country: factory.country,
    latitude: factory.latitude,
    longitude: factory.longitude,
    yearlyRevenue: factory.yearly_revenue,
    temperatureRisk: factory.temperature_risk
  });
});

// Get the temperature for a specific factory
app.get('/factory/:id/temperature', async (c: Context) => {
  const client = await dbClientPromise;
  const id = c.req.param('id');

  // Récupérer les informations de l'usine depuis la base de données
  const factory = await client.get(`SELECT * FROM factories WHERE id = ?;`, [id]);
  if (!factory) {
    return c.text(`Factory ${id} not found.`, 404);
  }

  const temperatures = TIMEFRAMES.map((timeframe) => {
    const temperature = getMeanTemperatureWarmestQuarter({
      latitude: factory.latitude,
      longitude: factory.longitude,
      timeframe,
    });

    return {year: timeframe, temperature: temperature};
  });

  return c.json(temperatures);
});

app.get('/factories', async (c: Context) => {
  const client = await dbClientPromise;

  const query = c.req.query('q');
  const page = parseInt(c.req.query('page') || '1', 10);
  const pageSize = parseInt(c.req.query('pageSize') || '20', 10);

  const offset = (page - 1) * pageSize;
  const limit = pageSize + 1; // fetch one more to check if there are more results

  const factories = query
    ? await client.all(
        `SELECT * FROM factories WHERE LOWER( factory_name ) LIKE ? LIMIT ? OFFSET ?;`,
        [`%${query.toLowerCase()}%`, limit, offset]
      )
    : await client.all(
        `SELECT * FROM factories LIMIT ? OFFSET ?;`,
        [limit, offset]
      );

  const hasMore = factories.length > pageSize;

  const response : IFactoriesPage = {
    factories: factories.map(
      (factory: IDbFactory): IFactory => {
        return {
          id: factory.id,
          factoryName: factory.factory_name,
          address: factory.address,
          country: factory.country,
          latitude: factory.latitude,
          longitude: factory.longitude,
          yearlyRevenue: factory.yearly_revenue,
          temperatureRisk: factory.temperature_risk
        };
      }
    ),
    hasMore
  };

  return c.json(response);
});

// create a new factory
app.post('/factories', async (c: Context) => {
  const client = await dbClientPromise;

  const { factoryName, country, address, latitude, longitude, yearlyRevenue } =
    await c.req.json();
  if (!factoryName || !country || !address || !yearlyRevenue) {
    return c.text('Invalid body.', 400);
  }

  const factory: IFactory = {
    factoryName,
    country,
    address,
    latitude: +latitude,
    longitude: +longitude,
    yearlyRevenue: +yearlyRevenue,
    temperatureRisk: getTemperatureRisk(+latitude, +longitude),
  };

  await client.run(
    `INSERT INTO factories (factory_name, address, country, latitude, longitude, yearly_revenue, temperature_risk)
VALUES (?, ?, ?, ?, ?, ?, ?);`,
    factory.factoryName,
    factory.address,
    factory.country,
    factory.latitude,
    factory.longitude,
    factory.yearlyRevenue,
    factory.temperatureRisk
  );

  return c.json({ result: 'OK' });
});

// update the temperature risk for all factories
app.patch('/factories/temperature-risk', async (c: Context) => {
  const client = await dbClientPromise;
  console.log('Updating temperature risk for all factories');

  const columnCheck = await client.all(
    `PRAGMA table_info(factories);`
  );

  const columnExists = columnCheck.some((column: any) => column.name === 'temperature_risk');

  if (!columnExists) {
    console.log('=> adding temperature_risk column to factories table');
    await client.run(`ALTER TABLE factories ADD COLUMN temperature_risk TEXT;`);
  }

  const factories = await client.all(`SELECT * FROM factories;`);

  for (const factory of factories) {
    const temperatureRisk = getTemperatureRisk(factory.latitude, factory.longitude);
    await client.run(
      `UPDATE factories SET temperature_risk = ? WHERE id = ?;`,
      [temperatureRisk, factory.id]
    );
  }

  const resultMessage = `Temperature risk updated for ${factories.length} factories.`;
  console.log("=> " + resultMessage);
  return c.json({ result: resultMessage });
});

serve(app);
