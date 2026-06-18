const db = require('../db/connection');
const { logAudit } = require('../utils/auditLogger');

// GET /api/stories -> Get all success stories with their comments
exports.getAllStories = async (req, res) => {
  try {
    const [stories] = await db.query('SELECT * FROM success_stories ORDER BY created_at DESC');
    const [comments] = await db.query(`
      SELECT 
        c.id,
        c.story_id,
        c.user_id,
        c.guest_name,
        c.comment_text,
        c.created_at,
        COALESCE(u.name, c.guest_name) AS author_name
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      ORDER BY c.created_at ASC
    `);

    // Attach comments to their respective stories
    stories.forEach(story => {
      story.comments = comments.filter(comment => comment.story_id === story.id);
    });

    return res.status(200).json({ stories });
  } catch (error) {
    console.error('Fetch success stories error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /api/stories/:id/like -> Increment likes for a story
exports.likeStory = async (req, res) => {
  const { id } = req.params;
  try {
    const [existing] = await db.query('SELECT id FROM success_stories WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Story not found' });
    }

    await db.query('UPDATE success_stories SET likes_count = likes_count + 1 WHERE id = ?', [id]);
    return res.status(200).json({ message: 'Story liked successfully' });
  } catch (error) {
    console.error('Like story error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /api/stories/:id/comments -> Add comment to a story (public / guest or logged-in)
exports.addComment = async (req, res) => {
  const { id } = req.params;
  const { comment_text, guest_name } = req.body;

  try {
    if (!comment_text || comment_text.trim() === '') {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const [existing] = await db.query('SELECT id FROM success_stories WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Story not found' });
    }

    let userId = null;
    let nameForComment = null;

    if (req.user) {
      // Logged-in user
      userId = req.user.id;
      nameForComment = req.user.name;
    } else {
      // Guest user
      if (!guest_name || guest_name.trim() === '') {
        return res.status(400).json({ message: 'Guest name is required for unauthenticated comments' });
      }
      nameForComment = guest_name.trim();
    }

    const [result] = await db.query(
      'INSERT INTO comments (story_id, user_id, guest_name, comment_text) VALUES (?, ?, ?, ?)',
      [id, userId, userId ? null : nameForComment, comment_text.trim()]
    );

    return res.status(201).json({
      message: 'Comment added successfully',
      comment: {
        id: result.insertId,
        story_id: parseInt(id),
        user_id: userId,
        guest_name: userId ? null : nameForComment,
        comment_text: comment_text.trim(),
        author_name: nameForComment,
        created_at: new Date()
      }
    });
  } catch (error) {
    console.error('Add comment error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /api/stories -> Create success story (Admin Only)
exports.createStory = async (req, res) => {
  const { title, description, image_url } = req.body;

  try {
    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }

    const [result] = await db.query(
      'INSERT INTO success_stories (title, description, image_url) VALUES (?, ?, ?)',
      [title.trim(), description.trim(), image_url || '']
    );

    await logAudit(req, 'Success Stories', `Created success story: "${title}" (ID: ${result.insertId})`);

    return res.status(201).json({
      message: 'Success story created successfully',
      storyId: result.insertId
    });
  } catch (error) {
    console.error('Create story error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// PUT /api/stories/:id -> Update success story (Admin Only)
exports.updateStory = async (req, res) => {
  const { id } = req.params;
  const { title, description, image_url } = req.body;

  try {
    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }

    const [existing] = await db.query('SELECT id FROM success_stories WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Story not found' });
    }

    await db.query(
      'UPDATE success_stories SET title = ?, description = ?, image_url = ? WHERE id = ?',
      [title.trim(), description.trim(), image_url || '', id]
    );

    await logAudit(req, 'Success Stories', `Updated success story: "${title}" (ID: ${id})`);

    return res.status(200).json({ message: 'Success story updated successfully' });
  } catch (error) {
    console.error('Update story error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// DELETE /api/stories/:id -> Delete success story (Admin Only)
exports.deleteStory = async (req, res) => {
  const { id } = req.params;

  try {
    const [existing] = await db.query('SELECT title FROM success_stories WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Story not found' });
    }
    const storyTitle = existing[0].title;

    await db.query('DELETE FROM success_stories WHERE id = ?', [id]);

    await logAudit(req, 'Success Stories', `Deleted success story: "${storyTitle}" (ID: ${id})`);

    return res.status(200).json({ message: 'Success story deleted successfully' });
  } catch (error) {
    console.error('Delete story error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// DELETE /api/stories/comments/:id -> Delete comment (Admin Only Moderation)
exports.deleteComment = async (req, res) => {
  const { id } = req.params;

  try {
    const [existing] = await db.query('SELECT comment_text FROM comments WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    const commentTextSnippet = existing[0].comment_text.substring(0, 30);

    await db.query('DELETE FROM comments WHERE id = ?', [id]);

    await logAudit(req, 'Success Stories', `Moderated (deleted) comment: "${commentTextSnippet}..." (Comment ID: ${id})`);

    return res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
