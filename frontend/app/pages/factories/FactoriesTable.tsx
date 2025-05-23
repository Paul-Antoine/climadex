import React, { useEffect, useState, useRef, useCallback } from 'react';

import './FactoriesTable.css';

import { IFactory, IFactoriesPage } from '@climadex/types';
import { FactoryRow } from './FactoryRow';
import test from 'node:test';

async function fetchFactories(filterString: string, page: number, pageSize: number , risk: IFactory['temperatureRisk']): Promise<IFactoriesPage> {
  let url = "http://localhost:3000/factories";
  let sep = '?'; 
  if (filterString) {
    url += `${sep}q=${filterString}`;
    sep = '&';
  }

  if (page && pageSize) {
    url += `${sep}page=${page}&pageSize=${pageSize}`;
    sep = '&';
  }

  if (risk) {
    url += `${sep}risk=${risk}`;
    sep = '&';
  }

  const response = await fetch(url);
  const { factories, hasMore } = await response.json();

  return { factories, hasMore };
}

export function FactoriesTable({ filterString, filterRisk }: { filterString: string; filterRisk?: IFactory['temperatureRisk'] }) {
  const [factories, setFactories] = useState<IFactory[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const pageSize = 15;

  const loadMoreFactories = useCallback(async () => {
    if (!hasMore) return;

    const { factories: newFactories, hasMore: more } = await fetchFactories(filterString, page, pageSize, filterRisk || '');
    setFactories((prev) => [...prev, ...newFactories]);
    setHasMore(more);
    setPage((prev) => prev + 1);
  }, [filterString, page, hasMore, filterRisk]);

  useEffect(() => {
    setFactories([]);
    setPage(1);
    setHasMore(true);
  }, [filterString, filterRisk]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMoreFactories();
        }
      },
      { threshold: 1.0 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => {
      if (loaderRef.current) {
        observer.unobserve(loaderRef.current);
      }
    };
  }, [loadMoreFactories, hasMore]);

  return (
    <div>
      <table>
        <thead>
          <tr>
            <th>Factory name</th>
            <th>Address</th>
            <th>Country</th>
            <th>Latitude</th>
            <th>Longitude</th>
            <th>Yearly Revenue</th>
            <th>Temperature Risk</th>
          </tr>
        </thead>
        <tbody>{factories?.map(FactoryRow)}</tbody>
      </table>
      <div ref={loaderRef} style={{ height: '50px', textAlign: 'center' }}>
        {hasMore && 'Loading factories...'}
      </div>
    </div>
  );
}
