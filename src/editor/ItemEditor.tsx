import { Box, Stack } from "@mui/material";
import { useCallback } from "react";
import { EXAMPLE_ITEM } from "../glossary/Compendium";
import { ImageSelector } from "./ImageEditor";
import { BoundCheckbox, BoundTextField, LibraryEditor } from "./LibraryEditor";
import { DataManager, DataNode } from "./Util";

const ItemCard = () => {
  return <Box sx={{padding: 2}}>
    <Stack spacing={2}>
      <DataManager>
        <DataNode dataKey="name" key="name">
          <BoundTextField label="Item Name"/>
        </DataNode>
        <DataNode dataKey="description" key="description">
          <BoundTextField label="Description"/>
        </DataNode>
        <DataNode dataKey="flavor" key="flavor">
          <BoundTextField label="Flavor (optional)"/>
        </DataNode>
        <DataNode dataKey="imageId" key="imageId">
          <ImageSelector label="Sprite"/>
        </DataNode>
        <DataNode dataKey="isQuestItem" key="iqi">
          <BoundCheckbox label="Quest Item?"/>
        </DataNode>
      </DataManager>
    </Stack>
  </Box>;
};

export default function ItemEditor() {
  const newItem = useCallback(() => ({...EXAMPLE_ITEM}), []);
  return <LibraryEditor newEntity={newItem}>
    <ItemCard/>
  </LibraryEditor>;
}