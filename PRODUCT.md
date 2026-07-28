# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
- **Wholesale Customers (Store/Kiosk Owners)**: Business owners or managers purchasing food, beverage, and grocery stock in bulk. They are busy, multi-tasking, and need to build and place replenishment orders quickly without wasting time on calls or spreadsheet entries.
- **Distributors & Prep Staff**: Staff responsible for reviewing incoming orders, picking and packing items, updating stock counts, and coordinating delivery or pickup.
- **System Administrators**: Management staff managing the overall catalog (products, categories), delivery options, user accounts, and monitoring high-level business reports.

## Product Purpose
VG Mayorista is a web-based wholesale ordering platform designed to simplify B2B commerce for grocery and food stores. It eliminates manual coordination (phone calls, handwritten sheets, spreadsheets) by providing a real-time web portal where clients can place accurate orders and track preparation in real time. Success means zero order processing errors, faster order turnaround times, and higher customer satisfaction.

## Positioning
Direct, transparent stock availability and real-time packing status. While traditional distributors require clients to order blindly and find out about shortages at delivery, VG Mayorista displays real-time inventory and lets customers track their order packing status step-by-step.

## Operating Context
- Busy retail store back-offices or warehouse packing floors.
- Accessed on a mix of devices: desktop PCs (for catalog management/admin work) and mobile devices/tablets (for client ordering on the go or prep staff picking stock).
- High need for high-contrast, easily scanable components that load fast even on cellular data.

## Capabilities and Constraints
- **Technical Stack**: Angular 22 frontend, Bootstrap 5.3.8 styling library, Java Spring Boot backend.
- **Authentication**: Role-based access control supporting Client (`ROLE_CUSTOMER`), Distributor (`ROLE_DISTRIBUTOR`), and Admin (`ROLE_ADMIN`).
- **Client Features**: Real-time product catalog, searchable categories, simple cart management, checkout with delivery selection, and order status monitoring.
- **Distributor Features**: Dashboard of pending orders, order detail view with status transitions (pack/ship/complete), stock management, and category administration.
- **Admin Features**: Stock, category, delivery method, user database administration, and basic analytics dashboards.

## Brand Commitments
- **Name**: VG Mayorista
- **Logo**: Brand logo at [vglogo.jpeg](file:///d:/programacion/distribuidora-ui/public/vglogo.jpeg)
- **Palette**: Clean, energetic colors matching the logo:
  - Green (Primary / Olive Green: `#619B1C` or HSL `87, 69%, 36%`)
  - Orange (Secondary / Energetic Orange: `#FF7300` or HSL `27, 100%, 50%`)
  - Charcoal (Neutral dark / Text: `#2D312E` or HSL `135, 5%, 18%`)

## Evidence on Hand
- Implemented Angular routing hierarchy in [app.routes.ts](file:///d:/programacion/distribuidora-ui/src/app/app.routes.ts) representing user access controls.
- Brand logo file located at [public/vglogo.jpeg](file:///d:/programacion/distribuidora-ui/public/vglogo.jpeg).

## Product Principles
- **Efficiency First**: Catalog search, filtering, and bulk quantity additions must require minimal clicks.
- **Absolute Status Clarity**: Never leave a user guessing; order packing and delivery stages must be transparently communicated.
- **Functional Aesthetics**: Leverage Bootstrap cleanly but elevate it with custom brand typography and accents to look professional and premium rather than generic.

## Accessibility & Inclusion
- Clear typography hierarchy and large touch targets for store owners placing orders from mobile screens while working their retail floors.
