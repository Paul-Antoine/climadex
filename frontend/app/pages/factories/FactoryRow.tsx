import React from 'react';
import { Link } from 'react-router-dom';
import { IFactory } from '@climadex/types';

export function FactoryRow(factory: IFactory) {
  const formatter = Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  // Determine the class name based on the temperature risk
  const riskClass = factory.temperatureRisk === 'High'
    ? 'risk-high'
    : factory.temperatureRisk === 'Low' ? 'risk-low' : 'risk-undefined';

  return (
    <tr key={factory.id}>
      <td>
        <Link to={`/reports/${factory.id}`}>{factory.factoryName}</Link>
      </td>
      <td>{factory.address}</td>
      <td>{factory.country}</td>
      <td>{factory.latitude}</td>
      <td>{factory.longitude}</td>
      <td>{formatter.format(+factory.yearlyRevenue)}</td>
      <td className={riskClass}>{factory.temperatureRisk}</td>
    </tr>
  );
}
