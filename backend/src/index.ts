import { serve } from '@hono/node-server';
import { Hono, Context } from 'hono';
import { cors } from 'hono/cors';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

import { IFactory } from '@climadex/types';
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

function getTemperatureRisk(factory: IDbFactory) : IFactory['temperatureRisk'] {
  const temperature = getMeanTemperatureWarmestQuarter({
    latitude: factory.latitude,
    longitude: factory.longitude,
    timeframe: '2030', // Example timeframe, can be dynamic
  });

  let temperatureRisk: IFactory['temperatureRisk'] = 'Undefined';
  if (temperature !== null) {
    temperatureRisk = temperature > 30 ? 'High' : 'Low'; // todo : example to compute risk, to improve
  }

  //console.log(`Factory: ${factory.factory_name}, Temperature: ${temperature}`);
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
    temperatureRisk: getTemperatureRisk(factory),
  });
});

app.get('/factory/:id/temperature', async (c: Context) => {
  const client = await dbClientPromise;
  const id = c.req.param('id');

  // Récupérer les informations de l'usine depuis la base de données
  const factory = await client.get(`SELECT * FROM factories WHERE id = ?;`, [id]);
  if (!factory) {
    return c.text(`Factory ${id} not found.`, 404);
  }

  // Calculer les températures pour chaque période
  const temperatures = TIMEFRAMES.map((timeframe) => {
    const temperature = getMeanTemperatureWarmestQuarter({
      latitude: factory.latitude,
      longitude: factory.longitude,
      timeframe,
    });
    return { [timeframe]: `${temperature}°C` };
  });

  return c.json(temperatures);
});

app.get('/factories', async (c: Context) => {
  const client = await dbClientPromise;

  const query = c.req.query('q');

  const factories = query
    ? await client.all(
        `SELECT * FROM factories WHERE LOWER( factory_name ) LIKE ?;`,
        [`%${query.toLowerCase()}%`]
      )
    : await client.all('SELECT * FROM factories');

  return c.json(
    factories.map(
      (factory: IDbFactory): IFactory => {
     
        return {
          id: factory.id,
          factoryName: factory.factory_name,
          address: factory.address,
          country: factory.country,
          latitude: factory.latitude,
          longitude: factory.longitude,
          yearlyRevenue: factory.yearly_revenue,
          temperatureRisk : getTemperatureRisk(factory),
        };
      }
    )
  );
});

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
  };

  await client.run(
    `INSERT INTO factories (factory_name, address, country, latitude, longitude, yearly_revenue)
VALUES (?, ?, ?, ?, ?, ?);`,
    factory.factoryName,
    factory.address,
    factory.country,
    factory.latitude,
    factory.longitude,
    factory.yearlyRevenue
  );

  return c.json({ result: 'OK' });
});

serve(app);
