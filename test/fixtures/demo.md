Before the demo.

@@@ physics

```tsx [App.tsx]
export default function App() {
  return <h1>First</h1>;
}
```

<!-- An ordinary comment is allowed. -->

<!-- sandpack:step -->

```tsx [components/Card component.tsx]
export function Card() {
  return <article>Card</article>;
}
```

```tsx [App.tsx]
@@@
<!-- sandpack:step -->
```

@@@

Between demos.

@@@

```ts [index.ts]
console.log("second demo");
```

@@@

After the demos.
