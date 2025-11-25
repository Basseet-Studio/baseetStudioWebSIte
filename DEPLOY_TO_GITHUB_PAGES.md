# Deploy to GitHub Pages

## 🎉 Site Has Been Built and Uploaded!

The site has already been built and pushed to the `gh-pages` branch. You just need to enable GitHub Pages in the repository settings.

---

## ✅ Steps to Enable GitHub Pages

### 1. Go to Repository Settings

Open this link in your browser:

👉 **https://github.com/ariyangd/baseetStudioWebSIte/settings/pages**

### 2. Configure GitHub Pages

Under **"Build and deployment"** section:

1. **Source**: Select **"Deploy from a branch"**
2. **Branch**: Select **`gh-pages`** from the dropdown
3. **Folder**: Keep it as **`/ (root)`**
4. Click **Save**

![GitHub Pages Settings](https://docs.github.com/assets/cb-28505/mw-1440/images/help/pages/publishing-source-drop-down.webp)

### 3. Wait for Deployment

- GitHub will take 1-2 minutes to deploy
- You'll see a green checkmark when it's ready

### 4. Access Your Site! 🚀

Your site will be live at:

🌐 **https://ariyangd.github.io/baseetStudioWebSIte/**

---

## 📝 How to Update the Site (For Future Changes)

When you need to deploy updates, run these commands in the project root:

```bash
# 1. Build the site
hugo --gc --minify --baseURL "https://ariyangd.github.io/baseetStudioWebSIte/"

# 2. Go to the public folder and push updates
cd public
git add -A
git commit -m "Update site"
git push origin gh-pages
cd ..
```

Or use the deploy script (if created):

```bash
./deploy.sh
```

---

## ⚠️ Important Notes

- The `gh-pages` branch contains only the built static files
- Don't edit files directly in the `gh-pages` branch
- Always make changes in the main source files and rebuild
- The `public/` folder is the build output directory

---

## 🔧 Troubleshooting

### Site not showing?
- Make sure GitHub Pages is set to deploy from `gh-pages` branch
- Wait a few minutes for GitHub to process the deployment
- Check the "Actions" tab for any deployment status

### 404 errors on pages?
- The baseURL might be incorrect
- Rebuild with: `hugo --gc --minify --baseURL "https://ariyangd.github.io/baseetStudioWebSIte/"`

### CSS/JS not loading?
- Clear your browser cache
- Check browser console for errors
- Verify the baseURL is correct

---

## 📞 Need Help?

If you have any issues, contact the development team.
