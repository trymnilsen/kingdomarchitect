import * as datastore from "pwdb";

export class Pwdb {
    public datastore: datastore;
    public constructor() {
        this.datastore = new datastore({
            filename: "database.pwdb",
            autoload: true
        });
    }
}
