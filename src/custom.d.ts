declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module 'worker-loader!*' {
  class WebpackWorker extends Worker {
    constructor();
  }

  export default WebpackWorker;
}
