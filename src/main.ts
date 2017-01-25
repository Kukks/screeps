import * as Config from "./config/config";
import {log} from "./components/support/log";
import {ILoopable} from "./interfaces";
import {RoomManager} from "./room.manager";

class GameLoop implements ILoopable {
  constructor() {
    if (Config.USE_PATHFINDER) {
      PathFinder.use(true);
    }
    log.info("load");
  }

  public loop() {
    // Check memory for null or out of bounds custom objects
    if (!Memory.uuid || Memory.uuid > 100) {
      Memory.uuid = 0;
    }

    for (let i in Game.rooms) {
      let room: Room = Game.rooms[i];
      let roomManager = new RoomManager(room);
      roomManager.loop();
    }
  }
}
export default new GameLoop();
