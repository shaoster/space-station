/**
 * This module is meant to hide the side-effecting warts.
 * @packageDocumentation
 */
import React, { ReactNode, useContext, useEffect, useState } from "react";
import { HashRouter, Route, Routes, useParams } from "react-router-dom";
import useLocalStorage from "use-local-storage";
import { GameConfiguration, newGameConfiguration } from "../glossary/Compendium";

const SCRATCH_PROFILE = "__DEFAULT__";

export type GameConfigurationManager = {
  gameConfiguration: GameConfiguration,
  updateGameConfiguration: (configuration: GameConfiguration) => void
}

const GameConfigurationContext = React.createContext<GameConfigurationManager | undefined>(undefined);

export const GameConfigurationProvider = ({profileName, children} : {profileName: string | undefined, children: ReactNode}) => {
  const [savedConfiguration, saveCurrentConfiguration] = useLocalStorage<GameConfiguration | undefined>(
    profileName ?? SCRATCH_PROFILE,
    undefined
  );
  const [workingConfiguration, updateWorkingConfiguration] = useState(savedConfiguration || newGameConfiguration());
  // If we don't have anything saved for the current profile, save what we have now.
  if (!savedConfiguration) {
    saveCurrentConfiguration(workingConfiguration);
  }
  // And also save whatever changes we make going forward.
  useEffect(() => {
    saveCurrentConfiguration(workingConfiguration);  
  }, [workingConfiguration, saveCurrentConfiguration]);
  return <GameConfigurationContext.Provider value={{
    gameConfiguration: workingConfiguration,
    updateGameConfiguration: updateWorkingConfiguration
  }}>
    {children}
  </GameConfigurationContext.Provider>;
};

export const ProfileNameProvider = ({children} : {children: ReactNode}) => {
  const { profileName } = useParams();
  return <GameConfigurationProvider profileName={profileName}>
    {children}
  </GameConfigurationProvider>;
};

export const SaveProfileProvider = ({children} : {children: ReactNode}) => {
  // We have to rewrite the component graph a bit because the useParams hook below has to live within the router here.
  // I guess people don't run into this often because we're building a decorator component here that has to flip the
  // chain inside out to propagate down the children.
  const rebasedChildren = <ProfileNameProvider>
    {children}
  </ProfileNameProvider>;
  return <HashRouter>
    <Routes>
      <Route path="profiles/:profileName" element={rebasedChildren}/>
    </Routes>
  </HashRouter>;
};

/**
 * Stolen from https://stackoverflow.com/a/69735347 to bail out when the provider isn't used instead of doing stupid stuff.
 */
export const useGameConfiguration = () => {
  const gameConfigurationManager = useContext<GameConfigurationManager | undefined>(GameConfigurationContext);
  if (!gameConfigurationManager) {
    throw new Error("You forgot to use GameConfigurationProvider!!!!!");
  }
  return gameConfigurationManager;
};
