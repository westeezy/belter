export declare function getGlobalNameSpace<T extends Record<string, T>>({ name, version }: {
    name: string;
    version?: string;
}): {
    get: (arg0: string, defValue?: T) => T;
};
