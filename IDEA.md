# Self-generating MacOS-style generative UI demo

Idea: 
website (hosting AI agent, Claude Opus 4.8 via eve.dev framework) takes a query 
-> uses special UI component system in mac os style 
-> outputs page designed with macos style

(app)/ - Main page

Prompt input which takes message, sends it to the agent

(app)/page/{uuid}

Where page is hosted, it takes the UI markup from supabase row representing this generation and renders it as components

Design system + prompt

We need some library with primitives + prompt making AI capable of designing mac os like interfaces without manually thinking about design implementation (like liquid glass)

Like

```tsx
<Layout>
 <NavBar>
   <NavBarElement url="/home">Home</NavBarElement>
 </NavBar>
 <Page>
   ...
 </Page>
</Layout>
```

As much css-agnostic interface as possible, maybe even better to just reuse shadcn protocol?

Key: we need to find shadcn design lib which implements mac os as closely as possible

Task now: setup a nextjs repo + supabase (copy from ~/Projects/customs-os) like local supabase runner, dev commands, drizzle orm, basically all the boilerplate, but no need for auth
