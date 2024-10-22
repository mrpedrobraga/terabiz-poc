export declare class AttoElement {
    htmlElement: HTMLElement;
    constructor(htmlElement: HTMLElement);
}
export declare function render(elementFactory: () => AttoElement, target: Element): void;
/** Something that can either be rendered to your UI, or modify a parameter of your element. */
export type ElementFragment = Renderable | AttributeList;
export type AttributeList = Partial<Record<string, any> & {
    on: Partial<Record<keyof HTMLElementEventMap, (e: Event) => any>>;
} & Record<`on:${keyof HTMLElementEventMap}`, (e: Event) => any>>;
export type Renderable = string | AttoElement | Renderable[] | MutableStateVec<Renderable> | MutableState<Renderable>;
/** Creates a new Atto Element. */
export declare function El(tagName: string, ...fragments: ElementFragment[]): AttoElement;
export declare namespace Atto {
    function createElement(factory: string | ((...args: any[]) => AttoElement), props: Record<string, any>, ...rest: ElementFragment[]): AttoElement;
    function createFragment(...children: ElementFragment[]): AttoElement;
}
export declare namespace Atto { }
declare global {
    namespace JSX {
        interface IntrinsicElements {
            [elementName: string]: AttributeList;
        }
    }
}
export interface State<T> {
    map<U>(predicate: MutableStateMapCallback<T, U>): State<U>;
    sync(): State<Awaited<T> | null>;
    orDefault<U>(defaultExpression: () => T | U): State<T | U>;
    set(newValue: T): void;
    get(): T;
}
export declare function state<T>(initialValue: T): MutableState<T>;
type MutableStateMapCallback<T, U> = (newValue: T, oldValue: T) => U;
type MutableStateFlatMapCallback<T, U> = (newValue: T, output: MutableState<U>) => void;
export declare class MutableState<T> implements State<T> {
    protected currentValue: T;
    protected callbacks: MutableStateMapCallback<T, unknown>[];
    constructor(initialValue: T);
    /** Sets the new value of the mutable state. */
    set(newValue: T): void;
    /** Returns the current value of the mutable state. */
    get(): T;
    modify(predicate: (currentValue: T) => T): void;
    incr(amount: number extends T ? number : never): void;
    map<U>(predicate: MutableStateMapCallback<T, U>): State<U>;
    sync(): State<Awaited<T> | null>;
    flatMap<U>(predicate: MutableStateFlatMapCallback<T, U>): State<U>;
    orDefault<U>(defaultExpression: () => T | U): State<T | U>;
    push_change(newValue: T): void;
}
type InnerStateValues<TStates extends State<any>[]> = {
    [K in keyof TStates]: TStates[K] extends State<infer Inner> ? Inner : never;
};
/** Uses multiple states to derive a single state as the result. */
export declare function zip<TStates extends State<any>[], U>(states: TStates, predicate: (...values: InnerStateValues<TStates>) => U): State<U>;
type MutableStateVecSplice<T> = {
    index: number;
    elementCount: number;
    replacementSlice: T[];
};
type MutableStateVecCallback<T, U> = (splice: MutableStateVecSplice<T>) => U;
export declare class MutableStateVec<T> extends MutableState<T[]> {
    vecCallbacks: MutableStateVecCallback<T, unknown>[];
    constructor(initialValue: T[]);
    setAt(index: number, value: T): void;
    splice(index: number, elementCount: number, replacementSlice?: T[]): void;
    pop(): void;
    push(item: T): void;
    mapEach<U>(predicate: MutableStateMapCallback<T, U>): MutableStateVec<U>;
    onPartialChange(predicate: MutableStateVecCallback<T, void>): void;
    private push_partial_change;
}
export declare function stateVec<T>(initialValue: T[]): MutableStateVec<T>;
export {};
