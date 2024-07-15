import { Atto, render, state, stateVec, } from "./femto.js";
function App() {
    const todo_list = stateVec([]);
    return Atto.createElement(TodosView, { state: todo_list });
}
function TodosView($) {
    const todoAddTextInput = Atto.createElement("input", { type: "text" });
    function pushNewTodo() {
        const text = todoAddTextInput.htmlElement.value;
        if (!text)
            return;
        $.state.push({ text, doneState: state(false) });
        todoAddTextInput.htmlElement.value = "";
        todoAddTextInput.htmlElement.focus();
    }
    return (Atto.createElement("div", null,
        Atto.createElement("div", null,
            todoAddTextInput,
            Atto.createElement("button", { "on:click": pushNewTodo }, "Add")),
        Atto.createElement("div", null, $.state.mapEach(({ text, doneState }) => (Atto.createElement("div", null,
            Atto.createElement(Checkbox, { state: doneState }),
            Atto.createElement("span", null,
                text,
                doneState.map((isDone) => isDone
                    ? { style: "text-decoration: line-through;" }
                    : { style: "text-decoration: none;" }))))))));
}
function Checkbox($) {
    return (Atto.createElement("input", { type: "checkbox", "on:change": (e) => $.state.set(e.target?.checked) }, $.state.map((isDone) => isDone ? { checked: true } : { checked: undefined })));
}
render(App, document.body);
