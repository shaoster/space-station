import { Box, Tab, Tabs } from "@mui/material";
import { Link, Route, Routes } from "react-router-dom";
import { GameConfiguration } from "../glossary/Compendium";
import ConversationEditor from "./ConversationEditor";
import SummaryViewer from "./SummaryViewer";
import { DataManager, DataNode, RouteMap, useGameConfiguration, useRelativeRouteMatch } from "./Util";

export default function Studio() {
  const routeMap : RouteMap<GameConfiguration> = {
    "summary": {
      label: "Summary",
      component: SummaryViewer
    },
    "conversations/*": {
      label: "Conversations",
      component: ConversationEditor,
      propertyKey: "conversationLibrary",
      defaultTo: "conversations",
    },
  };
  const currentTab = useRelativeRouteMatch<GameConfiguration>(routeMap);
  const {
    gameConfiguration,
    updateGameConfiguration
  } = useGameConfiguration();
  return <>
    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
      <Tabs value={currentTab}>
        {
          Object.entries(routeMap).map(([route, {label, defaultTo}]) => (
            <Tab key={label} label={label} value={route} to={defaultTo ?? route} component={Link}/>
          ))
        }
      </Tabs>
    </Box>
    <Routes>
      {
        Object.entries(routeMap).map(([route, le]) => {
          if (le.component) {
            const MaybeComponent = le?.component as React.FunctionComponent;
            const dataNodeComponent = <DataManager key={le.label} data={gameConfiguration} updateData={updateGameConfiguration}>
              <DataNode dataKey={le.propertyKey}>
                <MaybeComponent/>
              </DataNode>
            </DataManager>;
            return <Route key={le.label} path={route} element={dataNodeComponent}/>;
          }
          return <></>;
        })
      }
    </Routes>
  </>;
}