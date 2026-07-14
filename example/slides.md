---
theme: default
addons:
  - ./
title: Slidev Sandpack addon example
---

# Slidev Sandpack

Readable, multi-file live-code demos powered by CodeSandbox Sandpack.

---

# Minimal demo

````sandpack

```tsx [App.tsx]
export default function App() {
  return <h1>Hello from Sandpack</h1>;
}
```

````

---

# Source-backed preset and steps

````sandpack starter

```tsx [App.tsx]
import clsx from "clsx";

export default function App() {
  return <main className={clsx("demo")}>Step one</main>;
}
```

<!-- sandpack:step -->

```tsx [Card.tsx]
export function Card() {
  return <article>Added in step two</article>;
}
```

```tsx [App.tsx]
import clsx from "clsx";
import { Card } from "./Card";

export default function App() {
  return (
    <main className={clsx("demo")}>
      <Card />
    </main>
  );
}
```

````
