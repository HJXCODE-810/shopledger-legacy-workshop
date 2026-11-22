# Repository Guidelines

## Stack

ShopLedger is a CommonJS Node.js application using Express 4 and `body-parser`. Its browser UI is plain HTML, CSS, and JavaScript. Runtime data is stored in `data/db.json`; there is no external database or frontend build system configured.

## Module Map

- `server.js` creates the Express app, serves `public/`, and mounts the API routers.
- `routes/` contains the products, orders, customers, and reports HTTP handlers.
- `lib/` contains order, pricing, tax, coupon, inventory, ledger, report, invoice, date, and JSON-store logic.
- `public/` contains the UI (`index.html`, `js/app.js`, `css/style.css`).
- `config.js` holds shop, tax, inventory, and coupon settings; `data/db.json` holds app data.

## Commands

- `npm start` starts the server (`PORT` overrides the default port 3000).
- `npm test` currently exits with “no test specified”; no test framework or test suite is configured.
- No build, lint, or format command is configured.

## Change Rules

- Before changing behaviour, write characterization tests that capture the existing behaviour and the intended change.
- Change only the module the ticket is about. Keep edits within that module unless the ticket explicitly covers another module.
- Tests must never read or write `data/db.json`; use isolated test data instead.
- Do not add dependencies. Use the existing runtime and repository tools.
