// https://github.com/shaoster/space-station/new/main/game-configurations

import DeleteIcon from '@mui/icons-material/Delete';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Grid } from "@mui/material";
import { ReactNode } from "react";
import { HashRouter, Link, Route, Routes, useParams } from "react-router-dom";
import { GameConfiguration } from "../glossary/Compendium";
import { GameConfigurationProvider } from "./Util";
import React from 'react';

const context = require.context("../configurations", true, /.json$/);
export const STATIC_PROFILES: {[key: string]: GameConfiguration} = {};
context.keys().forEach((key: any) => {
  const fileName = key.replace('./', '');
  const resource = require(`../configurations/${fileName}`);
  const namespace: string = fileName.replace('.json', '');
  STATIC_PROFILES[namespace] = JSON.parse(JSON.stringify(resource)) as GameConfiguration;
});

export const ProfileNameProvider = ({children} : {children: ReactNode}) => {
  const { profileName } = useParams();
  if (!profileName) {
    throw new Error("A profile name must be specified.");
  }
  return <GameConfigurationProvider profileName={profileName}>
    {children}
  </GameConfigurationProvider>;
};

const EXPLANATION = 
`The profiles listed here represent those statically tracked via source control.

To create a new profile, click "Load to Edit" and then [POST PR TO GITHUB] in the summary panel.

After the PR is merged and the new code deployed, a new profile should show up here.

If you just want to edit stuff locally, just pick whichever profile you want and start editing.

In that case, any changes are stored in your browser's local storage and will persist through page refreshes.

However, if you want to share your game configuration with others, you should post a PR.
`;

const ProfileReverter = (
  {profile} :
  {profile: string}
) => {
  const [open, setOpen] = React.useState(false);
  const handleClose = () => {
    setOpen(false);
  };
  const handleConfirm = () => {
    localStorage.removeItem(profile);
    handleClose();
  }
  return (<>
    <Button onClick={()=>setOpen(true)} startIcon={<DeleteIcon />} variant="contained">
      Revert Local Changes
    </Button>
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">
        Are you really sure you want to revert?
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          This removes any local edits you have made to this game configuration.
          This deletion is permanent, and Phil cannot help you recover your data.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} variant="contained" autoFocus>Never Mind</Button>
        <Button onClick={handleConfirm} variant="contained">
          I'm sure
        </Button>
      </DialogActions>
    </Dialog>
  </>);
}

const ProfilePicker = () => {
  const profiles = Object.keys(STATIC_PROFILES);
  return <Box sx={{padding: 2}}>
    <pre>
      {EXPLANATION}
    </pre>
    <Grid container sx={{padding: 2}} key={"profiles"}>
      {
        profiles.map((p) => <Grid item key={p + "_row"} xs={12}>
          <Grid container sx={{padding: 1, border: 1}}>
            <Grid item xs={1} key={p + "_name"}>
              {p}
            </Grid>
            <Grid item xs={1} key={p + "_play"}>
              <Link to={`/${p}/play`}>Play</Link>
            </Grid>
            <Grid item xs={1} key={p + "_edit"}>
              <Link to={`/${p}/edit`}>Load to Edit</Link>
            </Grid>
            <Grid item xs={2} key={p + "_revert"}>
              <ProfileReverter profile={p}/>
            </Grid>
            <Grid item xs={7} key={p + "_gutter"}/>
          </Grid>
        </Grid>)
      }
    </Grid>
  </Box>;
}

export const SaveProfileProvider = ({children} : {children: ReactNode}) => {
  // We have to rewrite the component graph a bit because the useParams hook below has to live within the router here.
  // I guess people don't run into this often because we're building a decorator component here that has to flip the
  // chain inside out to propagate down the children.
  const rebasedChildren = <ProfileNameProvider>
    {children}
  </ProfileNameProvider>;
  return <HashRouter basename="/">
    <Routes>
      <Route path=":profileName/*" element={rebasedChildren}/>
      <Route path="/*" element={<ProfilePicker/>}/>
    </Routes>
  </HashRouter>;
};