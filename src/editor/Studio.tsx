import React from "react";
import ConversationBuilder from "./ConversationBuilder";
import { SaveProfileProvider } from "./Profiles";


export default function Studio() {
  return <SaveProfileProvider>
    <ConversationBuilder/>
  </SaveProfileProvider>;
}