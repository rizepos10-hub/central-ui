import React, { useState } from 'react';
import { InputText } from 'primereact/inputtext';
import _ from 'lodash';

type InputTextFilterProps = {
  placeholder?: string;
  onChange?: (e: InputEvent) => void;
  classname?: string;
  style?: Record<string, string>;
  size?: string | number;
  field: string;
  value: string;
};

const InputTextFilter = ({ field, placeholder = "Search", style, classname, onChange, size, value }: InputTextFilterProps) => {
  const handleChange = e => {
    onChange(e);
  };

  return (
    <span className="p-input-icon-right">
      <InputText
        id={field}
        placeholder={placeholder}
        size={size}
        value={value || ''}
        name={field}
        style={style}
        className={classname}
        onChange={handleChange}
      />
      <i className="pi pi-search" />
    </span>
  );
};

export default InputTextFilter;
