import React from 'react';
import { BrowserRouter as Router, Route, Redirect } from 'react-router-dom';

import Navbar from './components/Navbar';
import Home from './components/sections/Home';
import Generator from './components/sections/Generator';

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
            <Route path='/' component={ Home } exact />
            <Route path='/generator' component={ Generator } />
            {
              window.location.pathname.includes('index.html') &&
              <Redirect to='/' />
            }
          </div>
        </div>
      </Router>
    </div>
  );
}

export default App;
