/**
 * This module is meant to hide the side-effecting warts.
 * @packageDocumentation
 */
import React, { ReactElement, ReactNode, useContext, useEffect, useState } from "react";
import { matchPath, useLocation, useResolvedPath } from "react-router-dom";
import useLocalStorage from "use-local-storage";
import { DATA_DEPENDENCIES, GameConfiguration, newGameConfiguration } from "../glossary/Compendium";

import jp, { PathComponent } from 'jsonpath';
import { useErrorBoundary } from "react-error-boundary";
import { STATIC_PROFILES } from "./ProfilePicker";


/**
 * Child interface that encapsulates dependencies between objects.
 */
export interface DataLeaser {
  addDependent: (dependent: PathComponent[], dependency: PathComponent[]) => void;
  removeDependent: (dependent: PathComponent[], dependency: PathComponent[]) => void;
  getDependents: (dependency: PathComponent[])  => PathComponent[][];
};

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
  /**
   * The "address" of the described data.
   */
  pathPrefix: string[],
  data: T,
  updateData: (data: T) => void,
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
) : T {
  console.log("Bubble called with ", action);
  if (typeof action.data === "undefined") {
    // This is a child-signalled deletion. We shouldn't allow any undefs in the
    // actual data struct.
    const {
      [action.fieldName]: removed,
      ...remaining
    } = state;
    return remaining as T;
  }
  return {
    ...state,
    [action.fieldName]: action.data
  } as T
};

/**
 * Models inbound dependencies on a particularly entity as a nested dictionary.
 * The key operations of add/remove/check should all be O(1).
 */
export type PermitsType = {[key: string] : {[key: string] : undefined}};

const getLeaser = (permits: PermitsType, setPermits: (permits: PermitsType) => void) => {
  return {
    addDependent: function(dependent, dependency): void {
      // First deal with the inbound side.
      const dependentPath = jp.stringify(dependent);
      const dependencyPath = jp.stringify(dependency);
      if (dependencyPath in permits) {
        setPermits({
          ...permits,
          [dependencyPath]: {
            ...permits[dependencyPath],
            [dependentPath]: undefined
          },
        });
      } else {
        setPermits({
          ...permits,
          [dependencyPath]: {
            [dependentPath]: undefined,
          }
        });
      }
    },
    removeDependent: function(dependent, dependency): void {
      const dependentPath = jp.stringify(dependent);
      const dependencyPath = jp.stringify(dependency);
      if (!(dependencyPath in permits)) {
        throw new Error(`There is no dependency on ${dependencyPath} to remove.`);
      }
      if (!(dependentPath in permits[dependencyPath])) {
        throw new Error(`${dependentPath} has no dependency on ${dependencyPath} to remove.`);
      }
      const {
        [dependentPath]: removed,
        ...remainingInbound
      } = permits[dependencyPath];

      if (Object.keys(remainingInbound).length === 0) {
        // No more inbound paths!
        const {
          [dependencyPath]: removed,
          ...remainingOutbound
        } = permits
        setPermits(remainingOutbound);
      } else {
        setPermits({
          ...permits,
          [dependencyPath]: remainingInbound
        });
      }
    },
    getDependents: function(dependency) {
      const dependencyPath = JSON.stringify(dependency);
      return dependencyPath in permits ?
        Object.keys(permits[dependencyPath]).map(p => JSON.parse(p) as string[])
        : [];
    }
  } as DataLeaser;
};

function getInitialPermits(gameConfiguration: GameConfiguration) {
  const permits : PermitsType = {};
  const updatePermits = (newPermits: PermitsType) => {
    Object.assign(permits, newPermits);
  };
  const leaser = getLeaser(permits, updatePermits);
  for (const [pathExp, dl] of Object.entries(DATA_DEPENDENCIES)) {
    const entries = jp.nodes(gameConfiguration, pathExp);
    for (const {path, value} of entries) {
        const dep = dl(path, value);
        leaser.addDependent(path, dep);
    }
  }
  console.log("Permits:", permits);
  return permits;
}

const DataManagerInternal = <T extends {[key: string | number | symbol] : any}>(
  {data, updateData, defaultValue, children}: 
  {
    data?: T,
    updateData?: (data: T) => void,
    defaultValue?: T,
    children: ReactNode
  }
) => {
  const { showBoundary } = useErrorBoundary();
  const {
    pathPrefix: contextPath,
    data: contextData,
    updateData: contextUpdater,
  } = useDataManager<T>();
  const actualData = (data ?? contextData ?? defaultValue) as T | undefined;
  const actualPath = contextPath ?? [];
  if (typeof actualData === "undefined") {
    throw new Error("DataManager must have data at its root, at the very least. Found at: "
    + contextPath.join("."));
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
          const pathPrefix = actualPath.concat(dataKey);
          const data = actualData[dataKey];
          const providerContent = {
            data,
            pathPrefix,
            updateData: function(updatedItem: any) {
              // TODO: Consider implementing incremental referential integrity
              // checking here.
              /*
              // The key idea for referential integrity here is that
              // we might be on the inbound side or outbound side of
              // a data dependency, and we might be both.
              // If we're outbound, we only need to reject invalid deletions.
              // If we're inbound, we need to add or remove edges.
              const originalKeys = new Set(Object.keys(data));
              const updatedKeys = new Set(Object.keys(updatedItem));
              const addedKeys = Object.keys(updatedItem).filter(
                (k) => !originalKeys.has(k)
              );
              const deletedKeys = Object.keys(data).filter(
                (k) => !updatedKeys.has(k)
              );
              for (const deletedKey in deletedKeys) {
                const deletedPath = actualPath.concat(deletedKey);
                const maybeDependents = realLeaser.getDependents(deletedPath);
                if (maybeDependents.length !== 0) {
                  // Reject invalid deletions.
                  throw new Error(`${maybeDependents[0]}`);
                }
                // Remove outdated edges.
                for (const dependency of actualGetDependencies(pathPrefix, dataKey, data)) {
                  realLeaser.removeDependent(deletedPath, dependency);
                }
              }
              for (const addedKey in addedKeys) {
                const addedPath = actualPath.concat(addedKey);
                for (const dependency of actualGetDependencies(pathPrefix, dataKey, data)) {
                  //realLeaser.addDependent(addedPath, dependency);
                }
              }
              */

              // Bubble up.
              const action = {
                fieldName: (dataKey as keyof typeof data),
                data: updatedItem
              };
              console.log("Dispatching with:", action);
              const newState = bubble(actualData, action) as T;
              try {
                realUpdater(newState);
              } catch (e) {
                // Make data update errors into rendering errors so we can use
                // error boundaries.
                showBoundary(e);
              }
            },
            leaser: undefined, 
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
 * This is a provider target for DataManager and works like a decorator
 * component.
 * 
 * All direct children of DataManager need to be duck-typed to include
 * the dataKey field and this is just an empty container that takes
 * a type-safe (but unused) dataKey prop.
 * 
 * Note: The only reason we're not using "key" is that key is theoretically
 * a react internal concept. The downside of this respect for impl details is
 * that in most cases, both key and dataKey are set to the same value.
 * 
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
      pathPrefix: [],
      data: undefined,
      updateData: () => {
        throw new Error("No data updater bound!");
      },
    };
  }
  return dataManager as DataManagerType<T | undefined>;
}

// This is kind of a special case root of the above that I wrote before
// the more generic DataManager.
// TODO: Reconcile.
export type GameConfigurationManager = {
  currentProfile: string,
  gameConfiguration: GameConfiguration,
  updateGameConfiguration: (configuration: GameConfiguration) => void
};

const GameConfigurationContext = React.createContext<GameConfigurationManager | undefined>(undefined);

export class ReferentialIntegrityError extends Error {
  dependency: string;
  dependents: string[];
  
  constructor(dependency: string, dependents: string[])  {
    super(`Key ${dependency} cannot be removed because it is depended on by: ${dependents}`);
    this.dependency = dependency;
    this.dependents = dependents;
  }
}

export const GameConfigurationProvider = ({profileName, children} : {profileName: string, children: ReactNode}) => {
  console.log("Loading profile from:", profileName)
  const [savedConfiguration, saveCurrentConfiguration] = useLocalStorage<GameConfiguration | undefined>(
    profileName,
    STATIC_PROFILES[profileName] 
  );
  const [workingConfiguration, updateWorkingConfiguration] = useState(savedConfiguration || newGameConfiguration());
  // As the quick and dirty solution for correctness, let's just recompute referential integrity on each update.
  // TODO: Incrementally update.
  const referenceSafeUpdateWorkingConfiguration = (gameConfig: GameConfiguration) => {
    const permits = getInitialPermits(gameConfig);
    for (const [dependency, dependents] of Object.entries(permits)) {
      // Every key must exist.
      const nodes = jp.nodes(gameConfig, dependency);
      if (nodes.length === 0) {
        throw new ReferentialIntegrityError(dependency, Object.keys(dependents));
      }
    }
    updateWorkingConfiguration(gameConfig);
  }; 

  // If we don't have anything saved for the current profile, save what we have now.
  if (!savedConfiguration) {
    saveCurrentConfiguration(workingConfiguration);
  }
  // And also save whatever changes we make going forward.
  useEffect(() => {
    saveCurrentConfiguration(workingConfiguration);  
  }, [workingConfiguration, saveCurrentConfiguration]);
  return <GameConfigurationContext.Provider value={{
    currentProfile: profileName,
    gameConfiguration: workingConfiguration,
    updateGameConfiguration: referenceSafeUpdateWorkingConfiguration
  }}>
    {children}
  </GameConfigurationContext.Provider>;
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
  component?: React.FunctionComponent,
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
  const patterns = Object.keys(routeMap).sort((a, b) => b.length - a.length);
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