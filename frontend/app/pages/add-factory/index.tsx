import React from 'react';
import { AddFactoryForm } from './AddFactoryForm';
import { Link } from 'react-router-dom';

export function AddFactoryPage() {
  return (
    <div id="main">
      <div id='header'>
        <Link to="/factories" className="backLink">&lsaquo; Back to factories</Link>
      </div>
      <h1>Add a factory</h1>
      <AddFactoryForm />
    </div>
  );
}
