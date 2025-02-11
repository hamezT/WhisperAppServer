const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Friendship = require('../models/Friend');

const postController = {
  createPost: async (req, res) => {
    try {
      const { content } = req.body;
      const userId = req.user.id;

      const newPost = new Post({
        user: userId,
        content
      });

      await newPost.save();

      res.status(201).json({ success: true, message: 'Post created successfully', data: newPost });
    } catch (error) {
      console.error('Create post error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getPosts: async (req, res) => {
    try {
      const userId = req.user.id;
  
      // Find friends
      const friendships = await Friendship.find({
        $or: [{ requester: userId }, { recipient: userId }],
        status: 'accepted'
      }).populate('requester recipient');
  
      const friendIds = friendships.map(friendship =>
        friendship.requester._id.equals(userId) ? friendship.recipient._id : friendship.requester._id
      );
  
      // Include the userId in the list of friendIds to also get the user's own posts
      friendIds.push(userId);
  
      // Find posts by friends or the user
      const posts = await Post.find({ user: { $in: friendIds } })
        .populate('user', 'name avatar')
        .populate({
          path: 'comments',
          populate: { path: 'user', select: 'name avatar' }
        });
  
      res.status(200).json({ success: true, data: posts });
    } catch (error) {
      console.error('Get posts error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  likePost: async (req, res) => {
    try {
      const { postId } = req.params;
      const userId = req.user.id;

      const post = await Post.findById(postId);

      if (!post) {
        return res.status(404).json({ success: false, message: 'Post not found' });
      }

      if (post.likes.includes(userId)) {
        post.likes.pull(userId);
      } else {
        post.likes.push(userId);
      }

      await post.save();

      res.status(200).json({ success: true, message: 'Post liked/unliked successfully', data: post });
    } catch (error) {
      console.error('Like post error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  updatePost: async (req, res) => {
    try {
      const { postId } = req.params;
      const { content } = req.body;
      const userId = req.user.id;

      const post = await Post.findOneAndUpdate(
        { _id: postId, user: userId },
        { content, updatedAt: Date.now() },
        { new: true }
      );

      if (!post) {
        return res.status(404).json({ success: false, message: 'Post not found or not authorized' });
      }

      res.status(200).json({ success: true, message: 'Post updated successfully', data: post });
    } catch (error) {
      console.error('Update post error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  deletePost: async (req, res) => {
    try {
      const { postId } = req.params;
      const userId = req.user.id;

      const post = await Post.findOneAndDelete({ _id: postId, user: userId });

      if (!post) {
        return res.status(404).json({ success: false, message: 'Post not found or not authorized' });
      }

      await Comment.deleteMany({ post: postId });

      res.status(200).json({ success: true, message: 'Post deleted successfully' });
    } catch (error) {
      console.error('Delete post error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getCommentsByPost: async (req, res) => {
    try {
      const { postId } = req.params;

      const post = await Post.findById(postId).populate({
        path: 'comments',
        populate: { path: 'user', select: 'name avatar' }
      });

      if (!post) {
        return res.status(404).json({ success: false, message: 'Post not found' });
      }

      res.status(200).json({ success: true, data: post.comments });
    } catch (error) {
      console.error('Get comments error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  addComment: async (req, res) => {
    try {
      const { postId } = req.params;
      const { content } = req.body;
      const userId = req.user.id;

      const newComment = new Comment({
        post: postId,
        user: userId,
        content
      });

      await newComment.save();

      const post = await Post.findById(postId);
      post.comments.push(newComment._id);
      await post.save();

      res.status(201).json({ success: true, message: 'Comment added successfully', data: newComment });
    } catch (error) {
      console.error('Add comment error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  deleteComment: async (req, res) => {
    try {
      const { commentId } = req.params;
      const userId = req.user.id;

      const comment = await Comment.findById(commentId);

      if (!comment) {
        return res.status(404).json({ success: false, message: 'Comment not found' });
      }

      if (comment.user.toString() !== userId) {
        return res.status(403).json({ success: false, message: 'Not authorized to delete this comment' });
      }

      await comment.deleteOne({ comment: commentId });

      // Optionally, remove the comment reference from the post
      await Post.findByIdAndUpdate(comment.post, { $pull: { comments: commentId } });

      res.status(200).json({ success: true, message: 'Comment deleted successfully' });
    } catch (error) {
      console.error('Delete comment error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

module.exports = postController;