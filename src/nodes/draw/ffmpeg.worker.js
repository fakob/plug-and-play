let ffmpeg;

(async () => {
  console.time('import');
  const packageName = '@ffmpeg/ffmpeg';
  const url = 'https://esm.sh/' + packageName;
  console.log(url);
  self.FFmpeg = await import(/* webpackIgnore: true */ url);
  console.log(self.FFmpeg);
  console.timeEnd('import');

  console.time('loadFFmpeg');
  ffmpeg = self.FFmpeg.createFFmpeg({
    mainName: 'main',
    corePath: 'https://unpkg.com/@ffmpeg/core-st@0.11.1/dist/ffmpeg-core.js',
    log: true,
  });
  await ffmpeg.load();
  await ffmpeg.setProgress(progressMessage);
  console.log(ffmpeg);
  console.timeEnd('loadFFmpeg');
})();

self.onmessage = async (event) => {
  try {
    const { type, buffer, name, inType, outType } = event.data;

    const waitForVariable = async () => {
      if (ffmpeg && ffmpeg.isLoaded()) {
        console.log(ffmpeg);
        switch (type) {
          case 'transcode':
            ffmpeg.FS('writeFile', `${name}.${inType}`, new Uint8Array(buffer));
            await ffmpeg.run('-i', `${name}.${inType}`, `${name}.${outType}`);
            const data = ffmpeg.FS('readFile', `${name}.${outType}`);

            self.postMessage({ buffer: data.buffer, type: 'result' }, [
              data.buffer,
            ]);

            // delete files from memory
            ffmpeg.FS('unlink', `${name}.${inType}`);
            ffmpeg.FS('unlink', `${name}.${outType}`);
            break;
          case 'getStills':
            ffmpeg.FS('writeFile', `${name}.${inType}`, new Uint8Array(buffer));
            // await ffmpeg.run('-i', `${name}.${inType}`, `${name}.${outType}`);
            await ffmpeg.FS('mkdir', '/frames');
            await ffmpeg.run(
              '-i',
              `${name}.${inType}`,
              // '-vf',
              // `select='not(mod(t,1))'`,
              '-r', // change framerate
              '1', // to once a second
              `/frames/${name}%03d.png`
            );

            const exportedFrames = await ffmpeg
              .FS('readdir', '/frames')
              .filter((f) => f.endsWith('.png'));
            console.log(exportedFrames);
            for (const [i, fileName] of exportedFrames.entries()) {
              const framePath = '/frames/' + fileName;
              const data = ffmpeg.FS('readFile', `${framePath}`);
              console.log(i, exportedFrames.length);
              const isLast = i === exportedFrames.length - 1;
              self.postMessage({ buffer: data.buffer, type: 'frame', isLast }, [
                data.buffer,
              ]);
            }
          default:
            break;
        }
      } else {
        console.log('wait');
        setTimeout(waitForVariable, 100);
      }
    };
    waitForVariable();
  } catch (e) {
    self.postMessage({ type: 'error', error: e });
  }
};

const progressMessage = ({ ratio }) => {
  console.log(ratio);
  self.postMessage({ type: 'progress', data: ratio });
};
