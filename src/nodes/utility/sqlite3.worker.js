let sqlite3;

(async () => {
  console.time('import');
  const packageName = 'sqlite3';
  // const bundleMode = '?bundle';
  // const es = '?target=es2020';
  const worker = '?worker';
  const url = 'https://esm.sh/' + packageName + worker;
  sqlite3 = await import(/* webpackIgnore: true */ url);
  console.timeEnd('import');
  console.log(self.sqlite3);
})();

self.onmessage = async (event) => {
  try {
    console.log(event);
    // const { type, buffer, name, inType, outType } = event.data;

    const waitForImport = async () => {
      console.log('waitForImport');
      console.log(sqlite3);
      if (sqlite3) {
        console.log('db');
        const db = new sqlite3.Database(':memory:');
        console.log(db);

        db.serialize(() => {
          db.run('CREATE TABLE lorem (info TEXT)');

          const stmt = db.prepare('INSERT INTO lorem VALUES (?)');
          for (let i = 0; i < 10; i++) {
            stmt.run('Ipsum ' + i);
          }
          stmt.finalize();

          db.each('SELECT rowid AS id, info FROM lorem', (err, row) => {
            console.log(row.id + ': ' + row.info);
          });
        });

        db.close();
        // if (!ffmpeg.isLoaded()) {
        //   await ffmpeg.load();
        // }
        // switch (type) {
        //   case 'transcode':
        //     const version = inType === outType ? '-in' : '';
        //     ffmpeg.FS(
        //       'writeFile',
        //       `${name}${version}.${inType}`,
        //       new Uint8Array(buffer)
        //     );
        //     await ffmpeg.run('-i', `${name}.${inType}`, `${name}.${outType}`);
        //     const data = ffmpeg.FS('readFile', `${name}.${outType}`);

        //     self.postMessage(
        //       {
        //         buffer: data.buffer,
        //         type: 'transcodingResult',
        //         name: `${name}.${outType}`,
        //       },
        //       [data.buffer]
        //     );

        //     // delete files from memory
        //     ffmpeg.FS('unlink', `${name}${version}.${inType}`);
        //     ffmpeg.FS('unlink', `${name}.${outType}`);
        //     break;
        //   default:
        //     console.warn('Unknown message type', event.data);
        //     break;
        // }
        // // due to a bug you can always only execute one ffmpeg.run command
        // // after that you need to exit -> load again
        // ffmpeg.exit();
      } else {
        console.log('wait');
        setTimeout(waitForImport, 100);
      }
    };
    await waitForImport();
  } catch (e) {
    self.postMessage({ type: 'error', error: e });
  }
};

self.onerror = (err) => {
  console.error(err);
};

self.onmessageerror = (err) => {
  console.error(err);
};

// const progressMessage = ({ ratio }) => {
//   console.log(ratio);
//   self.postMessage({ type: 'progress', data: ratio });
// };
