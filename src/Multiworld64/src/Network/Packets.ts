import { Packet } from 'modloader64_api/ModLoaderDefaultImpls';
import { Item } from '../Protocol/Item';

/**
 * Client -> All
 *   Sent when a Player gets an Item for another Player
 *
 * @export
 * @class ItemGetPacket
 * @extends {Packet}
 */
export class ItemGetPacket extends Packet
{
    sendingPlayerNumber: number;
    receivingPlayerNumber: number;
    itemNumber: number;
  
    constructor(sendingPlayerNumber: number, receivingPlayerNumber: number, itemNumber: number, lobby: string)
    {
        super("ItemGetPacket", "Multiworld", lobby, true);

        this.sendingPlayerNumber = sendingPlayerNumber;
        this.receivingPlayerNumber = receivingPlayerNumber;
        this.itemNumber = itemNumber;
    }
}

/**
 * Client -> Server
 *   Requests the full list of items held on the server.
 * Server -> Client
 *   Sends the full list of Items held on the server.
 *
 * @export
 * @class SyncPacket
 * @extends {Packet}
 */
export class SyncPacket extends Packet
{
    items: Array<Item>;
  
    constructor(items: Array<Item>, lobby: string)
    {
        super("SyncPacket", "Multiworld", lobby, false);

        this.items = items;
    }
}

/**
 * Client -> Server
 *   Sent to notify the server of the Player's name (done on SaveLoaded)
 *
 * @export
 * @class SetNamePacket
 * @extends {Packet}
 */
export class SetNamePacket extends Packet
{
    playerNumber: number;
    playerName: string;
  
    constructor(playerNumber: number, playerName: string, lobby: string)
    {
        super("SetNamePacket", "Multiworld", lobby, false);

        this.playerNumber = playerNumber;
        this.playerName = playerName;
    }
}

/**
 * Server -> Client
 *   Sent to provide Clients with a full list of Player Names.
 *
 * @export
 * @class UpdateNamesPacket
 * @extends {Packet}
 */
export class UpdateNamesPacket extends Packet
{
    playerNames: Array<string>;

    constructor(playerNames: Array<string>, lobby: string)
    {
        super("UpdateNamesPacket", "Multiworld", lobby, true);
        this.playerNames = playerNames;
    }
}

/**
 * Client -> Server
 *   Requests the full list of items held on the server.
 * Server -> Client
 *   Sends the full list of Items held on the server.
 *
 * @export
 * @class PersistenceIDPacket
 * @extends {Packet}
 */
export class PersistenceIDPacket extends Packet
{
    persistenceID: number;

    constructor(persistenceId: number, lobby: string)
    {
        super("PersistenceIDPacket", "Multiworld", lobby, false);
        this.persistenceID = persistenceId;
    }
}