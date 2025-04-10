import React from 'react';
import { Container } from './Container';
import { SideBar } from './SideBar';

import './Wrapper.css';

export function Wrapper() {
  return (
    <div id="wrapper">
      <SideBar />
      <Container />
    </div>
  );
}
