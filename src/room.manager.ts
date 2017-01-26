import {IJobHandler, ILoopable, IJob} from "./interfaces";
import * as Harvester from "./components/creeps/roles/harvester";
import {log} from "./components/support/log";

export class BuildJobHandler implements IJobHandler {
  public canHandle<Target>(creep: Creep, job: IJob<Target>): boolean {
    return creep.memory.role === "slave" && (
        job.name === "build" ||
        job.name === "upgrade" ||
        job.name === "fill"
      );
  }

  public handle<Target>(creep: Creep, job: IJob<Target>): boolean {
    creep.say(job.name);
    Harvester.run(creep, job);

    return true;
  }
}

export const JobHandlerRegistry: IJobHandler[] = [new BuildJobHandler()];

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

  private get hostileCreepsInRoom(): Creep[] {
    return this.creepsInRoom.filter((value: Creep) => !value.my);
  }

  private get idleCreeps(): Creep[] {
    return this.selfCreepsInRoom.filter((value: Creep) => (!value.memory.job ));
  }

  private get selfStructuresInRoom(): OwnedStructure[] {
    return this.room.find<OwnedStructure>(FIND_MY_STRUCTURES);
  }

  private get selfConstructionSitesInRoom(): ConstructionSite[] {
    return this.room.find<ConstructionSite>(FIND_MY_CONSTRUCTION_SITES);
  }

  constructor(private room: Room) {
    log.info("room manager inst created");
  }

  public loop() {

    log.info("room manager loop");
    const jobs = this.generateJobsForRoom();

    log.info(`jobs generated for room ${jobs.length}`);
    this.invalidateCreepJobs(jobs);

    log.info(`jobs after invalidation for room ${jobs.length}`);
    this.createCreeps(jobs.length);
    this.assignJobsToCreeps(jobs);
  }

  private createCreeps(jobCount: number) {
    let spawns: Spawn[] = this.room.find<Spawn>(FIND_MY_SPAWNS, {
      filter: (spawn: Spawn) => {
        return spawn.spawning === null;
      },
    });

    if (jobCount > this.idleCreeps.length) {
      let bodyParts = [WORK, WORK, CARRY, MOVE];
      if (this.room.energyCapacityAvailable > 800) {
        bodyParts = [WORK, WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE];
      }
      spawns.forEach((spawn: Spawn) => {

        let status: number | string = spawn.canCreateCreep(bodyParts, undefined);
        let properties: { [key: string]: any } = {
          role: "slave",
          room: spawn.room.name,
        };

        status = _.isString(status) ? OK : status;

        if (status === OK) {

          status = spawn.createCreep(bodyParts, undefined, properties);
        }
      });
    }
  }

  private assignJobsToCreeps(jobs: IJob < any > []): void {
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

  private generateJobsForRoom(): IJob < any > [] {
    let result: IJob<any>[] = [];

    if (this.room) {
      if (this.room.controller) {
        //there is a controller in this room
        if (this.room.controller.my) {
          //it is my room
          if (this.hostileCreepsInRoom.length > 0) {
            //we have enemies!!!

          }
          result.push(...this.generateSelfRoomJobs());
        }
      }
    }
    return result;
  }

  private generateSelfRoomJobs(): IJob < any > [] {
    let result: IJob<any>[] = [];
    let strucsThatNeedEnergy: IHasEnergy[] = this.selfStructuresInRoom.filter((struc: IHasEnergy) => {
      return (struc.energy && struc.energyCapacity && struc.energy < struc.energyCapacity);
    });

    if (this.room.controller &&
      !this.room.controller.upgradeBlocked && this.room.controller.level !== 8 && !this.room.controller.my) {
      result.push({name: "upgrade", target: this.room.controller.id});
    }
    strucsThatNeedEnergy = strucsThatNeedEnergy.sort((a: IHasEnergy, b: IHasEnergy) => {
      const aPercentage = (a.energy / a.energyCapacity) * 100;
      const bPercentage = (b.energy / b.energyCapacity) * 100;
      if (aPercentage < bPercentage) {
        return -1;
      } else if (aPercentage > bPercentage) {
        return 1;
      }
      return 0;
    });
    strucsThatNeedEnergy.forEach((struc: Structure) => {
      result.push({name: "fill", target: struc.id});
    });

    this.selfConstructionSitesInRoom.forEach((consSite: ConstructionSite) => {
      result.push({name: "build", target: consSite.id});
    });

    return result;
  }

  private invalidateCreepJobs(jobs: IJob<any>[]): void {
    for (let creep of this.selfCreepsInRoom) {
      if (creep.memory.job) {
        switch (creep.memory.job.name) {
          case "build":
            const consSite: ConstructionSite| null = Game.getObjectById<ConstructionSite>(creep.memory.job.target);
            if (!consSite || consSite.progress >= consSite.progressTotal) {
              creep.memory.job = null;
            }
            break;
          case "fill":
            const hasEnergyStruct: IHasEnergy| null = Game.getObjectById<IHasEnergy>(creep.memory.job.target);
            if (!hasEnergyStruct || hasEnergyStruct.energy >= hasEnergyStruct.energyCapacity) {
              creep.memory.job = null;
            }
            break;
          case "upgrade":
            const controller: Controller | null = Game.getObjectById<Controller>(creep.memory.job.target);
            if (!controller || controller.upgradeBlocked || controller.level === 8 || !controller.my) {
              creep.memory.job = null;
            }
            break;
          default:
            creep.memory.job = null;
        }
        if (creep.memory.job) {
          const matchingJobIndex = jobs.findIndex((job: IJob<any>) => {
            return job.target === creep.memory.job.target && job.name === creep.memory.job.name;
          });
          if (matchingJobIndex >= 0) {
            jobs.splice(matchingJobIndex, 1);
          }
        }

      }
    }
  }
}

interface IHasEnergy {
  energy?: number;
  energyCapacity?: number;
}
