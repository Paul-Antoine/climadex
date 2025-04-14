import React from 'react';
import './RiskIndicator.css';

interface RiskIndicatorProps {
  risk: 'High' | 'Low' | string;
}

export function RiskIndicator({ risk }: RiskIndicatorProps) {
  const riskClass = (() => {
    switch (risk) {
      case 'High':
        return 'risk-high';
      case 'Low':
        return 'risk-low';
      default:
        return 'risk-undefined';
    }
  })();

  return <span className={riskClass}>{risk}</span>;
}