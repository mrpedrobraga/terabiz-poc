import { Atto, MutableState, MutableStateVec, render, state, stateVec, } from "./femto.js";
import { Button, ColumnExpand, TextEdit, TextArea, Column, Row, } from "./components.js";
function App() {
    let post = state({
        title: state("Yes, do try editing this text!"),
        content: stateVec([
            {
                type: "TEXT",
                text: state("Are you a fan of standing up in two feet like most bipedal animals? If so, you might be interested on my new non-fungible token!"),
            },
            {
                type: "MEDIA",
                alt: "Duas mulheres em pé",
                url: "https://i.pinimg.com/564x/32/2b/01/322b01c8f5004c346f65fd2d1d3a6dc7.jpg",
            },
            {
                type: "TEXT",
                text: state("NFTs are like normal tokens, except they are non-fungible. Now buy a copy of my collection:"),
            },
            {
                type: "COLLECTION",
                id: "ABC",
                title: "Coleção 4",
                owner: "@mrpedrobraga",
                imageUrl: "https://cdn.britannica.com/95/55495-050-EEE4F555/differences-human-being-gorilla-structure-femurs-legs.jpg",
                description: "Acesso ao evento: O poder do bipedalismo, que ocorrerá em 17/02/1960.",
            },
        ]),
    });
    return Atto.createElement(PostEdit, { post: post });
}
function asJSON(what) {
    function replacer(_key, value) {
        if (value instanceof MutableState || value instanceof MutableStateVec) {
            return value.get();
        }
        return value;
    }
    return JSON.stringify(what, replacer, 4);
}
function PostEdit($) {
    function sendPost() {
        alert(asJSON($.post));
    }
    return (Atto.createElement(ColumnExpand, null,
        $.post.map((post) => (Atto.createElement(ColumnExpand, null,
            Atto.createElement(TextEdit, { edit: post.title }),
            Atto.createElement("div", null, post.content.mapEach((fragment) => (Atto.createElement(PostFragmentEdit, { edit: fragment }))))))),
        Atto.createElement(Button, { label: "Post!", action: sendPost })));
}
function PostFragmentEdit($) {
    switch ($.edit.type) {
        case "TEXT":
            return Atto.createElement(PostTextFragmentEdit, { edit: $.edit });
        case "MEDIA":
            return Atto.createElement(PostMediaFragmentEdit, { edit: $.edit });
        case "COLLECTION":
            return Atto.createElement(PostCollectionView, { edit: $.edit });
        default:
            return Atto.createElement("span", null, "Not yet implemented.");
    }
}
function PostTextFragmentEdit($) {
    return Atto.createElement(TextArea, { edit: $.edit.text });
}
function PostMediaFragmentEdit($) {
    return Atto.createElement("img", { src: $.edit.url, alt: $.edit.alt });
}
function PostCollectionView($) {
    return (Atto.createElement(Row, null,
        { class: "flex row block" },
        Atto.createElement("img", { src: $.edit.imageUrl, alt: "Imagem da cole\u00E7\u00E3o." }),
        Atto.createElement(Column, null,
            Atto.createElement(Row, null,
                Atto.createElement("h1", null, $.edit.title),
                " ",
                Atto.createElement("em", { style: "opacity:30%;" },
                    "by ",
                    $.edit.owner)),
            Atto.createElement("span", null, $.edit.description))));
}
render(App, document.body);
