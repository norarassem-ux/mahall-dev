-- Seeds review rows for the 12 demo venues (seed_mahaldb.sql) so
-- venues.rating / reviews_count (trigger-maintained off this table, see
-- provision_mahaldb.sql's reviews_sync_venue_rating) are real numbers
-- instead of the 0 placeholders that script leaves behind.
-- Run as: sqlplus mahaldb/<app_pwd>@localhost:1521/FREEPDB1 @seed_reviews.sql
SET DEFINE OFF
WHENEVER SQLERROR CONTINUE

INSERT INTO reviews (id, venue_id, user_id, rating, comment_text) VALUES ('r1a','v001','u001',5,'Loved the golden-hour courtyard light.');
INSERT INTO reviews (id, venue_id, user_id, rating, comment_text) VALUES ('r1b','v001','u001',5,'Amina was incredibly responsive throughout.');
INSERT INTO reviews (id, venue_id, user_id, rating, comment_text) VALUES ('r2a','v002','u001',5,'Stargazing deck made our desert night unforgettable.');
INSERT INTO reviews (id, venue_id, user_id, rating, comment_text) VALUES ('r2b','v002','u001',4,'Remote but absolutely worth the drive.');
INSERT INTO reviews (id, venue_id, user_id, rating, comment_text) VALUES ('r3a','v003','u001',5,'Trade winds kept it cool even in August.');
INSERT INTO reviews (id, venue_id, user_id, rating, comment_text) VALUES ('r3b','v003','u001',4,'Perfect backdrop for our brand shoot.');
INSERT INTO reviews (id, venue_id, user_id, rating, comment_text) VALUES ('r4a','v004','u001',5,'Infinity pool photographed beautifully for the wedding.');
INSERT INTO reviews (id, venue_id, user_id, rating, comment_text) VALUES ('r4b','v004','u001',4,'Private and quiet, exactly what we needed.');
INSERT INTO reviews (id, venue_id, user_id, rating, comment_text) VALUES ('r5a','v005','u001',5,'Sunset ceremony spot is unreal.');
INSERT INTO reviews (id, venue_id, user_id, rating, comment_text) VALUES ('r5b','v005','u001',5,'One of the most distinctive venues we have shot at.');
INSERT INTO reviews (id, venue_id, user_id, rating, comment_text) VALUES ('r6a','v006','u001',4,'Skyline views alone are worth it.');
INSERT INTO reviews (id, venue_id, user_id, rating, comment_text) VALUES ('r6b','v006','u001',4,'DJ booth setup saved us a rental.');
INSERT INTO reviews (id, venue_id, user_id, rating, comment_text) VALUES ('r7a','v007','u001',5,'Pool deck was the highlight of our offsite.');
INSERT INTO reviews (id, venue_id, user_id, rating, comment_text) VALUES ('r7b','v007','u001',4,'Ballroom fits 300 comfortably.');
INSERT INTO reviews (id, venue_id, user_id, rating, comment_text) VALUES ('r8a','v008','u001',5,'Translation booths made our conference run smoothly.');
INSERT INTO reviews (id, venue_id, user_id, rating, comment_text) VALUES ('r8b','v008','u001',4,'500-capacity hall handled our AGM well.');
INSERT INTO reviews (id, venue_id, user_id, rating, comment_text) VALUES ('r9a','v009','u001',4,'Lighting rig saved us renting our own.');
INSERT INTO reviews (id, venue_id, user_id, rating, comment_text) VALUES ('r9b','v009','u001',4,'Feels like a real production studio.');
INSERT INTO reviews (id, venue_id, user_id, rating, comment_text) VALUES ('r10a','v010','u001',5,'Hammam add-on made it an unforgettable weekend.');
INSERT INTO reviews (id, venue_id, user_id, rating, comment_text) VALUES ('r10b','v010','u001',5,'Butler service is genuinely five-star.');
INSERT INTO reviews (id, venue_id, user_id, rating, comment_text) VALUES ('r11a','v011','u001',5,'Atlas silhouette at dusk is unlike anything else in Morocco.');
INSERT INTO reviews (id, venue_id, user_id, rating, comment_text) VALUES ('r11b','v011','u001',4,'Rocky desert, not sandy — loved the difference.');
INSERT INTO reviews (id, venue_id, user_id, rating, comment_text) VALUES ('r12a','v012','u001',5,'Sea-facing terrace at the Cite Portugaise is stunning.');
INSERT INTO reviews (id, venue_id, user_id, rating, comment_text) VALUES ('r12b','v012','u001',4,'Historic courtyard gave our event real character.');

COMMIT;
PROMPT DONE
EXIT;
