import { Atto, } from "./femto.js";
export function Checkbox($) {
    return (Atto.createElement("input", { type: "checkbox", "on:change": (e) => $.edit.set(e.target?.checked) }, $.edit.map((isDone) => isDone ? { checked: true } : { checked: undefined })));
}
export function Row(...args) {
    return Atto.createElement("div", { class: "flex row" }, ...args);
}
export function ColumnExpand(...args) {
    return Atto.createElement("div", { class: "flex column expand" }, ...args);
}
export function Column(...args) {
    return Atto.createElement("div", { class: "flex column" }, ...args);
}
export function Button($) {
    return (Atto.createElement("input", { type: "button", "on:click": $.action }, { value: $.label }));
}
export function TextEdit($) {
    return (Atto.createElement("input", { type: "text", "on:change": (e) => $.edit.set(e.target?.value) }, $.edit.map((value) => ({ value: value }))));
}
export function NumberEdit($) {
    return (Atto.createElement("input", { type: "number", "on:change": (e) => $.edit.set(Number(e.target?.value)) }, $.edit.map((value) => ({ value: value }))));
}
export function TextArea($) {
    return (Atto.createElement("div", { contenteditable: "true", "on:input": (e) => $.edit.set(e.target?.innerText) }, $.edit));
}
