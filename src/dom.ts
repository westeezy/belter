/* eslint max-lines: off, unicorn/prefer-event-key: off */
import { ZalgoPromise } from 'zalgo-promise';
import type {
    SameDomainWindowType,
    CrossDomainWindowType
} from 'cross-domain-utils';
import {
    linkFrameWindow,
    isWindowClosed,
    assertSameDomain
} from 'cross-domain-utils';
import { WeakMap } from 'cross-domain-safe-weakmap';

import {
    inlineMemoize,
    memoize,
    noop,
    stringify,
    capitalizeFirstLetter,
    once,
    extend,
    safeInterval,
    uniqueID,
    arrayFrom,
    ExtendableError,
    strHashStr
} from './util';
import { isDevice } from './device';
import { KEY_CODES, ATTRIBUTES, UID_HASH_LENGTH } from './constants';
import type { CancelableType } from './types';

type ElementRefType = string | HTMLElement;
export function getBody(): HTMLBodyElement | HTMLElement {
    // eslint-disable-next-line compat/compat
    const body = document.body;

    if (!body) {
        throw new Error(`Body element not found`);
    }

    return body;
}
export function isDocumentReady(): boolean {
    // eslint-disable-next-line compat/compat
    return Boolean(document.body) && document.readyState === 'complete';
}
export function isDocumentInteractive(): boolean {
    // eslint-disable-next-line compat/compat
    return Boolean(document.body) && document.readyState === 'interactive';
}
export function urlEncode(str: string): string {
    return encodeURIComponent(str);
}
export function waitForWindowReady(): ZalgoPromise<void> {
    return inlineMemoize(waitForWindowReady, (): ZalgoPromise<void> => {
        return new ZalgoPromise((resolve: Function) => {
            if (isDocumentReady()) {
                resolve();
            }

            window.addEventListener('load', () => resolve());
        });
    });
}
type WaitForDocumentReady = () => ZalgoPromise<void>;
export const waitForDocumentReady: WaitForDocumentReady = memoize(() => {
    return new ZalgoPromise((resolve: Function) => {
        if (isDocumentReady() || isDocumentInteractive()) {
            return resolve();
        }

        const interval = setInterval(() => {
            if (isDocumentReady() || isDocumentInteractive()) {
                clearInterval(interval);
                return resolve();
            }
        }, 10);
    });
});
export function waitForDocumentBody(): ZalgoPromise<
    HTMLElement | HTMLBodyElement
    > {
    return ZalgoPromise.try(() => {
        if (document.body) {
            return document.body;
        }

        return waitForDocumentReady().then(() => {
            if (document.body) {
                return document.body;
            }

            throw new Error('Document ready but document.body not present');
        });
    });
}
export function parseQuery(queryString: string): Record<string, any> {
    return inlineMemoize(
        parseQuery,
        (): Record<string, any> => {
            const params = {};

            if (!queryString) {
                return params;
            }

            if (queryString.indexOf('=') === -1) {
                return params;
            }

            for (let pair of queryString.split('&')) {
                // @ts-ignore - should we actually be using a temp variable here. this seems strange
                pair = pair.split('=');

                if (pair[0] && pair[1]) {
                    // @ts-ignore - params is untyped
                    params[decodeURIComponent(pair[0])] = decodeURIComponent(
                        pair[1]
                    );
                }
            }

            return params;
        },
        [ queryString ]
    );
}
export function getQueryParam(name: string): string {
    return parseQuery(window.location.search.slice(1))[name];
}
export function urlWillRedirectPage(url: string): boolean {
    if (url.indexOf('#') === -1) {
        return true;
    }

    if (url.indexOf('#') === 0) {
        return false;
    }

    if (url.split('#')[0] === window.location.href.split('#')[0]) {
        return false;
    }

    return true;
}
export type Query = Record<string, boolean | string>;
export function formatQuery(obj: Query = {}): string {
    return Object.keys(obj)
        .filter((key) => {
            return (
                typeof obj[key] === 'string' || typeof obj[key] === 'boolean'
            );
        })
        .map((key) => {
            const val = obj[key];

            if (typeof val !== 'string' && typeof val !== 'boolean') {
                throw new TypeError(`Invalid type for query`);
            }

            return `${ urlEncode(key) }=${ urlEncode(val.toString()) }`;
        })
        .join('&');
}
export function extendQuery(originalQuery: string, props: Query = {}): string {
    if (!props || !Object.keys(props).length) {
        return originalQuery;
    }

    return formatQuery({ ...parseQuery(originalQuery), ...props });
}
export function extendUrl(
    url: string,
    options: {
        query?: Query;
        hash?: Query;
    }
): string {
    const query = options.query || {};
    const hash = options.hash || {};
    let originalUrl;
    let originalQuery;
    let originalHash;
    [ originalUrl, originalHash ] = url.split('#');
    [ originalUrl, originalQuery ] = originalUrl.split('?');
    const queryString = extendQuery(originalQuery, query);
    const hashString = extendQuery(originalHash, hash);

    if (queryString) {
        originalUrl = `${ originalUrl }?${ queryString }`;
    }

    if (hashString) {
        originalUrl = `${ originalUrl }#${ hashString }`;
    }

    return originalUrl;
}
export function redirect(
    url: string,
    win: CrossDomainWindowType = window
): ZalgoPromise<void> {
    // @ts-upgrade TODO: - Need to get in zalgo promise defs
    return new ZalgoPromise((resolve: Function) => {
        // @ts-ignore
        win.location = url;

        if (!urlWillRedirectPage(url)) {
            resolve();
        }
    });
}
export function hasMetaViewPort(): boolean {
    const meta = document.querySelector('meta[name=viewport]');

    if (isDevice() && window.screen.width < 660 && !meta) {
        return false;
    }

    return true;
}
export function isElementVisible(el: HTMLElement): boolean {
    return Boolean(
        el.offsetWidth || el.offsetHeight || el.getClientRects().length
    );
}
export function getPerformance(): Performance | null | undefined {
    return inlineMemoize(getPerformance, (): Performance | null | undefined => {
        const performance = window.performance;

        if (
            performance &&
            performance.now &&
            performance.timing &&
            performance.timing.connectEnd &&
            performance.timing.navigationStart &&
            Math.abs(performance.now() - Date.now()) > 1000 &&
            performance.now() -
                (performance.timing.connectEnd -
                    performance.timing.navigationStart) >
                0
        ) {
            return performance;
        }
    });
}
export function enablePerformance(): boolean {
    return Boolean(getPerformance());
}
export function getPageRenderTime(): ZalgoPromise<number | null | undefined> {
    return waitForDocumentReady().then(() => {
        const performance = getPerformance();

        if (!performance) {
            return;
        }

        const timing = performance.timing;

        if (timing.connectEnd && timing.domInteractive) {
            return timing.domInteractive - timing.connectEnd;
        }
    });
}
export function htmlEncode(html = ''): string {
    return html
        .toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/\//g, '&#x2F;');
}
export function isBrowser(): boolean {
    return typeof window !== 'undefined' && window.location !== undefined;
}
export function querySelectorAll(
    selector: string,
    doc: HTMLDocument = window.document
): ReadonlyArray<HTMLElement> {
    return Array.prototype.slice.call(doc.querySelectorAll(selector));
}
export function onClick(
    element: HTMLElement,
    handler: (arg0: Event) => void
): void {
    element.addEventListener('touchstart', noop);
    element.addEventListener('click', handler);
    element.addEventListener('keypress', (event: Event) => {
        if (
            // @ts-ignore
            event.keyCode === KEY_CODES.ENTER ||
            // @ts-ignore
            event.keyCode === KEY_CODES.SPACE
        ) {
            return handler(event);
        }
    });
}
export function getScript({
    host = window.location.host,
    path,
    reverse = false
}: {
    host?: string;
    path: string;
    reverse?: boolean;
}): HTMLScriptElement | null | undefined {
    return inlineMemoize(
        getScript,
        (): HTMLScriptElement | null | undefined => {
            const url = `${ host }${ path }`;
            const scripts = Array.prototype.slice.call(
                document.getElementsByTagName('script')
            );

            if (reverse) {
                scripts.reverse();
            }

            for (const script of scripts) {
                if (!script.src) {
                    continue;
                }

                const src = script.src
                    .replace(/^https?:\/\//, '')
                    .split('?')[0];

                if (src === url) {
                    return script;
                }
            }
        },
        [ path ]
    );
}
export function isLocalStorageEnabled(): boolean {
    return inlineMemoize(isLocalStorageEnabled, () => {
        try {
            if (typeof window === 'undefined') {
                return false;
            }

            if (window.localStorage) {
                const value = Math.random().toString();
                window.localStorage.setItem('__test__localStorage__', value);
                const result = window.localStorage.getItem(
                    '__test__localStorage__'
                );
                window.localStorage.removeItem('__test__localStorage__');

                if (value === result) {
                    return true;
                }
            }
        } catch (err) {
            // pass
        }

        return false;
    });
}
export function getBrowserLocales(): Array<{
    country?: string;
    lang: string;
}> {
    const nav = window.navigator;
    const locales = nav.languages ? [ ...nav.languages ] : [];

    if (nav.language) {
        locales.push(nav.language);
    }

    // @ts-ignore - userLanguage isnt on navigator natively
    if (nav.userLanguage) {
        // @ts-ignore - userLanguage isnt on navigator natively
        locales.push(nav.userLanguage);
    }

    // @ts-ignore can't guarantee that lang won't be undefined with this logic
    return locales
        .map((locale) => {
            if (locale && locale.match(/^[a-z]{2}[-_][A-Z]{2}$/)) {
                const [ lang, country ] = locale.split(/[-_]/);
                return {
                    country,
                    lang
                };
            }

            if (locale && locale.match(/^[a-z]{2}$/)) {
                return {
                    lang: locale
                };
            }

            return null;
        })
        .filter(Boolean);
}
export function appendChild(
    container: HTMLElement,
    child: HTMLElement | Text
): void {
    container.appendChild(child);
}
export function isElement(element: unknown): boolean {
    if (element instanceof window.Element) {
        return true;
    }

    if (
        element !== null &&
        typeof element === 'object' &&
        // @ts-ignore
        element.nodeType === 1 &&
        // @ts-ignore
        typeof element.style === 'object' &&
        // @ts-ignore
        typeof element.ownerDocument === 'object'
    ) {
        return true;
    }

    return false;
}
export function getElementSafe(
    id: ElementRefType,
    doc: Document | HTMLElement = document
): HTMLElement | null | undefined {
    if (isElement(id)) {
        // @ts-ignore
        return id;
    }

    if (typeof id === 'string') {
        return doc.querySelector(id) as HTMLElement;
    }
}
export function getElement(
    id: ElementRefType,
    doc: Document | HTMLElement = document
): HTMLElement {
    const element = getElementSafe(id, doc);

    if (element) {
        return element;
    }

    throw new Error(`Can not find element: ${ stringify(id) }`);
}
export function elementReady(id: ElementRefType): ZalgoPromise<HTMLElement> {
    // @ts-upgrade TODO: add zalgo promise types
    return new ZalgoPromise((resolve: Function, reject: Function) => {
        const name = stringify(id);
        let el = getElementSafe(id);

        if (el) {
            return resolve(el);
        }

        if (isDocumentReady()) {
            return reject(
                new Error(
                    `Document is ready and element ${ name } does not exist`
                )
            );
        }

        const interval = setInterval(() => {
            el = getElementSafe(id);

            if (el) {
                resolve(el);
                clearInterval(interval);
                return;
            }

            if (isDocumentReady()) {
                clearInterval(interval);
                return reject(
                    new Error(
                        `Document is ready and element ${ name } does not exist`
                    )
                );
            }
        }, 10);
    });
}
// eslint-disable-next-line unicorn/custom-error-definition
export class PopupOpenError extends ExtendableError {}
type PopupOptions = {
    name?: string;
    width?: number;
    height?: number;
    top?: number;
    left?: number;
    status?: 0 | 1;
    resizable?: 0 | 1;
    toolbar?: 0 | 1;
    menubar?: 0 | 1;
    scrollbars?: 0 | 1;
};
export function popup(
    url: string,
    options?: PopupOptions
): CrossDomainWindowType {
    options = options || {};
    const { width, height } = options;
    let top = 0;
    let left = 0;

    if (width) {
        if (window.outerWidth) {
            left = Math.round((window.outerWidth - width) / 2) + window.screenX;
        } else if (window.screen.width) {
            left = Math.round((window.screen.width - width) / 2);
        }
    }

    if (height) {
        if (window.outerHeight) {
            top =
                Math.round((window.outerHeight - height) / 2) + window.screenY;
        } else if (window.screen.height) {
            top = Math.round((window.screen.height - height) / 2);
        }
    }

    if (width && height) {
        options = {
            top,
            left,
            width,
            height,
            status:    1,
            toolbar:   0,
            menubar:   0,
            resizable: 1,
            scrollbars:1,
            ...options
        };
    }

    const name = options.name || '';
    delete options.name;
    const params = Object.keys(options)
        // eslint-disable-next-line array-callback-return
        .map((key) => {
            // @ts-ignore
            if (options[key] !== null && options[key] !== undefined) {
                // @ts-ignore options object is untyped
                return `${ key }=${ stringify(options[key]) }`;
            }
        })
        .filter(Boolean)
        .join(',');
    let win: Window | null;

    try {
        win = window.open(url, name, params) as Window;
    } catch (err) {
        throw new PopupOpenError(
            `Can not open popup window - ${ err.stack || err.message }`
        );
    }

    if (isWindowClosed(win)) {
        const err = new PopupOpenError(`Can not open popup window - blocked`);
        throw err;
    }

    window.addEventListener('unload', () => win?.close());
    return win;
}
export function writeToWindow(win: SameDomainWindowType, html: string): void {
    try {
        win.document.open();
        win.document.write(html);
        win.document.close();
    } catch (err) {
        try {
            // @ts-ignore
            win.location = `javascript: document.open(); document.write(${ JSON.stringify(
                html
            ) }); document.close();`;
        } catch (err2) {
            // pass
        }
    }
}
export function writeElementToWindow(
    win: SameDomainWindowType,
    el: HTMLElement
): void {
    const tag = el.tagName.toLowerCase();

    if (tag !== 'html') {
        throw new Error(`Expected element to be html, got ${ tag }`);
    }

    const documentElement = win.document.documentElement;

    // @ts-ignore
    for (const child of arrayFrom(documentElement.children)) {
        // @ts-ignore
        documentElement.removeChild(child);
    }

    // @ts-ignore - HTMLCollection not assignable to unknown
    for (const child of arrayFrom(el.children)) {
        // @ts-ignore
        documentElement.appendChild(child);
    }
}
export function setStyle(
    el: HTMLElement,
    styleText: string,
    doc: Document = window.document
): void {
    // @ts-ignore
    if (el.styleSheet) {
        // @ts-ignore
        el.styleSheet.cssText = styleText;
    } else {
        el.appendChild(doc.createTextNode(styleText));
    }
}
export type ElementOptionsType = {
    style?: Record<string, string>;
    id?: string;
    class?: ReadonlyArray<string> | null | undefined;
    attributes?: Record<string, string>;
    styleSheet?: string | null | undefined;
    html?: string | null | undefined;
};

let awaitFrameLoadPromises: WeakMap<
    HTMLIFrameElement,
    ZalgoPromise<HTMLIFrameElement>
>;
export function awaitFrameLoad(
    frame: HTMLIFrameElement
): ZalgoPromise<HTMLIFrameElement> {
    awaitFrameLoadPromises = awaitFrameLoadPromises || new WeakMap();

    if (awaitFrameLoadPromises.has(frame)) {
        const promise = awaitFrameLoadPromises.get(frame);

        if (promise) {
            return promise;
        }
    }

    const promise = new ZalgoPromise<HTMLIFrameElement>(
        (resolve: Function, reject: Function) => {
            frame.addEventListener('load', () => {
                linkFrameWindow(frame);
                resolve(frame);
            });
            frame.addEventListener('error', (err: Event) => {
                if (frame.contentWindow) {
                    resolve(frame);
                } else {
                    reject(err);
                }
            });
        }
    );
    awaitFrameLoadPromises.set(frame, promise);
    return promise;
}

export function awaitFrameWindow(
    frame: HTMLIFrameElement
): ZalgoPromise<CrossDomainWindowType> {
    return awaitFrameLoad(frame).then((loadedFrame: any) => {
        if (!loadedFrame.contentWindow) {
            throw new Error(`Could not find window in iframe`);
        }

        return loadedFrame.contentWindow;
    });
}

const getDefaultCreateElementOptions = (): ElementOptionsType => {
    return {};
};

export function createElement(
    // eslint-disable-next-line default-param-last
    tag = 'div',
    // eslint-disable-next-line default-param-last
    options: ElementOptionsType = getDefaultCreateElementOptions(),
    container: HTMLElement | null | undefined
): HTMLElement {
    tag = tag.toLowerCase();
    const element = document.createElement(tag);

    if (options.style) {
        extend(element.style, options.style);
    }

    if (options.class) {
        element.className = options.class.join(' ');
    }

    if (options.id) {
        element.setAttribute('id', options.id);
    }

    if (options.attributes) {
        for (const key of Object.keys(options.attributes)) {
            element.setAttribute(key, options.attributes[key]);
        }
    }

    if (options.styleSheet) {
        setStyle(element, options.styleSheet);
    }

    if (container) {
        appendChild(container, element);
    }

    if (options.html) {
        if (tag === 'iframe') {
            // @ts-ignore
            if (!container || !element.contentWindow) {
                throw new Error(
                    `Iframe html can not be written unless container provided and iframe in DOM`
                );
            }

            // @ts-ignore
            writeToWindow(element.contentWindow, options.html);
        } else {
            element.innerHTML = options.html;
        }
    }

    return element;
}
type StringMap = Record<string, string>;
export type IframeElementOptionsType = {
    style?: StringMap;
    class?: ReadonlyArray<string> | null | undefined;
    attributes?: StringMap;
    styleSheet?: string | null | undefined;
    html?: string | null | undefined;
    url?: string | null | undefined;
};

const getDefaultIframeOptions = (): IframeElementOptionsType => {
    return {};
};

const getDefaultStringMap = (): StringMap => {
    return {};
};

export function iframe(
    // eslint-disable-next-line default-param-last
    options: IframeElementOptionsType = getDefaultIframeOptions(),
    container: HTMLElement | null | undefined
): HTMLIFrameElement {
    const attributes = options.attributes || getDefaultStringMap();
    const style = options.style || getDefaultStringMap();
    const newAttributes = {
        allowTransparency: 'true',
        ...attributes
    };
    const newStyle = {
        backgroundColor:'transparent',
        border:         'none',
        ...style
    };
    // @ts-ignore - no 3rd argument for container supplied to createElement
    const frame = createElement('iframe', {
        attributes:newAttributes,
        style:     newStyle,
        html:      options.html,
        class:     options.class
    });
    const isIE = window.navigator.userAgent.match(/MSIE|Edge/i);

    if (!frame.hasAttribute('id')) {
        frame.setAttribute('id', uniqueID());
    }

    // @ts-ignore
    awaitFrameLoad(frame);

    if (container) {
        const el = getElement(container);
        el.appendChild(frame);
    }

    if (options.url || isIE) {
        frame.setAttribute('src', options.url || 'about:blank');
    }

    // @ts-ignore
    return frame;
}
export function addEventListener(
    obj: HTMLElement,
    event: string,
    // eslint-disable-next-line no-shadow
    handler: (event: Event) => void
): CancelableType {
    obj.addEventListener(event, handler);
    return {
        cancel() {
            obj.removeEventListener(event, handler);
        }
    };
}
export function bindEvents(
    element: HTMLElement,
    eventNames: ReadonlyArray<string>,
    handler: (event: Event) => void
): CancelableType {
    handler = once(handler);

    for (const eventName of eventNames) {
        element.addEventListener(eventName, handler);
    }

    return {
        cancel: once(() => {
            for (const eventName of eventNames) {
                element.removeEventListener(eventName, handler);
            }
        })
    };
}
const VENDOR_PREFIXES = [ 'webkit', 'moz', 'ms', 'o' ];
export function setVendorCSS(
    element: HTMLElement,
    name: string,
    value: string
): void {
    // @ts-ignore
    element.style[name] = value;
    const capitalizedName = capitalizeFirstLetter(name);

    for (const prefix of VENDOR_PREFIXES) {
        // @ts-ignore
        element.style[`${ prefix }${ capitalizedName }`] = value;
    }
}
const ANIMATION_START_EVENTS = [
    'animationstart',
    'webkitAnimationStart',
    'oAnimationStart',
    'MSAnimationStart'
];
const ANIMATION_END_EVENTS = [
    'animationend',
    'webkitAnimationEnd',
    'oAnimationEnd',
    'MSAnimationEnd'
];
export function animate(
    element: ElementRefType,
    name: string,
    clean: (arg0: (...args: Array<any>) => any) => void,
    timeout = 1000
): ZalgoPromise<void> {
    // @ts-upgrade TODO - zalgo promise types
    return new ZalgoPromise((resolve: Function, reject: Function) => {
        const el = getElement(element);

        if (!el) {
            return resolve();
        }

        let hasStarted = false;
        // eslint-disable-next-line prefer-const
        let startTimeout: NodeJS.Timeout;
        let endTimeout: NodeJS.Timeout;
        // eslint-disable-next-line prefer-const
        let startEvent: CancelableType;
        // eslint-disable-next-line prefer-const
        let endEvent: CancelableType;

        function cleanUp() {
            clearTimeout(startTimeout);
            clearTimeout(endTimeout);
            startEvent.cancel();
            endEvent.cancel();
        }

        startEvent = bindEvents(el, ANIMATION_START_EVENTS, (event) => {
            // @ts-ignore
            if (event.target !== el || event.animationName !== name) {
                return;
            }

            clearTimeout(startTimeout);
            event.stopPropagation();
            startEvent.cancel();
            hasStarted = true;
            endTimeout = setTimeout(() => {
                cleanUp();
                resolve();
            }, timeout);
        });
        endEvent = bindEvents(el, ANIMATION_END_EVENTS, (event) => {
            // @ts-ignore
            if (event.target !== el || event.animationName !== name) {
                return;
            }

            cleanUp();

            if (
                // @ts-ignore
                typeof event.animationName === 'string' &&
                // @ts-ignore
                event.animationName !== name
            ) {
                return reject(
                    // @ts-ignore
                    `Expected animation name to be ${ name }, found ${ event.animationName }`
                );
            }

            return resolve();
        });
        setVendorCSS(el, 'animationName', name);
        startTimeout = setTimeout(() => {
            if (!hasStarted) {
                cleanUp();
                return resolve();
            }
        }, 200);

        if (clean) {
            clean(cleanUp);
        }
    });
}
export function makeElementVisible(element: HTMLElement): void {
    element.style.setProperty('visibility', '');
}
export function makeElementInvisible(element: HTMLElement): void {
    element.style.setProperty('visibility', 'hidden', 'important');
}
export function showElement(element: HTMLElement): void {
    element.style.setProperty('display', '');
}
export function hideElement(element: HTMLElement): void {
    element.style.setProperty('display', 'none', 'important');
}
export function destroyElement(element: HTMLElement): void {
    if (element && element.parentNode) {
        element.parentNode.removeChild(element);
    }
}
export function showAndAnimate(
    element: HTMLElement,
    name: string,
    clean: (arg0: (...args: Array<any>) => any) => void
): ZalgoPromise<void> {
    const animation = animate(element, name, clean);
    showElement(element);
    return animation;
}
export function animateAndHide(
    element: HTMLElement,
    name: string,
    clean: (arg0: (...args: Array<any>) => any) => void
): ZalgoPromise<void> {
    return animate(element, name, clean).then(() => {
        hideElement(element);
    });
}
export function addClass(element: HTMLElement, name: string): void {
    element.classList.add(name);
}
export function removeClass(element: HTMLElement, name: string): void {
    element.classList.remove(name);
}
export function isElementClosed(el: HTMLElement): boolean {
    if (
        !el ||
        !el.parentNode ||
        !el.ownerDocument ||
        !el.ownerDocument.documentElement ||
        !el.ownerDocument.documentElement.contains(el)
    ) {
        return true;
    }

    return false;
}
export function watchElementForClose(
    element: HTMLElement,
    handler: () => unknown
): CancelableType {
    handler = once(handler);
    let cancelled = false;
    const mutationObservers: MutationObserver[] = [];
    // eslint-disable-next-line prefer-const
    let interval: CancelableType;
    // eslint-disable-next-line prefer-const
    let sacrificialFrame: HTMLIFrameElement;
    let sacrificialFrameWin: HTMLIFrameElement;

    const cancel = () => {
        cancelled = true;

        for (const observer of mutationObservers) {
            observer.disconnect();
        }

        if (interval) {
            interval.cancel();
        }

        if (sacrificialFrameWin) {
            // eslint-disable-next-line no-use-before-define
            sacrificialFrameWin.removeEventListener('unload', elementClosed);
        }

        if (sacrificialFrame) {
            destroyElement(sacrificialFrame);
        }
    };

    const elementClosed = () => {
        if (!cancelled) {
            handler();
            cancel();
        }
    };

    if (isElementClosed(element)) {
        elementClosed();
        return {
            cancel
        };
    }

    // Strategy 1: Mutation observer
    if (window.MutationObserver) {
        let mutationElement = element.parentElement;

        while (mutationElement) {
            const mutationObserver = new window.MutationObserver(() => {
                if (isElementClosed(element)) {
                    elementClosed();
                }
            });
            mutationObserver.observe(mutationElement, {
                childList: true
            });
            mutationObservers.push(mutationObserver);
            mutationElement = mutationElement.parentElement;
        }
    }

    // Strategy 2: Sacrificial iframe
    sacrificialFrame = document.createElement('iframe');
    sacrificialFrame.setAttribute('name', `__detect_close_${ uniqueID() }__`);
    sacrificialFrame.style.display = 'none';
    // @ts-ignore
    awaitFrameWindow(sacrificialFrame).then((frameWin: HTMLIFrameElement) => {
        // @ts-ignore
        sacrificialFrameWin = assertSameDomain(frameWin);
        sacrificialFrameWin.addEventListener('unload', elementClosed);
    });
    element.appendChild(sacrificialFrame);

    // Strategy 3: Poller
    const check = () => {
        if (isElementClosed(element)) {
            elementClosed();
        }
    };

    interval = safeInterval(check, 1000);
    return {
        cancel
    };
}
export function fixScripts(
    el: HTMLElement,
    doc: Document = window.document
): void {
    // @ts-ignore - querySelectorAll takes a document not element
    for (const script of querySelectorAll('script', el)) {
        const parentNode = script.parentNode;

        if (!parentNode) {
            continue;
        }

        const newScript = doc.createElement('script');
        // @ts-ignore textContent can be null
        newScript.text = script.textContent;
        parentNode.replaceChild(newScript, script);
    }
}
type OnResizeOptions = {
    width?: boolean;
    height?: boolean;
    interval?: number;
    win?: SameDomainWindowType;
};
export function onResize(
    el: HTMLElement,
    handler: (arg0: { width: number; height: number }) => void,
    {
        width = true,
        height = true,
        interval = 100,
        win = window
    }: OnResizeOptions = {}
): {
    cancel: () => void;
} {
    let currentWidth = el.offsetWidth;
    let currentHeight = el.offsetHeight;
    let canceled = false;
    handler({
        width: currentWidth,
        height:currentHeight
    });

    const check = () => {
        if (canceled || !isElementVisible(el)) {
            return;
        }

        const newWidth = el.offsetWidth;
        const newHeight = el.offsetHeight;

        if (
            (width && newWidth !== currentWidth) ||
            (height && newHeight !== currentHeight)
        ) {
            handler({
                width: newWidth,
                height:newHeight
            });
        }

        currentWidth = newWidth;
        currentHeight = newHeight;
    };

    let observer: MutationObserver;
    let timeout: CancelableType;
    win.addEventListener('resize', check);

    // @ts-ignore
    if (typeof win.ResizeObserver !== 'undefined') {
        // @ts-ignore
        observer = new win.ResizeObserver(check);
        observer.observe(el);
        timeout = safeInterval(check, interval * 10);
        // @ts-ignore
    } else if (typeof win.MutationObserver !== 'undefined') {
        // @ts-ignore
        observer = new win.MutationObserver(check);
        observer.observe(el, {
            attributes:   true,
            childList:    true,
            subtree:      true,
            characterData:false
        });
        timeout = safeInterval(check, interval * 10);
    } else {
        timeout = safeInterval(check, interval);
    }

    return {
        cancel: () => {
            canceled = true;
            observer.disconnect();
            window.removeEventListener('resize', check);
            timeout.cancel();
        }
    };
}
export function getResourceLoadTime(url: string): number | null | undefined {
    const performance = getPerformance();

    if (!performance) {
        return;
    }

    if (typeof performance.getEntries !== 'function') {
        return;
    }

    const entries = performance.getEntries();

    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];

        if (
            entry &&
            entry.name &&
            entry.name.indexOf(url) === 0 &&
            typeof entry.duration === 'number'
        ) {
            return Math.floor(entry.duration);
        }
    }
}
export function isShadowElement(element: Node): boolean {
    while (element.parentNode) {
        element = element.parentNode;
    }

    return element.toString() === '[object ShadowRoot]';
}
export function getShadowRoot(element: Node): Node | null | undefined {
    while (element.parentNode) {
        element = element.parentNode;
    }

    if (isShadowElement(element)) {
        return element;
    }
}
export function getShadowHost(element: Node): HTMLElement | null | undefined {
    const shadowRoot = getShadowRoot(element);

    // @ts-ignore
    if (shadowRoot && shadowRoot.host) {
        // @ts-ignore
        return shadowRoot.host;
    }
}
export function insertShadowSlot(element: HTMLElement): HTMLElement {
    const shadowHost = getShadowHost(element);

    if (!shadowHost) {
        throw new Error(`Element is not in shadow dom`);
    }

    const slotName = `shadow-slot-${ uniqueID() }`;
    const slot = document.createElement('slot');
    slot.setAttribute('name', slotName);
    element.appendChild(slot);
    const slotProvider = document.createElement('div');
    slotProvider.setAttribute('slot', slotName);
    shadowHost.appendChild(slotProvider);

    if (isShadowElement(shadowHost)) {
        return insertShadowSlot(slotProvider);
    }

    return slotProvider;
}
export function preventClickFocus(el: HTMLElement): void {
    const onFocus = (event: Event) => {
        el.removeEventListener('focus', onFocus);
        event.preventDefault();
        el.blur();
        return false;
    };

    el.addEventListener('mousedown', () => {
        el.addEventListener('focus', onFocus);
        setTimeout(() => {
            el.removeEventListener('focus', onFocus);
        }, 1);
    });
}
export function getStackTrace(): string {
    try {
        throw new Error('_');
    } catch (err) {
        return err.stack || '';
    }
}

function inferCurrentScript(): HTMLScriptElement | null | undefined {
    try {
        const stack = getStackTrace();
        const stackDetails = (/.*at [^(]*\((.*):(.+):(.+)\)$/gi).exec(stack);
        const scriptLocation = stackDetails && stackDetails[1];

        if (!scriptLocation) {
            return;
        }

        for (const script of Array.prototype.slice
            .call(document.getElementsByTagName('script'))
            .reverse()) {
            if (script.src && script.src === scriptLocation) {
                return script;
            }
        }
    } catch (err) {
        // pass
    }
}

let currentScript =
    // eslint-disable-next-line compat/compat
    typeof document !== 'undefined' ? document.currentScript : null;
type GetCurrentScript = () => HTMLScriptElement;
// @ts-ignore = need memo helper
export const getCurrentScript: GetCurrentScript = memoize(() => {
    if (currentScript) {
        return currentScript;
    }

    // @ts-ignore
    currentScript = inferCurrentScript();

    if (currentScript) {
        return currentScript;
    }

    throw new Error('Can not determine current script');
});
const currentUID = uniqueID();
type GetCurrentScriptUID = () => string;
export const getCurrentScriptUID: GetCurrentScriptUID = memoize(() => {
    let script;

    try {
        script = getCurrentScript();
    } catch (err) {
        return currentUID;
    }

    let uid = script.getAttribute(ATTRIBUTES.UID);

    if (uid && typeof uid === 'string') {
        return uid;
    }

    uid = script.getAttribute(`${ ATTRIBUTES.UID }-auto`);

    if (uid && typeof uid === 'string') {
        return uid;
    }

    if (script.src) {
        const { src, dataset } = script;
        const stringToHash = JSON.stringify({
            src,
            dataset
        });
        const hashedString = strHashStr(stringToHash);
        const hashResult = hashedString.slice(
            hashedString.length - UID_HASH_LENGTH
        );
        uid = `uid_${ hashResult }`;
    } else {
        uid = uniqueID();
    }

    script.setAttribute(`${ ATTRIBUTES.UID }-auto`, uid);
    return uid;
});
type SubmitFormOptions = {
    url: string;
    target: string;
    body?: Record<string, string | boolean>;
    method?: string;
};
export function submitForm({
    url,
    target,
    body,
    method = 'post'
}: SubmitFormOptions): void {
    const form = document.createElement('form');
    form.setAttribute('target', target);
    form.setAttribute('method', method);
    form.setAttribute('action', url);
    form.style.display = 'none';

    if (body) {
        for (const key of Object.keys(body)) {
            const input = document.createElement('input');
            input.setAttribute('name', key);
            input.setAttribute('value', body[key]?.toString());
            form.appendChild(input);
        }
    }

    getBody().appendChild(form);
    form.submit();
    getBody().removeChild(form);
}
