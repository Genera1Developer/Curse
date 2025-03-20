let posts = [];

export default function handler(req, res) {
  const { method } = req;

  if (method === 'POST') {
    const { content } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).send('Post content cannot be empty');
    }

    const newPost = {
      id: Date.now().toString(),
      username: `Anonymous${Math.floor(Math.random() * 1000)}`,
      content,
      timestamp: new Date().toLocaleString(),
      comments: [],
    };

    posts.push(newPost);

    return res.status(201).json(newPost);
  }

  if (method === 'GET') {
    return res.status(200).json(posts);
  }

  if (method === 'POST' && req.url.includes('/comments')) {
    const { postId } = req.query;
    const { content } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).send('Comment content cannot be empty');
    }

    const post = posts.find(p => p.id === postId);

    if (!post) {
      return res.status(404).send('Post not found');
    }

    const newComment = {
      username: `Anonymous${Math.floor(Math.random() * 1000)}`,
      content,
      timestamp: new Date().toLocaleString(),
    };

    post.comments.push(newComment);

    return res.status(201).json(newComment);
  }

  res.status(405).send('Method Not Allowed');
}
