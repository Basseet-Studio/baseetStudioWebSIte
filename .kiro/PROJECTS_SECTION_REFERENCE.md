# Projects Section - Git Commit Reference

## 📍 Found In Commits

### Main Commit: `7671348`

**Branch:** `spline-clouds` (also on `origin/spline-clouds`)  
**Date:** Mon Dec 1 04:35:01 2025 +0400  
**Commit Message:** `feat: Add new projects section with Money Box and Numu details`

### Related Commit: `c366fa6`

**Date:** Mon Dec 1 04:35:02 2025 +0400  
**Commit Message:** `Add new project pages for Money Box and Numu; update sitemap and redirect page`

---

## 📂 Files Added/Modified

### Data Files

- ✅ `data/home/projects.yaml` - Projects section configuration and data

### Layout Files

- ✅ `layouts/_partials/blocks/home/projects.html` - Projects section homepage component
- ✅ `layouts/projects/list.html` - Projects listing page
- ✅ `layouts/projects/single.html` - Individual project detail page
- ✅ `layouts/_default/baseof.html` - Base template
- ✅ `layouts/home.html` - Updated to include projects section

### Content Files

- ✅ `content/projects/_index.md` - Projects section index
- ✅ `content/projects/money-box.md` - Money Box project details
- ✅ `content/projects/numu.md` - Numu project details

### Configuration

- ✅ `config/_default/menus.yaml` - Updated header to include Projects link

---

## 🎯 What These Files Include

### 1. **Projects Homepage Section** (`data/home/projects.yaml`)

Features:

- Section title: "Our Products"
- Subtitle: "In-House Apps Built with Love"
- Two product cards: Money Box and Numu
- Each card has:
  - Name, tagline, description
  - App icon
  - Platform badges (iOS/Android)
  - Feature list
  - Custom color scheme and gradient
  - "Coming Soon" status
  - "Learn More" link to detail page

### 2. **Project Detail Pages** (`layouts/projects/single.html`)

Sections:

- Hero section with app icon and title
- Feature grid (6 features)
- About section (from markdown content)
- FAQ accordion
- Early access email signup form
- Footer navigation

### 3. **Products Included**

#### Money Box

- **Tagline:** Smart Savings Made Simple
- **Color:** #34C759 (Green)
- **Features:** Smart savings goals, Expense tracking, Visual progress charts, Daily reminders, Budget categories, Secure & Private
- **Platforms:** iOS 15+, Android 8+

#### Numu

- **Tagline:** Build Better Habits
- **Color:** #AF52DE (Purple)
- **Features:** Habit streaks, Daily check-ins, Progress analytics, Custom reminders
- **Platforms:** iOS 15+, Android 8+

---

## 🔄 How to Restore These Files

### Option 1: View the files from that commit

```bash
git show 7671348:data/home/projects.yaml
git show 7671348:layouts/_partials/blocks/home/projects.html
git show 7671348:layouts/projects/single.html
git show 7671348:content/projects/money-box.md
git show 7671348:content/projects/numu.md
```

### Option 2: Restore specific files

```bash
# Restore a single file to your working directory
git checkout 7671348 -- data/home/projects.yaml
git checkout 7671348 -- layouts/_partials/blocks/home/projects.html
git checkout 7671348 -- layouts/projects/single.html

# Restore entire projects directory
git checkout 7671348 -- content/projects/
```

### Option 3: Create a new branch from that commit

```bash
git checkout -b restore-projects 7671348
```

---

## 📝 Integration Notes

To integrate the projects section into your current site:

1. **Restore the data file:**

   ```bash
   git checkout 7671348 -- data/home/projects.yaml
   ```

2. **Restore the layout component:**

   ```bash
   git checkout 7671348 -- layouts/_partials/blocks/home/projects.html
   ```

3. **Update `layouts/home.html`** to include:

   ```html
   {{ with site.Data.home.projects }}{{ if .enable }}{{ partial "blocks/home/projects" . }}{{ end }}{{ end }}
   ```

4. **(Optional)** Restore project detail pages:

   ```bash
   git checkout 7671348 -- layouts/projects/
   git checkout 7671348 -- content/projects/
   ```

5. **Update navigation** in `config/_default/menus.yaml` or header.html to add Projects link

---

## 🎨 Design Features

The projects section includes:

- ✨ Beautiful gradient top borders on cards
- 🎯 Hover effects with scale and shadow transitions
- 📱 Responsive grid (1 column mobile, 2 columns desktop)
- 🎨 Custom color theming per project
- 🔔 Platform badges (iOS/Android)
- ✅ Feature lists with checkmark icons
- 🔗 "Learn More" links with animated arrows
- 📄 Detailed project pages with FAQs and early access signup

---

## 💡 Quick Access Commands

```bash
# View all changes in the main commit
git show 7671348

# See commit history around that time
git log --oneline --graph --all | grep -A5 -B5 7671348

# Compare with current state
git diff 7671348 HEAD -- data/home/
```
