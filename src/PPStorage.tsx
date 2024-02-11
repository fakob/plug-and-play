import { Viewport } from 'pixi-viewport';
import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';
import InterfaceController, { ListenEvent } from './InterfaceController';
import { GESTUREMODE, GET_STARTED_GRAPH } from './utils/constants';
import { ActionHandler } from './utils/actionHandler';
import { GraphDatabase } from './utils/indexedDB';
import {
  downloadFile,
  formatDate,
  getExampleURL,
  getFileNameFromLocalResourceId,
  getSetting,
  removeExtension,
  setGestureModeOnViewport,
  updateLocalIdInURL,
} from './utils/utils';
import * as PIXI from 'pixi.js';
import PPGraph from './classes/GraphClass';
import { hri } from 'human-readable-ids';
import { Button } from '@mui/material';
import React from 'react';
import { IGraphSearch, SerializedGraph } from './utils/interfaces';
import { GraphMeta } from './utils/indexedDB';

TimeAgo.addDefaultLocale(en);
const timeAgo = new TimeAgo('en-US');

(window as any).__PIXI_INSPECTOR_GLOBAL_HOOK__ &&
  (window as any).__PIXI_INSPECTOR_GLOBAL_HOOK__.register({ PIXI: PIXI });

function SaveOrDismiss(props) {
  return (
    <>
      <Button size="small" onClick={props.saveClick}>
        Save
      </Button>
      <Button size="small" onClick={props.dismissClick}>
        Dismiss
      </Button>
    </>
  );
}

// this function is a bit messed up TODO refactor
function detectTrackPad(event) {
  let isTrackpad = false;
  if (event.wheelDeltaY) {
    if (event.wheelDeltaY === event.deltaY * -3) {
      isTrackpad = true;
    }
  } else if (event.deltaMode === 0) {
    isTrackpad = true;
  }

  const gestureMode = isTrackpad ? GESTUREMODE.TRACKPAD : GESTUREMODE.MOUSE;
  setGestureModeOnViewport(PPStorage.viewport, gestureMode);
  InterfaceController.showSnackBar(`${gestureMode} detected`);

  // unsubscribe from mousewheel again
  window.removeEventListener('mousewheel', detectTrackPad);
  window.removeEventListener('DOMMouseScroll', detectTrackPad);
}

export function checkForUnsavedChanges(): boolean {
  return (
    !ActionHandler.existsUnsavedChanges() ||
    window.confirm('Changes that you made may not be saved. OK to continue?')
  );
}

export default class PPStorage {
  public static getInstance(): PPStorage {
    if (!this.instance) {
      this.instance = new PPStorage();
    }
    return this.instance;
  }

  debug_timesLoaded;
  constructor() {
    this.db = new GraphDatabase();
    this.debug_timesLoaded = 0;
  }

  applyGestureMode(viewport: Viewport, newGestureMode = undefined) {
    PPStorage.viewport = viewport;
    this.db
      .transaction('rw', this.db.settings, async () => {
        let gestureMode = newGestureMode;
        if (gestureMode) {
          // save newGestureMode
          await this.db.settings.put({
            name: 'gestureMode',
            value: gestureMode,
          });
        } else {
          // get saved gestureMode
          gestureMode = await getSetting(this.db, 'gestureMode');
          console.log(gestureMode);
        }

        if (
          gestureMode === GESTUREMODE.MOUSE ||
          gestureMode === GESTUREMODE.TRACKPAD
        ) {
          const otherMode =
            gestureMode === GESTUREMODE.MOUSE
              ? GESTUREMODE.TRACKPAD
              : GESTUREMODE.MOUSE;
          setGestureModeOnViewport(viewport, gestureMode);
          InterfaceController.showSnackBar(
            `GestureMode is set to: ${gestureMode}`,
            {
              action: (key) => (
                <Button
                  size="small"
                  onClick={() => {
                    this.applyGestureMode(
                      PPGraph.currentGraph.viewport,
                      otherMode,
                    );
                    InterfaceController.hideSnackBar(key);
                  }}
                >
                  Switch to {otherMode}
                </Button>
              ),
            },
          );
        } else {
          // subscribe to mousewheel event to detect pointer device
          window.addEventListener('mousewheel', detectTrackPad, false);
          window.addEventListener('DOMMouseScroll', detectTrackPad, false);
        }
      })
      .catch((e) => {
        console.log(e.stack || e);
      });
  }

  getRemoteGraph = async (fileName: string): Promise<any> => {
    try {
      const file = await fetch(`assets/examples/${fileName}`);
      const fileData = await file.json();
      return fileData;
    } catch (error) {
      return undefined;
    }
  };

  getRemoteGraphsList = async (timeouts = 10): Promise<string[]> => {
    if (timeouts == 0) {
      return [];
    }
    try {
      const fileList = await fetch(`/listExamples`);
      const fileListData = await fileList.json();
      return fileListData.files;
    } catch (error) {
      console.log('Failed to fetch remote graphs: ' + error);
      await new Promise((r) => setTimeout(r, 100));
      return this.getRemoteGraphsList(timeouts - 1);
    }
  };

  HEADLESS_PORT = 16301;

  getLocallyProvidedGraph = async (graphName): Promise<SerializedGraph> => {
    try {
      console.log(`Fetching local graph: ${graphName}`);
      const fileList = await fetch(
        `http://localhost:${this.HEADLESS_PORT}/graphs/${graphName}`,
      );
      return fileList.json();
    } catch (error) {
      console.log('Failed to fetch local graph: ' + error);
    }
  };

  downloadSerializedGraph(graph: SerializedGraph, name: string) {
    downloadFile(
      JSON.stringify(graph, null, 2),
      `${name} - ${formatDate()}.ppgraph`,
      'text/plain',
    );
  }

  async downloadCurrentGraph() {
    const serializedCurrentGraph = PPGraph.currentGraph.serialize();
    this.downloadSerializedGraph(
      serializedCurrentGraph,
      PPGraph.currentGraph.name,
    );
  }

  async downloadGraph(graphId: string) {
    const meta = await this.db.graphs_meta.get(graphId);
    const data = await this.db.graphs_data.get(graphId);

    if (meta !== undefined && data !== undefined) {
      this.downloadSerializedGraph(data.graphData, meta.name);
      InterfaceController.showSnackBar(
        <span>
          Playground <b>{meta.name}</b> was saved to your Download folder
        </span>,
      );
    } else {
      console.error(
        "Unable to download graph, not found in database (this shouldn't happen unless its a migration thing!)",
      );
    }
  }

  deleteAllGraphs(): void {
    this.db.graphs_data.clear();
    this.db.graphs_meta.clear();
    InterfaceController.onGraphListChanged();
    InterfaceController.showSnackBar('Playground was deleted');
  }

  deleteGraph(graphId: string): void {
    this.db.graphs_data.delete(graphId);
    this.db.graphs_meta.delete(graphId);
    InterfaceController.onGraphListChanged();
    InterfaceController.showSnackBar('Playground was deleted');
  }

  async loadGraphFromData(fileData: SerializedGraph, id: string, name: string) {
    if (checkForUnsavedChanges()) {
      try {
        PPGraph.currentGraph.configure(fileData, id, name);

        InterfaceController.notifyListeners(ListenEvent.GraphChanged, {
          id,
          name,
        });

        InterfaceController.showSnackBar('Playground was loaded', {
          variant: 'default',
          autoHideDuration: 5000,
          action: (key) => (
            <SaveOrDismiss
              saveClick={() => {
                this.saveGraphAction(true);
                InterfaceController.hideSnackBar(key);
              }}
              dismissClick={() => InterfaceController.hideSnackBar(key)}
            />
          ),
        });

        return fileData;
      } catch (error) {
        InterfaceController.showSnackBar('Loading playground failed.', {
          variant: 'error',
        });
        return undefined;
      }
    }
  }

  async loadGraphFromURL(loadURL: string) {
    try {
      const file = await fetch(loadURL);
      const fileData = await file.json();
      const id = hri.random();
      return await this.loadGraphFromData(fileData, id, id);
    } catch (error) {
      InterfaceController.showSnackBar(
        `Loading playground from link in URL failed: ${loadURL}`,
        {
          variant: 'error',
          autoHideDuration: 5000,
        },
      );
      return undefined;
    }
  }

  async getGraphNameFromDB(graphId: string): Promise<undefined | string> {
    try {
      const graph = await this.db.graphs_meta.get(graphId);
      return graph.name;
    } catch (e) {
      console.log(e.stack || e);
      return '';
    }
  }

  async loadGraphFromDB(id = PPGraph.currentGraph.id): Promise<void> {
    this.debug_timesLoaded += 1;
    console.trace();
    if (checkForUnsavedChanges()) {
      let foundGraphToLoad = false;
      let loadedGraphMeta = await this.db.graphs_meta.get(id); //await this.getGraphFromDB(id);

      // check if graph exists and load last saved graph if it does not
      if (loadedGraphMeta === undefined) {
        loadedGraphMeta = (
          await this.db.graphs_meta.toCollection().sortBy('date')
        )
          .reverse()
          .at(0);
      }

      // see if we found something to load
      if (loadedGraphMeta !== undefined) {
        const storedGraph = await this.db.graphs_data.get(loadedGraphMeta.id);
        if (storedGraph !== undefined) {
          foundGraphToLoad = true;
          const graphData: SerializedGraph = storedGraph.graphData;
          await PPGraph.currentGraph.configure(
            graphData,
            loadedGraphMeta.id,
            loadedGraphMeta.name,
          );

          InterfaceController.notifyListeners(ListenEvent.GraphChanged, {
            id: loadedGraphMeta.id,
            name: loadedGraphMeta.name,
          });

          InterfaceController.showSnackBar(
            <span>
              <b>{loadedGraphMeta.name}</b> was loaded
            </span>,
          );

          updateLocalIdInURL(loadedGraphMeta.id);
        }
      }
      if (!foundGraphToLoad) {
        this.loadGraphFromURL(getExampleURL('', GET_STARTED_GRAPH));
      }

      ActionHandler.setUnsavedChange(false);
    }
  }

  idToGraphName(id: string): string {
    return id.substring(0, id.lastIndexOf('-')).replace('-', ' ');
  }

  async renameGraph(graphId: string, newName: string) {
    const loadedGraph = await this.db.graphs_meta.get(graphId);
    if (loadedGraph !== undefined && loadedGraph.name !== newName) {
      await this.db.graphs_meta.update(graphId, { name: newName });
      loadedGraph.name = newName;
      InterfaceController.onGraphListChanged();
      InterfaceController.showSnackBar(
        <span>
          Name changed to <b>{newName}</b>
        </span>,
      );
    }
  }

  async saveGraphAction(
    saveNew = false,
    name = this.idToGraphName(PPGraph.currentGraph.id),
  ) {
    const serializedGraph = PPGraph.currentGraph.serialize();
    const loadedGraphId = PPGraph.currentGraph.id;
    const existingGraph: GraphMeta =
      await this.db.graphs_meta.get(loadedGraphId);

    if (saveNew || existingGraph === undefined) {
      const newId = hri.random();
      PPGraph.currentGraph.id = newId;
      PPGraph.currentGraph.name = name;
      await this.saveGraphToDabase(newId, serializedGraph, name);
      InterfaceController.onGraphListChanged();
      InterfaceController.notifyListeners(ListenEvent.GraphChanged, {
        id: newId,
        name,
      });
      updateLocalIdInURL(newId);
    } else {
      await this.saveGraphToDabase(
        existingGraph.id,
        serializedGraph,
        existingGraph.name,
      );
    }
    ActionHandler.setUnsavedChange(false);
  }

  async saveGraphToDabase(id: string, graphData: SerializedGraph, name) {
    await this.db.graphs_meta.put({
      id,
      name: name,
      date: new Date(),
    });
    await this.db.graphs_data.put({ id, graphData });

    InterfaceController.showSnackBar(
      <span>
        Playground <b>{name}</b> was saved
      </span>,
    );
  }

  async cloneRemoteGraph(nameOfFileToClone) {
    if (checkForUnsavedChanges()) {
      const fileData = await this.getRemoteGraph(nameOfFileToClone);
      const nameID = hri.random();
      const newName = `${removeExtension(nameOfFileToClone)} - copy`; // remove .ppgraph extension and add copy
      PPGraph.currentGraph.configure(fileData, nameID, newName);

      InterfaceController.showSnackBar('Remote playground was loaded', {
        variant: 'default',
        autoHideDuration: 5000,
        action: (key) => (
          <SaveOrDismiss
            saveClick={() => this.saveGraphAction(true, newName)}
            dismissClick={() => InterfaceController.hideSnackBar(key)}
          />
        ),
      });
      ActionHandler.setUnsavedChange(false);
    }
  }

  async getGraphsList(): Promise<IGraphSearch[]> {
    const graphs = await PPStorage.getInstance()
      .db.graphs_meta.toCollection()
      .reverse()
      .sortBy('date');
    return graphs.map((graph) => {
      return {
        id: graph.id,
        name: graph.name,
        label: `saved ${timeAgo.format(graph.date)}`,
      } as IGraphSearch;
    });
  }

  async getResources(): Promise<any[]> {
    return await PPStorage.getInstance()
      .db.localResources.toCollection()
      .sortBy('date');
  }

  async loadResource(resourceId: string): Promise<Blob> {
    let foundResource;
    return this.db
      .transaction('rw', this.db.localResources, async () => {
        const resources = await this.db.localResources.toArray();

        if (resources.length > 0) {
          foundResource = resources.find(
            (resource) => resource.id === resourceId,
          );
          if (foundResource) {
            InterfaceController.showSnackBar(
              <span>
                <b>{getFileNameFromLocalResourceId(resourceId)}</b> was loaded
                from the local storage
              </span>,
            );
            return foundResource.data;
          }
        }
        console.log('Resource not found');
        return undefined;
      })
      .catch((e) => {
        console.log(e.stack || e);
        return undefined;
      });
  }

  storeResource(resourceId: string, size: number, data: Blob, name: string) {
    this.db
      .transaction('rw', this.db.localResources, async () => {
        const resources = await this.db.localResources.toArray();
        const foundResource = resources.find(
          (resource) => resource.id === resourceId,
        );
        const fileName = getFileNameFromLocalResourceId(resourceId);

        if (foundResource === undefined) {
          await this.db.localResources.put({
            id: resourceId,
            size,
            date: new Date(),
            data,
            name,
          });

          InterfaceController.showSnackBar(
            <span>
              <b>{fileName}</b> is stored in the local storage
            </span>,
          );
          console.log(`Resource ${resourceId} was stored`);
        } else {
          await this.db.localResources.where('id').equals(resourceId).modify({
            date: new Date(),
            data,
          });
          console.log(`Resource ${resourceId} was updated`);
        }
        InterfaceController.notifyListeners(ListenEvent.ResourceUpdated, {
          id: resourceId,
        });
      })
      .catch((e) => {
        console.log(e.stack || e);
      });
  }

  static viewport: Viewport; // WARNING, HACK, this should not be saved, TODO improve
  private db: GraphDatabase; // spent a lot of effort making this private, if you want to do something with it, please go through this class
  private static instance: PPStorage;
}
