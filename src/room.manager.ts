import {IJobHandler, ILoopable, IJob} from "./interfaces";

export const JobHandlerRegistry: IJobHandler[] = [];

export class RoomManager implements ILoopable {

  private _creepsInRoom: Creep[];

  private get creepsInRoom(): Creep[] {
    if (this._creepsInRoom) {
      return this._creepsInRoom;
    }
    this._creepsInRoom = <Creep[]> this.room.find(FIND_CREEPS);
    return this.creepsInRoom;
  }

  private get isRoomStorageFull(): boolean {
    return !(this.room.energyAvailable < this.room.energyCapacityAvailable);
  }

  private get selfCreepsInRoom(): Creep[] {
    return this.creepsInRoom.filter((value: Creep) => value.my);
  }

  private get idleCreeps(): Creep[] {
    return this.selfCreepsInRoom.filter((value: Creep) => (!value.memory.job ));
  }

  constructor(private room: Room) {

  }

  public loop() {
    const jobs = this.generateJobsForRoom();
    this.invalidateCreepJobs();
    this.assignJobsToCreeps(jobs);
  }

  private assignJobsToCreeps(jobs: IJob<any>[]): void{
    for (let idleCreep of this.idleCreeps) {
      let assignedJob: any;

      for (let job of jobs) {
        for (let jobHandler of JobHandlerRegistry) {
          if (jobHandler.canHandle(idleCreep, job)) {
            assignedJob = job;
            break;
          }
        }
        if (assignedJob) {
          break;
        }
      }
      if (assignedJob) {
        idleCreep.memory.job = jobs.shift();
      }
    }
  }

  private generateJobsForRoom(): IJob<any>[] {
    let result: IJob<any>[] = [];

    if (this.room) {
      if (this.room.controller) {
        //there is a controller in this room
        if (this.room.controller.my) {
          //it is my room
        }
      }
    }
    return result;
  }

  private invalidateCreepJobs(): void {

  }


}
