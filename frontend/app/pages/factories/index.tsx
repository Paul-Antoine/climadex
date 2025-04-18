import React, { useState } from 'react';
import { FactoriesTable } from './FactoriesTable';
import debounce from 'lodash.debounce';
import { IFactory } from '@climadex/types';
import './index.css';
import { Link } from 'react-router-dom';

export function FactoriesPage() {
  const [filterString, setFilterString] = useState('');
  const [filterRisk, setFilterRisk] = useState<IFactory['temperatureRisk'] | undefined>(undefined);
  const debouncedSetFilterString = debounce(setFilterString, 400); // laggy search fix

  const handleRiskChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterRisk(e.target.checked ? 'High' : undefined);
  };

  return (
    <div id="main">
      <div id="header">
        <h1>My factories</h1>
        <Link to={'/add'}>Add</Link>
      </div>
      <div className='searchFilter'>
        <label>
          <input
            type="text"
            onChange={(e) => debouncedSetFilterString(e.target.value)}
            placeholder="Search factories..."
          />
        </label>
        <label style={{ marginLeft: 'auto' }}>
          <input
            type="checkbox"
            onChange={handleRiskChange}
          />
          <span> Display only high risk factories</span>
        </label>
      </div>
      <FactoriesTable filterString={filterString} filterRisk={filterRisk} />
    </div>
  );
}
