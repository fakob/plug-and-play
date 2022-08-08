import { GraphDatabase } from './utils/indexedDB';
import { getRemoteGraphsList } from './utils/utils';

export const githubBaseURL =
  'https://api.github.com/repos/fakob/plug-and-play-examples';
export const githubBranchName = 'dev';
export default class Base {
  static db: GraphDatabase = undefined;
  static remoteGraphs: string[] = [];
  static getDatabase(): GraphDatabase {
    if (!this.db) {
      this.db = new GraphDatabase();
    }
    return this.db;
  }

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

  static async fetchRemoteGraphs(): Promise<void> {
    // remote playground database
    const graphs = await getRemoteGraphsList(githubBaseURL, githubBranchName);
    this.remoteGraphs = graphs;
  }
}
