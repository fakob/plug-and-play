import { Viewport } from 'pixi-viewport';
import InterfaceController, { ListenEvent } from './InterfaceController';
import { GESTUREMODE, GET_STARTED_URL } from './utils/constants';
import { ActionHandler } from './utils/actionHandler';
import { GraphDatabase } from './utils/indexedDB';
import {
  downloadFile,
  formatDate,
  getSetting,
  removeExtension,
  setGestureModeOnViewport,
} from './utils/utils';
import * as PIXI from 'pixi.js';
import PPGraph from './classes/GraphClass';
import { hri } from 'human-readable-ids';
import { Button } from '@mui/material';
import React from 'react';
import { SerializedGraph } from './utils/interfaces';

(window as any).__PIXI_INSPECTOR_GLOBAL_HOOK__ &&
  (window as any).__PIXI_INSPECTOR_GLOBAL_HOOK__.register({ PIXI: PIXI });

// remote playground database
const githubBaseURL =
  'https://api.github.com/repos/fakob/plug-and-play-examples';
const githubBranchName = 'dev';

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

function checkForUnsavedChanges(): boolean {
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
          setGestureModeOnViewport(viewport, gestureMode);
          InterfaceController.showSnackBar(
            `GestureMode is set to: ${gestureMode}`
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
      const file = await fetch(
        `${githubBaseURL}/contents/${fileName}?ref=${githubBranchName}`,
        {
          headers: {
            accept: 'application/vnd.github.v3.raw',
          },
        }
      );
      const fileData = await file.json();
      return fileData;
    } catch (error) {
      return undefined;
    }
  };

  getRemoteGraphsList = async (): Promise<string[]> => {
    try {
      const branches = await fetch(
        `${githubBaseURL}/branches/${githubBranchName}`,
        {
          headers: {
            accept: 'application/vnd.github.v3+json',
          },
        }
      );
      const branchesData = await branches.json();
      const sha = branchesData.commit.sha;

      const fileList = await fetch(`${githubBaseURL}/git/trees/${sha}`, {
        headers: {
          accept: 'application/vnd.github.v3+json',
        },
      });
      const fileListData = await fileList.json();
      const files = fileListData.tree;
      const arrayOfFileNames = files.map((file) => file.path);

      return arrayOfFileNames;
    } catch (error) {
      return [];
    }
  };

  downloadGraph() {
    this.db
      .transaction('rw', this.db.graphs, this.db.settings, async () => {
        const loadedGraphId = await getSetting(this.db, 'loadedGraphId');
        const graph = await this.db.graphs
          .where('id')
          .equals(loadedGraphId)
          .first();

        const serializedGraph = PPGraph.currentGraph.serialize();
        downloadFile(
          JSON.stringify(serializedGraph, null, 2),
          `${graph?.name} - ${formatDate()}.ppgraph`,
          'text/plain'
        );
        InterfaceController.showSnackBar(
          'Playground was saved to your Download folder'
        );
      })
      .catch((e) => {
        console.log(e.stack || e);
      });
  }

  deleteGraph(graphId: string): string {
    this.db
      .transaction('rw', this.db.graphs, this.db.settings, async () => {
        const loadedGraphId = await getSetting(this.db, 'loadedGraphId');

        const id = await this.db.graphs.where('id').equals(graphId).delete();
        console.log(`Deleted graph: ${id}`);
        InterfaceController.showSnackBar('Playground was deleted');

        return loadedGraphId;
      })
      .catch((e) => {
        console.log(e.stack || e);
        return undefined;
      });
    return undefined;
  }

  async loadGraphFromData(fileData: SerializedGraph) {
    if (checkForUnsavedChanges()) {
      try {
        PPGraph.currentGraph.configure(fileData);

        // unset loadedGraphId
        await this.db.settings.put({
          name: 'loadedGraphId',
          value: undefined,
        });

        const newName = hri.random();
        InterfaceController.showSnackBar('Playground was loaded', {
          variant: 'default',
          autoHideDuration: 20000,
          action: (key) => (
            <SaveOrDismiss
              saveClick={() => this.saveNewGraph(newName)}
              dismissClick={() => InterfaceController.hideSnackBar(key)}
            />
          ),
        });
        return fileData;
      } catch (error) {
        InterfaceController.showSnackBar('Loading playground failed.', {
          variant: 'error',
          autoHideDuration: 20000,
        });
        return undefined;
      }
    }
  }

  async loadGraphFromURL(loadURL: string) {
    try {
      const file = await fetch(loadURL, {});
      const fileData = await file.json();
      return await this.loadGraphFromData(fileData);
    } catch (error) {
      InterfaceController.showSnackBar(
        `Loading playground from link in URL failed: ${loadURL}`,
        {
          variant: 'error',
          autoHideDuration: 20000,
        }
      );
      return undefined;
    }
  }

  async loadGraphFromDB(id = undefined) {
    let loadedGraph;
    if (checkForUnsavedChanges()) {
      await this.db
        .transaction('rw', this.db.graphs, this.db.settings, async () => {
          const graphs = await this.db.graphs.toArray();
          const loadedGraphId = await getSetting(this.db, 'loadedGraphId');

          if (graphs.length > 0) {
            loadedGraph = graphs.find(
              (graph) => graph.id === (id || loadedGraphId)
            );

            // check if graph exists and load last saved graph if it does not
            if (loadedGraph === undefined) {
              loadedGraph = graphs.reduce((a, b) => {
                return new Date(a.date) > new Date(b.date) ? a : b;
              });
            }

            // update loadedGraphId
            await this.db.settings.put({
              name: 'loadedGraphId',
              value: loadedGraph.id,
            });
          } else {
            console.log('No saved graphData');
          }
        })
        .catch((e) => {
          console.log(e.stack || e);
        });
      if (loadedGraph) {
        const graphData = loadedGraph.graphData;
        await PPGraph.currentGraph.configure(graphData, false);

        InterfaceController.notifyListeners(ListenEvent.GraphChanged, {
          id: loadedGraph.id,
          name: loadedGraph.name,
        });

        InterfaceController.showSnackBar(`${loadedGraph.name} was loaded`);
      } else {
        // load get started graph if there is no saved graph
        this.loadGraphFromURL(GET_STARTED_URL);
      }
      ActionHandler.setUnsavedChange(false);
    }
  }

  renameGraph(
    graphId: number,
    newName = undefined,
    setActionObject: any,
    updateGraphSearchItems: any
  ) {
    this.db
      .transaction('rw', this.db.graphs, this.db.settings, async () => {
        const id = await this.db.graphs.where('id').equals(graphId).modify({
          name: newName,
        });
        setActionObject({ id: graphId, name: newName });
        updateGraphSearchItems();
        console.log(`Renamed graph: ${id} to ${newName}`);
        InterfaceController.showSnackBar(
          `Playground was renamed to ${newName}`
        );
      })
      .catch((e) => {
        console.log(e.stack || e);
      });
  }

  saveGraph(saveNew = false, newName = undefined) {
    const serializedGraph = PPGraph.currentGraph.serialize();
    console.log(serializedGraph);
    this.db
      .transaction('rw', this.db.graphs, this.db.settings, async () => {
        const graphs = await this.db.graphs.toArray();
        const loadedGraphId = await getSetting(this.db, 'loadedGraphId');

        const id = hri.random();
        const tempName = id.substring(0, id.lastIndexOf('-')).replace('-', ' ');

        const loadedGraph = graphs.find((graph) => graph.id === loadedGraphId);

        if (saveNew || graphs.length === 0 || loadedGraph === undefined) {
          const name = newName ?? tempName;
          const indexId = await this.db.graphs.put({
            id,
            date: new Date(),
            name,
            graphData: serializedGraph,
          });

          // save loadedGraphId
          await this.db.settings.put({
            name: 'loadedGraphId',
            value: id,
          });

          InterfaceController.notifyListeners(ListenEvent.GraphChanged, {
            id,
            name,
          });

          InterfaceController.showSnackBar('New playground was saved');
        } else {
          const indexId = await this.db.graphs
            .where('id')
            .equals(loadedGraphId)
            .modify({
              date: new Date(),
              graphData: serializedGraph,
            });
          console.log(`Updated currentGraph: ${indexId}`);
          InterfaceController.showSnackBar('Playground was saved');
        }
        ActionHandler.setUnsavedChange(false);
      })
      .catch((e) => {
        console.log(e.stack || e);
      });
  }

  saveNewGraph(newName = undefined) {
    this.saveGraph(true, newName);
  }

  async cloneRemoteGraph(id = undefined, remoteGraphsRef: any) {
    if (checkForUnsavedChanges()) {
      const nameOfFileToClone = remoteGraphsRef.current[id];
      const fileData = await this.getRemoteGraph(nameOfFileToClone);
      PPGraph.currentGraph.configure(fileData);

      // unset loadedGraphId
      await this.db.settings.put({
        name: 'loadedGraphId',
        value: undefined,
      });

      const newName = `${removeExtension(remoteGraphsRef.current[id])} - copy`; // remove .ppgraph extension and add copy
      InterfaceController.showSnackBar('Remote playground was loaded', {
        variant: 'default',
        autoHideDuration: 20000,
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
  async getLoadedGraphID(): Promise<string> {
    return await getSetting(PPStorage.getInstance().db, 'loadedGraphId');
  }

  static viewport: Viewport; // WARNING, HACK, this should not be saved, TODO improve
  private db: GraphDatabase; // spent a lot of effort making this private, if you want to do something with it, please go through this class
  private static instance: PPStorage;
}
