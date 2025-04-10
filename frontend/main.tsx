import * as ReactDOM from 'react-dom/client';

import React from 'react';
import {
  createBrowserRouter,
  redirect,
  RouterProvider,
} from 'react-router-dom';
import { FactoriesPage } from './app/pages/factories';
import { Wrapper } from './app/common/Wrapper';

import './main.css';
import { AddFactoryPage } from './app/pages/add-factory';
import { ReportPage } from './app/pages/report';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Wrapper />,
    children: [
      {
        path: '',
        loader: () => redirect('/factories'),
      },
      {
        path: 'factories',
        element: <FactoriesPage />,
      },
      {
        path: 'add',
        element: <AddFactoryPage />,
      },
      {
        path: 'reports/:reportId',
        element: <ReportPage />,
      },
      {
        path: '*',
        element: <p>Not found.</p>,
      },
    ],
    errorElement: <p>An error has occurred.</p>,
  },
]);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
