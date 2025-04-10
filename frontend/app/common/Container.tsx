import React from 'react';
import { Outlet } from 'react-router-dom';

import './Container.css';

export function Container() {
  return (
    <div id="container">
      <Outlet />
    </div>
  );
}
