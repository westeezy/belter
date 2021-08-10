import { ZalgoPromise } from 'zalgo-promise';
import type { CancelableType } from './types';
export declare function getFunctionName<T extends (...args: Array<any>) => any>(fn: T): string;
export declare function setFunctionName<T extends (...args: Array<any>) => any>(fn: T, name: string): T;
export declare function base64encode(str: string): string;
export declare function base64decode(str: string): string;
export declare function uniqueID(): string;
export declare function getGlobal(): Record<string, any>;
export declare function getObjectID(obj: Record<string, any>): string;
export declare function getEmptyObject(): Record<string, undefined>;
declare type MemoizeOptions = {
    name?: string;
    time?: number;
    thisNamespace?: boolean;
};
export declare type Memoized<F> = F & {
    reset: () => void;
};
export declare function memoize<F extends (...args: Array<any>) => any>(method: F, options?: MemoizeOptions): Memoized<F>;
export declare namespace memoize {
    var clear: () => void;
}
export declare function promiseIdentity<T extends unknown>(item: ZalgoPromise<T> | T): ZalgoPromise<T>;
export declare function memoizePromise<R>(method: (...args: ReadonlyArray<any>) => ZalgoPromise<R>): (...args: ReadonlyArray<any>) => ZalgoPromise<R>;
declare type PromisifyOptions = {
    name?: string;
};
export declare function promisify<R>(method: (...args: ReadonlyArray<any>) => R, options?: PromisifyOptions): (...args: ReadonlyArray<any>) => ZalgoPromise<R>;
export declare function inlineMemoize<R>(method: (...args: ReadonlyArray<any>) => R, logic: (...args: ReadonlyArray<any>) => R, args?: ReadonlyArray<any>): R;
export declare function noop(...args: ReadonlyArray<unknown>): void;
export declare function once(method: (...args: Array<any>) => any): (...args: Array<any>) => any;
export declare function hashStr(str: string): number;
export declare function strHashStr(str: string): string;
export declare function match(str: string, pattern: RegExp): string | null | undefined;
export declare function awaitKey<T extends unknown>(obj: Record<string, any>, key: string): ZalgoPromise<T>;
export declare function stringifyError(err: unknown, level?: number): string;
export declare function stringifyErrorMessage(err: Error): string;
export declare function stringify(item: unknown): string;
export declare function domainMatches(hostname: string, domain: string): boolean;
export declare function patchMethod(obj: Record<string, any>, name: string, handler: (...args: Array<any>) => any): void;
export declare function extend<T extends Record<string, any> | ((...args: Array<any>) => any)>(obj: T, source: Record<string, any>): T;
export declare function values<T>(obj: Record<string, T>): ReadonlyArray<T>;
export declare const memoizedValues: <T>(arg0: Record<string, T>) => ReadonlyArray<T>;
export declare function perc(pixels: number, percentage: number): number;
export declare function min(...args: ReadonlyArray<number>): number;
export declare function max(...args: ReadonlyArray<number>): number;
export declare function roundUp(num: number, nearest: number): number;
export declare function regexMap<T>(str: string, regexp: RegExp, handler: () => T): ReadonlyArray<T>;
export declare function svgToBase64(svg: string): string;
export declare function objFilter<T, R>(obj: Record<string, T>, filter?: (arg0: T, arg1: string | null | undefined) => unknown): Record<string, R>;
export declare function identity<T>(item: T): T;
export declare function regexTokenize(text: string, regexp: RegExp): ReadonlyArray<string>;
export declare function promiseDebounce<T>(method: () => ZalgoPromise<T> | T, delay?: number): () => ZalgoPromise<T>;
export declare function safeInterval(method: (...args: Array<any>) => any, time: number): {
    cancel: () => void;
};
export declare function isInteger(str: string): boolean;
export declare function isFloat(str: string): boolean;
export declare function serializePrimitive(value: string | number | boolean): string;
export declare function deserializePrimitive(value: string): string | number | boolean;
export declare function dotify(obj: Record<string, any>, prefix?: string, newobj?: Record<string, any>): Record<string, string>;
export declare function undotify(obj: Record<string, string>): Record<string, any>;
export declare type EventEmitterType = {
    on: (eventName: string, handler: (...args: Array<any>) => any) => CancelableType;
    once: (eventName: string, handler: (...args: Array<any>) => any) => CancelableType;
    trigger: (eventName: string, ...args: ReadonlyArray<unknown>) => ZalgoPromise<void>;
    triggerOnce: (eventName: string, ...args: ReadonlyArray<unknown>) => ZalgoPromise<void>;
    reset: () => void;
};
export declare function eventEmitter(): EventEmitterType;
export declare function camelToDasherize(string: string): string;
export declare function dasherizeToCamel(string: string): string;
export declare function capitalizeFirstLetter(string: string): string;
export declare function get(item: Record<string, any>, path: string, def: unknown): unknown;
export declare function safeTimeout(method: (...args: Array<any>) => any, time: number): void;
export declare function defineLazyProp<T>(obj: Record<string, any> | ReadonlyArray<unknown>, key: string | number, getter: () => T): void;
export declare function arrayFrom<T>(item: Iterable<T>): ReadonlyArray<T>;
export declare function isObject(item: unknown): boolean;
export declare function isObjectObject(obj: unknown): boolean;
export declare function isPlainObject(obj: unknown): boolean;
export declare function replaceObject<T extends ReadonlyArray<unknown> | Record<string, any>>(item: T, replacer: (arg0: unknown, arg1: string | number, arg2: string) => unknown, fullKey?: string): T;
export declare function copyProp(source: Record<string, any>, target: Record<string, any>, name: string, def: unknown): void;
declare type RegexResultType = {
    text: string;
    groups: ReadonlyArray<string>;
    start: number;
    end: number;
    length: number;
    replace: (text: string) => string;
};
export declare function regex(pattern: string | RegExp, string: string, start?: number): RegexResultType | null | undefined;
export declare function regexAll(pattern: string | RegExp, string: string): ReadonlyArray<RegexResultType>;
export declare function isDefined(value: unknown | null | undefined): boolean;
export declare function cycle(method: (...args: Array<any>) => any): ZalgoPromise<void>;
export declare function debounce<T>(method: (...args: ReadonlyArray<unknown>) => T, time?: number): (...args: ReadonlyArray<unknown>) => void;
export declare function isRegex(item: unknown): boolean;
declare type FunctionProxy<T extends (...args: Array<any>) => any> = (method: T) => T;
export declare const weakMapMemoize: FunctionProxy<any>;
declare type FunctionPromiseProxy<R extends unknown, T extends (...args: ReadonlyArray<unknown>) => ZalgoPromise<R>> = (arg0: T) => T;
export declare const weakMapMemoizePromise: FunctionPromiseProxy<any, any>;
export declare function getOrSet<T extends unknown>(obj: Record<string, any>, key: string, getter: () => T): T;
export declare type CleanupType = {
    set: <T extends unknown>(arg0: string, arg1: T) => T;
    register: (arg0: (...args: Array<any>) => any) => void;
    all: (err?: unknown) => ZalgoPromise<void>;
};
export declare function cleanup(obj: Record<string, any>): CleanupType;
export declare function tryCatch<T>(fn: () => T): {
    result: T;
    error: void;
} | {
    result: T | undefined;
    error: unknown;
};
export declare function removeFromArray<X, T extends Array<X>>(arr: T, item: X): void;
export declare function assertExists<T>(name: string, thing: void | null | T): T;
export declare function unique(arr: ReadonlyArray<string>): ReadonlyArray<string>;
export declare const constHas: <X extends string | number | boolean, T extends Record<string, X>>(constant: T, value: X) => boolean;
export declare function dedupeErrors<T>(handler: (arg0: unknown) => T): (arg0: unknown) => T | void;
export declare class ExtendableError extends Error {
    constructor(message: string);
}
export {};
