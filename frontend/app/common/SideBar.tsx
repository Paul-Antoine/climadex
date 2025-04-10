import React from 'react';

import './SideBar.css';
import logo from './world.svg';

export function SideBar() {
  return (
    <div id="sidebar">
      <a href="/">
        <img src={logo} width={40} height={40} alt="Logo" />
      </a>
    </div>
  );
}
