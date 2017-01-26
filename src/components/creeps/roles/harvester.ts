import * as creepActions from "../creepActions";
import {IJob} from "../../../interfaces";

/**
 * Runs all creep actions.
 *
 * @export
 * @param {Creep} creep
 */
export function run(creep: Creep, job: IJob<any>): void {
  let spawn = creep.room.find<Spawn>(FIND_MY_SPAWNS)[0];
  let energySource = creep.room.find<Source>(FIND_SOURCES_ACTIVE)[0];

  if (creepActions.needsRenew(creep)) {
    creepActions.moveToRenew(creep, spawn);
  } else if (_.sum(creep.carry) === creep.carryCapacity) {

    _moveToDropEnergy(creep, job, spawn);
  } else {
    _moveToHarvest(creep, energySource);
  }
}

function _tryHarvest(creep: Creep, target: Source): number {
  return creep.harvest(target);
}

function _moveToHarvest(creep: Creep, target: Source): void {
  if (_tryHarvest(creep, target) === ERR_NOT_IN_RANGE) {
    creepActions.moveTo(creep, target.pos);
  }
}

function _tryEnergyDropOff(creep: Creep, job: IJob<any>, obj: any): number {
  switch (job.name) {
    case "build":
      return  creep.build(obj);
    case "fill":
      return  creep.transfer(obj, RESOURCE_ENERGY);
    case "upgrade":
      return creep.upgradeController(obj);
    default:
      return -1;
  }
}

function _moveToDropEnergy(creep: Creep, job: IJob<any>, spawn: Spawn): void {
  let obj: any = Game.getObjectById(job.target) || spawn;

  if (_tryEnergyDropOff(creep, job, obj) === ERR_NOT_IN_RANGE) {
    creepActions.moveTo(creep, obj.pos);
  }
}
