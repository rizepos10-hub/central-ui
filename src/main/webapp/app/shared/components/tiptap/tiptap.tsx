import { useEditor, EditorContent, Extension } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Heading from '@tiptap/extension-heading';
import Color from '@tiptap/extension-color';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import React from 'react';
import TiptapToolbar from './tiptap-toolbar';
import BulletList from '@tiptap/extension-bullet-list';

const Tiptap = ({
    content,
    onChange,
}: {
    content: string,
    onChange: (richText: string) => void
}) => {
    const CustomKeyCommands = Extension.create({
        addKeyboardShortcuts() {
            return {
                'Mod-z'() {
                    // this.editor.commands.undo();
                    return true; // return true to indicate that the command was handled
                },
            };
        },
    });

    const editor = useEditor({
        extensions: [
            StarterKit,
            Heading.configure({
                HTMLAttributes: {
                    class: 'custom-heading'
                }
            }),
            Color.configure({
                types: ['textStyle']
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            TextStyle,
            BulletList,
            CustomKeyCommands
        ],
        content,
        editorProps: {
            attributes: {
                class: 'editor-content'
            },
        },
        // eslint-disable-next-line @typescript-eslint/no-shadow
        onUpdate({ editor }) {
            onChange(editor.getHTML());
        },
    });

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: '250px',
            justifyContent: 'stretch',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
            border: '1px solid #d3d4d5',
            padding: '10px'
        }}>
            <style>
                {`
                    .editor-content {
                        border: 1px solid #ccc;
                        min-height: 400px;
                        padding: 8px;
                        width: 100%;
                        background-color: white;
                        font-family: 'Segoe UI', 'Roboto', sans-serif;
                        line-height: 1.6;
                    }
                    .custom-heading {
                        font-size: 1.5rem;
                        font-weight: bold;
                    }
                `}
            </style>
            <TiptapToolbar editor={editor} />
            <EditorContent editor={editor} />
        </div>
    );
}

export default Tiptap;
