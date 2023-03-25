import { Card, CardContent, Divider, MenuItem, Select, TextField, Tooltip } from "@mui/material";
import { MarkerType, ReactFlow, useEdgesState, useNodesState } from "reactflow";
import { GameConfiguration } from "../glossary/Compendium";
import { Conversation, ConversationId, ConversationLibrary, DialogueEntryId, DialogueNode } from "../glossary/Conversations";
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
  initialDialogueNode: {
    dialogueEntryId: "hello",
    next: {
      _: {
        dialogueEntryId: "goodbye",
        isGameOver: true,
        next: {}
      }
    }
  },
  locationId: "bar"
};

const newConversation : () => Conversation = () => ({
  ...EMPTY_CONVERSATION
});

type DialogueNodeVisualizer = {
  dialogueEntryId: DialogueEntryId,
  isGameOver: boolean,
};

type NextDialogueEdge = {
  parentIndex: number,
  childIndex: number,
};

type DialogueTreeSummary = {
  nodeVisualizers: DialogueNodeVisualizer[],
  dialogueEdges: NextDialogueEdge[],
}

function visualizeNode(node: DialogueNode) : DialogueNodeVisualizer {
  return {
    dialogueEntryId: node.dialogueEntryId,
    isGameOver: node.isGameOver ?? false
  }
}

function summarizeTree(node: DialogueNode) : DialogueTreeSummary {
  // First do a breadth-first traversal.
  // If we end up doing 1000s of nodes of dialogues in a given tree, we probably need to use something
  // better than an array, but w/e.
  let queue = [node];
  let outVisualizers = [];
  let outEdges: NextDialogueEdge[] = [];
  let indexer = 0;
  while (queue.length > 0) {
    // Bogus typecast, but it's protected at runtime with the queue length check above.
    let nextNode : DialogueNode = queue.shift() as DialogueNode;
    // We don't really have to worry about cycle detection, because a DialogueNode is an
    // explicit tree. It's only in the reverse direction that we have to be careful.
    outVisualizers.push(visualizeNode(nextNode));
    let parentIndex = indexer;
    for (const childNode of Object.values(nextNode.next)) {
      queue.push(childNode);
      outEdges.push(
        {
          parentIndex,
          childIndex: ++indexer
        }
      )
    }
  }
  return {
    nodeVisualizers: outVisualizers,
    dialogueEdges: outEdges,
  };
}

const DialogueNodeArranger = ({value, label} : {value : DialogueNode, label?: string}) => {
  const {
    nodeVisualizers,
    dialogueEdges
  } = summarizeTree(value);
  const initialNodes = nodeVisualizers.map((viser, index) => ({
    id: "" + index,
    data: {
      label: index === 0 ? "ROOT: " + viser.dialogueEntryId : viser.dialogueEntryId,
    },
    style: {
      border: '1px solid #444', padding: 10, background: viser.isGameOver ? "#ff5f5f" : "#efefef",
      borderRadius: "4px"
    },
    // Find some positioning protocol.
    position: { x: 150, y: 50 + (100 * index) }
  }));
  const initialEdges = dialogueEdges.map((edge, index) => ({
    id: "" + index,
    source: "" + edge.parentIndex,
    target: "" + edge.childIndex,
    animated: true,
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
        <TextField value={id} label="Identifier" margin="normal"/>
        <Divider/>
        <EditableField fieldLabel={"locationId"} fieldValue={conversation.locationId}/>
        <EditableField fieldLabel={"characterIds"} fieldValue={conversation.characterIds}/>
        <DialogueNodeArranger value={conversation.initialDialogueNode} label="Dialogue Tree"/>
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
};

export default function ConversationBuilder() {
  const ConversationEditor = LibraryEditorBuilder.fromEntityHandler(conversationHandler);
  return <ConversationEditor/>;
}