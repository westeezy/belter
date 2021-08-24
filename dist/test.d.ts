import { ZalgoPromise } from 'zalgo-promise';
declare type Prom<X> = Promise<X> | ZalgoPromise<X>;
declare type Handler = <T, A extends ReadonlyArray<unknown>>(name: string, fn?: (...args: A) => T) => (...args: A) => T;
declare type Wrapper<T> = (arg0: {
    expect: Handler;
    avoid: Handler;
    expectError: Handler;
    error: Handler;
    wait: () => Prom<void>;
}) => Prom<T> | void;
export declare function wrapPromise<T>(method: Wrapper<T>, { timeout }?: {
    timeout?: number;
}): ZalgoPromise<void>;
export {};
