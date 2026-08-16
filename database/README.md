# Alpha Q7 — Full Website CMS + React Admin

This version uses the **bad ZIP as the content/section reference** and the React-authenticated project as the architecture.

## What changed

The React admin's **Overview** is now the master editor for the public website.

Editable from Overview:

- Hero / homepage
- Masterclass block
- About Alpha Q7
- About feature cards — full CRUD
- Statistics — edit values and labels
- Courses section
- Courses — add/edit/delete
- Market Analysis
- Market Analysis cards — full CRUD
- What You'll Learn section
- Learning subjects — add/edit/delete
- Brochure block
- Testimonials section
- Testimonials — add/edit/delete
- CTA section
- FAQ section
- FAQ records — add/edit/delete
- Contact section
- Primary navigation labels
- Live ticker label
- Leads — read/update/delete

The **Website** module continues to contain complete Footer CMS CRUD:

- Footer branding
- Footer description
- Contact details
- Footer columns
- Footer links
- Social links
- QR image
- Copyright
- Disclaimer
- Legal links

## Architecture

```text
Public Website
    |
    +--> GET /api/content/public
    |
    +--> GET /api/footer/public

React Admin
    |
    +--> JWT authentication
    |      HTTP-only cookie
    |
    +--> Protected CRUD API
           |
           +--> server/data/db.json
```

The public website now uses server-managed content first. If the API is unavailable, its previous local/static fallback remains available.

## Login

Create `server/.env` from `server/.env.example` and set a unique administrator username,
a strong password, and a random JWT secret. Never publish real credentials in project
documentation or commit the `.env` file.

`JWT_SECRET` is already generated in `server/.env`. It is a server secret and must never be placed in React code.

## Windows

From the project root:

```cmd
npm install
npm run install:all
npm run dev
```

Open:

```text
http://localhost:4000
http://localhost:5173
```

Admin:

```text
http://localhost:5173
```

## Production

Build React:

```cmd
npm run build
```

Then configure:

```text
SERVE_ADMIN=true
NODE_ENV=production
CLIENT_ORIGIN=https://your-domain.com
JWT_SECRET=<long-random-secret>
ADMIN_USERNAME=<admin>
ADMIN_PASSWORD=<strong-password>
SYNC_ADMIN_ENV=false
```

## Reference behavior

The older `bad.zip` provided the website content model: hero/about/statistics, courses, learning subjects, testimonials, FAQ, leads and website settings. This package keeps that terminology and expands the React Overview so those public sections are directly editable.

## Important

The current persistence layer is JSON for simple deployment. For a high-traffic production CMS, migrate `server/data/db.json` to PostgreSQL and use object storage for media.
