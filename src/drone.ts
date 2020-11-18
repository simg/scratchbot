import { exit } from "process";
import { Coordinate } from './types.d';
import { filterCreepsByCmd } from "utils/utils";

export const spawn = (spawn : StructureSpawn, roleName : string, energy : number, cmds? : Command[]) => {

  let newName  = roleName + Game.time,
      newParts = scaleParts(baseparts[roleName], energy);
  //console.log("newParts", roleName, JSON.stringify(newParts))
  console.log("cmds", JSON.stringify(newParts), newName, roleName, JSON.stringify(cmds))
  const res = spawn.spawnCreep(newParts, newName, {
    memory: {
      task:{
        cmds:cmds || [],
        ptr: cmds && cmds.length > 0 ? 0: undefined
      },
      role:roleName,
      room:'',
      working:true
    }
  });
  if (res === 0) {
    console.log(`Spawning new ${roleName}: ${newName}`);
  } else {
    console.log(`Error spawning new ${roleName}: ${res}`);
  }
}

function scaleParts(baseparts: BodyPartConstant[], energy: number) : BodyPartConstant[] {

  //return baseparts;
  let parts : BodyPartConstant[] = [],
      basepartsIdx = 0,
      energyRemaining = energy;

  while (energyRemaining) {
    const part = baseparts[basepartsIdx];
    if (energyRemaining >= BODYPART_COST[part]) {
      parts.push(part);
      energyRemaining -= BODYPART_COST[part];
      basepartsIdx++;
      if (basepartsIdx > baseparts.length -1) {
        basepartsIdx = 0;
      }
    } else break;
  }

  return parts;
}

const baseparts : { [key: string]: BodyPartConstant[] } = {
  harvester : [ WORK,  CARRY, MOVE ],
  miner     : [ WORK,  WORK, CARRY, MOVE ],
  builder   : [ WORK, CARRY, MOVE ],
  hauler    : [ CARRY, CARRY, MOVE ],
  upgrader  : [ WORK, CARRY, MOVE ],
  fighter   : [ RANGED_ATTACK,TOUGH,MOVE]
}



// function defaultFighterMem():Mem {
//   return {
//     task:{
//       cmds:[],
//       ptr: undefined
//     },
//     role:'fighter', room:'', working:true
//   };
// }


// function defaultMem(overrides : Partial<Mem>):Mem {
//   return _.assign({},
//     {
//       task:{
//         cmds:[],
//         ptr: undefined
//       },
//     role:'skutter', room:'', working:true
//     },
//     overrides);
// }



  /** @param {Creep} creep **/
export const run = (creep: Creep): void => {

  const mem = <Mem>creep.memory;

  //if (mem.immortal)

  if (!mem.task) {
    mem.task = {
      cmds : [],
      ptr  : undefined
    }
  }

  if (mem.task.ptr && mem.task.ptr > mem.task.cmds.length) {
    // reached end of command list so do nothing
    return;
  }

  if (mem.task.ptr !== undefined) {

    let cmd = mem.task.cmds[mem.task.ptr];

    //console.log(cmd.op)

    if (cmd.op === 'goto') {
      mem.task.ptr = cmd.operand;
      cmd = mem.task.cmds[mem.task.ptr];
      creep.say(cmd.op);
    }

    if (cmd.op === 'harvest') {
      const target = <Source>Game.getObjectById(cmd.operand);
      if (creep.store.getFreeCapacity() === 0) {
        mem.task.ptr++;
        creep.say(mem.task.cmds[mem.task.ptr].op);
      } else {
        const res = creep.harvest(target);
        if (res === 0 || res === -4) {
          // do nothing
        } else if (res === ERR_NOT_IN_RANGE) {
          creep.moveTo(target, { visualizePathStyle: { stroke: "#ffaa00" } });
        } else {
          creep.say(`harvest error: ${res}`);
        }
      }
    }

    else if (cmd.op === 'collect') {
      const target = <Source>Game.getObjectById(cmd.operand);
      if (creep.store.getFreeCapacity() === 0) {
        mem.task.ptr++;
        creep.say(mem.task.cmds[mem.task.ptr].op);
      } else {
        //const res = creep.harvest(target);
        creep.moveTo(target, { visualizePathStyle: { stroke: "#ffaa00" } });
      }
    }

    else if (cmd.op === 'moveto') {
      const target = <Creep>Game.getObjectById(cmd.operand);
      if (creep.room.findPath(creep.pos, target.pos).length === 0 ) {
        // got there
        mem.task.ptr++;
        creep.say(mem.task.cmds[mem.task.ptr].op);
      } else {
        creep.moveTo(target, { visualizePathStyle: { stroke: "#ffaa00" } });
      }
    }

    else if (cmd.op === 'replace') {
      const target = <Creep>Game.getObjectById(cmd.operand);
      if (creep.room.findPath(creep.pos, target.pos).length === 0 ) {
        (<Mem>creep.memory) = (<Mem>target.memory);
        target.suicide();
        creep.say(mem.task.cmds[mem.task.ptr].op);
      } else {
        creep.moveTo(target, { visualizePathStyle: { stroke: "#ffaa00" } });
      }
    }

    else if (cmd.op === 'offload') {
      if (creep.store.getUsedCapacity() === 0) {
        mem.task.ptr++;
        creep.say(mem.task.cmds[mem.task.ptr].op);
      } else {
        const mates = creep.pos.findInRange(FIND_MY_CREEPS, 1, {
          filter:(creep => (<Mem>creep.memory).role !== 'miner' && creep.store.getFreeCapacity() > 0)
        })
        if (mates.length > 0 &&
            creep.transfer(mates[0], RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
          // ignore - probably never happens anyway
        }
      }
    }

    else if (cmd.op === 'upgrade') {
      const target = <StructureController>Game.getObjectById(cmd.operand);
      if (creep.store.getUsedCapacity() === 0) {
        mem.task.ptr++;
        creep.say(mem.task.cmds[mem.task.ptr].op);
      } else {
        const res = creep.upgradeController(target);
        if (res === 0) {
          // do nothing
        } else if (res === ERR_NOT_IN_RANGE) {
          creep.moveTo(target, { visualizePathStyle: { stroke: "#ffffff" } });
        } else {
          creep.say(`error upgrading controller: ${res}`);
        }
      }
    }

    else if (cmd.op === 'deliver') {
      const target = <PowerConsumer>Game.getObjectById(cmd.operand);
      if (creep.store.getUsedCapacity() === 0) {
        mem.task.ptr++;
        creep.say(mem.task.cmds[mem.task.ptr].op);
      } else {
        const res = creep.transfer(target, RESOURCE_ENERGY);
        if (res === 0) {
          // do nothing
        } else if (res === ERR_NOT_IN_RANGE) {
          creep.moveTo(target, { visualizePathStyle: { stroke: "#ffffff" } });
        } else if (res === ERR_FULL) {
          const _extensions = <Structure<STRUCTURE_EXTENSION> | null>creep.pos.findClosestByPath(FIND_MY_STRUCTURES, { filter : { structureType : STRUCTURE_EXTENSION }});
          if (Array.isArray(_extensions) && _extensions[0]) {
            cmd.operand = _extensions[0].id;
          }

        } else {
          creep.say(`delivery error: ${res}`);
        }
      }
    }

    else if (cmd.op === 'patrol') {
      creep.moveTo(cmd.operand.x, cmd.operand.y, { visualizePathStyle: { stroke: "#ffffff" } });
      if (creep.pos.x === cmd.operand.x && creep.pos.y === cmd.operand.y) {
        mem.task.ptr++;
      }
    }

    else if (cmd.op === 'buildnear') {
      const target = <ConstructionSite | null>creep.pos.findClosestByPath(FIND_MY_CONSTRUCTION_SITES);
      if (target) {
        const res = creep.build(target);
        if (res === 0) {
          // do nothing
        } else if(res === ERR_NOT_IN_RANGE) {
          creep.moveTo(target, { visualizePathStyle: { stroke: "#ffffff" } });
        } else {
          creep.say(`buildnear error: ${res}`);
        }
      }
      if (creep.store.getUsedCapacity() === 0) {
        mem.task.ptr++;
        creep.say(mem.task.cmds[mem.task.ptr].op);
      }
    }

    else if (cmd.op === 'recharge') {
      const target = <Structure<STRUCTURE_EXTENSION> | null>creep.pos.findClosestByPath(FIND_MY_STRUCTURES, { filter : { structureType : STRUCTURE_EXTENSION }});
      if (target) {
        const res = creep.transfer(target, RESOURCE_ENERGY);
        if (res === 0) {
          // do nothing
        } else if(res === ERR_NOT_IN_RANGE) {
          creep.moveTo(target, { visualizePathStyle: { stroke: "#ffffff" } });
        } else {
          creep.say(`recharge error: ${res}`);
        }
      }
      if (creep.store.getUsedCapacity() === 0) {
        mem.task.ptr++;
        creep.say(mem.task.cmds[mem.task.ptr].op);
      }
    }

    else if (cmd.op === 'attack') {
      //console.log("attack", cmd.operand)
      const target = <Threat | undefined>Game.getObjectById(cmd.operand);
      //console.log("target", target)
      if(target) {
        const res = creep.rangedAttack(target);
          //console.log("res", res);
          if(res == ERR_NOT_IN_RANGE) {
            //console.log("moving into range")
            creep.say('Attack!');
            creep.moveTo(target);
          }
      } else {
        // nothing to attack so next instruction
        mem.task.ptr++;
        creep.say(mem.task.cmds[mem.task.ptr].op);
      }
    }


  }



};

function sayCommand(creep : Creep, cmd : Command) : void {

}

// if (creep.store.getFreeCapacity() > 0) {
//   const sources = creep.room.find(FIND_SOURCES);
//   if (creep.harvest(sources[0]) === ERR_NOT_IN_RANGE) {
//     creep.moveTo(sources[0], { visualizePathStyle: { stroke: "#ffaa00" } });
//   }
// } else {
//   const targets = creep.room.find(FIND_STRUCTURES, {
//     filter: structure => {
//       return (
//         (structure.structureType === STRUCTURE_EXTENSION || structure.structureType === STRUCTURE_SPAWN) &&
//         structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
//       );
//     }
//   });
//   if (targets.length > 0) {
//     if (creep.transfer(targets[0], RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
//       creep.moveTo(targets[0], { visualizePathStyle: { stroke: "#ffffff" } });
//     }
//   }
// }

export function harvest(source : Source, target : PowerConsumer) : Command[] {
  return [
      { op: 'harvest', operand: source.id },
      { op: 'deliver', operand: target.id },
      { op: 'goto',    operand: 0         }
    ];
}


export function haul(creep : Creep, target : PowerConsumer) : Command[] {
  return [
      { op: 'collect', operand: creep.id },
      { op: 'deliver', operand: target.id },
      { op: 'goto',    operand: 0         }
    ];
}

//export function buildnear(creep : Creep) : Command[] {
export function buildnear(source : Source) : Command[] {
  return [
      // { op: 'collect', operand: source.id },
      { op: 'harvest', operand: source.id },
      { op: 'buildnear',                 },
      { op: 'goto',    operand: 0        }
    ];
}

export function recharge(source : Source) : Command[] {
  return [
      // { op: 'collect', operand: source.id },
      { op: 'harvest', operand: source.id },
      { op: 'recharge',                   },
      { op: 'goto',    operand: 0        }
    ];
}

export function replace(creep : Creep) : Command[] {
  return [
      { op: 'replace', operand: creep.id }
    ];
}

export function upgrade(donor : Creep | Source, controller : StructureController) : Command[] {
  return [
      { op: 'harvest', operand: donor.id },
      { op: 'upgrade', operand: controller.id },
      { op: 'goto',    operand: 0         }
    ];
}

export function mine(source : Source) : Command[] {
  return [
      { op: 'harvest', operand: source.id },
      { op: 'offload'                     },
      { op: 'goto',    operand: 0         }
    ];
}

export function patrol(start: Coordinate, end: Coordinate) : Command[] {
  return [
      { op: 'patrol', operand: { x:start.x, y:start.y }},
      { op: 'patrol', operand: { x:end.x,   y:end.y   }},
      { op: 'goto',   operand: 0                       }
    ];
}


export interface Mem extends CreepMemory {
  task : {
    cmds  : Command[] ;
    ptr   : number | undefined ;
  },
  role : string ;
}

export type PowerSource   = {
  source   : Source | Deposit; //Mineral<MineralConstant> |
  capacity : number ;
}
export type PowerConsumer = Creep  | PowerCreep | Structure<StructureConstant>;
export type Threat        = Creep  | PowerCreep | Structure<StructureConstant>;
export type ObjectID      = string;

export type Command = { op : 'goto',    operand : number   } |
                      { op : 'harvest', operand : ObjectID } |
                      { op : 'collect', operand : ObjectID } |
                      { op : 'moveto',  operand : ObjectID } |
                      { op : 'offload',                    } |
                      { op : 'deliver', operand : ObjectID } |
                      { op : 'upgrade', operand : ObjectID } |
                      { op : 'buildnear'                   } |
                      { op : 'recharge'                    } |
                      { op : 'replace', operand : ObjectID } |
                      { op : 'patrol',  operand : { x : number, y: number }} |
                      { op : 'attack',  operand : ObjectID };

export function filterByCommand(creeps : Creep[], cmd : string | Command) : Creep[] {
  return creeps.filter(creep => hasCommand(creep, cmd));
}

// does a creep
export function hasCommand(creep : Creep, cmd : string | Command) : boolean {
  return !!findCommand(creep, cmd);
}

export function findCommand(creep : Creep, cmd : string | Command) : Command | undefined {
  const mem = (<Mem>creep.memory);
  return mem.task.cmds.find(_cmd => typeof cmd === 'string' ?
                                _cmd.op === cmd
                              : eqCommand(_cmd, cmd));
}

export function eqCommand(cmd1: Command, cmd2: Command) : boolean {
  return cmd1.op === cmd2.op && (
         cmd2.op === 'offload' || cmd2.op === 'buildnear' || cmd2.op === 'recharge' || cmd2.operand === undefined ||
        (cmd1.op !== 'offload' && cmd1.op !== 'buildnear' && cmd1.op !== 'recharge' && cmd1.operand === cmd2.operand)
      );
}
