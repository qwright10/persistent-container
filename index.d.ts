import { maxHeaderSize } from 'http';

declare module 'persistent-container' {
    import { EventEmitter } from 'events';
    import { Document, Model } from 'mongoose';

    interface PersistentContainer extends EventEmitter {
        hasChanges: boolean;
        lastChange: { key: any, value: any } | null;
        map: Map<string, any>;
        readonly model: Model<Document>;
        readonly idProp: string;
        size: number;

        new(model: Model<Document>, idProp: string): Promise<PersistentContainer>;
        get(key: string): any;
        set(key: string, value: any): Map<string, any>;
        update(key: string, eKey: string, value: any): boolean;
        delete(key: string): boolean;
        clear(): void;
        revertChanges(last?: boolean): Promise<void>;
        save(validate?: boolean): void;

        has(key: string): boolean;
        keys(): IterableIterator<string>;
        values(): IterableIterator<any>;
        entries(): IterableIterator<[string, any]>;
        forEach(callbackfn: (value: any, key: string, map: Map<string, any>) => void, thisArg?: any): void;
    }
}