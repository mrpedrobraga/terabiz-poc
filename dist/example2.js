import { Atto, render, state as edit, stateVec as editList, zip, } from "./femto.js";
import { Column, ColumnExpand, Row, TextEdit } from "./components.js";
function App() {
    const cutscene = edit({
        name: edit("Untitled"),
        actions: editList([]),
    });
    return (Atto.createElement(Atto.createFragment, null, cutscene.map((cutscene) => (Atto.createElement(CutsceneEditor, { cutscene: cutscene })))));
}
function CutsceneEditor($) {
    return (Atto.createElement(ColumnExpand, null,
        Atto.createElement(Column, null,
            Atto.createElement("h1", null,
                "Scene: ",
                $.cutscene.name),
            Atto.createElement(Row, null,
                "Name: ",
                Atto.createElement(TextEdit, { edit: $.cutscene.name }))),
        Atto.createElement(ColumnExpand, null,
            DARK_BOX_STYLE,
            $.cutscene.actions.mapEach((action) => (Atto.createElement(CutsceneActionEditor, { action: action }))),
            Atto.createElement(Row, null,
                Atto.createElement("button", { "on:click": (_) => $.cutscene.actions.push({
                        kind: "DIALOGUE",
                        who: edit("???"),
                        text: edit("Lorem ipsum"),
                    }) }, "Add Action"))),
        Atto.createElement(Row, null,
            Atto.createElement("button", { "on:click": (_) => console.dir($.cutscene) }, "Export"))));
}
function CutsceneActionEditor($) {
    switch ($.action.kind) {
        case "DIALOGUE":
            return Atto.createElement(DialogueActionEditor, { action: $.action });
        case "MOVE":
            return Atto.createElement(MoveActionEditor, { action: $.action });
    }
}
function DialogueActionEditor($) {
    return (Atto.createElement(Column, null,
        BOX_STYLE,
        Atto.createElement("div", { style: "display: grid; columns: 30px 1fr;" },
            "Name: ",
            Atto.createElement(TextEdit, { edit: $.action.who }),
            "Text: ",
            Atto.createElement(TextEdit, { edit: $.action.text })),
        zip([$.action.who, $.action.text], (who, text) => (Atto.createElement(Row, null,
            "- ",
            who,
            ": \"",
            text,
            "\";")))));
}
function MoveActionEditor($) {
    return (Atto.createElement(Column, null,
        BOX_STYLE,
        Atto.createElement(Row, null,
            "Name: ",
            Atto.createElement(TextEdit, { edit: $.action.who })),
        Atto.createElement(Row, null,
            "Text: ",
            Atto.createElement(TextEdit, { edit: $.action.who })),
        zip([$.action.who, $.action.to[0], $.action.to[1]], (who, x, y) => (Atto.createElement(Row, null,
            "Move ",
            who,
            " to (",
            x,
            ", ",
            y,
            ");")))));
}
const DARK_BOX_STYLE = {
    style: "background-color: #333330; padding: 0.5rem;",
};
const BOX_STYLE = {
    style: "background-color: #fefefd; padding: 0.5rem;",
};
render(App, document.body);
