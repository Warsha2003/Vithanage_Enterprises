const ProductQuestion = require('../Models/ProductQuestion');
const Product = require('../Models/Product');

// Get all questions for a product
exports.getProductQuestions = async (req, res) => {
  try {
    const { productId } = req.params;
    
    const questions = await ProductQuestion.find({ 
      product: productId,
      isPublic: true 
    })
      .populate('user', 'name')
      .populate('answeredBy', 'name role')
      .sort({ createdAt: -1 });

    res.json(questions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ message: 'Error fetching questions' });
  }
};

// Ask a question
exports.askQuestion = async (req, res) => {
  try {
    const { productId } = req.params;
    const { question } = req.body;
    const userId = req.user?.id || req.admin?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const newQuestion = new ProductQuestion({
      product: productId,
      user: userId,
      question: question.trim()
    });

    await newQuestion.save();
    
    // Populate user for response
    await newQuestion.populate('user', 'name');

    res.status(201).json({
      message: 'Question submitted successfully',
      question: newQuestion
    });
  } catch (error) {
    console.error('Error asking question:', error);
    res.status(500).json({ message: 'Error submitting question' });
  }
};

// Answer a question (admin only)
exports.answerQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const { answer } = req.body;
    const adminId = req.admin?.id;

    const question = await ProductQuestion.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    question.answer = answer.trim();
    question.answeredBy = adminId;
    question.answeredAt = new Date();
    
    await question.save();
    await question.populate('user', 'name');
    await question.populate('answeredBy', 'name role');

    res.json({
      message: 'Answer submitted successfully',
      question
    });
  } catch (error) {
    console.error('Error answering question:', error);
    res.status(500).json({ message: 'Error submitting answer' });
  }
};

// Delete a question
exports.deleteQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const userId = req.user?.id || req.admin?.id;
    const isAdmin = !!req.admin;
    
    const question = await ProductQuestion.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Only allow user who asked or admin to delete
    if (question.user.toString() !== userId && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this question' });
    }

    await ProductQuestion.findByIdAndDelete(questionId);

    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Error deleting question:', error);
    res.status(500).json({ message: 'Error deleting question' });
  }
};

// Mark question as helpful
exports.markHelpful = async (req, res) => {
  try {
    const { questionId } = req.params;
    const userId = req.user?.id || req.admin?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const question = await ProductQuestion.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Check if user already marked as helpful
    if (question.helpfulUsers.includes(userId)) {
      // Remove helpful vote
      question.helpfulUsers = question.helpfulUsers.filter(
        id => id.toString() !== userId
      );
      question.helpful = Math.max(0, question.helpful - 1);
    } else {
      // Add helpful vote
      question.helpfulUsers.push(userId);
      question.helpful += 1;
    }

    await question.save();

    res.json({
      helpful: question.helpful,
      isHelpful: question.helpfulUsers.includes(userId)
    });
  } catch (error) {
    console.error('Error marking helpful:', error);
    res.status(500).json({ message: 'Error updating helpful status' });
  }
};

// Get user's questions
exports.getMyQuestions = async (req, res) => {
  try {
    const userId = req.user?.id || req.admin?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const questions = await ProductQuestion.find({ user: userId })
      .populate('product', 'name imageUrl')
      .populate('answeredBy', 'name')
      .sort({ createdAt: -1 });

    res.json(questions);
  } catch (error) {
    console.error('Error fetching user questions:', error);
    res.status(500).json({ message: 'Error fetching your questions' });
  }
};

// Get all unanswered questions (admin)
exports.getUnansweredQuestions = async (req, res) => {
  try {
    const questions = await ProductQuestion.find({ answer: { $exists: false } })
      .populate('product', 'name imageUrl')
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.json(questions);
  } catch (error) {
    console.error('Error fetching unanswered questions:', error);
    res.status(500).json({ message: 'Error fetching questions' });
  }
};
