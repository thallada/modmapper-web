declare module 'worker-loader?filename=static/[fullhash].worker.js!*' {
  class WebpackWorker extends Worker {
    constructor();
  }

  export default WebpackWorker;
}