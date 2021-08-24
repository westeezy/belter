export declare function getGlobalNameSpace<T extends Record<string, any>>({ name, version }: {
    name: string;
    version?: string;
}): {
    get: (arg0: string, defValue?: T) => T;
};
