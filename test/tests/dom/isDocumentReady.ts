import { isDocumentReady } from '../../../src/dom';

describe('isDocumentReady cases', () => {
    const oldState = document.readyState;
    it('should return false when document is not ready', () => {
        // @ts-ignore
        document.readyState = 'loading';
        const result = isDocumentReady();
        // @ts-ignore
        document.readyState = oldState;

        if (result) {
            throw new Error(
                `Expected result to be false, got ${ String(result) }`
            );
        }
    });
    it('should return true when document is ready', () => {
        // @ts-ignore
        document.readyState = 'complete';
        const result = isDocumentReady();
        // @ts-ignore
        document.readyState = oldState;

        if (!result) {
            throw new Error(
                `Expected result to be true, got ${ String(result) }`
            );
        }
    });
});
