# mahall-dev
1.	INTRODUCTION
This Business Requirements Document (BRD) defines the requirements, objectives, and scope for the Subscription-Based Web Application for the Events Industry contributors' databases. It provides a clear reference for all stakeholders and project teams, ensuring a common understanding of the system’s functionality, constraints, and success criteria.
The document serves to:
	Capture and communicate business and functional requirements.
	Establish the project scope and boundaries.
	Guide the design, development, and implementation of the solution.
	Facilitate stakeholder alignment and informed decision-making.

2.	PROJECT OVERVIEW AND BUSINESS CONTEXT
InVia Technologies is a modern IT services provider specializing in seamless digital transformations. Leveraging a team of skilled professionals, we deliver end-to-end solutions in IT infrastructure, cloud migration, enterprise security, technology consulting, managed services, and application development.
The proposed web application will provide subscription-based access to event management service databases, enabling event freelancers, suppliers, organizers and vendors to publish their services and areas of expertise and interact efficiently. By aligning with InVia Technologies’ focus on innovation, scalability, and security, this solution aims to support everyone in the events industry to streamline operations, enhance user experience, and achieve measurable business outcomes.
The events industry increasingly relies on digital platforms for managing services and stakeholder interactions. Event professionals require a centralized, secure platform to showcase their offerings, connect with respective points of contact through this database, and manage operations efficiently. Recognizing this business need, the client approached InVia Technologies to design and build a subscription-based solution tailored to the events ecosystem.
3.	BUSINESS OBJECTIVES
The primary objectives of the Application are to:

	Create a centralized digital platform for event service providers and seekers, consolidating all relevant information in one accessible location.
	Enable easy access to detailed profiles and contact points for freelancers, vendors, suppliers, and organizers, facilitating seamless communication and networking.
	Implement subscription-based access, including trial options and integrated payment gateways, to provide flexible access models for different user types.
	Ensure structured and searchable data, allowing users to filter by area of expertise, region, and contact details for efficient discovery.
	Build a scalable and robust application infrastructure capable of supporting future growth in user base, feature set, and overall platform functionality.
	Provide a secure platform, ensuring that sensitive user data, payment information, and interactions are protected against unauthorized access and breaches.
	Deliver an intuitive and user-friendly interface, enabling all users—including freelancers, vendors, and organizers—to navigate, search, and interact with the platform efficiently.

These objectives ensure the platform delivers measurable business value, a superior user experience, and long-term scalability while addressing the needs of all stakeholders in the events industry.

4.	SCOPE
In-Scope:

The following features and functionalities are included in the initial release of the Subscription-Based Web Application for the Events Industry:

	User Registration: Enable freelancers and suppliers to create accounts.
	Subscription Flows: Support trial and paid subscriptions with integrated payment gateways.
	Admin Dashboard: Provide moderation and management capabilities for administrators.
	User Profiles: Allow creation of detailed profiles including areas of expertise and full contact information.
	Searchable Database: Implement a structured, searchable database with filters for location, category, and expertise.
	Security: Ensure secure login, authentication, and protection of user data.
	Scalable Architecture: Build a robust backend capable of supporting future growth in user base and functionality.

Out-of-Scope:

The following items are not included in the initial release (Phase 1) of the application:

	Native Mobile Application: The first release focuses solely on the web platform.
	On-Site Event Management Tools: Features such as ticketing, scheduling, and on-site logistics are excluded.
	Social Media Features: Messaging, chat, or other social engagement functionalities are not included in Phase1.
	Third-Party Integrations Beyond Payment Gateways: Any integration with external CRMs, analytics platforms, or event tools except approved payment gateways is excluded.
	Advanced Analytics/Reporting Dashboards: Only basic subscription and user reporting will be available.
	Marketing Automation Features: Email campaigns, push notifications, or promotional workflows are not part of this release.
	Multi-Language or Localization Support: Initial release will support only one language/region.
	Custom Branding for Individual Users: Organizers or vendors will use a standardized interface.
	Offline Capabilities: The application requires internet connectivity; offline access is not supported.
	Public API for External Developers: API access is not included in Phase 1.

5.	ASSUMPTIONS AND CONSTRAINTS
Assumptions:

	Valid User Information: Users (freelancers, vendors, suppliers, and organizers) will provide accurate and complete business and contact information during registration.
	Payment Gateway Compliance: Payment gateway integration will adhere to regional compliance requirements for UAE and Saudi Arabia.
	Web Platform Focus: The initial launch will target web browsers with a responsive design suitable for desktop, tablet, and mobile screens.
	Internet Connectivity: Users will have access to a stable internet connection to use the application.
	Standardized User Interface: Users will interact with a standardized platform interface; customization options are not included in Phase 1.
	Stakeholder Availability: Project stakeholders will provide timely feedback and approvals to support the development schedule.

Constraints:

	Budgetary Limits: Infrastructure, third-party tools, and payment processing will be planned and implemented within the approved project budget. Final budget allocation is subject to approval and may influence the scope, choice of tools, or infrastructure options.
	Legal & Data Privacy Compliance: The application must comply with UAE and Saudi legal and data privacy regulations.
	Multilingual Support: Phase 1 support only a single language; multilingual functionality is optional.
	Feature Limitations: Certain advanced features (e.g., mobile app, social media interactions, advanced analytics) are excluded in Phase 1.
	Technology Stack: Development must be compatible with selected technology stack and hosting environment, which may limit integration with some external services.
	Scalability Boundaries: While the backend will be designed to scale, extremely high traffic spikes or large-scale data imports may require additional infrastructure.





6.	CLIENT REQUIREMENTS SUMMARY (FROM QUESTIONNAIRE)
This section summarizes the agreed business requirements from earlier discussions, along with the proposed database flow and data structures prepared by the development team.

User Roles & Access
	Categories: Freelancers, Vendors, Agencies, Governments and Partners (future).
	One role per user (e.g., vendor OR freelancer).
	Role-based access: Freelancers limited, Vendors/Agencies extended features.
	Freelancers can mark availability (calendar integration).

Subscription & Payments
	UAE-compliant payment gateway.
	Auto-renewal with notifications and consent.
	Monthly and annual subscription options.
	Invoices/receipts auto emailed.
	Trial plans with limited access.

Search & Filters
	Filters: Category, Location (UAE & Saudi, with states like Dubai, Abu Dhabi, Sharjah).
	Advanced search: Multi-category, combined filters.
	Restricted to subscribers, demo search for public.

User Dashboard
	Basic analytics: profile views, leads generated.
	Export subscription/payment history (PDF/email).
	Subscription status/expiry reminders.

Admin Dashboard
	Auto-approval with validation checks.
	Revenue dashboard.
	Multi-admin roles: Super Admin, Finance Admin, Support Admin.
	Admins can edit/update profiles.

Security & Compliance
	Verification documents required (trade license, registration details).
	Two-factor authentication (TOTP).
	UAE data residency with encryption preferred.
Deployment & Hosting
	Scalable hosting – Amazon Web Services
	Separate staging and production environments (if cost permits).

Support Services
	Messaging gateway setup (OTP via email).
	Payment gateway compliance support.
	Ongoing support & SLA, with subscriber support portal.


7.	EVENT CATEGORIES AND PROFILE ROLES
Freelancer Categories and Roles:
Parent Categories	Role
01. Technical & Production	Sound Engineer, Audio Technician / Operator, Lighting Designer, Lighting Technician / Operator, Video Technician (Projection, LED, Camera Ops), Live Streaming Operator, Stage Manager, Show Caller, Drone Camera Operator, Rigging Specialist, Event IT / Networking Technician, Power / Electrical Engineer
02. Creative & Design	Set Designer / Scenic Artist, Art Director / Creative Director, Graphic Designer (Branding, Event Visuals), Content Producer, 3D Event Environment Designer, Motion, Graphics Designer, Event Scriptwriter / Content Writer, Event Photographer / Videographer, Social Media Content Creator (Event Coverage), Visual Artist / VJ / Muralist for Events, Experiential Technology Specialist (AR/VR Installations), Costume Designer, Floral Designer
03. Program & Content Delivery	MC / Emcee / Presenter / Keynote Speaker, Moderator (Panels, Conferences), Voice-over Artist (Event Intros, Promos), Multilingual Translator, Influencer / Public Figure
04. Operations & Support	Event Manager (Project-based), Project Manager, Project Coordinator, Production Manager, Site Manager, Backstage Crew / Stagehands, Logistics Coordinator, Event Driver (Equipment Handling), Equipment Loader / Unloader
05. Security, Safety & Compliance	Event Safety Consultant, Security Staff / Bouncer, First Aid / Medical Staff, Fire Safety Officer, Crowd Control Manager
06. Hospitality & Guest Experience	VIP Concierge, Bartenders / Catering Staff, Brand Ambassadors / Promoters, Ushers, Host / Hostess, Ticketing / Registration Staff, Tour Guide


Vendors Categories and Roles:
Parent Categories	Child Categories	Roles
1. Core Infrastructure & Technical Suppliers	Audio-Visual & Lighting (AVL) Companies	Sound systems (line arrays, wireless mics, mixers, in-ear monitors), Video systems (LED walls, projection mapping, holograms, video servers), Lighting (intelligent fixtures, lasers, wash lights, follow spots), Broadcast solutions (multi-camera control, live streaming desks), Flight Case producers, Games Rental
	Stage & Exhibition Contractors	Custom stages & modular risers, Exhibition stands (modular, pavilion, country pavilions, double deck), Trussing & rigging solutions, Catwalks, runways, platforms
	Temporary Structures Providers	Tents (AC tents, geodesic domes, clear span, pagodas), Inflatable structures & portable pavilions, Mobile stages & trailers
	Furniture Rental Companies	Banquet & lounge seating, VIP zones & luxury setups, Functional rentals (conference tables, cocktail tables, stools), Decorative elements (chandeliers, carpets, custom props)
	Catering Equipment Suppliers	Buffet counters, display stations, Mobile kitchens & bar setups, Food Trucks, Refrigeration, chillers, and food transport logistics
	Floral & Décor Vendors	Fresh & artificial floral designs, Themed décor (Arabian Nights, futuristic, Moroccan, seasonal), Centrepieces, vases, props
	Print & Branding Providers	Large-format digital & eco-printing, Vinyl graphics, stage branding, signage, 3D-printed elements & props
2. Event Technology Providers

	Registration & Access Solutions
	Online registration, ticketing, QR check-in, RFID/NFC wristbands & access control
	Engagement & Experience Tech	Audience interaction apps (live polls, AR gamification), Immersive AR/VR activations, Event matchmaking platforms
	Streaming & Hybrid Platforms	Virtual/hybrid event SaaS (Hopin, Airmeet, On24), Live multi-camera streaming & broadcast teams
	Data & Payment Solutions	Cashless payment systems, Real-time data analytics & attendee behavior tracking
3. Service Vendors (People & Experiences)	Catering & F&B Vendors	Luxury catering, fine dining, Street food trucks, pop-ups, live cooking, Specialty cuisine vendors (ethnic, halal, vegan, fusion), Mobile bars, mixologists, barista services
	Artist Booking Agencies  	
	Photo & Video Services	Corporate & exhibition photography, Drone & 360° video coverage, Same-day edits & highlight reel
	Staffing Agencies	Ushers, hostesses, registration staff, VIP concierge, protocol staff, Security, crowd control, backstage crew
4. Logistics & Support Services	Transport & Logistics	Heavy equipment movers (trucks, cranes, forklifts), Crew transport, shuttle buses, chauffeur-driven cars, international exhibition freight forwarders
	Hospitality Services	Hotel & venue partnerships, VIP accommodation, villa rentals
	Cleaning & Waste Management	On-site janitorial teams, Eco-friendly waste management, Sanitation & disinfection services
	Compliance & Risk Management	Event liability insurance providers, HSE consultants (health, safety, fire), Risk assessments & permits
5. Creative & Scenic Production	Event Design Studios	3D set design, CAD visuals, Projection mapping & scenic design
	Prop & Theme Specialists	Arabian, oriental, futuristic props, Bespoke fabrications for launches/exhibitions, Seasonal or holiday-themed builds
	Branding & Merchandise Vendors	Custom promotional products, Sustainable event giveaways, Luxury gifts for VIPs
6. Venues & Destination Partners	Venues	Convention & exhibition centres, Hotels with MICE facilities, Outdoor cultural sites (museums, heritage, theatres)
	Destination Management Companies (DMCs)	Corporate travel, incentive programs, Cultural and heritage tourism integration, Excursions, gala dinners, desert experiences (GCC specific)

Agency Categories and Roles:
Parent Categories	Role
1. Event Management Companies	Full-service agencies managing end-to-end event planning; handle logistics, scheduling, budgeting, supplier coordination. Example: corporate events, exhibitions, gala dinners
2. Creative Agencies	Develop event themes, stage/set designs, graphic assets, and branding; provide ideation + creative direction for immersive experiences, often partner with production companies for execution
3. Advertising Agencies	Create campaigns to promote events (before, during, after), manage paid media, ad placements, outdoor visibility, and digital campaigns, ensure maximum brand exposure around events
4. MICE Agencies (Meetings, Incentives, Conferences, Exhibitions)	Specialize in B2B events and corporate gatherings, handle incentive travel, trade exhibitions, and large-scale conferences, Strong focus on ROI and attendee engagement
5. PR Agencies	Manage media relations, press conferences, influencer engagement, Crisis communication, and reputation management during events; support visibility through earned media coverage
6. Media Production Companies	Provide photography, videography, live streaming, drone filming, deliver same-day edits, highlight reels, event documentaries, Essential for post-event marketing content
7. Marketing & Digital Agencies	Manage social media campaigns, SEO, performance marketing, influencer activations, provide event performance analytics (impressions, engagement, conversions), Help brands maximize digital exposure of their events
8. Festival & Large-Scale Event Organizers	Specialize in concerts, music festivals, citywide celebrations, and cultural events, manage ticketing, sponsorship, crowd control, security, and logistics, Require large freelancer pools (AV crew, stagehands, performers)
9. Wedding & Private Event Planners	Organize luxury weddings, private parties, family celebrations, manage decor, entertainment, venue, catering, and guest services, often hire florists, stylists, photographers, and themed set designers
10. Hospitality & Venue Management Companies	Hotels, resorts, and convention centres offering venues + in-house event services, provide catering, accommodation, guest concierge, transportation, Key partners for corporate and social events
11. Experiential Agencies	Focus on immersive brand activations and interactive experiences, deliver sensory storytelling (AR/VR, gamification, installations), Often collaborate with creative studios and AV suppliers
12. Team building & Corporate Training Companies	Organize staff workshops, retreats, and development programs, blend learning, leadership training, and entertainment, Hire facilitators, coaches, and activity suppliers
13. Kids’ Party Planners & Family Event Agencies	Manage children’s entertainment, birthdays, family festivals, focus on safety, themed decor, and interactive programming, Require performers, animators, props, and family-friendly venues

