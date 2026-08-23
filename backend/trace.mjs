console.log('1 start');
const t0 = Date.now();
try { await import('express'); console.log('2 express ok', Date.now()-t0); } catch(e){ console.log('2 ERR', e.message); }
try { await import('cors'); console.log('3 cors ok'); } catch(e){ console.log('3 ERR', e.message); }
try { await import('morgan'); console.log('4 morgan ok'); } catch(e){ console.log('4 ERR', e.message); }
try { await import('dotenv/config'); console.log('5 dotenv ok'); } catch(e){ console.log('5 ERR', e.message); }
try { await import('./src/routes/venues.js'); console.log('6 venues ok'); } catch(e){ console.log('6 ERR', e.message); }
try { await import('./src/db.js'); console.log('7 db ok'); } catch(e){ console.log('7 ERR', e.message); }
console.log('done');
