import { Box, Tab, Tabs } from "@mui/material";
import { ReactNode, useState } from "react";
import ConversationBuilder from "./ConversationBuilder";
import { SaveProfileProvider } from "./Profiles";

function TabPanel(
  {activeTab, tabId, children, ...props}
  : {activeTab: number, tabId: number, children?: ReactNode}
) {
  return <>
    { activeTab === tabId &&
      <Box {...props}>
        {children}
      </Box>
    }
  </>;
}

export default function Studio() {
  const [activeTab, setActiveTab] = useState(0);
  const handleChange = (_: any, newTabIndex: number) => {
    setActiveTab(newTabIndex);
  };
  return <SaveProfileProvider>
    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
      <Tabs value={activeTab} onChange={handleChange} aria-label="basic tabs example">
        <Tab label="Conversation Builder" />
      </Tabs>
    </Box>
    <TabPanel activeTab={activeTab} tabId={0}>
      <ConversationBuilder/>
    </TabPanel>
  </SaveProfileProvider>;
}