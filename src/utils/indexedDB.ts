import Dexie from 'dexie';
import { SerializedGraph } from './interfaces';

interface Graph {
  id: number;
  date: Date;
  graphData: SerializedGraph;
  editorData?: string;
  name?: string;
}

// Declare Database
export class GraphDatabase extends Dexie {
  public currentGraph: Dexie.Table<Graph, number>; // id is number in this case

  public constructor() {
    super('GraphDatabase');
    this.version(1).stores({
      currentGraph: '++id',
    });
    this.currentGraph = this.table('currentGraph');
  }
}
