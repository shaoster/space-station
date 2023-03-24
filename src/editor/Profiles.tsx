/**
 * This module is meant to hide the side-effecting warts.
 * @packageDocumentation
 */
import React, { ReactNode, useContext } from "react";
import { HashRouter, Route, Routes, useParams } from "react-router-dom";
import useLocalStorage from "use-local-storage";
import { GameConfiguration, newGameConfiguration } from "../glossary/Compendium";

const SCRATCH_PROFILE = "__DEFAULT__";

export interface SaveContextType {
  /**
   * If the current profile is empty, we will use the SCRATCH_PROFILE by default.
   */
  currentProfile?: string,
  configuration: GameConfiguration,
  /**
   * Save the current configuration, overwriting the current profile.
   */
  saveConfiguration: () => void,
  /**
   * Save the current game configuration.  
   * @param newProfileName The name of the new profile to store the current game configuration.
   * @throws If the new profile name already exists.
   */
  newProfile: (newProfileName: string) => void,
}

const SaveContext = React.createContext<SaveContextType | undefined>(undefined);

export const SaveProfileProvider = ({children} : {children: ReactNode}) => {
  // TODO: FIX THIS!
  // The unwound dependency here is pseudo-cyclic:
  //   - react-router -> profileName
  //   - profileName -> localStorage
  //   - localStorage -> gameConfiguration.
  //   - newProfile -> react-router, which retriggers the above.
  const params = useParams();
  const { profileName } = params;
  const [configuration, saveConfiguration] = useLocalStorage<GameConfiguration>(profileName ?? SCRATCH_PROFILE, newGameConfiguration());
  const contextStruct = {
    currentProfile: profileName,
    configuration: configuration,
    saveConfiguration: () => {saveConfiguration(configuration)},
    newProfile: (newProfileName: string) => {
      // TODO: Think about potential data races here. As long as we're not auto-syncing everything, it's probably fine.
      // There's a clear happens-before relationship for each step in our dependency chain above.
      // Auto-sync could become a mess though...
    } 
  };
  return <HashRouter>
     <SaveContext.Provider value={contextStruct}>
      <Routes>
        <Route path="profiles/:profileName" element={children}/>
      </Routes>
    </SaveContext.Provider>
  </HashRouter>;
};

/**
 * Stolen from https://stackoverflow.com/a/69735347 to bail out when the provider isn't used instead of doing stupid stuff.
 */
export const useSaveProfile = () => {
  const saveContext = useContext<SaveContextType | undefined>(SaveContext);
  if (!saveContext) {
    throw new Error("You forgot to use SaveProfileProvider!!!!!");
  }
  return saveContext;
}
