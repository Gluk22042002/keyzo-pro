import { get, getAll, run } from './db.js';

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function geolocationRoutes(app, auth) {
  app.post('/api/location/set', auth, async (req, res) => {
    try {
      const { lat, lng } = req.body;
      if (lat === undefined || lng === undefined) return res.status(400).json({ error: 'lat and lng required' });
      if (typeof lat !== 'number' || typeof lng !== 'number') return res.status(400).json({ error: 'lat and lng must be numbers' });
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return res.status(400).json({ error: 'Invalid coordinates' });

      await run('UPDATE users SET lat = $1, lng = $2 WHERE id = $3', [lat, lng, req.user.id]);
      res.json({ success: true, lat, lng });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.get('/api/location/nearby', auth, async (req, res) => {
    try {
      const { lat, lng, radius } = req.query;
      if (!lat || !lng) return res.status(400).json({ error: 'lat and lng query params required' });

      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      const maxRadius = parseFloat(radius) || 50;

      const sellers = await getAll(
        `SELECT id, username, avatar, is_verified, verification_badge, bio, rating, total_sales, lat, lng
         FROM users WHERE role = 'seller' AND lat IS NOT NULL AND lng IS NOT NULL AND id != $1`,
        [req.user.id]
      );

      const nearby = sellers
        .map(s => ({
          id: s.id,
          username: s.username,
          avatar: s.avatar,
          is_verified: s.is_verified,
          verification_badge: s.verification_badge,
          bio: s.bio,
          rating: s.rating,
          total_sales: s.total_sales,
          lat: s.lat,
          lng: s.lng,
          distance: Math.round(haversineDistance(userLat, userLng, s.lat, s.lng) * 100) / 100
        }))
        .filter(s => s.distance <= maxRadius)
        .sort((a, b) => a.distance - b.distance);

      res.json({ sellers: nearby, count: nearby.length, radius: maxRadius });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
}
