const User = require('../models/User');
const Chat = require('../models/Chat');
const Message = require('../models/Message');


const chatController = (io) => {
  return {
    // Tìm kiếm người dùng theo số điện thoại và tạo đoạn chat nếu chưa tồn tại
    searchUserByPhoneNumber: async (req, res) => {
      try {
        const { phoneNumber } = req.body;
        const userId = req.user?.id;

        if (!phoneNumber) {
          return res.status(400).json({ message: 'Phone number is required' });
        }

        // Tìm kiếm người dùng theo số điện thoại
        const targetUser = await User.findOne({ phoneNumber });

        if (!targetUser) {
          return res.status(404).json({ message: 'User not found' });
        }

        // Kiểm tra xem đoạn chat đã tồn tại chưa
        let chat = await Chat.findOne({
          participants: { $all: [userId, targetUser._id] },
          type: 'individual'
        });

        if (!chat) {
          // Tạo đoạn chat mới nếu chưa tồn tại
          chat = new Chat({
            participants: [userId, targetUser._id],
            type: 'individual'
          });

          // Lưu đoạn chat mới vào cơ sở dữ liệu
          await chat.save();
        }

        // Trả về thông tin người dùng và đoạn chat
        res.status(200).json({ message: 'User found', user: targetUser, chat });
      } catch (error) {
        console.error('Search user by phone number error:', error);
        res.status(500).json({ message: 'Error searching user by phone number' });
      }
    },

    // Tạo đoạn chat mới
    createChat: async (req, res) => {
      try {
        const { userId, targetUserId } = req.body;

        // Kiểm tra xem đoạn chat đã tồn tại chưa
        let chat = await Chat.findOne({
          participants: { $all: [userId, targetUserId] },
          type: 'individual'
        });

        if (!chat) {
          // Tạo đoạn chat mới nếu chưa tồn tại
          chat = new Chat({
            participants: [userId, targetUserId],
            type: 'individual'
          });

          await chat.save();
        }

        res.status(201).json({ message: 'Chat created successfully', chat });
      } catch (error) {
        console.error('Create chat error:', error);
        res.status(500).json({ message: 'Error creating chat' });
      }
    },
    // Tạo đoạn chat nhóm
    createGroupChat: async (req, res) => {
      try {
        const { userId, participantIds, name } = req.body;

        if (!participantIds || participantIds.length < 2) {
          return res.status(400).json({ message: 'At least two participants are required to create a group chat' });
        }

        // Thêm userId của người tạo vào danh sách participants
        participantIds.push(userId);

        // Tạo đoạn chat nhóm mới
        const chat = new Chat({
          participants: participantIds,
          type: 'group',
          name
        });

        await chat.save();

        res.status(201).json({ message: 'Group chat created successfully', chat });
      } catch (error) {
        console.error('Create group chat error:', error);
        res.status(500).json({ message: 'Error creating group chat' });
      }
    },
    // Thêm thành viên vào nhóm
    addMemberToGroup: async (req, res) => {
      try {
        const { chatId, newMemberId } = req.body;
        const userId = req.user?.id;

        // Kiểm tra xem đoạn chat có tồn tại và là nhóm không
        const chat = await Chat.findOne({ _id: chatId, type: 'group', participants: userId });

        if (!chat) {
          return res.status(404).json({ message: 'Group chat not found or you are not a participant' });
        }

        // Kiểm tra xem thành viên mới đã có trong nhóm chưa
        if (chat.participants.includes(newMemberId)) {
          return res.status(400).json({ message: 'User is already a member of the group' });
        }

        // Thêm thành viên mới vào nhóm
        chat.participants.push(newMemberId);
        await chat.save();

        res.status(200).json({ message: 'Member added successfully', chat });
      } catch (error) {
        console.error('Add member to group error:', error);
        res.status(500).json({ message: 'Error adding member to group' });
      }
    },

    // Xóa thành viên khỏi nhóm
    removeMemberFromGroup: async (req, res) => {
      try {
        const { chatId, memberId } = req.body;
        const userId = req.user?.id;

        // Kiểm tra xem đoạn chat có tồn tại và là nhóm không
        const chat = await Chat.findOne({ _id: chatId, type: 'group', participants: userId });

        if (!chat) {
          return res.status(404).json({ message: 'Group chat not found or you are not a participant' });
        }

        // Kiểm tra xem thành viên có trong nhóm không
        if (!chat.participants.includes(memberId)) {
          return res.status(400).json({ message: 'User is not a member of the group' });
        }

        // Xóa thành viên khỏi nhóm
        chat.participants = chat.participants.filter(id => id.toString() !== memberId);
        await chat.save();

        res.status(200).json({ message: 'Member removed successfully', chat });
      } catch (error) {
        console.error('Remove member from group error:', error);
        res.status(500).json({ message: 'Error removing member from group' });
      }
    },
    // Đổi tên nhóm
    renameGroup: async (req, res) => {
      try {
        const { chatId, newName } = req.body;
        const userId = req.user?.id;

        // Kiểm tra xem đoạn chat có tồn tại và là nhóm không
        const chat = await Chat.findOne({ _id: chatId, type: 'group', participants: userId });

        if (!chat) {
          return res.status(404).json({ message: 'Group chat not found or you are not a participant' });
        }

        // Đổi tên nhóm
        chat.name = newName;
        await chat.save();

        res.status(200).json({ message: 'Group renamed successfully', chat });
      } catch (error) {
        console.error('Rename group error:', error);
        res.status(500).json({ message: 'Error renaming group' });
      }
    },

    // Lấy danh sách chat của người dùng
    getChatsByUser: async (req, res) => {
      try {
        const userId = req.user?.id; // Sử dụng Optional Chaining để tránh lỗi nếu req.user không tồn tại
        // console.log('User ID:', userId);

        if (!userId) {
          return res.status(400).json({ message: 'User ID is missing' });
        }

        const chats = await Chat.find({
          participants: userId
        }).populate('participants', 'name avatar status') // Optional: populate thông tin người dùng
          .populate('lastMessage'); // Optional: populate tin nhắn cuối cùng

        res.status(200).json({ chats });
      } catch (error) {
        console.error('Get chats error:', error);
        res.status(500).json({ message: 'Error getting chats' });
      }
    },

    // Cập nhật tin nhắn mới nhất của chat
    updateLastMessage: async (chatId, messageId) => {
      try {
        await Chat.findByIdAndUpdate(
          chatId,
          { lastMessage: messageId },
          { new: true }
        );

        // Phát tin nhắn mới tới tất cả các client kết nối
        // io.to(chatId).emit('newMessage', messageId);
      } catch (error) {
        console.error('Update last message error:', error);
      }
    },
    //Xoá tin nhắn
    deleteChat: async (req, res) => {
      try {
        const { chatId } = req.params;
        const userId = req.user?.id;
        console.log('User ID:', userId);

        if (!chatId) {
          return res.status(400).json({ message: 'Chat ID is required' });
        }

        // Find the chat to ensure it exists and the requesting user is a participant
        const chat = await Chat.findOne({ _id: chatId, participants: userId });

        if (!chat) {
          return res.status(404).json({ message: 'Chat not found or you are not a participant' });
        }

        // Delete the chat
        await Chat.findByIdAndDelete(chatId);

        // Optionally, you could also delete associated messages if needed
        await Message.deleteMany({ chatId });

        // Notify the participants about the chat deletion if needed
        io.to(chatId).emit('chatDeleted', chatId);

        res.status(200).json({ message: 'Chat deleted successfully' });
      } catch (error) {
        console.error('Delete chat error:', error);
        res.status(500).json({ message: 'Error deleting chat' });
      }
    },
  }

};

module.exports = chatController;
