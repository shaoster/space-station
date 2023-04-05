import { Autocomplete, Box, Card, CardContent, Chip, Divider, Stack, TextField } from "@mui/material";
import { useCallback } from "react";
import { CharacterMood, CharacterRole } from "../glossary/Characters";
import { EXAMPLE_CHARACTER } from "../glossary/Compendium";
import { ImageSelector } from "./ImageEditor";
import { BoundTextField, LibraryEditor, LibrarySelector } from "./LibraryEditor";
import { DataManager, DataNode, useDataManager, useGameConfiguration } from "./Util";

const PortraitSelector = () => {
  const moodLabelsAndValues = Object.values(CharacterMood);
  const moodValues = moodLabelsAndValues.slice(moodLabelsAndValues.length / 2) as CharacterMood[];
  return <Box>
    <Divider>
      <Chip label="Portraits"/>
    </Divider>
    <Stack spacing={2}>
      <DataManager>
      {
      moodValues.map((mood: CharacterMood) => (
        <DataNode dataKey={mood} key={mood}>
          <ImageSelector label={CharacterMood[mood]}/>
        </DataNode>
      ))
      } 
      </DataManager>
    </Stack>
  </Box>;
};

const RoleSelector = () => {
  const {
    data: maybeRole,
    updateData: updateRole
  } = useDataManager<CharacterRole>();
  // CharacterRole is a required field.
  const role = maybeRole as CharacterRole;
  // This is some ES8 nonsense to convert an enum to an object.
  const roleLabelsAndValues = Object.values(CharacterRole);
  const roleValues = roleLabelsAndValues.slice(roleLabelsAndValues.length / 2) as CharacterRole[];
  const handleRoleChange = (_evt: any, roleOptionId: CharacterRole | null) => {
    if (roleOptionId === null) {
      return;
    }
    updateRole(roleOptionId);
  };
  return (
    <Autocomplete
      options={roleValues}
      renderInput={(params) => <TextField {...params} label="Role" />}
      value={role}
      getOptionLabel={(optionId: CharacterRole) => CharacterRole[optionId]}
      onChange={handleRoleChange}
    />
  );
};

const CharacterCard = () => {
  const {
    gameConfiguration
  } = useGameConfiguration();
  // We trust the LibraryEditor to handle the undef case.
  return (
    <Card sx={{width: "100%"}}>
      <CardContent>
        <Stack spacing={2}>
          <DataManager>
            <DataNode dataKey="name">
              <BoundTextField label="Full Name"/>
            </DataNode>
            <DataNode dataKey="title">
              <BoundTextField label="Title/Epithet"/>
            </DataNode>
            <DataNode dataKey="role">
              <RoleSelector/>
            </DataNode>
            <DataNode dataKey="raceId">
              <LibrarySelector
                fieldLabel="Race"
                fieldLibrary={gameConfiguration.raceLibrary}
              />
            </DataNode>
            <DataNode dataKey="imageIds">
              <PortraitSelector/>
            </DataNode>
          </DataManager>
        </Stack>
      </CardContent>
    </Card>
  ); 
};

export default function CharacterEditor() {
  const newCharacter = useCallback(() => ({...EXAMPLE_CHARACTER}), []);
  return <LibraryEditor newEntity={newCharacter}>
    <CharacterCard/>
  </LibraryEditor>;
}