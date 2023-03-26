import { Card, CardContent, Chip, Divider, MenuItem, Select, TextField, Tooltip } from "@mui/material";
import { MarkerType, ReactFlow, useEdgesState, useNodesState } from "reactflow";
import { GameConfiguration } from "../glossary/Compendium";
import { Conversation, ConversationId, ConversationLibrary, DialogueEntryId, DialogueNode, DialogueNodeId, DialogueNodeLibrary } from "../glossary/Conversations";
import { EditableField, EntityHandler, LibraryEditorBuilder } from "./LibraryEditor";
import { useGameConfiguration } from "./Profiles";
import 'reactflow/dist/style.css';

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
          <Tooltip placement="right" arrow title={<ConversationCard id={conversationId}/>}>
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

const DialogueNodeArranger = ({conversation} : {conversation : Conversation}) => {
  const {
    nodeVisualizers,
    dialogueEdges
  } = summarizeDialogueLibrary(conversation.dialogueNodeLibrary);
  const initialNodes = nodeVisualizers.map((viser, index) => ({
    id: viser.id,
    data: {
      label: viser.id === conversation.initialDialogueNodeId ? 
        "ROOT: " + viser.dialogueEntryId : viser.dialogueEntryId,
    },
    style: {
      border: '1px solid #444', padding: 10, background: viser.isGameOver ? "#ff5f5f" : "#efefef",
      borderRadius: "4px"
    },
    // Find some better positioning protocol, or maybe store the positions. IDK.
    position: { x: 150, y: 50 + (100 * index) }
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
  return <div style={{
    width: "100%", height: "800px",
    overflow: "hidden", position: "relative",
  }}>
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      style={{ background: "#d0d0d0"}}
      defaultViewport={{
        x: 0, y: 0, zoom: 1.5
      }} 
      attributionPosition="top-right"
    >
    </ReactFlow>
  </div>;
};

const ConversationCard = ({ id, maybeConversation, ...props } : { id: ConversationId, maybeConversation?: Conversation}) => {
  const {
    gameConfiguration : {
      conversationLibrary
    }
  } = useGameConfiguration();
  const conversation = maybeConversation ?? conversationLibrary[id];
  return (
    <Card sx={{width: "100%"}}>
      <CardContent>
        <TextField defaultValue={id} label="Identifier" margin="normal"/>
        <Divider/>
        <EditableField fieldLabel={"locationId"} fieldValue={conversation.locationId}/>
        <EditableField fieldLabel={"characterIds"} fieldValue={conversation.characterIds}/>
        <Divider>
          <Chip label="Dialogue Arranger" />
        </Divider>
        <DialogueNodeArranger conversation={conversation}/>
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
  return <ConversationCard id={id} maybeConversation={conversation}/>;
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