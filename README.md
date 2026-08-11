# My Meals KSA: Sweet Success

Build a comprehensive Web Application for a healthy meal subscription SaaS called "My Meals KSA - وجباتي".
Target Language: Arabic (Strictly RTL direction, use 'Cairo' for headings and 'Tajawal' for body text).
Brand Colors: Background Cream (#fdfbf3), Primary Forest Green (#1f5c3a), Dark Green (#17301f), Accent Gold (#d9a441).

### Part 1: UI/UX Layout & User Journey (Landing Page Structure)
The homepage must follow a modern, high-converting flow, replicating a premium SaaS landing page. Build the sections in this exact order:

1. **Sticky Header:** 
   - Logo on the right. USE THIS EXACT IMAGE URL FOR THE LOGO: https://incredible-croissant-8e5f83.netlify.app/assets/logo.png
   - Smooth scroll navigation links in the center (الرئيسية, المميزات, الباقات, الأسعار).
   - Solid "اشترك الآن" CTA button on the left.

2. **Hero Section (Two-Column Layout):**
   - **Right Column (Text):** A small top pill stating "متواجدون في الطائف". A massive headline: "وجبات صحية تُحضَّر يومياً من أجلك" where specific words are highlighted in Primary Green. A supportive sub-headline, and two buttons (Primary CTA: "احسب سعراتك", Secondary Ghost CTA: "تصفّح الباقات").
   - **Left Column (Visual):** A high-quality image of healthy meal prep boxes, with a floating UI badge overlapping the bottom corner saying "٢٠ يوماً في الاشتراك الشهري".

3. **Features Grid (Why Us):**
   - A 4-column grid of minimalist cards with soft shadows and hover effects.
   - Cards: 1. سعرات محسوبة, 2. طهاة متخصصون, 3. توصيل يومي, 4. اشتراك مرن. Use Lucide-react icons for each.

4. **Smart BMR Calculator (Lead Magnet Section):**
   - A beautifully designed, prominent full-width section or large glass-morphism card.
   - User inputs: Gender, Age, Height (cm), Weight (kg), and Primary Goal (Weight Loss / Maintain / Build Muscle / Extreme Fat Burn).
   - Output: Calculates daily required Calories (BMR + TDEE) and Macros.
   - Action: Automatically suggests the best meal plan based on the goal.

5. **Meal Plans Showcase (Alternating Split Layout):**
   - Display the 5 plans using an alternating row layout (Row 1: Image right, Text left. Row 2: Image left, Text right, etc.).
   - The 5 Plans to display:
     1. الأكل الصحي (Lifestyle): 150g Protein / 150g Carb.
     2. اللوكارب (Low-Carb): 150g Protein / 80g Carb.
     3. التضخيم (Bulking): 200g Protein / 200g Carb.
     4. التنشيف (Cutting): 200g Protein / 150g Carb.
     5. بروتين بدون كارب (Keto): 200g Protein / 0g Carb.

6. **How it Works (3 Steps):**
   - A dark background section (Dark Green #17301f) with light text.
   - 3 columns showing the process: 1. اختر الباقة, 2. حدد وجباتك, 3. استمتع بوجبتك. Use large Accent Gold numbers for the steps.

7. **Dynamic Interactive Pricing Builder:**
   - Instead of static cards, build an interactive checkout configurator.
   - Users select Plan Type, Meal Count (1, 2, or 3 meals), and Duration (1, 5, 20, or 24 days).
   - Real-time price calculation based on this EXACT matrix (SAR):
     * Group A (الأكل الصحي & اللوكارب):
       - 1 Meal: 30 (1d) | 160 (5d) | 495 (20d) | 535 (24d)
       - 2 Meals: 50 (1d) | 260 (5d) | 865 (20d) | 965 (24d)
       - 3 Meals: 70 (1d) | 320 (5d) | 999 (20d) | 1149 (24d)
     * Group B (التضخيم, التنشيف & كيتو):
       - 1 Meal: 35 (1d) | 180 (5d) | 530 (20d) | 580 (24d)
       - 2 Meals: 55 (1d) | 280 (5d) | 969 (20d) | 1069 (24d)
       - 3 Meals: 80 (1d) | 360 (5d) | 1155 (20d) | 1310 (24d)

### Part 2: Checkout & System Requirements
- **Checkout Flow:** From the Pricing Builder, user clicks "Proceed" and fills: Full Name, WhatsApp Number, Delivery City (Taif), Detailed Address. Store this in Supabase (`subscriptions` table).
- **Tech Stack:** React, Vite, Tailwind CSS, Shadcn UI.
- **Routing:** Must include a `public/_redirects` file containing `/* /index.html 200` for Netlify SPA routing.
- **Footer & Trust Badges:** 
  - Display the Ministry of Commerce commercial registration prominently. USE THIS EXACT IMAGE URL: https://incredible-croissant-8e5f83.netlify.app/assets/commercial-registration.png
  - Display contact email (mymealsksa@gmail.com).
  - Include a floating WhatsApp CTA button (linking to https://wa.me/message/6R7UXKZY5YVQA1) at the bottom left of the screen.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/2c228639-a3ea-4df9-bfbe-e7dcd42e0252).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
