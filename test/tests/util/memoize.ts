import { memoize, inlineMemoize } from '../../../src';

describe('memoize cases', () => {
    it('should create a memoized function', () => {
        let counter = 0;
        const add = memoize(() => {
            counter += 1;
        });
        add();
        add();
        add();
        add();
        add();

        if (counter !== 1) {
            throw new Error(`Expected counter to be 1, got ${ counter }`);
        }
    });
    it('should create a memoized function with a parameter', () => {
        let counter = 0;
        const add = memoize((number: number) => {
            counter += number;
        });
        add(1);
        add(2);
        add(2);
        add(3);
        add(3);
        add(3);

        if (counter !== 6) {
            throw new Error(`Expected counter to be 6, got ${ counter }`);
        }
    });
    it('should create a memoized function, and reset', () => {
        let counter = 0;
        const add = memoize(() => {
            counter += 1;
        });
        add();
        add();
        add.reset();
        add();
        add();
        add.reset();
        add();
        add();
        add();

        if (counter !== 3) {
            throw new Error(`Expected counter to be 3, got ${ counter }`);
        }
    });
    it('should create a memoized function with a parameter, and reset', () => {
        let counter = 0;
        const add = memoize((number: number) => {
            counter += number;
        });
        add(1);
        add(2);
        add.reset();
        add(2);
        add(2);
        add(3);
        add.reset();
        add(3);
        add(3);

        if (counter !== 11) {
            throw new Error(`Expected counter to be 11, got ${ counter }`);
        }
    });
    it('should create a memoized function, and clear', () => {
        let counter = 0;
        const add = memoize(() => {
            counter += 1;
        });
        add();
        add();
        memoize.clear();
        add();
        add();
        memoize.clear();
        add();
        add();
        add();

        if (counter !== 3) {
            throw new Error(`Expected counter to be 3, got ${ counter }`);
        }
    });
    it('should create a memoized function with a parameter, and clear', () => {
        let counter = 0;
        const add = memoize((number: number) => {
            counter += number;
        });
        add(1);
        add(2);
        memoize.clear();
        add(2);
        add(2);
        add(3);
        memoize.clear();
        add(3);
        add(3);

        if (counter !== 11) {
            throw new Error(`Expected counter to be 11, got ${ counter }`);
        }
    });
    it('should create multiple memoized functions, and reset one', () => {
        let counter = 0;
        const add = memoize(() => {
            counter += 1;
        });
        const addAgain = memoize(() => {
            counter += 1;
        });
        add();
        addAgain();
        add();
        addAgain();
        add.reset();
        add();
        addAgain();
        add();
        addAgain();
        add.reset();
        add();
        addAgain();
        add();
        addAgain();
        add();
        addAgain();

        if (counter !== 4) {
            throw new Error(`Expected counter to be 4, got ${ counter }`);
        }
    });
    it('should create a self-memoized function', () => {
        let counter = 0;

        const add = (): void => {
            return inlineMemoize(add, () => {
                counter += 1;
            });
        };

        add();
        add();
        add();
        add();
        add();

        if (counter !== 1) {
            throw new Error(`Expected counter to be 1, got ${ counter }`);
        }
    });
    it('should create a self-memoized function with a parameter', () => {
        let counter = 0;

        const add = (number: number): void => {
            return inlineMemoize(
                add,
                () => {
                    counter += number;
                },
                [ number ]
            );
        };

        add(1);
        add(2);
        add(2);
        add(3);
        add(3);
        add(3);

        if (counter !== 6) {
            throw new Error(`Expected counter to be 6, got ${ counter }`);
        }
    });
    it('should create a self-memoized function and call recursively', () => {
        let counter = 0;

        const add = (): void => {
            return inlineMemoize(add, () => {
                counter += 1;

                if (counter === 1) {
                    add();
                }
            });
        };

        add();

        if (counter !== 2) {
            throw new Error(`Expected counter to be 2, got ${ counter }`);
        }
    });
    it('should create a memoized function with cache based on this', () => {
        let counter = 0;
        const add = memoize(
            () => {
                counter += 1;
            },
            {
                thisNamespace: true
            }
        );
        const obj1 = {
            name: 'obj1'
        };
        const obj2 = {
            name: 'obj2'
        };
        add.call(obj1);
        add.call(obj1);
        add.call(obj1);
        add.call(obj1);
        add.call(obj2);
        add.call(obj2);
        add.call(obj2);
        add.call(obj2);

        if (counter !== 2) {
            throw new Error(`Expected counter to be 2, got ${ counter }`);
        }
    });
    it('should create a memoized function with cache based on this and a parameter', () => {
        let counter = 0;
        const add = memoize(
            (number: number) => {
                counter += number;
            },
            {
                thisNamespace: true
            }
        );
        const obj1 = {
            name: 'obj1'
        };
        const obj2 = {
            name: 'obj2'
        };
        add.call(obj1, 1);
        add.call(obj1, 2);
        add.call(obj1, 2);
        add.call(obj1, 3);
        add.call(obj1, 3);
        add.call(obj1, 3);
        add.call(obj2, 1);
        add.call(obj2, 2);
        add.call(obj2, 2);
        add.call(obj2, 3);
        add.call(obj2, 3);
        add.call(obj2, 3);

        if (counter !== 12) {
            throw new Error(`Expected counter to be 12, got ${ counter }`);
        }
    });
    it('should create a memoized function with cache based on this, and reset the cache', () => {
        let counter = 0;
        const add = memoize(
            () => {
                counter += 1;
            },
            {
                thisNamespace: true
            }
        );
        const obj1 = {
            name: 'obj1'
        };
        const obj2 = {
            name: 'obj2'
        };
        add.call(obj1);
        add.call(obj1);
        add.reset();
        add.call(obj1);
        add.call(obj1);
        add.call(obj2);
        add.call(obj2);
        add.reset();
        add.call(obj2);
        add.call(obj2);

        if (counter !== 4) {
            throw new Error(`Expected counter to be 4, got ${ counter }`);
        }
    });
    it('should create a memoized function with cache based on this and a parameter, and reset the cache', () => {
        let counter = 0;
        const add = memoize(
            (number: number) => {
                counter += number;
            },
            {
                thisNamespace: true
            }
        );
        const obj1 = {
            name: 'obj1'
        };
        const obj2 = {
            name: 'obj2'
        };
        add.call(obj1, 1);
        add.call(obj1, 2);
        add.reset();
        add.call(obj1, 2);
        add.call(obj1, 3);
        add.reset();
        add.call(obj1, 3);
        add.call(obj1, 3);
        add.reset();
        add.call(obj2, 1);
        add.call(obj2, 2);
        add.reset();
        add.call(obj2, 2);
        add.call(obj2, 3);
        add.reset();
        add.call(obj2, 3);
        add.call(obj2, 3);

        if (counter !== 22) {
            throw new Error(`Expected counter to be 22, got ${ counter }`);
        }
    });
    it('should create a memoized function with cache based on this, and clear the cache', () => {
        let counter = 0;
        const add = memoize(
            () => {
                counter += 1;
            },
            {
                thisNamespace: true
            }
        );
        const obj1 = {
            name: 'obj1'
        };
        const obj2 = {
            name: 'obj2'
        };
        add.call(obj1);
        add.call(obj1);
        memoize.clear();
        add.call(obj1);
        add.call(obj1);
        add.call(obj2);
        add.call(obj2);
        memoize.clear();
        add.call(obj2);
        add.call(obj2);

        if (counter !== 4) {
            throw new Error(`Expected counter to be 4, got ${ counter }`);
        }
    });
    it('should create a memoized function with cache based on this and a parameter, and clear the cache', () => {
        let counter = 0;
        const add = memoize(
            (number: number) => {
                counter += number;
            },
            {
                thisNamespace: true
            }
        );
        const obj1 = {
            name: 'obj1'
        };
        const obj2 = {
            name: 'obj2'
        };
        add.call(obj1, 1);
        add.call(obj1, 2);
        memoize.clear();
        add.call(obj1, 2);
        add.call(obj1, 3);
        memoize.clear();
        add.call(obj1, 3);
        add.call(obj1, 3);
        memoize.clear();
        add.call(obj2, 1);
        add.call(obj2, 2);
        memoize.clear();
        add.call(obj2, 2);
        add.call(obj2, 3);
        memoize.clear();
        add.call(obj2, 3);
        add.call(obj2, 3);

        if (counter !== 22) {
            throw new Error(`Expected counter to be 22, got ${ counter }`);
        }
    });
});
