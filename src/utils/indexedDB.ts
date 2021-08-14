import Dexie from 'dexie';
import { SerializedGraph } from './interfaces';

interface Graph {
  id: number;
  date: Date;
  graphData: SerializedGraph;
  editorData?: string;
  name?: string;
}

interface Settings {
  name: string;
  value: string;
}

// Declare Database
export class GraphDatabase extends Dexie {
  public graphs: Dexie.Table<Graph, number>; // id is number in this case
  public settings: Dexie.Table<Settings, string>; // id is number in this case

  public constructor() {
    super('GraphDatabase');
    this.version(1).stores({
      graphs: '++id',
      settings: '&name',
    });
    this.graphs = this.table('graphs');
    this.settings = this.table('settings');
  }
}
