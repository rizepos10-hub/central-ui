import React, { useState } from 'react';
import { InputText } from 'primereact/inputtext';
import _ from 'lodash';

type InputTextFilterProps = {
  placeholder?: string;
  onChange?: (e: InputEvent) => void;
  classname?: string;
  style?: Record<string, string>;
  size?: string | number;
  onKeyDown?: (e) => void;
  field: string;
  value: string;
};

const InputTextFilter = ({ field, placeholder = "Search", style, classname, onChange, size, value, onKeyDown }: InputTextFilterProps) => {
  const handleChange = e => {
    onChange(e);
  };

  return (
    <div className="position-relative">
      <InputText
        id={field}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        size={size}
        value={value || ''}
        name={field}
        style={style}
        className={`${classname} w-100 pe-5`}
        onChange={handleChange}
      />
      <div style={{
        position: 'absolute',
        top: '0rem',
        right: '0.5rem',
        fontSize: '1.5rem',
        color: '#1c140a',
        borderLeft: '1px solid #eff3f8',
        paddingLeft: '0.5rem',
        paddingRight: '0.5rem',
      }}>
        <i className="pi pi-search" />
      </div>
    </div>
  );
};

export default InputTextFilter;
