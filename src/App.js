import React from 'react';
import { BrowserRouter as Router, Route, Redirect } from 'react-router-dom';

import Navbar from './components/Navbar';
import Home from './components/sections/Home';
import Generator from './components/sections/Generator';
import Photography from './components/sections/Photography';

import 'normalize.css/normalize.css';
import '@blueprintjs/icons/lib/css/blueprint-icons.css';
import '@blueprintjs/core/lib/css/blueprint.css';
import '@blueprintjs/table/lib/css/table.css';

import './main.css';

const { constants, fs, path, process } = window;
const { baseDir, configDir } = constants;

function App() {
  fs.mkdir(baseDir);
  fs.mkdir(configDir);

  return (
    <div className='app bp3-dark'>
      <Router>
        <Navbar />
        <div className='app-routes'>
          <div className='routes-wrapper pad-m'>
            <Route path='/' component={ Home } exact />
            <Route path='/generator' component={ Generator } />
            <Route path='/photography' component={ Photography } />
            { window.location.pathname.includes('index.html') && <Redirect to='/' /> }
          </div>
        </div>
      </Router>
    </div>
  );
}

export default App;
