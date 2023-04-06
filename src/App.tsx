import { Route, Routes } from 'react-router-dom';
import './App.css';
import { SaveProfileProvider } from './editor/ProfilePicker';
import Studio from './editor/Studio';
import { useGameConfiguration } from './editor/Util';
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
