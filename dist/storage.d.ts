declare type Getter<T> = (handler: (arg0: Record<string, any>) => T) => T;
export declare type Storage = {
    getState: Getter<any>;
    getID: () => string;
    isStateFresh: () => boolean;
    getSessionState: Getter<any>;
    getSessionID: () => string;
};
export declare function getStorage({ name, lifetime }: {
    name: string;
    lifetime?: number;
}): Storage;
export {};
