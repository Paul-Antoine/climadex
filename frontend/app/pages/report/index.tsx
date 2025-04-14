import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { IFactory } from '@climadex/types';
import { FactoryInfos } from './FactoryInfos';
import { FactoryTemperatures } from './FactoryTemperatures';
import './Report.css';

async function fetchFactoryInfos( factoryId: number ): Promise<IFactory> {
  const response = await fetch(`http://localhost:3000/factory/${factoryId}`);

  const json = await response.json();

  return json;
}

export function ReportPage() {
  const params = useParams();
  console.log(params);
  const factoryId = params.reportId ? parseInt(params.reportId) : 0;
  const [factory, setFactory] = useState<IFactory>({});

  useEffect(() => {

    fetchFactoryInfos(factoryId).then((data) => {
      setFactory(data);
    });
  }, [factoryId]);

  return (
    <div id="main">
      <div id="header">
        <Link to="/factories" className="backLink">&lsaquo; Back to factories</Link>
      </div>
      <div className='report'>
        <FactoryInfos factory={factory} />
        <FactoryTemperatures factory={factory} />
      </div>
    </div>
  );
}
