# apps/web — LaundryIQ Marketing Site

> Next.js 15 — laundryiq.app (no auth required, public SEO pages)

## Pages

Based on `LaundryIQ-UI-Mockup/01-marketing/` design specs:

| Route | File | Purpose |
|---|---|---|
| `/` | `app/page.tsx` | Landing page |
| `/features` | `app/features/page.tsx` | Feature details |
| `/products` | `app/products/page.tsx` | Product listing + FAQ |
| `/products/smart-plug` | `app/products/smart-plug/page.tsx` | Product detail |
| `/about` | `app/about/page.tsx` | Team + mission |
| `/privacy` | `app/privacy/page.tsx` | Privacy policy |
| `/terms` | `app/terms/page.tsx` | Terms of service |

## Key Notes

- No auth — fully public
- Server-rendered for SEO
- "Buy Now" buttons link to `shop.laundryiq.app` (Shopify)
- "Get Started" / "Sign In" link to `portal.laundryiq.app/signin`
- Navigation: hamburger on mobile, horizontal on desktop
