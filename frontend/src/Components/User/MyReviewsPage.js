import React from 'react';
import UserReviews from '../Reviews/UserReviews';

const MyReviewsPage = () => {
  const userToken = localStorage.getItem('token');

  return (
    <div style={{ 
      maxWidth: '1200px', 
      margin: '2rem auto', 
      padding: '0 1rem' 
    }}>
      <UserReviews userToken={userToken} />
    </div>
  );
};

export default MyReviewsPage;