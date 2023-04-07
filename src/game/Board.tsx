import { Badge, Box, Button, Grid, List, ListItem, Paper, Stack } from "@mui/material";
import MarkdownEditor from "@uiw/react-markdown-editor";
import { Ctx } from "boardgame.io";
import { BoardProps } from "boardgame.io/dist/types/packages/react";
import { useGameConfiguration } from "../editor/Util";
import { Conversation, ConversationId, DialogueNodeId } from "../glossary/Conversations";
import { getDayAndStageFromTurn } from "../glossary/Events";
import { ItemId } from "../glossary/Items";
import { FungibleResource } from "../glossary/Resources";
import { SpaceGameState } from "./SpaceGame";

export const Fungibles = (
  {fungibles} : {fungibles: { [key in FungibleResource]? : number}}
) => {
  const values = Object.values(FungibleResource).slice(Object.values(FungibleResource).length / 2) as FungibleResource[];
  return (
    <Grid container sx={{border: 1, maxWidth: 480}} key="fung-cont">
    {
      values.map((f: FungibleResource) => 
        <Grid item xs={12} key={f}>
          {FungibleResource[f]}:{fungibles[f] ?? 0}
        </Grid>
      )
    }
    </Grid>
  );
};

export const Inventory = (
  {items} : {items: { [key: ItemId] : number }}
) => {
  const {
    gameConfiguration: {
      itemLibrary,
      imageLibrary
    }
  } = useGameConfiguration();
  return (
    <Grid container>
      <Grid item xs={12} sx={{marginBottom: 2}} key="label">
        Inventory
      </Grid>
      <Grid container sx={{border: 1, maxWidth: 480}} key="inv-cont">
      {
        Object.entries(items).map(([i, q]) => (
          <Grid item xs={3} key={i}>
            <Paper variant="outlined" square sx={{padding: 1}}>
              <p>
                {itemLibrary[i].name}
              </p>
              <Badge badgeContent={q} color="primary">
                <img
                  src={imageLibrary[i].url} 
                  alt={imageLibrary[i].alt}
                  width={48} height={48}
                />
              </Badge>
            </Paper>
          </Grid>
        ))
      }
      </Grid>
    </Grid>
  );
}

export const DayResourcePanel = (
  {ctx, G} : {ctx: Ctx, G: SpaceGameState}
) => {
  const [day, stage] = getDayAndStageFromTurn(ctx.turn);
  const {
    resources
  } = G;
  return <Grid container>
    <Grid item xs={12}>
      Turn: {ctx.turn}
    </Grid>
    <Grid item xs={1}>
      Day: {day}
    </Grid>
    <Grid item xs={1}>
      Time: {stage}
    </Grid>
    <Grid item xs={10}>
      <Fungibles fungibles={resources.fungibles ?? {}}/>
    </Grid>
    <Grid item xs={2}>
      <Paper sx={{margin: 1, padding: 2}}>
        The mapping of a day-stage time coordinate to a turn is as follows:
        <ul>
          <li>Turn 1 corresponds to Day 1, Morning.</li>
          <li>As the turn goes up by one, the stage will advance within the same day.</li>
          <li>After 1.Midnight, the next turn rolls over to 2.Morning.</li>
          <li>We might re-work this if there's meaningful gameplay differences between the times of day.</li>
        </ul>
      </Paper>
    </Grid>
    <Grid item xs={10}>
      <Inventory items={resources.items ?? {}}/>
    </Grid>
  </Grid>
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
  return <Grid container>
    <Grid item xs={12}>
      You are at [{locationId}]
    </Grid>
    <Grid item xs={12}>
      <p>The following characters are present:</p>
      <List>
        {
          characterIds.map((c) => (
            <ListItem key={c}>
              [{c}]
            </ListItem>
          ))
        }
      </List>
    </Grid>
    <Grid item xs={1}>
      [{dialogueEntry.speakerId ?? "Narrator"}] says:
    </Grid>
    <Grid item xs={11}>
      <MarkdownEditor.Markdown
        source={dialogueEntry.textMarkdown}
        style={{maxWidth: 480, padding: 4}}
      />
    </Grid>
    <Grid item xs={12}>
      <p>This {isGameOver ? "is" : "isn't"} game over.</p>
      <p>(For now actual gameover isn't implemented.)</p>
    </Grid>
  </Grid>;
}

export const Choices = (
  {G, ctx, selectOption} :
  {G: SpaceGameState, ctx: Ctx, selectOption: (choice: string | null) => void}
) => {
  const continueButton = <Stack sx={{maxWidth: 480}}>
    <Button onClick={() => selectOption(null)} variant="contained">
      Continue
    </Button>
  </Stack>;
  if (typeof G.currentConversation === "undefined" ||
      typeof G.currentDialogueNode === "undefined"
  ) {
    return continueButton;
  } else {
    const conversation : Conversation = G.config.conversationLibrary[G.currentConversation];
    const dialogueNode = conversation.dialogueNodeLibrary[G.currentDialogueNode];
    const choices = Object.keys(dialogueNode.next);
    if (choices.length === 0) {
      return continueButton;
    }
    return <Stack sx={{maxWidth: 480}} spacing={1}>
      {
        choices.map((choice) => (
          <Button key={choice} variant="contained" onClick={() => selectOption(choice)}>
            {choice !== "_" ? choice : "<In the real game, this choice would be forced and others would be greyed out.>"}
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
    <DayResourcePanel ctx={ctx} G={G}/>
    <DialoguePanel conversationId={G.currentConversation} dialogueNodeId={G.currentDialogueNode}/>
    <Choices G={G} ctx={ctx} selectOption={moves.selectOption}/>
  </Box>
};