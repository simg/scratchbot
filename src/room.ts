import * as Drone from './drone';

/** @param {Room} room **/
export const run = (room: Room): void => {
  const sources       = room.find(FIND_SOURCES),
        level         = room.controller?.level,
        spawns        = room.find(FIND_MY_SPAWNS),
        spawn         = spawns[0],
        construction  = room.find(FIND_MY_CONSTRUCTION_SITES),
        extensions    = room.find(FIND_MY_STRUCTURES, { filter : { structureType : STRUCTURE_EXTENSION }}),
        harvesters    = room.find(FIND_MY_CREEPS, { filter : { "memory.role" : 'harvester' }});

  // if (level === 1) {
  // if (harvesters.length < )
  // const spawnDecision : DecisionTree[] = [
  //   [ level === 1, [
  //       [(harvesters.length < 6), 'harvester'],
  //     ]
  //   ],
  //   [ level === 2, [
  //       []
  //     ]
  //   ]
  // ]


  console.log("harvesters", harvesters.length);
}


type Action   = () => void;
//type Action       = { op: 'spawn', role:string }
type DecisionTree = [boolean, DecisionTree[] | string ]


function sourceCapacity(source : Source) : number {
  const spots = source?.room?.lookAtArea(source.pos.y-1, source.pos.x-1, source.pos.y+1, source.pos.x+1, true)
    .filter((tile: LookAtResult) => tile.type === 'terrain' && tile.terrain === 'plain')
    .length;
  return spots || 0;
}
