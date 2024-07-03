import { type Editor } from "@tiptap/react";
import { ToggleButton } from 'primereact/togglebutton';
import { useState } from 'react';
import { ColorPicker } from "./color-picker";
import React from "react";
import { GrStrikeThrough, GrBold, GrItalic, GrTextAlignLeft, GrTextAlignCenter, GrTextAlignRight } from "react-icons/gr";
import { LuHeading2 } from "react-icons/lu";
import { HiMiniListBullet } from "react-icons/hi2";

type Props = {
    editor: Editor | null
};

const TiptapToolbar = ({ editor }: Props) => {
    if (!editor) return null;

    // Local state to manage toggle states for styling purposes
    const [headingActive, setHeadingActive] = useState(false);
    const [boldActive, setBoldActive] = useState(false);
    const [italicActive, setItalicActive] = useState(false);
    const [strikeActive, setStrikeActive] = useState(false);
    const [alignLeftActive, setAlignLeftActive] = useState(false);
    const [alignCenterActive, setAlignCenterActive] = useState(false);
    const [alignRightActive, setAlignRightActive] = useState(false);
    const [bulletActive, setBulletActive] = useState(false);

    return (
        <div style={{
            display: 'flex',
            gap: '5px',
            justifyContent: 'stretch',
            alignItems: 'center',
            marginBottom: '10px',
            padding: '5px',
            backgroundColor: '#f9f9f9',
            borderBottom: '1px solid #ececec'
        }}>
            <ToggleButton
                style={{
                    height: '30px',
                    width: '30px',
                    padding: '0px',
                    backgroundColor: headingActive ? '#ddd' : '#f9f9f9',
                    border: '1px solid #ccc',
                    borderRadius: '4px'
                }}
                type="button"
                checked={headingActive}
                onChange={(e) => {
                    setHeadingActive(e.value);
                    editor.chain().focus().toggleHeading({ level: 2 }).run();
                }}
                onIcon={<LuHeading2 style={{
                    height: '20px',
                    width: '20px'
                }} />}
                offIcon={<LuHeading2 style={{
                    height: '20px',
                    width: '20px'
                }} />}
                offLabel=""
                onLabel=""
            />
            <ToggleButton
                style={{
                    height: '30px',
                    width: '30px',
                    padding: '0px',
                    backgroundColor: boldActive ? '#ddd' : '#f9f9f9',
                    border: '1px solid #ccc',
                    borderRadius: '4px'
                }}
                type="button"
                checked={boldActive}
                onChange={(e) => {
                    setBoldActive(e.value);
                    editor.chain().focus().toggleBold().run();
                }}
                onIcon={<GrBold style={{
                    height: '20px',
                    width: '20px'
                }} />}
                offIcon={<GrBold style={{
                    height: '20px',
                    width: '20px'
                }} />}
                offLabel=""
                onLabel=""
            />
            <ToggleButton
                style={{
                    height: '30px',
                    width: '30px',
                    padding: '0px',
                    backgroundColor: italicActive ? '#ddd' : '#f9f9f9',
                    border: '1px solid #ccc',
                    borderRadius: '4px'
                }}
                type="button"
                checked={italicActive}
                onChange={(e) => {
                    setItalicActive(e.value);
                    editor.chain().focus().toggleItalic().run();
                }}
                onIcon={<GrItalic style={{
                    height: '20px',
                    width: '20px'
                }} />}
                offIcon={<GrItalic style={{
                    height: '20px',
                    width: '20px'
                }} />}
                offLabel=""
                onLabel=""
            />
            <ToggleButton
                style={{
                    height: '30px',
                    width: '30px',
                    padding: '0px',
                    backgroundColor: strikeActive ? '#ddd' : '#f9f9f9',
                    border: '1px solid #ccc',
                    borderRadius: '4px'
                }}
                type="button"
                checked={strikeActive}
                onChange={(e) => {
                    setStrikeActive(e.value);
                    editor.chain().focus().toggleStrike().run();
                }}
                onIcon={<GrStrikeThrough style={{
                    height: '20px',
                    width: '20px'
                }} />}
                offIcon={<GrStrikeThrough style={{
                    height: '20px',
                    width: '20px'
                }} />}
                offLabel=""
                onLabel=""
            />
            <ToggleButton
                style={{
                    height: '30px',
                    width: '30px',
                    padding: '0px',
                    backgroundColor: alignLeftActive ? '#ddd' : '#f9f9f9',
                    border: '1px solid #ccc',
                    borderRadius: '4px'
                }}
                type="button"
                checked={alignLeftActive}
                onChange={(e) => {
                    setAlignLeftActive(e.value);
                    editor.chain().focus().setTextAlign('left').run();
                }}
                onIcon={<GrTextAlignLeft style={{
                    height: '20px',
                    width: '20px'
                }} />}
                offIcon={<GrTextAlignLeft style={{
                    height: '20px',
                    width: '20px'
                }} />}
                offLabel=""
                onLabel=""
            />
            <ToggleButton
                style={{
                    height: '30px',
                    width: '30px',
                    padding: '0px',
                    backgroundColor: alignCenterActive ? '#ddd' : '#f9f9f9',
                    border: '1px solid #ccc',
                    borderRadius: '4px'
                }}
                type="button"
                checked={alignCenterActive}
                onChange={(e) => {
                    setAlignCenterActive(e.value);
                    editor.chain().focus().setTextAlign('center').run();
                }}
                onIcon={<GrTextAlignCenter style={{
                    height: '20px',
                    width: '20px'
                }} />}
                offIcon={<GrTextAlignCenter style={{
                    height: '20px',
                    width: '20px'
                }} />}
                offLabel=""
                onLabel=""
            />
            <ToggleButton
                style={{
                    height: '30px',
                    width: '30px',
                    padding: '0px',
                    backgroundColor: alignRightActive ? '#ddd' : '#f9f9f9',
                    border: '1px solid #ccc',
                    borderRadius: '4px'
                }}
                type="button"
                checked={alignRightActive}
                onChange={(e) => {
                    setAlignRightActive(e.value);
                    editor.chain().focus().setTextAlign('right').run();
                }}
                onIcon={<GrTextAlignRight style={{
                    height: '20px',
                    width: '20px'
                }} />}
                offIcon={<GrTextAlignRight style={{
                    height: '20px',
                    width: '20px'
                }} />}
                offLabel=""
                onLabel=""
            />
            <ToggleButton
                style={{
                    height: '30px',
                    width: '30px',
                    padding: '0px',
                    backgroundColor: bulletActive ? '#ddd' : '#f9f9f9',
                    border: '1px solid #ccc',
                    borderRadius: '4px'
                }}
                type="button"
                checked={bulletActive}
                onChange={(e) => {
                    setBulletActive(e.value);
                    editor.chain().focus().toggleBulletList().run();
                }}
                onIcon={<HiMiniListBullet style={{
                    height: '20px',
                    width: '20px'
                }} />}
                offIcon={<HiMiniListBullet style={{
                    height: '20px',
                    width: '20px'
                }} />}
                offLabel=""
                onLabel=""
            />
            <ColorPicker editor={editor} />
        </div>
    );
};

export default TiptapToolbar;
