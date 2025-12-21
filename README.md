# Baseet Studio Website

A modern, high-performance single-page website for Baseet Studio - a leading digital innovation agency.

## Overview

This website is built with Hugo and features a fully responsive, optimized single-page design showcasing Baseet Studio's services, portfolio, and expertise in web and mobile development.

## Color Profile

The website uses a carefully curated color scheme:

- **Stroke/Text**: `#171D1C` - Primary text and borders
- **Primary**: `#496BC1` - Brand color and CTAs
- **Secondary**: `#C2CCCF` - Muted accents
- **Tertiary**: `#FBCD37` - Accent highlights
- **Surface**: `#EBEBEB` - Background and white space

## Features

- ✅ **Single-Page Design**: Smooth navigation with anchor links
- ✅ **Dark Mode Support**: System-preference aware dark mode with manual toggle
- ✅ **Performance Optimized**: Minified assets, optimized images, fast load times
- ✅ **Responsive**: Mobile-first design that works on all devices
- ✅ **SEO Ready**: Robots.txt, canonical URLs, proper meta tags
- ✅ **Modern Stack**: Hugo, Tailwind CSS 4.x, PostCSS
- ✅ **Project Gallery**: Interactive screenshot carousel with lightbox preview
- ✅ **Clean Code**: Well-structured, maintainable codebase

## Recent Updates (December 2025)

### 🌙 Dark Mode Implementation
- Added system-preference aware dark mode that respects user OS settings
- Manual toggle button in the header for user control
- Dark mode persists across page visits via localStorage
- Smooth transitions between light and dark themes
- **Files**: `assets/css/dark-mode.css`, `layouts/partials/header.html`

### 🎨 About Page Fixes
- Fixed visibility issues with elements on tertiary (yellow) gradient backgrounds
- Quality card gem icon now visible in both light and dark modes
- Design step numbers properly contrast on yellow backgrounds
- **File**: `layouts/_default/about.html`

### 🖼️ Project Gallery Improvements
- Fixed invisible gallery thumbnails on project pages (Numu, Money Box, etc.)
- Removed problematic `scroll-animate` class that caused opacity:0 issues
- Gallery images now immediately visible without requiring scroll animation trigger
- **File**: `layouts/partials/project-gallery.html`

### 📱 Project Pages Enhanced
- Added project screenshots and app previews for portfolio items
- Interactive lightbox for full-size image viewing
- Responsive carousel supporting both mobile and web gallery types
- **Files**: `layouts/partials/project-gallery.html`, `data/projects/*.yaml`


## Tech Stack

- **Static Site Generator**: Hugo v0.152.2+
- **CSS Framework**: Tailwind CSS v4.1.17
- **Plugins**:
  - @tailwindcss/typography
  - Autoprefixer
- **Code Formatting**: Prettier with Hugo template support

## Project Structure

```
.
├── assets/              # Images and static assets
├── config/
│   └── _default/       # Hugo configuration
│       ├── hugo.yaml   # Main config
│       ├── menus.yaml  # Navigation structure
│       └── params.yaml # Site parameters
├── content/            # Page content (single-page)
├── data/
│   ├── home/          # Homepage sections data
│   │   ├── hero.yaml
│   │   ├── features.yaml
│   │   ├── highlights.yaml
│   │   └── clients.yaml
│   └── shared/        # Reusable components
├── hugo.yaml          # Root Hugo config
├── tailwind.config.js # Tailwind configuration
├── postcss.config.js  # PostCSS configuration
└── package.json       # Node dependencies
```

## Getting Started

### Prerequisites

- Hugo Extended v0.152.2 or higher
- Node.js v18+ and npm
- Git

### Installation

1. Clone the repository:

   ```bash
   cd /path/to/hugo-agency-web-demo
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   # or
   hugo server
   ```

4. Open your browser and navigate to `http://localhost:1313`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build optimized production site
- `npm run preview` - Preview with drafts and future content
- `npm run format` - Format code with Prettier

## Content Management

### Updating Content

All content is managed through YAML files in the `data/` directory:

#### Hero Section (`data/home/hero.yaml`)

- Main heading and description
- Call-to-action buttons
- Service highlights

#### Features (`data/home/features.yaml`)

- Detailed service descriptions
- Feature images and icons

#### Highlights (`data/home/highlights.yaml`)

- Value propositions
- Company benefits

#### Clients (`data/home/clients.yaml`)

- Client logos and testimonials

#### Footer (`data/shared/footer.yaml`)

- Contact information
- Social media links
- Copyright notice

### Navigation

Edit `config/_default/menus.yaml` to modify navigation links. All links use anchor navigation (`#section-id`) for single-page functionality.

### Site Configuration

Main settings in `config/_default/params.yaml`:

- Site title and description
- Contact information
- Social media links
- Favicon colors

## Customization

### Colors

Colors are defined in `tailwind.config.js`. To change the color scheme, update the color values in the `extend.colors` section.

### Sections

To add/remove sections:

1. Update the relevant YAML file in `data/home/`
2. Ensure corresponding templates exist in the theme
3. Update navigation in `config/_default/menus.yaml`

## Performance

The site is optimized for performance:

- **Minification**: HTML, CSS, and JS are minified in production
- **Image Optimization**: Images are processed and optimized
- **Fast Render**: Hugo's fast render mode for development
- **Clean URLs**: SEO-friendly URL structure
- **Lazy Loading**: Images load on demand

## Deployment

Build the production-ready site:

```bash
npm run build
```

The optimized site will be in the `public/` directory, ready for deployment to any static hosting service (Netlify, Vercel, GitHub Pages, etc.).

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Support

For issues or questions:

- Email: info@baseetstudio.com
- Phone: +1 (555) 123-4567

## License

MIT License - Copyright © 2025 Baseet Studio. All Rights Reserved.

---

**Built with ❤️ by Baseet Studio**
