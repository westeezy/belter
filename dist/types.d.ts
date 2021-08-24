export declare const TYPES = true;
export declare type JSONPrimitive = string | boolean | number;
export declare type JSONObject = {
    [key in string]?: JSONValue;
};
export declare type JSONArray = JSONValue[];
export declare type JSONValue = JSONPrimitive | JSONObject | JSONArray;
export declare type JSONType = JSONObject | JSONPrimitive;
export declare type CancelableType = {
    cancel: () => void;
};
