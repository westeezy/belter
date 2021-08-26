import { memoize, promisify } from './util';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function memoized(target : Record<string, any>, name : string, descriptor : Record<string, any>) : void {
    descriptor.value = memoize(descriptor.value, {
        name,
        thisNamespace: true
    });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function promise(target : Record<string, any>, name : string, descriptor : Record<string, any>) : void {
    descriptor.value = promisify(descriptor.value, {
        name
    });
}

