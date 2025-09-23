import React, { useState, useEffect } from 'react';
import './UserReviews.css';

const UserReviews = ({ userToken }) => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingReview, setEditingReview] = useState(null);
    const [editFormData, setEditFormData] = useState({
        rating: 0,
        comment: ''
    });
    const [message, setMessage] = useState({ type: '', text: '' });
    const [updating, setUpdating] = useState(false);
    const [deleting, setDeleting] = useState(null);

    useEffect(() => {
        if (userToken) {
            fetchUserReviews();
        } else {
            setLoading(false);
            setReviews([]);
        }
    }, [userToken]);

    const fetchUserReviews = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/reviews/my-reviews', {
                headers: {
                    'Authorization': `Bearer ${userToken}`
                }
            });
            
            const data = await response.json();
            if (data.success && data.data) {
                setReviews(data.data.reviews || []);
            } else {
                setReviews([]);
            }
        } catch (error) {
            console.error('Error fetching user reviews:', error);
            setReviews([]); // Ensure reviews is always an array
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (review) => {
        setEditingReview(review._id);
        setEditFormData({
            rating: review.rating,
            comment: review.comment
        });
    };

    const handleCancelEdit = () => {
        setEditingReview(null);
        setEditFormData({ rating: 0, comment: '' });
    };

    const handleUpdateReview = async (reviewId) => {
        if (!editFormData.comment.trim()) {
            setMessage({ type: 'error', text: 'Please provide a comment for your review' });
            return;
        }

        if (editFormData.rating === 0) {
            setMessage({ type: 'error', text: 'Please select a rating for your review' });
            return;
        }

        setUpdating(true);
        setMessage({ type: '', text: '' });

        try {
            const response = await fetch(`http://localhost:5000/api/reviews/${reviewId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userToken}`
                },
                body: JSON.stringify(editFormData)
            });

            const data = await response.json();
            if (data.success) {
                setMessage({ type: 'success', text: 'Review updated successfully!' });
                fetchUserReviews(); // Refresh the list
                setEditingReview(null);
                setEditFormData({ rating: 0, comment: '' });
                
                // Clear success message after 3 seconds
                setTimeout(() => setMessage({ type: '', text: '' }), 3000);
            } else {
                setMessage({ type: 'error', text: data.message || 'Failed to update review' });
            }
        } catch (error) {
            console.error('Error updating review:', error);
            setMessage({ type: 'error', text: 'Failed to update review. Please try again.' });
        } finally {
            setUpdating(false);
        }
    };

    const handleDeleteReview = async (reviewId) => {
        if (!window.confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
            return;
        }

        setDeleting(reviewId);
        setMessage({ type: '', text: '' });

        try {
            const response = await fetch(`http://localhost:5000/api/reviews/${reviewId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${userToken}`
                }
            });

            const data = await response.json();
            if (data.success) {
                setMessage({ type: 'success', text: 'Review deleted successfully!' });
                fetchUserReviews(); // Refresh the list
                
                // Clear success message after 3 seconds
                setTimeout(() => setMessage({ type: '', text: '' }), 3000);
            } else {
                setMessage({ type: 'error', text: data.message || 'Failed to delete review' });
            }
        } catch (error) {
            console.error('Error deleting review:', error);
            setMessage({ type: 'error', text: 'Failed to delete review. Please try again.' });
        } finally {
            setDeleting(null);
        }
    };

    const renderStars = (rating, isEditable = false, onRatingChange = null) => {
        return Array.from({ length: 5 }, (_, i) => (
            <span
                key={i}
                className={`star ${i < rating ? 'filled' : ''} ${isEditable ? 'editable' : ''}`}
                onClick={isEditable ? () => onRatingChange(i + 1) : undefined}
            >
                ★
            </span>
        ));
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const canEdit = (review) => {
        const reviewDate = new Date(review.createdAt);
        const now = new Date();
        const daysDiff = (now - reviewDate) / (1000 * 60 * 60 * 24);
        return daysDiff <= 30; // Can edit within 30 days
    };

    if (loading) {
        return <div className="user-reviews-loading">Loading your reviews...</div>;
    }

    if (!userToken) {
        return (
            <div className="user-reviews-message">
                <p>Please log in to view your reviews</p>
            </div>
        );
    }

    return (
        <div className="user-reviews">
            <h2>My Reviews</h2>

            {message.text && (
                <div className={`message ${message.type}`}>
                    {message.text}
                </div>
            )}

            {!reviews || reviews.length === 0 ? (
                <div className="no-reviews">
                    <p>You haven't written any reviews yet.</p>
                </div>
            ) : (
                <div className="reviews-grid">
                    {reviews.map(review => (
                        <div key={review._id} className="review-card">
                            <div className="review-header">
                                <div className="product-info">
                                    <h3>{review.product?.name || 'Product'}</h3>
                                    <div className="review-date">
                                        {formatDate(review.createdAt)}
                                    </div>
                                </div>
                                
                                {editingReview === review._id ? (
                                    <div className="rating-edit">
                                        {renderStars(editFormData.rating, true, (rating) => 
                                            setEditFormData(prev => ({ ...prev, rating }))
                                        )}
                                    </div>
                                ) : (
                                    <div className="rating-display">
                                        {renderStars(review.rating)}
                                    </div>
                                )}
                            </div>

                            <div className="review-content">
                                {editingReview === review._id ? (
                                    <textarea
                                        value={editFormData.comment}
                                        onChange={(e) => setEditFormData(prev => ({ 
                                            ...prev, 
                                            comment: e.target.value 
                                        }))}
                                        className="edit-textarea"
                                        rows={4}
                                    />
                                ) : (
                                    <p>{review.comment}</p>
                                )}
                            </div>

                            {review.adminResponse && (
                                <div className="admin-response">
                                    <div className="admin-badge">Admin Response</div>
                                    <p>{review.adminResponse.comment || review.adminResponse}</p>
                                    {review.adminResponse.respondedAt && (
                                        <div className="response-date">
                                            Responded on: {formatDate(review.adminResponse.respondedAt)}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="review-status">
                                <span className={`status-badge ${review.isApproved ? 'approved' : 'pending'}`}>
                                    {review.isApproved ? 'Approved' : 'Pending Approval'}
                                </span>
                                
                                {review.likes && review.likes.length > 0 && (
                                    <span className="likes-count">
                                        👍 {review.likes.length}
                                    </span>
                                )}
                            </div>

                            <div className="review-actions">
                                {editingReview === review._id ? (
                                    <>
                                        <button 
                                            className="save-btn"
                                            onClick={() => handleUpdateReview(review._id)}
                                            disabled={updating}
                                        >
                                            {updating ? 'Saving...' : 'Save Changes'}
                                        </button>
                                        <button 
                                            className="cancel-btn"
                                            onClick={handleCancelEdit}
                                        >
                                            Cancel
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        {canEdit(review) && (
                                            <button 
                                                className="edit-btn"
                                                onClick={() => handleEdit(review)}
                                            >
                                                Edit
                                            </button>
                                        )}
                                        <button 
                                            className="delete-btn"
                                            onClick={() => handleDeleteReview(review._id)}
                                            disabled={deleting === review._id}
                                        >
                                            {deleting === review._id ? 'Deleting...' : 'Delete'}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default UserReviews;