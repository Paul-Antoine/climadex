import React from 'react';
import { IFactory } from '@climadex/types';
import { RiskIndicator } from '../../common/RiskIndicator';

export const FactoryInfos = ({ factory }: { factory: IFactory }) => {
  const formatter = Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  return (
      <div>
        <h2>Factory</h2>
        <p><strong>Name:</strong> {factory.factoryName}</p>
        <p><strong>Address:</strong> {factory.address}</p>
        <p><strong>Country:</strong> {factory.country}</p>
        <p><strong>Latitude:</strong> {factory.latitude}</p>
        <p><strong>Longitude:</strong> {factory.longitude}</p>
        <p><strong>Yearly Revenue:</strong> {formatter.format(+factory.yearlyRevenue)}</p>
        <p><strong>Temperature Risk:</strong> <RiskIndicator risk={factory.temperatureRisk} /></p>
      </div>
  );
};