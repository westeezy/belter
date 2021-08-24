declare type Payload = Record<string, (string | boolean) | null | undefined>;
export declare type Experiment = {
    isEnabled: () => boolean;
    isDisabled: () => boolean;
    getTreatment: () => string;
    log: (arg0: string, payload?: Payload) => Experiment;
    logStart: (payload?: Payload) => Experiment;
    logComplete: (payload?: Payload) => Experiment;
};
declare type ExperimentOptions = {
    name: string;
    sample?: number;
    logTreatment?: (arg0: {
        name: string;
        treatment: string;
        payload: Payload;
        throttle: number;
    }) => void;
    logCheckpoint?: (arg0: {
        name: string;
        treatment: string;
        checkpoint: string;
        payload: Payload;
        throttle: number;
    }) => void;
    sticky?: boolean;
};
export declare function experiment({ name, sample, logTreatment, logCheckpoint, sticky }: ExperimentOptions): Experiment;
export {};
