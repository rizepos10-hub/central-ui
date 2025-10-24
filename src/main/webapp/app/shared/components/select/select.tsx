import React from 'react';
import ReactSelect, { Props as SelectProps, GroupBase } from 'react-select';
import { cn } from 'app/lib/utils';

// Custom styles that match shadcn input styling with proper z-index
const customStyles = {
  control: (base: any, state: any) => ({
    ...base,
    minHeight: '28px',
    fontSize: '0.75rem',
    borderRadius: '0.375rem',
    borderColor: state.isFocused ? 'hsl(var(--ring))' : 'hsl(var(--input))',
    backgroundColor: 'hsl(var(--background))',
    boxShadow: state.isFocused ? '0 0 0 1px hsl(var(--ring))' : 'none',
    '&:hover': {
      borderColor: 'hsl(var(--input))',
    },
  }),
  valueContainer: (base: any) => ({
    ...base,
    minHeight: '28px',
    padding: '2px 6px',
  }),
  input: (base: any) => ({
    ...base,
    margin: '0',
    padding: '0',
    color: 'hsl(var(--foreground))',
  }),
  indicatorSeparator: () => ({
    display: 'none',
  }),
  indicatorsContainer: (base: any) => ({
    ...base,
    height: '28px',
  }),
  menu: (base: any) => ({
    ...base,
    zIndex: 99999,
    borderRadius: '0.375rem',
    border: '1px solid hsl(var(--border))',
    backgroundColor: 'hsl(var(--popover))',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    pointerEvents: 'auto',
  }),
  menuPortal: (base: any) => ({
    ...base,
    zIndex: 99999,
  }),
  menuList: (base: any) => ({
    ...base,
    padding: '4px',
    borderRadius: '0.375rem',
  }),
  option: (base: any, state: any) => ({
    ...base,
    fontSize: '0.75rem',
    borderRadius: '0.25rem',
    padding: '6px 8px',
    backgroundColor: state.isSelected
      ? 'hsl(var(--accent))'
      : state.isFocused
      ? 'hsl(var(--accent))'
      : 'transparent',
    color: state.isSelected
      ? 'hsl(var(--accent-foreground))'
      : 'hsl(var(--popover-foreground))',
    cursor: 'pointer',
    '&:active': {
      backgroundColor: 'hsl(var(--accent))',
    },
  }),
  placeholder: (base: any) => ({
    ...base,
    fontSize: '0.75rem',
    color: 'hsl(var(--muted-foreground))',
  }),
  singleValue: (base: any) => ({
    ...base,
    fontSize: '0.75rem',
    color: 'hsl(var(--foreground))',
  }),
  multiValue: (base: any) => ({
    ...base,
    backgroundColor: 'hsl(var(--accent))',
    borderRadius: '0.25rem',
  }),
  multiValueLabel: (base: any) => ({
    ...base,
    fontSize: '0.75rem',
    color: 'hsl(var(--accent-foreground))',
    padding: '2px 6px',
  }),
  multiValueRemove: (base: any) => ({
    ...base,
    color: 'hsl(var(--accent-foreground))',
    ':hover': {
      backgroundColor: 'hsl(var(--destructive))',
      color: 'hsl(var(--destructive-foreground))',
    },
  }),
  clearIndicator: (base: any) => ({
    ...base,
    color: 'hsl(var(--muted-foreground))',
    cursor: 'pointer',
    ':hover': {
      color: 'hsl(var(--foreground))',
    },
  }),
  dropdownIndicator: (base: any) => ({
    ...base,
    color: 'hsl(var(--muted-foreground))',
    cursor: 'pointer',
    ':hover': {
      color: 'hsl(var(--foreground))',
    },
  }),
  loadingIndicator: (base: any) => ({
    ...base,
    color: 'hsl(var(--muted-foreground))',
  }),
  noOptionsMessage: (base: any) => ({
    ...base,
    fontSize: '0.75rem',
    color: 'hsl(var(--muted-foreground))',
  }),
  loadingMessage: (base: any) => ({
    ...base,
    fontSize: '0.75rem',
    color: 'hsl(var(--muted-foreground))',
  }),
};

// Merge custom styles with user-provided styles
const mergeStyles = (userStyles: any = {}) => {
  return Object.keys(customStyles).reduce((acc, key) => {
    acc[key] = (base: any, state: any) => {
      const customStyle = customStyles[key](base, state);
      const userStyle = userStyles[key] ? userStyles[key](base, state) : {};
      return { ...customStyle, ...userStyle };
    };
    return acc;
  }, {} as any);
};

function Select<
  Option = unknown,
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>
>(props: SelectProps<Option, IsMulti, Group>) {
  const {
    styles,
    className,
    menuPortalTarget,
    menuPosition,
    menuShouldBlockScroll,
    closeMenuOnSelect,
    ...rest
  } = props;

  return (
    <ReactSelect
      {...rest}
      className={cn('react-select-container', className)}
      classNamePrefix="react-select"
      styles={mergeStyles(styles)}
      menuPortalTarget={menuPortalTarget !== undefined ? menuPortalTarget : document.body}
      menuPosition={menuPosition || 'fixed'}
      menuShouldBlockScroll={menuShouldBlockScroll !== undefined ? menuShouldBlockScroll : false}
      closeMenuOnSelect={closeMenuOnSelect !== undefined ? closeMenuOnSelect : true}
    />
  );
}

export default Select;
