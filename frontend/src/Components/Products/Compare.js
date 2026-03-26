import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faArrowLeft, faStar, faCheck, faXmark } from '@fortawesome/free-solid-svg-icons';
import { useCompare } from './CompareContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import './Compare.css';

const Compare = () => {
  const navigate = useNavigate();
  const { items, removeFromCompare, clearCompare } = useCompare();
  const { formatPrice } = useCurrency();

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating || 0);
    for (let i = 0; i < 5; i++) {
      stars.push(
        <FontAwesomeIcon 
          key={i} 
          icon={faStar} 
          className={i < fullStars ? 'star-filled' : 'star-empty'} 
        />
      );
    }
    return stars;
  };

  const getComparisonSpecs = () => {
    return [
      { key: 'price', label: 'Price', format: (val) => formatPrice(val) },
      { key: 'category', label: 'Category', format: (val) => val || 'N/A' },
      { key: 'brand', label: 'Brand', format: (val) => val || 'N/A' },
      { key: 'rating', label: 'Rating', format: (val) => val ? `${val.toFixed(1)} / 5` : 'No ratings' },
      { key: 'stock', label: 'Availability', format: (val) => val > 0 ? `${val} in stock` : 'Out of stock' },
      { key: 'description', label: 'Description', format: (val) => val || 'No description' }
    ];
  };

  if (items.length === 0) {
    return (
      <div className="compare-container">
        <div className="compare-empty">
          <h2>No Products to Compare</h2>
          <p>Add products to compare by clicking the "Compare" button on product cards.</p>
          <button className="btn-primary" onClick={() => navigate('/products')}>
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="compare-container">
      <div className="compare-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <FontAwesomeIcon icon={faArrowLeft} /> Back
        </button>
        <h1>Compare Products ({items.length})</h1>
        <button className="clear-btn" onClick={clearCompare}>
          <FontAwesomeIcon icon={faTimes} /> Clear All
        </button>
      </div>

      <div className="compare-table-wrapper">
        <table className="compare-table">
          <thead>
            <tr>
              <th className="spec-label-col">Feature</th>
              {items.map(product => (
                <th key={product._id} className="product-col">
                  <div className="compare-product-header">
                    <button 
                      className="remove-product-btn"
                      onClick={() => removeFromCompare(product._id)}
                      title="Remove from compare"
                    >
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                    <img 
                      src={product.imageUrl || 'https://via.placeholder.com/150'} 
                      alt={product.name}
                      onClick={() => navigate(`/products/${product._id}`)}
                    />
                    <h3 onClick={() => navigate(`/products/${product._id}`)}>
                      {product.name}
                    </h3>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {getComparisonSpecs().map(spec => (
              <tr key={spec.key}>
                <td className="spec-label">{spec.label}</td>
                {items.map(product => (
                  <td key={product._id} className="spec-value">
                    {spec.key === 'rating' ? (
                      <div className="rating-cell">
                        <div className="stars">{renderStars(product.rating || product.averageRating)}</div>
                        <span>{spec.format(product.rating || product.averageRating)}</span>
                      </div>
                    ) : spec.key === 'stock' ? (
                      <span className={product.stock > 0 ? 'in-stock' : 'out-of-stock'}>
                        {product.stock > 0 ? (
                          <><FontAwesomeIcon icon={faCheck} /> {spec.format(product.stock)}</>
                        ) : (
                          <><FontAwesomeIcon icon={faXmark} /> Out of stock</>
                        )}
                      </span>
                    ) : spec.key === 'description' ? (
                      <div className="description-cell">
                        {product.description?.substring(0, 150)}
                        {product.description?.length > 150 ? '...' : ''}
                      </div>
                    ) : (
                      spec.format(product[spec.key])
                    )}
                  </td>
                ))}
              </tr>
            ))}
            <tr className="action-row">
              <td className="spec-label">Actions</td>
              {items.map(product => (
                <td key={product._id}>
                  <button 
                    className="view-product-btn"
                    onClick={() => navigate(`/products/${product._id}`)}
                  >
                    View Details
                  </button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {items.length < 4 && (
        <div className="add-more-hint">
          <p>You can compare up to 4 products. <button onClick={() => navigate('/products')}>Add more products</button></p>
        </div>
      )}
    </div>
  );
};

export default Compare;
