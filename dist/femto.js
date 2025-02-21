export class AttoElement {
    htmlElement;
    constructor(htmlElement) {
        this.htmlElement = htmlElement;
    }
}
function makeThinWrapper() {
    const container = document.createElement("div");
    container.style.display = "contents";
    container.style.fontSize = "inherit";
    return container;
}
export function render(elementFactory, target) {
    const container = makeThinWrapper();
    container.appendChild(elementFactory().htmlElement);
    target.appendChild(container);
}
/** Creates a new Atto Element. */
export function El(tagName, ...fragments) {
    const htmlElement = document.createElement(tagName);
    const element = new AttoElement(htmlElement);
    for (const fragment of fragments) {
        appendFragment(element, fragment);
    }
    return element;
}
//@ts-expect-error
const _global = (window || global);
export var Atto;
(function (Atto) {
    function createElement(factory, props, ...rest) {
        if (typeof factory === "string") {
            return El(factory, props, ...rest);
        }
        return factory(props, ...rest);
    }
    Atto.createElement = createElement;
    function createFragment(...children) {
        return El("div", { style: "display:contents;" }, ...children);
    }
    Atto.createFragment = createFragment;
})(Atto || (Atto = {}));
_global.Atto = Atto;
function appendFragment(element, fragment, attributeTargetOverride = undefined) {
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
            splice.replacementSlice.map((fragment) => {
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
            if (fragment[key] === undefined)
                continue;
            if (key === "on" && fragment.on) {
                for (const eventName of Object.keys(fragment.on)) {
                    attribute_target.htmlElement.addEventListener(eventName, fragment.on[eventName]);
                }
            }
            else if (key.startsWith("on:") && fragment[key]) {
                const eventName = key.replace(/^on:/, "");
                attribute_target.htmlElement.addEventListener(eventName, fragment[key]);
            }
            else {
                attribute_target.htmlElement.setAttribute(key, fragment[key]);
            }
        }
        return;
    }
    element.htmlElement.appendChild(document.createTextNode(String(fragment)));
    return;
    //throw new Error("Unsupported element " + String(fragment) + ".");
}
export function state(initialValue) {
    return new MutableState(initialValue);
}
export class MutableState {
    currentValue;
    callbacks;
    constructor(initialValue) {
        this.currentValue = initialValue;
        this.callbacks = [];
    }
    /** Sets the new value of the mutable state. */
    set(newValue) {
        this.push_change(newValue);
    }
    /** Returns the current value of the mutable state. */
    get() {
        return this.currentValue;
    }
    modify(predicate) {
        this.set(predicate(this.currentValue));
    }
    incr(amount) {
        if (typeof this.currentValue === "number")
            this.set(this.currentValue + amount);
    }
    map(predicate) {
        const derivedState = new MutableState(predicate(this.currentValue, this.currentValue));
        this.callbacks.push((newValue, oldValue) => derivedState.push_change(predicate(newValue, oldValue)));
        return derivedState;
    }
    sync() {
        return this.flatMap((currentValue, outState) => {
            if (isThenable(currentValue)) {
                outState.set(null);
                currentValue.then((x) => outState.set(x));
            }
            else {
                outState.set(currentValue);
            }
        });
    }
    flatMap(predicate) {
        const derivedState = new MutableState(null);
        predicate(this.currentValue, derivedState);
        this.callbacks.push((newValue) => predicate(newValue, derivedState));
        return derivedState;
    }
    orDefault(defaultExpression) {
        return this.map((value) => value ?? defaultExpression());
    }
    push_change(newValue) {
        const oldValue = this.currentValue;
        this.currentValue = newValue;
        this.callbacks.forEach((callback) => callback(newValue, oldValue));
    }
}
function isThenable(value) {
    return (value !== null &&
        typeof value === "object" &&
        typeof value.then === "function");
}
/** Uses multiple states to derive a single state as the result. */
export function zip(states, predicate) {
    function computeDerivedValue() {
        let values = states.map((state) => state.get());
        return predicate(...values);
    }
    const derivedState = new MutableState(computeDerivedValue());
    states.forEach((state) => state.map(() => derivedState.set(computeDerivedValue())));
    return derivedState;
}
export class MutableStateVec extends MutableState {
    vecCallbacks;
    constructor(initialValue) {
        super(initialValue);
        this.vecCallbacks = [];
    }
    setAt(index, value) {
        this.currentValue[index] = value;
        this.push_partial_change({
            index,
            elementCount: 1,
            replacementSlice: [value],
        });
    }
    splice(index, elementCount, replacementSlice = []) {
        this.currentValue.splice(index, elementCount, ...replacementSlice);
        for (const callback of this.vecCallbacks) {
            callback({ index, elementCount, replacementSlice });
        }
    }
    pop() {
        return this.splice(0, 1);
    }
    push(item) {
        this.splice(this.currentValue.length, 0, [item]);
    }
    mapEach(predicate) {
        const derivedState = new MutableStateVec(this.currentValue.map((x) => predicate(x, x)));
        this.callbacks.push((newValue, _) => derivedState.push_change(newValue.map((x) => predicate(x, x))));
        this.vecCallbacks.push((splice) => derivedState.push_partial_change({
            index: splice.index,
            elementCount: splice.elementCount,
            replacementSlice: splice.replacementSlice.map((x) => predicate(x, x)),
        }));
        return derivedState;
    }
    onPartialChange(predicate) {
        this.vecCallbacks.push(predicate);
    }
    push_partial_change(splice) {
        this.splice(splice.index, splice.elementCount, splice.replacementSlice);
    }
}
export function stateVec(initialValue) {
    return new MutableStateVec(initialValue);
}
