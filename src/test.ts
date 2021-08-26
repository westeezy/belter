import { ZalgoPromise } from 'zalgo-promise';

import { noop, tryCatch, removeFromArray } from './util';

type Prom<X> = Promise<X> | ZalgoPromise<X>;

type Handler = <T, A extends ReadonlyArray<unknown>>(name : string, fn ?: (...args : A) => T) => (...args : A) => T;
type Wrapper<T> = (arg0 : {
    expect : Handler;
    avoid : Handler;
    expectError : Handler;
    error : Handler;
    wait : () => Prom<void>;
}) => Prom<T> | void;

export function wrapPromise<T>(method : Wrapper<T>, { timeout = 5000 } : { timeout ?: number; } = {}) : ZalgoPromise<void> {
    const expected : Array<{ name : string; handler : Handler; }> = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const promises : Array<{ name : string; promise : ZalgoPromise<any>; }> = [];

    return new ZalgoPromise((resolve, reject) => {
        const timer = setTimeout(() => {
            if (expected.length) {
                reject(new Error(`Expected ${ expected[0].name } to be called in ${ timeout }ms`));
            }

            if (promises.length) {
                reject(new Error(`Expected ${ promises[0].name } promise to complete in ${ timeout }ms`));
            }
        }, timeout);

        // @ts-ignore
        const expect : Handler = (name, handler = noop) => {
            const exp = {
                name,
                handler
            };
            // @ts-ignore
            expected.push(exp);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return function expectWrapper(...args) : any {
                // @ts-ignore
                removeFromArray(expected, exp);
                const {
                    result,
                    error
                    // @ts-ignore no type for this
                } = tryCatch(() => handler.call(this, ...args));

                if (error) {
                    promises.push({
                        name,
                        promise: ZalgoPromise.asyncReject(error)
                    });
                    throw error;
                }

                promises.push({
                    name,
                    promise: ZalgoPromise.resolve(result)
                });
                return result;
            };
        };

        // @ts-ignore
        const avoid : Handler = (name : string, fn = noop) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return function avoidWrapper(...args) : any {
                promises.push({
                    name,
                    promise: ZalgoPromise.asyncReject(new Error(`Expected ${ name } to not be called`))
                });
                // @ts-ignore
                return fn.call(this, ...args);
            };
        };

        // @ts-ignore
        const expectError : Handler = (name, handler = noop) => {
            const exp = {
                name,
                handler
            };
            // @ts-ignore
            expected.push(exp);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return function expectErrorWrapper(...args) : any {
                // @ts-ignore
                removeFromArray(expected, exp);
                const {
                    result,
                    error
                    // @ts-ignore
                } = tryCatch(() => handler.call(this, ...args));

                if (error) {
                    throw error;
                }

                promises.push({
                    name,
                    promise: ZalgoPromise.resolve(result).then(() => {
                        throw new Error(`Expected ${ name } to throw an error`);
                    }, noop)
                });
                return result;
            };
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const wait = () : any => {
            return ZalgoPromise.try(() => {
                if (promises.length) {
                    const prom = promises[0];
                    return prom.promise
                        .finally(() => {
                            removeFromArray(promises, prom);
                        })
                        .then(wait);
                }
            }).then(() => {
                if (expected.length) {
                    return ZalgoPromise.delay(10).then(wait);
                }
            });
        };

        promises.push({
            name:   'wrapPromise handler',
            promise:ZalgoPromise.try(() =>
                method({
                    expect,
                    avoid,
                    expectError,
                    error:avoid,
                    wait: () => ZalgoPromise.resolve()
                }))
        });
        wait()
            .finally(() => {
                clearTimeout(timer);
            })
            .then(resolve, reject);
    });
}
