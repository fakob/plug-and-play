import { GraphDatabase } from './utils/indexedDB';

export default class Base {
  static db: GraphDatabase = undefined;
  static getDatabase(): GraphDatabase {
    if (!this.db) {
      this.db = new GraphDatabase();
    }
    return this.db;
  }
}
