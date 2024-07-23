const { User } = require('../models');
const { signToken } = require('../utils/auth');



const resolvers = {
  query: {
    me: async (parent, args, context) => {
      if (context.user) {
        const userData = await User.findOne({ _id: context.user._id })
          .select('-__v -password')
          .populate('savedBooks');

        return userData;
      }

      throw new AuthenticationError('Not logged in');
    },
  },
  mutation: {
    login: async (parent, { email, password }) => {
      const user = await User.findOne ({ email, password });
      const correctPw = await user.isCorrectPassword(password);
      if (!correctPw) {
        throw new AuthenticationError('Incorrect Password');
      }
      if (!user) {
        throw new AuthenticationError('Cannot find a user with this email address');
      }
      const token = signToken(user);
      return { token, user };
    },
    addUser: async (parent, { email, password }) => {
      const user = await User.create(args);
      const token = signToken(user);

      return { token, user };
    },
    saveBook: async (parent, { bookData }, context) => {
      if (context.user) {
        const updatedUser = await User.findOneAndUpdate(
          { _id: context.user._id },
          { $addToSet: { savedBooks: bookData } },
          { new: true }
        );
      return updatedUser;
      }
    },
    removeBook: async (parent, { bookId }, context) => {
      if (context.user) {
        const updatedUser = await User.findOneAndUpdate(
          { _id: context.user._id },
          { $pull: { savedBooks: { bookId } } },
          { new: true }
        );
        return updatedUser;
      }
    },
  },
};

module.exports = resolvers;

