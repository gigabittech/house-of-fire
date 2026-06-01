# House of Fire — UI Design Handoff
**For: Claude Design**
**Project: houseoffire.events — Custom PWA**
**Prepared by: NovaSapien Labs / Gigabit · May 2026**

---

## 1. What You're Designing

House of Fire is a monthly underground electronic music event in Boulder, Colorado. It happens once a month at Junkyard Social Club. Every event sells out. Around 300 people attend. More than half of them have been before.

You are designing the platform that replaces Eventbrite for this event — a Progressive Web Application (PWA) that lives at **houseoffire.events**. Attendees install it to their phone home screen. They use it to buy tickets before the event, show their QR code at the door, and browse photos and community posts after.

This is not a generic event platform. It is a specific brand with a specific audience. Every design decision should reflect that.

---

## 2. The Audience

**Primary user:** 21–35 year old nightlife regular in Boulder / Denver / Front Range CO. They go out intentionally. They care about music, the crowd, and the vibe. They have been to House of Fire before or know someone who has. They discover it through Instagram and word of mouth.

**Secondary user:** Jordan Groth (the promoter / co-founder). He needs an admin view to manage events, see ticket sales, download guest lists, and approve photo uploads. His view is operational, not social.

**Environment of use:** Phones. Often in low light. Sometimes in a loud venue. Users will be checking their ticket, uploading a photo, or looking at the event page while holding a drink. The UI must work with one thumb.

---

## 3. Brand Identity

### Name and meaning
House of Fire. The name is visceral — warmth, energy, intimacy, something burning with life. The event is underground but not cold. It has personality. It has regulars. It has community.

### Personality
- **Intimate, not massive.** This is not a festival. It is a monthly gathering of people who keep coming back.
- **Underground, not inaccessible.** Not exclusive in the velvet-rope sense. Inclusive in the "you know about this because you care" sense.
- **Warm, not neon.** Electronic music events default to cold blues and greens. House of Fire is warm — amber, ember, dark gold, deep orange — because fire is warm.
- **Editorial, not promotional.** The platform should feel like a cultural object, not an advertisement. Think: a well-designed magazine, not a flyer.

### What it is not
- Not corporate. Not generic. Not a Squarespace template.
- Not aggressively dark or gothic. The fire palette is warm.
- Not festival-coded. Big logos, strobing effects, confetti — none of that.
- Not overly minimal / cold / Scandinavian. This has texture and warmth.

### Closest cultural references (for tone, not literal copying)
- **DICE** — the ticketing platform's editorial feel and dark UI
- **Boiler Room** — black background, real photography, no decoration
- **RA (Resident Advisor)** — underground credibility, editorial layout, dark and clean
- **The xx** — warm blacks, restraint, intimacy
- **A-COLD-WALL*** — brand design language: warm darks, editorial type, cultural weight

---

## 4. Visual Language

### 4.1 Color Palette

**Mandatory: dark theme only.** There is no light mode. Users view this in dim venues. The app installs to a phone home screen — it should look native and intentional, not like a website.

```
Background (deepest)      #0A0A08    Near-black with the faintest warm undertone
Surface (cards, panels)   #141412    One step lighter — warm dark charcoal
Elevated surface          #1E1C19    For modals, bottom sheets, nav bars
Border / divider          #2A2826    Subtle — barely visible
```

```
Fire amber (primary)      #E8651A    The main accent. Warm, saturated orange.
Ember (secondary)         #C4401A    Deeper, used for destructive actions or contrast
Glow (highlight)          #F5942A    Lighter amber — for hover states, active elements
Gold accent               #C9942A    Muted gold — for VIP tier, badge highlights
```

```
Text primary              #F0EDE6    Off-white with warmth — never pure #FFFFFF
Text secondary            #8A8880    Warm gray — for labels, metadata, supporting copy
Text disabled             #4A4844    For inactive states
```

```
Success                   #4CAF6E    Ticket confirmed, check-in successful
Warning                   #E8A21A    Selling fast, limited availability
Error / danger            #E84A1A    Failed payment, sold out
Info                      #4A8AE8    General info states
```

**Using the palette:** The background is almost always `#0A0A08`. Amber (`#E8651A`) is used sparingly — primary CTA buttons, active states, badge highlights, key numbers. The page should be mostly dark with amber as the point of energy. Avoid filling large areas with amber.

### 4.2 Typography

**Two typefaces only.**

**Display / Headlines: Clash Display**
- Use for: event names, hero headings, section titles, ticket tier names, large numerals
- Weight: Semibold (600) for most use, Bold (700) for hero moments only
- Tracking: slightly loose on large sizes (-0.01em to 0em); tighter on small (-0.02em)
- Available at: https://www.fontshare.com/fonts/clash-display

If Clash Display is unavailable: **Syne Bold** or **Cabinet Grotesk Bold** as fallback.

**Body / UI: Inter**
- Use for: body copy, labels, buttons, form fields, navigation, metadata, timestamps
- Weights used: Regular (400), Medium (500)
- No other weights
- Available via Google Fonts

**Type scale:**
```
Display XL      48px / Clash Display 600      Hero event title on landing
Display L       36px / Clash Display 600      Event name on detail page
Heading L       24px / Clash Display 600      Section headings
Heading M       20px / Inter 500              Card titles, tier names
Heading S       16px / Inter 500              Sub-section labels
Body            15px / Inter 400              Paragraph copy, descriptions
Body S          13px / Inter 400              Supporting text, metadata
Caption         11px / Inter 500              Timestamps, badge labels
Mono            13px / Courier / mono         QR ticket numbers, IDs only
```

**Line height:** 1.6 for body copy, 1.2 for display headings, 1.4 for UI labels.

**Letter spacing:** -0.01em on headings 24px+, 0 on body, 0.08em on ALL CAPS labels (use sparingly, only for category labels and status badges).

### 4.3 Spacing and Layout

**Base unit: 4px.** All spacing in multiples of 4.

Common values:
```
4px    Micro gap (icon to label, badge padding)
8px    Tight gap (within a component)
12px   Component internal padding
16px   Standard card padding, between small elements
20px   Between cards in a list
24px   Section internal padding
32px   Between sections
40px   Major section breaks on mobile
```

**Layout:**
- Mobile-first. Design at 390px width (iPhone 14 standard) as the primary canvas.
- Provide desktop at 1280px for the admin panel only. All user-facing screens are mobile-primary.
- Safe area: 16px horizontal margins on mobile. Content never touches screen edges.
- Bottom navigation bar is sticky. Respect iPhone home indicator safe area (34px at bottom).

### 4.4 Corner Radius

```
4px     Small elements (badges, tags, status pills)
8px     Buttons, input fields
12px    Cards, panels, image containers
20px    Bottom sheets, modals (top corners only)
Full    Avatar circles, icon containers (50%)
```

No sharp 0px corners anywhere except intentional full-bleed image elements.

### 4.5 Imagery Direction

**Photography is the most important design element on this platform.**

- Real event photos only. No stock photography. No AI-generated images.
- Dark, atmospheric, candid — people dancing, laughing, in the crowd. Not posed.
- Heavy cropping and close framing preferred over wide shots.
- Images should feel like they were taken at the event, not produced for marketing.
- Amber/warm lighting is preferred — it fits the palette. Cool blue-lit photos should be avoided in hero positions.
- Full-bleed on event hero sections — image goes edge to edge with a dark gradient overlay from bottom for text legibility.
- Aspect ratios: 16:9 for event hero, 1:1 for profile avatars and gallery grid, 4:3 for archive cards.

**When no event photo is available** (before the first event on the new platform): use a solid dark background with a typographic treatment — the event name in large Clash Display, with the date.

### 4.6 Iconography

Use **Phosphor Icons** (regular weight). These are clean, slightly warm in their geometry, and feel right for this aesthetic.
- Icon size: 20px for UI icons, 24px for navigation icons, 16px for inline icons
- Color: always `Text secondary (#8A8880)` unless active/highlighted (then `Fire amber`)
- Never use filled icons in navigation. Regular (outline) only.
- No icon libraries with a "tech startup" feel (Material Icons, Heroicons default style).

### 4.7 Motion and Interaction

Keep motion minimal and intentional. This is a dark, restrained UI.

- Page transitions: fade (150ms, ease-out). No sliding carousels.
- Button press: scale(0.97) on active, 80ms.
- Bottom sheet: slide up from bottom, 300ms, ease-out cubic bezier. Backdrop fades to rgba(0,0,0,0.7).
- Loading states: skeleton screens using `#1E1C19` background with subtle shimmer animation. No spinners.
- Image load: fade in at 200ms. Never pop.
- No bounce animations, no spring physics, no decorative effects.

---

## 5. Screen Inventory

Design the following screens. Each is described with its purpose, key content elements, and specific design notes.

---

### Screen 01 — Home (Upcoming Event Hero)

**Purpose:** First thing a visitor sees. It must communicate the next event immediately and drive to ticket purchase.

**Content:**
- Full-bleed event hero image (top ~55% of screen)
- Dark gradient overlay from ~40% height to bottom
- Event name in Display XL: "HOUSE OF FIRE" in Clash Display
- Event sub-info below name: date, venue name, city — in Body S / Text secondary
- Countdown timer below: "Tickets close in 3d 14h 22m" — in Heading S / amber
- "Get Tickets" primary CTA button — full width, below content
- Status indicator: "Selling Fast — 47 tickets remaining" — warning amber pill
- Below the hero fold: short event description, past event stats (attendance, return rate), and a strip of 4–5 photos from the most recent past event

**Design notes:**
- The hero image must be full-bleed. The gradient starts at about 40% from the top and goes to solid `#0A0A08` at the bottom where the button lives.
- The "HOUSE OF FIRE" logotype treatment on the hero should feel like an album title, not a website header.
- If tickets are sold out: replace "Get Tickets" with a "Join Waitlist" button in a secondary/ghost style. Add "SOLD OUT" in a red pill over the countdown area.

---

### Screen 02 — Event Detail Page

**Purpose:** Full information about a specific upcoming or past event before and after it happens.

**Content (upcoming):**
- Event hero image (full-bleed, same as home but can be taller — ~40% of screen)
- Event name, date, time, venue
- Ticket tier cards (3 tiers: Early Bird / General Admission / VIP) — each as a card with tier name, price, brief perk description, availability indicator
- "Buy Tickets" CTA that anchors to ticket selection
- "What to expect" section: dress code, theme, photo inspiration
- Lineup section: DJs/performers with name and time slot
- Venue map / address block
- FAQ accordion (3–4 common questions)

**Content (past event):**
- Event hero image
- Event name + date in past tense context
- Attendance number + "sold out" badge
- Gallery strip: first 6 attendee photos, "View all [X] photos" link
- Community posts from that event (Phase 2)

**Design notes:**
- Ticket tier cards should clearly communicate hierarchy. Early Bird = muted / greyed out if sold out. GA = default. VIP = gold accent border, gold badge label.
- The ticket cards are the most important interactive element on this screen — make them feel premium and legible.
- Past event pages feel like an archive entry. The photography should carry the emotional weight.

---

### Screen 03 — Ticket Selection + Checkout

**Purpose:** Purchase flow. Must be fast, clear, and confidence-inspiring. Real money changes hands here.

**Flow:** Tier selection → Quantity → Account (log in or continue as guest) → Payment → Confirmation

**Content:**
- Selected event name and date at top (sticky, small)
- Tier name and price — large and clear
- Quantity selector (– / number / +) — minimal, clean
- Subtotal calculation (live update)
- "Continue" CTA — full width, amber
- Account step: "Sign in" or "Create account" or "Continue as guest" — three options, equal visual weight initially; sign-in highlighted if user is recognized
- Payment: Stripe Elements embedded (card, Apple Pay, Google Pay) — Stripe handles the UI here; surround it with the HOF dark theme
- Order summary sidebar-style (on desktop) or collapsed accordion (on mobile) — always visible

**Design notes:**
- This flow must have zero decorative noise. The user is in task mode. No images, no long copy, no distractions.
- Progress indicator at top: 3 steps — Tickets · Account · Payment — shown as minimal dots or a slim progress bar in amber.
- Apple Pay / Google Pay buttons must be prominent on supported devices. These are the fastest path to purchase.
- Error states: inline validation, red text below the relevant field, never a modal.
- Never hide the total cost at any step. It must be visible at all times.

---

### Screen 04 — Ticket Confirmation + QR Code

**Purpose:** Post-purchase. The attendee's ticket. They will show this at the door.

**Content:**
- Success message: "You're in." — brief, warm, conversational
- Event name, date, time, venue — bold
- Ticket tier and quantity
- Large QR code — centered, high contrast (white QR on dark background), minimum 220px × 220px
- Ticket number below QR in monospace
- "Add to Wallet" button (Apple Wallet / Google Pay) — secondary button
- "Download PDF" option
- Share section: "Tell a friend" with copy link / native share

**Design notes:**
- The QR code is the hero of this screen. Everything else is secondary. It must be enormous, clear, and immediately scannable.
- On the day of the event, trigger a contextual banner: "Tonight's the night. Doors open at 9 PM." — in amber, at the top.
- This screen must work offline (PWA service worker caches it after purchase). Design should accommodate offline state gracefully.
- If multiple tickets: show them stacked, swipeable. Each ticket has its own QR.

---

### Screen 05 — Member Profile

**Purpose:** The user's account page. Shows their identity, history, and status within the community.

**Content:**
- Avatar (initial circle if no photo uploaded) — large, top center
- Display name and member since date
- Member tier badge: Regular / VIP / Crew — in amber or gold pill
- Stats strip: Events attended, Photos uploaded, Community posts
- "My Tickets" section: upcoming tickets (with QR shortcut), past tickets as receipt cards
- "Settings" link — account details, notification preferences, log out
- "Upload profile photo" prompt (if no photo)

**Design notes:**
- The tier badge is a status signal — make it feel earned. VIP and Crew badges should have a subtle gold border or shimmer to distinguish them from Regular.
- Attendance count matters to repeat buyers. "12 events attended" is a number people will feel proud of. Display it prominently.
- Past ticket cards should show the event name, date, and tier — styled like physical ticket stubs. Corner tear effect or perforation line aesthetic is optional but could be tasteful if executed cleanly.

---

### Screen 06 — Past Events Archive

**Purpose:** Browse all past House of Fire events chronologically. An archive of the brand's history.

**Content:**
- Title: "The Archive" — editorial, in Clash Display
- Grid of past event cards (most recent first)
- Each card: event hero image, event name, date, attendance number, photo count
- Filter: Year selector (simple, not complex)
- On tap: goes to the past event detail page (Screen 02 variant)

**Design notes:**
- This screen should feel like flipping through a record of something real. The photography is everything.
- Cards at 2-column grid on mobile. Staggered heights acceptable if photos warrant it.
- A short intro line: "Every event. Every month. Since [first date]." — sets the archival tone.

---

### Screen 07 — Event Photo Gallery

**(Phase 2 — design now, build later)**

**Purpose:** Browse all attendee-submitted photos from a specific event. Community-generated content.

**Content:**
- Event name and date header
- Photo count: "214 photos from this night"
- Masonry grid of photos — full width, mixed heights, tight 2px gaps
- Tap a photo: full-screen lightbox, swipe through, see uploader's display name
- "Upload your photos" CTA — sticky at bottom, amber, icon + label

**Design notes:**
- The grid should feel abundant. A full grid of real event photos is the single most compelling thing on this platform.
- Moderation state: photos pending review show as blurred with a "Pending review" label. This should be visible to the uploader only.
- Lightbox: dark overlay, photo centered, swipe left/right, uploader name at bottom, close (X) at top right.

---

### Screen 08 — Community Board

**(Phase 2 — design now, build later)**

**Purpose:** Discussion threads organized by event and a general HOF channel. Includes the ticket resale board.

**Content:**
- Channels list: each past event as a channel + "General HOF" + "🔁 Ticket Exchange"
- Thread view: posts listed chronologically, uploader avatar + name + timestamp + content
- Compose: text input at bottom, pinned — tap to expand with photo attachment option
- Ticket Exchange: structured listing format — "Selling: 1× GA · $20 · Event: Aug 15" — with "Request" button

**Design notes:**
- The Ticket Exchange should feel different from regular posts — use a card format with structured fields rather than free-form text. Prevents confusion and fraud.
- The community board is not a social media feed. No likes, no follower counts, no algorithmic ordering. Chronological only.
- Keep it focused. This is about the event community, not general social networking.

---

### Screen 09 — Admin Panel (Jordan's View)

**Purpose:** Jordan's operational dashboard. Not public-facing. Desktop-primary (Jordan manages events from his laptop).

**Content:**
- Dashboard home: revenue summary, tickets sold (vs. capacity), check-ins today, open support requests
- Events manager: create new event, edit existing, publish/unpublish
- Guest list: filterable by tier, searchable, downloadable CSV, check-in override
- Media moderation: approve / reject pending attendee photo uploads (image shown, approve or reject button)
- Member lookup: search by email, view purchase history
- Announcements: compose and send a push notification to all members or event-specific attendees

**Design notes:**
- The admin panel uses the same dark theme but is more utilitarian. Tables and data grids are acceptable here.
- All destructive actions (delete event, reject photo, remove member) require a confirmation step.
- The check-in interface specifically should be designed for use on a phone at the door — large tap targets, one action per screen, clear green ✓ / red ✗ feedback.

---

## 6. Navigation Architecture

**Bottom navigation bar (mobile — always visible):**

```
[Home]  [Events]  [Community]  [Profile]
```

- Home: the upcoming event hero page
- Events: list/archive of all events (upcoming + past)
- Community: board + gallery (Phase 2; grayed out with "Coming soon" in Phase 1)
- Profile: member account; shows login prompt if not authenticated

**Active state:** amber icon + amber label. Inactive: `Text secondary` icon only (no label until active).

**Top bar (contextual):**
- Present on inner pages only (not home)
- Back arrow (left) + page title (center) + optional action icon (right)
- Transparent on scroll-top, solid `#141412` after 40px scroll

**No hamburger menu. No drawer navigation.** All navigation lives in the bottom bar.

---

## 7. Key Component Specs

### Primary Button
```
Background:     #E8651A (Fire amber)
Text:           #0A0A08 (Near-black — NOT white)
Font:           Inter 500, 15px
Height:         52px
Border-radius:  8px
Width:          Full-width on mobile (calc(100% - 32px))
States:         Hover → #F5942A | Active → scale(0.97) | Disabled → opacity 0.4
```

### Secondary Button (Ghost)
```
Background:     Transparent
Border:         1px solid #2A2826
Text:           #F0EDE6
Font:           Inter 500, 15px
Height:         52px
Border-radius:  8px
States:         Hover → background #1E1C19 | Active → scale(0.97)
```

### Ticket Tier Card
```
Background:     #141412
Border:         1px solid #2A2826
Border-radius:  12px
Padding:        16px
Selected state: Border → 2px solid #E8651A, Background → #1E1C19
VIP state:      Border → 1px solid #C9942A, gold "VIP" badge top-right
```

### Status Badges / Pills
```
Sold Out:       Background #C4401A / Text #F0EDE6
Selling Fast:   Background #E8A21A / Text #0A0A08
Available:      Background #1E2820 / Text #4CAF6E
Coming Soon:    Background #1E1C19 / Text #8A8880
```

### Input Fields
```
Background:     #141412
Border:         1px solid #2A2826
Border-radius:  8px
Height:         48px
Font:           Inter 400, 15px, #F0EDE6
Placeholder:    #4A4844
Focus border:   #E8651A
Error border:   #E84A1A + red helper text below
```

### Member Tier Badge
```
Regular:        Background #1E1C19 / Text #8A8880 / no border
VIP:            Background #1E1C19 / Text #C9942A / border 1px solid #C9942A
Crew:           Background #E8651A / Text #0A0A08
```

---

## 8. Copy and Tone

**Voice:** Warm. Brief. Confident. Not formal. Not hype. Like a message from someone who runs a good event and trusts you to know it's worth showing up for.

**Do:**
- "You're in." (ticket confirmation)
- "See you on the 15th." (email subject)
- "Something happened here." (photo gallery intro)
- "Doors at 9. Don't be late." (day-of banner)
- "Selling fast. 47 left." (availability)

**Don't:**
- "Congratulations on your purchase!"
- "EXPERIENCE THE HEAT OF HOUSE OF FIRE!!!"
- "Welcome to your personalized dashboard"
- "This event is selling quickly — act now!"
- Exclamation marks in general

**Dates:** Always "Saturday, August 15" — not "Sat Aug 15 2026." Spell out the day and month.

**Numbers:** "300 people" not "300+ guests." Real numbers build trust.

**Error messages:** Specific and human. "That card was declined — try another or use Apple Pay." Not "Payment processing error."

---

## 9. Accessibility

- Minimum touch target: 44px × 44px (Apple HIG standard)
- Color contrast: all text on background must meet WCAG AA minimum (4.5:1 for body, 3:1 for large text)
- Note: Fire amber (#E8651A) on near-black (#0A0A08) is approximately 4.6:1 — passes AA for normal text
- All interactive elements must have visible focus states (amber outline, 2px, 2px offset)
- Images must have alt text descriptions in the design spec
- QR codes must have a manual ticket number as a fallback (for when camera fails)

---

## 10. What to Design First

Prioritize in this order:

1. **Home screen** — the entry point, sets the entire visual language
2. **Event detail page** — the most content-rich screen, sets the layout system
3. **Ticket confirmation + QR** — the most operationally critical screen
4. **Checkout flow** — 3-step flow (tier selection → account → payment)
5. **Member profile** — establishes the identity and status system
6. **Past events archive** — establishes the photography-led grid system
7. **Admin dashboard** — Jordan's panel (desktop, lower priority than attendee flows)

---

## 11. Assets to Request from Jordan

Before final designs are completed, obtain the following from Jordan:

- [ ] 10–20 high-quality event photos from past House of Fire events (for use in mockups and eventually in the platform)
- [ ] Any existing House of Fire logo or wordmark (confirm if one exists or if it needs to be created)
- [ ] Preferred event photo used as hero on the home page
- [ ] Confirmation of the first event date to list on the platform
- [ ] Ticket tier names and prices (official)
- [ ] Venue photo or exterior shot of Junkyard Social Club (for the venue section)

---

## 12. Design Deliverables Expected

- Mobile screens (390px) for Screens 01–07 in light annotated frames
- Desktop screens (1280px) for Screen 09 (Admin Panel) only
- Component library sheet: buttons, badges, cards, inputs, navigation in all states
- Type specimen: all type styles at correct sizes on the dark background
- Color swatch sheet with hex values and usage rules
- One annotated user flow: Guest → Buy Ticket → Receive QR (end to end, showing transitions)

---

*This document is the single source of truth for the visual design of houseoffire.events. Any design decision not covered here should default to: dark, warm, restrained, photography-first. When in doubt, remove decoration rather than add it.*

*Questions: sujan@gigabit.agency*
