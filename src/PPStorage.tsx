import { GraphDatabase } from "./utils/indexedDB";

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



    db: GraphDatabase; // should be private, but lets remove all references to it elsewhere first
    private static instance: PPStorage;
}