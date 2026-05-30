import { get, getAll, run } from './db.js';

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 200);
}

export function blogRoutes(app, auth) {
  app.get('/api/blog', async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      const { category, search } = req.query;

      let where = ['bp.is_published = true'];
      let params = [];
      let idx = 1;

      if (category) { where.push(`bp.category = $${idx++}`); params.push(category); }
      if (search) { where.push(`(bp.title ILIKE $${idx} OR bp.content ILIKE $${idx})`); params.push(`%${search}%`); idx++; }

      const whereClause = where.join(' AND ');
      const total = (await get(`SELECT COUNT(*)::int as count FROM blog_posts bp WHERE ${whereClause}`, params))?.count || 0;
      const posts = await getAll(
        `SELECT bp.id, bp.title, bp.slug, bp.excerpt, bp.category, bp.image, bp.views, bp.created_at, u.username as author_name, u.avatar as author_avatar
         FROM blog_posts bp LEFT JOIN users u ON bp.author_id = u.id
         WHERE ${whereClause} ORDER BY bp.created_at DESC LIMIT $${idx++} OFFSET $${idx}`,
        [...params, limit, offset]
      );
      res.json({ posts, total, page, pages: Math.ceil(total / limit) });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/blog/:slug', async (req, res) => {
    try {
      const post = await get(
        `SELECT bp.*, u.username as author_name, u.avatar as author_avatar
         FROM blog_posts bp LEFT JOIN users u ON bp.author_id = u.id
         WHERE bp.slug = $1 AND bp.is_published = true`,
        [req.params.slug]
      );
      if (!post) return res.status(404).json({ error: 'Post not found' });

      await run('UPDATE blog_posts SET views = views + 1 WHERE slug = $1', [req.params.slug]);

      const related = await getAll(
        `SELECT bp.id, bp.title, bp.slug, bp.excerpt, bp.image, bp.created_at
         FROM blog_posts bp WHERE bp.category = $1 AND bp.slug != $2 AND bp.is_published = true
         ORDER BY bp.created_at DESC LIMIT 3`,
        [post.category, post.slug]
      );

      res.json({ ...post, views: post.views + 1, related });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/blog', auth, async (req, res) => {
    try {
      if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
      const { title, content, excerpt, category, image, is_published } = req.body;
      if (!title || !content) return res.status(400).json({ error: 'title and content required' });

      let slug = slugify(title);
      const existing = await get('SELECT id FROM blog_posts WHERE slug = $1', [slug]);
      if (existing) slug += `-${Date.now()}`;

      const result = await run(
        'INSERT INTO blog_posts (title, slug, content, excerpt, author_id, category, image, is_published) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
        [title, slug, content, excerpt || content.slice(0, 200), req.user.id, category || 'general', image || '', is_published !== false]
      );
      res.json(result.rows[0]);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/blog/:id', auth, async (req, res) => {
    try {
      if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
      const { title, content, excerpt, category, image, is_published } = req.body;
      await run(
        'UPDATE blog_posts SET title=COALESCE($1,title), content=COALESCE($2,content), excerpt=COALESCE($3,excerpt), category=COALESCE($4,category), image=COALESCE($5,image), is_published=COALESCE($6,is_published), updated_at=NOW() WHERE id=$7',
        [title, content, excerpt, category, image, is_published, req.params.id]
      );
      res.json(await get('SELECT * FROM blog_posts WHERE id = $1', [req.params.id]));
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/blog/:id', auth, async (req, res) => {
    try {
      if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
      await run('DELETE FROM blog_posts WHERE id = $1', [req.params.id]);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
}

export default { blogRoutes };
