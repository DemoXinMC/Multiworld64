import { Item } from "./Item";

/**
 * Interface that provides interaction with the OoT ROM based up the ROM's Script Protocol Version
 *
 * @export
 * @interface IProtocol
 */
export interface IProtocol
{
    /**
     * Retreives the Script Protocol Version this IProtocol corresponds to.
     *
     * @returns {number} The Version Number
     * @memberof IProtocol
     */
    getProtocolVersion() : number;

    getInternalCount() : number;
    setInternalCount(count: number) : void;

    getPersistenceID() : number;
    setPersistenceID(id: number) : void;

    /**
     * Gets the Player ID from the loaded ROM.
     *
     * @returns {number} The local Player's ID.
     * @memberof IProtocol
     */
    getPlayerID() : number;
    
    /**
     * Retrieves the Name of the Player corresponding to playerNumber from RAM
     *
     * @param {number} playerNumber The Player Number
     * @returns {string} The Player Name (Only returns 8 characters)
     * @memberof IProtocol
     */
    getPlayerName(playerNumber: number) : string;
    /**
     * Sets the Name of the Player corresponding to playerNumber in RAM
     *
     * @param {number} playerNumber The Player Number to set
     * @param {string} playerName The Name of that Player (Only 8 characters will be stored)
     * @memberof IProtocol
     */
    setPlayerName(playerNumber: number, playerName: string) : void;

    /**
     * Checks whether the RAM has an Outbound (Acquired for another Player) Item waiting
     *
     * @returns {boolean} True if there is an Item, False otherwise.
     * @memberof IProtocol
     */
    hasOutgoingItem() : boolean;
    /**
     * Get an Item representing the queued Outbound Item.
     *
     * @param {boolean} clear If True, the Item will be removed from RAM, as if processed
     * @returns {Item} An Item representing the Outbound Item
     * @memberof IProtocol
     */
    getOutgoingItem(clear: boolean) : Item;
    /**
     * Set the Outbound Item in RAM.  You probably shouldn't do this!
     *
     * @param {Item} item The Item to queue to the Outbound RAM
     * @memberof IProtocol
     */
    setOutgoingItem(item: Item) : void;

    /**
     * Checks whether the RAM has an Inbound (Acquired by another Player) Item waiting.
     *
     * @returns {boolean} True if there is an Item, False otherwise.
     * @memberof IProtocol
     */
    hasIncomingItem() : boolean;
    /**
     * Get an Item representing the queued Inbound Item.  Protocols before v2 do not properly support retrieving the Sending Player in this method.
     *
     * @returns {Item} An Item representing the queued Inbound Item
     * @memberof IProtocol
     */
    getIncomingItem() : Item;
    /**
     * Sets the Inbound Item in RAM.  This does not check whether there is already an Item queued.
     *
     * @param {Item} item The Item to be queued
     * @memberof IProtocol
     */
    setIncomingItem(item: Item) : void;
}