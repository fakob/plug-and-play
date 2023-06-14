import PPSocket from '../../classes/SocketClass';
import { TNodeSource, TRgba } from '../../utils/interfaces';
import {
  NODE_TYPE_COLOR,
  SOCKET_TYPE,
  TRIGGER_TYPE_OPTIONS,
} from '../../utils/constants';
import PPStorage from '../../PPStorage';
import PPNode from '../../classes/NodeClass';
import { StringType } from '../datatypes/stringType';
import {
  inputResourceIdSocketName,
  inputFileNameSocketName,
} from '../../nodes/draw/video';
import { ArrayType } from '../datatypes/arrayType';
import { TriggerType } from '../datatypes/triggerType';
import PPGraph from '../../classes/GraphClass';

const inputResourceURLSocketName = 'Resource URL';
export const sqlQuerySocketName = 'SQL query';
const reloadResourceSocketName = 'Reload resource';
const outputTableSocketName = 'Tables';
const outputColumnNamesSocketName = 'Query columns';
const outputQuerySocketName = 'Query result';
const defaultSqlQuery = `SELECT * FROM tablename`;

const IMPORT_NAME = '@sqlite.org/sqlite-wasm';
export class SqliteReader extends PPNode {
  sqlite3Module;
  sqlite3;
  db;

  public getName(): string {
    return 'Sqlite reader';
  }

  public getDescription(): string {
    return 'Reads sqlite files and returns a JSON';
  }

  public getTags(): string[] {
    return ['Input'].concat(super.getTags());
  }

  getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.INPUT);
  }

  protected getDefaultIO(): PPSocket[] {
    return [
      new PPSocket(
        SOCKET_TYPE.IN,
        inputResourceIdSocketName,
        new StringType(),
        '',
        false
      ),
      new PPSocket(
        SOCKET_TYPE.IN,
        inputFileNameSocketName,
        new StringType(),
        '',
        false
      ),
      new PPSocket(
        SOCKET_TYPE.IN,
        inputResourceURLSocketName,
        new StringType(),
        '',
        false
      ),
      new PPSocket(
        SOCKET_TYPE.IN,
        reloadResourceSocketName,
        new TriggerType(TRIGGER_TYPE_OPTIONS[0].text, 'loadDatabase'),
        0,
        false
      ),
      new PPSocket(
        SOCKET_TYPE.IN,
        sqlQuerySocketName,
        new StringType(),
        defaultSqlQuery,
        true
      ),
      new PPSocket(SOCKET_TYPE.OUT, outputTableSocketName, new ArrayType()),
      new PPSocket(
        SOCKET_TYPE.OUT,
        outputColumnNamesSocketName,
        new ArrayType()
      ),
      new PPSocket(SOCKET_TYPE.OUT, outputQuerySocketName, new ArrayType()),
    ];
  }

  public onNodeAdded = async (source?: TNodeSource): Promise<void> => {
    this.sqlite3Module = PPGraph.currentGraph.dynamicImports[IMPORT_NAME];

    this.sqlite3Module
      .default({
        print: console.log,
        printErr: console.error,
      })
      .then((sqlite3) => {
        try {
          this.sqlite3 = sqlite3;
          this.loadDatabase();
        } catch (err) {
          console.error(err.name, err.message);
        }
      });

    super.onNodeAdded(source);
  };

  loadDatabase = async (): Promise<SqliteReader['db']> => {
    const resourceId = this.getInputData(inputResourceIdSocketName);
    const resourceURL = this.getInputData(inputResourceURLSocketName);
    try {
      let blob;
      if (resourceId) {
        blob = await this.loadResourceLocal(resourceId);
      } else if (resourceURL) {
        blob = await this.loadResourceURL(resourceURL);
      }
      if (blob) {
        this.db = await this.loadDbFromBlob(blob);
        const returnArray = [];
        this.db.exec({
          sql: "SELECT name FROM sqlite_master WHERE type='table'",
          rowMode: 'array',
          callback: function (row) {
            returnArray.push(row);
          }.bind(this),
        });
        this.setOutputData(outputTableSocketName, returnArray);
        this.setOutputData(outputQuerySocketName, []);
        this.setOutputData(outputColumnNamesSocketName, []);
        this.executeQuery();
        return this.db;
      }
      return Promise.reject(new Error('No database loaded'));
    } catch (error) {
      return Promise.reject(new Error(error));
    }
  };

  executeQuery = async (): Promise<void> => {
    if (this.db) {
      const returnArray = [];
      const columnNames = [];
      this.db.exec({
        sql: this.getInputData(sqlQuerySocketName),
        columnNames: columnNames,
        rowMode: 'array',
        callback: function (row) {
          returnArray.push(row);
        }.bind(this),
      });
      this.setOutputData(
        outputQuerySocketName,
        returnArray.length === 1 ? returnArray[0] : returnArray
      );
      this.setOutputData(outputColumnNamesSocketName, columnNames);
      this.executeChildren().catch((error) => {
        console.error(error);
      });
    }
  };

  updateAndExecute = async (
    localResourceId: string,
    path: string,
    sqlQuery?: string
  ): Promise<void> => {
    this.setInputData(inputResourceIdSocketName, localResourceId);
    this.setInputData(inputFileNameSocketName, path);
    if (sqlQuery) {
      this.setInputData(sqlQuerySocketName, sqlQuery);
    }
    await this.loadDatabase();
    await this.executeQuery();
  };

  onExecute = async (): Promise<void> => {
    await this.executeQuery();
  };

  loadResourceLocal = async (resourceId) => {
    return await PPStorage.getInstance().loadResource(resourceId);
  };

  loadResourceURL = async (resourceURL) => {
    const promise = fetch(resourceURL)
      .then((response) => {
        if (!response.ok) {
          return null;
        }
        return response.blob();
      })
      .catch((error) => {
        console.error(error);
        return null;
      });
    const blob = await promise;
    if (!blob) {
      return null;
    }
    return blob;
  };

  loadDbFromBlob = async function (blob) {
    const buf = await blob.arrayBuffer();
    const bytes = new Uint8Array(buf);
    const p = this.sqlite3.wasm.allocFromTypedArray(bytes);
    const db = new this.sqlite3.oo1.DB();
    this.sqlite3.capi.sqlite3_deserialize(
      db.pointer,
      'main',
      p,
      bytes.length,
      bytes.length,
      this.sqlite3.capi.SQLITE_DESERIALIZE_FREEONCLOSE
    );
    return db;
  };

  public getDynamicImports(): string[] {
    return [IMPORT_NAME];
  }
}
