import { Box, Card, CardContent, Checkbox, Chip, Divider, FormControlLabel, Grid, Table, TableBody, TableCell, TableRow } from "@mui/material";
import { useEffect, useState } from "react";
import { MarkerType, ReactFlow, ReactFlowProvider, useEdgesState, useNodesState, useOnSelectionChange } from "reactflow";
import 'reactflow/dist/style.css';
import { GameConfiguration } from "../glossary/Compendium";
import { Conversation, ConversationLibrary, DialogueEntryId, DialogueNode, DialogueNodeId, DialogueNodeLibrary } from "../glossary/Conversations";
import { LibrarySelector } from "./LibraryEditor";
import { DataManager, DataNode, useDataManager, useGameConfiguration } from "./Util";

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
function $get<T>(obj?: T, key?: keyof T){
  return (typeof key === "undefined") ? undefined :
    (typeof obj === "undefined" ? undefined : obj[key]);
}

const BoundCheckbox = (
  {label}  : {label?: string}
) => {
  const {
    data: checked,
    updateData: updateChecked
  } = useDataManager<boolean>();
  return (
    <FormControlLabel
      control={<Checkbox checked={checked}/>}
      label={label}
      onChange={(_evt, val) => updateChecked(val)}
    />
  );
}

const DialogueNodeEditor = (
  {id} : {id?: DialogueNodeId}
) => {
  const {
    gameConfiguration: {
      dialogueEntryLibrary,
      locationLibrary,
    }
  } = useGameConfiguration();
  const {
    data: nodeLibrary,
  } = useDataManager<DialogueNodeLibrary>();
  const node = $get(nodeLibrary, id);
  const entry = $get(dialogueEntryLibrary, node?.dialogueEntryId);
  const speaker = entry?.speakerId;
  const text = entry?.textMarkdown;
  return <Box sx={{minWidth: "400px", paddingRight: "8px"}}>
    {
      id ? (
      <DataManager>
        <DataNode key={id} dataKey={id}>
          <DataManager>
            <DataNode key="dialogueEntryId" dataKey="dialogueEntryId">
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
            </DataNode>
            <DataNode key="locationId" dataKey="locationId">
              <LibrarySelector
                fieldLabel="Location"
                fieldLibrary={locationLibrary}
                fieldValue={node?.locationId}
              />
            </DataNode>
            <DataNode key="isGameOver" dataKey="isGameOver">
              <BoundCheckbox label="Triggers Game Over?"/>
            </DataNode>
          </DataManager>
        </DataNode>
      </DataManager>
      ) : "No dialogue node selected."
    }
  </Box>
};

/**
 * It's a little weird, but to add extra functionality as a sibling to the actual react flow,
 * we need https://reactflow.dev/docs/api/react-flow-provider/ in the parent component.
 * 
 * In our case, we will need widgets to create and delete nodes, as well as ways to update
 * the selected node.
 * 
 */
const DialogueNodeArranger = (
  {initialDialogueNodeId} : {initialDialogueNodeId : DialogueNodeId}
) => {
  const [selectedNodeId, setSelectedNodeId] = useState<DialogueNodeId | undefined>(initialDialogueNodeId);
  const {
    data: nodeLibrary
  } = useDataManager<DialogueNodeLibrary>();
  useOnSelectionChange({
    onChange: ({ nodes }) => {
      setSelectedNodeId(nodes.find(n => n.selected)?.id);
    }
  });
  const {
    nodeVisualizers,
    dialogueEdges
  } = summarizeDialogueLibrary(nodeLibrary as DialogueNodeLibrary);
  const initialNodes = nodeVisualizers.map((viser, index) => ({
    id: viser.id,
    data: {
      label: (viser.id === initialDialogueNodeId ? 
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
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [edges, _setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes((currentNodes) => 
      currentNodes.map((node) => {
        // TODO: convert to map so this is constant instead of linear.
        const newNode = initialNodes.find(v => v.id === node.id);
        node.data = {
          ...node.data,
          ...newNode?.data
        };
        node.style = {
          ...node.data,
          ...newNode?.style
        };
        return node;
      })
    );
  }, [initialNodes, setNodes])

  return <Grid container style={{
    width: "100%", height: "800px",
    overflow: "hidden", position: "relative",
    padding: "0px", marginTop: "4px"
  }}>
    <Grid item xs={4}>
      <DialogueNodeEditor id={selectedNodeId}/>
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

const ConversationEditor = () => {
  const {
    gameConfiguration : {
      characterLibrary,
      locationLibrary,
    }
  } = useGameConfiguration();
  const {
    data: conversation
  } = useDataManager<Conversation>();
  return (
    <Card sx={{width: "100%"}}>
      <CardContent>
        <ReactFlowProvider>
          <DataManager>
            <DataNode key="locationId" dataKey="locationId">
              <Divider/>
              <LibrarySelector
                key="location"
                fieldLabel={"Main Location"} 
                fieldLibrary={locationLibrary}
              />
            </DataNode>
            <DataNode key="characterIds" dataKey="characterIds">
              <LibrarySelector
                key="characters"
                fieldLabel={"Characters Present"}
                fieldLibrary={characterLibrary}
                multiple
              />
            </DataNode>
            <DataNode key="initialDialogueNodeId" dataKey="initialDialogueNodeId">
              <LibrarySelector
                key="root"
                fieldLabel={"Initial Dialogue"}
                fieldLibrary={conversation?.dialogueNodeLibrary as DialogueNodeLibrary}
              />
            </DataNode>
            <DataNode key="dialogueNodeLibrary" dataKey="dialogueNodeLibrary">
              <Divider>
                <Chip label="Dialogue Arranger" />
              </Divider>
              <DialogueNodeArranger
                initialDialogueNodeId={conversation?.initialDialogueNodeId as DialogueNodeId}
              />
            </DataNode>
          </DataManager>
        </ReactFlowProvider>
      </CardContent>
    </Card>
  );
};

const validateDataDependencies = (
  configuration: GameConfiguration,
  entity: Conversation
) => {
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
};

export default function ConversationBuilder() {
  const {
    data: conversationLibrary,
  } = useDataManager<ConversationLibrary>();
  const conversationIds = Object.keys(conversationLibrary as ConversationLibrary);
  // TODO: Use routing for this part.
  const [conversationId, setConversationId] = useState(conversationIds.find(()=>true));
  return <DataManager>
    <DataNode dataKey={conversationId}>
      <ConversationEditor/>
    </DataNode>
  </DataManager>;
}