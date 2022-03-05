import { createContext } from "react";

import {
  addPluginInOrder,
  decrementPending,
  PluginFile,
} from "../slices/plugins";
import store from "./store";
import { default as Worker } from "worker-loader?filename=static/[fullhash].worker.js!../workers/PluginsLoader.worker";

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

  public async init(count: number = 8): Promise<WorkerPool> {
    this.availableWorkers = [];
    for (let i = 0; i < count; i++) {
      this.availableWorkers.push(await this.createWorker());
    }
    return this;
  }

  public async addWorker() {
    const worker = await this.createWorker();
    this.availableWorkers.push(worker);
    this.assignWorker();
  }

  public async createWorker(): Promise<Worker> {
    return new Promise((resolve) => {
      const worker = new Worker();
      worker.onmessage = (evt: {
        data: string | PluginFile & { timeHashEnd: number };
      }) => {
        const { data } = evt;
        if (typeof data === "string" && data === "ready") {
          resolve(worker);
        } else if (typeof data !== "string") {
          store.dispatch(decrementPending(1));
          store.dispatch(addPluginInOrder(data));
          // Since web assembly memory cannot be shrunk, replace worker with a fresh one to avoid slow repeated
          // invocations on the same worker instance. Repeated invocations are so slow that the delay in creating a
          // new worker is worth it. In practice, there are usually more workers than tasks, so the delay does not slow
          // down processing.
          worker.terminate();
          this.addWorker();
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