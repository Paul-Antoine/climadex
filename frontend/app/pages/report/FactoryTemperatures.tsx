import React, { useEffect, useState } from 'react';
import { IFactory } from '@climadex/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const FactoryTemperatures = ({ factory }: { factory: IFactory }) => {
  const [temperatureData, setTemperatureData] = useState<{ year: number; temperature: number }[]>([]);

  useEffect(() => {
    // Fetch temperature data from the backend
    const fetchTemperatureData = async () => {
      try {
        const response = await fetch(`http://localhost:3000/factory/${factory.id}/temperature`);
        const data = await response.json();

        // Transform the data into the format required by Recharts
        const formattedData = data.map((entry: Record<string, string>) => {
          const year = parseInt(Object.keys(entry)[0], 10);
          const temperature = parseFloat(entry[year].replace('°C', ''));
          return { year, temperature };
        });

        setTemperatureData(formattedData);
      } catch (error) {
        console.error('Error fetching temperature data:', error);
      }
    };

    if (factory.id) {
      fetchTemperatureData();
    }
  }, [factory.id]);

  return (
    <div>
      <h2>Temperatures</h2>
      <LineChart width={400} height={400} data={temperatureData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" label={{ value: 'Year', position: 'insideBottomRight', offset: -5 }} />
          <YAxis label={{ value: 'Temperature (°C)', angle: -90, position: 'insideLeft' }} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="temperature" stroke="#8884d8" activeDot={{ r: 8 }} />
        </LineChart>
    </div>
  );
};