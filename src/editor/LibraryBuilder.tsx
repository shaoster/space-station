import { List, ListItem } from "@mui/material";
import { ReactElement, ReactNode, ReactPropTypes } from "react";
import { EntityId, EntityLibrary, GameConfiguration, IdentifiableEntity } from "../glossary/Compendium";
import { useSaveProfile } from "./Profiles";

export interface EntityHandler<T extends EntityId, U extends IdentifiableEntity, V extends EntityLibrary> {
  selectLibrary: (configuration: GameConfiguration) => V;
  renderEntity: (configuration: GameConfiguration, entityId: T, entityValue: U) => ReactNode;
  createEntity: (library: V, entityId: T) => void;
  updateEntity: (library: V, entityId: T, entityValue: U) => void;
};



export function LibraryBuilder<
  T extends EntityId, U extends IdentifiableEntity, V extends EntityLibrary 
>(
  {handler} : {handler : EntityHandler<T, U, V>}
) { 
  const {
    configuration,
  } = useSaveProfile();
  const library: V = handler.selectLibrary(configuration);
  // Object.keys/Object.entries does not preserve the generic type of the key.
  const genericPreservingEntries = (library: V) => Object.entries(library) as [T, U][]
  return <List>
    {
      genericPreservingEntries(library).map(([key, entity] : [T, U], ) => 
        <ListItem key={key}>
          {
            handler.renderEntity(configuration, key, entity)
          }
        </ListItem>
      )
    }
  </List>;
}