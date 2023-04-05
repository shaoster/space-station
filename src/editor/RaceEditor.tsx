import { Box, Chip, Divider, Grid, Slider, Stack, Typography } from "@mui/material";
import { useCallback } from "react";
import { EXAMPLE_RACE } from "../glossary/Compendium";
import { ItemId } from "../glossary/Items";
import { ImageSelector } from "./ImageEditor";
import { BoundTextField, LibraryEditor } from "./LibraryEditor";
import { DataManager, DataNode, useDataManager, useGameConfiguration } from "./Util";

const AffinitySlider = () => {
  const {
    data: maybeAffinity,
    updateData: setAffinity,
  } = useDataManager<number>();
  // Default to 0 if unset.
  const affinity = maybeAffinity ?? 0;
  const marks = [
    {
      value: 0,
      label: "Neutral",
    },
    {
      value: 0.5,
      label: "Likes"
    },
    {
      value: 1,
      label: "Loves"
    },
    {
      value: -0.5,
      label: "Dislikes"
    },
    {
      value: -1.0,
      label: "Abhors"
    }
  ];
  return <Slider
    min={-1.0}
    max={1.0}
    step={0.1}
    value={affinity}
    marks={marks}
    onChange={(_evt, val) => setAffinity((val as number) === 0 ? undefined : val as number)}
  />;
}
const AffinitySelector = () => {
  const {
    gameConfiguration: {
      itemLibrary
    }
  } = useGameConfiguration();
  // Should we ignore quest items?
  const itemKeys = Object.keys(itemLibrary) as ItemId[];
  return <Box>
    <Divider sx={{marginBottom: 2}}>
      <Chip label="Affinities"/>
    </Divider>
    <Stack spacing={2}>
      <Grid container spacing={1}>
        <DataManager>
        {
        itemKeys.map((itemKey: ItemId) => (
          <DataNode dataKey={itemKey} key={itemKey}>
            <Grid item xs={1}>
              <Typography>
                {itemKey}
              </Typography>
            </Grid>
            <Grid item xs={11}>
              <AffinitySlider/>
            </Grid>
          </DataNode>
        ))
        } 
        </DataManager>
      </Grid>
    </Stack>
  </Box>;
};

const RaceCard = () => {
  return <Box sx={{width: "100%", padding: 2}}>
    <Stack spacing={2}>
      <DataManager>
        <DataNode dataKey="raceName" key="name">
          <BoundTextField label="Race Name"/>
        </DataNode>
        <DataNode dataKey="imageId" key="imageId">
          <ImageSelector label="Race Insignia"/>
        </DataNode>
        <DataNode dataKey="itemAffinities" key="affs">
          <AffinitySelector/>
        </DataNode>
      </DataManager>
    </Stack>
  </Box>
};

export default function RaceEditor() {
  const newRace = useCallback(() => ({...EXAMPLE_RACE}), []);
  return <LibraryEditor newEntity={newRace}>
    <RaceCard/>
  </LibraryEditor>;
}