/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2019-2024 by the xcube development team and contributors.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is furnished to do
 * so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import makeStyles from "@mui/styles/makeStyles";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import AllOutIcon from "@mui/icons-material/AllOut";
import CloseIcon from "@mui/icons-material/Close";

import i18n from "@/i18n";
import {
  PlaceGroupTimeSeries,
  TimeSeries,
  TimeSeriesGroup,
} from "@/model/timeSeries";
import { WithLocale } from "@/util/lang";
import AddTimeSeriesButton from "@/components/TimeSeriesCharts/AddTimeSeriesButton";

const useStyles = makeStyles({
  headerContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  actionsContainer: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "nowrap",
    alignItems: "center",
  },
  responsiveContainer: {
    flexGrow: 1,
  },
  actionButton: {
    zIndex: 1000,
    opacity: 0.8,
  },
  chartTitle: {
    fontSize: "inherit",
    fontWeight: "normal",
  },
});

interface TimeSeriesChartHeaderProps extends WithLocale {
  timeSeriesGroup: TimeSeriesGroup;
  removeTimeSeriesGroup: (timeSeriesGroupId: string) => void;
  placeGroupTimeSeries: PlaceGroupTimeSeries[];
  addPlaceGroupTimeSeries: (
    timeSeriesGroupId: string,
    timeSeries: TimeSeries,
  ) => void;
  resetZoom: () => void;
  loading: boolean;
  zoomed: boolean;
}

export default function TimeSeriesChartHeader({
  timeSeriesGroup,
  placeGroupTimeSeries,
  addPlaceGroupTimeSeries,
  removeTimeSeriesGroup,
  resetZoom,
  loading,
  zoomed,
}: TimeSeriesChartHeaderProps) {
  const classes = useStyles();

  const timeSeriesText = i18n.get("Time-Series");
  const unitsText = timeSeriesGroup.variableUnits || i18n.get("unknown units");
  const chartTitle = `${timeSeriesText} (${unitsText})`;

  return (
    <Box className={classes.headerContainer}>
      <Typography className={classes.chartTitle}>{chartTitle}</Typography>
      <Box className={classes.actionsContainer}>
        {zoomed && (
          <IconButton
            key={"zoomOutButton"}
            className={classes.actionButton}
            aria-label="Zoom Out"
            onClick={resetZoom}
            size="small"
          >
            <AllOutIcon fontSize={"inherit"} />
          </IconButton>
        )}
        <AddTimeSeriesButton
          className={classes.actionButton}
          timeSeriesGroupId={timeSeriesGroup.id}
          placeGroupTimeSeries={placeGroupTimeSeries}
          addPlaceGroupTimeSeries={addPlaceGroupTimeSeries}
        />
        {loading ? (
          // Note, we show progress instead of the close button,
          // because we can not yet cancel loading time series.
          <CircularProgress
            size={24}
            className={classes.actionButton}
            color={"secondary"}
          />
        ) : (
          <IconButton
            className={classes.actionButton}
            aria-label="Close"
            onClick={() => removeTimeSeriesGroup(timeSeriesGroup.id)}
            size="small"
          >
            <CloseIcon fontSize="inherit" />
          </IconButton>
        )}
      </Box>
    </Box>
  );
}