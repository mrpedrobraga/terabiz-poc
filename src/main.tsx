import {
  Atto,
  AttoElement,
  MutableState as Editable,
  MutableStateVec as EditableList,
  MutableState,
  MutableStateVec,
  render,
  state,
  stateVec,
} from "./femto.js";
import {
  Button,
  ColumnExpand,
  TextEdit,
  TextArea,
  Column,
  Row,
} from "./components.js";

interface Post {
  title: Editable<string>;
  content: EditableList<PostFragment>;
}

type PostFragment =
  | PostTextFragment
  | PostMediaFragment
  | PostCollectionFragment;

interface PostTextFragment {
  type: "TEXT";
  text: Editable<string>;
}

interface PostMediaFragment {
  type: "MEDIA";
  alt: string;
  url: string;
}

interface PostCollectionFragment {
  type: "COLLECTION";
  id: string;
  title: string;
  owner: string;
  imageUrl: string;
  description: string;
}

function App(): AttoElement {
  let post = state<Post>({
    title: state("Yes, do try editing this text!"),
    content: stateVec<PostFragment>([
      {
        type: "TEXT",
        text: state(
          "Are you a fan of standing up in two feet like most bipedal animals? If so, you might be interested on my new non-fungible token!",
        ),
      },
      {
        type: "MEDIA",
        alt: "Duas mulheres em pé",
        url: "https://i.pinimg.com/564x/32/2b/01/322b01c8f5004c346f65fd2d1d3a6dc7.jpg",
      },
      {
        type: "TEXT",
        text: state(
          "NFTs are like normal tokens, except they are non-fungible. Now buy a copy of my collection:",
        ),
      },
      {
        type: "COLLECTION",
        id: "ABC",
        title: "Coleção 4",
        owner: "@mrpedrobraga",
        imageUrl:
          "https://cdn.britannica.com/95/55495-050-EEE4F555/differences-human-being-gorilla-structure-femurs-legs.jpg",
        description:
          "Acesso ao evento: O poder do bipedalismo, que ocorrerá em 17/02/1960.",
      },
    ]),
  });

  return <PostEdit post={post} />;
}

function asJSON<T>(what: T): string {
  function replacer(_key: string, value: any): any {
    if (value instanceof MutableState || value instanceof MutableStateVec) {
      return value.get();
    }
    return value;
  }

  return JSON.stringify(what, replacer, 4);
}

function PostEdit($: { post: Editable<Post> }): AttoElement {
  function sendPost() {
    alert(asJSON($.post));
  }

  return (
    <ColumnExpand>
      {$.post.map((post) => (
        <ColumnExpand>
          <TextEdit edit={post.title} />
          <div>
            {post.content.mapEach((fragment) => (
              <PostFragmentEdit edit={fragment} />
            ))}
          </div>
        </ColumnExpand>
      ))}
      <Button label="Post!" action={sendPost} />
    </ColumnExpand>
  );
}

function PostFragmentEdit($: { edit: PostFragment }): AttoElement {
  switch ($.edit.type) {
    case "TEXT":
      return <PostTextFragmentEdit edit={$.edit} />;
    case "MEDIA":
      return <PostMediaFragmentEdit edit={$.edit} />;
    case "COLLECTION":
      return <PostCollectionView edit={$.edit} />;
    default:
      return <span>Not yet implemented.</span>;
  }
}

function PostTextFragmentEdit($: { edit: PostTextFragment }): AttoElement {
  return <TextArea edit={$.edit.text} />;
}

function PostMediaFragmentEdit($: { edit: PostMediaFragment }): AttoElement {
  return <img src={$.edit.url} alt={$.edit.alt}></img>;
}

function PostCollectionView($: { edit: PostCollectionFragment }): AttoElement {
  return (
    <Row>
      {{ class: "flex row block" }}
      <img src={$.edit.imageUrl} alt="Imagem da coleção." />
      <Column>
        <Row>
          <h1>{$.edit.title}</h1>{" "}
          <em style="opacity:30%;">by {$.edit.owner}</em>
        </Row>
        <span>{$.edit.description}</span>
      </Column>
    </Row>
  );
}

render(App, document.body);
