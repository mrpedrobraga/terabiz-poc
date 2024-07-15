export class AttoElement {
  htmlElement: HTMLElement;

  constructor(htmlElement: HTMLElement) {
    this.htmlElement = htmlElement;
  }
}

function makeThinWrapper(): HTMLDivElement {
  const container = document.createElement("div");
  container.style.display = "contents";
  container.style.fontSize = "inherit";
  return container;
}

export function render(elementFactory: () => AttoElement, target: Element) {
  const container = makeThinWrapper();
  container.appendChild(elementFactory().htmlElement);
  target.appendChild(container);
}

/** Something that can either be rendered to your UI, or modify a parameter of your element. */
export type ElementFragment = Renderable | AttributeList;
export type AttributeList = Partial<
  Record<string, any> & {
    on: Partial<Record<keyof HTMLElementEventMap, (e: Event) => any>>;
  } & Record<`on:${keyof HTMLElementEventMap}`, (e: Event) => any>
>;
export type Renderable =
  | string
  | AttoElement
  | Renderable[]
  | MutableStateVec<Renderable>
  | MutableState<Renderable>;

/** Creates a new Atto Element. */
export function El(
  tagName: string,
  ...fragments: ElementFragment[]
): AttoElement {
  const htmlElement = document.createElement(tagName);
  const element = new AttoElement(htmlElement);

  for (const fragment of fragments) {
    appendFragment(element, fragment);
  }

  return element;
}

//@ts-expect-error
const _global = (window || global) as any;

export namespace Atto {
  export function createElement(
    factory: string | ((...args: any[]) => AttoElement),
    props: Record<string, any>,
    ...rest: ElementFragment[]
  ): AttoElement {
    if (typeof factory === "string") {
      return El(factory, props, ...rest);
    }
    return factory(props, ...rest);
  }

  export function createFragment(...children: ElementFragment[]): AttoElement {
    return El("div", { style: "display:contents;" }, ...children);
  }
}
export declare namespace Atto {}
_global.Atto = Atto;

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elementName: string]: AttributeList;
    }
  }
}

function appendFragment(
  element: AttoElement,
  fragment: ElementFragment,
  attributeTargetOverride: AttoElement | undefined = undefined,
) {
  if (fragment === undefined || fragment === null) {
    return;
  }

  if (typeof fragment === "string") {
    element.htmlElement.appendChild(document.createTextNode(fragment));
    return;
  }

  if (fragment instanceof AttoElement) {
    element.htmlElement.append(fragment.htmlElement);
    return;
  }

  if (Array.isArray(fragment)) {
    fragment.forEach((subFragment) => appendFragment(element, subFragment));
    return;
  }

  if (fragment instanceof MutableStateVec) {
    const htmlElement = element.htmlElement;
    fragment.onPartialChange((splice) => {
      for (let i = 0; i < splice.elementCount; i++) {
        const child = htmlElement.children[splice.index + i];
        child && htmlElement.removeChild(child);
      }
      const referenceChild = htmlElement.children[splice.index] ?? null;
      splice.replacementSlice.map((fragment: Renderable) => {
        const container = new AttoElement(makeThinWrapper());
        container.htmlElement.innerHTML = "";
        appendFragment(container, fragment, element);
        htmlElement.insertBefore(container.htmlElement, referenceChild);
      });
    });
  }

  if (fragment instanceof MutableState) {
    const container = new AttoElement(makeThinWrapper());
    element.htmlElement.appendChild(container.htmlElement);
    fragment.map((new_fragment) => {
      container.htmlElement.innerHTML = "";
      appendFragment(container, new_fragment, element);
    });
    return;
  }

  if (typeof fragment === "object") {
    const attribute_target = attributeTargetOverride ?? element;

    for (const key of Object.keys(fragment)) {
      if (fragment[key] === undefined) continue;

      if (key === "on" && fragment.on) {
        for (const eventName of Object.keys(fragment.on)) {
          attribute_target.htmlElement.addEventListener(
            eventName,
            fragment.on[eventName as keyof AttributeList["on"]],
          );
        }
      } else if (key.startsWith("on:") && fragment[key]) {
        const eventName = key.replace(/^on:/, "");
        attribute_target.htmlElement.addEventListener(eventName, fragment[key]);
      } else {
        attribute_target.htmlElement.setAttribute(key, fragment[key]);
      }
    }
    return;
  }

  element.htmlElement.appendChild(document.createTextNode(String(fragment)));
  return;

  //throw new Error("Unsupported element " + String(fragment) + ".");
}

/* States & Reactivity */

export interface State<T> {
  map<U>(predicate: MutableStateMapCallback<T, U>): State<U>;
  sync(): State<Awaited<T> | null>;
  orDefault<U>(defaultExpression: () => T | U): State<T | U>;
  set(newValue: T): void;
  get(): T;
}

export function state<T>(initialValue: T): MutableState<T> {
  return new MutableState(initialValue);
}

type MutableStateMapCallback<T, U> = (newValue: T, oldValue: T) => U;
type MutableStateFlatMapCallback<T, U> = (
  newValue: T,
  output: MutableState<U>,
) => void;

export class MutableState<T> implements State<T> {
  protected currentValue: T;
  protected callbacks: MutableStateMapCallback<T, unknown>[];

  constructor(initialValue: T) {
    this.currentValue = initialValue;
    this.callbacks = [];
  }

  /** Sets the new value of the mutable state. */
  set(newValue: T): void {
    this.push_change(newValue);
  }

  /** Returns the current value of the mutable state. */
  get(): T {
    return this.currentValue;
  }

  modify(predicate: (currentValue: T) => T) {
    this.set(predicate(this.currentValue));
  }

  incr(amount: number extends T ? number : never) {
    if (typeof this.currentValue === "number")
      this.set((this.currentValue as any) + amount);
  }

  map<U>(predicate: MutableStateMapCallback<T, U>): State<U> {
    const derivedState = new MutableState(
      predicate(this.currentValue, this.currentValue),
    );
    this.callbacks.push((newValue: T, oldValue: T) =>
      derivedState.push_change(predicate(newValue, oldValue)),
    );
    return derivedState;
  }

  sync(): State<Awaited<T> | null> {
    return this.flatMap((currentValue, outState) => {
      if (isThenable<Awaited<T>>(currentValue)) {
        outState.set(null);
        currentValue.then((x) => outState.set(x));
      } else {
        outState.set(currentValue as any);
      }
    });
  }

  flatMap<U>(predicate: MutableStateFlatMapCallback<T, U>): State<U> {
    const derivedState: MutableState<U> = new MutableState(null) as any;
    predicate(this.currentValue, derivedState);
    this.callbacks.push((newValue: T) => predicate(newValue, derivedState));
    return derivedState;
  }

  orDefault<U>(defaultExpression: () => T | U): State<T | U> {
    return this.map((value) => value ?? defaultExpression());
  }

  push_change(newValue: T): void {
    const oldValue = this.currentValue;
    this.currentValue = newValue;
    this.callbacks.forEach((callback) => callback(newValue, oldValue));
  }
}

function isThenable<T>(value: any): value is PromiseLike<T> {
  return (
    value !== null &&
    typeof value === "object" &&
    typeof value.then === "function"
  );
}

type InnerStateValues<TStates extends State<any>[]> = {
  [K in keyof TStates]: TStates[K] extends State<infer Inner> ? Inner : never;
};
/** Uses multiple states to derive a single state as the result. */
export function zip<TStates extends State<any>[], U>(
  states: TStates,
  predicate: (...values: InnerStateValues<TStates>) => U,
): State<U> {
  function computeDerivedValue() {
    let values = states.map((state) =>
      state.get(),
    ) as InnerStateValues<TStates>;
    return predicate(...values);
  }

  const derivedState = new MutableState<U>(computeDerivedValue());

  states.forEach((state) =>
    state.map(() => derivedState.set(computeDerivedValue())),
  );
  return derivedState;
}

type MutableStateVecSplice<T> = {
  index: number;
  elementCount: number;
  replacementSlice: T[];
};
type MutableStateVecCallback<T, U> = (splice: MutableStateVecSplice<T>) => U;

export class MutableStateVec<T> extends MutableState<T[]> {
  vecCallbacks: MutableStateVecCallback<T, unknown>[];

  constructor(initialValue: T[]) {
    super(initialValue);
    this.vecCallbacks = [];
  }

  setAt(index: number, value: T) {
    this.currentValue[index] = value;
    this.push_partial_change({
      index,
      elementCount: 1,
      replacementSlice: [value],
    });
  }

  splice(index: number, elementCount: number, replacementSlice: T[] = []) {
    this.currentValue.splice(index, elementCount, ...replacementSlice);
    for (const callback of this.vecCallbacks) {
      callback({ index, elementCount, replacementSlice });
    }
  }

  pop() {
    return this.splice(0, 1);
  }

  push(item: T) {
    this.splice(this.currentValue.length, 0, [item]);
  }

  mapEach<U>(predicate: MutableStateMapCallback<T, U>): MutableStateVec<U> {
    const derivedState = new MutableStateVec(
      this.currentValue.map((x) => predicate(x, x)),
    );
    this.callbacks.push((newValue: T[], _: T[]) =>
      derivedState.push_change(newValue.map((x) => predicate(x, x))),
    );
    this.vecCallbacks.push((splice) =>
      derivedState.push_partial_change({
        index: splice.index,
        elementCount: splice.elementCount,
        replacementSlice: splice.replacementSlice.map((x) => predicate(x, x)),
      }),
    );
    return derivedState;
  }

  onPartialChange(predicate: MutableStateVecCallback<T, void>) {
    this.vecCallbacks.push(predicate);
  }

  private push_partial_change(splice: MutableStateVecSplice<T>) {
    this.splice(splice.index, splice.elementCount, splice.replacementSlice);
  }
}

export function stateVec<T>(initialValue: T[]): MutableStateVec<T> {
  return new MutableStateVec(initialValue);
}
