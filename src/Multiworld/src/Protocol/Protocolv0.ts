import { IProtocol } from "./IProtocol";
import IMemory from "modloader64_api/IMemory";
import { zeldaString } from "modloader64_api/OOT/ZeldaString";
import { Item } from "./Item";
import { IModLoaderAPI } from "modloader64_api/IModLoaderAPI";

/**
 * Protocol v1 is a statically located context and is considered antiquated.  It is supported only for the sake of completeness.
 *
 * @export
 * @class Protocolv1
 * @implements {IProtocol}
 */
export class Protocolv0 implements IProtocol
{
    protected modloader: IModLoaderAPI;
    protected emulator: IMemory;
    protected contextAddr: number;
    protected protocolVersionAddr: number;
    protected playerIdAddr: number;
    protected playerNameIdAddr: number;
    protected incomingItemAddr: number;
    protected outgoingKeyAddr: number;
    protected outgoingItemAddr: number;
    protected outgoingPlayerAddr: number;
    protected playerNamesAddr: number;

    protected internalCountAddr: number;
    protected persistenceIdAddr: number;

    constructor(modloader: IModLoaderAPI)
    {
        this.modloader = modloader;
        this.emulator = modloader.emulator;
        this.contextAddr = 0x400000;
        this.protocolVersionAddr = this.contextAddr;
        this.playerIdAddr = this.contextAddr + 4;
        this.playerNameIdAddr = this.contextAddr + 5;
        this.incomingItemAddr = this.contextAddr + 6;
        this.outgoingKeyAddr = this.contextAddr + 8;
        this.outgoingItemAddr = this.contextAddr + 12;
        this.outgoingPlayerAddr = this.contextAddr + 14;
        this.playerNamesAddr = this.contextAddr + 16;

        this.internalCountAddr = 0x11A5D0 + 0x90;
        this.persistenceIdAddr = 0x11A5D0 + 0x12A4 + 0x1C;
    }

    getProtocolVersion(): number
    {
        return 0;
    }

    getInternalCount() : number
    {
        return this.emulator.rdramRead8(this.internalCountAddr);
    }
    setInternalCount(count: number) : void
    {
        this.emulator.rdramWrite8(this.internalCountAddr, count);
    }

    getPersistenceID() : number
    {
        return this.emulator.rdramRead32(this.persistenceIdAddr);
    }
    setPersistenceID(id: number) : void
    {
        this.emulator.rdramWrite32(this.persistenceIdAddr, id);
    }

    getPlayerID(): number
    {
        return this.emulator.rdramRead8(this.playerIdAddr);
    }

    getPlayerName(playerNumber: number): string
    {
        if(playerNumber < 1) { return "NOPLAYER"; }
        var offset: number = this.playerNamesAddr + (8 * playerNumber);
        var playerName = this.emulator.rdramReadBuffer(offset, 8);
        return zeldaString.decode(playerName).trim();
    }
    setPlayerName(playerNumber: number, playerName: string): void
    {
        if(playerNumber < 1) { return; }
        if(playerName == "" || playerName == undefined)
        {
            playerName = "Player";

            if(playerNumber < 10)
                playerName += "0";
            
            playerName += playerNumber.toString();
        }

        playerName = playerName.substr(0, 8).padEnd(8, " ");

        var offset = this.playerNamesAddr + (8 * playerNumber);
        this.emulator.rdramWriteBuffer(offset, zeldaString.encode(playerName));
    }

    hasOutgoingItem(): boolean
    {
        return this.emulator.rdramRead32(this.outgoingKeyAddr) != 0;
    }
    getOutgoingItem(): Item
    {
        var itemId: number = this.emulator.rdramRead16(this.outgoingItemAddr);
        var receivingPlayer: number = this.emulator.rdramRead16(this.outgoingPlayerAddr);
        var myPlayer: number = this.getPlayerID();
        var outgoingItem: Item = new Item(myPlayer, receivingPlayer, itemId);

        this.emulator.rdramWrite32(this.outgoingKeyAddr, 0);
        this.emulator.rdramWrite16(this.outgoingItemAddr, 0);
        this.emulator.rdramWrite16(this.outgoingPlayerAddr, 0);

        return outgoingItem;
    }
    setOutgoingItem(item: Item): void
    {
        this.emulator.rdramWrite32(this.outgoingKeyAddr, 1);
        this.emulator.rdramWrite16(this.outgoingItemAddr, item.itemId);
        this.emulator.rdramWrite16(this.outgoingPlayerAddr, item.receivingPlayer);
    }

    hasIncomingItem(): boolean
    {
        return (this.emulator.rdramRead16(this.incomingItemAddr) != 0);
    }
    getIncomingItem(): Item
    {
        var itemId: number = this.emulator.rdramRead16(this.incomingItemAddr);
        return new Item(this.getPlayerID(), this.getPlayerID(), itemId); //I'm not sure why there's 2 getPlayerID()'s here
    }
    setIncomingItem(item: Item): void
    {
        this.emulator.rdramWrite16(this.incomingItemAddr, item.itemId);
    }
}