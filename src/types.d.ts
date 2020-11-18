// example declaration file - remove these and add your own custom typings
import * as Drone from './drone';
// memory extension samples
interface CreepMemory {
  task : {
    cmds  : Drone.Command[] ;
    ptr   : number | undefined ;
  },
  role: string;  room: string;
  working: boolean;
}


type Coordinate = {
  x: number ;
  y: number ;
}

interface Memory {
  uuid: number;
  log: any;
  road1: boolean;
}

// `global` extension samples
declare namespace NodeJS {
  interface Global {
    log: any;
  }
}
