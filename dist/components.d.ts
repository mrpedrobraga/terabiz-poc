import { ElementFragment, MutableState as Editable, AttoElement } from "./femto.js";
export declare function Checkbox($: {
    edit: Editable<boolean>;
}): AttoElement;
export declare function Row(...args: ElementFragment[]): AttoElement;
export declare function ColumnExpand(...args: ElementFragment[]): AttoElement;
export declare function Column(...args: ElementFragment[]): AttoElement;
export declare function Button($: {
    label: string | Editable<string>;
    action: () => void;
}): AttoElement;
export declare function TextEdit($: {
    edit: Editable<string>;
}): AttoElement;
export declare function NumberEdit($: {
    edit: Editable<number>;
}): AttoElement;
export declare function TextArea($: {
    edit: Editable<string>;
}): AttoElement;
