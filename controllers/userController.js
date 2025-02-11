const User = require('../models/User');
const jwt = require('jsonwebtoken');
const Friendship = require('../models/Friend');
const bcrypt = require('bcryptjs');

const userController = {
  register: async (req, res) => {
    try {
      const { email, password, phoneNumber, name } = req.body;

      // Kiểm tra xem email đã tồn tại chưa
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already exists' });
      }

      // Tạo user mới
      const newUser = new User({
        email,
        password,
        phoneNumber,
        name // Thêm trường name vào đối tượng user

    
      });

      // Mã hóa mật khẩu trước khi lưu vào database
      const salt = await bcrypt.genSalt(10);
      newUser.password = await bcrypt.hash(password, salt);

      // Lưu user vào database
      await newUser.save();

      res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Error registering user' });
    }
  },

  // Login
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // Kiểm tra xem user có tồn tại không
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: 'Invalid email or password' });
      }

      // Kiểm tra mật khẩu
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid email or password' });
      }
      // Cập nhật trạng thái người dùng
      user.status = 'online'; // Đặt trạng thái là 'online'
      user.lastSeen = new Date(); // Cập nhật thời gian đăng nhập hiện tại
      await user.save(); // Lưu các thay đổi vào database

      // Tạo token
      const token = jwt.sign({ id: user._id }, 'ZU2TPFrpSxQe', { expiresIn: '1h' });

      // Trả về thông tin người dùng cùng với token
      res.status(200).json({
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          email: user.email,
          phoneNumber: user.phoneNumber,
          name: user.name, // Trả về các thông tin cần thiết của người dùng
          status: user.status // Thêm status vào phản hồi

        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Error logging in user' });
    }
  },

  changePassword: async (req, res) => {
    try {
      const userId = req.user.id;
      const { oldPassword, newPassword, confirmPassword } = req.body;
  
      // Kiểm tra xem mật khẩu mới và xác nhận mật khẩu có khớp không
      if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: 'New password and confirm password do not match' });
      }
  
      // Tìm user theo ID
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Kiểm tra mật khẩu cũ
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Old password is incorrect' });
      }
  
      // Mã hóa mật khẩu mới
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
  
      // Lưu user vào database
      await user.save();
  
      res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ message: 'Error changing password' });
    }
  },
  // Log out
  logout: async (req, res) => {
    try {
      const userId = req.user.id;

      // Cập nhật trạng thái người dùng về 'offline'
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      user.status = 'offline'; // Đặt trạng thái là 'offline'
      user.lastSeen = new Date(); // Cập nhật thời gian đăng xuất hiện tại
      await user.save(); // Lưu các thay đổi vào cơ sở dữ liệu

      res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ message: 'Error logging out user' });
    }
  },


  // Get all users
  getAllUsers: async (req, res) => {
    try {
      const users = await User.find();
      res.status(200).json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Error fetching users' });
    }
  },

  // Get user by ID
  getUserById: async (req, res) => {
    try {
      const { id } = req.params; // Lấy ID từ tham số URL

      // Tìm user theo ID
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.status(200).json(user);
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      res.status(500).json({ message: 'Error fetching user by ID' });
    }
  },
  // Get current user's profile
  getCurrentUserProfile: async (req, res) => {
    try {
      // Lấy ID người dùng từ token
      const userId = req.user.id;

      // Tìm user theo ID
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.status(200).json({
        email: user.email,
        phoneNumber: user.phoneNumber,
        name: user.name,
        avatar: user.avatar // Nếu có trường avatar
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      res.status(500).json({ message: 'Error fetching user profile' });
    }
  },
  // Update user profile
  updateUserProfile: async (req, res) => {
    try {
      const userId = req.user.id;
      const { email, phoneNumber, name, avatar } = req.body;

      // Kiểm tra xem email đã tồn tại chưa (ngoại trừ email của chính người dùng hiện tại)
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already exists' });
      }

      // Cập nhật thông tin người dùng
      const updatedUser = await User.findByIdAndUpdate(userId, {
        email,
        phoneNumber,
        name,
        avatar,
      }, { new: true }); // Trả về đối tượng người dùng đã được cập nhật

      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.status(200).json({
        message: 'Profile updated successfully',
        user: updatedUser
      });
    } catch (error) {
      console.error('Error updating user profile:', error);
      res.status(500).json({ message: 'Error updating user profile' });
    }
  },

  //Gửi kết bạn
  sendFriendRequest: async (req, res) => {
    try {
      const recipientId = req.body.recipientId;
      const requesterId = req.user.id;

      if (requesterId === recipientId) {
        return res.status(400).json({ message: 'Cannot send friend request to yourself.' });
      }

      const existingRequest = await Friendship.findOne({
        requester: requesterId,
        recipient: recipientId
      });

      if (existingRequest) {
        return res.status(400).json({ message: 'Friend request already sent.' });
      }

      const newRequest = new Friendship({
        requester: requesterId,
        recipient: recipientId
      });

      await newRequest.save();
      res.status(201).json({ message: 'Friend request sent.' });
    } catch (error) {
      console.error('Error sending friend request:', error);
      res.status(500).json({ message: 'Error sending friend request' });
    }
  },

  // Chấp nhận yêu cầu kết bạn
  acceptFriendRequest: async (req, res) => {
    try {
      const requestId = req.body.requestId;

      const request = await Friendship.findById(requestId);

      if (!request || request.status !== 'pending') {
        return res.status(400).json({ message: 'Invalid friend request.' });
      }

      request.status = 'accepted';
      await request.save();
      res.status(200).json({ message: 'Friend request accepted.' });
    } catch (error) {
      console.error('Error accepting friend request:', error);
      res.status(500).json({ message: 'Error accepting friend request' });
    }
  },

  // Từ chối yêu cầu kết bạn và xóa khỏi database
  rejectFriendRequest: async (req, res) => {
    try {
      const requestId = req.body.requestId;
  
      const request = await Friendship.findById(requestId);
  
      if (!request || request.status !== 'pending') {
        return res.status(400).json({ message: 'Invalid friend request.' });
      }
  
      await request.deleteOne(); // Xóa lời mời kết bạn khỏi database
  
      res.status(200).json({ message: 'Friend request rejected and removed.' });
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      res.status(500).json({ message: 'Error rejecting friend request' });
    }
  },

  // Lấy danh sách bạn bè
  getFriendsList: async (req, res) => {
    try {
      const userId = req.user.id;

      const friendships = await Friendship.find({
        $or: [{ requester: userId }, { recipient: userId }],
        status: 'accepted'
      }).populate('requester recipient');

      const friends = friendships.map(friendship =>
        friendship.requester._id.equals(userId) ? friendship.recipient : friendship.requester
      );

      res.status(200).json(friends);
    } catch (error) {
      console.error('Error fetching friends list:', error);
      res.status(500).json({ message: 'Error fetching friends list' });
    }
  },

  // Xóa bạn bè
  removeFriend: async (req, res) => {
    try {
      const { friendId } = req.body; // Lấy ID bạn bè từ yêu cầu
      const userId = req.user.id;

      // Tìm và xóa mối quan hệ bạn bè giữa người dùng và bạn bè
      const result = await Friendship.deleteMany({
        $or: [
          { requester: userId, recipient: friendId },
          { requester: friendId, recipient: userId }
        ],
        status: 'accepted'
      });

      if (result.deletedCount === 0) {
        return res.status(404).json({ message: 'Friendship not found or not accepted.' });
      }

      res.status(200).json({ message: 'Friend removed successfully.' });
    } catch (error) {
      console.error('Error removing friend:', error);
      res.status(500).json({ message: 'Error removing friend' });
    }
  },
  // Kiểm tra xem hai người dùng có phải là bạn bè không
  checkFriendship: async (req, res) => {
    try {
      const { userId } = req.params; // Lấy ID người dùng để kiểm tra bạn bè
      const currentUserId = req.user.id; // Lấy ID người dùng hiện tại từ token

      if (userId === currentUserId) {
        return res.status(400).json({ message: 'Cannot check friendship with yourself.' });
      }

      // Tìm mối quan hệ bạn bè giữa hai người
      const friendship = await Friendship.findOne({
        $or: [
          { requester: currentUserId, recipient: userId },
          { requester: userId, recipient: currentUserId }
        ],
        status: 'accepted'
      });

      if (friendship) {
        return res.status(200).json({ message: 'Users are friends.' });
      } else {
        return res.status(200).json({ message: 'Users are not friends.' });
      }
    } catch (error) {
      console.error('Error checking friendship:', error);
      res.status(500).json({ message: 'Error checking friendship' });
    }
  },
 // Lấy danh sách lời mời kết bạn
 getFriendRequests: async (req, res) => {
  try {
    const userId = req.user.id; // Lấy ID người dùng hiện tại từ token

    // Tìm tất cả các lời mời kết bạn mà người dùng hiện tại là người nhận
    const friendRequests = await Friendship.find({
      recipient: userId,
      status: 'pending'
    }).populate('requester', 'name email phoneNumber avatar'); // Populate thông tin người gửi

    res.status(200).json(friendRequests);
  } catch (error) {
    console.error('Error fetching friend requests:', error);
    res.status(500).json({ message: 'Error fetching friend requests' });
  }
},


};

module.exports = userController;
