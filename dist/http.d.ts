import { ZalgoPromise } from 'zalgo-promise';
import type { SameDomainWindowType } from 'cross-domain-utils';
declare type RequestOptionsType = {
    url: string;
    method?: string;
    headers?: Record<string, string>;
    json?: ReadonlyArray<unknown> | Record<string, any>;
    data?: Record<string, string>;
    body?: string;
    win?: SameDomainWindowType;
    timeout?: number;
};
declare type ResponseType = {
    status: number;
    headers: Record<string, string>;
    body: Record<string, any>;
};
export declare function request({ url, method, headers, json, data, body, win, timeout }: RequestOptionsType): ZalgoPromise<ResponseType>;
export declare function addHeaderBuilder(method: () => Record<string, string>): void;
export {};
