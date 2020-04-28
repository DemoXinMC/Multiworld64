// Modloader Imports
import {
    EventsClient,
    EventServerJoined,
    EventServerLeft,
    EventHandler,
    EventsServer,
    bus,
} from "modloader64_api/EventHandler";
import { IModLoaderAPI, IPlugin } from "modloader64_api/IModLoaderAPI";
import {
    ILobbyStorage,
    INetworkPlayer,
    LobbyData,
    NetworkHandler,
    ServerNetworkHandler,
} from "modloader64_api/NetworkHandler";
import { InjectCore } from "modloader64_api/CoreInjection";
import * as Net from "./network/Imports";
import { KeyManager, StorageContainer } from "modloader64_api/Storage"

// Core Imports
import { IOOTCore, LinkState, OotEvents, Scene } from "modloader64_api/OOT/OOTAPI"

// Plugin Imports
import { IProtocol } from "./Protocol/IProtocol";
import { Protocolv0 } from "./Protocol/Protocolv0";
import { Protocolv1 } from "./Protocol/Protocolv1";
import { Protocolv2 } from "./Protocol/Protocolv2";
import { SetNamePacket, SyncPacket, ItemGetPacket, UpdateNamesPacket, PersistenceIDPacket } from "./network/Imports";
import { Item } from "./Protocol/Item";
import { ItemNames } from "./Helpers/RandomizerItems";

export class Multiworld implements IPlugin
{
    ModLoader = {} as IModLoaderAPI;
    name = "Multiworld";

    @InjectCore()
    OoT!: IOOTCore;

    // Storage Variables
    cDB = new Net.DatabaseClient();

    private protocol?: IProtocol = undefined;
    private syncCooldown: number = Date.now()-1;
    
    constructor() {}
    preinit(): void {}
    init(): void {}
    postinit(): void
    {
        bus.emit("OotOnline:EnableGhostMode", {});
    }

    onTick(): void
    {
        if(this.protocol == undefined) { return; }
        if(!this.OoT.link.exists) { return; }

        this.receiveItem();
        this.postItem();
    }

    receiveItem() : void
    {
        if(this.protocol == undefined) { return; }

        var internalCount: number = this.protocol.getInternalCount();

        if(internalCount > this.cDB.myItems.length)
        {
            this.requestSync();
            return;
        }

        if(internalCount == this.cDB.myItems.length) { return; }

        if(!this.safeToGiveItem()) { return; }

        this.protocol.setIncomingItem(this.cDB.myItems[internalCount]);
        let setAmmoInSlot: Function = (this.OoT.save.inventory as any)['setAmmoInSlot'].bind(this.OoT.save.inventory) as Function;
        this.protocol.setInternalCount(internalCount + 1);
    }

    postItem() : void
    {
        if(this.protocol == undefined) { return; }
        if(!this.protocol.hasOutgoingItem()) { return; }

        var outgoingItem: Item = this.protocol.getOutgoingItem();

        this.cDB.othersItems.push(outgoingItem);

        this.ModLoader.clientSide.sendPacket(outgoingItem.toPacket(this.ModLoader.clientLobby));
    }

    safeToGiveItem() : boolean
    {
        if(this.protocol == undefined) { return false; }
        if(!this.OoT.link.exists) { return false; }

        var disallowedStates: Array<LinkState> = new Array<LinkState>();
        disallowedStates.push(LinkState.UNKNOWN);
        disallowedStates.push(LinkState.TALKING);
        disallowedStates.push(LinkState.DYING);
        disallowedStates.push(LinkState.LOADING_ZONE);
        disallowedStates.push(LinkState.BUSY);
        disallowedStates.push(LinkState.OCARINA);
        disallowedStates.push(LinkState.RIDING_EPONA);
        var isAllowedState: boolean = true;
        for(var i = 0; i < disallowedStates.length; i++)
        {
            if(disallowedStates[i] == this.OoT.link.state)
            {
                isAllowedState = false;
            }
        }
        if(!isAllowedState) { return false; }

        if(this.OoT.save.health <= 0) { return false; }

        if(this.OoT.global.scene >= 0x2C && this.OoT.global.scene <= 0x33) { return false; }
        if(this.OoT.global.scene == 0x42 || this.OoT.global.scene == 0x4B) { return false; }

        if(this.protocol.getIncomingItem().itemId != 0) { return false; }
        return true;
    }

    requestSync(): boolean
    {
        if(Date.now() < this.syncCooldown) { return false; }

        this.ModLoader.logger.info("Multiworld: Requesting Lobby Data...");
        this.syncCooldown = Date.now() + (10 * 1000);

        var syncPacket = new SyncPacket(new Array<Item>(), this.ModLoader.clientLobby);
        this.ModLoader.clientSide.sendPacket(syncPacket);

        return true;
    }

    @EventHandler(OotEvents.ON_SAVE_LOADED)
    onSaveLoaded(event: OotEvents.ON_SAVE_LOADED) : void
    {
        this.ModLoader.logger.info("Multiworld: Save Loaded.  Beginning Parsing...");
        var protocolVersion: number = 0;
        var contextAddr: number = 0x400000;
        var rando_context: number = this.ModLoader.emulator.dereferencePointer(0x1C6E90 + 0x15D4);

        contextAddr = this.ModLoader.emulator.dereferencePointer(rando_context + 0x0000);
        protocolVersion = this.ModLoader.emulator.rdramRead32(contextAddr);

        this.ModLoader.logger.info("Multiworld:  -- Multiworld Protocol v" + protocolVersion);
        this.ModLoader.logger.info("Multiworld:  -- Multiworld Context: " + contextAddr);

        switch(protocolVersion)
        {
            case 1:
                this.protocol = new Protocolv1(contextAddr, this.ModLoader);
                break;
            case 2:
                this.protocol = new Protocolv2(contextAddr, this.ModLoader);
                break;
            default:
                this.protocol = new Protocolv0(this.ModLoader);
                break;
        }

        this.protocol.setPlayerName(this.protocol.getPlayerID(), this.OoT.save.player_name);
        this.ModLoader.logger.info("Multiworld:  -- Local Player: " + this.protocol.getPlayerName(this.protocol.getPlayerID()) + " (" + this.protocol.getPlayerID() + ")");

        var namePacket = new SetNamePacket(this.protocol.getPlayerID(), this.OoT.save.player_name, this.ModLoader.clientLobby);
        this.ModLoader.clientSide.sendPacket(namePacket);

        var persistenceID: number = this.protocol.getPersistenceID();

        if(persistenceID != 0)
        {
            this.ModLoader.logger.info("Multiworld:  -- Persistence ID: " + persistenceID.toString(16));
            var persistenceIDPacket = new PersistenceIDPacket(persistenceID, this.ModLoader.clientLobby);
            this.ModLoader.clientSide.sendPacket(persistenceIDPacket);
        }

        this.requestSync();
    }

    @EventHandler(EventsServer.ON_LOBBY_CREATE)
    onServer_LobbyCreate(lobby: string) : void
    {
        this.ModLoader.lobbyManager.createLobbyStorage(lobby, this, new Net.DatabaseServer())
    }

    // #################################################
    // ##    Server Receive Packets
    // #################################################

    @ServerNetworkHandler("ItemGetPacket")
    onServerItemGet(packet: Net.ItemGetPacket): void
    {
        var sDB = this.ModLoader.lobbyManager.getLobbyStorage(packet.lobby, this) as Net.DatabaseServer;
        this.ModLoader.logger.info("Multiworld: " + sDB.playerNames[packet.sendingPlayerNumber] + " sent " +  sDB.playerNames[packet.receivingPlayerNumber] + " an Item: (" + packet.itemNumber + ") " + ItemNames.Randomizer[packet.itemNumber]);
        sDB.items.push(Item.fromPacket(packet));

        if(sDB.persistenceId == 0)
        {
            sDB.persistenceId = parseInt("0x" + KeyManager.getStorageKey());

            this.ModLoader.logger.info("Multiworld:  -- Lobby " + packet.lobby + " is now using Persistence ID: " + sDB.persistenceId.toString(16));

            var persistencePacket = new PersistenceIDPacket(sDB.persistenceId, packet.lobby);
            this.ModLoader.serverSide.sendPacket(persistencePacket);
        }

        this.ModLoader.logger.info("Multiworld: Saving " + (sDB.playerNames.length - 1) + " players and " + sDB.items.length + " items under Persistence ID " + sDB.persistenceId.toString(16));
        new StorageContainer(sDB.persistenceId.toString(16)).storeObject(sDB);
    }

    @ServerNetworkHandler("SetNamePacket")
    onServerSetName(packet: Net.SetNamePacket): void
    {
        var sDB = this.ModLoader.lobbyManager.getLobbyStorage(packet.lobby, this) as Net.DatabaseServer;
        sDB.playerNames[packet.playerNumber] = packet.playerName;
        var namesPacket = new UpdateNamesPacket(sDB.playerNames, packet.lobby);
        this.ModLoader.serverSide.sendPacket(namesPacket);

        this.ModLoader.logger.info("Multiworld: Player " + packet.playerNumber + " is now known as " + packet.playerName);
    }

    @ServerNetworkHandler("SyncPacket")
    onServerSync(packet: Net.SyncPacket): void
    {
        var sDB = this.ModLoader.lobbyManager.getLobbyStorage(packet.lobby, this) as Net.DatabaseServer;

        var namesPacket = new UpdateNamesPacket(sDB.playerNames, packet.lobby);
        var itemsPacket = new SyncPacket(sDB.items, packet.lobby);

        if(sDB.persistenceId != 0)
        {
            var persistencePacket = new PersistenceIDPacket(sDB.persistenceId, packet.lobby);
            this.ModLoader.serverSide.sendPacketToSpecificPlayer(persistencePacket, packet.player);
        }

        this.ModLoader.serverSide.sendPacketToSpecificPlayer(namesPacket, packet.player);
        this.ModLoader.serverSide.sendPacketToSpecificPlayer(itemsPacket, packet.player);

        this.ModLoader.logger.info("Multiworld: Sent Sync Data to (" + packet.player.nickname + ")");
    }

    @ServerNetworkHandler("PersistenceIDPacket")
    onServerPersistenceID(packet: Net.PersistenceIDPacket): void
    {
        var sDB = this.ModLoader.lobbyManager.getLobbyStorage(packet.lobby, this) as Net.DatabaseServer;

        if(sDB.persistenceId != 0)
        {
            return;
        }

        this.ModLoader.logger.info("Multiworld:  -- " + packet.player.nickname + " sent Persistence ID " + packet.persistenceID.toString(16));

        var persistentStorage = new StorageContainer(packet.persistenceID.toString(16)).loadObject() as Net.DatabaseServer;
        sDB.playerNames = persistentStorage.playerNames;
        sDB.items = persistentStorage.items;
        sDB.persistenceId = packet.persistenceID;
    }

    // #################################################
    // ##    Client Receive Packets
    // #################################################

    @NetworkHandler("ItemGetPacket")
    onClientItemGet(packet: Net.ItemGetPacket): void
    {
        if(this.protocol == undefined) { return; }

        var receivedItem: Item = Item.fromPacket(packet);

        if(receivedItem.receivingPlayer == this.protocol.getPlayerID() || receivedItem.itemId == 0xCA)
        {
            this.cDB.myItems.push(receivedItem);
        }
        else
        {
            this.cDB.othersItems.push(receivedItem);
        }

        this.ModLoader.logger.info("Multiworld: " + this.protocol.getPlayerName(receivedItem.sendingPlayer) + " sent " + this.protocol.getPlayerName(receivedItem.receivingPlayer) + " an Item: (" + receivedItem.itemId + ") " + ItemNames.Randomizer[receivedItem.itemId]);
    }

    @NetworkHandler("UpdateNamesPacket")
    onClientUpdateNames(packet: Net.UpdateNamesPacket): void
    {
        if(this.protocol == undefined) { return; }

        this.ModLoader.logger.info("Multiworld: Received " + (packet.playerNames.length - 1) + " names from the Lobby.");

        for(var i = 1; i < packet.playerNames.length; i++)
        {
            this.protocol.setPlayerName(i, packet.playerNames[i]);
            this.ModLoader.logger.info("Multiworld:  -- Player " + i + " is known as " + this.protocol.getPlayerName(i));         
        }
    }

    @NetworkHandler("SyncPacket")
    onClientSync(packet: Net.SyncPacket): void
    {
        if(this.protocol == undefined) { return; }

        this.ModLoader.logger.info("Multiworld: Received Item Sync. Total Items: " + packet.items.length);

        this.cDB.myItems = new Array<Item>();
        this.cDB.othersItems = new Array<Item>();

        for(var i = 0; i < packet.items.length; i++)
        {
            var parsedItem = packet.items[i];
            if(parsedItem.receivingPlayer == this.protocol.getPlayerID() || parsedItem.itemId == 0xCA)
                this.cDB.myItems.push(parsedItem);
            else
                this.cDB.othersItems.push(parsedItem);
        }

        this.ModLoader.logger.info("Multiworld:  -- My Item Count: " + this.cDB.myItems.length);
        this.ModLoader.logger.info("Multiworld:  -- Others' Item Count: " + this.cDB.othersItems.length);
    }

    @NetworkHandler("PersistenceIDPacket")
    onClientPersistenceID(packet: Net.PersistenceIDPacket)
    {
        if(this.protocol == undefined) { return; }

        this.ModLoader.logger.info("Multiworld:  -- Persistence ID: " + packet.persistenceID.toString(16));
        this.protocol.setPersistenceID(packet.persistenceID);
    }
}
