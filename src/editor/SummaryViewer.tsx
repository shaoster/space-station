import { Button, Card, CardContent, Link } from "@mui/material";
import { useEffect, useState } from "react";
import { useGameConfiguration } from "./Util";
import { useHref } from "react-router-dom";

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
      <pre>
        {
        JSON.stringify(gameConfiguration, null, 2)
        }
      </pre>
    </CardContent>
  </Card>;
};