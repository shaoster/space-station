import AddCircleIcon from '@mui/icons-material/AddCircle';
import { Alert, Autocomplete, Box, Button, Checkbox, FormControlLabel, List, ListItem, Tab, Tabs, TextField, TextFieldProps } from "@mui/material";
import { PropsWithChildren, useCallback, useReducer } from "react";
import { Link, Route, Routes } from "react-router-dom";
import { EntityId, EntityLibrary, GameConfiguration, IdentifiableEntity } from "../glossary/Compendium";
import { ResourceBundle } from "../glossary/Resources";
import { DataManager, DataNode, EntityEditor, RouteMap, useDataManager, useGameConfiguration, useRelativeRouteMatch } from "./Util";

export type LibraryField = keyof GameConfiguration;
export interface LibraryHandler<T extends EntityLibrary, U extends EntityId> {
  /**
   * Pick which library you are taking ownership for.
   * This is generally hierarchical, so any changes to the sub-library have to be validated by the parent before
   * they are allowed to actually persist.
   * This design is meant to allow referential integrity between multiple libraries enforced
   * either through rejection of update or cascading deletes.
   */
  libraryFieldSelector: LibraryField;
  
  /**
   * It is the specific EntityHandler's responsibility to decide how to render the editor for the given entity
   * type.
   *  
   * @readonly @param configuration A read-only snapshot of the current game configuration so we can make
   * cross-entity references if we want.
   * @param libraryUpdater Use this to propagate updates to the library.
   * @returns 
   */
  renderLibrary: (
    configuration: GameConfiguration,
    libraryUpdater: (library: T) => void,
  ) => JSX.Element;

  /**
   * This gives us a way to provide an encapsulated mechanism for each editor to ensure
   * the referential integrity of objects that it is responsible for managing.
   * 
   * By "encapsulated" here, I mean that only the thing that needs another object should be required
   * to know about that dependency, instead of everybody else having to account for the dependency.
   * 
   * Before any candidate library is accepted into the top-level, all other registered editors must be
   * queried to see if any data dependencies are now violated.
   * 
   * @param configuration The current draft configuration to validate.
   * @param library The library containing the entities to validate, chosen based on {@link LibraryHandler.libraryFieldSelector}.
   * @returns A potentially empty list of entity ids (of the type this editor is managing) whose dependencies
   * are violated. An empty list means all is well.
   */
  validateDataDependencies(
    configuration: GameConfiguration,
    library: T
  ) : U[];
};

export interface EntityHandler<T extends EntityId, U extends IdentifiableEntity, V extends EntityLibrary> {
  /**
   * Pick which library you are taking ownership for.
   * This is generally hierarchical, so any changes to the sub-library have to be validated by the parent before
   * they are allowed to actually persist.
   * This design is meant to allow referential integrity between multiple libraries enforced
   * either through rejection of update or cascading deletes.
   */
  libraryFieldSelector: LibraryField;
  
  /**
   * It is the specific EntityHandler's responsibility to decide how to render the editor for the given entity
   * type.
   *  
   * @readonly @param configuration A read-only snapshot of the current game configuration so we can make
   * cross-entity references if we want.
   * @param libraryUpdater Use this to propagate updates to the library.
   * @optional @readonly @param entityId An identifier for the current entity we want to render.
   *  If not provided, please render a "new" entity button.
   * @optional @readonly @param entityValue The actual entity we want to render. Really just provided for convenience. 
   *  If not provided, please render a "new" entity button.
   * @returns 
   */
  renderEntity: (
    configuration: GameConfiguration,
    libraryUpdater: (library: V) => void,
    entityId?: T,
    entityValue?: U
  ) => JSX.Element;

  /**
   * This gives us a way to provide an encapsulated mechanism for each editor to ensure
   * the referential integrity of objects that it is responsible for managing.
   * 
   * Before any candidate library is accepted into the top-level, all other registered editors must be
   * queried to see if any data dependencies are now violated.
   * 
   * This is a convenient way to do per-entity validation in the cases where that's appropriate.
   * 
   * @param configuration The current draft configuration to validate.
   * @param entityId The current entity id to validate. (Maybe not useful in most cases, but hard to access otherwise.)
   * @param entity The current entity to validate.
   * @returns `true` if dependencies are met. `false` if something broke.
   */
  validateDataDependencies(
    configuration: GameConfiguration,
    entityId: T,
    entity: U
  ) : boolean;
};

type LibraryUpdateAction = {
  libraryField: LibraryField,
  libraryData: EntityLibrary
};

// Lots of editors wil need the ResourcePicker component, so put the logic here?
function validateResourceBundle(
  configuration: GameConfiguration,
  bundle: ResourceBundle
) : boolean {
  for (const referencingCharacterId in bundle.relationships) {
    if (!(referencingCharacterId in configuration.characterLibrary)) {
      return false;
    }
  }

  for (const referencingItemId in bundle.items) {
    if (!(referencingItemId in configuration.itemLibrary)) {
      return false;
    }
  }

  return true;
}

enum UpdateStatus {
  Initial,
  Rejected,
  Accepted
};

type GameConfigurationUpdateState = {
  config: GameConfiguration,
  lastUpdateStatus: UpdateStatus
};

function libraryUpdateReducer(
  state: GameConfigurationUpdateState, 
  action: LibraryUpdateAction
) : GameConfigurationUpdateState {
  if (false) {
    // TODO: Set up the validation machinery.
    return {
      config: state.config,
      lastUpdateStatus: UpdateStatus.Rejected
    };
  }
  return {
    config: {
      ...state.config,
      [action.libraryField]: action.libraryData
    },
    lastUpdateStatus: UpdateStatus.Accepted
  }
}

export const LibrarySelector = (
  { fieldLabel, fieldLibrary, fieldValue, multiple } :
  { fieldLabel: string,
    fieldLibrary: EntityLibrary,
    fieldValue?: any,
    multiple?:boolean,
  }
) => {
  const {
    data,
    updateData
  } = useDataManager();
  const realValue = fieldValue ?? data;
  const renderInput = (params: JSX.IntrinsicAttributes & TextFieldProps) => <TextField {...params} label={fieldLabel} margin="normal" />;
  // Special case handling for "foreign keys".
  const options = Object.keys(fieldLibrary);
  return (
    <Autocomplete
      value={realValue as string[]}
      options={options}
      renderInput={renderInput}
      multiple={multiple}
      onChange={(_evt, value) => {updateData(value)}}
      fullWidth
    />
  );
}

export class LibraryEditorBuilder {
  /**
   * Override that leaves the entire library traversal and rendering to the handler.
   * The main benefit of this shared code is to partition the handling of the libraries and
   * to validate/reject updates from the individual library handlers that violate referential
   * integrity.
   */
  public static fromLibraryHandler<T extends EntityLibrary, U extends EntityId>(
    libraryHandler : LibraryHandler<T, U>
  ) { 
    return () => {
      const {
        gameConfiguration,
        updateGameConfiguration
      } = useGameConfiguration();
      const [gameConfigurationUpdateState, dispatchLibraryUpdate] = useReducer(
        libraryUpdateReducer,
        {
          config: gameConfiguration,
          lastUpdateStatus: UpdateStatus.Initial
        }
      );
      const libraryUpdater = (newLibrary: T) => {
        dispatchLibraryUpdate({
          libraryField: libraryHandler.libraryFieldSelector,
          libraryData : newLibrary
        });
        if (gameConfigurationUpdateState.lastUpdateStatus === UpdateStatus.Accepted) {
          updateGameConfiguration(gameConfigurationUpdateState.config)
        } else {
          throw new Error("Could not update game configuration. Referential Integrity was probably violated.");
        }
      };
      return libraryHandler.renderLibrary(
        gameConfiguration,
        libraryUpdater
      );
    }
  }

  /**
   * Use some default MUI list and dumps an empty node at the end. 
   */
  public static fromEntityHandler<
    T extends EntityId, U extends IdentifiableEntity, V extends EntityLibrary
  > (entityHandler : EntityHandler<T, U, V>) { 
    const genericPreservingEntries = (library: V) => Object.entries(library) as [T, U][]
    const defaultLibraryHandler : LibraryHandler<V, T> = {
      libraryFieldSelector: entityHandler.libraryFieldSelector,
      renderLibrary: (config, libraryUpdater) => (
        <List>
          <DataManager>
            {
              genericPreservingEntries(
                // This is some unfortunate workaround because I don't want to write the type-safe
                // variants for each library.
                (config[(entityHandler.libraryFieldSelector as keyof GameConfiguration)] as V)
              ).map(([key, entity] : [T, U], ) => 
                <DataNode dataKey={key} key={key}>
                  <ListItem key={key}>
                    {
                      entityHandler.renderEntity(
                        config,
                        libraryUpdater,
                        key, 
                        entity
                      )
                    }
                  </ListItem>
                </DataNode>
              )
            } 
          </DataManager>
        </List>
      ),
      validateDataDependencies: (configuration, library) => {
        const entries = Object.entries(library) as [T, U][];
        return entries.filter(
          ([entityId, entity]) =>
          !entityHandler.validateDataDependencies(configuration, entityId as T, entity as U)
        ).map(([k, v]) => k);
      }
    };
    return this.fromLibraryHandler(defaultLibraryHandler);
  }
}

export const BoundTextField = (
  {label}  : {label?: string}
) => {
  const {
    data: fieldValue,
    updateData: updateFieldValue
  } = useDataManager<string>();
  return (
    <TextField
      value={fieldValue}
      label={label}
      onChange={(evt) => updateFieldValue(evt.target.value)}
    />
  );
}

export const BoundCheckbox = (
  {label}  : {label?: string}
) => {
  const {
    data: checked,
    updateData: updateChecked
  } = useDataManager<boolean>();
  return (
    <FormControlLabel
      control={<Checkbox checked={checked}/>}
      label={label}
      onChange={(_evt, val) => updateChecked(val)}
    />
  );
}

export function LibraryEditor<T extends IdentifiableEntity, U extends EntityLibrary>(
  {
    children, newEntity, validate
  } : {
    newEntity: () => T, validate?: (entity: T) => boolean
  } & PropsWithChildren
) {
  const {
    data: library,
    updateData: updateLibrary
  } = useDataManager<U>();
  const routeMap : RouteMap<U> = Object.fromEntries(
    Object.keys(library as U).map((k) => {
      return [k, {
        label: k,
        propertyKey: k,
      }];
    })
  );

  const currentTab = useRelativeRouteMatch<U>(routeMap);
  const handleCreate = useCallback(() => {
    let i = 0;
    while (true) {
      const label = "NEW_" + i;
      if (label in (library as U)) {
        i++;
        continue;
      }
      updateLibrary({
        ...(library as U),
        [label]: newEntity()
      });
      break;
    }
  }, [library, updateLibrary, newEntity]);

  /* TODO: Referential integrity... */
  const handleRename = useCallback((previousName: keyof U, newName: keyof U) => {
    if (newName in (library as U)) {
      throw new Error(`Duplicate name [${String(newName)}] not allowed.`);
    }
    const {
      [previousName]: removed,
      ...strippedLibrary
    } = library;
    updateLibrary({
      ...strippedLibrary as U,
      [newName]: (removed as T)
    });
  }, [library, updateLibrary]);

  /* TODO: Referential integrity... */
  const handleRemove = useCallback((previousName: keyof U) => {
    const {
      [previousName]: removed,
      ...strippedLibrary
    } = library;
    updateLibrary({
      ...strippedLibrary as U,
    });
  }, [library, updateLibrary]);
  
  return (
    <Box sx={{flexGrow: 1, display: "flex"}}>
      <Tabs
        orientation="vertical"
        variant="scrollable"
        value={currentTab}
        >
        {
        Object.entries(routeMap).map(
          ([k, v] : [string, EntityEditor<U>]) => (
          <Tab key={v.label} label={v.label} value={k} to={k} component={Link}/>
          )
        )
        }
        <Tab key="__NEW___" component={Button} startIcon={<AddCircleIcon/>} onClick={handleCreate} />
      </Tabs>
      <Routes>
        {
          Object.entries(routeMap).map(([route, le]) => {
            const dataNodeComponent=(
              <DataManager
                key={le.label}
                data={library}
                updateData={updateLibrary}
              >
                <DataNode dataKey={le.label}>
                  {children}
                </DataNode>
              </DataManager>
            );
            return <Route key={le.label} path={route} element={dataNodeComponent}/>;
          })
        }
        <Route key="*" path="*" element={
          <Box sx={{width: "100%", padding: 4}}>
              <Alert severity="info">
                Select one of the items to the left.
              </Alert>
          </Box>
        } />
      </Routes>
    </Box>
  );
}