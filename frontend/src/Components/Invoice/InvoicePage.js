import React from 'react';
import { useLocation } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './InvoicePage.css';

const InvoicePage = () => {
  const location = useLocation();
  const order = location.state?.order || JSON.parse(localStorage.getItem('lastOrder'));

  if (!order) {
    return <div>No order data found.</div>;
  }

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Vithanage Enterprises', 20, 20);
    doc.setFontSize(12);
    doc.text('Contact Us: 123 Main St, Colombo, Sri Lanka', 20, 28);
    doc.text('Phone: +94 77 123 4567 | Email: info@vithanage.com', 20, 34);
    doc.setFontSize(16);
    doc.text('Invoice', 20, 45);
    doc.setFontSize(12);
    doc.text(`Order ID: ${order._id || 'N/A'}`, 20, 55);
    doc.text(`Customer: ${order.customer.fullName}`, 20, 65);
    doc.text(`Email: ${order.customer.email}`, 20, 75);
    doc.text(`Phone: ${order.customer.phone}`, 20, 85);
    doc.text(`Shipping: ${order.shippingAddress.addressLine1}, ${order.shippingAddress.city}, ${order.shippingAddress.state}, ${order.shippingAddress.country}`, 20, 95);

    // Table for items
    const itemRows = order.items.map((item, idx) => [
      idx + 1,
      item.product?.name || 'Product',
      item.quantity,
      `$${(item.product?.price || 0).toFixed(2)}`,
      `$${((item.product?.price || 0) * item.quantity).toFixed(2)}`
    ]);
    autoTable(doc, {
      head: [['#', 'Product', 'Qty', 'Unit Price', 'Total']],
      body: itemRows,
      startY: 105,
      theme: 'grid',
      headStyles: { fillColor: [25, 118, 210] },
      styles: { fontSize: 11 }
    });
    const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 125;

    // Right-align the totals block near the right margin
    const pageWidth = doc.internal.pageSize.getWidth();
    const rightMargin = 20; // keep 20 units margin from right edge

    const lines = [
      `Subtotal: $${order.totals.subtotal.toFixed(2)}`,
      `Discount: $${order.totals.discount.toFixed(2)}`,
      `Shipping: $${order.totals.shipping.toFixed(2)}`,
      `Total: $${order.totals.total.toFixed(2)}`
    ];

    lines.forEach((line, i) => {
      const textWidth = doc.getTextWidth ? doc.getTextWidth(line) : doc.getStringUnitWidth(line) * doc.internal.getFontSize();
      const x = pageWidth - rightMargin - textWidth;
      doc.text(line, x, finalY + 10 + i * 10);
    });
    // Rubber stamp for paid
    doc.setFontSize(32);
    doc.setTextColor(220, 0, 0);
    doc.text('PAID', 140, finalY + 60, { angle: -20 });
    doc.setTextColor(0, 0, 0);
    doc.save('invoice.pdf');
  };

  return (
    <div className="invoice-page">
      <header className="invoice-header">
        <h1>Vithanage Enterprises</h1>
        <div className="invoice-contact">
          <p>Contact Us: 123 Main St, Colombo, Sri Lanka</p>
          <p>Phone: +94 77 123 4567 | Email: info@vithanage.com</p>
        </div>
      </header>
      <h2>Order Invoice</h2>
      <p>Order ID: {order._id || 'N/A'}</p>
      <p>Name: {order.customer.fullName}</p>
      <p>Email: {order.customer.email}</p>
      <p>Phone: {order.customer.phone}</p>
      <p>Shipping: {order.shippingAddress.addressLine1}, {order.shippingAddress.city}, {order.shippingAddress.state}, {order.shippingAddress.country}</p>
      <h3>Items</h3>
      <ul>
        {order.items.map((item, idx) => (
          <li key={idx}>
            {item.product?.name || 'Product'} x{item.quantity} - ${ (item.product?.price * item.quantity).toFixed(2) }
          </li>
        ))}
      </ul>
      <p>Subtotal: ${order.totals.subtotal.toFixed(2)}</p>
      <p>Discount: ${order.totals.discount.toFixed(2)}</p>
      <p>Shipping: ${order.totals.shipping.toFixed(2)}</p>
      <p><strong>Total: ${order.totals.total.toFixed(2)}</strong></p>
      <div className="invoice-paid-stamp">PAID</div>
      <button onClick={handleDownloadPDF}>Download Invoice PDF</button>
    </div>
  );
};

export default InvoicePage;
