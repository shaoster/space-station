import './App.css';
import React from 'react';
import Studio from './editor/Studio';
import { SaveProfileProvider, useGameConfiguration } from './editor/Util';
import { Route, Routes } from 'react-router-dom';
import getClient from './game/Client';

function PlayOrEdit() {
  const {
    gameConfiguration
  } = useGameConfiguration();
  const GameClient = getClient(gameConfiguration);
  return (
    <Routes>
      <Route path="play/*" element={<GameClient/>}/>
      <Route path="edit/*" element={<Studio/>}/>
    </Routes>
  );
}
function App() {
  return (
    <SaveProfileProvider>
      <PlayOrEdit/>
    </SaveProfileProvider>
  );
}

export default App;
