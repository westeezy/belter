/* eslint max-lines: 0 */
import { ZalgoPromise } from 'zalgo-promise/src';
import { WeakMap } from 'cross-domain-safe-weakmap/src';

import type { CancelableType } from './types';

export function getFunctionName(fn : Function) : string {
    // @ts-ignore - cant infer this all from T
    return fn.name || fn.__name__ || fn.displayName || 'anonymous';
}

export function setFunctionName<T extends Function>(fn : T, name : string) : T {
    try {
        // @ts-ignore this should be readonly
        delete fn.name;
        // @ts-ignore this should be readonly
        fn.name = name;
    } catch (err) {
        // pass
    }

    // @ts-ignore this should be readonly
    fn.__name__ = fn.displayName = name;
    return fn;
}

export function base64encode(str : string) : string {
    if (typeof btoa === 'function') {
        return btoa(
            encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (m, p1) => {
                return String.fromCharCode(parseInt(p1, 16));
            })
        ).replace(/[=]/g, '');
    }

    if (typeof Buffer !== 'undefined') {
        return Buffer.from(str, 'utf8').toString('base64').replace(/[=]/g, '');
    }

    throw new Error(`Can not find window.btoa or Buffer`);
}

export function base64decode(str : string) : string {
    if (typeof atob === 'function') {
        return decodeURIComponent(
            Array.prototype.map
                .call(atob(str), (c) => {
                    return `%${ `00${ c.charCodeAt(0).toString(16) }`.slice(-2) }`;
                })
                .join('')
        );
    }

    if (typeof Buffer !== 'undefined') {
        return Buffer.from(str, 'base64').toString('utf8');
    }

    throw new Error(`Can not find window.atob or Buffer`);
}

export function uniqueID() : string {
    const chars = '0123456789abcdef';
    const randomID = 'xxxxxxxxxx'.replace(/./g, () => {
        return chars.charAt(Math.floor(Math.random() * chars.length));
    });
    const timeID = base64encode(new Date().toISOString().slice(11, 19).replace('T', '.'))
        .replace(/[^a-zA-Z0-9]/g, '')
        .toLowerCase();
    return `uid_${ randomID }_${ timeID }`;
}

// eslint-disable-next-line  @typescript-eslint/no-explicit-any
export function getGlobal() : Record<string, any> {
    if (typeof window !== 'undefined') {
        return window;
    }

    if (typeof global !== 'undefined') {
        return global;
    }

    // @ts-ignore - globals
    if (typeof __GLOBAL__ !== 'undefined') {
        // @ts-ignore - globals
        return __GLOBAL__;
    }

    throw new Error(`No global found`);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let objectIDs : any;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getObjectID(obj : Record<string, any>) : string {
    objectIDs = objectIDs || new WeakMap();

    if (obj === null || obj === undefined || (typeof obj !== 'object' && typeof obj !== 'function')) {
        throw new Error(`Invalid object`);
    }

    let uid = objectIDs.get(obj);

    if (!uid) {
        uid = `${ typeof obj }:${ uniqueID() }`;
        objectIDs.set(obj, uid);
    }

    return uid;
}

function serializeArgs<T>(args : ReadonlyArray<T>) : string {
    try {
        return JSON.stringify(Array.prototype.slice.call(args), (subkey, val) => {
            if (typeof val === 'function') {
                return `memoize[${ getObjectID(val) }]`;
            }

            return val;
        });
    } catch (err) {
        throw new Error(`Arguments not serializable -- can not be used to memoize`);
    }
}

export function getEmptyObject() : Record<string, undefined> {
    return {};
}

type MemoizeOptions = {
    name ?: string;
    time ?: number;
    thisNamespace ?: boolean;
};

const getDefaultMemoizeOptions = () : MemoizeOptions => {
    return {};
};

export type Memoized<F> = F & {
    reset : () => void;
};

let memoizeGlobalIndex = 0;
let memoizeGlobalIndexValidFrom = 0;

export function memoize<F extends Function>(method : F, options : MemoizeOptions = getDefaultMemoizeOptions()) : Memoized<F> {
    const { thisNamespace = false, time: cacheTime } = options;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let simpleCache : any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let thisCache : any;

    let memoizeIndex = memoizeGlobalIndex;
    memoizeGlobalIndex += 1;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const memoizedFunction = function memoizedFunction(...args : any) : unknown {
        if (memoizeIndex < memoizeGlobalIndexValidFrom) {
            simpleCache = null;
            thisCache = null;
            memoizeIndex = memoizeGlobalIndex;
            memoizeGlobalIndex += 1;
        }

        let cache;

        if (thisNamespace) {
            thisCache = thisCache || new WeakMap();
            // @ts-ignore this is any
            cache = thisCache.getOrSet(this, getEmptyObject);
        } else {
            cache = simpleCache = simpleCache || {};
        }

        const cacheKey = serializeArgs(args);
        let cacheResult = cache[cacheKey];

        if (cacheResult && cacheTime && Date.now() - cacheResult.time < cacheTime) {
            delete cache[cacheKey];
            cacheResult = null;
        }

        if (cacheResult) {
            return cacheResult.value;
        }

        const time = Date.now();
        // @ts-ignore
        const value = method.apply(this, arguments);
        cache[cacheKey] = {
            time,
            value
        };
        return value;
    };

    memoizedFunction.reset = () => {
        simpleCache = null;
        thisCache = null;
    };

    // @ts-ignore
    const result : F = memoizedFunction;
    // @ts-ignore
    return setFunctionName(result, `${ options.name || getFunctionName(method) }::memoized`);
}

memoize.clear = () => {
    memoizeGlobalIndexValidFrom = memoizeGlobalIndex;
};

export function promiseIdentity<T extends unknown>(item : ZalgoPromise<T> | T) : ZalgoPromise<T> {
    return ZalgoPromise.resolve(item);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function memoizePromise<R>(method : (...args : ReadonlyArray<any>) => ZalgoPromise<R>) : (...args : ReadonlyArray<any>) => ZalgoPromise<R> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let cache : Record<string, any> = {};

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function memoizedPromiseFunction(...args : ReadonlyArray<any>) : ZalgoPromise<R> {
        const key : string = serializeArgs(args);

        if (cache.hasOwnProperty(key)) {
            return cache[key];
        }

        cache[key] = ZalgoPromise.try(() =>
            // @ts-ignore
            method.apply(this, arguments)).finally(() => {
            delete cache[key];
        });
        return cache[key];
    }

    memoizedPromiseFunction.reset = () => {
        cache = {};
    };

    return setFunctionName(memoizedPromiseFunction, `${ getFunctionName(method) }::promiseMemoized`);
}

type PromisifyOptions = {
    name ?: string;
};

const getDefaultPromisifyOptions = () : PromisifyOptions => {
    return {};
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function promisify<R>(method : (...args : ReadonlyArray<any>) => R, options : PromisifyOptions = getDefaultPromisifyOptions()) : (...args : ReadonlyArray<any>) => ZalgoPromise<R> {
    function promisifiedFunction() : ZalgoPromise<R> {
        // @ts-ignore
        return ZalgoPromise.try(method, this, arguments);
    }

    if (options.name) {
        promisifiedFunction.displayName = `${ options.name }:promisified`;
    }

    return setFunctionName(promisifiedFunction, `${ getFunctionName(method) }::promisified`);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any, no-shadow
export function inlineMemoize<R>(method : (...args : ReadonlyArray<any>) => R, logic : (...args : ReadonlyArray<any>) => R, args : ReadonlyArray<any> = []) : R {
    // @ts-ignore method.__inline_memoize_cache__ not in type def
    const cache : Record<string, R> = (method.__inline_memoize_cache__ = method.__inline_memoize_cache__ || {});
    const key = serializeArgs(args);

    if (cache.hasOwnProperty(key)) {
        return cache[key];
    }

    const result = (cache[key] = logic(...args));
    return result;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function noop(...args : ReadonlyArray<unknown>) : void {
    // pass
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function once(method : (...args : Array<any>) => any) : (...args : Array<any>) => any {
    let called = false;

    const onceFunction = function () : unknown {
        if (!called) {
            called = true;
            // @ts-ignore
            return method.apply(this, arguments);
        }
    };

    return setFunctionName(onceFunction, `${ getFunctionName(method) }::once`);
}

export function hashStr(str : string) : number {
    let hash = 0;

    for (let i = 0; i < str.length; i++) {
        hash += str[i].charCodeAt(0) * Math.pow((i % 10) + 1, 5);
    }

    return Math.floor(Math.pow(Math.sqrt(hash), 5));
}

export function strHashStr(str : string) : string {
    let hash = '';

    for (let i = 0; i < str.length; i++) {
        let total = str[i].charCodeAt(0) * i;

        if (str[i + 1]) {
            total += str[i + 1].charCodeAt(0) * (i - 1);
        }

        hash += String.fromCharCode(97 + (Math.abs(total) % 26));
    }

    return hash;
}

export function match(str : string, pattern : RegExp) : string | null | undefined {
    const regmatch = str.match(pattern);

    if (regmatch) {
        return regmatch[1];
    }
}

export function awaitKey<T extends unknown>(obj : Record<string, T>, key : string) : ZalgoPromise<T> {
    return new ZalgoPromise((resolve : Function) => {
        let value = obj[key];

        if (value) {
            return resolve(value);
        }

        delete obj[key];
        Object.defineProperty(obj, key, {
            configurable: true,

            set(item) {
                value = item;

                if (value) {
                    resolve(value);
                }
            },

            get() : T {
                return value;
            }
        });
    });
}

export function stringifyError(err : unknown, level = 1) : string {
    if (level >= 3) {
        return 'stringifyError stack overflow';
    }

    try {
        if (!err) {
            return `<unknown error: ${ Object.prototype.toString.call(err) }>`;
        }

        if (typeof err === 'string') {
            return err;
        }

        if (err instanceof Error) {
            const stack = err && err.stack;
            const message = err && err.message;

            if (stack && message) {
                if (stack.indexOf(message) !== -1) {
                    return stack;
                } else {
                    return `${ message }\n${ stack }`;
                }
            } else if (stack) {
                return stack;
            } else if (message) {
                return message;
            }
        }

        // @ts-ignore
        if (err && err.toString && typeof err.toString === 'function') {
            // @ts-ignore
            return err.toString();
        }

        return Object.prototype.toString.call(err);
    } catch (newErr) {
        return `Error while stringifying error: ${ stringifyError(newErr, level + 1) }`;
    }
}

export function stringifyErrorMessage(err : Error) : string {
    const defaultMessage = `<unknown error: ${ Object.prototype.toString.call(err) }>`;

    if (!err) {
        return defaultMessage;
    }

    if (err instanceof Error) {
        return err.message || defaultMessage;
    }

    // @ts-ignore
    if (typeof err.message === 'string') {
        // @ts-ignore
        return err.message || defaultMessage;
    }

    return defaultMessage;
}

export function stringify(item : unknown) : string {
    if (typeof item === 'string') {
        return item;
    }

    // @ts-ignore
    if (item && item.toString && typeof item.toString === 'function') {
        // @ts-ignore
        return item.toString();
    }

    return Object.prototype.toString.call(item);
}

export function domainMatches(hostname : string, domain : string) : boolean {
    hostname = hostname.split('://')[1];
    const index = hostname.indexOf(domain);
    return index !== -1 && hostname.slice(index) === domain;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function patchMethod(obj : Record<string, any>, name : string, handler : (...args : Array<any>) => any) : void {
    const original = obj[name];

    obj[name] = function patchedMethod() : unknown {
        return handler({
            context:      this,
            args:         Array.prototype.slice.call(arguments),
            original,
            // @ts-ignore
            callOriginal: () => original.apply(this, arguments)
        });
    };
}

export function extend<T>(obj : Record<string, T>, source : Record<string, T>) : Record<string, T> {
    if (!source) {
        return obj;
    }

    if (Object.assign) {
        return Object.assign(obj, source);
    }

    for (const key in source) {
        if (source.hasOwnProperty(key)) {
            // @ts-ignore
            obj[key] = source[key];
        }
    }

    return obj;
}

export function values<T>(obj : Record<string, T>) : ReadonlyArray<T> {
    if (Object.values) {
        return Object.values(obj);
    }

    const result : Array<T> = [];

    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            result.push(obj[key]);
        }
    }

    return result;
}

export const memoizedValues : <T>(arg0 : Record<string, T>) => ReadonlyArray<T> = memoize(values);

export function perc(pixels : number, percentage : number) : number {
    return Math.round((pixels * percentage) / 100);
}

export function min(...args : ReadonlyArray<number>) : number {
    return Math.min(...args);
}

export function max(...args : ReadonlyArray<number>) : number {
    return Math.max(...args);
}

export function roundUp(num : number, nearest : number) : number {
    const remainder = num % nearest;
    return remainder ? num - remainder + nearest : num;
}

export function regexMap<T>(str : string, regexp : RegExp, handler : () => T) : ReadonlyArray<T> {
    const results : T[] = [];
    // @ts-ignore
    str.replace(regexp, function regexMapMatcher(item : string) {
        // @ts-ignore
        results.push(handler ? handler.apply(null, arguments) : item);
    });
    return results;
}

export function svgToBase64(svg : string) : string {
    return `data:image/svg+xml;base64,${ base64encode(svg) }`;
}

export function objFilter<T, R>(
    obj : Record<string, T>,
    filter : (arg0 : T, arg1 : string | null | undefined) => unknown = Boolean
) : Record<string, R> {
    const result : Record<string, R> = {};

    for (const key in obj) {
        if (!obj.hasOwnProperty(key) || !filter(obj[key], key)) {
            continue;
        }

        // @ts-ignore expect R but gets T
        result[key] = obj[key];
    }

    return result;
}

export function identity<T>(item : T) : T {
    return item;
}

export function regexTokenize(text : string, regexp : RegExp) : ReadonlyArray<string> {
    const result : string[] = [];
    text.replace(regexp, (token) => {
        result.push(token);
        return '';
    });
    return result;
}

export function promiseDebounce<T>(method : () => ZalgoPromise<T> | T, delay = 50) : () => ZalgoPromise<T> {
    let promise : ZalgoPromise<T> | null;
    let timeout : NodeJS.Timeout | null;

    const promiseDebounced = function () : ZalgoPromise<T> {
        if (timeout) {
            clearTimeout(timeout);
        }

        const localPromise = (promise = promise || new ZalgoPromise());
        timeout = setTimeout(() => {
            promise = null;
            timeout = null;
            ZalgoPromise.try(method).then(
                (result : T) => {
                    localPromise.resolve(result);
                },
                (err : unknown) => {
                    localPromise.reject(err);
                }
            );
        }, delay);
        return localPromise;
    };

    return setFunctionName(promiseDebounced, `${ getFunctionName(method) }::promiseDebounced`);
}

// eslint-disable-next-line  @typescript-eslint/no-explicit-any
export function safeInterval(method : (...args : Array<any>) => any, time : number) : {
    cancel : () => void;
} {
    let timeout : NodeJS.Timeout;

    function loop() {
        timeout = setTimeout(() => {
            method();
            loop();
        }, time);
    }

    loop();
    return {
        cancel() {
            clearTimeout(timeout);
        }
    };
}

export function isInteger(str : string) : boolean {
    return Boolean(str.match(/^[0-9]+$/));
}

export function isFloat(str : string) : boolean {
    return Boolean(str.match(/^[0-9]+\.[0-9]+$/));
}

export function serializePrimitive(value : string | number | boolean) : string {
    return value.toString();
}

export function deserializePrimitive(value : string) : string | number | boolean {
    if (value === 'true') {
        return true;
    } else if (value === 'false') {
        return false;
    } else if (isInteger(value)) {
        return parseInt(value, 10);
    } else if (isFloat(value)) {
        return parseFloat(value);
    } else {
        return value;
    }
}

export function dotify(
    // eslint-disable-next-line  @typescript-eslint/no-explicit-any
    obj : Record<string, any>,
    prefix = '',
    // eslint-disable-next-line  @typescript-eslint/no-explicit-any
    newobj : Record<string, any> = {}
) : Record<string, string> {
    prefix = prefix ? `${ prefix }.` : prefix;

    for (const key in obj) {
        if (!obj.hasOwnProperty(key) || obj[key] === undefined || obj[key] === null || typeof obj[key] === 'function') {
            continue;
        } else if (
            obj[key] &&
            Array.isArray(obj[key]) &&
            obj[key].length &&
            // eslint-disable-next-line  @typescript-eslint/no-explicit-any
            obj[key].every((val : any) => typeof val !== 'object')
        ) {
            newobj[`${ prefix }${ key }[]`] = obj[key].join(',');
        } else if (obj[key] && typeof obj[key] === 'object') {
            newobj = dotify(obj[key], `${ prefix }${ key }`, newobj);
        } else {
            newobj[`${ prefix }${ key }`] = serializePrimitive(obj[key]);
        }
    }

    return newobj;
}

// eslint-disable-next-line  @typescript-eslint/no-explicit-any
export function undotify(obj : Record<string, string>) : Record<string, any> {
    // eslint-disable-next-line  @typescript-eslint/no-explicit-any
    const result : Record<string, any> = {};

    for (let key in obj) {
        if (!obj.hasOwnProperty(key) || typeof obj[key] !== 'string') {
            continue;
        }

        // eslint-disable-next-line  @typescript-eslint/no-explicit-any
        let value : any = obj[key];

        if (key.match(/^.+\[\]$/)) {
            key = key.slice(0, -2);
            value = value.split(',').map(deserializePrimitive);
        } else {
            value = deserializePrimitive(value);
        }

        let keyResult = result;
        const parts = key.split('.');

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            const isLast = i + 1 === parts.length;
            const isIndex = !isLast && isInteger(parts[i + 1]);

            if (part === 'constructor' || part === 'prototype' || part === '__proto__') {
                throw new Error(`Disallowed key: ${ part }`);
            }

            if (isLast) {
                keyResult[part] = value;
            } else {
                keyResult = keyResult[part] = keyResult[part] || (isIndex ? [] : {});
            }
        }
    }

    return result;
}

export type EventEmitterType = {
    // eslint-disable-next-line  @typescript-eslint/no-explicit-any
    on : (eventName : string, handler : (...args : Array<any>) => any) => CancelableType;
    // eslint-disable-next-line  @typescript-eslint/no-explicit-any
    once : (eventName : string, handler : (...args : Array<any>) => any) => CancelableType;
    trigger : (eventName : string, ...args : ReadonlyArray<unknown>) => ZalgoPromise<void>;
    triggerOnce : (eventName : string, ...args : ReadonlyArray<unknown>) => ZalgoPromise<void>;
    reset : () => void;
};

export function eventEmitter() : EventEmitterType {
    const triggered = {};
    let handlers = {};
    const emitter = {
        // eslint-disable-next-line  @typescript-eslint/no-explicit-any
        on(eventName : string, handler : (...args : Array<any>) => any) : CancelableType {
            // @ts-ignore
            const handlerList = (handlers[eventName] = handlers[eventName] || []);
            handlerList.push(handler);
            let cancelled = false;
            return {
                cancel() {
                    if (!cancelled) {
                        cancelled = true;
                        handlerList.splice(handlerList.indexOf(handler), 1);
                    }
                }
            };
        },

        // eslint-disable-next-line  @typescript-eslint/no-explicit-any
        once(eventName : string, handler : (...args : Array<any>) => any) : CancelableType {
            const listener = emitter.on(eventName, () => {
                listener.cancel();
                handler();
            });
            return listener;
        },

        trigger(eventName : string, ...args : ReadonlyArray<unknown>) : ZalgoPromise<void> {
            // @ts-ignore
            const handlerList = handlers[eventName];
            const promises = [];

            if (handlerList) {
                for (const handler of handlerList) {
                    promises.push(ZalgoPromise.try(() => handler(...args)));
                }
            }

            return ZalgoPromise.all(promises).then(noop);
        },

        triggerOnce(eventName : string, ...args : ReadonlyArray<unknown>) : ZalgoPromise<void> {
            // @ts-ignore
            if (triggered[eventName]) {
                return ZalgoPromise.resolve();
            }

            // @ts-ignore
            triggered[eventName] = true;
            return emitter.trigger(eventName, ...args);
        },

        reset() {
            handlers = {};
        }
    };
    return emitter;
}

export function camelToDasherize(string : string) : string {
    return string.replace(/([A-Z])/g, (g) => {
        return `-${ g.toLowerCase() }`;
    });
}

export function dasherizeToCamel(string : string) : string {
    return string.replace(/-([a-z])/g, (g) => {
        return g[1].toUpperCase();
    });
}

export function capitalizeFirstLetter(string : string) : string {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function get(item : Record<string, any>, path : string, def : unknown) : unknown {
    if (!path) {
        return def;
    }

    const pathParts = path.split('.');

    // Loop through each section of our key path
    for (let i = 0; i < pathParts.length; i++) {
        // If we have an object, we can get the key
        if (typeof item === 'object' && item !== null) {
            item = item[pathParts[i]]; // Otherwise, we should return the default (undefined if not provided)
        } else {
            return def;
        }
    }

    // If our final result is undefined, we should return the default
    return item === undefined ? def : item;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function safeTimeout(method : (...args : Array<any>) => any, time : number) : void {
    const interval = safeInterval(() => {
        time -= 100;

        if (time <= 0) {
            interval.cancel();
            method();
        }
    }, 100);
}

export function defineLazyProp<T>(
    obj : Record<string, T> | ReadonlyArray<unknown>,
    key : string | number,
    getter : () => T
) : void {
    if (Array.isArray(obj)) {
        if (typeof key !== 'number') {
            throw new TypeError(`Array key must be number`);
        }
    } else if (typeof obj === 'object' && obj !== null) {
        if (typeof key !== 'string') {
            throw new TypeError(`Object key must be string`);
        }
    }

    Object.defineProperty(obj, key, {
        configurable: true,
        enumerable:   true,
        get:          () => {
            // @ts-ignore
            delete obj[key];
            const value = getter();
            // @ts-ignore
            obj[key] = value;
            return value;
        },
        set: (value : T) => {
            // @ts-ignore
            delete obj[key];
            // @ts-ignore
            obj[key] = value;
        }
    });
}

export function arrayFrom<T>(item : Iterable<T>) : ReadonlyArray<T> {
    return Array.prototype.slice.call(item);
}

export function isObject(item : unknown) : boolean {
    return typeof item === 'object' && item !== null;
}

export function isObjectObject(obj : unknown) : boolean {
    return isObject(obj) && Object.prototype.toString.call(obj) === '[object Object]';
}

export function isPlainObject(obj : unknown) : boolean {
    if (!isObjectObject(obj)) {
        return false;
    }

    // @ts-ignore
    const constructor = obj.constructor;

    if (typeof constructor !== 'function') {
        return false;
    }

    const prototype = constructor.prototype;

    if (!isObjectObject(prototype)) {
        return false;
    }

    if (!prototype.hasOwnProperty('isPrototypeOf')) {
        return false;
    }

    return true;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function replaceObject<T extends ReadonlyArray<unknown> | Record<string, any>>(
    item : T,
    replacer : (arg0 : unknown, arg1 : string | number, arg2 : string) => unknown,
    fullKey = ''
) : T {
    if (Array.isArray(item)) {
        const length = item.length;
        const result : Array<unknown> = [];

        for (let i = 0; i < length; i++) {
            defineLazyProp(result, i, () => {
                const itemKey = fullKey ? `${ fullKey }.${ i }` : `${ i }`;
                const el = item[i];
                let child = replacer(el, i, itemKey);

                if (isPlainObject(child) || Array.isArray(child)) {
                    // @ts-ignore
                    child = replaceObject(child, replacer, itemKey);
                }

                return child;
            });
        }

        // @ts-ignore
        return result;
    } else if (isPlainObject(item)) {
        const result = {};

        for (const key in item) {
            if (!item.hasOwnProperty(key)) {
                continue;
            }

            defineLazyProp(result, key, () => {
                const itemKey = fullKey ? `${ fullKey }.${ key }` : `${ key }`;
                const el = item[key];
                let child = replacer(el, key, itemKey);

                if (isPlainObject(child) || Array.isArray(child)) {
                    // @ts-ignore
                    child = replaceObject(child, replacer, itemKey);
                }

                return child;
            });
        }

        // @ts-ignore
        return result;
    } else {
        throw new Error(`Pass an object or array`);
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function copyProp(source : Record<string, any>, target : Record<string, any>, name : string, def : unknown) : void {
    if (source.hasOwnProperty(name)) {
        const descriptor = Object.getOwnPropertyDescriptor(source, name);
        // @ts-ignore
        Object.defineProperty(target, name, descriptor);
    } else {
        target[name] = def;
    }
}

type RegexResultType = {
    text : string;
    groups : ReadonlyArray<string>;
    start : number;
    end : number;
    length : number;
    replace : (text : string) => string;
};

export function regex(pattern : string | RegExp, string : string, start = 0) : RegexResultType | null | undefined {
    if (typeof pattern === 'string') {
        // eslint-disable-next-line security/detect-non-literal-regexp
        pattern = new RegExp(pattern);
    }

    const result = string.slice(start).match(pattern);

    if (!result) {
        return;
    }

    const index : number = result.index as number;
    const regmatch = result[0];
    return {
        text:   regmatch,
        groups: result.slice(1),
        start:  start + index,
        end:    start + index + regmatch.length,
        length: regmatch.length,

        replace(text : string) : string {
            if (!regmatch) {
                return '';
            }

            return `${ regmatch.slice(0, start + index) }${ text }${ regmatch.slice(index + regmatch.length) }`;
        }
    };
}

export function regexAll(pattern : string | RegExp, string : string) : ReadonlyArray<RegexResultType> {
    const matches = [];
    let start = 0;

    // eslint-disable-next-line no-constant-condition
    while (true) {
        const regmatch = regex(pattern, string, start);

        if (!regmatch) {
            break;
        }

        matches.push(regmatch);
        // @ts-ignore
        start = match.end;
    }

    return matches;
}

export function isDefined(value : unknown | null | undefined) : boolean {
    return value !== null && value !== undefined;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function cycle(method : (...args : Array<any>) => any) : ZalgoPromise<void> {
    // @ts-ignore - not even sure what to do with this
    return ZalgoPromise.try(method).then(() => cycle(method));
}

export function debounce<T>(
    method : (...args : ReadonlyArray<unknown>) => T,
    time = 100
) : (...args : ReadonlyArray<unknown>) => void {
    let timeout : NodeJS.Timeout;

    const debounceWrapper = function () {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            // @ts-ignore
            return method.apply(this, arguments);
        }, time);
    };

    return setFunctionName(debounceWrapper, `${ getFunctionName(method) }::debounced`);
}

export function isRegex(item : unknown) : boolean {
    return Object.prototype.toString.call(item) === '[object RegExp]';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FunctionProxy<T extends (...args : Array<any>) => any> = (method : T) => T;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const weakMapMemoize : FunctionProxy<any> = <R extends unknown>(method : (arg : any) => R) : ((...args : ReadonlyArray<any>) => R) => {
    const weakmap = new WeakMap();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return function weakmapMemoized(arg : any) : R {
        // @ts-ignore
        return weakmap.getOrSet(arg, () => method.call(this, arg));
    };
};

type FunctionPromiseProxy<R extends unknown, T extends (...args : ReadonlyArray<unknown>) => ZalgoPromise<R>> = (
    arg0 : T
) => T;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const weakMapMemoizePromise : FunctionPromiseProxy<any, any> = <R extends unknown>(method : (arg : any) => ZalgoPromise<R>) : ((...args : ReadonlyArray<any>) => ZalgoPromise<R>) => {
    const weakmap = new WeakMap();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return function weakmapMemoizedPromise(arg : any) : ZalgoPromise<R> {
        // @ts-ignore
        return weakmap.getOrSet(arg, () =>
            // @ts-ignore
            method.call(this, arg).finally(() => {
                weakmap.delete(arg);
            }));
    };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getOrSet<T extends unknown>(obj : Record<string, any>, key : string, getter : () => T) : T {
    if (obj.hasOwnProperty(key)) {
        return obj[key];
    }

    const val = getter();
    obj[key] = val;
    return val;
}

export type CleanupType = {
    set : <T extends unknown>(arg0 : string, arg1 : T) => T;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    register : (arg0 : (...args : Array<any>) => any) => void;
    all : (err ?: unknown) => ZalgoPromise<void>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function cleanup(obj : Record<string, any>) : CleanupType {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tasks : Array<any> = [];
    let cleaned = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let cleanErr : any;
    const cleaner = {
        set<T extends unknown>(name : string, item : T) : T {
            if (!cleaned) {
                obj[name] = item;
                cleaner.register(() => {
                    delete obj[name];
                });
            }

            return item;
        },

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        register(method : (...args : Array<any>) => any) {
            if (cleaned) {
                method(cleanErr);
            } else {
                tasks.push(once(() => method(cleanErr)));
            }
        },

        all(err ?: unknown) : ZalgoPromise<void> {
            cleanErr = err;
            const results = [];
            cleaned = true;

            while (tasks.length) {
                const task = tasks.shift();
                results.push(task());
            }

            return ZalgoPromise.all(results).then(noop);
        }
    };
    return cleaner;
}

export function tryCatch<T>(fn : () => T) :
    | {
          result : T;
          error : void;
      }
    | {
          result : T | undefined;
          error : unknown;
      } {
    let result;
    let error;

    try {
        result = fn();
    } catch (err) {
        error = err;
    }

    return {
        result,
        error
    };
}

export function removeFromArray<X, T extends Array<X>>(arr : T, item : X) : void {
    const index = arr.indexOf(item);

    if (index !== -1) {
        arr.splice(index, 1);
    }
}

export function assertExists<T>(name : string, thing : void | null | T) : T {
    if (thing === null || typeof thing === 'undefined') {
        throw new Error(`Expected ${ name } to be present`);
    }

    return thing;
}

export function unique(arr : ReadonlyArray<string>) : ReadonlyArray<string> {
    const result : Record<string, boolean> = {};

    for (const item of arr) {
        result[item] = true;
    }

    return Object.keys(result);
}

export const constHas = <X extends string | boolean | number, T extends Record<string, X>>(
    constant : T,
    value : X
) : boolean => {
    return memoizedValues(constant).indexOf(value) !== -1;
};

export function dedupeErrors<T>(handler : (arg0 : unknown) => T) : (arg0 : unknown) => T | void {
    const seenErrors : unknown[] = [];
    const seenStringifiedErrors : Record<string, unknown> = {};
    return (err) => {
        if (seenErrors.indexOf(err) !== -1) {
            return;
        }

        seenErrors.push(err);
        const stringifiedError = stringifyError(err);

        if (seenStringifiedErrors[stringifiedError]) {
            return;
        }

        seenStringifiedErrors[stringifiedError] = true;
        return handler(err);
    };
}

export class ExtendableError extends Error {
    constructor(message : string) {
        super(message);
        // eslint-disable-next-line unicorn/custom-error-definition
        this.name = this.constructor.name;

        if (typeof Error.captureStackTrace === 'function') {
            Error.captureStackTrace(this, this.constructor);
        } else {
            this.stack = new Error(message).stack;
        }
    }
}
