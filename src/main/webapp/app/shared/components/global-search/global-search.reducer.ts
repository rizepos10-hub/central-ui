import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { MenuItem } from 'app/shared/sidebar/AppMenu';

// Initial state
type ShortcutsState = {
  shortcuts: MenuItem[];
};

const initialState: ShortcutsState = {
  shortcuts: JSON.parse(localStorage.getItem('shortcuts') || '[]'),
};

// Create a slice
const shortcutsSlice = createSlice({
  name: 'shortcuts',
  initialState,
  reducers: {
    saveShortcut(state, action: PayloadAction<MenuItem>) {
      const itemWithChildren = {
        ...action.payload,
        items: action.payload.items ? [...action.payload.items] : [],
      };
      state.shortcuts.push(itemWithChildren);
      localStorage.setItem('shortcuts', JSON.stringify(state.shortcuts));
    },
    removeShortcut(state, action: PayloadAction<string>) {
      state.shortcuts = state.shortcuts.filter(shortcut => shortcut.to !== action.payload);
      localStorage.setItem('shortcuts', JSON.stringify(state.shortcuts));
    },
  },
});

// Export actions and reducer
export const { saveShortcut, removeShortcut } = shortcutsSlice.actions;
export default shortcutsSlice.reducer;
