import datastore from "pwdb";

let store: datastore = new datastore({
});

export class Pwdb {
    public datastore: datastore;
    public constructor() {
        this.datastore = store;
    }
}
