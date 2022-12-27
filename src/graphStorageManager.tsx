import { Button } from "@mui/material";
import React from "react";
import PPGraph from "./classes/GraphClass";
import { GraphDatabase } from "./utils/indexedDB";
import { getSetting, removeExtension, downloadFile, formatDate } from "./utils/utils";
import { hri } from 'human-readable-ids';
import InterfaceController from "./InterfaceController";

// remote playground database
const githubBaseURL =
    'https://api.github.com/repos/fakob/plug-and-play-examples';
const githubBranchName = 'dev';

export default class GraphStorageManager {

    static getInstance() {
        if (!this.instance) {
            this.instance = new GraphStorageManager();
        }
        return this.instance;
    }

    constructor() {
        this.db = new GraphDatabase();
    }
    private static instance: GraphStorageManager;
    db: GraphDatabase;

    saveNewGraph(newName = undefined) {
        this.saveGraph(true, newName);
    }

    renameGraph(graphId: number, newName = undefined) {
        this.db.transaction('rw', this.db.graphs, this.db.settings, async () => {
            const id = await this.db.graphs.where('id').equals(graphId).modify({
                name: newName,
            });

        }).catch((e) => {
            console.log(e.stack || e);
        });
    }

    deleteGraph(graphId: string) {
        console.log(graphId);
        this.db.transaction('rw', this.db.graphs, this.db.settings, async () => {
            const loadedGraphId = await getSetting(this.db, 'loadedGraphId');
            const id = await this.db.graphs.where('id').equals(graphId).delete();
            // if the current graph was deleted load last saved graph
            if (loadedGraphId === graphId) {
                this.loadGraph();
            }
        }).catch((e) => {
            console.log(e.stack || e);
        });
    }

    saveGraph(saveNew = false, newName = undefined) {
        const serializedGraph = PPGraph.currentGraph.serialize();
        console.log(serializedGraph);
        this.db.transaction('rw', this.db.graphs, this.db.settings, async () => {
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
        }).catch((e) => {
            console.log(e.stack || e);
        });
    }

    // returns true on success
    async loadGraph(id = undefined): Promise<any> {
        let loadedGraph;
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

            InterfaceController.showSnackBar(`${loadedGraph.name} was loaded`);
            return loadedGraph;
        }
        return undefined;
    }

    async loadGraphFromURL(loadURL: string) {
        try {
            const file = await fetch(loadURL, {});
            const fileData = await file.json();
            console.log(fileData);
            PPGraph.currentGraph.configure(fileData);

            // unset loadedGraphId
            await this.db.settings.put({
                name: 'loadedGraphId',
                value: undefined,
            });

            const newName = hri.random();
            InterfaceController.showSnackBar('Playground from link in URL was loaded', {
                variant: 'default',
                autoHideDuration: 20000,
                action: (key) => (
                    <>
                        <Button size="small" onClick={() => this.saveNewGraph(newName)}>
                            Save
                        </Button>
                        <Button size="small" onClick={() => InterfaceController.hideSnackBar(key)}>
                            Dismiss
                        </Button>
                    </>
                ),
            });
            return fileData;
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

    async cloneRemoteGraph(id = undefined) {
        const nameOfFileToClone = this.getRemoteGraphsList()[id];
        const fileData = await this.getRemoteGraph(
            githubBaseURL,
            githubBranchName,
            nameOfFileToClone
        );
        console.log(fileData);
        PPGraph.currentGraph.configure(fileData);

        // unset loadedGraphId
        await this.db.settings.put({
            name: 'loadedGraphId',
            value: undefined,
        });

        const newName = `${removeExtension(this.getRemoteGraphsList()[id])} - copy`; // remove .ppgraph extension and add copy
        InterfaceController.showSnackBar('Remote playground was loaded', {
            variant: 'default',
            autoHideDuration: 20000,
            action: (key) => (
                <>
                    <Button size="small" onClick={() => this.saveNewGraph(newName)}>
                        Save
                    </Button>
                    <Button size="small" onClick={() => InterfaceController.hideSnackBar(key)}>
                        Dismiss
                    </Button>
                </>
            ),
        });
    }


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


    private remoteGraphs = undefined;

    public getRemoteGraphsList = async (
    ): Promise<string[]> => {
        if (!this.remoteGraphs) {
            this.remoteGraphs = await this.fetchRemoteGraphsList(githubBaseURL, githubBranchName);
        }
        return this.remoteGraphs;
    }

    private fetchRemoteGraphsList = async (
        githubBaseURL: string,
        githubBranchName: string
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

    getRemoteGraph = async (
        githubBaseURL: string,
        githubBranchName: string,
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
}