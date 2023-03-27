import { Badge, Box, Card, CardContent, Checkbox, Chip, Divider, FormControlLabel, Grid, MenuItem, Select, Table, TableBody, TableCell, TableRow, TextField, Tooltip } from "@mui/material";
import { MarkerType, ReactFlow, ReactFlowProvider, useEdgesState, useNodesState, useOnSelectionChange } from "reactflow";
import { GameConfiguration } from "../glossary/Compendium";
import { Conversation, ConversationId, ConversationLibrary, DialogueEntryId, DialogueNode, DialogueNodeId, DialogueNodeLibrary } from "../glossary/Conversations";
import { LibrarySelector, EntityHandler, LibraryEditorBuilder } from "./LibraryEditor";
import { useGameConfiguration } from "./Profiles";
import 'reactflow/dist/style.css';
import { useState } from "react";

export const ConversationSelector = (
  { currentSelectionId, selectConversation } :
  { currentSelectionId: ConversationId, selectConversation: (conversationId: ConversationId) => void }
) => {
  const {
    gameConfiguration : { conversationLibrary },
  } = useGameConfiguration();

  return (
    <Select onChange={(event) => selectConversation(event.target.value)} value={currentSelectionId} label="Conversation">
      {
        Object.keys(conversationLibrary).map((conversationId) => (
          <Tooltip placement="right" arrow title={<ConversationCard id={conversationId} updateConversationLibrary={function (id: string, conversation: Conversation): void {
            throw new Error("Function not implemented.");
          } }/>}>
            <MenuItem value={conversationId}>
              {conversationId}
            </MenuItem>
          </Tooltip>
        ))
      }
    </Select>
  );
};

// A test example for now.
const EMPTY_CONVERSATION : Conversation = {
  characterIds: ["jane", "baz"],
  initialDialogueNodeId: "0",
  dialogueNodeLibrary: {
    "0": {
      dialogueEntryId: "hello",
      next: {
        _: "1"
      }
    },
    "1": {
      dialogueEntryId: "goodbye",
      isGameOver: true,
      next: {}
    }
  },
  locationId: "bar"
};

const newConversation : () => Conversation = () => ({
  ...EMPTY_CONVERSATION
});

type DialogueNodeVisualizer = {
  id: DialogueNodeId,
  dialogueEntryId: DialogueEntryId,
  isGameOver: boolean,
};

type NextDialogueEdge = {
  parentId: string,
  childId: string,
  label: string,
};

type DialogueLibrarySummary = {
  nodeVisualizers: DialogueNodeVisualizer[],
  dialogueEdges: NextDialogueEdge[],
}

function visualizeNode(id: DialogueNodeId, node: DialogueNode) : DialogueNodeVisualizer {
  return {
    id: id,
    dialogueEntryId: node.dialogueEntryId,
    isGameOver: node.isGameOver ?? false
  }
}

function summarizeDialogueLibrary(nodeLibrary: DialogueNodeLibrary) : DialogueLibrarySummary {
  const nodes = (Object.entries(nodeLibrary) as [DialogueNodeId, DialogueNode][]);
  let outVisualizers = nodes.map(([id, node]) => visualizeNode(id, node));
  let outEdges: NextDialogueEdge[] = [];
  for (const [parentId, node] of nodes) {
    for (const [label, childId] of Object.entries(node.next)) {
      outEdges.push({parentId, childId, label});
    }
  }
  return {
    nodeVisualizers: outVisualizers,
    dialogueEdges: outEdges,
  };
}

/**
 * Stupid shorthand for maybe-undefined chained property access.
 */
function $get<T>(obj: T, key?: keyof T){
  return key === undefined ? undefined: obj[key];
}

/*
const GraphEntityEditor = (
  {nodeId, edgeId, nodeLibrary} : {nodeId?: DialogueNodeId, edgeId?, nodeLibrary: DialogueNodeLibrary}
)
*/

const DialogueNodeEditor = (
  {id, nodeLibrary, updateNode} :
  {id?: DialogueNodeId, nodeLibrary: DialogueNodeLibrary, updateNode: (id: DialogueNodeId, node: DialogueNode) => void}
) => {
  const {
    gameConfiguration: {
      conversationLibrary,
      dialogueEntryLibrary,
      characterLibrary,
      locationLibrary,
    }
  } = useGameConfiguration();
  const node = $get(nodeLibrary, id);
  const entry = $get(dialogueEntryLibrary, node?.dialogueEntryId);
  const speaker = entry?.speakerId;
  const text = entry?.textMarkdown;
  return <Box sx={{minWidth: "400px", paddingRight: "8px"}}>
    {
      id ? (<>
        <LibrarySelector
          fieldLabel="Dialogue Entry"
          fieldLibrary={dialogueEntryLibrary}
          fieldValue={node?.dialogueEntryId}
          />
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>
                Speaker:
              </TableCell>
              <TableCell>
                {speaker ?? "<NARRATOR>"}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                Text:
              </TableCell>
              <TableCell>
                {text}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <LibrarySelector
          fieldLabel="Location"
          fieldLibrary={locationLibrary}
          fieldValue={node?.locationId}
        />
        <FormControlLabel control={<Checkbox checked={node?.isGameOver ?? false}/>} label="Triggers Game Over?"/>
      </>) : "No dialogue node selected."
    }
  </Box>
};

/**
 * It's a little weird, but to add extra functionality as a sibling to the actual react flow,
 * we need https://reactflow.dev/docs/api/react-flow-provider/ in the parent component.
 * 
 * In our case, we will need widgets to create and delete nodes, as well as ways to update
 * the selected node.
 */
const DialogueNodeArranger = (
  {conversation, updateConversation} :
  {conversation : Conversation, updateConversation: (value: Conversation) => void}
) => {
  const [selectedNodeId, setSelectedNodeId] = useState<DialogueNodeId | undefined>(conversation.initialDialogueNodeId);
  useOnSelectionChange({
    onChange: ({ nodes }) => {
      setSelectedNodeId(nodes.find(n => n.selected)?.id);
    }
  });
  const {
    nodeVisualizers,
    dialogueEdges
  } = summarizeDialogueLibrary(conversation.dialogueNodeLibrary);
  const initialNodes = nodeVisualizers.map((viser, index) => ({
    id: viser.id,
    data: {
      label: (viser.id === conversation.initialDialogueNodeId ? 
        "ROOT: " + viser.dialogueEntryId : viser.dialogueEntryId),
    },
    selected: selectedNodeId === viser.id,
    style: {
      border: '1px solid #444', padding: 10, background: viser.isGameOver ? "#ff5f5f" : "#efefef",
      borderRadius: "4px"
    },
    // Find some better positioning protocol, or maybe store the positions. IDK.
    position: { x: 16, y: 16 + (100 * index) }
  }));
  const initialEdges = dialogueEdges.map((edge, index) => ({
    id: index + "", // This index probably doesn't matter much(???), so just auto-gen it.
    source: edge.parentId,
    target: edge.childId,
    animated: true,
    label: edge.label === "_" ? "<FORCED>" : edge.label,
    style: { stroke: '#fff' },
    markerEnd: {
      type: MarkerType.Arrow
    },
    type: "smoothstep"
  }));
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [nodes, _setCurrentNodes, onNodesChange] = useNodesState(initialNodes);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [edges, _setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const updateDialogueNode = (nodeId: DialogueNodeId, nodeValue: DialogueNode) => {
    updateConversation({
      ...conversation,
      dialogueNodeLibrary: {
        ...conversation.dialogueNodeLibrary,
        [nodeId]: nodeValue
      }
    });
  };
  return <Grid container style={{
    width: "100%", height: "800px",
    overflow: "hidden", position: "relative",
    padding: "0px", marginTop: "4px"
  }}>
    <Grid item xs={4}>
      <DialogueNodeEditor
        id={selectedNodeId}
        nodeLibrary={conversation.dialogueNodeLibrary}
        updateNode={updateDialogueNode}
      />
    </Grid>
    <Grid item xs={8}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        style={{ background: "#d0d0d0"}}
        defaultViewport={{
          x: 0, y: 0, zoom: 1.0
        }} 
        attributionPosition="top-right"
      >
      </ReactFlow>
    </Grid>
  </Grid>;
};

const ConversationCard = (
  { id, maybeConversation, updateConversationLibrary } :
  { id: ConversationId, maybeConversation?: Conversation, updateConversationLibrary: (id: ConversationId, conversation: Conversation) => void }
) => {
  const {
    gameConfiguration : {
      conversationLibrary,
      characterLibrary,
      locationLibrary,
    }
  } = useGameConfiguration();
  const conversation = maybeConversation ?? conversationLibrary[id];
  const updateConversation = (conversation: Conversation) => {
    updateConversationLibrary(id, conversation);
  };
  return (
    <Card sx={{width: "100%"}}>
      <CardContent>
        <TextField defaultValue={id} label="Identifier" margin="normal"/>
        <Divider/>
        <LibrarySelector
          fieldLabel={"Main Location"} 
          fieldLibrary={locationLibrary}
          fieldValue={conversation.locationId}
        />
        <LibrarySelector
          fieldLabel={"Characters Present"}
          fieldLibrary={characterLibrary}
          fieldValue={conversation.characterIds}
          multiple
        />
        <Divider>
          <Chip label="Dialogue Arranger" />
        </Divider>
        <ReactFlowProvider>
          <DialogueNodeArranger
            conversation={conversation}
            updateConversation={updateConversation}
        />
        </ReactFlowProvider>
      </CardContent>
    </Card>
  );
};

const renderConversation = (
  config: GameConfiguration,
  libraryUpdater: (lib: ConversationLibrary) => void,
  maybeId?: ConversationId,
  maybeValue?: Conversation
) => {
  const id = maybeId ?? "new_conversation";
  const conversation = maybeValue ?? newConversation();
  return <ConversationCard id={id} maybeConversation={conversation} updateConversationLibrary={function (id: string, conversation: Conversation): void {
    throw new Error("Function not implemented.");
  } }/>;
}

const conversationHandler : EntityHandler<ConversationId, Conversation, ConversationLibrary> = {
  libraryFieldSelector: "conversationLibrary",
  renderEntity: renderConversation,
  validateDataDependencies: (configuration, _, entity) => {
    for (const characterId of entity.characterIds) {
      if (!(characterId in configuration.characterLibrary)) {
        return false;
      }
    }
    for (const dialogueNode of Object.values(entity.dialogueNodeLibrary)) {
      for (const nextDialogueId of Object.values(dialogueNode.next)) {
        if (!(nextDialogueId in entity.dialogueNodeLibrary)) {
          return false;
        }
      }
    }
    return entity.initialDialogueNodeId in entity.dialogueNodeLibrary;
  },
};

export default function ConversationBuilder() {
  const ConversationEditor = LibraryEditorBuilder.fromEntityHandler(conversationHandler);
  return <ConversationEditor/>;
}