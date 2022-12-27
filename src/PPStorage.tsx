import { Viewport } from "pixi-viewport";
import InterfaceController from "./InterfaceController";
import { GESTUREMODE } from "./utils/constants";
import { GraphDatabase } from "./utils/indexedDB";
import { getSetting, setGestureModeOnViewport } from "./utils/utils";
import * as PIXI from 'pixi.js';

(window as any).__PIXI_INSPECTOR_GLOBAL_HOOK__ &&
    (window as any).__PIXI_INSPECTOR_GLOBAL_HOOK__.register({ PIXI: PIXI });

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



    static viewport: Viewport; // WARNING, HACK, this should not be saved, TODO improve
    db: GraphDatabase; // should be private, but lets remove all references to it elsewhere first
    private static instance: PPStorage;
}