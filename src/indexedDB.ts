import Dexie from 'dexie';
import { SerializedGraph } from './interfaces';

interface Graph {
  id: number;
  date: Date;
  data: SerializedGraph;
  name?: string;
}

// Declare Database
export class GraphDatabase extends Dexie {
  public currentGraph: Dexie.Table<Graph, number>; // id is number in this case

  public constructor() {
    super('GraphDatabase');
    this.version(1).stores({
      currentGraph: '++id,date',
    });
    this.currentGraph = this.table('currentGraph');
  }
}
