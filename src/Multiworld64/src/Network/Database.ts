import { Item } from "../Protocol/Item";

// Universal data for client AND server side in here
export class Database
{
    public playerNames: Array<string>;

    constructor()
    {
        this.playerNames = new Array<string>();
    }
}

// Client only data here
export class DatabaseClient extends Database
{
    public myPlayerNumber: number;
    public myItems: Array<Item>;
    public othersItems: Array<Item>;

    constructor()
    {
        super();
        this.myPlayerNumber = -1;
        this.myItems = new Array<Item>();
        this.othersItems = new Array<Item>();
    }
}

// Server only data here
export class DatabaseServer extends Database
{
    public items: Array<Item>;
    public persistenceId: number;

    constructor()
    {
        super();
        this.items = new Array<Item>();
        this.persistenceId = 0;
    }
}