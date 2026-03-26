import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faQuestionCircle, 
  faThumbsUp, 
  faUserCircle,
  faCheckCircle,
  faSpinner,
  faPaperPlane,
  faTrash
} from '@fortawesome/free-solid-svg-icons';
import './ProductQA.css';

const ProductQA = ({ productId }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newQuestion, setNewQuestion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchQuestions();
  }, [productId]);

  const fetchQuestions = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/questions/product/${productId}`);
      if (response.ok) {
        const data = await response.json();
        setQuestions(data);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitQuestion = async (e) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;

    if (!token) {
      setError('Please login to ask a question');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch(`http://localhost:5000/api/questions/product/${productId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ question: newQuestion })
      });

      const data = await response.json();

      if (response.ok) {
        setQuestions([data.question, ...questions]);
        setNewQuestion('');
      } else {
        setError(data.message || 'Failed to submit question');
      }
    } catch (error) {
      setError('Error submitting question');
    } finally {
      setSubmitting(false);
    }
  };

  const handleHelpful = async (questionId) => {
    if (!token) {
      setError('Please login to mark as helpful');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/questions/${questionId}/helpful`, {
        method: 'POST',
        headers: {
          'x-auth-token': token
        }
      });

      if (response.ok) {
        const data = await response.json();
        setQuestions(questions.map(q => 
          q._id === questionId 
            ? { ...q, helpful: data.helpful, helpfulUsers: data.isHelpful 
                ? [...(q.helpfulUsers || []), currentUser._id]
                : (q.helpfulUsers || []).filter(id => id !== currentUser._id)
              }
            : q
        ));
      }
    } catch (error) {
      console.error('Error marking helpful:', error);
    }
  };

  const handleDelete = async (questionId) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/questions/${questionId}`, {
        method: 'DELETE',
        headers: {
          'x-auth-token': token
        }
      });

      if (response.ok) {
        setQuestions(questions.filter(q => q._id !== questionId));
      }
    } catch (error) {
      console.error('Error deleting question:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const isHelpful = (question) => {
    return question.helpfulUsers?.includes(currentUser._id);
  };

  return (
    <div className="product-qa-section">
      <h3 className="qa-title">
        <FontAwesomeIcon icon={faQuestionCircle} />
        Customer Questions & Answers
      </h3>

      {/* Ask Question Form */}
      <form className="ask-question-form" onSubmit={handleSubmitQuestion}>
        <div className="question-input-wrapper">
          <input
            type="text"
            placeholder="Have a question? Ask other customers and sellers"
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            maxLength={500}
            disabled={submitting}
          />
          <button 
            type="submit" 
            disabled={submitting || !newQuestion.trim()}
            className="submit-question-btn"
          >
            {submitting ? (
              <FontAwesomeIcon icon={faSpinner} spin />
            ) : (
              <FontAwesomeIcon icon={faPaperPlane} />
            )}
            Ask
          </button>
        </div>
        {error && <p className="qa-error">{error}</p>}
      </form>

      {/* Questions List */}
      <div className="questions-list">
        {loading ? (
          <div className="qa-loading">
            <FontAwesomeIcon icon={faSpinner} spin />
            Loading questions...
          </div>
        ) : questions.length === 0 ? (
          <div className="no-questions">
            <p>No questions yet. Be the first to ask!</p>
          </div>
        ) : (
          questions.map((q) => (
            <div key={q._id} className="question-item">
              <div className="question-header">
                <span className="question-label">Q:</span>
                <p className="question-text">{q.question}</p>
              </div>
              <div className="question-meta">
                <span className="asker">
                  <FontAwesomeIcon icon={faUserCircle} />
                  {q.user?.name || 'Anonymous'}
                </span>
                <span className="date">{formatDate(q.createdAt)}</span>
                {q.user?._id === currentUser._id && (
                  <button 
                    className="delete-btn"
                    onClick={() => handleDelete(q._id)}
                    title="Delete question"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                )}
              </div>

              {q.answer && (
                <div className="answer-section">
                  <div className="answer-header">
                    <span className="answer-label">A:</span>
                    <p className="answer-text">{q.answer}</p>
                  </div>
                  <div className="answer-meta">
                    <span className="answerer">
                      <FontAwesomeIcon icon={faCheckCircle} className="verified-icon" />
                      {q.answeredBy?.role === 'admin' ? 'Seller' : q.answeredBy?.name || 'Store'}
                    </span>
                    <span className="date">{formatDate(q.answeredAt)}</span>
                  </div>
                </div>
              )}

              <div className="question-actions">
                <button 
                  className={`helpful-btn ${isHelpful(q) ? 'active' : ''}`}
                  onClick={() => handleHelpful(q._id)}
                >
                  <FontAwesomeIcon icon={faThumbsUp} />
                  Helpful ({q.helpful || 0})
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProductQA;
