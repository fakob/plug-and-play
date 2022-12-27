import { Viewport } from "pixi-viewport";
import InterfaceController from "./InterfaceController";
import { GESTUREMODE } from "./utils/constants";
import { GraphDatabase } from "./utils/indexedDB";
import { getSetting, setGestureModeOnViewport } from "./utils/utils";
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


    public async cloneRemoteGraph(id = undefined) {
        const nameOfFileToClone = remoteGraphsRef.current[id];
        const fileData = await PPStorage.getInstance().getRemoteGraph(
            nameOfFileToClone
        );
        console.log(fileData);
        PPGraph.currentGraph.configure(fileData);

        // unset loadedGraphId
        await PPStorage.getInstance().db.settings.put({
            name: 'loadedGraphId',
            value: undefined,
        });

        const newName = `${removeExtension(remoteGraphsRef.current[id])} - copy`; // remove .ppgraph extension and add copy
        enqueueSnackbar('Remote playground was loaded', {
            variant: 'default',
            autoHideDuration: 20000,
            action: (key) => (
                <>
                    <Button size="small" onClick={() => saveNewGraph(newName)}>
                        Save
                    </Button>
                    <Button size="small" onClick={() => closeSnackbar(key)}>
                        Dismiss
                    </Button>
                </>
            ),
        });
    }

    public getRemoteGraph = async (
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

    public getRemoteGraphsList = async (
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



    static viewport: Viewport; // TODO WARNING, HACK, this should not be persisted
    db: GraphDatabase; // TODO should be private, but lets remove all references to it elsewhere first
    private static instance: PPStorage;
}