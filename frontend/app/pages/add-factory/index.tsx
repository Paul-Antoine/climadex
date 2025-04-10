import React from 'react';
import { AddFactoryForm } from './AddFactoryForm';
import { Link } from 'react-router-dom';

export function AddFactoryPage() {
  return (
    <div id="main">
      <Link to="/factories" className="backLink">
        &lsaquo; Back to factories
      </Link>
      <h1>Add a factory</h1>
      <AddFactoryForm />
    </div>
  );
}
