// export something to force webpack to see this as an ES module
export const TYPES = true;

declare let __TEST__ : boolean; // eslint-disable-line @typescript-eslint/no-unused-vars

export type JSONPrimitive = string | boolean | number;
export type JSONObject = { [key in string] ?: JSONValue }; // eslint-disable-line no-use-before-define
export type JSONArray = JSONValue[]; // eslint-disable-line no-use-before-define
export type JSONValue = JSONPrimitive | JSONObject | JSONArray;
export type JSONType = JSONObject | JSONPrimitive;
export type CancelableType = {
    cancel : () => void;
};
