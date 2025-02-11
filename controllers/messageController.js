const Message = require('../models/Message'); // Ensure the path is correct to the Message model
const Chat = require('../models/Chat'); // Ensure the path is correct to the Chat model

const messageController = () => {
    return {
        // Create a new message
        createMessage: async (req, res) => {
            try {
                const { chatId, senderId, content, type, fileUrl } = req.body;

                if (!chatId || !senderId || !content) {
                    return res.status(400).json({
                        success: false,
                        message: 'Chat ID, Sender ID, and Content are required'
                    });
                }

                // Create a new message
                const newMessage = new Message({
                    chat: chatId,
                    sender: senderId,
                    content,
                    type: type || 'text',
                    fileUrl
                });

                await newMessage.save();
                const populatedMessage = await newMessage.populate('sender', 'avatar');


                // Update the lastMessage field in the associated chat
                await Chat.findByIdAndUpdate(
                    chatId,
                    { lastMessage: newMessage._id },
                    { new: true }
                );

                res.status(201).json({
                    success: true,
                    message: 'Message created successfully',
                    data: populatedMessage
                });
            } catch (error) {
                console.error('Create message error:', error);
                res.status(500).json({
                    success: false,
                    message: error.message
                });
            }
        },

        // Get all messages in a chat
        getMessagesByChat: async (req, res) => {
            try {
                const { chatId } = req.params;

                const messages = await Message.find({ chat: chatId })
                    .populate('sender', 'email avatar name') // Adjust according to your needs
                    .populate('readBy', 'email avatar name'); // Adjust according to your needs

                res.status(200).json({
                    success: true,
                    data: messages
                });
            } catch (error) {
                console.error('Get messages error:', error);
                res.status(500).json({
                    success: false,
                    message: error.message
                });
            }
        },

        // Update a message
        updateMessage: async (req, res) => {
            try {
                const { messageId } = req.params;
                const { content, type, fileUrl } = req.body;

                const updatedMessage = await Message.findByIdAndUpdate(
                    messageId,
                    { content, type, fileUrl, updatedAt: Date.now() },
                    { new: true, runValidators: true }
                );

                if (!updatedMessage) {
                    return res.status(404).json({
                        success: false,
                        message: 'Message not found'
                    });
                }

                res.status(200).json({
                    success: true,
                    message: 'Message updated successfully',
                    data: updatedMessage
                });
            } catch (error) {
                console.error('Update message error:', error);
                res.status(500).json({
                    success: false,
                    message: error.message
                });
            }
        },

        // Delete a message
        deleteMessage: async (req, res) => {
            try {
                const { messageId } = req.params;

                const deletedMessage = await Message.findByIdAndDelete(messageId);

                if (!deletedMessage) {
                    return res.status(404).json({
                        success: false,
                        message: 'Message not found'
                    });
                }

                res.status(200).json({
                    success: true,
                    message: 'Message deleted successfully'
                });
            } catch (error) {
                console.error('Delete message error:', error);
                res.status(500).json({
                    success: false,
                    message: error.message
                });
            }
        },

        // Mark a message as read
        markAsRead: async (req, res) => {
            try {
                const { messageId } = req.params;
                const { userId } = req.body;

                const message = await Message.findById(messageId);

                if (!message) {
                    return res.status(404).json({
                        success: false,
                        message: 'Message not found'
                    });
                }

                if (!message.readBy.includes(userId)) {
                    message.readBy.push(userId);
                    await message.save();
                }

                res.status(200).json({
                    success: true,
                    message: 'Message marked as read'
                });
            } catch (error) {
                console.error('Mark as read error:', error);
                res.status(500).json({
                    success: false,
                    message: error.message
                });
            }
        }
    };
};

module.exports = messageController;