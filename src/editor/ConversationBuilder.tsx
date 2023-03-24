import { Card, CardContent, List, ListItem, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { Conversation, ConversationId, ConversationLibrary } from "../glossary/Conversations";
import { EntityHandler, LibraryBuilder } from "./LibraryBuilder";

const renderConversation = (id: ConversationId, value: Conversation) => (
  <Card>
    <CardContent>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>
              {id}
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell>
              Characters
            </TableCell>
            <TableCell>
              <List>
                {
                value.charactersPresent.map((characterId) => 
                  <ListItem key={characterId}>
                    {characterId}
                  </ListItem>
                )
                }
              </List>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>
              Location
            </TableCell>
            <TableCell>
              {value.location}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>
              Initial Dialogue
            </TableCell>
            <TableCell>
              {value.initialDialogueNode.dialogEntryId}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </CardContent>
  </Card>
);

const EMPTY_CONVERSATION : Conversation = {
  charactersPresent: ["jane", "baz"],
  initialDialogueNode: {
    dialogEntryId: "hello" // TODO: Fix the data dependency!!!!
  },
  location: "bar" // TODO: Fix the data dependency!!!!
};

const newConversation : () => Conversation = () => ({
  ...EMPTY_CONVERSATION
});

const conversationHandler : EntityHandler<ConversationId, Conversation, ConversationLibrary> = {
  selectLibrary: (configuration) => configuration.conversationLibrary,
  renderEntity: (configuration, entityId, entityValue) => renderConversation(entityId, entityValue),
  createEntity: (library, entityId) => {library[entityId] = newConversation()},
  updateEntity: (library, entityId, entityValue) => {library[entityId] = entityValue},
};

export default function ConversationBuilder() {
  return <LibraryBuilder handler={conversationHandler}/>;
}