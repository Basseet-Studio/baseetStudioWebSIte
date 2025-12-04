# Email Form Setup Instructions

## Current Status

The contact form is configured to use **Formspree** - a free form backend service that handles form submissions and sends emails.

## How to Make the Form Functional

### Step 1: Create a Formspree Account

1. Go to [https://formspree.io](https://formspree.io)
2. Sign up for a free account (allows 50 submissions/month)
3. Create a new form project

### Step 2: Get Your Form ID

1. After creating a form in Formspree, you'll get a Form ID
2. It looks like: `xyzabc12` or similar
3. Copy this ID

### Step 3: Update Your Site

1. Open `data/shared/subscribe.yaml`
2. Find the line: `action: 'https://formspree.io/f/YOUR_FORM_ID'`
3. Replace `YOUR_FORM_ID` with your actual Formspree form ID
4. Example: `action: 'https://formspree.io/f/xyzabc12'`

### Step 4: Rebuild and Deploy

```bash
hugo --minify --cleanDestinationDir
# Then deploy to your hosting
```

### Alternative: Use Your Own Email Service

If you prefer a different service, you can use:

#### Option 1: Netlify Forms (if hosting on Netlify)

```yaml
method: 'POST'
action: '/' # Netlify automatically detects forms
# Add: data-netlify="true" attribute to form in template
```

#### Option 2: Direct Email (mailto)

```yaml
method: 'GET'
action: 'mailto:info@baseetstudio.com?subject=Contact%20Form'
```

#### Option 3: Custom Backend

Set up your own backend API and update:

```yaml
method: 'POST'
action: 'https://your-api.com/contact'
```

## Current Configuration

- **Method**: POST
- **Action**: https://formspree.io/f/YOUR_FORM_ID (needs your ID)
- **Fields**: Email field with name="email"
- **Submit**: "Get in Touch" button

## Testing

1. Replace YOUR_FORM_ID with actual ID
2. Rebuild site
3. Submit form
4. Check email or Formspree dashboard for submissions

## Free Alternatives

- **Formspree**: 50 submissions/month (free tier)
- **Netlify Forms**: 100 submissions/month (free tier)
- **Getform**: 50 submissions/month (free tier)
- **FormSubmit**: Unlimited (free, no signup)
