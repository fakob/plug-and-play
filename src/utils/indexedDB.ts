import Dexie from 'dexie';
import { SerializedGraph } from './interfaces';

export interface StoredGraph {
  id: string;
  graphData: SerializedGraph;
}
export interface GraphMeta {
  id: string;
  date: Date;
  editorData?: string;
  name?: string;
}

export interface Settings {
  name: string;
  value: string;
}

interface LocalResource {
  id: string;
  size: number;
  date: Date;
  data: Blob;
  name?: string;
}

// Declare Database
export class GraphDatabase extends Dexie {
  public graphs_data: Dexie.Table<StoredGraph, string>;
  public graphs_meta: Dexie.Table<GraphMeta, string>;
  public settings: Dexie.Table<Settings, string>;
  public localResources: Dexie.Table<LocalResource, string>;

  public constructor() {
    super('GraphDatabase');
    this.version(4).stores({
      graphs_data: '&id',
      graphs_meta: '&id',
      settings: '&name',
      localResources: '&id',
    });
    this.graphs_meta = this.table('graphs_meta');
    this.graphs_data = this.table('graphs_data');
    this.settings = this.table('settings');
    this.localResources = this.table('localResources');
  }
}
