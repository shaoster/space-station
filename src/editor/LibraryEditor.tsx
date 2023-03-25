import { Autocomplete, Card, CardContent, Divider, List, ListItem, TextField, TextFieldProps } from "@mui/material";
import { useReducer } from "react";
import { EntityId, EntityLibrary, GameConfiguration, IdentifiableEntity } from "../glossary/Compendium";
import { ResourceBundle } from "../glossary/Resources";
import { useGameConfiguration } from "./Profiles";

export type LibraryField = keyof GameConfiguration;
export interface LibraryHandler<T extends EntityLibrary> {
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
};

type LibraryUpdateAction = {
  libraryField: LibraryField,
  libraryData: EntityLibrary
};

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

/**
 * Really poorly implemented referential integrity checker. 
 * TODO: Fix the obvious bugs with the references.
 * @param configuration
 * @param libraryField 
 * @returns 
 */
function libraryMaintainsReferentialIntegrity(
  configuration: GameConfiguration,
  libraryField: LibraryField
) {
  // Basically, we just need to check all other fields in the configuration that make reference to this library.
  const candidateLibrary = configuration[libraryField];

  // This is kind of bogus, but convention > configuration.
  const idLabel : EntityId = libraryField.replace("Library$", "Id");

  for (const libraryToCheck in configuration) {
    if (libraryToCheck === libraryField) {
      // In theory we could have self-references, but I've disallowed that.
      continue;
    }
    if (libraryToCheck === "initialResources") {
      // We have to check referential integrity on resource bundles separately.
      continue;
    }

    const referencingLibrary = configuration[libraryToCheck as LibraryField];
    Object.values(referencingLibrary).every((entity: IdentifiableEntity) => 
      idLabel in entity && entity[idLabel as keyof typeof entity] in candidateLibrary
    );
  }
  // Using this helper might do a tiny bit extra work if we're not touching the
  // character or item libraries, but whatever.
  return validateResourceBundle(configuration, configuration.initialResources);
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
  // We can enforce referential integrity or cascading deletes here.
  if (!libraryMaintainsReferentialIntegrity(state.config, action.libraryField)) {
    // Do not modify. 
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

export const EditableField = (
  {fieldLabel, fieldValue} : { fieldLabel: string, fieldValue: any}
) => {
  const {
    gameConfiguration,
  } = useGameConfiguration();
  const renderInput = (params: JSX.IntrinsicAttributes & TextFieldProps) => <TextField {...params} label={fieldLabel} margin="normal"/>;
  // Special case handling for "foreign keys".
  for (const suffix of ["Id", "Ids"]) {
    if (fieldLabel.endsWith(suffix)) {
      const idPrefix = fieldLabel.replace(new RegExp(suffix + "$"), "");
      const libraryField = idPrefix + "Library";
      const library = gameConfiguration[libraryField as keyof GameConfiguration];
      const options = Object.keys(library);
      const multiple = suffix==="Ids";
      if (multiple) {
        return (
          <Autocomplete
            defaultValue={fieldValue as string[]}
            options={options}
            renderInput={renderInput}
            multiple
            fullWidth
          />
        );
      } else {
        return (
          <Autocomplete
            defaultValue={fieldValue}
            options={options}
            renderInput={renderInput}
            fullWidth
          />
        );
      }
    }
  }
  if (typeof(fieldValue) === "object") {
    // If we hit this, we should probably bail in actual use.
    return <div>
      TODO: Auto-Generated UI.
      <GenericEntityCard entityId={fieldLabel} entity={fieldValue}/>
    </div>;
  } else {
    return <TextField label={fieldLabel} defaultValue={fieldValue} multiline rows={4}/>;
  }
}

const EditableData = ( { data } : { data: {} }) => {
  return <List>
    {
    Object.entries(data).map(([key, value]) => (
      <ListItem key={key}>
        <EditableField fieldLabel={key} fieldValue={value}/>
      </ListItem>
    ))
    }
  </List>;
}

export const GenericEntityCard = (
  {entityId, entity} : ({entityId: EntityId, entity: IdentifiableEntity})
) => {
  return <Card sx={{width: "100%"}} >
    <CardContent>
      <TextField value={entityId} label="Identifier"/>
      <Divider/>
      <EditableData data={entity}/>
    </CardContent>
  </Card>;
};

export class LibraryEditorBuilder {
  /**
   * Override that leaves the entire library traversal and rendering to the handler.
   * The main benefit of this shared code is to partition the handling of the libraries and
   * to validate/reject updates from the individual library handlers that violate referential
   * integrity.
   */
  public static fromLibraryHandler<T extends EntityLibrary>(
    libraryHandler : LibraryHandler<T>
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
    const defaultLibraryHandler : LibraryHandler<V> = {
      libraryFieldSelector: entityHandler.libraryFieldSelector,
      renderLibrary: (config, libraryUpdater) => (
        <List>
          {
            genericPreservingEntries(
              // This is some unfortunate workaround because I don't want to write the type-safe
              // variants for each library.
              (config[(entityHandler.libraryFieldSelector as keyof GameConfiguration)] as V)
            ).map(([key, entity] : [T, U], ) => 
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
            )
          } 
          {
            <ListItem>
                {
                  entityHandler.renderEntity(
                    config,
                    libraryUpdater,
                  )
                }
            </ListItem>
          }
        </List>
      )
    };
    return this.fromLibraryHandler(defaultLibraryHandler);
  }
}
