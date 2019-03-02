import { Entity } from "./entity";
import * as Pwdb from "pwdb";

export abstract class EntityStore<T extends Entity> {
    protected pwdb: Pwdb;
    private type: string;
    public constructor(entityName: string) {
        this.pwdb = new Pwdb();
        this.type = entityName;
    }
    public insert(data: T): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            this.pwdb.insert(data, (err, document) => {
                if (!!err) {
                    reject(err);
                } else {
                    resolve(document);
                }
            });
        });
    }
    public delete(id: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.pwdb.remove({
                _id: id,
                _type: this.type
            }, {}, (err) => {
                if (!!err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }
    public findById(id: string): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            this.pwdb.findOne({
                _id: id,
                _type: this.type
            }, (err, document) => {
                if (!!err) {
                    reject(err);
                } else {
                    resolve(document as T);
                }
            });
        });
    }
}
