import { IProtocol } from "./IProtocol";
import IMemory from "modloader64_api/IMemory";
import { Item } from "./Item";
import { Protocolv0 } from "./Protocolv0";
import { IModLoaderAPI } from "modloader64_api/IModLoaderAPI";

/**
 * Protocol v2 was established in OoTR 4.0, and made the Multiworld context be relative to the Randomizer context.
 *
 * @export
 * @class Protocolv2
 * @implements {IProtocol}
 */
export class Protocolv1 extends Protocolv0
{
    constructor(contextAddr: number, modloader: IModLoaderAPI)
    {
        super(modloader);
        this.contextAddr = contextAddr;
        this.protocolVersionAddr = this.contextAddr;
        this.playerIdAddr = this.contextAddr + 4;
        this.playerNameIdAddr = this.contextAddr + 5;
        this.incomingItemAddr = this.contextAddr + 6;
        this.outgoingKeyAddr = this.contextAddr + 8;
        this.outgoingItemAddr = this.contextAddr + 12;
        this.outgoingPlayerAddr = this.contextAddr + 14;
        this.playerNamesAddr = this.contextAddr + 16;
    }

    getProtocolVersion(): number
    {
        return 1;
    }
}