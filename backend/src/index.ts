import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

import { IFactory, IFactoriesPage, ITemperature } from '@climadex/types';
import { IDbFactory } from './types';

import { getMeanTemperatureWarmestQuarter, TIMEFRAMES } from './indicators';
import { z } from '@hono/zod-openapi';
import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import { swaggerUI } from '@hono/swagger-ui'

const app = new OpenAPIHono();

const dbClientPromise = open({
  filename: '../../db.sqlite3',
  driver: sqlite3.Database,
});

app.use('/*', cors());
app.get('/ui', swaggerUI({ url: '/doc' }))

// Function to compute the temperature risk based on the mean temperature for the warmest quarter
// The risk is High:
// - if the temperature > 28°C (critical temperature threshold)
// - and the temperature rising > 2°C (capacity of the factory to adapt to climate change)
const criticalTemperatureThreshold = 28;
const criticalTemperatureRising = 2;
function getTemperatureRisk(latitude: number, longitude: number): IFactory['temperatureRisk'] {
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

// Define openapi schemas
const FactoryParamsSchema = z.object({
  id: z.string().openapi({
    param: {
      name: 'id',
      in: 'path',
    },
    example: '1',
  }),
});

const FactorySchema = z
  .object({
    id: z.string().openapi({ example: '1' }),
    factoryName: z.string().openapi({ example: 'Factory A' }),
    address: z.string().openapi({ example: '123 Main St' }),
    country: z.string().openapi({ example: 'USA' }),
    latitude: z.number().openapi({ example: 40.7128 }),
    longitude: z.number().openapi({ example: -74.006 }),
    yearlyRevenue: z.number().openapi({ example: 1000000 }),
    temperatureRisk: z.string().openapi({ example: 'High' }),
  })
  .openapi('Factory');

const FactoriesPageSchema = z
  .object({
    factories: z.array(FactorySchema),
    hasMore: z.boolean().openapi({ example: true }),
  })
  .openapi('FactoriesPage');

const TemperatureSchema = z
  .array(
    z.object({
      year: z.number().openapi({ example: 2030 }),
      temperature: z.number().openapi({ example: 29.5 }),
    })
  )
  .openapi('Temperature');

const CreateFactorySchema = z
  .object({
    factoryName: z.string().openapi({ example: 'Factory B' }),
    country: z.string().openapi({ example: 'France' }),
    address: z.string().openapi({ example: '456 Rue de Paris' }),
    latitude: z.number().openapi({ example: 48.8566 }),
    longitude: z.number().openapi({ example: 2.3522 }),
    yearlyRevenue: z.number().openapi({ example: 2000000 }),
  })
  .openapi('CreateFactory');

const UpdateTemperatureRiskSchema = z
  .object({
    result: z.string().openapi({ example: 'Temperature risk updated for 10 factories.' }),
  })
  .openapi('UpdateTemperatureRisk');

// Define routes
const routeFactory = createRoute({
  method: 'get',
  path: '/factory/:id',
  request: {
    params: FactoryParamsSchema,
  },
  responses: {
    200: {
      description: 'Factory found',
      content: {
        'application/json': { 
          schema: FactorySchema,
        },
      },
    },
    404: {
      description: 'Factory not found',
    }
  },
});

app.openapi(routeFactory, async (c) => {
  const client = await dbClientPromise;
  const id = c.req.param('id');
  const factoryData = await client.get(`SELECT * FROM factories WHERE id = ?;`, [id]);
  if (!factoryData) {
    return c.json({ error: `Factory ${id} not found.` }, 404);
  }

  const factory: IFactory = {
    id: factoryData.id,
    factoryName: factoryData.factory_name,
    address: factoryData.address,
    country: factoryData.country,
    latitude: factoryData.latitude,
    longitude: factoryData.longitude,
    yearlyRevenue: factoryData.yearly_revenue,
    temperatureRisk: factoryData.temperature_risk,
  };

  return c.json(factory);
})

const routeFactoryTemperature = createRoute({
  method: 'get',
  path: '/factory/:id/temperature',
  request: {
    params: FactoryParamsSchema,
  },
  responses: {
    200: {
      description: 'Temperature data found',
      content: {
        'application/json': { 
          schema: TemperatureSchema,
        },
      },
    },
    404: {
      description: 'Factory not found',
    },
  },
});

app.openapi(routeFactoryTemperature, async (c) => {
  const client = await dbClientPromise;
  const id = c.req.param('id');

  const factory = await client.get(`SELECT * FROM factories WHERE id = ?;`, [id]);
  if (!factory) {
    return c.json({ error: `Factory ${id} not found.` }, 404);
  }

  const temperatures: ITemperature[] = TIMEFRAMES.map((timeframe) => {
    const temperature = getMeanTemperatureWarmestQuarter({
      latitude: factory.latitude,
      longitude: factory.longitude,
      timeframe,
    });

    return { year: timeframe, temperature: temperature };
  });

  return c.json(temperatures);
});


const routeFactories = createRoute( {
  method: 'get',
  path: '/factories',
  request: {
    query: z.object({
      q: z.string().optional().openapi({ example: 'Factory' }),
      risk: z.string().optional().openapi({ example: 'High' }),
      page: z.string().optional().openapi({ example: '1' }),
      pageSize: z.string().optional().openapi({ example: '20' }),
    }),
  },
  responses: {
    200: { 
      description: 'List of factories',
      content: { 
        'application/json': {
          schema: FactoriesPageSchema 
        },
      },
    },
    400: {
      description: 'Invalid query parameters',
    }
  },
});

app.openapi(routeFactories, async (c) => {
  const client = await dbClientPromise;

  const query = c.req.query('q');
  const temperatureRisk = c.req.query('risk');
  const page = parseInt(c.req.query('page') || '1', 10);
  const pageSize = parseInt(c.req.query('pageSize') || '20', 10);

  const offset = (page - 1) * pageSize;
  const limit = pageSize + 1; // fetch one more to check if there are more results

  let sql = `SELECT * FROM factories`;
  const params: any[] = [];

  // Add filters for search and temperature risk
  if (query || temperatureRisk) {
    sql += ` WHERE`;
    
    if (query) {
      sql += ` LOWER(factory_name) LIKE ?`;
      params.push(`%${query.toLowerCase()}%`);
    }

    if (temperatureRisk) {
      if (query) sql += ` AND`;
      sql += ` temperature_risk = ?`;
      params.push(temperatureRisk);
    }
  }

  sql += ` LIMIT ? OFFSET ?;`;
  params.push(limit, offset);

  const factories = await client.all(sql, params);
  const hasMore = factories.length > pageSize;
  const response: IFactoriesPage = {
    factories: factories.map((factory: IDbFactory): IFactory => {
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
    }),
    hasMore
  };

  return c.json(response);
});

const routeCreateFactory = createRoute({
  method: 'post',
  path: '/factories',
  requestBody: {
    description: 'Create a new factory',
    required: true,
    content: {
      'application/json': {
//        schema: CreateFactorySchema, // todo: fix this
      },
    },
  },
  responses: { 
    200: {
      description: 'Factory created',
      content: {
        'application/json': {
          schema: z.object({ result: z.string().openapi({ example: 'OK' }) }),
        },
      },
    },
    400: {
      description: 'Invalid parameters'
    },
  },
});

app.openapi(routeCreateFactory, async (c) => {
    const client = await dbClientPromise;

    const { factoryName, country, address, latitude, longitude, yearlyRevenue } =
      await c.req.json();
    if (!factoryName || !country || !address || !yearlyRevenue) {
      return c.json({ error: `Invalid parameters.` }, 400)
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

const routePatchTemperatures = createRoute({
  method: 'patch',
  path: '/factories/temperature-risk',
  responses: {
    200: {
      description: 'Temperature risk updated',
      content: {
        'application/json': {
          schema: UpdateTemperatureRiskSchema,
        },
      },
    },
  },
});

app.openapi(routePatchTemperatures, async (c) => {
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
    console.log('=> ' + resultMessage);
    return c.json({ result: resultMessage });
});

// Serve OpenAPI documentation
app.doc('/doc', {
  openapi: '3.0.0',
  info: {
    title: 'Factory API',
    version: '1.0.0',
    description: 'API for managing factories and their temperature risks',
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Local server',
    },
  ],
});

serve(app);
