import { getGlobal } from './util';

export function getGlobalNameSpace<T extends Record<string, T>>({
    name,
    version = 'latest'
} : {
    name : string;
    version ?: string;
}) : {
    get : (arg0 : string, defValue ?: T) => T;
} {
    const global = getGlobal();
    const globalKey = `__${ name }__${ version }_global__`;
    const namespace = (global[globalKey] = global[globalKey] || {});
    return {
        get: (key : string, defValue ?: T) : T => {
            // @ts-ignore
            defValue = defValue || {};
            const item = (namespace[key] = namespace[key] || defValue);
            return item;
        }
    };
}
