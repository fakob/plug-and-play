import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
import { frameCountToTimeCode, timecodeToFrameCount } from './utils';

let FRAMERATE;
let FRAMECOUNT;
const ffmpeg = createFFmpeg({
  log: true,
  logger: (message: any) => {
    if (message.message.includes('fps')) {
      let m = message.message.split(' fps')[0].split(', ');
      m = m[m.length - 1];
      if (m > 0) FRAMERATE = parseInt(m);
    }
    if (message.message.includes('Duration:')) {
      const m = message.message.split('Duration:')[1].trim().split(', ')[0];
      if (m.length > 0) FRAMECOUNT = timecodeToFrameCount(m, FRAMERATE);
    }
  },
});

export const getThumbnail = async (
  objectURL: string
): Promise<{
  objectURL: string;
  frameCount: number;
  frameRate: number;
}> => {
  if (!ffmpeg.isLoaded()) {
    await ffmpeg.load();
  }
  ffmpeg.FS('writeFile', 'test.mp4', await fetchFile(objectURL));
  // run once to get info
  await ffmpeg.run(
    '-i', // input file url
    'test.mp4'
  );
  // run second time to get middle frame
  console.log(FRAMERATE, FRAMECOUNT);
  await ffmpeg.run(
    '-ss', // seek position (start)
    frameCountToTimeCode(Math.floor(FRAMECOUNT / 2), FRAMERATE), // get middle frame
    '-i', // input file url
    'test.mp4',
    '-vf', // create video filtergraph
    'scale=-2:200', // scale w:h
    // '-c:v', // encoder
    // 'png'
    '-f', // force input or output file format
    'image2',
    '-vframes', // number of video frames to output
    '1',
    '-q:v', // quality video stream
    '10',
    'output.png'
  );
  const data = ffmpeg.FS('readFile', 'output.png');
  const objectUrlFromStill = URL.createObjectURL(
    new Blob([data.buffer], { type: 'image/png' })
  );
  ffmpeg.FS('unlink', 'test.mp4');
  console.log(objectUrlFromStill);
  return {
    objectURL: objectUrlFromStill,
    frameCount: FRAMECOUNT,
    frameRate: FRAMERATE,
  };
};

export const getFrame = async (
  objectURL: string,
  frameNumber: number
): Promise<{
  objectURL: string;
  frameCount: number;
  frameRate: number;
}> => {
  if (!ffmpeg.isLoaded()) {
    await ffmpeg.load();
  }
  ffmpeg.FS('writeFile', 'test.mp4', await fetchFile(objectURL));
  // run once to get info
  await ffmpeg.run(
    '-i', // input file url
    'test.mp4'
  );
  // run second time to get middle frame
  console.log(FRAMERATE, FRAMECOUNT);
  await ffmpeg.run(
    '-ss', // seek position (start)
    frameCountToTimeCode(Math.floor(frameNumber)), // get middle frame
    '-i', // input file url
    'test.mp4',
    // '-c:v', // encoder
    // 'png'
    '-f', // force input or output file format
    'image2',
    '-vframes', // number of video frames to output
    '1',
    '-q:v', // quality video stream
    '10',
    'output.png'
  );
  const data = ffmpeg.FS('readFile', 'output.png');
  const objectUrlFromStill = URL.createObjectURL(
    new Blob([data.buffer], { type: 'image/png' })
  );
  ffmpeg.FS('unlink', 'test.mp4');
  console.log(objectUrlFromStill);
  return {
    objectURL: objectUrlFromStill,
    frameCount: FRAMECOUNT,
    frameRate: FRAMERATE,
  };
};

// export async function renderThumbnail(filePath: string, timestamp: number) {
//   const args = [
//     '-ss', // seek position (start)
//     timestamp,
//     '-i', // input file url
//     filePath,
//     '-vf', // create video filtergraph
//     'scale=-2:200', // scale w:h
//     // '-c:v', // encoder
//     // 'png'
//     '-f', // force input or output file format
//     'image2',
//     '-vframes', // number of video frames to output
//     '1',
//     '-q:v', // quality video stream
//     '10',
//     '-',
//   ];

//   const ffmpegPath = await getFfmpegPath();
//   const { stdout } = await execa(ffmpegPath, args, { encoding: null }); // arraybuffer

//   const blob = new Blob([stdout], { type: 'image/jpeg' });
//   return URL.createObjectURL(blob);
// }

// export async function renderThumbnails({
//   filePath,
//   from,
//   duration,
//   onThumbnail,
// }: {
//   filePath: string;
//   from: number;
//   duration: number;
//   onThumbnail: any;
// }) {
//   // Time first render to determine how many to render
//   const startTime = new Date().getTime() / 1000;
//   let url = await renderThumbnail(filePath, from);
//   const endTime = new Date().getTime() / 1000;
//   onThumbnail({ time: from, url });

//   // Aim for max 3 sec to render all
//   const numThumbs = Math.floor(
//     Math.min(Math.max(3 / (endTime - startTime), 3), 10)
//   );
//   // console.log(numThumbs);

//   const thumbTimes = Array(numThumbs - 1).map(
//     (_, i) => from + (duration * (i + 1)) / numThumbs
//   );
//   // console.log(thumbTimes);

//   await pMap(
//     thumbTimes,
//     async (time) => {
//       url = await renderThumbnail(filePath, time);
//       onThumbnail({ time, url });
//     },
//     { concurrency: 2 }
//   );
// }
