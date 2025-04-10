import React from 'react';
import { useParams } from 'react-router-dom';

export function ReportPage() {
  const params = useParams();

  return <p>Report page for id {params.reportId}.</p>;
}
