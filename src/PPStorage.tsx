import { Viewport } from "pixi-viewport";
import InterfaceController from "./InterfaceController";
import { GESTUREMODE } from "./utils/constants";
import { GraphDatabase } from "./utils/indexedDB";
import { downloadFile, formatDate, getSetting, setGestureModeOnViewport } from "./utils/utils";
import * as PIXI from 'pixi.js';
import PPGraph from "./classes/GraphClass";

(window as any).__PIXI_INSPECTOR_GLOBAL_HOOK__ &&
    (window as any).__PIXI_INSPECTOR_GLOBAL_HOOK__.register({ PIXI: PIXI });


// remote playground database
const githubBaseURL =
    'https://api.github.com/repos/fakob/plug-and-play-examples';
const githubBranchName = 'dev';

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
        PPStorage.getInstance().db.transaction('rw', PPStorage.getInstance().db.settings, async () => {
            let gestureMode = newGestureMode;
            if (gestureMode) {
                // save newGestureMode
                await PPStorage.getInstance().db.settings.put({
                    name: 'gestureMode',
                    value: gestureMode,
                });
            } else {
                // get saved gestureMode
                gestureMode = await getSetting(PPStorage.getInstance().db, 'gestureMode');
                console.log(gestureMode);
            }

            if (
                gestureMode === GESTUREMODE.MOUSE ||
                gestureMode === GESTUREMODE.TRACKPAD
            ) {
                setGestureModeOnViewport(viewport, gestureMode);
                InterfaceController.showSnackBar(`GestureMode is set to: ${gestureMode}`);
            } else {
                // subscribe to mousewheel event to detect pointer device
                window.addEventListener('mousewheel', detectTrackPad, false);
                window.addEventListener('DOMMouseScroll', detectTrackPad, false);
            }
        }).catch((e) => {
            console.log(e.stack || e);
        });
    }


    getRemoteGraph = async (
        fileName: string
    ): Promise<any> => {
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

    getRemoteGraphsList = async (
    ): Promise<string[]> => {
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
        this.db.transaction('rw', this.db.graphs, this.db.settings, async () => {
            const loadedGraphId = await getSetting(this.db, 'loadedGraphId');
            const graph = await this.db.graphs.where('id').equals(loadedGraphId).first();

            const serializedGraph = PPGraph.currentGraph.serialize();
            downloadFile(
                JSON.stringify(serializedGraph, null, 2),
                `${graph?.name} - ${formatDate()}.ppgraph`,
                'text/plain'
            );
            InterfaceController.showSnackBar('Playground was saved to your Download folder');
        }).catch((e) => {
            console.log(e.stack || e);
        });
    }


    deleteGraph(graphId: string): string {
        this.db.transaction('rw', this.db.graphs, this.db.settings, async () => {
            const loadedGraphId = await getSetting(this.db, 'loadedGraphId');

            const id = await PPStorage.getInstance().db.graphs.where('id').equals(graphId).delete();
            console.log(`Deleted graph: ${id}`);
            InterfaceController.showSnackBar('Playground was deleted');

            return loadedGraphId;
        }).catch((e) => {
            console.log(e.stack || e);
            return undefined;
        });
        return undefined;
    }

    static viewport: Viewport; // WARNING, HACK, this should not be saved, TODO improve
    db: GraphDatabase; // should be private, but lets remove all references to it elsewhere first
    private static instance: PPStorage;
}