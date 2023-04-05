import CloseIcon from '@mui/icons-material/Close';
import { Alert, Box, IconButton, Modal, Tab, Tabs } from "@mui/material";
import { useEffect, useState } from "react";
import { ErrorBoundary, } from "react-error-boundary";
import { Link, Route, Routes } from "react-router-dom";
import { GameConfiguration } from "../glossary/Compendium";
import ConversationEditor from "./ConversationEditor";
import SummaryViewer from "./SummaryViewer";
import { DataManager, DataNode, RouteMap, useGameConfiguration, useRelativeRouteMatch } from "./Util";
import CharacterEditor from './CharacterEditor';
import ImageEditor from './ImageEditor';
import ItemEditor from './ItemEditor';
import RaceEditor from './RaceEditor';
import DialogueEditor from './DialogueEditor';

function ResetError(
  {resetErrorBoundary}:
  {resetErrorBoundary: () => void}
) {
  resetErrorBoundary();
  return <></>;
}

function ErrorLogger(
  {error} : 
  {error: Error | undefined}
): JSX.Element {
  const [errorMsg, setErrorMsg] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (typeof error !== "undefined") {
      setErrorMsg(error?.message)
    }
  }, [error, setErrorMsg]);
  const handleClose = () => {
    setErrorMsg(undefined);
  };
  return <Modal
    open={typeof errorMsg !== "undefined"}
    onClose={handleClose}
  >
    <Alert severity="error" action={
      <IconButton onClick={handleClose}>
        <CloseIcon />
      </IconButton>
    }>
      {errorMsg}
    </Alert>
  </Modal>;
}

export default function Studio() {
  const routeMap : RouteMap<GameConfiguration> = {
    "*": {
      label: "Summary",
      component: SummaryViewer,
      defaultTo: "summary"
    },
    "characters/*": {
      label: "Characters",
      component: CharacterEditor,
      propertyKey: "characterLibrary",
      defaultTo: "characters",
    },
    "dialogue/*": {
      label: "Copy/Dialogue",
      component: DialogueEditor,
      propertyKey: "dialogueEntryLibrary",
      defaultTo: "dialogue"
    },
    "conversations/*": {
      label: "Conversations",
      component: ConversationEditor,
      propertyKey: "conversationLibrary",
      defaultTo: "conversations",
    },
    "images/*": {
      label: "Images",
      component: ImageEditor,
      propertyKey: "imageLibrary",
      defaultTo: "images",
    },
    "items/*": {
      label: "Items",
      component: ItemEditor,
      propertyKey: "itemLibrary",
      defaultTo: "items",
    },
    "races/*": {
      label: "Races",
      component: RaceEditor,
      propertyKey: "raceLibrary",
      defaultTo: "races",
    }
  };
  const currentTab = useRelativeRouteMatch<GameConfiguration>(routeMap) ?? null;
  const {
    gameConfiguration,
    updateGameConfiguration
  } = useGameConfiguration();
  const [error, logError] = useState<Error | undefined>(undefined);
 
  return <ErrorBoundary FallbackComponent={ResetError} onError={logError}>
    <ErrorLogger error={error}/>
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
  </ErrorBoundary>;
}