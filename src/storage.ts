import { uniqueID, getGlobal, inlineMemoize } from './util';
import { isLocalStorageEnabled } from './dom';

type Getter<T> = (handler: (arg0: Record<string, T>) => T) => T;

export type Storage = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getState: Getter<any>;
    getID: () => string;
    isStateFresh: () => boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getSessionState: Getter<any>;
    getSessionID: () => string;
};
const DEFAULT_SESSION_STORAGE = 20 * 60 * 1000;
export function getStorage({ name, lifetime = DEFAULT_SESSION_STORAGE }: { name: string; lifetime?: number }): Storage {
    return inlineMemoize(
        getStorage,
        () => {
            const STORAGE_KEY = `__${ name }_storage__`;
            const newStateID = uniqueID();
            let accessedStorage: WindowLocalStorage | null; // eslint-disable-line no-undef

            function getState<T>(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                handler: (storage: Record<string, any>) => T
            ): T {
                const localStorageEnabled = isLocalStorageEnabled();
                let storage;

                if (accessedStorage) {
                    storage = accessedStorage;
                }

                if (!storage && localStorageEnabled) {
                    const rawStorage = window.localStorage.getItem(STORAGE_KEY);

                    if (rawStorage) {
                        storage = JSON.parse(rawStorage);
                    }
                }

                if (!storage) {
                    storage = getGlobal()[STORAGE_KEY];
                }

                if (!storage) {
                    storage = {
                        id: newStateID
                    };
                }

                if (!storage.id) {
                    storage.id = newStateID;
                }

                accessedStorage = storage;
                const result = handler(storage);

                if (localStorageEnabled) {
                    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
                } else {
                    getGlobal()[STORAGE_KEY] = storage;
                }

                accessedStorage = null;
                return result;
            }

            function getID(): string {
                return getState((storage) => storage.id);
            }

            function isStateFresh(): boolean {
                return getID() === newStateID;
            }

            function getSession<T>(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                handler: (state: Record<string, any>) => T
            ): T {
                return getState((storage) => {
                    let session = storage.__session__;
                    const now = Date.now();

                    if (session && now - session.created > lifetime) {
                        session = null;
                    }

                    if (!session) {
                        session = {
                            guid:   uniqueID(),
                            created:now
                        };
                    }

                    storage.__session__ = session;
                    return handler(session);
                });
            }

            function getSessionState<T>(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                handler: (state: Record<string, any>) => T
            ): T {
                return getSession((session) => {
                    session.state = session.state || {};
                    return handler(session.state);
                });
            }

            function getSessionID(): string {
                return getSession((session) => session.guid);
            }

            return {
                getState,
                getID,
                isStateFresh,
                getSessionState,
                getSessionID
            };
        },
        [
            {
                name,
                lifetime
            }
        ]
    );
}
