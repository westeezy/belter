import { memoize, promisify } from './util';

export function memoized(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    target : Record<string, any>,
    name : string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    descriptor : Record<string, any>
) : void {
    descriptor.value = memoize(descriptor.value, {
        name,
        thisNamespace: true
    });
}
export function promise(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    target : Record<string, any>,
    name : string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    descriptor : Record<string, any>
) : void {
    descriptor.value = promisify(descriptor.value, {
        name
    });
}
