import React from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';

import Navbar from './components/Navbar';
import Generator from './components/sections/Generator';
import Section2 from './components/sections/Section2';

import 'normalize.css/normalize.css';
import '@blueprintjs/icons/lib/css/blueprint-icons.css';
import '@blueprintjs/core/lib/css/blueprint.css';
import '@blueprintjs/table/lib/css/table.css';

import './main.css';

function App() {
  return (
    <div className='app bp3-dark'>
      <Router>
        <Navbar />
        <div className='app-routes'>
          <div className='routes-wrapper pad-m'>
            <Route path='/' component={ Generator } exact />
            <Route path='/section2' component={ Section2 } />
          </div>
        </div>
      </Router>
    </div>
  );
}

export default App;
