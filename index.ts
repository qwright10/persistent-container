import { EventEmitter } from 'events';
import { Document, Model } from 'mongoose';

export default class PersistentContainer extends EventEmitter {
    public hasChanges: boolean;
    public lastChange: { key: any, value: any } | null
    public map: Map<string, any>;
    public readonly model: Model<Document>;
    private readonly idProp: string;

    private constructor(model: Model<Document>, idProp: string) {
        super();
        this.hasChanges = false;
        this.lastChange = null;
        this.map = new Map<string, any>();
        this.model = model;
        this.idProp = idProp;
        
        (async () => {
            const docs = await model.find().lean();
            for (const doc of docs) {
                this.set(doc[idProp], doc)
            }
        })();
    }

    public static async new(model: Model<Document>, idProp: string): Promise<PersistentContainer> {
        const container = new PersistentContainer(model, idProp);
        const docs = await model.find().lean();
        for (const doc of docs) {
            container.map.set(doc[idProp], doc);
        }

        return container;
    }

    public get(key: string): any {
        const result = this.map.get(key);
        if (result) this.emit('get', key);
        return result;
    }

    public set(key: string, value: any): Map<string, any> {
        this.hasChanges = true;
        this.lastChange = { key, value };
        this.emit('set', key, value);
        return this.map.set(key, value);
    }

    public update(key: string, eKey: string, value: any): boolean {
        const entry = this.map.get(key);
        if (entry && Object.keys(entry).includes(eKey)) {
            entry[eKey] = value;
            this.map.set(key, entry);
            this.emit('update', key, eKey, value);
            return true;
        } else if (entry && !Object.keys(entry).includes(eKey)) {
            throw new Error(`${eKey} does not exist on entry ${eKey}`);
        } else return false;
    }

    public delete(key: string): boolean {
        const value = this.map.get(key);
        const result = this.map.delete(key);
        if (result) {
            this.emit('delete', key);
            this.hasChanges = true;
            this.lastChange = { key, value };
        }
        return result;
    }

    public clear(): void {
        this.emit('clear');
        return this.map.clear();
    }

    public async revertChanges(last: boolean = true): Promise<boolean> {
        if (last && this.hasChanges && this.lastChange) {
            const { key, value } = this.lastChange;
            this.hasChanges = false;
            this.lastChange = null;
            this.emit('revert', key, value);
            this.map.set(key, value);
            return true;
        } else if (!last) {
            const docs = await this.model.find().lean();
            for (const doc of docs) {
                if (Object.keys(doc).includes(this.idProp)) throw new Error(`${this.idProp} does not exist on the document ${doc}`);
                this.map.set(doc[this.idProp], doc);
            }
            this.hasChanges = false;
            this.lastChange = null;
            this.emit('reload', docs);
            return true;
        }

        return false;
    }

    public save(validate: boolean = true): void {
        for (const [, doc] of [...this.map.entries()]) {
            doc.save({ validateBeforeSave: validate });
        }
    }

    get size() {
        return this.map.size;
    }

    public has(key: string): boolean {
        return this.map.has(key);
    }

    public keys(): IterableIterator<string> {
        return this.map.keys();
    }

    public values(): IterableIterator<any> {
        return this.map.values();
    }

    public entries(): IterableIterator<[string, any]> {
        return this.map.entries();
    }

    public forEach(callbackfn: (value: any, key: string, map: Map<string, any>) => void, thisArg?: any) {
        return this.map.forEach(callbackfn, thisArg);
    }
}