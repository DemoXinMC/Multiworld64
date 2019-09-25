import { ItemGetPacket } from "../network/Packets";

/**
 * Represents an Item within Multiworld.
 *
 * @export
 * @class Item
 */
export class Item
{
    /**
     * The Player whose World held the Item.
     *
     * @type {number}
     * @memberof Item
     */
    sendingPlayer: number;
    /**
     * The Player who the Item belongs to.
     *
     * @type {number}
     * @memberof Item
     */
    receivingPlayer: number;
    /**
     * The Item's identification number.
     *
     * @type {number}
     * @memberof Item
     */
    itemId: number;
    /**
     * A UNIXTIME timestamp representing when the Item was obtained.
     *
     * @type {number}
     * @memberof Item
     */
    timestamp: number;

    /**
     * Creates an instance of Item.
     * @param {number} sendingPlayer
     * @param {number} receivingPlayer
     * @param {number} itemId
     * @memberof Item
     */
    constructor(sendingPlayer: number, receivingPlayer: number, itemId: number)
    {
        this.sendingPlayer = sendingPlayer;
        this.receivingPlayer = receivingPlayer;
        this.itemId = itemId;
        this.timestamp = Date.now();
    }

    toPacket(): ItemGetPacket
    {
        return new ItemGetPacket(this.sendingPlayer, this.receivingPlayer, this.itemId);
    }

    static fromPacket(packet: ItemGetPacket) : Item
    {
        return new Item(packet.sendingPlayerNumber, packet.receivingPlayerNumber, packet.itemNumber);
    }
}