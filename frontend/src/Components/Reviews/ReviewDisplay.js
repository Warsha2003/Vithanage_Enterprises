import React, { useState, useEffect } from 'react';
import './ReviewDisplay.css';

const ReviewDisplay = ({ productId, userToken }) => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [averageRating, setAverageRating] = useState(0);
    const [ratingDistribution, setRatingDistribution] = useState({});

    useEffect(() => {
        fetchReviews();
    }, [productId, currentPage]);

    const fetchReviews = async () => {
        try {
            console.log(`Fetching reviews for product: ${productId}`);
            const response = await fetch(
                `http://localhost:5000/api/reviews/product/${productId}?page=${currentPage}&limit=5`
            );
            const data = await response.json();
            
            console.log('Reviews API response:', data);
            
            if (data.success && data.data) {
                setReviews(data.data.reviews || []);
                setTotalPages(data.data.totalPages || 1);
                setAverageRating(data.data.stats?.averageRating || 0);
                setRatingDistribution(data.data.stats?.distribution || {});
            } else {
                setReviews([]);
            }
        } catch (error) {
            console.error('Error fetching reviews:', error);
            setReviews([]); // Ensure reviews is always an array
        } finally {
            setLoading(false);
        }
    };

    const renderStars = (rating) => {
        return Array.from({ length: 5 }, (_, i) => (
            <span key={i} className={`star ${i < rating ? 'filled' : ''}`}>
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

    const handleLikeToggle = async (reviewId) => {
        if (!userToken) return;

        try {
            const response = await fetch(`http://localhost:5000/api/reviews/${reviewId}/like`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${userToken}`
                }
            });

            if (response.ok) {
                fetchReviews(); // Refresh reviews
            }
        } catch (error) {
            console.error('Error toggling like:', error);
        }
    };

    if (loading) {
        return <div className="review-loading">Loading reviews...</div>;
    }

    return (
        <div className="review-display">
            {/* Rating Summary */}
            <div className="rating-summary">
                <div className="average-rating">
                    <div className="rating-number">{averageRating.toFixed(1)}</div>
                    <div className="rating-stars">
                        {renderStars(Math.round(averageRating))}
                    </div>
                    <div className="total-reviews">
                        Based on {reviews?.length || 0} reviews
                    </div>
                </div>

                <div className="rating-breakdown">
                    {[5, 4, 3, 2, 1].map(rating => (
                        <div key={rating} className="rating-bar">
                            <span>{rating} ★</span>
                            <div className="bar">
                                <div 
                                    className="bar-fill"
                                    style={{ 
                                        width: `${ratingDistribution[rating] || 0}%` 
                                    }}
                                ></div>
                            </div>
                            <span>{ratingDistribution[rating] || 0}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Reviews List */}
            <div className="reviews-list">
                {!reviews || reviews.length === 0 ? (
                    <div className="no-reviews">
                        <p>No reviews yet. Be the first to review this product!</p>
                    </div>
                ) : (
                    reviews.map(review => (
                        <div key={review._id} className="review-item">
                            <div className="review-header">
                                <div className="reviewer-info">
                                    <span className="reviewer-name">
                                        {review.user?.name || 'Anonymous'}
                                    </span>
                                    <div className="review-rating">
                                        {renderStars(review.rating)}
                                    </div>
                                </div>
                                <div className="review-date">
                                    {formatDate(review.createdAt)}
                                </div>
                            </div>

                            <div className="review-content">
                                <p>{review.comment}</p>
                            </div>

                            {review.adminResponse && (
                                <div className="admin-response">
                                    <div className="admin-badge">Admin Response</div>
                                    <p>{review.adminResponse}</p>
                                </div>
                            )}

                            <div className="review-actions">
                                <button 
                                    className={`like-btn ${Array.isArray(review.likes) && review.likes.includes(userToken) ? 'liked' : ''}`}
                                    onClick={() => handleLikeToggle(review._id)}
                                    disabled={!userToken}
                                >
                                    👍 {Array.isArray(review.likes) ? review.likes.length : 0}
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="pagination">
                    <button 
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </button>
                    
                    <span className="page-info">
                        Page {currentPage} of {totalPages}
                    </span>
                    
                    <button 
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default ReviewDisplay;