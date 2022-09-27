import { createContext } from "react";

import {
  addParsedPluginInOrder,
  decrementPending,
  PluginFile,
} from "../slices/plugins";
import store from "./store";

export interface Task {
  skipParsing: boolean,
  filename: string,
  lastModified: number,
  contents: Uint8Array,
}

export class WorkerPool {
  public taskQueue: Task[];
  public availableWorkers: Worker[];

  public constructor() {
    this.taskQueue = [];
    this.availableWorkers = [];
  }

  public async init(count: number = window.navigator.hardwareConcurrency ?? 8): Promise<WorkerPool> {
    this.availableWorkers = [];
    for (let i = 0; i < count; i++) {
      this.createWorker().then(worker => this.availableWorkers.push(worker));
    }
    return this;
  }

  public async createWorker(): Promise<Worker> {
    return new Promise((resolve) => {
      const worker = new Worker(new URL("../workers/PluginsLoader.worker.ts", import.meta.url));
      worker.onmessage = (evt: {
        data: string | PluginFile;
      }) => {
        const { data } = evt;
        if (typeof data === "string" && data === "ready") {
          resolve(worker);
        } else if (typeof data !== "string") {
          store.dispatch(decrementPending(1));
          store.dispatch(addParsedPluginInOrder(data));

          this.availableWorkers.push(worker);
          this.assignWorker()
        }
      };
    });
  }

  public pushTask(task: Task) {
    this.taskQueue.push(task);
    this.assignWorker();
  }

  public async assignWorker() {
    if (this.taskQueue.length > 0 && this.availableWorkers.length > 0) {
      const task = this.taskQueue.shift()!;
      const worker = this.availableWorkers.shift()!;
      worker.postMessage(task, [task.contents.buffer]);
    }
  }

  public async terminateAll() {
    for (const worker of this.availableWorkers) {
      worker.terminate();
    }
    this.availableWorkers = [];
  }
}

export const WorkerPoolContext = createContext<WorkerPool | null>(null);