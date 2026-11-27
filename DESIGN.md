# AssetCrest reference-site design notes

## Source and capture
- Reference URL: https://assetcrest.co/
- Inspected: 2026-11-27
- Captured desktop homepage branding, full-page content, links and HTML; also requested a mobile capture.
- Scope: public-site navigation, footer, content typography and decorative icon motion. The authenticated dashboard retains its existing application styling and behavior.

## Extracted brand tokens
- Primary accent: `#E94D65` (reference branding extraction).
- Deep blue: `#1B4962` (reference branding extraction).
- White page background: `#FFFFFF`.
- Body typeface: Roboto.
- Heading typeface: Sarabun.
- Reference extraction reports H1 80px, H2 60px and body 16px desktop; mobile capture reports H1 48px, H2 38.4px and body 13px. Actual per-section sizes vary.
- Base spacing unit: 4px; observed button corners square (0px) and general site radius around 5px.

## Header / navigation pattern
- Contact strip includes weekday opening hours, office address and social links.
- Main row includes the AssetCrest logo and Register/Login actions.
- Separate primary navigation contains Home, About Us, Company, Plans, Process, Vacation and Contact.
- Mobile implementation collapses navigation into an accessible menu control and keeps Register/Login available inside the expanded menu.
- Current implementation uses the user's existing relative application routes for authentication and the existing public-page routes.

## Footer pattern
- Three-column desktop structure:
  1. ASSETCREST Headquarters with short company introduction, support email and website.
  2. OUR LOCATIONS / Where to find us? with the footer map image and office address.
  3. GET IN TOUCH / AssetCrest Social links with support details and social icons.
- Bottom row contains rights notice, footer navigation and Back to top.
- Responsive layout stacks columns on smaller screens.
- Existing official company-domain email addresses are retained instead of copying the old reference-domain email addresses.

## Motion and accessibility
- Reference HTML does not establish the exact original icon animation timings or scroll-trigger effects. The implementation therefore uses a restrained, explicit approximation: icon lift/rotation on hover, navigation underline transitions, and gentle card lift.
- Motion respects `prefers-reduced-motion`.
- Navigation uses semantic landmarks, an accessible menu button, `aria-expanded`, and `aria-current` for the active route.

## Fidelity notes
- Colors, fonts, logo and footer-map image are taken from observed reference assets/branding extraction.
- Responsive menu behavior and icon motion are implementation choices rather than verified reproductions of hidden original JavaScript interactions.
- Existing account routes, application data, investment controls, and server/API behavior are not changed by this public chrome update.
