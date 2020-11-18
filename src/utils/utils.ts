import { Position } from "source-map";

import { PowerSource, Threat, Command, Mem } from '../drone';

export function buildRoad(from : RoomPosition, to: RoomPosition, spawn: StructureSpawn): void {
  from.findPathTo(to.x, to.y, { ignoreCreeps:true})
  .forEach(step =>
    spawn.room.createConstructionSite(step.x,step.y, STRUCTURE_ROAD));
}

export function filterCreepsByCmd(creeps : Creep[], cmd : Command): Creep[] {
  return creeps.filter(creep =>
      (<Mem>creep.memory).task.cmds.some(_cmd => _.isEqual(cmd, _cmd)));
}

export function isSourceSafe(ps : PowerSource, threats : Threat[]) : boolean {
  return threats.every(threat => absoluteDistance(threat.pos, ps.source.pos) > 8);
}

export function absoluteDistance(l1 : RoomPosition, l2 : RoomPosition) : number {
  return Math.sqrt(Math.pow(Math.abs(l1.x - l2.x), 2) + Math.pow(Math.abs(l1.y - l2.y), 2));
}


