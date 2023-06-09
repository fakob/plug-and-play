import PPSocket from '../../classes/SocketClass';
import { TNodeSource, TRgba } from '../../utils/interfaces';
import {
  NODE_TYPE_COLOR,
  SOCKET_TYPE,
  TRIGGER_TYPE_OPTIONS,
} from '../../utils/constants';
import { JSONType } from '../datatypes/jsonType';
import { TriggerType } from '../datatypes/triggerType';
import PPNode from '../../classes/NodeClass';

const triggerSocketName = 'Trigger';
const outputSocketName = 'Output';

export class SqliteReader extends PPNode {
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
      // const bundleMode = '?bundle';
      // const es = '&target=es2020';
      const url = 'https://esm.sh/' + packageName;
      this.sqlite3 = await import(/* webpackIgnore: true */ url);
      console.timeEnd('import');

      console.log(this.sqlite3);

      const log = (...args) => console.log(...args);
      const error = (...args) => console.error(...args);

      const start = function (sqlite3) {
        log('Running SQLite3 version', sqlite3.version.libVersion);
        const db = new sqlite3.oo1.DB('/mydb.sqlite3', 'ct');
        // Your SQLite code here.
      };

      log('Loading and initializing SQLite3 module...');
      this.sqlite3
        .default({
          print: log,
          printErr: error,
        })
        .then((sqlite3) => {
          try {
            log('Done initializing. Running demo...');
            start(sqlite3);
          } catch (err) {
            error(err.name, err.message);
          }
        });
    })();

    super.onNodeAdded(source);
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
