# @uspot-leb/dashboard-cli

CLI that generates a customizable USpotLeb SaaS dashboard **as editable source** inside your Next.js project — no component lock-in.

## Installation

```bash
npm install -g @uspot-leb/dashboard-cli
```

Or run without installing:

```bash
npx @uspot-leb/dashboard-cli init
```

## Commands

### `init`

Scaffold the full dashboard.

```bash
npx @uspot-leb/dashboard-cli init
npx @uspot-leb/dashboard-cli init --yes
npx @uspot-leb/dashboard-cli init --force
```

### `add <component>`

Add an individual component:

```bash
npx @uspot-leb/dashboard-cli add sidebar
npx @uspot-leb/dashboard-cli add chart
npx @uspot-leb/dashboard-cli add table
```

Valid components: `sidebar`, `chart`, `table`, `header`, `stat`, `shell`

### `update`

Pull the latest component templates (preserves `config/dashboard.config.ts`):

```bash
npx @uspot-leb/dashboard-cli update
```

## Binary name

```bash
uspot-dashboard init
```

## Publish

```bash
pnpm build
npm publish --access public
```

## License

MIT © USpotLeb
