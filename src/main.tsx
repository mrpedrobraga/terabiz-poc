import {
  AttoElement,
  Atto,
  render,
  state,
  stateVec,
  MutableState,
  MutableStateVec,
} from "./femto.js";

interface Todo {
  text: string;
  doneState: MutableState<boolean>;
}

function App(): AttoElement {
  const todo_list = stateVec<Todo>([]);
  return <TodosView state={todo_list} />;
}

function TodosView($: { state: MutableStateVec<Todo> }): AttoElement {
  const todoAddTextInput = <input type="text" />;

  function pushNewTodo() {
    const text = todoAddTextInput.htmlElement.value;
    if (!text) return;
    $.state.push({ text, doneState: state(false) });
    todoAddTextInput.htmlElement.value = "";
    todoAddTextInput.htmlElement.focus();
  }

  return (
    <div>
      <div>
        {todoAddTextInput}
        <button on:click={pushNewTodo}>Add</button>
      </div>
      <div>
        {$.state.mapEach(({ text, doneState }) => (
          <div>
            <Checkbox state={doneState} />
            <span>
              {text}
              {doneState.map((isDone) =>
                isDone
                  ? { style: "text-decoration: line-through;" }
                  : { style: "text-decoration: none;" },
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Checkbox($: { state: MutableState<boolean> }): AttoElement {
  return (
    <input
      type="checkbox"
      on:change={(e) => $.state.set((e.target as HTMLInputElement)?.checked)}
    >
      {$.state.map((isDone) =>
        isDone ? { checked: true } : { checked: undefined },
      )}
    </input>
  );
}

render(App, document.body);
