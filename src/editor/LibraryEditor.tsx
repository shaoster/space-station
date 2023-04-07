import AddCircleIcon from '@mui/icons-material/AddCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import { Alert, Autocomplete, Box, Button, Checkbox, FormControlLabel, IconButton, List, ListItem, Popover, Tab, Tabs, TextField, TextFieldProps } from "@mui/material";
import React, { PropsWithChildren, ReactNode, useCallback, useState } from 'react';
import { Link, Route, Routes } from "react-router-dom";
import { EntityLibrary, GameConfiguration, IdentifiableEntity } from "../glossary/Compendium";
import { ResourceBundle } from "../glossary/Resources";
import { DataManager, DataNode, EntityEditor, RouteMap, useDataManager, useRelativeRouteMatch } from "./Util";

export type LibraryField = keyof GameConfiguration;

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

export const LibrarySelector = (
  { fieldLabel, fieldLibrary, fieldValue, multiple } :
  { fieldLabel?: string,
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

export const LabelEditor = React.forwardRef(
  (
    {
      onLabelChange,
      onLabelDelete,
      onDoubleClick, 
      onEditorClose,
      labelValue,
      editable, to, children, ...props
    } : 
    {
      onLabelChange: (v: string) => void,
      onLabelDelete: () => void,
      onDoubleClick: () => void,
      onEditorClose: () => void,
      /* The real value gets absorbed into the child. Not worth extracting it. */
      labelValue: string,
      editable?: boolean,
      children: ReactNode,
      to: string,
    }, forwardRef: React.ForwardedRef<HTMLAnchorElement>
  ) => {
    const [anchorEl, setAnchorEl] = React.useState<HTMLAnchorElement | null>(null);
    const [tempText, setTempText] = useState(labelValue);
    return <>
      <Link
        ref={forwardRef}
        to={to}
        onDoubleClick={(event) => {
          setAnchorEl(event.currentTarget);
          onDoubleClick()
        }}
        {...props}
      >
        {children}
      </Link>
      <Popover
        anchorEl={anchorEl}
        open={anchorEl !== null && (editable??false)}
        onClose={()=>{
          setAnchorEl(null);
          onLabelChange(tempText);
          onEditorClose();
        }}
        anchorOrigin={{
          vertical: 'center',
          horizontal: 'right'
        }}
      >
        <TextField
          size='small'
          defaultValue={tempText}
          onChange={(e) => setTempText(e.target.value)}
        />
        <IconButton onClick={onLabelDelete}>
          <DeleteIcon/>
        </IconButton>
      </Popover>
    </>;
  }
);

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

  const handleRename = useCallback((previousName: keyof U, newName: keyof U) => {
    if (previousName === newName) {
      return;
    }
    if (newName in (library as U)) {
      throw new Error(`Duplicate name [${String(newName)}] not allowed.`);
    }
    if (!newName) {
      throw new Error(`Every entity must have a unique identifier.`);
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
  const [editingTab, setEditingTab] = useState<string | undefined>(undefined);
  return (
    <Box sx={{flexGrow: 1, display: "flex"}}>
      <Tabs
        orientation="vertical"
        variant="scrollable"
        value={currentTab}
        >
        {
        Object.entries(routeMap).map(
          ([k, v] : [string, EntityEditor<U>]) => {
            return (
              <Tab
                key={v.label}
                label={v.label}
                value={k}
                /* For the editableField */
                labelValue={k}
                to={k}
                editable={k===editingTab}
                onLabelDelete={() => {
                  handleRemove(k)
                  setEditingTab(undefined)
                }}
                onLabelChange={(newKey : string) => {
                  handleRename(k, newKey);
                }}
                onEditorClose={() => {
                  setEditingTab(undefined)
                }}
                component={LabelEditor}
                onDoubleClick={() => {setEditingTab(k)}}
              />
            );
          }
        )
        }
        <Tab
          key="__NEW___"
          component={Button}
          startIcon={<AddCircleIcon/>}
          onClick={handleCreate}
          />
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
          <Box sx={{width: "100%", paddingLeft: 4, paddingTop: 1}}>
              <Alert severity="info">
                Select one of the items to the left:
                <List sx={{listStyleType: 'disc', pl: 4}}>
                  <ListItem sx={{display: 'list-item'}}>
                    Single Click/Tap to select.
                  </ListItem>
                  <ListItem sx={{display: 'list-item'}}>
                    Double Click an item to rename/delete.
                  </ListItem>
                  <ListItem sx={{display: 'list-item'}}>
                    Click <AddCircleIcon
                            sx={{marginLeft: 1, marginRight: 1, verticalAlign: "middle"}}
                          /> to create a new item.
                  </ListItem>
                </List>
              </Alert>
          </Box>
        } />
      </Routes>
    </Box>
  );
}