import { Viewport } from 'pixi-viewport';
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
import { SerializedGraph } from './utils/interfaces';
import { Graph } from './utils/indexedDB';

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

  constructor() {
    this.db = new GraphDatabase();
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

  async downloadGraph(graphId = undefined) {
    this.db
      .transaction('rw', this.db.graphs, this.db.settings, async () => {
        let serializedGraph;
        let graphName;

        const loadedGraphId = PPGraph.currentGraph.id;

        const graph = await this.db.graphs
          .where('id')
          .equals(graphId || loadedGraphId)
          .first();

        if (graphId && graph) {
          serializedGraph = graph.graphData;
          graphName = graph.name;
        } else {
          serializedGraph = PPGraph.currentGraph.serialize();
          graphName = graph ? graph.name : PPGraph.currentGraph.id;
        }

        downloadFile(
          JSON.stringify(serializedGraph, null, 2),
          `${graphName} - ${formatDate()}.ppgraph`,
          'text/plain',
        );

        InterfaceController.showSnackBar(
          <span>
            Playground <b>{graphName}</b> was saved to your Download folder
          </span>,
        );
      })
      .catch((e) => {
        console.log(e.stack || e);
      });
  }

  deleteGraph(graphId: string): string {
    this.db
      .transaction('rw', this.db.graphs, this.db.settings, async () => {
        const id = await this.db.graphs.where('id').equals(graphId).delete();
        console.log(`Deleted graph: ${id}`);
        InterfaceController.showSnackBar('Playground was deleted');
      })
      .catch((e) => {
        console.log(e.stack || e);
        return undefined;
      });
    return undefined;
  }

  async loadGraphFromData(fileData: SerializedGraph, id: string, name: string) {
    if (checkForUnsavedChanges()) {
      try {
        PPGraph.currentGraph.configure(fileData, id);

        InterfaceController.notifyListeners(ListenEvent.GraphChanged, {
          id,
          name,
        });

        InterfaceController.showSnackBar('Playground was loaded', {
          variant: 'default',
          autoHideDuration: 8000,
          action: (key) => (
            <SaveOrDismiss
              saveClick={() => {
                this.saveNewGraph();
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
          autoHideDuration: 8000,
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
          autoHideDuration: 8000,
        },
      );
      return undefined;
    }
  }

  async getGraphNameFromDB(graphId: string): Promise<undefined | string> {
    try {
      const graph = await this.db.graphs.get(graphId);
      return graph.name;
    } catch (e) {
      console.log(e.stack || e);
      return '';
    }
  }

  async getGraphFromDB(id: string): Promise<undefined | Graph> {
    try {
      const loadedGraph = await this.db.graphs.get(id);
      return loadedGraph;
    } catch (e) {
      console.log(e.stack || e);
      return undefined;
    }
  }

  async loadGraphFromDB(id = PPGraph.currentGraph.id): Promise<void> {
    let loadedGraph = await this.getGraphFromDB(id);
    // check if graph exists and load last saved graph if it does not
    if (loadedGraph === undefined) {
      const graphs = await this.db.graphs.toArray();
      loadedGraph = graphs.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      )?.[0];
    }

    // see if we found something to load
    if (loadedGraph !== undefined) {
      const graphData: SerializedGraph = loadedGraph.graphData;
      await PPGraph.currentGraph.configure(graphData, loadedGraph.id, false);

      InterfaceController.notifyListeners(ListenEvent.GraphChanged, {
        id: loadedGraph.id,
        name: loadedGraph.name,
      });

      InterfaceController.showSnackBar(
        <span>
          <b>{loadedGraph.name}</b> was loaded
        </span>,
      );

      updateLocalIdInURL(loadedGraph.id);
    } else {
      this.loadGraphFromURL(getExampleURL('', GET_STARTED_GRAPH));
    }

    ActionHandler.setUnsavedChange(false);
  }

  async renameGraph(graphId: string, newName: string) {
    const loadedGraph = await this.getGraphFromDB(graphId);
    if (loadedGraph.name !== newName) {
      await this.db.graphs.update(graphId, { name: newName });
      InterfaceController.showSnackBar(
        <span>
          Name changed to <b>{newName}</b>
        </span>,
      );
    }
  }

  async saveGraphAction(saveNew = false, newName = undefined) {
    const serializedGraph = PPGraph.currentGraph.serialize();
    const loadedGraphId = PPGraph.currentGraph.id;
    const existingGraph: Graph = await this.getGraphFromDB(loadedGraphId);

    if (saveNew || existingGraph === undefined) {
      const newId = hri.random();
      const name =
        newName ?? newId.substring(0, newId.lastIndexOf('-')).replace('-', ' ');
      await this.saveGraphToDabase(newId, serializedGraph, name);
      PPGraph.currentGraph.id = newId;
      InterfaceController.notifyListeners(ListenEvent.GraphChanged, {
        id: newId,
        name,
      });
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
    await this.db.graphs.put({
      id,
      name: name,
      graphData,
      date: new Date(),
    });
    InterfaceController.showSnackBar(
      <span>
        Playground <b>{name}</b> was saved
      </span>,
    );
  }

  saveNewGraph(newName = undefined) {
    this.saveGraphAction(true, newName);
  }

  async cloneRemoteGraph(nameOfFileToClone) {
    if (checkForUnsavedChanges()) {
      const fileData = await this.getRemoteGraph(nameOfFileToClone);
      PPGraph.currentGraph.configure(fileData, hri.random());

      const newName = `${removeExtension(nameOfFileToClone)} - copy`; // remove .ppgraph extension and add copy
      InterfaceController.showSnackBar('Remote playground was loaded', {
        variant: 'default',
        autoHideDuration: 4000,
        action: (key) => (
          <SaveOrDismiss
            saveClick={() => this.saveNewGraph(newName)}
            dismissClick={() => InterfaceController.hideSnackBar(key)}
          />
        ),
      });
      ActionHandler.setUnsavedChange(false);
    }
  }

  async getGraphs(): Promise<any[]> {
    return await PPStorage.getInstance()
      .db.graphs.toCollection()
      .sortBy('date');
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
