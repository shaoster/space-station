import CloseIcon from "@mui/icons-material/Close";
import { Alert, Box, Button, Card, CardContent, Chip, Divider, Grid, IconButton, Stack, Table, TableBody, TableCell, TableRow, TextField, Typography } from "@mui/material";
import React, { useCallback, useEffect, useState } from "react";
import { Connection, Edge, MarkerType, Node, ReactFlow, ReactFlowProvider, updateEdge, useEdgesState, useNodesState, useOnSelectionChange } from "reactflow";
import 'reactflow/dist/style.css';
import { EXAMPLE_CONVERSATION } from "../glossary/Compendium";
import { Conversation, DialogueEntryId, DialogueNode, DialogueNodeId, DialogueNodeLibrary } from "../glossary/Conversations";
import { BoundCheckbox, LibraryEditor, LibrarySelector } from "./LibraryEditor";
import { DataManager, DataNode, useDataManager, useGameConfiguration } from "./Util";

type DialogueNodeVisualizer = {
  id: DialogueNodeId,
  dialogueEntryId: DialogueEntryId,
  isGameOver: boolean,
  position?: {
    x: number,
    y: number
  }
};

type NextDialogueEdge = {
  parentId: string,
  childId: string,
  label: string,
};

function visualizeNode(id: DialogueNodeId, node: DialogueNode) : DialogueNodeVisualizer {
  return {
    id: id,
    dialogueEntryId: node.dialogueEntryId,
    isGameOver: node.isGameOver ?? false,
    position: node.position,
  }
}

/**
 * This is meant to be a separate function for use in useCallback to force us to be pure.
 * It's easy to "accidentally" mix inputs into this other than nodeLibrary and root, which
 * might lead to infinite re-renders, due to react-flow's oberserver-dependent API.
 */
function getGraphFromData(nodeLibrary: DialogueNodeLibrary, root: DialogueNodeId) {
  const nodeEntries = (Object.entries(nodeLibrary) as [DialogueNodeId, DialogueNode][]);
  let outVisualizers = nodeEntries.map(([id, node]) => visualizeNode(id, node));
  let outEdges: NextDialogueEdge[] = [];
  for (const [parentId, node] of nodeEntries) {
    for (const [label, childId] of Object.entries(node.next)) {
      outEdges.push({parentId, childId, label});
    }
  }
  const nodes = outVisualizers.map((viser, index) => ({
    id: viser.id,
    data: {
      label: (viser.id === root ? "ROOT: " : "") + viser.id 
    },
    style: {
      border: '1px solid #444', padding: 10, background: viser.isGameOver ? "#ff5f5f" : "#efefef",
      borderRadius: "4px"
    },
    // Find some better positioning protocol, or maybe store the positions. IDK.
    position: viser.position ?? { x: 16, y: 16 + (100 * index) }
  }));

  const edges = outEdges.map((edge) => ({
    id: edge.parentId + ":" + edge.childId, // This index probably doesn't matter much(???), so just auto-gen it.
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

  return {
    nodes: Object.fromEntries(
      nodes.map((n) => [n.id, n])
    ),
    edges: Object.fromEntries(
      edges.map((e) => [e.source + ":" + e.target, e])
    ),
  };
}

/**
 * Stupid shorthand for maybe-undefined chained property access.
 */
function $get<T extends undefined | {
  [key: (string | number | symbol)]: any
}>(obj?: T, key?: keyof T){
  return (typeof key === "undefined") ? undefined :
    (typeof obj === "undefined" ? undefined : obj[key]);
}

const DialogueNodeEditor = (
  {id, clearId} :
  {id: DialogueNodeId, clearId: () => void}
) => {
  const {
    gameConfiguration: {
      dialogueEntryLibrary,
      locationLibrary,
    }
  } = useGameConfiguration();
  const {
    data: nodeLibrary,
    updateData: updateNodeLibrary,
  } = useDataManager<DialogueNodeLibrary>();

  const handleDelete = useCallback(() => {
    const {
      [id]: remove,
      ...remaining
    } = nodeLibrary as DialogueNodeLibrary;
    clearId();
    updateNodeLibrary({
      ...remaining
      //...nodeLibrary
    });
  }, [nodeLibrary, updateNodeLibrary, id, clearId]);

  const node = $get(nodeLibrary, id);
  const entry = $get(dialogueEntryLibrary, node?.dialogueEntryId);
  const speaker = entry?.speakerId;
  const text = entry?.textMarkdown;
  return (
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
        <br/>
        <Button onClick={handleDelete} variant="contained">
          Delete
        </Button>
      </DataNode>
    </DataManager>
  );
};

const DialogueEdgeEditorInternal = (
  {targetId} : {targetId: DialogueNodeId}
) => {
  const {
    data: edges,
    updateData: updateEdges
  } = useDataManager<{[key: string] : DialogueNodeId}>();
  const [maybeError, setMaybeError] = useState<string|undefined>(undefined);
  const pretendWeHaveEdges = edges as {[key: string] : DialogueNodeId};
  const previousEdge = Object.entries(pretendWeHaveEdges).find(
    ([_, siblingId]) => siblingId === targetId
  ) as [string, string];
  if (typeof previousEdge === "undefined") {
    return <Typography>Poof! Select another node or edge.</Typography>;
  }
  const [previousLabel] = previousEdge;
  const deleteEdge = () => {
    const {
      [previousLabel] : remove,
      ...strippedEdges
    } = pretendWeHaveEdges;
    updateEdges(strippedEdges);
  };
  const onLabelChange = (newLabel: string) => {
    if (!newLabel) {
      setMaybeError("The choice label cannot be empty! Use '_' instead if you want to force the choice.");
      return;
    }
    if (newLabel in pretendWeHaveEdges) {
      setMaybeError(
        "That choice label [" + newLabel + "] already exists! Maybe you just didn't change anything, in which case " +
        "this is just an indicator that no changes were saved."
      );
      return;
    }
    const {
      [previousLabel as keyof typeof edges]: remove,
      ...remainingEdges
    } = edges;
    updateEdges({
      ...remainingEdges,
      [newLabel]: targetId
    });
  };
  return <Stack spacing={2}>
    <Typography>
      Choice Label (Note: "_" means forced, by convention.)
    </Typography>
    <TextField
      value={previousLabel}
      onChange={(event) => onLabelChange(event.target.value)} 
    />
    { maybeError &&
      <Alert severity="warning" action={
        <IconButton
          aria-label="close"
          color="inherit"
          size="small"
          onClick={() => {
            setMaybeError(undefined);
          }}
        >
          <CloseIcon fontSize="inherit" />
        </IconButton>
      }>
        {maybeError} 
      </Alert>
    }
    <Button onClick={() => onLabelChange("_")} variant="contained">
      Make Forced
    </Button>
    <Button onClick={() => deleteEdge()} variant="contained">
      Delete Choice
    </Button>
  </Stack>;
}

const DialogueEdgeEditor = (
  {sourceId, targetId} : {
    sourceId: DialogueNodeId, targetId: DialogueNodeId
  }
) => {
  return (
    <DataManager>
      <DataNode dataKey={sourceId}>
        <DataManager>
          <DataNode dataKey="next">
            <DialogueEdgeEditorInternal targetId={targetId}/>
          </DataNode>
        </DataManager>
      </DataNode>
    </DataManager>
  );
};

enum SelectionType {
  Edge,
  Node
};

type Selection = {
  type: SelectionType,
  data: DialogueNodeId | [DialogueNodeId, DialogueNodeId]
};


const EXAMPLE_DIALOGUE_NODE : DialogueNode = {
  locationId: "bar",
  dialogueEntryId: "hello",
  next: {},
  isGameOver: false
};

const DialogueNodeCreator = (
  {setSelection} : {setSelection: (selection: Selection) => void}
) => {
  const {
    data: nodeLibrary,
    updateData: updateNodeLibrary
  } = useDataManager<DialogueNodeLibrary>();
  const createNewNode = () => {
    let i = 0;
    // Stupid way to generate a unique node id.
    while (true) {
      let id = i + "";
      if (id in (nodeLibrary as DialogueNodeLibrary)) {
        i++;
        continue;
      }
      updateNodeLibrary({
        ...nodeLibrary,
        [id]: {
          ...EXAMPLE_DIALOGUE_NODE
        }
      });
      setSelection({
        type: SelectionType.Node,
        data: id
      })
      return;
    }
    // (Hopefully unreached...)
  };
  return <Stack>
    <Typography>
      Click a node or edge on the right to edit dialogue, or...
    </Typography>
    <Button variant="contained" onClick={() => createNewNode()}>
      Create new Dialogue Node
    </Button>
  </Stack>;
}


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
  const [selection, setSelection] = useState<Selection | undefined>(undefined);
  const {
    data: nodeLibrary,
    updateData: updateNodeLibrary
  } = useDataManager<DialogueNodeLibrary>();
  // We want to be careful about which aspects of the node inputs come from props
  // and which ones are are internal to the react-flow.
  // The key piece from the latter bucket is the notion of which object is selected
  // and if we don't handle it correctly, we end up getting circular updates.
  const augmentSelectionNode = useCallback((node: Node) => { 
    if (selection?.type === SelectionType.Node) {
      return {
        ...node,
        selected: node.id === (selection.data as DialogueNodeId)
      }
    }
    return node;
  }, [selection]);

  const augmentSelectionEdge = useCallback((edge: Edge) => {
    if (selection?.type === SelectionType.Edge) {
      const [selectParent, selectChild] = selection.data as DialogueNodeId;
      return {
        ...edge,
        selected: edge.source === selectParent && edge.target === selectChild
      };
    }
    return edge;
  }, [selection]);

  useOnSelectionChange({
    onChange: ({ nodes, edges }) => {
      // 3 cases: node selected, edge selected, or nothing selected.
      const maybeSelectedNodeId = nodes.find(n => n.selected)?.id;
      const maybeSelectedEdge = edges.find(n => n.selected);
      if (typeof maybeSelectedNodeId !== "undefined") {
        setSelection({
          type: SelectionType.Node,
          data: maybeSelectedNodeId
        });
      } else if (typeof maybeSelectedEdge !== "undefined") {
        const sourceTarget: [DialogueNodeId, DialogueNodeId] = [maybeSelectedEdge.source, maybeSelectedEdge.target];
        setSelection({
          type: SelectionType.Edge,
          data: sourceTarget
        });
      } else {
        setSelection(undefined);
      }
    }
  });

  const {
    nodes: nodesFromData,
    edges: edgesFromData
  } = getGraphFromData(nodeLibrary as DialogueNodeLibrary, initialDialogueNodeId);

  const [nodes, setNodes, onNodesChange] = useNodesState(
    Object.values(nodesFromData)
  );

  useEffect(() => {
    setNodes((nds) => {
      const newNodes = {
        ...nodesFromData
      };
      // The filter allows for node deletion.
      const existingNodes = nds.filter(n => n.id in nodesFromData).map((node) => {
        // Per https://reactflow.dev/docs/examples/nodes/update-node/
        // it seems like react-flow uses some weird reference equality so we have to
        // actually care whether the objects are new or not.
        const existingNode = nodesFromData[node.id] as Node;
        // TODO: Go over everything that can change.
        node.data = {
          ...node.data,
          label: existingNode.data.label,
        }
        node.style = {
          ...existingNode.style
        };
        delete newNodes[node.id];
        return node;
      })
      return existingNodes.concat(Object.values(newNodes));
    });
  }, [nodesFromData, setNodes, augmentSelectionNode]);

  /**
   *  For now, we just use this to persist positions.
   */
  const onNodeDrop = (_evt: React.MouseEvent, _node: Node, nodes: Node[]) => {
    const newNodeLibrary = {
      ...nodeLibrary
    };
    for (const node of nodes) {
      const dialogueNode = $get(nodeLibrary, node.id) as DialogueNode;
      newNodeLibrary[node.id] = {
        ...dialogueNode,
        position: node.position
      };
    }
    updateNodeLibrary(newNodeLibrary);
  };

  const [edges, setEdges, onEdgesChange] = useEdgesState(
    Object.values(edgesFromData)
  );

  useEffect(() => {
    setEdges((es) => {
      const newEdges = {
        ...edgesFromData
      };
      // The filter allows for edge deletion.
      const existingEdges = es.filter(e => e.id in edgesFromData).map((edge) => {
        // Per https://reactflow.dev/docs/examples/nodes/update-node/
        // it seems like react-flow uses some weird reference equality so we have to
        // actually care whether the objects are new or not.
        const existingEdge = augmentSelectionEdge(edgesFromData[edge.id] as Edge);
        if (existingEdge.label !== edge.label) {
          edge.label = existingEdge.label;
        }
        if (existingEdge.selected !== edge.selected) {
          // edge.selected = existingEdge.selected;
        }
        delete newEdges[edge.id];
        return edge;
      });
      return existingEdges.concat(
        Object.values(newEdges)
      );
    });
  }, [edgesFromData, setEdges, augmentSelectionEdge]);

  const onEdgeUpdate = (oldEdge: Edge<any>, newConnection: Connection) => setEdges((els) => updateEdge(oldEdge, newConnection, els));
  const onConnect = (params: Edge<any> | Connection) => {
    const sourceNode = $get(nodeLibrary, params.source ?? undefined) as DialogueNode;
    const hasDuplicateEdge = typeof (Object.entries(sourceNode.next).find(
      ([_, targetId]) => targetId === params.target
    )) !== "undefined";
    if (hasDuplicateEdge) {
      return;
    }
    let i = 0;
    let choiceLabel;
    while (true) {
      choiceLabel = "Choice " + i;
      if (choiceLabel in sourceNode.next) {
        i++;
        continue;
      }
      break;
    }
    updateNodeLibrary({
      ...nodeLibrary,
      [params.source as string]: {
        ...sourceNode,
        next: {
          ...sourceNode.next,
          [choiceLabel]: params.target as DialogueNodeId
        }
      }
    });
    setSelection({
      type: SelectionType.Edge,
      data: [params.source as string, params.target as string]
    });
  };

  return <Grid container style={{
    width: "100%", height: "800px",
    overflow: "hidden", position: "relative",
    marginTop: "4px"
  }} spacing={1}>
    <Grid item xs={4}>
      <Box sx={{}}>
        {
          // These 3 branches are mutually exclusive, which is critical.
          // Otherwise, we might have multiple writers for the same data objects!
          selection?.type === SelectionType.Node &&
          <DialogueNodeEditor
            id={selection.data as DialogueNodeId}
            clearId={() => setSelection(undefined)}
          />
        }
        {
          selection?.type === SelectionType.Edge &&
          <DialogueEdgeEditor
            sourceId={selection.data[0] as DialogueNodeId}
            targetId={selection.data[1] as DialogueNodeId}
          />
        }
        {
          typeof selection === "undefined" &&
          <DialogueNodeCreator setSelection={setSelection}/>
        }
      </Box>
    </Grid>
    <Grid item xs={8}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onNodeDragStop={onNodeDrop}
        onEdgesChange={onEdgesChange}
        onEdgeUpdate={onEdgeUpdate}
        onConnect={onConnect}
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

const ConversationCard = () => {
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

export default function ConversationEditor() {
  const newConversation = useCallback(() => ({...EXAMPLE_CONVERSATION}), []);
  return <LibraryEditor newEntity={newConversation}>
    <ConversationCard/>
  </LibraryEditor>;
}