// https://github.com/shaoster/space-station/new/main/game-configurations

import { Box, Grid, Typography } from "@mui/material";
import { ReactNode } from "react";
import { HashRouter, Link, Route, Routes, useParams } from "react-router-dom";
import { GameConfigurationProvider } from "./Util";
import { GameConfiguration } from "../glossary/Compendium";

const context = require.context("../game-configurations", true, /.json$/);
export const STATIC_PROFILES: {[key: string]: GameConfiguration} = {};
context.keys().forEach((key: any) => {
  const fileName = key.replace('./', '');
  const resource = require(`../game-configurations/${fileName}`);
  const namespace: string = fileName.replace('.json', '');
  STATIC_PROFILES[namespace] = JSON.parse(JSON.stringify(resource)) as GameConfiguration;
});
console.log(STATIC_PROFILES);

export const ProfileNameProvider = ({children} : {children: ReactNode}) => {
  const { profileName } = useParams();
  if (!profileName) {
    throw new Error("A profile name must be specified.");
  }
  return <GameConfigurationProvider profileName={profileName}>
    {children}
  </GameConfigurationProvider>;
};

const ProfilePicker = () => {
  const profiles = Object.keys(STATIC_PROFILES);
  return <Box sx={{padding: 2}}>
    <Typography>
      The profiles listed here represent those statically tracked via source control.
      <br/>
      To create a new one, click "Load to Edit" and then [POST PR TO GITHUB] in the summary panel.
      <br/> 
      After the PR is merged and the new code deployed, a new profile should show up here.
      <br/>
      If you just want to edit stuff locally, just pick whichever profile you want and start editing.
      <br/>
      In that case, any changes are stored in your browser's local storage and will persist through page refreshes.
      <br/>
      However, if you want to share your game configuration with others, you should post a PR.
    </Typography>
    <Grid container sx={{padding: 2}}>
      {
        profiles.map((p) => <>
          <Grid item xs={1}>
            {p}
          </Grid>
          <Grid item xs={1}>
            <Link to={`/${p}/play`}>Play</Link>
          </Grid>
          <Grid item xs={1}>
            <Link to={`/${p}/edit`}>Load to Edit</Link>
          </Grid>
          <Grid item xs={9}>
          </Grid>
        </>)
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