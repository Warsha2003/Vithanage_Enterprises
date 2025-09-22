import React, { useState, useEffect } from 'react';
import './ReviewForm.css';

const ReviewForm = ({ productId, userToken, onReviewSubmitted }) => {
    const [canReview, setCanReview] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        rating: 0,
        comment: '',
        title: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (userToken && productId) {
            // Allow any logged-in user to write reviews
            setCanReview(true);
            setLoading(false);
        } else {
            setLoading(false);
        }
    }, [productId, userToken]);

    const handleRatingClick = (rating) => {
        setFormData(prev => ({ ...prev, rating }));
        setError('');
    };

    const handleCommentChange = (e) => {
        setFormData(prev => ({ ...prev, comment: e.target.value }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.rating === 0) {
            setError('Please select a rating');
            return;
        }
        
        if (formData.comment.trim().length < 10) {
            setError('Please write at least 10 characters for your review');
            return;
        }
        
        if (formData.title.trim().length < 5) {
            setError('Please write a title for your review (at least 5 characters)');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            const response = await fetch(`http://localhost:5000/api/reviews`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userToken}`
                },
                body: JSON.stringify({
                    productId: productId,
                    ...formData
                })
            });

            const data = await response.json();

            if (data.success) {
                setSuccess('Review submitted successfully!');
                setFormData({ rating: 0, comment: '', title: '' });
                setCanReview(false);
                
                // Notify parent component
                if (onReviewSubmitted) {
                    onReviewSubmitted();
                }
                
                // Clear success message after 3 seconds
                setTimeout(() => setSuccess(''), 3000);
            } else {
                setError(data.message || 'Failed to submit review');
            }
        } catch (error) {
            console.error('Error submitting review:', error);
            setError('Failed to submit review. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const renderStars = () => {
        return Array.from({ length: 5 }, (_, i) => (
            <button
                key={i}
                type="button"
                className={`star-btn ${i < formData.rating ? 'filled' : ''}`}
                onClick={() => handleRatingClick(i + 1)}
            >
                ★
            </button>
        ));
    };

    if (loading) {
        return <div className="review-form-loading">Checking review eligibility...</div>;
    }

    if (!userToken) {
        return (
            <div className="review-form-message">
                <p>Please log in to write a review</p>
            </div>
        );
    }

    if (!canReview) {
        return (
            <div className="review-form-message">
                <p>{error || 'Unable to load review form'}</p>
            </div>
        );
    }

    return (
        <div className="review-form">
            <h3>Write a Review</h3>
            
            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}
            
            {success && (
                <div className="success-message">
                    {success}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="rating-section">
                    <label>Your Rating:</label>
                    <div className="star-rating">
                        {renderStars()}
                    </div>
                    <span className="rating-text">
                        {formData.rating > 0 && (
                            `${formData.rating} star${formData.rating > 1 ? 's' : ''}`
                        )}
                    </span>
                </div>

                <div className="title-section">
                    <label htmlFor="title">Review Title:</label>
                    <input
                        type="text"
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Summarize your experience..."
                        maxLength={100}
                        required
                    />
                    <div className="character-count">
                        {formData.title.length}/100 characters
                    </div>
                </div>

                <div className="comment-section">
                    <label htmlFor="comment">Your Review:</label>
                    <textarea
                        id="comment"
                        value={formData.comment}
                        onChange={handleCommentChange}
                        placeholder="Share your experience with this product..."
                        rows={4}
                        maxLength={1000}
                    />
                    <div className="character-count">
                        {formData.comment.length}/1000 characters
                    </div>
                </div>

                <button 
                    type="submit" 
                    className="submit-btn"
                    disabled={submitting || formData.rating === 0}
                >
                    {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
            </form>
        </div>
    );
};

export default ReviewForm;