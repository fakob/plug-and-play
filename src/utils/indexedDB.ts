import Dexie from 'dexie';
import { SerializedGraph } from './interfaces';

interface Graph {
  id: string;
  date: Date;
  graphData: SerializedGraph;
  editorData?: string;
  name?: string;
}

interface Settings {
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
  public graphs: Dexie.Table<Graph, number>; // id is number in this case
  public settings: Dexie.Table<Settings, string>; // id is number in this case
  public localResources: Dexie.Table<LocalResource, string>; // id is number in this case

  public constructor() {
    super('GraphDatabase');
    this.version(2).stores({
      graphs: '++id',
      settings: '&name',
      localResources: '&id',
    });
    this.graphs = this.table('graphs');
    this.settings = this.table('settings');
    this.localResources = this.table('localResources');
  }
}
