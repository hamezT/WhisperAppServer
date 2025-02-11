const express = require('express');
const router = express.Router();



// Import controllers
const userController = require('../controllers/userController');
const chatController = require('../controllers/chatController');
const messageController = require('../controllers/messageController');
const authenticateToken = require('../middleware/authenticateToken'); // Thay đổi đường dẫn đến middleware của bạn
const postController = require('../controllers/postController');

// Post routes
router.post('/posts', authenticateToken, postController.createPost);
router.get('/posts', authenticateToken, postController.getPosts);
router.put('/posts/:postId', authenticateToken, postController.updatePost);
router.delete('/posts/:postId', authenticateToken, postController.deletePost);
router.post('/posts/:postId/like', authenticateToken, postController.likePost);
router.post('/posts/:postId/comments', authenticateToken, postController.addComment);
router.get('/posts/:postId/comments', authenticateToken, postController.getCommentsByPost);
router.delete('/comments/:commentId', authenticateToken, postController.deleteComment);



// User routes
router.post('/users/register', userController.register);
router.post('/users/login', userController.login);
router.put('/users/changePassword', authenticateToken, userController.changePassword);
router.post('/users/logout', authenticateToken, userController.logout);

// Route để lấy thông tin người dùng theo ID
router.get('/users/me', authenticateToken, userController.getCurrentUserProfile);
router.put('/users/me', authenticateToken, userController.updateUserProfile);
router.get('/users/:id', authenticateToken, userController.getUserById);

// Chat routes
// Tìm kiếm người dùng theo số điện thoại
router.post('/search', authenticateToken, (req, res) => chatController(req.io).searchUserByPhoneNumber(req, res));
// Tạo đoạn chat mới
router.post('/chats/create', (req, res) => chatController(req.io).createChat(req, res));
// Tạo đoạn chat nhóm
router.post('/chats/createGroup', authenticateToken, (req, res) => chatController(req.io).createGroupChat(req, res));
//Lấy ra những đoạn chat bởi user đang đăng nhập
router.get('/chats/getChatsByUser', authenticateToken, (req, res) => chatController(req.io).getChatsByUser(req, res));
//Xoá đoạn chat và những message liên quan.
router.delete('/chats/delete/:chatId', authenticateToken, (req, res) => chatController(req.io).deleteChat(req, res));
//Thêm thành viên vào nhóm
router.post('/chats/addMemberToGroup', authenticateToken, (req, res) => chatController(req.io).addMemberToGroup(req, res));
//Xoá thành viên khỏi nhóm
router.post('/chats/removeMemberFromGroup', authenticateToken, (req, res) => chatController(req.io).removeMemberFromGroup(req, res));
//Đổi tên nhóm
router.post('/chats/renameGroup', authenticateToken, (req, res) => chatController(req.io).renameGroup(req, res));

// Routes quản lý bạn bè
router.post('/friends/send', authenticateToken, userController.sendFriendRequest);
router.post('/friends/accept', authenticateToken, userController.acceptFriendRequest);
router.post('/friends/reject', authenticateToken, userController.rejectFriendRequest);
router.get('/friends', authenticateToken, userController.getFriendsList);
router.get('/friends/friendRequest', authenticateToken, userController.getFriendRequests);


//Kiểm tra có là bạn bè
router.get('/friends/checkfriends/:userId', authenticateToken, userController.checkFriendship);
router.delete('/friends/remove', authenticateToken, userController.removeFriend);

// Message routes
// Route để tạo tin nhắn mới
router.post('/messages', (req, res) => messageController(req.io).createMessage(req, res));

// Route để lấy tất cả tin nhắn trong một cuộc trò chuyện
router.get('/messages/:chatId', (req, res) => messageController(req.io).getMessagesByChat(req, res));

// Route để cập nhật tin nhắn
router.put('/messages/:messageId', (req, res) => messageController(req.io).updateMessage(req, res));

// Route để xóa tin nhắn
router.delete('/messages/:messageId', (req, res) => messageController(req.io).deleteMessage(req, res));

// Route để đánh dấu tin nhắn là đã đọc
router.post('/messages/markAsRead/:messageId', (req, res) => messageController(req.io).markAsRead(req, res));



module.exports = router;