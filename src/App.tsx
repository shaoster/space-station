import './App.css';
import React from 'react';
import Studio from './editor/Studio';
import { SaveProfileProvider } from './editor/Util';

function App() {
  return (
    <SaveProfileProvider>
      <Studio/>
    </SaveProfileProvider>
  );
}

export default App;
