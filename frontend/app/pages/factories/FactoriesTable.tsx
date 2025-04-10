import React, { useEffect, useState } from 'react';

import './FactoriesTable.css';

import { IFactory } from '@climadex/types';
import { FactoryRow } from './FactoryRow';

async function fetchFactories({
  filterString,
}: {
  filterString: string;
}): Promise<IFactory[]> {
  const url =
    filterString === ''
      ? 'http://localhost:3000/factories'
      : `http://localhost:3000/factories?q=${filterString}`;

  const response = await fetch(url);

  const json = await response.json();

  return json;
}

export function FactoriesTable({ filterString }: { filterString: string }) {
  const [factories, setFactories] = useState<IFactory[]>([]);

  useEffect(() => {
    fetchFactories({ filterString }).then((json) => setFactories(json));
  }, [filterString]);

  return (
    <table>
      <thead>
        <tr>
          <th>Factory name</th>
          <th>Address</th>
          <th>Country</th>
          <th>Latitude</th>
          <th>Longitude</th>
          <th>Yearly Revenue</th>
        </tr>
      </thead>
      <tbody>{factories?.map(FactoryRow)}</tbody>
    </table>
  );
}
