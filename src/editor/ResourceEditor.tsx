import { Box, Chip, Divider, Slider, Stack } from "@mui/material";
import { FUNGIBLE_VALUES, FungibleResource } from "../glossary/Resources";
import { DataManager, DataNode, useDataManager, useGameConfiguration } from "./Util";

const NumberSlider = ({...props}) => {
  const {
    data, updateData
  } = useDataManager<number>();
  return <Box sx={{padding: 4}}>
    <Slider
      valueLabelDisplay="auto"
      value={data ?? 0}
      step={0.1}
      onChange={(_evt, val) => {
        if (val !== 0) {
          updateData(val as number)
        } else {
          // We want to keep data sparse, so we drop 0s.
          updateData(undefined);
        }
      }}
      {...props}
    />
  </Box>;
}

function FungibleEditor() {
  return <Stack>
    <Divider>
      <Chip label="Fungibles"/>
    </Divider>
    <DataManager defaultValue={{}}>
      {
        FUNGIBLE_VALUES.map(fv => 
          <DataNode key={fv} dataKey={fv}>
            {FungibleResource[fv]}:
            <NumberSlider min={0} max={10}/>
          </DataNode>
        )
      }
    </DataManager>
  </Stack>;
}

function InventoryEditor() {
  const {
    gameConfiguration: {
      itemLibrary
    }
  } = useGameConfiguration();
  return <Stack>
    <Divider>
      <Chip label="Inventory"/>
    </Divider>
    <DataManager defaultValue={{}}>
      {
        Object.keys(itemLibrary).map(i => 
          <DataNode key={i} dataKey={i}>
            {i}:
            {
              itemLibrary[i].isQuestItem ?
                <NumberSlider min={0} max={1} step={1} size="small"
                  marks={[
                    {label: "Don't Have", value: 0},
                    {label: "Have", value: 1},
                  ]}
                  sx={{
                    width: 128
                  }}
                /> :
                <NumberSlider min={0} max={10} step={1}
                  sx={{
                    width: 256
                  }}
                  marks={[
                    {label: "0", value: 0},
                    {label: "10", value: 10}
                  ]}
                />
            }
          </DataNode>
        )
      }
    </DataManager>
  </Stack>;
}

function RelationshipsEditor() {
  const {
    gameConfiguration: {
      characterLibrary
    }
  } = useGameConfiguration();
  return <Stack>
    <Divider>
      <Chip label="Relationships"/>
    </Divider>
    <DataManager defaultValue={{}}>
      {
        Object.keys(characterLibrary).map(c => 
          <DataNode key={c} dataKey={c}>
            {c}:
            <NumberSlider min={-1} max={1} marks={[
              {
                value: -1,
                label: "Hates",
              },
              {
                value: 0,
                label: "Neutral",
              },
              {
                value: 1,
                label: "Loves",
              }]}
            />
          </DataNode>
        )
      }
    </DataManager>
  </Stack>;
}

export default function ResourceEditor() {
  return <Box sx={{padding: 2, width: 480}}>
    <Stack>
      <p>
        These are the initial resources your character starts with.
      </p>
      <DataManager>
        <DataNode dataKey="fungibles" key="f">
          <FungibleEditor/>
        </DataNode>
        <DataNode dataKey="items" key="i">
          <InventoryEditor/>
        </DataNode>
        <DataNode dataKey="relationships" key="r">
          <RelationshipsEditor/>
        </DataNode>
      </DataManager>
    </Stack>
  </Box>;
}