# Sheet

Native drawer component using `<dialog>`

[Example](https://sheet.erikt.me/)

## Installation

```ts
import { sheet } from 'https://esm.sh/gh/erikthalen/sheet/src/lib'

const destroySheets = document.querySelectorAll('dialog').map(sheet)

// init function returns a teardown function
destroySheets.forEach(fn => fn())
```

## Minimal example

```html
<button onclick="document.getElementById('dialog')?.showModal()">
  Open sheet
</button>

<dialog id="dialog" closedby="any">
  <button data-sheet-handle>Drag to close</button>

  <p>Content</p>
</dialog>
```

## Configuration

```css
:root {
  --sheet-top-margin: 3rem;
  --sheet-background-scale-amount: 10px;
  --sheet-background-border-radius: 10px;
  --sheet-easing: cubic-bezier(0.32, 0.72, 0, 1);
}
```
