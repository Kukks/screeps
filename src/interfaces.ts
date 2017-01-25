export interface IJob<Target> {
  name: string;
  target: Target;
  data?: any;
}

export interface IJobHandler {
  canHandle<Target>(creep: Creep, job: IJob<Target>): boolean;
  handle<Target>(creep: Creep, job: IJob<Target>): boolean;
}

export interface ILoopable {
  loop(): void;
}
