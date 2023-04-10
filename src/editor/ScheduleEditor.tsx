import { Box, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import { DayStage, getTimeCoordinateFromDayAndStage } from "../glossary/Events";
import { LibrarySelector } from "./LibraryEditor";
import { DataManager, DataNode, useGameConfiguration } from "./Util";

const DAY_STAGE_LABELS = Object.keys(DayStage) as string[];
const DAY_STAGE_VALUES = Object.values(DayStage) as DayStage[];

function DayScheduler({day} : {day: number}) {
  const {
    gameConfiguration: {
      conversationLibrary
    }
  } = useGameConfiguration();

  return <TableRow>
    <TableCell key={"day_" + day}>
      {day}
    </TableCell>
    {
      DAY_STAGE_VALUES.map((ds) => (
        <TableCell key={ds}>
          <DataManager>
            <DataNode dataKey={getTimeCoordinateFromDayAndStage(day, ds)}>
              <LibrarySelector
                fieldLibrary={conversationLibrary}
                multiple
              />
            </DataNode>
          </DataManager>
        </TableCell>
      ))
    }
  </TableRow>;
}

export default function ScheduleEditor() {
  return <Box sx={{paddingLeft: 2}}>
    <p>
      This is the initial schedule.
    </p>
    <p>
      TBD: Dialogue nodes can add new events to the schedule during the game.
    </p>
    <Table>
      <TableHead>
        <TableRow>
          <TableCell key="daylabel">
            Day
          </TableCell>
          {
            DAY_STAGE_LABELS.map((ds) => (
              <TableCell key={ds}>
                {ds}
              </TableCell>
            ))
          }
        </TableRow>
      </TableHead>
      <TableBody>
        {
        [...Array(7).keys()].map((d) => <DayScheduler key={d} day={d + 1}/>)
        }
      </TableBody>
    </Table>
  </Box>;
}