import React, { useEffect, useState } from 'react';
import { IFactory, ITemperature } from '@climadex/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export const FactoryTemperatures = ({ factory }: { factory: IFactory }) => {
  const [temperatureData, setTemperatureData] = useState<ITemperature[]>([]);

  useEffect(() => {
    const fetchTemperatureData = async () => {
      try {
        const response = await fetch(`http://localhost:3000/factory/${factory.id}/temperature`);
        const data = await response.json();
        setTemperatureData(data);
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
        {checkTemperatureAvailability(temperatureData) ? (
          <LineChart width={400} height={400} data={temperatureData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" label={{ value: 'Year', position: 'insideBottomRight', offset: -5 }} />
            <YAxis label={{ value: 'Temperature (°C)', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="temperature" stroke="#8884d8" activeDot={{ r: 8 }} />
          </LineChart>
        ) : (
          <p>Data not available</p>
        )}
    </div>
  );
};

function checkTemperatureAvailability(temperatureData: ITemperature[]) : boolean {
  if (!temperatureData || temperatureData.length === 0) {
    return false;
  }

  const filteredData = temperatureData.filter((data) => !!data.temperature);
  
  return filteredData.length > 0;
}