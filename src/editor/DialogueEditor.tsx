import { Box, Stack } from "@mui/material";
import { useCallback } from "react";
import { EXAMPLE_RACE } from "../glossary/Compendium";
import { ImageSelector } from "./ImageEditor";
import { BoundTextField, LibraryEditor, LibrarySelector } from "./LibraryEditor";
import { DataManager, DataNode, useDataManager, useGameConfiguration } from "./Util";
import MarkdownEditor from "@uiw/react-markdown-editor";

const BoundMarkdownEditor = () => {
  const {
    data: textMarkdown,
    updateData: updateTextMarkdown
  } = useDataManager<string>();
  return <MarkdownEditor
    value={textMarkdown}
    onChange={updateTextMarkdown}
  />;
};

const DialogueCard = () => {
  const {
    gameConfiguration: {
      characterLibrary
    }
  } = useGameConfiguration();
  return <Box sx={{width: "100%", maxWidth: "1440px", padding: 2}}>
    <Stack spacing={2}>
      <DataManager>
        <DataNode dataKey="speakerId" key="speaker">
          <LibrarySelector
            fieldLabel="Speaker (optional)"
            fieldLibrary={characterLibrary}
          />
        </DataNode>
        <DataNode dataKey="textMarkdown" key="text">
          <BoundMarkdownEditor/>
        </DataNode>
        <DataNode dataKey="imageId" key="image">
          <ImageSelector label="Sprite (optional)"/>
        </DataNode>
      </DataManager>
    </Stack>
  </Box>
};

export default function DialogueEditor() {
  const newDialogue = useCallback(() => ({...EXAMPLE_RACE}), []);
  return <LibraryEditor newEntity={newDialogue}>
    <DialogueCard/>
  </LibraryEditor>;
}