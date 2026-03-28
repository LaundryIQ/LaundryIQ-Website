---
name: responsive-design
description: Enforce mobile-first responsive design for UI mockups. Use when creating HTML/CSS layouts, designing components, or building any visual interface.
---

# Responsive Design Skill

Apply mobile-first responsive design principles when creating any UI mockups.

## When to Use

- Creating HTML/CSS layouts
- Designing React components
- Building any visual interface
- Reviewing existing designs for responsiveness

## Mobile-First Rules

1. **Design mobile layout FIRST** (320px width)
2. **Then add tablet enhancements** (640px+)
3. **Then add desktop enhancements** (1024px+)

## Required Patterns

### Flexible Layouts
```css
/* Use flex/grid with wrap */
.container {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

/* Stack on mobile, row on desktop */
@media (min-width: 1024px) {
  .container { flex-direction: row; }
}
```

### Responsive Images
```css
img {
  max-width: 100%;
  height: auto;
}
```

### Touch-Friendly Targets
```css
/* Minimum 44x44px for buttons/links */
button, a {
  min-height: 44px;
  min-width: 44px;
  padding: 0.75rem 1rem;
}
```

### Relative Units
```css
/* Use rem/em, not px for text */
body { font-size: 1rem; }    /* 16px base */
h1 { font-size: 2.5rem; }    /* scales with user preference */
```

## Common Pitfalls to Avoid

- Fixed pixel widths (causes horizontal scroll)
- Side-by-side layouts that don't stack on mobile
- Buttons/links smaller than 44px
- Text smaller than 16px on mobile
- Modals without mobile-friendly close buttons
- Form inputs too close together

## Testing Checklist

- [ ] 320px - smallest phones
- [ ] 375px - standard phones
- [ ] 640px - tablets
- [ ] 1024px - laptops
- [ ] No horizontal scrolling at any width
