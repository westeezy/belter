import { memoize, promisify } from './util';

export function memoized(
    target: Record<string, any>,
    name: string,
    descriptor: Record<string, any>
): void {
    descriptor.value = memoize(descriptor.value, {
        name,
        thisNamespace: true
    });
}
export function promise(
    target: Record<string, any>,
    name: string,
    descriptor: Record<string, any>
): void {
    descriptor.value = promisify(descriptor.value, {
        name
    });
}
