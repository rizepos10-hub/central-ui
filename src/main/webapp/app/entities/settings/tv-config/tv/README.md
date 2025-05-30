# TV Builder

A comprehensive TV display builder that allows you to create dynamic carousel content for TV displays with drag-and-drop functionality.

## Features

### TV Configuration
- **Name**: Set the TV display name
- **Aspect Ratio**: Choose from common aspect ratios (16:9, 4:3, 21:9, 1:1)
- **Dimensions**: Custom width and height settings
- **Branch & Display**: Associate with branches and TV displays

### Carousel Pages
- **Multiple Pages**: Create multiple carousel pages that auto-rotate
- **Duration**: Set display duration for each page (in seconds)
- **Page Management**: Add, edit, and manage carousel pages

### Item Integration
- **Item Selection**: Choose from regular items using searchable dropdown
- **Field Extraction**: Automatically extract item name, description, and image
- **One-Click Addition**: Add item fields to the canvas with a single click

### Canvas Editor
- **Drag & Drop**: Position elements anywhere on the canvas
- **Resize**: Adjust element size with corner handles
- **Live Preview**: See changes in real-time on the TV preview

### Element Styling
- **Text Elements**: 
  - Font size control
  - Color picker
  - Font weight (normal/bold)
  - Text alignment (left/center/right)
  - Live text editing
- **Image Elements**:
  - Drag and resize support
  - Automatic scaling and cropping

## Usage

### Creating a TV
1. Navigate to TV management
2. Click "Add New TV"
3. Set TV name and dimensions
4. Choose aspect ratio or set custom dimensions

### Building Carousel Content
1. Click "Add Page" to create your first carousel page
2. Set page name and duration
3. Select an item from the dropdown
4. Click "Add to Canvas" for any item field you want to display
5. Drag and resize elements on the canvas
6. Use the sidebar to fine-tune element properties

### Previewing
- Use the TV Preview section to see how your content will look
- Click the "View" button in the TV list to see fullscreen preview
- Preview automatically cycles through pages at set intervals

## React Native WebView Compatibility

The TV Viewer component is designed to work seamlessly in React Native WebView:

### Responsive Design
- Fullscreen display mode
- Automatic aspect ratio preservation
- Touch-friendly interface

### Performance Optimized
- Minimal dependencies
- Efficient rendering
- Smooth transitions

### Data Structure
The TV data is saved with percentage-based positioning and sizing, ensuring consistent display across different screen sizes and devices.

### Viewing URL
Access TV content at: `/tv/{id}/view`

This URL can be loaded in any WebView or browser for displaying the carousel content.

## Data Structure

```typescript
interface ITv {
  id: string;
  name: string;
  dimensions: { width: number; height: number };
  carouselPages: ICarouselPage[];
}

interface ICarouselPage {
  id: string;
  name: string;
  selectedItem?: IRegularItem;
  elements: ICarouselItemElement[];
  duration: number; // seconds
}

interface ICarouselItemElement {
  id: string;
  type: 'text' | 'image';
  content: string;
  position: { x: number; y: number }; // percentages
  size: { width: number; height: number }; // percentages
  style?: {
    fontSize?: number;
    color?: string;
    fontWeight?: string;
    textAlign?: string;
  };
}
```

## Technical Notes

- All positioning uses percentages for cross-device compatibility
- No Bootstrap dependencies for React Native Web compatibility
- Drag and drop powered by `react-draggable`
- Resizing powered by `react-resizable`
- Automatic carousel rotation with configurable timing
- Responsive design that adapts to various screen sizes 