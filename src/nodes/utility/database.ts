import PPSocket from '../../classes/SocketClass';
import { TNodeSource, TRgba } from '../../utils/interfaces';
import {
  NODE_TYPE_COLOR,
  SOCKET_TYPE,
  TRIGGER_TYPE_OPTIONS,
} from '../../utils/constants';
import PPStorage from '../../PPStorage';
import PPNode from '../../classes/NodeClass';
import { JSONType } from '../datatypes/jsonType';
import { StringType } from '../datatypes/stringType';
import { TriggerType } from '../datatypes/triggerType';
import {
  inputResourceIdSocketName,
  inputFileNameSocketName,
} from '../../nodes/draw/video';

const triggerSocketName = 'Trigger';
const outputSocketName = 'Output';

export class SqliteReader extends PPNode {
  sqlite3Module;
  sqlite3;

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
        triggerSocketName,
        new TriggerType(TRIGGER_TYPE_OPTIONS[0].text, 'trigger'),
        0,
        true
      ),
      new PPSocket(SOCKET_TYPE.OUT, outputSocketName, new JSONType()),
    ];
  }

  public onNodeAdded = async (source?: TNodeSource): Promise<void> => {
    (async () => {
      console.time('import');
      const packageName = '@sqlite.org/sqlite-wasm';
      const url = 'https://esm.sh/' + packageName;
      this.sqlite3Module = await import(/* webpackIgnore: true */ url);
      console.timeEnd('import');

      console.log(this.sqlite3Module);

      console.log('Loading and initializing SQLite3 module...');
      this.sqlite3Module
        .default({
          print: console.log,
          printErr: console.error,
        })
        .then((sqlite3) => {
          try {
            this.sqlite3 = sqlite3;
            console.log('Done initializing. Running demo...');
            this.start();
          } catch (err) {
            console.error(err.name, err.message);
          }
        });
    })();

    super.onNodeAdded(source);
  };

  loadDbFromArrayBuffer = function (buf) {
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

  start = async function () {
    // console.log('Running SQLite3 version', sqlite3.version.libVersion);
    // console.log(this);
    // console.log(this.getInputData(inputResourceIdSocketName));

    console.log(this.sqlite3, this.sqlite3.wasm, this.sqlite3.capi);
    const blob = await this.loadResource(
      this.getInputData(inputResourceIdSocketName)
    );
    const data = await blob.arrayBuffer();
    const path = new DatabasePath(data);
    const fileName = this.getInputData(inputFileNameSocketName);
    console.log(fileName, path);
    const db = this.loadDbFromArrayBuffer(data);
    // const db = new sqlite3.oo1.DB(fileName, path);
    console.log(db);
    db.exec({
      sql: `SELECT * FROM states
where service is 'Store'`,
      rowMode: 'array', // 'array' (default), 'object', or 'stmt'
      callback: function (row) {
        this.setOutputData(outputSocketName, JSON.parse(row[1]));
        console.log('row ', ++this.counter, '=', row);
      }.bind(this),
    });
  };

  updateAndExecute = (localResourceId: string, path: string): void => {
    this.setInputData(inputResourceIdSocketName, localResourceId);
    this.setInputData(inputFileNameSocketName, path);
    this.executeOptimizedChain().catch((error) => {
      console.error(error);
    });
  };

  loadResource = async (resourceId) => {
    return await PPStorage.getInstance().loadResource(resourceId);
  };

  trigger = () => {
    console.log('db');
    console.log(this.sqlite3);
    console.log(this.sqlite3.default);
    const db = new this.sqlite3.default('foobar.db');
    db.pragma('journal_mode = WAL');

    db.close();
  };
}

// Path to an SQLite database.

// Could be one of the following:
//   - local (../data.db),
//   - remote (https://domain.com/data.db)
//   - binary (binary database content)
//   - id (gist:02994fe7f2de0611726d61dbf26f46e4)
//        (deta:yuiqairmb558)
//   - empty

class DatabasePath {
  value;
  type;

  constructor(value, type = null) {
    this.value = value;
    this.type = type || this.inferType(value);
  }

  // inferType guesses the path type by its value.
  inferType(value) {
    if (!value) {
      return 'empty';
    }
    if (value instanceof ArrayBuffer) {
      return 'binary';
    }
    if (value.startsWith('http://') || value.startsWith('https://')) {
      return 'remote';
    }
    if (value.includes(':')) {
      return 'id';
    }
    return 'local';
  }

  // extractName extracts the database name from the path.
  extractName() {
    if (['binary', 'id', 'empty'].includes(this.type)) {
      return '';
    }
    const parts = this.value.split('/');
    return parts[parts.length - 1];
  }

  // toHash returns the path as a window location hash string.
  toHash() {
    if (this.type == 'local' || this.type == 'remote' || this.type == 'id') {
      return `#${this.value}`;
    } else {
      return '';
    }
  }

  // toString returns the path as a string.
  toString() {
    if (this.type == 'local' || this.type == 'remote') {
      return `URL ${this.value}`;
    } else if (this.type == 'binary') {
      return 'binary value';
    } else if (this.type == 'id') {
      return `ID ${this.value}`;
    } else {
      return 'empty value';
    }
  }
}

export { DatabasePath };
