/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2019-2021 by the xcube development team and contributors.
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

import { Dataset } from '../model/dataset';
import { Place, PlaceGroup, } from '../model/place';
import { TimeSeriesGroup } from '../model/timeSeries';
import { ColorBars } from '../model/colorBar';
import { Server, ServerInfo } from "../model/server";
import { getApiServers, I18N } from '../config';
import { loadUserServers } from './userSettings';

export interface DataState {
    serverInfo: ServerInfo | null;
    datasets: Dataset[];
    colorBars: ColorBars | null;
    timeSeriesGroups: TimeSeriesGroup[];
    userPlaceGroup: PlaceGroup;
    userServers: Server[];
}

export function newDataState(): DataState {
    const extraUserServers = loadUserServers();
    const userServers = [...getApiServers()];
    extraUserServers.forEach(extraUserServer => {
        if (!userServers.find(userServer => userServer.id === extraUserServer.id)) {
            userServers.push(extraUserServer);
        }
    });
    return {
        serverInfo: null,
        datasets: [],
        colorBars: null,
        timeSeriesGroups: [],
        userPlaceGroup: {
            id: 'user',
            title: I18N.get('My places'),
            type: "FeatureCollection",
            features: [] as Array<Place>
        },
        userServers,
    };
}

