import {
  Atto,
  ElementFragment,
  MutableState as Editable,
  AttoElement,
} from "./femto.js";

export function Checkbox($: { edit: Editable<boolean> }): AttoElement {
  return (
    <input
      type="checkbox"
      on:change={(e) => $.edit.set((e.target as HTMLInputElement)?.checked)}
    >
      {$.edit.map((isDone: boolean) =>
        isDone ? { checked: true } : { checked: undefined },
      )}
    </input>
  );
}

export function Row(...args: ElementFragment[]): AttoElement {
  return <div class="flex row">{...args}</div>;
}

export function ColumnExpand(...args: ElementFragment[]): AttoElement {
  return <div class="flex column expand">{...args}</div>;
}

export function Column(...args: ElementFragment[]): AttoElement {
  return <div class="flex column">{...args}</div>;
}

export function Button($: {
  label: string | Editable<string>;
  action: () => void;
}): AttoElement {
  return (
    <input type="button" on:click={$.action}>
      {{ value: $.label }}
    </input>
  );
}

export function TextEdit($: { edit: Editable<string> }): AttoElement {
  return (
    <input
      type="text"
      on:change={(e) => $.edit.set((e.target as HTMLInputElement)?.value)}
    >
      {$.edit.map((value) => ({ value: value }))}
    </input>
  );
}

export function NumberEdit($: { edit: Editable<number> }): AttoElement {
  return (
    <input
      type="number"
      on:change={(e) =>
        $.edit.set(Number((e.target as HTMLInputElement)?.value))
      }
    >
      {$.edit.map((value) => ({ value: value }))}
    </input>
  );
}

export function TextArea($: { edit: Editable<string> }): AttoElement {
  return (
    <div
      contenteditable="true"
      on:input={(e) => $.edit.set((e.target as HTMLInputElement)?.innerText)}
    >
      {$.edit}
    </div>
  );
}
