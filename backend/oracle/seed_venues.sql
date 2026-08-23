-- Seeds the same 10 demo venues/users used by backend/src/seed.js
-- (the JSON-store seed script), so both drivers show identical data.
-- Run as: sqlplus mahal_app/<app_pwd>@localhost:1521/FREEPDB1 @seed_venues.sql
SET DEFINE OFF
WHENEVER SQLERROR CONTINUE

INSERT INTO venues (id,name,slug,category,city,area,capacity,price_from,amenities,rating,reviews_count,host_name,host_email,host_phone,description,status,featured) VALUES
('v001','Riad Zahra','riad-zahra','heritage','Marrakech','Medina',80,4000,'["Rooftop terrace","Central courtyard","Catering option"]',4.8,34,'Amina K.','owner@example.com','+212 6 00 00 00 00','Riad Zahra is a distinctive heritage venue in Marrakech, Medina. Capacity for up to 80 guests.','live',1);
INSERT INTO venues (id,name,slug,category,city,area,capacity,price_from,amenities,rating,reviews_count,host_name,host_email,host_phone,description,status,featured) VALUES
('v002','Villa Atlas Resort','villa-atlas-resort','resort','Agadir','Baie des Palmiers',220,9500,'["Pool deck","Ballroom","On-site chef","Valet parking"]',4.6,51,'Amina K.','owner@example.com','+212 6 00 00 00 00','Villa Atlas Resort is a distinctive resort venue in Agadir, Baie des Palmiers. Capacity for up to 220 guests.','live',0);
INSERT INTO venues (id,name,slug,category,city,area,capacity,price_from,amenities,rating,reviews_count,host_name,host_email,host_phone,description,status,featured) VALUES
('v003','Dar El Fassia','dar-el-fassia','private','Fes','Fes el Bali',45,3200,'["Private courtyard","Traditional hammam","Butler service"]',4.9,19,'Amina K.','owner@example.com','+212 6 00 00 00 00','Dar El Fassia is a distinctive private venue in Fes, Fes el Bali. Capacity for up to 45 guests.','live',1);
INSERT INTO venues (id,name,slug,category,city,area,capacity,price_from,amenities,rating,reviews_count,host_name,host_email,host_phone,description,status,featured) VALUES
('v004','Ourika Nature Lodge','ourika-nature-lodge','nature','Ourika Valley','Atlas foothills',120,5200,'["Riverside gardens","Berber tents","Hiking access"]',4.7,27,'Amina K.','owner@example.com','+212 6 00 00 00 00','Ourika Nature Lodge is a distinctive nature venue in Ourika Valley. Capacity for up to 120 guests.','live',0);
INSERT INTO venues (id,name,slug,category,city,area,capacity,price_from,amenities,rating,reviews_count,host_name,host_email,host_phone,description,status,featured) VALUES
('v005','Essaouira Coastal House','essaouira-coastal-house','coastal','Essaouira','Medina ramparts',60,3800,'["Ocean-view terrace","Fireplace lounge","Surf-adjacent"]',4.5,22,'Amina K.','owner@example.com','+212 6 00 00 00 00','Essaouira Coastal House is a distinctive coastal venue in Essaouira. Capacity for up to 60 guests.','live',1);
INSERT INTO venues (id,name,slug,category,city,area,capacity,price_from,amenities,rating,reviews_count,host_name,host_email,host_phone,description,status,featured) VALUES
('v006','Casablanca Loft 27','casablanca-loft-27','urban','Casablanca','Gauthier',150,6500,'["Rooftop bar","Skyline views","DJ booth"]',4.4,40,'Amina K.','owner@example.com','+212 6 00 00 00 00','Casablanca Loft 27 is a distinctive urban venue in Casablanca. Capacity for up to 150 guests.','live',0);
INSERT INTO venues (id,name,slug,category,city,area,capacity,price_from,amenities,rating,reviews_count,host_name,host_email,host_phone,description,status,featured) VALUES
('v007','Rabat Convention Hall','rabat-convention-hall','corporate','Rabat','Agdal',400,15000,'["AV equipment","Breakout rooms","Simultaneous translation booths"]',4.6,15,'Amina K.','owner@example.com','+212 6 00 00 00 00','Rabat Convention Hall is a distinctive corporate venue in Rabat. Capacity for up to 400 guests.','live',1);
INSERT INTO venues (id,name,slug,category,city,area,capacity,price_from,amenities,rating,reviews_count,host_name,host_email,host_phone,description,status,featured) VALUES
('v008','Studio Lumiere','studio-lumiere','entertainment','Marrakech','Gueliz',300,12000,'["Stage and lighting rig","Green room","Live sound"]',4.3,12,'Amina K.','owner@example.com','+212 6 00 00 00 00','Studio Lumiere is a distinctive entertainment venue in Marrakech. Capacity for up to 300 guests.','live',0);
INSERT INTO venues (id,name,slug,category,city,area,capacity,price_from,amenities,rating,reviews_count,host_name,host_email,host_phone,description,status,featured) VALUES
('v009','Kasbah Ait Ben Haddou Terrace','kasbah-ait-ben-haddou-terrace','heritage','Ouarzazate','Ait Ben Haddou',90,4800,'["Desert panorama","Sunset ceremony spot"]',4.9,8,'Amina K.','owner@example.com','+212 6 00 00 00 00','Kasbah Ait Ben Haddou Terrace is a distinctive heritage venue in Ouarzazate. Capacity for up to 90 guests.','live',1);
INSERT INTO venues (id,name,slug,category,city,area,capacity,price_from,amenities,rating,reviews_count,host_name,host_email,host_phone,description,status,featured) VALUES
('v010','Tangier Bay Resort','tangier-bay-resort','resort','Tangier','Malabata',260,11000,'["Private beach","Multiple ballrooms","Marina view"]',4.5,33,'Amina K.','owner@example.com','+212 6 00 00 00 00','Tangier Bay Resort is a distinctive resort venue in Tangier, Malabata. Capacity for up to 260 guests.','live',0);

-- Demo logins: client@example.com / owner@example.com, password: password123
INSERT INTO app_users (id, email, name, role, password_hash) VALUES
('u001','client@example.com','Demo Client','client','$2a$10$1zfw6b3QsigmQgO8FARk1ueJ340s5Y7kXvh47RV080HYHRGKweCtC');
INSERT INTO app_users (id, email, name, role, password_hash) VALUES
('u002','owner@example.com','Demo Owner','owner','$2a$10$1zfw6b3QsigmQgO8FARk1ueJ340s5Y7kXvh47RV080HYHRGKweCtC');

COMMIT;
PROMPT DONE
EXIT;
