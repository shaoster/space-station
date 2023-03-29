/**
 * This module is meant to hide the side-effecting warts.
 * @packageDocumentation
 */
import React, { ReactElement, ReactNode, useContext, useEffect, useState } from "react";
import { HashRouter, matchPath, Route, Routes, useLocation, useParams, useResolvedPath } from "react-router-dom";
import useLocalStorage from "use-local-storage";
import { GameConfiguration, newGameConfiguration } from "../glossary/Compendium";

const SCRATCH_PROFILE = "__DEFAULT__";

/**
 * The motivation behind this thing is to avoid repetitive-and error-prone boiler plate stitching together
 * the component hierarchy, when we really just want to make sure we have a single-ownership model
 * of the {@link GameConfiguration} schema.
 * 
 * The studio is typical Data-down, actions-up design, but because there is a 1-to-1 mapping from component
 * to subtree of GameConfiguration AND at each layer, ownership delegation  is mutually exclusive and collectively
 * exhaustive among direct children, this can be made very DRY.
 * 
 * This solution should end up looking like a flattening of the explicitly written component hierarchy, so that
 * each component only needs to implement a visitor-like interface:
 *   - Display data and input controls.
 *   - Combine local updates with updates of descendants and pass up to parent.
 */
export type DataManagerType<T = unknown> = {
  data: T,
  updateData: (data: T) => void
};

export type UpdateAction<T, U extends {[key: string] : any}> = {
  fieldName: keyof U,
  data: T
};

// It's sort of fine for the context itself not to be generic,
// since at any point in the tree there should only be one provider available.
export const DataManagerContext = React.createContext<DataManagerType | undefined>(undefined); 

function bubble<T extends {[key: string | number | symbol] : any}>(
  state: T, action: UpdateAction<any, T>
) {
  console.log("Bubble called with ", action);
  return {
    ...state,
    [action.fieldName]: action.data
  }
};

const DataManagerInternal = <T extends {[key: string | number | symbol] : any}>(
  {data, updateData, validate, children}: 
  {
    data?: T, updateData?: (data: T) => void,
    validate?: (key: keyof T) => boolean, children: ReactNode
  }
) => {
  const {
    data: contextData,
    updateData: contextUpdater
  } = useDataManager<T>();
  const actualData = (data ?? contextData) as T | undefined;
  if (typeof actualData === "undefined") {
    throw new Error("DataManager must have data at its root, at the very least.");
  }
  const realUpdater = updateData ?? contextUpdater;
  return <>
    {
      React.Children.map(
        children as ReactElement,
        (c : ReactElement , i) => {
          const dataKey = c.props?.dataKey;
          if (
            dataKey === null ||
            typeof dataKey === "undefined"
          ) {
            console.log("Invalid dataKey provided: " + dataKey);
            return c;
          }
          const providerContent = {
            data: actualData[dataKey],
            updateData: (updatedItem: any) => {
              // Bubble up.
              const action = {
                fieldName: (dataKey as keyof typeof data),
                data: updatedItem
              };
              console.log("Dispatching with:", action);
              const newState = bubble(actualData, action);
              realUpdater(newState);
            }
          };
          return (
            <DataManagerContext.Provider value={providerContent}>
              {c}
            </DataManagerContext.Provider>
          );
      })
    }
  </>;
};

/**
 * Memoizing generic components is kind of wonky in typescript.
 * https://github.com/DefinitelyTyped/DefinitelyTyped/issues/37087#issuecomment-542793243
 */
const typedMemo: <T>(c: T) => T = React.memo;
export const DataManager = typedMemo(DataManagerInternal);

/**
 * This is a provider target for DataManager.
 * All direct children of DataManager need to be duck-typed to include
 * the dataKey field. 
 */
export const DataNode = React.memo((
  {dataKey, children} :
  {dataKey?: number | string | null, children: ReactNode}
) => {
  return <>
    {children}
  </>;
});

export function useDataManager<T>() : DataManagerType<T | undefined> {
  const dataManager = useContext(DataManagerContext);
  if (typeof dataManager === "undefined") {
    console.log("Datamanager used without parent!");
    return {
      data: undefined,
      updateData: () => {}
    };
  }
  return dataManager as DataManagerType<T | undefined>;
}

// This is kind of a special case root of the above that I wrote before
// the more generic DataManager.
// TODO: Reconcile.
export type GameConfigurationManager = {
  gameConfiguration: GameConfiguration,
  updateGameConfiguration: (configuration: GameConfiguration) => void
}

const GameConfigurationContext = React.createContext<GameConfigurationManager | undefined>(undefined);

export const GameConfigurationProvider = ({profileName, children} : {profileName: string | undefined, children: ReactNode}) => {
  console.log("Loading profile from:", profileName)
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
  return <HashRouter basename="/">
    <Routes>
      <Route path=":profileName/*" element={rebasedChildren}/>
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

// Adapted from https://mui.com/material-ui/guides/routing/#tabs
export type RouteLabel = string;
export type RoutePattern = string;
export type EntityEditor<T> = {
  label: RouteLabel,
  component: React.FunctionComponent,
  propertyKey?: keyof T
  defaultTo?: string,
};

export type RouteMap<T> = {
  [key: RoutePattern] : EntityEditor<T>
};

export function useRelativeRouteMatch<T>(routeMap: RouteMap<T>) {
  const urlPrefix = useResolvedPath("").pathname;
  const { pathname } = useLocation();
  if (!pathname.startsWith(urlPrefix)) {
    throw new Error("Something went wrong with routing.");
  }
  const strippedPath = pathname.slice(urlPrefix.length);
  // Try our best to ensure descendant ordering.
  const patterns = Object.keys(routeMap).sort((a, b) => a.length - b.length);
  for (let i = 0; i < patterns.length; i += 1) {
    const possibleMatch = matchPath({
      path: patterns[i]
    }, strippedPath);
    if (possibleMatch !== null) {
      return possibleMatch?.pattern?.path;
    }
  }
  return undefined;
}