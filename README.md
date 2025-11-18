# WhatsonYourPlate (Nx workspace)

This repository is an Nx workspace scaffold for the WhatsonYourPlate project. It currently contains no applications or libraries — just the workspace configuration so you can add apps later.

How to add an Angular application later:

1. Install dependencies:

```bash
npm install
```

2. Add an Angular application (example):

```bash
npx nx generate @nrwl/angular:application ui --style=scss --routing
```

3. Run the dev server:

```bash
npx nx dev frontend
```
