import React from 'react';
import './RiskIndicator.css';

interface RiskIndicatorProps {
  risk: 'High' | 'Low' | string;
}

export function RiskIndicator({ risk }: RiskIndicatorProps) {
  let displayRisk = risk;
  const riskClass = (() => {
    switch (risk) {
      case 'High':
        displayRisk = 'High';
        return 'risk-high';
      case 'Low':
        displayRisk = 'Low';
        return 'risk-low';
      default:
        displayRisk = 'N/A';
        return 'risk-undefined';
    }
  })();

  return <span className={riskClass}>{displayRisk}</span>;
}