import { Protocolv1 } from "./Protocolv1";
import IMemory from "modloader64_api/IMemory";
import { Item } from "./Item";
import { IModLoaderAPI } from "modloader64_api/IModLoaderAPI";

export class Protocolv2 extends Protocolv1
{
    protected incomingPlayerAddr: number;

    constructor(contextAddr: number, modloader: IModLoaderAPI)
    {
        super(contextAddr, modloader);
        this.incomingPlayerAddr  = contextAddr + 6
        this.incomingItemAddr = contextAddr + 8
        this.outgoingKeyAddr = contextAddr + 12
        this.outgoingItemAddr = contextAddr + 16
        this.outgoingPlayerAddr = contextAddr + 18
        this.playerNamesAddr = contextAddr + 20
    }

    getProtocolVersion(): number { return 2; }

    getIncomingItem(): Item
    {
        var itemId: number = this.emulator.rdramRead16(this.incomingItemAddr);
        var sendingPlayer: number = this.emulator.rdramRead16(this.incomingPlayerAddr);
        return new Item(sendingPlayer, this.getPlayerID(), itemId);
    }

    setIncomingItem(item: Item): void
    {
        this.emulator.rdramWrite16(this.incomingItemAddr, item.itemId);
        this.emulator.rdramWrite16(this.incomingPlayerAddr, item.sendingPlayer);
    }
}