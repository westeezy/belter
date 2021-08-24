import { isElectron } from '../../../src/device';

describe('isElectron', () => {
    beforeEach(() => {
        // @ts-ignore
        global.process = {};
        // @ts-ignore
        global.process.versions = {};
    });
    it('should return false when process is undefined', () => {
        // @ts-ignore
        global.process = undefined;
        const bool = isElectron();

        if (bool) {
            throw new Error(`Expected false, got ${ JSON.stringify(bool) }`);
        }
    });
    it('should return false when process.versions is a falsy value', () => {
        // @ts-ignore
        global.process.versions = false;
        const bool = isElectron();

        if (bool) {
            throw new Error(`Expected false, got ${ JSON.stringify(bool) }`);
        }
    });
    it('should return false when process.versions.electron is a falsy value', () => {
        // @ts-ignore
        global.process.versions.electron = false;
        const bool = isElectron();

        if (bool) {
            throw new Error(`Expected false, got ${ JSON.stringify(bool) }`);
        }
    });
    it('should return true when process.versions.electron is a truthy value', () => {
        // @ts-ignore
        global.process.versions.electron = true;
        const bool = isElectron();

        if (!bool) {
            throw new Error(`Expected true, got ${ JSON.stringify(bool) }`);
        }
    });
});
