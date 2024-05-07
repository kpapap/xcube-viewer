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

import { JSX } from "react";
import { createSelector } from "reselect";
import memoize from "fast-memoize";
import { ImageTile as OlImageTile, Tile as OlTile } from "ol";
import { default as OlMap } from "ol/Map";
import { default as OlGeoJSONFormat } from "ol/format/GeoJSON";
import { default as OlVectorSource } from "ol/source/Vector";
import { default as OlXYZSource } from "ol/source/XYZ";
import { default as OlTileWMSSource } from "ol/source/TileWMS";
import { default as OlCircle } from "ol/style/Circle";
import { default as OlFillStyle } from "ol/style/Fill";
import { default as OlStrokeStyle } from "ol/style/Stroke";
import { default as OlStyle } from "ol/style/Style";
import { default as OlTileGrid } from "ol/tilegrid/TileGrid";
import { LoadFunction } from "ol/Tile";

import { Config, getTileAccess } from "@/config";
import { Layers } from "@/components/ol/layer/Layers";
import { Tile } from "@/components/ol/layer/Tile";
import { Vector } from "@/components/ol/layer/Vector";
import { MapElement } from "@/components/ol/Map";
import { ApiServerConfig } from "@/model/apiServer";

import {
  Dataset,
  findDataset,
  findDatasetVariable,
  getDatasetTimeDimension,
  getDatasetTimeRange,
  RgbSchema,
  TimeDimension,
} from "@/model/dataset";
import {
  findPlaceInfo,
  forEachPlace,
  getPlaceInfo,
  isValidPlaceGroup,
  Place,
  PlaceGroup,
  PlaceInfo,
} from "@/model/place";
import { Time, TimeRange, TimeSeriesGroup } from "@/model/timeSeries";
import { Variable } from "@/model/variable";

import { AppState } from "@/states/appState";
import { findIndexCloseTo } from "@/util/find";
import {
  predefinedColorBarsSelector,
  datasetsSelector,
  timeSeriesGroupsSelector,
  userPlaceGroupsSelector,
  userServersSelector,
} from "./dataSelectors";
import { makeRequestUrl } from "@/api/callApi";
import {
  LayerVisibilities,
  MAP_OBJECTS,
  ViewMode,
} from "@/states/controlState";
import { GEOGRAPHIC_CRS, WEB_MERCATOR_CRS } from "@/model/proj";
import {
  ColorBar,
  ColorBarGroup,
  ColorBars,
  parseColorBar,
} from "@/model/colorBar";
import {
  getUserColorBarColorArray,
  USER_COLOR_BAR_GROUP_TITLE,
  UserColorBar,
} from "@/model/userColorBar";
import {
  defaultBaseMapLayers,
  defaultOverlayLayers,
  findLayer,
  getLayerTitle,
  LayerDefinition,
} from "@/model/layerDefinition";

export const selectedDatasetIdSelector = (state: AppState) =>
  state.controlState.selectedDatasetId;
export const selectedVariableNameSelector = (state: AppState) =>
  state.controlState.selectedVariableName;
export const selectedDataset2IdSelector = (state: AppState) =>
  state.controlState.selectedDataset2Id;
export const selectedVariable2NameSelector = (state: AppState) =>
  state.controlState.selectedVariable2Name;
export const selectedPlaceGroupIdsSelector = (state: AppState) =>
  state.controlState.selectedPlaceGroupIds;
export const selectedPlaceIdSelector = (state: AppState) =>
  state.controlState.selectedPlaceId;
export const selectedTimeSelector = (state: AppState) =>
  state.controlState.selectedTime;
export const selectedServerIdSelector = (state: AppState) =>
  state.controlState.selectedServerId;
export const activitiesSelector = (state: AppState) =>
  state.controlState.activities;
export const timeAnimationActiveSelector = (state: AppState) =>
  state.controlState.timeAnimationActive;
export const imageSmoothingSelector = (state: AppState) =>
  state.controlState.imageSmoothingEnabled;
export const userBaseMapsSelector = (state: AppState) =>
  state.controlState.userBaseMaps;
export const userOverlaysSelector = (state: AppState) =>
  state.controlState.userOverlays;
export const selectedBaseMapIdSelector = (state: AppState) =>
  state.controlState.selectedBaseMapId;
export const selectedOverlayIdSelector = (state: AppState) =>
  state.controlState.selectedOverlayId;
export const showBaseMapLayerSelector = (state: AppState) =>
  !!state.controlState.layerVisibilities.baseMap;
export const showDatasetBoundaryLayerSelector = (state: AppState) =>
  !!state.controlState.layerVisibilities.datasetBoundary;
export const selectedVariableVisibilitySelector = (state: AppState) =>
  !!state.controlState.layerVisibilities.datasetVariable;
export const selectedVariable2VisibilitySelector = (state: AppState) =>
  !!state.controlState.layerVisibilities.datasetVariable2;
export const showDatasetRgbLayerSelector = (state: AppState) =>
  !!state.controlState.layerVisibilities.datasetRgb;
export const showDatasetPlacesLayerSelector = (state: AppState) =>
  !!state.controlState.layerVisibilities.datasetPlaces;
export const showUserPlacesLayerSelector = (state: AppState) =>
  !!state.controlState.layerVisibilities.userPlaces;
export const showOverlayLayerSelector = (state: AppState) =>
  !!state.controlState.layerVisibilities.overlay;
export const layerVisibilitiesSelector = (state: AppState) =>
  state.controlState.layerVisibilities;
export const infoCardElementStatesSelector = (state: AppState) =>
  state.controlState.infoCardElementStates;
export const mapProjectionSelector = (state: AppState) =>
  state.controlState.mapProjection;
export const timeChunkSizeSelector = (state: AppState) =>
  state.controlState.timeChunkSize;
export const userPlacesFormatNameSelector = (state: AppState) =>
  state.controlState.userPlacesFormatName;
export const userPlacesFormatOptionsCsvSelector = (state: AppState) =>
  state.controlState.userPlacesFormatOptions.csv;
export const userPlacesFormatOptionsGeoJsonSelector = (state: AppState) =>
  state.controlState.userPlacesFormatOptions.geojson;
export const userPlacesFormatOptionsWktSelector = (state: AppState) =>
  state.controlState.userPlacesFormatOptions.wkt;
export const userColorBarsSelector = (state: AppState) =>
  state.controlState.userColorBars;

const variableLayerId = () => "variable";
const variable2LayerId = () => "variable2";
const variableZIndexSelector = () => 12;
const variable2ZIndexSelector = () => 11;

export const selectedDatasetSelector = createSelector(
  datasetsSelector,
  selectedDatasetIdSelector,
  findDataset,
);

export const selectedDataset2Selector = createSelector(
  datasetsSelector,
  selectedDataset2IdSelector,
  findDataset,
);

export const selectedVariablesSelector = createSelector(
  selectedDatasetSelector,
  (dataset: Dataset | null): Variable[] => {
    return (dataset && dataset.variables) || [];
  },
);

const _findDatasetVariable = (
  dataset: Dataset | null,
  varName: string | null,
): Variable | null => {
  if (!dataset || !varName) {
    return null;
  }
  return findDatasetVariable(dataset, varName);
};

export const selectedVariableSelector = createSelector(
  selectedDatasetSelector,
  selectedVariableNameSelector,
  _findDatasetVariable,
);

export const selectedVariable2Selector = createSelector(
  selectedDataset2Selector,
  selectedVariable2NameSelector,
  _findDatasetVariable,
);

export const selectedVariableUnitsSelector = createSelector(
  selectedVariableSelector,
  (variable: Variable | null): string => {
    return (variable && variable.units) || "-";
  },
);

const getVariableColorBarMinMax = (
  variable: Variable | null,
): [number, number] => {
  return variable ? [variable.colorBarMin, variable.colorBarMax] : [0, 1];
};

export const selectedVariableColorBarMinMaxSelector = createSelector(
  selectedVariableSelector,
  getVariableColorBarMinMax,
);

export const selectedVariable2ColorBarMinMaxSelector = createSelector(
  selectedVariable2Selector,
  getVariableColorBarMinMax,
);

const getVariableColorBarName = (variable: Variable | null): string => {
  return (variable && variable.colorBarName) || "viridis";
};

export const selectedVariableColorBarNameSelector = createSelector(
  selectedVariableSelector,
  getVariableColorBarName,
);

export const selectedVariable2ColorBarNameSelector = createSelector(
  selectedVariable2Selector,
  getVariableColorBarName,
);

export const colorBarsSelector = createSelector(
  userColorBarsSelector,
  predefinedColorBarsSelector,
  (userColorBars, predefinedColorBars): ColorBars => {
    const userGroup: ColorBarGroup = {
      title: USER_COLOR_BAR_GROUP_TITLE,
      description: "User-defined color bars.",
      names: userColorBars.map((colorBar) => colorBar.id),
    };
    const userImages: Record<string, string> = {};
    userColorBars.forEach(({ id, imageData }: UserColorBar) => {
      if (imageData) {
        userImages[id] = imageData;
      }
    });
    if (predefinedColorBars) {
      return {
        ...predefinedColorBars,
        groups: [userGroup, ...predefinedColorBars.groups],
        images: { ...predefinedColorBars.images, ...userImages },
      };
    } else {
      return { groups: [userGroup], images: userImages };
    }
  },
);

const getVariableColorBar = (
  colorBarName: string,
  colorBars: ColorBars,
): ColorBar => {
  const colorBar: ColorBar = parseColorBar(colorBarName);
  const imageData = colorBars.images[colorBar.baseName];
  return { ...colorBar, imageData };
};

export const selectedVariableColorBarSelector = createSelector(
  selectedVariableColorBarNameSelector,
  colorBarsSelector,
  getVariableColorBar,
);

export const selectedVariable2ColorBarSelector = createSelector(
  selectedVariable2ColorBarNameSelector,
  colorBarsSelector,
  getVariableColorBar,
);

const getVariableUserColorBarJson = (
  colorBar: ColorBar,
  colorBarName: string,
  userColorBars: UserColorBar[],
): string | null => {
  const { baseName } = colorBar;
  const userColorBar = userColorBars.find(
    (userColorBar) => userColorBar.id === baseName,
  );
  if (userColorBar) {
    const colors = getUserColorBarColorArray(userColorBar.code);
    if (colors) {
      return JSON.stringify({ name: colorBarName, colors });
    }
  }
  return null;
};

export const selectedVariableUserColorBarJsonSelector = createSelector(
  selectedVariableColorBarSelector,
  selectedVariableColorBarNameSelector,
  userColorBarsSelector,
  getVariableUserColorBarJson,
);

export const selectedVariable2UserColorBarJsonSelector = createSelector(
  selectedVariable2ColorBarSelector,
  selectedVariable2ColorBarNameSelector,
  userColorBarsSelector,
  getVariableUserColorBarJson,
);

const getVariableOpacity = (variable: Variable | null): number => {
  if (!variable || typeof variable.opacity != "number") {
    return 1;
  }
  return variable.opacity;
};

export const selectedVariableOpacitySelector = createSelector(
  selectedVariableSelector,
  getVariableOpacity,
);

export const selectedVariable2OpacitySelector = createSelector(
  selectedVariable2Selector,
  getVariableOpacity,
);

export const selectedDatasetTimeRangeSelector = createSelector(
  selectedDatasetSelector,
  (dataset: Dataset | null): TimeRange | null => {
    return dataset !== null ? getDatasetTimeRange(dataset) : null;
  },
);

export const selectedDatasetRgbSchemaSelector = createSelector(
  selectedDatasetSelector,
  (dataset: Dataset | null): RgbSchema | null => {
    return dataset !== null ? dataset.rgbSchema || null : null;
  },
);

export const selectedDatasetPlaceGroupsSelector = createSelector(
  selectedDatasetSelector,
  (dataset: Dataset | null): PlaceGroup[] => {
    return (dataset && dataset.placeGroups) || [];
  },
);

export const selectedDatasetAndUserPlaceGroupsSelector = createSelector(
  selectedDatasetPlaceGroupsSelector,
  userPlaceGroupsSelector,
  (placeGroups: PlaceGroup[], userPlaceGroups: PlaceGroup[]): PlaceGroup[] => {
    return placeGroups.concat(userPlaceGroups);
  },
);

function selectPlaceGroups(
  placeGroups: PlaceGroup[],
  placeGroupIds: string[] | null,
): PlaceGroup[] {
  const selectedPlaceGroups: PlaceGroup[] = [];
  if (placeGroupIds !== null && placeGroupIds.length > 0) {
    placeGroups.forEach((placeGroup) => {
      if (placeGroupIds.indexOf(placeGroup.id) > -1) {
        selectedPlaceGroups.push(placeGroup);
      }
    });
  }
  return selectedPlaceGroups;
}

export const userPlaceGroupsVisibilitySelector = createSelector(
  userPlaceGroupsSelector,
  selectedPlaceGroupIdsSelector,
  showUserPlacesLayerSelector,
  (
    userPlaceGroups: PlaceGroup[],
    selectedPlaceGroupIds: string[] | null,
  ): { [pgId: string]: boolean } => {
    const visibility: { [pgId: string]: boolean } = {};
    const idSet = new Set(selectedPlaceGroupIds || []);
    userPlaceGroups.forEach((placeGroup) => {
      visibility[placeGroup.id] = idSet.has(placeGroup.id);
    });
    return visibility;
  },
);

export const selectedDatasetSelectedPlaceGroupsSelector = createSelector(
  selectedDatasetPlaceGroupsSelector,
  selectedPlaceGroupIdsSelector,
  selectPlaceGroups,
);

export const selectedPlaceGroupsSelector = createSelector(
  selectedDatasetAndUserPlaceGroupsSelector,
  selectedPlaceGroupIdsSelector,
  selectPlaceGroups,
);

export const selectedPlaceGroupsTitleSelector = createSelector(
  selectedPlaceGroupsSelector,
  (placeGroups: PlaceGroup[]): string => {
    return placeGroups
      .map((placeGroup) => placeGroup.title || placeGroup.id)
      .join(", ");
  },
);

export const selectedPlaceGroupPlacesSelector = createSelector(
  selectedPlaceGroupsSelector,
  (placeGroups: PlaceGroup[]): Place[] => {
    const args = placeGroups.map(
      (placeGroup) =>
        (isValidPlaceGroup(placeGroup) ? placeGroup.features : []) as Place[],
    );
    return ([] as Array<Place>).concat(...args);
  },
);

export const selectedPlaceSelector = createSelector(
  selectedPlaceGroupPlacesSelector,
  selectedPlaceIdSelector,
  (places: Place[], placeId: string | null): Place | null => {
    return places.find((place) => place.id === placeId) || null;
  },
);

export const selectedPlaceInfoSelector = createSelector(
  selectedPlaceGroupsSelector,
  selectedPlaceIdSelector,
  (placeGroups: PlaceGroup[], placeId: string | null): PlaceInfo | null => {
    if (placeGroups.length === 0 || placeId === null) {
      return null;
    }
    return findPlaceInfo(
      placeGroups,
      (_placeGroup, place) => place.id === placeId,
    );
  },
);

export const selectedVolumeIdSelector = createSelector(
  selectedDatasetIdSelector,
  selectedVariableNameSelector,
  selectedPlaceSelector,
  (
    datasetId: string | null,
    variableName: string | null,
    place: Place | null,
  ): string | null => {
    if (datasetId && variableName) {
      if (!place) {
        return `${datasetId}-${variableName}-all`;
      }
      if (
        place.geometry.type === "Polygon" ||
        place.geometry.type === "MultiPolygon"
      ) {
        return `${datasetId}-${variableName}-${place.id}`;
      }
    }
    return null;
  },
);

export const canAddTimeSeriesSelector = createSelector(
  timeSeriesGroupsSelector,
  selectedDatasetIdSelector,
  selectedVariableNameSelector,
  selectedPlaceIdSelector,
  (
    timeSeriesGroups: TimeSeriesGroup[],
    datasetId: string | null,
    variableName: string | null,
    placeId: string | null,
  ): boolean => {
    if (!datasetId || !variableName || !placeId) {
      return false;
    }
    for (const timeSeriesGroup of timeSeriesGroups) {
      for (const timeSeries of timeSeriesGroup.timeSeriesArray) {
        const source = timeSeries.source;
        if (
          source.datasetId === datasetId &&
          source.variableName === variableName &&
          source.placeId === placeId
        ) {
          return false;
        }
      }
    }
    return true;
  },
);

export const timeSeriesPlaceInfosSelector = createSelector(
  timeSeriesGroupsSelector,
  selectedDatasetAndUserPlaceGroupsSelector,
  (
    timeSeriesGroups: TimeSeriesGroup[],
    placeGroups: PlaceGroup[],
  ): Record<string, PlaceInfo> => {
    const placeInfos: Record<string, PlaceInfo> = {};
    forEachPlace(placeGroups, (placeGroup, place) => {
      for (const timeSeriesGroup of timeSeriesGroups) {
        if (
          timeSeriesGroup.timeSeriesArray.find(
            (ts) => ts.source.placeId === place.id,
          )
        ) {
          placeInfos[place.id] = getPlaceInfo(placeGroup, place);
          break;
        }
      }
    });
    return placeInfos;
  },
);

export const selectedPlaceGroupPlaceLabelsSelector = createSelector(
  selectedPlaceGroupsSelector,
  (placeGroups: PlaceGroup[]): string[] => {
    const placeLabels: string[] = [];
    forEachPlace(placeGroups, (placeGroup, place) => {
      placeLabels.push(getPlaceInfo(placeGroup, place).label);
    });
    return placeLabels;
  },
);

export const selectedTimeChunkSizeSelector = createSelector(
  selectedVariableSelector,
  timeChunkSizeSelector,
  (variable: Variable | null, minTimeChunkSize): number => {
    if (variable && variable.timeChunkSize) {
      const varTimeChunkSize = variable.timeChunkSize;
      return varTimeChunkSize * Math.ceil(minTimeChunkSize / varTimeChunkSize);
    }
    return minTimeChunkSize;
  },
);

const _getDatasetTimeDimension = (
  dataset: Dataset | null,
): TimeDimension | null => {
  return (dataset && getDatasetTimeDimension(dataset)) || null;
};

export const selectedDatasetTimeDimensionSelector = createSelector(
  selectedDatasetSelector,
  _getDatasetTimeDimension,
);

export const selectedDataset2TimeDimensionSelector = createSelector(
  selectedDataset2Selector,
  _getDatasetTimeDimension,
);

const _getDatasetAttributions = (dataset: Dataset | null): string[] | null => {
  return (dataset && dataset.attributions) || null;
};

export const selectedDatasetAttributionsSelector = createSelector(
  selectedDatasetSelector,
  _getDatasetAttributions,
);

export const selectedDataset2AttributionsSelector = createSelector(
  selectedDataset2Selector,
  _getDatasetAttributions,
);

export const timeCoordinatesSelector = createSelector(
  selectedDatasetTimeDimensionSelector,
  (timeDimension: TimeDimension | null): Time[] | null => {
    if (timeDimension === null || timeDimension.coordinates.length === 0) {
      return null;
    }
    return timeDimension.coordinates;
  },
);

export const selectedTimeIndexSelector = createSelector(
  selectedTimeSelector,
  timeCoordinatesSelector,
  (time: Time | null, timeCoordinates: Time[] | null): number => {
    if (time === null || timeCoordinates === null) {
      return -1;
    }
    return findIndexCloseTo(timeCoordinates, time);
  },
);

function getOlTileGrid(
  mapProjection: string,
  tileLevelMax: number | undefined,
) {
  if (mapProjection !== WEB_MERCATOR_CRS) {
    // If projection is not web mercator, it is geographical.
    // We need to define the geographical tile grid used by xcube:
    const numLevels = typeof tileLevelMax === "number" ? tileLevelMax + 1 : 20;
    return new OlTileGrid({
      tileSize: [256, 256],
      origin: [-180, 90],
      extent: [-180, -90, 180, 90],
      // Note, although correct, setting minZoom
      // will cause OpenLayers to crash:
      // minZoom: tileLevelMin,
      resolutions: Array.from(
        { length: numLevels },
        (_, i) => 180 / 256 / Math.pow(2, i),
      ),
    });
  }
}

function getOlXYZSource(
  url: string,
  mapProjection: string,
  tileGrid: undefined | OlTileGrid,
  attributions: string[] | null,
  timeAnimationActive: boolean,
  imageSmoothing: boolean,
  tileLoadFunction: LoadFunction | undefined,
  _tileLevelMin: number | undefined,
  tileLevelMax: number | undefined,
) {
  return new OlXYZSource({
    url,
    projection: mapProjection,
    tileGrid,
    attributions: attributions || undefined,
    transition: timeAnimationActive ? 0 : 250,
    imageSmoothing: imageSmoothing,
    tileLoadFunction,
    // TODO (forman): if we provide minZoom, we also need to set
    //   tileGrid.extent, otherwise way to many tiles are loaded from
    //   level at minZoom when zooming out!
    // minZoom: tileLevelMin,
    maxZoom: tileLevelMax,
  });
}

function __getLoadTileOnlyAfterMove(map: OlMap | undefined) {
  if (map) {
    // Define a special tileLoadFunction
    // that prevents tiles from being loaded while the user
    // pans or zooms, because this leads to high server loads.
    return (tile: OlTile, src: string) => {
      if (tile instanceof OlImageTile) {
        if (map.getView().getInteracting()) {
          map.once("moveend", function () {
            (tile.getImage() as HTMLImageElement).src = src;
          });
        } else {
          (tile.getImage() as HTMLImageElement).src = src;
        }
      }
    };
  }
}

const _getLoadTileOnlyAfterMove = memoize(__getLoadTileOnlyAfterMove, {
  serializer: (args) => {
    const map = args[0] as OlMap | undefined;
    if (map) {
      const target = map.getTarget();
      if (typeof target === "string") {
        return target;
      } else if (target) {
        return target.id || "map";
      }
      return "map";
    }
    return "";
  },
});

function getLoadTileOnlyAfterMove() {
  const map = MAP_OBJECTS["map"] as OlMap | undefined;
  return _getLoadTileOnlyAfterMove(map);
}

function getTileLayer(
  layerId: string,
  tileUrl: string,
  tileLevelMin: number | undefined,
  tileLevelMax: number | undefined,
  queryParams: Array<[string, string]>,
  opacity: number,
  timeDimension: TimeDimension | null,
  time: number | null,
  timeAnimationActive: boolean,
  mapProjection: string,
  attributions: string[] | null,
  imageSmoothing: boolean,
  zIndex: number = 10,
) {
  if (time !== null) {
    let timeString;
    if (timeDimension) {
      const timeIndex = findIndexCloseTo(timeDimension.coordinates, time);
      if (timeIndex > -1) {
        timeString = timeDimension.labels[timeIndex];
        // console.log("adjusted time from", new Date(time).toISOString(), "to", timeString);
      }
    }
    if (!timeString) {
      timeString = new Date(time).toISOString();
    }
    queryParams = [...queryParams, ["time", timeString]];
  }

  const url = makeRequestUrl(tileUrl, queryParams);

  if (typeof tileLevelMax === "number") {
    // It is ok to have some extra zoom levels, so we can magnify pixels.
    // Using more, artifacts will become visible.
    tileLevelMax += 3;
  }

  const tileGrid = getOlTileGrid(mapProjection, tileLevelMax);
  const source = getOlXYZSource(
    url,
    mapProjection,
    tileGrid,
    attributions,
    timeAnimationActive,
    imageSmoothing,
    getLoadTileOnlyAfterMove(),
    tileLevelMin,
    tileLevelMax,
  );

  return (
    <Tile id={layerId} source={source} zIndex={zIndex} opacity={opacity} />
  );
}

export const selectedDatasetBoundaryLayerSelector = createSelector(
  selectedDatasetSelector,
  mapProjectionSelector,
  showDatasetBoundaryLayerSelector,
  (
    dataset: Dataset | null,
    mapProjection: string,
    showDatasetBoundary: boolean,
  ): MapElement | null => {
    if (!dataset || !showDatasetBoundary) {
      return null;
    }

    let geometry = dataset.geometry;
    if (!geometry) {
      if (dataset.bbox) {
        const [x1, y1, x2, y2] = dataset.bbox;
        geometry = {
          type: "Polygon",
          coordinates: [
            [
              [x1, y1],
              [x2, y1],
              [x2, y2],
              [x1, y2],
              [x1, y1],
            ],
          ],
        };
      } else {
        console.warn(`Dataset ${dataset.id} has no bbox!`);
        return null;
      }
    }

    const source = new OlVectorSource({
      features: new OlGeoJSONFormat({
        dataProjection: GEOGRAPHIC_CRS,
        featureProjection: mapProjection,
      }).readFeatures({ type: "Feature", geometry }),
    });

    const style = new OlStyle({
      stroke: new OlStrokeStyle({
        color: "orange",
        width: 3,
        lineDash: [2, 4],
      }),
    });

    return (
      <Vector
        id={`${dataset.id}.bbox`}
        source={source}
        style={style}
        zIndex={11}
        opacity={0.5}
      />
    );
  },
);

export const selectedServerSelector = createSelector(
  userServersSelector,
  selectedServerIdSelector,
  (userServers: ApiServerConfig[], serverId: string): ApiServerConfig => {
    if (userServers.length === 0) {
      throw new Error(`internal error: no servers configured`);
    }
    const server = userServers.find((server) => server.id === serverId);
    if (!server) {
      throw new Error(`internal error: server with ID "${serverId}" not found`);
    }
    return server;
  },
);

const getVariableTileLayer = (
  server: ApiServerConfig,
  datasetId: string | null,
  datasetTimeDimension: TimeDimension | null,
  attributions: string[] | null,
  variable: Variable | null,
  colorBarMinMax: [number, number],
  colorBarName: string,
  colorBarJson: string | null,
  visibility: boolean,
  opacity: number,
  layerId: string,
  zIndex: number,
  time: Time | null,
  timeAnimationActive: boolean,
  mapProjection: string,
  imageSmoothing: boolean,
): MapElement => {
  if (!visibility || !variable) {
    return null;
  }
  const queryParams: Array<[string, string]> = [
    ["crs", mapProjection],
    ["vmin", `${colorBarMinMax[0]}`],
    ["vmax", `${colorBarMinMax[1]}`],
    ["cbar", colorBarJson ? colorBarJson : colorBarName],
    // ['retina', '1'],
  ];
  return getTileLayer(
    layerId,
    getTileUrl(server.url, datasetId!, variable.name),
    variable.tileLevelMin,
    variable.tileLevelMax,
    queryParams,
    opacity,
    datasetTimeDimension,
    time,
    timeAnimationActive,
    mapProjection,
    attributions,
    imageSmoothing,
    zIndex,
  );
};

export const selectedDatasetVariableLayerSelector = createSelector(
  selectedServerSelector,
  selectedDatasetIdSelector,
  selectedDatasetTimeDimensionSelector,
  selectedDatasetAttributionsSelector,
  selectedVariableSelector,
  selectedVariableColorBarMinMaxSelector,
  selectedVariableColorBarNameSelector,
  selectedVariableUserColorBarJsonSelector,
  selectedVariableVisibilitySelector,
  selectedVariableOpacitySelector,
  variableLayerId,
  variableZIndexSelector,
  selectedTimeSelector,
  timeAnimationActiveSelector,
  mapProjectionSelector,
  imageSmoothingSelector,
  getVariableTileLayer,
);

export const selectedDatasetVariable2LayerSelector = createSelector(
  selectedServerSelector,
  selectedDataset2IdSelector,
  selectedDataset2TimeDimensionSelector,
  selectedDataset2AttributionsSelector,
  selectedVariable2Selector,
  selectedVariable2ColorBarMinMaxSelector,
  selectedVariable2ColorBarNameSelector,
  selectedVariable2UserColorBarJsonSelector,
  selectedVariable2VisibilitySelector,
  selectedVariable2OpacitySelector,
  variable2LayerId,
  variable2ZIndexSelector,
  selectedTimeSelector,
  timeAnimationActiveSelector,
  mapProjectionSelector,
  imageSmoothingSelector,
  getVariableTileLayer,
);

export const selectedDatasetRgbLayerSelector = createSelector(
  selectedServerSelector,
  selectedDatasetIdSelector,
  showDatasetRgbLayerSelector,
  selectedDatasetRgbSchemaSelector,
  selectedDatasetTimeDimensionSelector,
  selectedTimeSelector,
  timeAnimationActiveSelector,
  mapProjectionSelector,
  selectedDatasetAttributionsSelector,
  imageSmoothingSelector,
  (
    server: ApiServerConfig,
    datasetId,
    showRgbLayer: boolean,
    rgbSchema: RgbSchema | null,
    timeDimension: TimeDimension | null,
    time: Time | null,
    timeAnimationActive: boolean,
    mapProjection: string,
    attributions: string[] | null,
    imageSmoothing: boolean,
  ): MapElement => {
    if (!showRgbLayer || !rgbSchema) {
      return null;
    }
    const queryParams: Array<[string, string]> = [["crs", mapProjection]];
    return getTileLayer(
      "rgb",
      getTileUrl(server.url, datasetId!, "rgb"),
      rgbSchema.tileLevelMin,
      rgbSchema.tileLevelMax,
      queryParams,
      1.0,
      timeDimension,
      time,
      timeAnimationActive,
      mapProjection,
      attributions,
      imageSmoothing,
      10,
    );
  },
);

function getTileUrl(
  serverUrl: string,
  datasetId: string,
  varName: string,
): string {
  return (
    serverUrl +
    "/tiles/" +
    encodeURIComponent(datasetId) +
    "/" +
    encodeURIComponent(varName) +
    "/{z}/{y}/{x}"
  );
}

export function getDefaultFillOpacity() {
  return Config.instance.branding.polygonFillOpacity || 0.25;
}

export function getDefaultStyleImage() {
  return new OlCircle({
    fill: getDefaultFillStyle(),
    stroke: getDefaultStrokeStyle(),
    radius: 6,
  });
}

export function getDefaultStrokeStyle() {
  return new OlStrokeStyle({
    color: [200, 0, 0, 0.75],
    width: 1.25,
  });
}

export function getDefaultFillStyle() {
  return new OlFillStyle({
    color: [255, 0, 0, getDefaultFillOpacity()],
  });
}

export function getDefaultPlaceGroupStyle() {
  return new OlStyle({
    image: getDefaultStyleImage(),
    stroke: getDefaultStrokeStyle(),
    fill: getDefaultFillStyle(),
  });
}

export const selectedDatasetPlaceGroupLayersSelector = createSelector(
  selectedDatasetSelectedPlaceGroupsSelector,
  mapProjectionSelector,
  showDatasetPlacesLayerSelector,
  (
    placeGroups: PlaceGroup[],
    mapProjection: string,
    showDatasetPlaces: boolean,
  ): MapElement => {
    if (!showDatasetPlaces || placeGroups.length === 0) {
      return null;
    }
    const layers: MapElement[] = [];
    placeGroups.forEach((placeGroup, index) => {
      if (isValidPlaceGroup(placeGroup)) {
        layers.push(
          <Vector
            key={index}
            id={`placeGroup.${placeGroup.id}`}
            style={getDefaultPlaceGroupStyle()}
            zIndex={100}
            source={
              new OlVectorSource({
                features: new OlGeoJSONFormat({
                  dataProjection: GEOGRAPHIC_CRS,
                  featureProjection: mapProjection,
                }).readFeatures(placeGroup),
              })
            }
          />,
        );
      }
    });
    return <Layers>{layers}</Layers>;
  },
);

export const visibleInfoCardElementsSelector = createSelector(
  infoCardElementStatesSelector,
  (infoCardElementStates): string[] => {
    const visibleInfoCardElements: string[] = [];
    Object.getOwnPropertyNames(infoCardElementStates).forEach((e) => {
      if (infoCardElementStates[e].visible) {
        visibleInfoCardElements.push(e);
      }
    });
    return visibleInfoCardElements;
  },
);

export const infoCardElementViewModesSelector = createSelector(
  infoCardElementStatesSelector,
  (infoCardElementStates) => {
    const infoCardElementCodeModes: { [elementType: string]: ViewMode } = {};
    Object.getOwnPropertyNames(infoCardElementStates).forEach((e) => {
      infoCardElementCodeModes[e] = infoCardElementStates[e].viewMode || "text";
    });
    return infoCardElementCodeModes;
  },
);

export const activityMessagesSelector = createSelector(
  activitiesSelector,
  (activities: { [id: string]: string }): string[] => {
    return Object.keys(activities).map((k) => activities[k]);
  },
);

export const baseMapsSelector = createSelector(
  userBaseMapsSelector,
  (userBaseMaps): LayerDefinition[] => {
    return [...userBaseMaps, ...defaultBaseMapLayers];
  },
);

export const overlaysSelector = createSelector(
  userOverlaysSelector,
  (userOverlays): LayerDefinition[] => {
    return [...userOverlays, ...defaultOverlayLayers];
  },
);

const getLayerFromLayerDefinition = (
  layerDefs: LayerDefinition[],
  layerId: string | null,
  showLayer: boolean,
  zIndex: number,
): JSX.Element | null => {
  if (!showLayer || !layerId) {
    return null;
  }
  const layerDef = findLayer(layerDefs, layerId);
  if (!layerDef) {
    return null;
  }
  let attributions = layerDef.attribution;
  if (
    attributions &&
    (attributions.startsWith("http://") || attributions.startsWith("https://"))
  ) {
    attributions = `&copy; <a href=&quot;${layerDef.attribution}&quot;>${layerDef.group}</a>`;
  }
  let source: OlTileWMSSource | OlXYZSource;
  if (layerDef.wms) {
    const { layerName, styleName } = layerDef.wms;
    source = new OlTileWMSSource({
      url: layerDef.url,
      params: {
        ...(styleName ? { STYLES: styleName } : {}),
        LAYERS: layerName,
      },
      attributions,
      attributionsCollapsible: true,
    });
  } else {
    const access = getTileAccess(layerDef.group);
    source = new OlXYZSource({
      url: layerDef.url + (access ? `?${access.param}=${access.token}` : ""),
      attributions,
      attributionsCollapsible: true,
    });
  }
  return <Tile id={layerDef.id} source={source} zIndex={zIndex} />;
};

export const baseMapLayerSelector = createSelector(
  baseMapsSelector,
  selectedBaseMapIdSelector,
  showBaseMapLayerSelector,
  () => 0,
  getLayerFromLayerDefinition,
);

export const overlayLayerSelector = createSelector(
  overlaysSelector,
  selectedOverlayIdSelector,
  showOverlayLayerSelector,
  () => 20,
  getLayerFromLayerDefinition,
);

const _getLayerTitle = (layers: LayerDefinition[], layerId: string | null) => {
  const layer = findLayer(layers, layerId);
  return layer ? getLayerTitle(layer) : null;
};

export const selectedBaseMapTitleSelector = createSelector(
  baseMapsSelector,
  selectedBaseMapIdSelector,
  _getLayerTitle,
);

export const selectedOverlayTitleSelector = createSelector(
  overlaysSelector,
  selectedOverlayIdSelector,
  _getLayerTitle,
);

export const layerTitlesSelector = (
  _state: AppState,
): Record<keyof LayerVisibilities, string> => ({
  baseMap: "Base Map",
  datasetRgb: "Dataset RGB",
  datasetVariable2: "Dataset Variable 2",
  datasetVariable: "Dataset Variable",
  datasetBoundary: "Dataset Boundary",
  datasetPlaces: "Dataset Places",
  userPlaces: "User Places",
  overlay: "Overlay",
});

export const layerSubtitlesSelector = createSelector(
  selectedBaseMapTitleSelector,
  selectedOverlayTitleSelector,
  selectedDatasetIdSelector,
  selectedVariableNameSelector,
  selectedDataset2IdSelector,
  selectedVariable2NameSelector,
  (
    baseMapTitle,
    overlayTitle,
    datasetId,
    variableName,
    dataset2Id,
    variable2Name,
  ) =>
    ({
      baseMap: baseMapTitle || undefined,
      overlay: overlayTitle || undefined,
      datasetVariable:
        datasetId && variableName
          ? `${datasetId} / ${variableName}`
          : undefined,
      datasetVariable2:
        dataset2Id && variable2Name
          ? `${dataset2Id} / ${variable2Name}`
          : undefined,
    }) as Record<keyof LayerVisibilities, string>,
);
