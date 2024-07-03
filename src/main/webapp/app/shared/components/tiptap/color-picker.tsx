import { Button } from 'primereact/button';
import { OverlayPanel } from 'primereact/overlaypanel';
import { useRef } from 'react';
import { type Editor } from '@tiptap/react';
import { useState } from 'react';
import React from 'react';

type Solids = ['#000000', '#E2E2E2', '#ff75c3', '#ffa647', '#ffe83f', '#9fff5b', '#70e2ff', '#cd93ff', '#09203f'];
const solids: Solids = [
    '#000000', '#E2E2E2', '#ff75c3', '#ffa647', '#ffe83f', '#9fff5b', '#70e2ff', '#cd93ff', '#09203f',
];

type Props = {
    editor: Editor | null
};

export function ColorPicker({ editor }: Props) {
    const [background, setBackground] = useState<Solids[number]>(solids[0]);
    const op = useRef(null);

    if (!editor) return null;

    return (
        <div>
            <Button
                label=""
                onClick={(e) => op.current.toggle(e)}
                className="p-button-rounded p-button-outlined"
                style={{
                    background: background || solids[0],
                    height: '30px',
                    width: '30px',
                    padding: '0px',
                }}
                type='button'
            />
            <OverlayPanel ref={op} showCloseIcon id="overlay_panel" style={{ width: 'auto' }}>
                <div className='p-grid p-nogutter'>
                    {solids.map((s) => (
                        <div
                            key={s}
                            style={{ background: s, width: '1.5rem', height: '1.5rem' }}
                            className="p-col-fixed"
                            onClick={() => {
                                setBackground(s);
                                editor.chain().focus().setColor(s).run();
                                op.current.hide();
                            }}
                        />
                    ))}
                </div>
            </OverlayPanel>
        </div>
    );
}