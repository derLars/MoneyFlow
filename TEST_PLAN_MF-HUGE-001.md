# MoneyFlow Huge User Test Plan
**Test Plan ID:** MF-HUGE-001
**Version:** 2.0
**Date Created:** 2026-05-09
**Status:** Ready for Execution
**Focus:** Manual entry expense tracking (no OCR)

---

## 1. Test Objectives

1. Create 50 test users with proper distribution across projects
2. Each user must participate in **at least 3 projects**
3. User overlap between projects must be well-distributed (avoid cliques)
4. Create 30+ purchases with 1-15 items covering typical European spending scenarios
5. Record payments and verify balance calculations remain correct
6. Perform 10+ user deletions (admin and self-deletion) spread over testing period
7. Verify MoneyFlow algorithm produces correct settlement paths
8. Identify and document any anomalies

---

## 2. Test Environment

| Parameter | Value |
|-----------|-------|
| **Server URL** | `http://192.168.1.109:5173` |
| **API URL** | `http://192.168.1.109:8002/api` |
| **Admin Credentials** | `admin` / `adminpassword` |
| **Database** | PostgreSQL |

---

## 3. User List (50 Users)

| Test ID | Username | User DB ID | Project Assignments (by name) |
|---------|----------|------------|------------------------------|
| TU-001 | testuser_001 | 2 | Summer Road Trip 2025, Shared Apartment Q3, Weekend Golf Club |
| TU-002 | testuser_002 | 3 | Summer Road Trip 2025, Household Repairs, Office Lunch Pool |
| TU-003 | testuser_003 | 4 | Shared Apartment Q3, Birthday Party Fund, Office Lunch Pool |
| TU-004 | testuser_004 | 5 | Weekend Golf Club, Household Repairs, Office Lunch Pool |
| TU-005 | testuser_005 | 6 | Summer Road Trip 2025, Birthday Party Fund, Camping Adventure |
| TU-006 | testuser_006 | 7 | Household Repairs, Car Maintenance Fund, Grocery Shopping Club |
| TU-007 | testuser_007 | 8 | Weekend Golf Club, Game Night Series, Camping Adventure |
| TU-008 | testuser_008 | 9 | Office Lunch Pool, Holiday Gift Exchange, Car Maintenance Fund |
| TU-009 | testuser_009 | 10 | Household Repairs, Game Night Series, Sports League Fees |
| TU-010 | testuser_010 | 11 | Birthday Party Fund, Holiday Gift Exchange, Concert Tickets Group |
| TU-011 | testuser_011 | 12 | Car Maintenance Fund, Sports League Fees, Grocery Shopping Club |
| TU-012 | testuser_012 | 13 | Concert Tickets Group, Book Club Meetups, Camping Adventure |
| TU-013 | testuser_013 | 14 | Sports League Fees, Renovation Project, Pharmacy Pool |
| TU-014 | testuser_014 | 15 | Holiday Gift Exchange, Pet Care Expenses, Book Club Meetups |
| TU-015 | testuser_015 | 16 | Concert Tickets Group, Pet Care Expenses, Utilities Split |
| TU-016 | testuser_016 | 17 | Sports League Fees, Pharmacy Pool, Internet & Phone |
| TU-017 | testuser_017 | 18 | Concert Tickets Group, Pet Care Expenses, Vacation Home Rental |
| TU-018 | testuser_018 | 19 | Pharmacy Pool, Book Club Meetups, Music Festival Trip |
| TU-019 | testuser_019 | 20 | Pet Care Expenses, Utilities Split, Music Festival Trip |
| TU-020 | testuser_020 | 21 | Book Club Meetups, Gym Membership Split, Vacation Home Rental |
| TU-021 | testuser_021 | 22 | Utilities Split, Gym Membership Split, Internet & Phone |
| TU-022 | testuser_022 | 23 | Gym Membership Split, Wedding Planning Fund, Internet & Phone |
| TU-023 | testuser_023 | 24 | Wedding Planning Fund, Airport Parking Pool, Snow Removal Service |
| TU-024 | testuser_024 | 25 | Gym Membership Split, Snow Removal Service, Vacation Home Rental |
| TU-025 | testuser_025 | 26 | Snow Removal Service, Wedding Planning Fund, DIY Workshop Supplies |
| TU-026 | testuser_026 | 27 | Summer Road Trip 2025, New Year Party, DIY Workshop Supplies |
| TU-027 | testuser_027 | 28 | New Year Party, Pizza Friday Fund, Shared Apartment Q3 |
| TU-028 | testuser_028 | 29 | New Year Party, Weekend Golf Club, Summer Road Trip 2025 |
| TU-029 | testuser_029 | 30 | Pizza Friday Fund, Shared Apartment Q3, Airport Parking Pool |
| TU-030 | testuser_030 | 31 | Snow Removal Service, Weekend Golf Club, Household Repairs |
| TU-031 | testuser_031 | 32 | Birthday Party Fund, Office Lunch Pool, Snow Removal Service |
| TU-032 | testuser_032 | 33 | New Year Party, Household Repairs, Grocery Shopping Club |
| TU-033 | testuser_033 | 34 | Summer Road Trip 2025, Shared Apartment Q3, Weekend Golf Club |
| TU-034 | testuser_034 | 35 | Office Lunch Pool, Weekend Golf Club, Shared Apartment Q3 |
| TU-035 | testuser_035 | 36 | Birthday Party Fund, Car Maintenance Fund, Game Night Series |
| TU-036 | testuser_036 | 37 | Office Lunch Pool, Holiday Gift Exchange, Game Night Series |
| TU-037 | testuser_037 | 38 | Grocery Shopping Club, Holiday Gift Exchange, Car Maintenance Fund |
| TU-038 | testuser_038 | 39 | Sports League Fees, Holiday Gift Exchange, Birthday Party Fund |
| TU-039 | testuser_039 | 40 | Concert Tickets Group, Holiday Gift Exchange, Game Night Series |
| TU-040 | testuser_040 | 41 | Concert Tickets Group, Game Night Series, Car Maintenance Fund |
| TU-041 | testuser_041 | 42 | Sports League Fees, Book Club Meetups, Gym Membership Split |
| TU-042 | testuser_042 | 43 | Concert Tickets Group, Book Club Meetups, Pharmacy Pool |
| TU-043 | testuser_043 | 44 | Pet Care Expenses, Book Club Meetups, Renovation Project |
| TU-044 | testuser_044 | 45 | Pharmacy Pool, Utilities Split, Book Club Meetups |
| TU-045 | testuser_045 | 46 | Pet Care Expenses, Pharmacy Pool, Internet & Phone |
| TU-046 | testuser_046 | 47 | Pet Care Expenses, Utilities Split, Vacation Home Rental |
| TU-047 | testuser_047 | 48 | Pharmacy Pool, Music Festival Trip, Gym Membership Split |
| TU-048 | testuser_048 | 49 | Gym Membership Split, Internet & Phone, Pet Care Expenses |
| TU-049 | testuser_049 | 50 | Pizza Friday Fund, Vacation Home Rental, Pet Care Expenses |
| TU-050 | testuser_050 | 51 | Airport Parking Pool, Music Festival Trip, Utilities Split |

---

## 4. Project List (28 Projects)

| Project ID | Name | DB ID | Members (usernames) |
|------------|------|-------|---------------------|
| PG-001 | Summer Road Trip 2025 | ? | testuser_001, testuser_002, testuser_005, testuser_026, testuser_028, testuser_033 |
| PG-002 | Shared Apartment Q3 | ? | testuser_001, testuser_003, testuser_027, testuser_029, testuser_033, testuser_034 |
| PG-003 | Weekend Golf Club | ? | testuser_001, testuser_004, testuser_007, testuser_028, testuser_030, testuser_033, testuser_034 |
| PG-004 | Office Lunch Pool | ? | testuser_002, testuser_003, testuser_004, testuser_031, testuser_032, testuser_034 |
| PG-005 | Household Repairs | ? | testuser_002, testuser_004, testuser_006, testuser_030, testuser_032 |
| PG-006 | Birthday Party Fund | ? | testuser_003, testuser_005, testuser_010, testuser_031, testuser_035, testuser_038 |
| PG-007 | Grocery Shopping Club | ? | testuser_006, testuser_011, testuser_032, testuser_037 |
| PG-008 | Camping Adventure | ? | testuser_005, testuser_007, testuser_012, testuser_030 |
| PG-009 | Car Maintenance Fund | ? | testuser_006, testuser_008, testuser_035, testuser_037, testuser_040 |
| PG-010 | Game Night Series | ? | testuser_007, testuser_009, testuser_035, testuser_036, testuser_039, testuser_040 |
| PG-011 | Holiday Gift Exchange | ? | testuser_008, testuser_010, testuser_036, testuser_037, testuser_038, testuser_039 |
| PG-012 | Sports League Fees | ? | testuser_009, testuser_011, testuser_013, testuser_016, testuser_038, testuser_041 |
| PG-013 | Concert Tickets Group | ? | testuser_010, testuser_012, testuser_015, testuser_017, testuser_039, testuser_040, testuser_042 |
| PG-014 | Renovation Project | ? | testuser_013, testuser_043 |
| PG-015 | Book Club Meetups | ? | testuser_012, testuser_014, testuser_018, testuser_020, testuser_041, testuser_042, testuser_044 |
| PG-016 | Pharmacy Pool | ? | testuser_013, testuser_016, testuser_018, testuser_042, testuser_044, testuser_045, testuser_047 |
| PG-017 | Pet Care Expenses | ? | testuser_014, testuser_015, testuser_017, testuser_019, testuser_043, testuser_045, testuser_046, testuser_048, testuser_049 |
| PG-018 | Utilities Split | ? | testuser_015, testuser_019, testuser_021, testuser_044, testuser_046, testuser_048, testuser_050 |
| PG-019 | Internet & Phone | ? | testuser_016, testuser_021, testuser_022, testuser_045, testuser_048 |
| PG-020 | Vacation Home Rental | ? | testuser_017, testuser_020, testuser_024, testuser_046, testuser_049, testuser_050 |
| PG-021 | Music Festival Trip | ? | testuser_018, testuser_019, testuser_047, testuser_050 |
| PG-022 | Gym Membership Split | ? | testuser_020, testuser_021, testuser_022, testuser_041, testuser_047, testuser_048 |
| PG-023 | Pizza Friday Fund | ? | testuser_027, testuser_029, testuser_049 |
| PG-024 | Airport Parking Pool | ? | testuser_023, testuser_029, testuser_050 |
| PG-025 | Wedding Planning Fund | ? | testuser_022, testuser_023, testuser_025 |
| PG-026 | DIY Workshop Supplies | ? | testuser_025, testuser_026 |
| PG-027 | Snow Removal Service | ? | testuser_023, testuser_024, testuser_025, testuser_030, testuser_031 |
| PG-028 | New Year Party | ? | testuser_026, testuser_027, testuser_028 |

---

## 5. Purchase Definitions (Aligned with Actual Project Participants)
## Item Master List

| Item ID | Original Name | Friendly Name | Category 1 | Category 2 | Category 3 | Default Price |
|---------|--------------|---------------|------------|------------|------------|---------------|
| Item_0001 | Bread | Bread | Food | Groceries | Bakery | €2.49 |
| Item_0002 | Cheese | Cheese | Food | Groceries | Dairy | €8.99 |
| Item_0003 | Wine | Wine | Food | Groceries | Beverages | €14.50 |
| Item_0004 | Vegetables | Fresh Vegetables | Food | Groceries | Produce | €12.30 |
| Item_0005 | Meat | Meat | Food | Groceries | Butcher | €24.80 |
| Item_0006 | Coffee | Coffee | Food | Groceries | Beverages | €9.99 |
| Item_0007 | Water | Water (6-pack) | Food | Groceries | Beverages | €4.50 |
| Item_0008 | Snacks | Snacks | Food | Groceries | Snacks | €15.00 |
| Item_0009 | Detergent | Laundry Detergent | Home | Cleaning | Laundry | €7.99 |
| Item_0010 | All-purpose cleaner | All-purpose Cleaner | Home | Cleaning | Household | €4.49 |
| Item_0011 | Sponges | Sponges (3-pack) | Home | Cleaning | Kitchen | €3.99 |
| Item_0012 | Trash bags | Trash Bags | Home | Cleaning | Household | €9.99 |
| Item_0013 | Air freshener | Air Freshener | Home | Cleaning | Household | €5.99 |
| Item_0014 | Green fees | Green Fees | Entertainment | Golf | Fees | €60.00 |
| Item_0015 | Cart rental | Golf Cart Rental | Entertainment | Golf | Equipment | €75.00 |
| Item_0016 | Range balls | Range Balls | Entertainment | Golf | Practice | €15.00 |
| Item_0017 | Gloves | Golf Gloves (5 pairs) | Entertainment | Golf | Equipment | €25.00 |
| Item_0018 | Sandwiches | Sandwiches (15) | Food | Catering | Lunch | €45.00 |
| Item_0019 | Salads | Salad Platter | Food | Catering | Lunch | €35.00 |
| Item_0020 | Fruit platter | Fruit Platter | Food | Catering | Lunch | €22.00 |
| Item_0021 | Drinks | Drinks (10) | Food | Catering | Beverages | €15.00 |
| Item_0022 | Paint | Paint | Home | Repairs | Materials | €45.00 |
| Item_0023 | Brushes | Paint Brushes | Home | Repairs | Tools | €12.50 |
| Item_0024 | Screws | Screws | Home | Repairs | Hardware | €18.99 |
| Item_0025 | Tape | Masking Tape | Home | Repairs | Tools | €5.00 |
| Item_0026 | Sealant | Sealant | Home | Repairs | Materials | €16.00 |
| Item_0027 | Birthday cake | Birthday Cake | Food | Celebrations | Bakery | €55.00 |
| Item_0028 | Balloons | Balloons | Entertainment | Celebrations | Decorations | €18.99 |
| Item_0029 | Streamers | Streamers | Entertainment | Celebrations | Decorations | €16.00 |
| Item_0030 | Party hats | Party Hats | Entertainment | Celebrations | Decorations | €12.00 |
| Item_0031 | Concert tickets | Concert Tickets (6) | Entertainment | Events | Tickets | €60.00 |
| Item_0032 | Service fee | Service Fee | Entertainment | Events | Fees | €54.00 |
| Item_0033 | Booking fee | Booking Fee | Entertainment | Events | Fees | €30.00 |
| Item_0034 | USB charger | USB Charger | Electronics | Accessories | Chargers | €6.00 |
| Item_0035 | Chips | Chips | Food | Snacks | Savory | €8.00 |
| Item_0036 | Dips | Dips | Food | Snacks | Savory | €6.50 |
| Item_0037 | Beer | Beer (8) | Food | Beverages | Alcohol | €24.00 |
| Item_0038 | Soda | Soda (6) | Food | Beverages | Non-alcohol | €9.00 |
| Item_0039 | Pizza | Pizza (3) | Food | Catering | Dinner | €45.00 |
| Item_0040 | Dessert | Dessert | Food | Catering | Sweet | €22.50 |
| Item_0041 | Gift vouchers | Gift Vouchers (6) | Shopping | Gifts | Vouchers | €20.00 |
| Item_0042 | Wrapping paper | Wrapping Paper | Shopping | Gifts | Wrapping | €15.00 |
| Item_0043 | Gift bags | Gift Bags | Shopping | Gifts | Wrapping | €12.00 |
| Item_0044 | Ribbons | Ribbons | Shopping | Gifts | Wrapping | €8.00 |
| Item_0045 | Registration fee | Registration Fee | Sports | League | Fees | €150.00 |
| Item_0046 | Jerseys | Jerseys | Sports | Equipment | Apparel | €60.00 |
| Item_0047 | Shin guards | Shin Guards | Sports | Equipment | Protective | €20.00 |
| Item_0048 | Socks | Sports Socks | Sports | Equipment | Apparel | €15.00 |
| Item_0049 | Coffee | Coffee | Food | Café | Beverages | €20.00 |
| Item_0050 | Tea | Tea | Food | Café | Beverages | €7.50 |
| Item_0051 | Croissants | Croissants | Food | Café | Bakery | €12.00 |
| Item_0052 | Cookies | Cookies | Food | Café | Bakery | €8.00 |
| Item_0053 | Sandwiches | Sandwiches | Food | Café | Lunch | €15.00 |
| Item_0054 | Camping fee | Camping Fee | Travel | Accommodation | Outdoor | €80.00 |
| Item_0055 | Shuttle bus | Shuttle Bus | Travel | Transport | Shuttle | €40.00 |
| Item_0056 | Vaccination | Vaccination (2) | Health | Veterinary | Pets | €65.00 |
| Item_0057 | Health check | Health Check | Health | Veterinary | Pets | €45.00 |
| Item_0058 | Deworming | Deworming | Health | Veterinary | Pets | €22.50 |
| Item_0059 | Microchip | Microchip | Health | Veterinary | Pets | €55.00 |
| Item_0060 | Aspirin | Aspirin | Health | Pharmacy | Medication | €8.99 |
| Item_0061 | Ibuprofen | Ibuprofen | Health | Pharmacy | Medication | €12.49 |
| Item_0062 | Vitamins | Vitamins | Health | Pharmacy | Supplements | €24.99 |
| Item_0063 | Band-aids | Band-aids | Health | Pharmacy | First aid | €5.49 |
| Item_0064 | Hand sanitizer | Hand Sanitizer | Health | Pharmacy | Hygiene | €4.99 |
| Item_0065 | Annual membership | Annual Membership (6) | Health | Gym | Membership | €150.00 |
| Item_0066 | Joining fee | Joining Fee | Health | Gym | Membership | €60.00 |
| Item_0067 | Monthly internet | Monthly Internet | Utilities | Internet | Monthly | €89.95 |
| Item_0068 | Router rental | Router Rental | Utilities | Internet | Equipment | €25.00 |
| Item_0069 | Electricity | Electricity | Utilities | Energy | Monthly | €85.00 |
| Item_0070 | Gas | Gas | Utilities | Energy | Monthly | €45.50 |
| Item_0071 | Water | Water | Utilities | Energy | Monthly | €22.45 |
| Item_0072 | Internet | Internet | Utilities | Energy | Monthly | €29.99 |
| Item_0073 | Tiles | Tiles | Home | Renovation | Materials | €350.00 |
| Item_0074 | Adhesive | Tile Adhesive | Home | Renovation | Materials | €45.00 |
| Item_0075 | Grout | Grout | Home | Renovation | Materials | €28.50 |
| Item_0076 | Primer | Primer | Home | Renovation | Materials | €35.00 |
| Item_0078 | Oil change | Oil Change | Transport | Car | Maintenance | €89.00 |
| Item_0079 | Tire rotation | Tire Rotation | Transport | Car | Maintenance | €45.00 |
| Item_0080 | Car wash | Car Wash | Transport | Car | Cleaning | €25.00 |
| Item_0081 | Parking | Parking (3 days) | Transport | Parking | Airport | €15.00 |
| Item_0082 | Airport fee | Airport Fee | Transport | Travel | Fees | €10.00 |
| Item_0083 | Rental fee | Rental Fee (3 nights) | Travel | Accommodation | Vacation | €250.00 |
| Item_0084 | Cleaning fee | Cleaning Fee | Travel | Accommodation | Vacation | €120.00 |
| Item_0085 | Linens | Linens | Travel | Accommodation | Vacation | €45.00 |
| Item_0086 | Tent | Tent | Outdoor | Camping | Equipment | €89.00 |
| Item_0087 | Sleeping bags | Sleeping Bags (2) | Outdoor | Camping | Equipment | €35.00 |
| Item_0088 | Lantern | Lantern | Outdoor | Camping | Equipment | €18.00 |
| Item_0089 | Cooler | Cooler | Outdoor | Camping | Equipment | €45.00 |
| Item_0090 | Venue deposit | Venue Deposit | Events | Wedding | Venue | €1500.00 |
| Item_0091 | Catering deposit | Catering Deposit | Events | Wedding | Catering | €500.00 |
| Item_0092 | Decoration deposit | Decoration Deposit | Events | Wedding | Decor | €250.00 |
| Item_0093 | Snow plowing | Snow Plowing (season) | Services | Home | Seasonal | €350.00 |
| Item_0094 | Salt | Salt | Services | Home | Seasonal | €35.00 |
| Item_0095 | Sand | Sand | Services | Home | Seasonal | €20.00 |
| Item_0096 | Pizza Margherita | Pizza Margherita (2) | Food | Restaurant | Italian | €18.00 |
| Item_0097 | Pizza Quattro Formaggi | Pizza Quattro Formaggi | Food | Restaurant | Italian | €11.00 |
| Item_0098 | Garlic bread | Garlic Bread | Food | Restaurant | Italian | €4.50 |
| Item_0099 | Soft drinks | Soft Drinks (3) | Food | Restaurant | Beverages | €6.00 |
| Item_0100 | Champagne | Champagne (3 bottles) | Food | Beverages | Alcohol | €89.00 |
| Item_0101 | Party decorations | Party Decorations | Entertainment | Celebrations | Decorations | €45.00 |
| Item_0102 | Noise makers | Noise Makers | Entertainment | Celebrations | Decorations | €15.00 |
| Item_0103 | Plywood | Plywood | Home | DIY | Materials | €65.00 |
| Item_0104 | Wood stain | Wood Stain | Home | DIY | Materials | €22.00 |
| Item_0105 | Sandpaper | Sandpaper | Home | DIY | Tools | €12.00 |
| Item_0106 | Varnish | Varnish | Home | DIY | Materials | €14.00 |
| Item_0107 | Milk | Milk | Food | Groceries | Dairy | €1.29 |
| Item_0108 | Eggs | Eggs | Food | Groceries | Dairy | €2.49 |
| Item_0109 | Butter | Butter | Food | Groceries | Dairy | €2.99 |
| Item_0110 | Pasta | Pasta | Food | Groceries | Pantry | €1.99 |
| Item_0111 | Rice | Rice | Food | Groceries | Pantry | €2.49 |
| Item_0112 | Chewing gum | Chewing Gum | Food | Groceries | Snacks | €0.99 |
| Item_0113 | Personal training | Personal Training Sessions (4) | Health | Gym | Training | €75.00 |
| Item_0153 | Festival tickets | Festival Tickets (4) | Entertainment | Events | Tickets | €100.00 |

---

## 5. Purchase Definitions (Aligned with Actual Project Participants)

### Purchase Set A: Summer Road Trip / Shared Apartment (6 purchases)

**PUR-A01: Summer Road Trip Groceries**
- Project: PG-001 (Summer Road Trip 2025)
- Payer: testuser_001
- Date: 2025-06-15
- Items:
  - Item_0001: Bread (qty 2) - €2.49 [Food/Groceries/Bakery]
  - Item_0002: Cheese (qty 1) - €8.99 [Food/Groceries/Dairy]
  - Item_0003: Wine (qty 1) - €14.50 [Food/Groceries/Beverages]
  - Item_0004: Fresh Vegetables (qty 1) - €12.30 [Food/Groceries/Produce]
  - Item_0005: Meat (qty 1) - €24.80 [Food/Groceries/Butcher]
  - Item_0006: Coffee (qty 1) - €9.99 [Food/Groceries/Beverages]
  - Item_0007: Water (6-pack) (qty 6) - €4.50 [Food/Groceries/Beverages]
  - Item_0008: Snacks (qty 1) - €15.00 [Food/Groceries/Snacks]
- Total: €92.57

**PUR-A02: Apartment Cleaning Supplies**
- Project: PG-002 (Shared Apartment Q3)
- Payer: testuser_001
- Date: 2025-07-01
- Items:
  - Item_0009: Laundry Detergent (qty 1) - €7.99 [Home/Cleaning/Laundry]
  - Item_0010: All-purpose Cleaner (qty 1) - €4.49 [Home/Cleaning/Household]
  - Item_0011: Sponges (3-pack) (qty 1) - €3.99 [Home/Cleaning/Kitchen]
  - Item_0012: Trash Bags (qty 1) - €9.99 [Home/Cleaning/Household]
  - Item_0013: Air Freshener (qty 1) - €5.99 [Home/Cleaning/Household]
- Total: €32.45

**PUR-A03: Golf Club Session**
- Project: PG-003 (Weekend Golf Club)
- Payer: testuser_001
- Date: 2025-07-20
- Items:
  - Item_0014: Green Fees (qty 5) - €60.00 [Entertainment/Golf/Fees]
  - Item_0015: Golf Cart Rental (qty 1) - €75.00 [Entertainment/Golf/Equipment]
  - Item_0016: Range Balls (qty 1) - €15.00 [Entertainment/Golf/Practice]
  - Item_0017: Golf Gloves (5 pairs) (qty 5) - €25.00 [Entertainment/Golf/Equipment]
- Total: €415.00

**PUR-A04: Office Lunch Catering**
- Project: PG-004 (Office Lunch Pool)
- Payer: testuser_002
- Date: 2025-08-05
- Items:
  - Item_0018: Sandwiches (15) (qty 15) - €45.00 [Food/Catering/Lunch]
  - Item_0019: Salad Platter (qty 1) - €35.00 [Food/Catering/Lunch]
  - Item_0020: Fruit Platter (qty 1) - €22.00 [Food/Catering/Lunch]
  - Item_0021: Drinks (10) (qty 10) - €15.00 [Food/Catering/Beverages]
- Total: €117.00

**PUR-A05: Household Repair Supplies**
- Project: PG-005 (Household Repairs)
- Payer: testuser_002
- Date: 2025-08-10
- Items:
  - Item_0022: Paint (qty 1) - €45.00 [Home/Repairs/Materials]
  - Item_0023: Paint Brushes (qty 1) - €12.50 [Home/Repairs/Tools]
  - Item_0024: Screws (qty 1) - €18.99 [Home/Repairs/Hardware]
  - Item_0025: Masking Tape (qty 1) - €5.00 [Home/Repairs/Tools]
  - Item_0026: Sealant (qty 1) - €16.00 [Home/Repairs/Materials]
- Total: €97.49

**PUR-A06: Birthday Celebration**
- Project: PG-006 (Birthday Party Fund)
- Payer: testuser_003
- Date: 2025-08-15
- Items:
  - Item_0027: Birthday Cake (qty 1) - €55.00 [Food/Celebrations/Bakery]
  - Item_0028: Balloons (qty 1) - €18.99 [Entertainment/Celebrations/Decorations]
  - Item_0029: Streamers (qty 1) - €16.00 [Entertainment/Celebrations/Decorations]
  - Item_0030: Party Hats (qty 1) - €12.00 [Entertainment/Celebrations/Decorations]
- Total: €101.99

### Purchase Set B: Entertainment & Events (6 purchases)

**PUR-B01: Concert Tickets**
- Project: PG-013 (Concert Tickets Group)
- Payer: testuser_010
- Date: 2025-09-01
- Items:
  - Item_0031: Concert Tickets (6) (qty 6) - €60.00 [Entertainment/Events/Tickets]
  - Item_0032: Service Fee (qty 1) - €54.00 [Entertainment/Events/Fees]
  - Item_0033: Booking Fee (qty 1) - €30.00 [Entertainment/Events/Fees]
  - Item_0034: USB Charger (qty 1) - €6.00 [Electronics/Accessories/Chargers]
- Total: €450.00

**PUR-B02: Game Night Snacks**
- Project: PG-010 (Game Night Series)
- Payer: testuser_007
- Date: 2025-09-10
- Items:
  - Item_0035: Chips (qty 1) - €8.00 [Food/Snacks/Savory]
  - Item_0036: Dips (qty 1) - €6.50 [Food/Snacks/Savory]
  - Item_0037: Beer (8) (qty 8) - €24.00 [Food/Beverages/Alcohol]
  - Item_0038: Soda (6) (qty 6) - €9.00 [Food/Beverages/Non-alcohol]
  - Item_0039: Pizza (3) (qty 3) - €45.00 [Food/Catering/Dinner]
  - Item_0040: Dessert (qty 1) - €22.50 [Food/Catering/Sweet]
- Total: €115.00

**PUR-B03: Holiday Gift Exchange**
- Project: PG-011 (Holiday Gift Exchange)
- Payer: testuser_008
- Date: 2025-12-01
- Items:
  - Item_0041: Gift Vouchers (6) (qty 6) - €20.00 [Shopping/Gifts/Vouchers]
  - Item_0042: Wrapping Paper (qty 1) - €15.00 [Shopping/Gifts/Wrapping]
  - Item_0043: Gift Bags (qty 1) - €12.00 [Shopping/Gifts/Wrapping]
  - Item_0044: Ribbons (qty 1) - €8.00 [Shopping/Gifts/Wrapping]
- Total: €155.00

**PUR-B04: Sports League Registration**
- Project: PG-012 (Sports League Fees)
- Payer: testuser_009
- Date: 2025-09-15
- Items:
  - Item_0045: Registration Fee (qty 1) - €150.00 [Sports/League/Fees]
  - Item_0046: Jerseys (qty 1) - €60.00 [Sports/Equipment/Apparel]
  - Item_0047: Shin Guards (qty 1) - €20.00 [Sports/Equipment/Protective]
  - Item_0048: Sports Socks (qty 1) - €15.00 [Sports/Equipment/Apparel]
- Total: €245.00

**PUR-B05: Book Club Meetup**
- Project: PG-015 (Book Club Meetups)
- Payer: testuser_012
- Date: 2025-10-05
- Items:
  - Item_0049: Coffee (qty 1) - €20.00 [Food/Café/Beverages]
  - Item_0050: Tea (qty 1) - €7.50 [Food/Café/Beverages]
  - Item_0051: Croissants (qty 1) - €12.00 [Food/Café/Bakery]
  - Item_0052: Cookies (qty 1) - €8.00 [Food/Café/Bakery]
  - Item_0053: Sandwiches (qty 1) - €15.00 [Food/Café/Lunch]
- Total: €62.50

**PUR-B06: Music Festival Trip**
- Project: PG-021 (Music Festival Trip)
- Payer: testuser_018
- Date: 2025-08-20
- Items:
  - Item_0153: Festival Tickets (4) (qty 4) - €100.00 [Entertainment/Events/Tickets]
  - Item_0054: Camping Fee (qty 1) - €80.00 [Travel/Accommodation/Outdoor]
  - Item_0055: Shuttle Bus (qty 1) - €40.00 [Travel/Transport/Shuttle]
- Total: €520.00

### Purchase Set C: Home & Health (6 purchases)

**PUR-C01: Pet Vaccinations**
- Project: PG-017 (Pet Care Expenses)
- Payer: testuser_014
- Date: 2025-07-25
- Items:
  - Item_0056: Vaccination (2) (qty 2) - €65.00 [Health/Veterinary/Pets]
  - Item_0057: Health Check (qty 1) - €45.00 [Health/Veterinary/Pets]
  - Item_0058: Deworming (qty 1) - €22.50 [Health/Veterinary/Pets]
  - Item_0059: Microchip (qty 1) - €55.00 [Health/Veterinary/Pets]
- Total: €252.50

**PUR-C02: Pharmacy Pool**
- Project: PG-016 (Pharmacy Pool)
- Payer: testuser_013
- Date: 2025-08-01
- Items:
  - Item_0060: Aspirin (qty 1) - €8.99 [Health/Pharmacy/Medication]
  - Item_0061: Ibuprofen (qty 1) - €12.49 [Health/Pharmacy/Medication]
  - Item_0062: Vitamins (qty 1) - €24.99 [Health/Pharmacy/Supplements]
  - Item_0063: Band-aids (qty 1) - €5.49 [Health/Pharmacy/First aid]
  - Item_0064: Hand Sanitizer (qty 1) - €4.99 [Health/Pharmacy/Hygiene]
- Total: €56.95

**PUR-C03: Gym Membership**
- Project: PG-022 (Gym Membership Split)
- Payer: testuser_020
- Date: 2025-06-01
- Items:
  - Item_0065: Annual Membership (6) (qty 6) - €150.00 [Health/Gym/Membership]
  - Item_0066: Joining Fee (qty 1) - €60.00 [Health/Gym/Membership]
- Total: €960.00

**PUR-C04: Internet Bill Split**
- Project: PG-019 (Internet & Phone)
- Payer: testuser_016
- Date: 2025-07-15
- Items:
  - Item_0067: Monthly Internet (qty 1) - €89.95 [Utilities/Internet/Monthly]
  - Item_0068: Router Rental (qty 1) - €25.00 [Utilities/Internet/Equipment]
- Total: €114.95

**PUR-C05: Utilities Split**
- Project: PG-018 (Utilities Split)
- Payer: testuser_015
- Date: 2025-08-30
- Items:
  - Item_0069: Electricity (qty 1) - €85.00 [Utilities/Energy/Monthly]
  - Item_0070: Gas (qty 1) - €45.50 [Utilities/Energy/Monthly]
  - Item_0071: Water (qty 1) - €22.45 [Utilities/Energy/Monthly]
  - Item_0072: Internet (qty 1) - €29.99 [Utilities/Energy/Monthly]
- Total: €182.94

**PUR-C06: Renovation Materials**
- Project: PG-014 (Renovation Project)
- Payer: testuser_013
- Date: 2025-09-05
- Items:
  - Item_0073: Tiles (qty 1) - €350.00 [Home/Renovation/Materials]
  - Item_0074: Tile Adhesive (qty 1) - €45.00 [Home/Renovation/Materials]
  - Item_0075: Grout (qty 1) - €28.50 [Home/Renovation/Materials]
  - Item_0076: Primer (qty 1) - €35.00 [Home/Renovation/Materials]
  - Item_0022: Paint (qty 1) - €45.00 [Home/Repairs/Materials]
- Total: €583.50

### Purchase Set D: Travel & Transport (6 purchases)

**PUR-D01: Car Maintenance**
- Project: PG-009 (Car Maintenance Fund)
- Payer: testuser_006
- Date: 2025-07-10
- Items:
  - Item_0078: Oil Change (qty 1) - €89.00 [Transport/Car/Maintenance]
  - Item_0079: Tire Rotation (qty 1) - €45.00 [Transport/Car/Maintenance]
  - Item_0080: Car Wash (qty 1) - €25.00 [Transport/Car/Cleaning]
- Total: €159.00

**PUR-D02: Airport Parking**
- Project: PG-024 (Airport Parking Pool)
- Payer: testuser_023
- Date: 2025-08-25
- Items:
  - Item_0081: Parking (3 days) (qty 3) - €15.00 [Transport/Parking/Airport]
  - Item_0082: Airport Fee (qty 1) - €10.00 [Transport/Travel/Fees]
- Total: €55.00

**PUR-D03: Vacation Home Rental**
- Project: PG-020 (Vacation Home Rental)
- Payer: testuser_017
- Date: 2025-08-15
- Items:
  - Item_0083: Rental Fee (3 nights) (qty 3) - €250.00 [Travel/Accommodation/Vacation]
  - Item_0084: Cleaning Fee (qty 1) - €120.00 [Travel/Accommodation/Vacation]
  - Item_0085: Linens (qty 1) - €45.00 [Travel/Accommodation/Vacation]
- Total: €915.00

**PUR-D04: Camping Gear**
- Project: PG-008 (Camping Adventure)
- Payer: testuser_005
- Date: 2025-07-30
- Items:
  - Item_0086: Tent (qty 1) - €89.00 [Outdoor/Camping/Equipment]
  - Item_0087: Sleeping Bags (2) (qty 2) - €35.00 [Outdoor/Camping/Equipment]
  - Item_0088: Lantern (qty 1) - €18.00 [Outdoor/Camping/Equipment]
  - Item_0089: Cooler (qty 1) - €45.00 [Outdoor/Camping/Equipment]
- Total: €222.00

**PUR-D05: Wedding Deposits**
- Project: PG-025 (Wedding Planning Fund)
- Payer: testuser_022
- Date: 2025-06-20
- Items:
  - Item_0090: Venue Deposit (qty 1) - €1500.00 [Events/Wedding/Venue]
  - Item_0091: Catering Deposit (qty 1) - €500.00 [Events/Wedding/Catering]
  - Item_0092: Decoration Deposit (qty 1) - €250.00 [Events/Wedding/Decor]
- Total: €2250.00

**PUR-D06: Snow Removal**
- Project: PG-027 (Snow Removal Service)
- Payer: testuser_023
- Date: 2025-11-15
- Items:
  - Item_0093: Snow Plowing (season) (qty 1) - €350.00 [Services/Home/Seasonal]
  - Item_0094: Salt (qty 1) - €35.00 [Services/Home/Seasonal]
  - Item_0095: Sand (qty 1) - €20.00 [Services/Home/Seasonal]
- Total: €405.00

### Purchase Set E: Food & Miscellaneous (4 purchases)

**PUR-E01: Pizza Friday**
- Project: PG-023 (Pizza Friday Fund)
- Payer: testuser_027
- Date: 2025-10-10
- Items:
  - Item_0096: Pizza Margherita (2) (qty 2) - €18.00 [Food/Restaurant/Italian]
  - Item_0097: Pizza Quattro Formaggi (qty 1) - €11.00 [Food/Restaurant/Italian]
  - Item_0098: Garlic Bread (qty 1) - €4.50 [Food/Restaurant/Italian]
  - Item_0099: Soft Drinks (3) (qty 3) - €6.00 [Food/Restaurant/Beverages]
- Total: €39.50

**PUR-E02: New Year Party**
- Project: PG-028 (New Year Party)
- Payer: testuser_026
- Date: 2025-12-31
- Items:
  - Item_0100: Champagne (3 bottles) (qty 3) - €89.00 [Food/Beverages/Alcohol]
  - Item_0101: Party Decorations (qty 1) - €45.00 [Entertainment/Celebrations/Decorations]
  - Item_0102: Noise Makers (qty 1) - €15.00 [Entertainment/Celebrations/Decorations]
  - Item_0030: Party Hats (qty 1) - €12.00 [Entertainment/Celebrations/Decorations]
- Total: €167.50

**PUR-E03: DIY Workshop Supplies**
- Project: PG-026 (DIY Workshop Supplies)
- Payer: testuser_025
- Date: 2025-09-20
- Items:
  - Item_0103: Plywood (qty 1) - €65.00 [Home/DIY/Materials]
  - Item_0024: Screws (qty 1) - €18.99 [Home/Repairs/Hardware]
  - Item_0104: Wood Stain (qty 1) - €22.00 [Home/DIY/Materials]
  - Item_0105: Sandpaper (qty 1) - €12.00 [Home/DIY/Tools]
  - Item_0106: Varnish (qty 1) - €14.00 [Home/DIY/Materials]
- Total: €128.25

**PUR-E04: Grocery Shopping**
- Project: PG-007 (Grocery Shopping Club)
- Payer: testuser_006
- Date: 2025-10-15
- Items:
  - Item_0107: Milk (qty 1) - €1.29 [Food/Groceries/Dairy]
  - Item_0108: Eggs (qty 1) - €2.49 [Food/Groceries/Dairy]
  - Item_0109: Butter (qty 1) - €2.99 [Food/Groceries/Dairy]
  - Item_0001: Bread (qty 1) - €2.49 [Food/Groceries/Bakery]
  - Item_0002: Cheese (qty 1) - €8.99 [Food/Groceries/Dairy]
  - Item_0003: Wine (qty 1) - €14.50 [Food/Groceries/Beverages]
  - Item_0110: Pasta (qty 1) - €1.99 [Food/Groceries/Pantry]
  - Item_0111: Rice (qty 1) - €2.49 [Food/Groceries/Pantry]
- Total: €40.93

**PUR-E05: Corner Case Small Purchase**
- Project: PG-007 (Grocery Shopping Club)
- Payer: testuser_011
- Date: 2025-10-16
- Items:
  - Item_0112: Chewing Gum (qty 1) - €0.99 [Food/Groceries/Snacks]
- Total: €0.99

**PUR-E06: Personal Training**
- Project: PG-022 (Gym Membership Split)
- Payer: testuser_041
- Date: 2025-10-20
- Items:
  - Item_0113: Personal Training Sessions (4) (qty 4) - €75.00 [Health/Gym/Training]
- Total: €300.00

## 6. Payment Recording (15 payments)

**API Note**: The payment creation endpoint (`POST /api/payments`) expects this schema:
```json
{
  "payer_user_id": int,        // User ID of the payer (From User)
  "receiver_user_id": int,     // User ID of the receiver (use admin=user_id=1)
  "amount": float,
  "payment_date": "YYYY-MM-DD",
  "note": string,
  "project_id": int (optional)
}
```

| Payment ID | From User (payer_user_id) | To User (receiver_user_id) | Project | Amount (€) | Purpose |
|------------|--------------------------|---------------------------|---------|------------|---------|
| PAY-001 | testuser_001 | admin (1) | PG-001 | 50.00 | Road trip gas contribution |
| PAY-002 | testuser_002 | admin (1) | PG-002 | 30.00 | Apartment supplies |
| PAY-003 | testuser_003 | admin (1) | PG-004 | 25.00 | Office lunch |
| PAY-004 | testuser_010 | admin (1) | PG-013 | 150.00 | Concert tickets |
| PAY-005 | testuser_018 | admin (1) | PG-021 | 200.00 | Festival trip |
| PAY-006 | testuser_026 | admin (1) | PG-028 | 80.00 | NYE party |
| PAY-007 | testuser_007 | admin (1) | PG-010 | 40.00 | Game night |
| PAY-008 | testuser_014 | admin (1) | PG-017 | 100.00 | Pet care |
| PAY-009 | testuser_020 | admin (1) | PG-022 | 300.00 | Gym membership |
| PAY-010 | testuser_015 | admin (1) | PG-018 | 60.00 | Utilities |
| PAY-011 | testuser_017 | admin (1) | PG-020 | 250.00 | Vacation home |
| PAY-012 | testuser_023 | admin (1) | PG-025 | 500.00 | Wedding deposit |
| PAY-013 | testuser_009 | admin (1) | PG-012 | 75.00 | Sports league |
| PAY-014 | testuser_005 | admin (1) | PG-008 | 50.00 | Camping gear |
| PAY-015 | testuser_027 | admin (1) | PG-023 | 15.00 | Pizza Friday |

---

## 7. User Deletion Plan (12 deletions)

### Phase 1 - Early (2 deletions)
- DEL-001: testuser_045 (admin deletion)
- DEL-002: testuser_046 (self-deletion)

### Phase 2 - Mid (4 deletions)
- DEL-003: testuser_030 (admin deletion)
- DEL-004: testuser_031 (admin deletion)
- DEL-005: testuser_047 (self-deletion)
- DEL-006: testuser_038 (admin deletion)

### Phase 3 - Late (6 deletions)
- DEL-007: testuser_010 (admin deletion)
- DEL-008: testuser_011 (self-deletion)
- DEL-009: testuser_049 (admin deletion)
- DEL-010: testuser_050 (self-deletion)
- DEL-011: testuser_007 (admin deletion)
- DEL-012: testuser_008 (admin deletion)

---

## 8. Execution Sequence

```
STEP 0: Verify server is running

STEP 1: Login as admin

STEP 2: Create 50 users
  - testuser_001 through testuser_050
  - Password: password123
  - Regular users (not admin)

STEP 3: Create 28 projects
  - Create all projects with proper names
  - No initial participants at creation

STEP 4: Add participants to projects
  - For each project, add the correct users as participants
  - Must match the User-Project mapping in Section 3

STEP 5: Create purchases
  - Create all 32 purchases as defined in Section 5
  - Ensure payer and contributors are actual project participants

STEP 6: Record payments
  - Record all 15 payments as defined in Section 6

STEP 7: User deletions Phase 1
  - Delete testuser_045 (admin)
  - Delete testuser_046 (self)

STEP 8: User deletions Phase 2
  - Delete testuser_030 (admin)
  - Delete testuser_031 (admin)
  - Delete testuser_047 (self)
  - Delete testuser_038 (admin)

STEP 9: User deletions Phase 3
  - Delete testuser_010 (admin)
  - Delete testuser_011 (self)
  - Delete testuser_049 (admin)
  - Delete testuser_050 (self)
  - Delete testuser_007 (admin)
  - Delete testuser_008 (admin)

STEP 10: Verify MoneyFlow balances
  - For each project, calculate expected balances
  - Compare with actual MoneyFlow API results

STEP 11: Final verification
  - Check all data integrity
  - Verify no orphaned records
```

---

## 9. Expected Outcomes

1. **50 users** created successfully
2. **28 projects** created with proper participant assignments
3. **32 purchases** created with correct item counts and totals
4. **15 payments** recorded
5. **12 users** deleted in 3 phases
6. **Balance verification** passes for all remaining projects

---

## 10. Corner Cases to Verify

1. Single-item purchase (€0.99 gum)
2. Large purchase (€2250 wedding deposit)
3. Purchase with 9 contributors (Pet Vaccinations)
4. Self-deletion vs admin deletion
5. Deleted user's purchases remain visible but marked as "Deleted account"
6. MoneyFlow still calculable after deletions

---

*Document Version: 2.0*
*Last Updated: 2026-05-09*