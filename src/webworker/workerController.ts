// singleton for sending tasks off to worker thread
export default class WorkerController {
  private static workerControllerInstance: WorkerController = undefined;

  worker = undefined;
  private constructor() {
    this.worker = new Worker('./worker.js');
  }

  public getInstance(): WorkerController {
    if (!WorkerController.workerControllerInstance) {
      WorkerController.workerControllerInstance = new WorkerController();
    }
    return WorkerController.workerControllerInstance;
  }
}
