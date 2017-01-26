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

    log.info("load");

    for (let i in Game.rooms) {
      let room: Room = Game.rooms[i];

      log.info("Game.rooms[i];");
      let roomManager = new RoomManager(room);
      roomManager.loop();
    }
  }
}
 const game = new GameLoop();

export const loop = game.loop();
