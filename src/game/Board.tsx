import { Box, Button, List, ListItem, Stack } from "@mui/material";
import MarkdownEditor from "@uiw/react-markdown-editor";
import { Ctx } from "boardgame.io";
import { BoardProps } from "boardgame.io/dist/types/packages/react";
import { useGameConfiguration } from "../editor/Util";
import { Conversation, ConversationId, DialogueNodeId } from "../glossary/Conversations";
import { SpaceGameState } from "./SpaceGame";

export const DayPanel = (
  {ctx} : {ctx: Ctx}
) => {
  const dayStage = ctx.activePlayers ? ctx.activePlayers[ctx.currentPlayer] : "UNKNOWN";
  return <Stack>
    <p>
      Day: {ctx.turn}
    </p>
    <p>
      Time: {dayStage}
    </p>
  </Stack>;
}

/**
 * The data extraction is a bit duplicative, but it's helpful for the time being to decouple
 * the choice logic from the data presentation.
 */
export const DialoguePanel = (
  {conversationId, dialogueNodeId} :
  {conversationId?: ConversationId, dialogueNodeId?: DialogueNodeId}
) => {
  const {
    gameConfiguration 
  } = useGameConfiguration();
  if (typeof conversationId === "undefined" || 
      typeof dialogueNodeId === "undefined") {
    return <Box>
      <p>Nothing to do in this timeslot.</p>
    </Box>;
  }
  const conversation = gameConfiguration.conversationLibrary[conversationId];
  const {
    locationId,
    characterIds,
  } = conversation;
  const dialogueNode = conversation.dialogueNodeLibrary[dialogueNodeId];
  const {
    dialogueEntryId,
    isGameOver,
    requirement,
    reward,
    cost
  } = dialogueNode;
  const dialogueEntry = gameConfiguration.dialogueEntryLibrary[dialogueEntryId];
  return <Box>
    <p>The following characters are present:</p>
    <List>
      {
        characterIds.map((c) => (
          <ListItem key={c}>
            {c}
          </ListItem>
        ))
      }
    </List>
    <p>{dialogueEntry.speakerId ?? "Narrator"} says:</p>
    <MarkdownEditor.Markdown source={dialogueEntry.textMarkdown}/>
    <p>This {isGameOver ? "is" : "isn't"} game over.</p>
  </Box>;
}

export const Choices = (
  {G, ctx, selectOption} :
  {G: SpaceGameState, ctx: Ctx, selectOption: (choice: string | null) => void}
) => {
  if (typeof G.currentConversation === "undefined" ||
      typeof G.currentDialogueNode === "undefined") {
    return <Stack sx={{maxWidth: 480}}>
      <Button onClick={() => selectOption(null)} variant="contained">
        Continue
      </Button>
    </Stack>;
  } else {
    const conversation : Conversation = G.config.conversationLibrary[G.currentConversation];
    const dialogueNode = conversation.dialogueNodeLibrary[G.currentDialogueNode];
    const choices = Object.keys(dialogueNode.next);
    return <Stack sx={{maxWidth: 480}}>
      {
        choices.map((choice) => (
          <Button key={choice} variant="contained" onClick={() => selectOption(choice)}>
            {choice}
          </Button>
        ))
      }
    </Stack>;
  }
}

export const Board = ({ctx, G, moves} : BoardProps & {
  G: SpaceGameState
}) => {
  return <Box sx={{padding: 2}}>
    <DayPanel ctx={ctx}/>
    <DialoguePanel conversationId={G.currentConversation} dialogueNodeId={G.currentDialogueNode}/>
    <Choices G={G} ctx={ctx} selectOption={moves.selectOption}/>
  </Box>
};