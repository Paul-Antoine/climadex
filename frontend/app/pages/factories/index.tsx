import React, { useState } from 'react';
import { FactoriesTable } from './FactoriesTable';
import debounce from 'lodash.debounce';

import './index.css';
import { Link } from 'react-router-dom';

export function FactoriesPage() {
  const [filterString, setFilterString] = useState('');
  const debouncedSetFilterString = debounce(setFilterString, 400); // laggy search fix

  return (
    <div id="main">
      <div id="header">
        <h1>My factories</h1>
        <Link to={'/add'}>Add</Link>
      </div>
      <label>Search <input
        type="text"
        onChange={(e) => debouncedSetFilterString(e.target.value)}
      /></label>
      <FactoriesTable filterString={filterString} />
    </div>
  );
}
