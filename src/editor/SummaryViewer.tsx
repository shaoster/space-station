import { Box, Button, Card, CardContent, Link } from "@mui/material";
import jp, { PathComponent } from 'jsonpath';
import { useEffect, useState } from "react";
import { useHref } from "react-router-dom";
import ReactFlow, { Node, ReactFlowProvider, useEdgesState, useNodesState } from "reactflow";
import 'reactflow/dist/style.css';
import { GameConfiguration } from "../glossary/Compendium";
import { PermitsType, getInitialPermits, useGameConfiguration } from "./Util";

function findNearestParent(npMap: Set<string>, path: PathComponent[]): PathComponent[] {
  if (npMap.has(JSON.stringify(path))) {
    return path;
  }
  const parent = path.slice(0, -1);
  if (parent.length === 0) {
    return [];
  }
  return findNearestParent(npMap, parent);
}

function getEdgesFromGameConfig(gameConfig: GameConfiguration) {
  const rawEdges = getInitialPermits(gameConfig);
  let extractedSourceTargets : [string, string][] = [];
  for (const [target, sources] of Object.entries(rawEdges)) {
    for (const source in sources) {
      // Maybe this will be duplicated? I guess that's fine for now.
      extractedSourceTargets.push([source, target]);
    }
  }
  return extractedSourceTargets.map(([s, t])=> ({
    id: `${s}:${t}`,
    source: s,
    target: t,
    type: 'smoothstep',
    animated: true,
  }));
}

const ROOT_LABEL_HEIGHT = 20;
const MARGIN = 8;
const ROW_HEIGHT = 40;
const COL_WIDTH = 200;
const Y_THRESHOLD = 800;

function autoLayoutNodes(nodes: Node[]): Node[] {
  let nodesByParentNode : {[key: string]: Node[]} = {};
  nodes.forEach(n => {
    if ("parentNode" in n) {
      const parentNode = n.parentNode as string;
      if (!(parentNode in nodesByParentNode)) {
        nodesByParentNode[parentNode] = [];
      }
      nodesByParentNode[parentNode].push(n);
    } else {
      const parentNode = "";
      if (!(parentNode in nodesByParentNode)) {
        nodesByParentNode[parentNode] = [];
      }
      nodesByParentNode[parentNode].push(n);
    }
  });
  const outNodes = [];
  // First deal with root nodes.
  let xOffset = MARGIN;
  let yOffset = MARGIN;
  for (const node of nodesByParentNode[""]) {
    const rows = (node.id in nodesByParentNode ? nodesByParentNode[node.id].length : 0)
    const height = (rows * ROW_HEIGHT) + ROOT_LABEL_HEIGHT + (2 * MARGIN);
    if (yOffset + height > Y_THRESHOLD) {
      yOffset = MARGIN;
      xOffset += COL_WIDTH + MARGIN;
    }
    outNodes.push({
      ...node,
      style: {
        width: COL_WIDTH,
        height
      },
      position: {
        x: xOffset,
        y: yOffset,
      }
    });
    yOffset += MARGIN + height;
  }

  // Then deal with non-parents.
  for (const [pn, nodes] of Object.entries(nodesByParentNode)) {
    if (pn === "") {
      continue;
    }
    let yOffset = ROOT_LABEL_HEIGHT + MARGIN;
    let xOffset = MARGIN;
    for (const [i, node] of nodes.entries()) {
      outNodes.push({
        ...node,
        position: {
          x: xOffset,
          y: yOffset
        },
        style: {
          height: ROW_HEIGHT,
          width: COL_WIDTH - (2* MARGIN),
          overflow: "scroll",
        }
      })
      yOffset += ROW_HEIGHT;
    }
  }

  return outNodes;
} 

function getNodesFromGameConfig(
  gameConfig: GameConfiguration,
  groupPaths: string[],
  dependencies: PermitsType
) {
  const gpMap = new Set(groupPaths);
  const sources = new Set(Object.values(dependencies).map(Object.keys).flat());
  console.log("sources", sources);
  const targets = new Set(Object.keys(dependencies));
  const allPaths = jp.paths(gameConfig, "$..*").filter(pcs => {
    const p = JSON.stringify(pcs);
    return gpMap.has(p) || sources.has(p) || targets.has(p)
  });
  const maybeNodes = allPaths.map((pcs, index) => {
    const nodeBase = {
      id: JSON.stringify(pcs),
    };
    const maybeParent = findNearestParent(gpMap, pcs);
    if (maybeParent.length === 0) {
      return undefined;
    } else if (JSON.stringify(maybeParent) === nodeBase.id) {
      return {
        ...nodeBase,
        data: {
          label: jp.stringify(pcs).slice(2),
        },
        position: {
          x: 0, y: 0,
        },
      };
    } else {
      return {
        ...nodeBase,
        data: {
          label: jp.stringify(pcs.slice(maybeParent.length)).slice(2)
        },
        parentNode: JSON.stringify(maybeParent),
        position: {
          x: 0, y: 0,
        },
      };
    }
  });
  return maybeNodes.filter(n => typeof n !== "undefined") as Node[];
}

function getGroupPathsFromGameConfig(gameConfig: GameConfiguration) : string[] {
  const libraryKeys = [
    "characterLibrary",
    "conversationLibrary",
    "dialogueEntryLibrary",
    "imageLibrary",
    "itemLibrary",
    "locationLibrary",
    "raceLibrary",
    //"initialEventSchedule",
    //"initialResources"
  ];
  return libraryKeys.map(lk => jp.paths(gameConfig, `$.${lk}.*`).map(
    (v) => JSON.stringify(v)
  )).flat();
}

function DependencyVisualizer() {
  const {
    gameConfiguration
  } = useGameConfiguration();
  const groupPaths = getGroupPathsFromGameConfig(gameConfiguration);
  console.log("gps", groupPaths);
  const deps = getInitialPermits(gameConfiguration);
  const initialNodes = autoLayoutNodes(
    getNodesFromGameConfig(
      gameConfiguration,
      groupPaths,
      deps
    )
  );
  const initialEdges = getEdgesFromGameConfig(gameConfiguration);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  console.log("nodes", nodes);
  console.log("edges", edges);
  return <Box sx={{width: 1440, height: Y_THRESHOLD, marginTop: 2}}>
    <ReactFlowProvider>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onConnect={()=>{}}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        style={{ background: "#d0d0d0"}}
        nodesConnectable={false}
        defaultViewport={{
          x: 0, y: 0, zoom: 1.0
        }} 
        attributionPosition="top-right"
      />
    </ReactFlowProvider>
  </Box>;
}

const PR_PREFIX = "https://github.com/shaoster/space-station/new/main/src/configurations";
export default function SummaryViewer() {
  const {
    gameConfiguration,
    currentProfile
  } = useGameConfiguration();
  const [lastUpdated, touch] = useState(new Date().getTime());
  useEffect(() => {
    touch(new Date().getTime());
  }, [gameConfiguration]);
  const fileName = lastUpdated + ".json";
  const urlEncodedGameConfig = encodeURIComponent(JSON.stringify(gameConfiguration, null, 2));
  return <Card>
    <CardContent>
      <a href={PR_PREFIX + "?filename=configurations/" + fileName + "&value=" + urlEncodedGameConfig}
        target="_blank"
        rel="noreferrer"
      >
        <Button variant="contained">
          Post PR to Github
        </Button>
      </a>
      &nbsp;
      <Link href={useHref(`/${currentProfile}/play`)}
        target="_blank"
        rel="noreferrer"
      >
        <Button variant="contained">
          Play Configuration
        </Button>
      </Link>
      <DependencyVisualizer/>
      <pre>
        {
        JSON.stringify(gameConfiguration, null, 2)
        }
      </pre>
    </CardContent>
  </Card>;
};