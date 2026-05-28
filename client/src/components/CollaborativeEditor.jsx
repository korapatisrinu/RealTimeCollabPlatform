import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Collaboration from "@tiptap/extension-collaboration"
import CollaborationCursor from "@tiptap/extension-collaboration-cursor"

import * as Y from "yjs"
import { WebsocketProvider } from "y-websocket"

const ydoc = new Y.Doc()

const provider = new WebsocketProvider(
  "wss://demos.yjs.dev",
  "room1",
  ydoc
)

export default function CollaborativeEditor({ username }) {

  const editor = useEditor({
    extensions: [

      StarterKit.configure({
        history: false,
      }),

      Collaboration.configure({
        document: ydoc,
      }),

      CollaborationCursor.configure({
        provider,
        user: {
          name: username || "Anonymous",
          color: "#8b5cf6",
        },
      }),

    ],
  })

  if (!editor) return null

  return (
    <div className="bg-slate-800 p-6 rounded-2xl mt-6">

      <h2 className="text-2xl font-bold mb-4 text-white">
        Collaborative Editor
      </h2>

      <div className="flex gap-2 mb-4 flex-wrap">

        <button
          onClick={() =>
            editor.chain().focus().toggleBold().run()
          }
          className="bg-slate-700 px-3 py-2 rounded-lg"
        >
          Bold
        </button>

        <button
          onClick={() =>
            editor.chain().focus().toggleItalic().run()
          }
          className="bg-slate-700 px-3 py-2 rounded-lg"
        >
          Italic
        </button>

        <button
          onClick={() =>
            editor.chain().focus().toggleBulletList().run()
          }
          className="bg-slate-700 px-3 py-2 rounded-lg"
        >
          Bullet
        </button>

      </div>

      <div className="bg-slate-950 rounded-2xl min-h-[300px]">
        <EditorContent
          editor={editor}
          className="ProseMirror"
        />
      </div>

    </div>
  )
}