import PDFDocument from 'pdfkit';
import { get } from './db.js';

export async function generateInvoice(order, buyer, seller, products) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      info: {
        Title: `Invoice #${order.id.slice(-8)}`,
        Author: 'Keyzo.pro',
        Subject: 'Purchase Invoice',
      },
    });

    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.rect(0, 0, 595.28, 841.89).fill('#FAFBFC');

    doc.fontSize(28).fill('#6C5CE7').font('Helvetica-Bold').text('INVOICE', 50, 50);
    doc.fontSize(10).fill('#888888').font('Helvetica').text('Keyzo.pro — Digital Marketplace', 50, 82);

    doc.fontSize(10).fill('#333333').font('Helvetica-Bold');
    doc.text('Invoice Number:', 380, 50);
    doc.text('Date:', 380, 65);
    doc.text('Status:', 380, 80);
    doc.fontSize(10).fill('#333333').font('Helvetica');
    doc.text(`#${order.id.slice(-8)}`, 470, 50);
    doc.text(new Date(order.created_at).toLocaleDateString('ru-RU'), 470, 65);
    const statusColors = { paid: '#F39C12', delivered: '#3498DB', completed: '#27AE60', disputed: '#E74C3C', refunded: '#95A5A6' };
    doc.fill(statusColors[order.status] || '#333333').text(order.status.toUpperCase(), 470, 80);

    doc.moveTo(50, 110).lineTo(545, 110).stroke('#E0E0E0');

    doc.fontSize(11).fill('#6C5CE7').font('Helvetica-Bold').text('Buyer', 50, 125);
    doc.fontSize(10).fill('#333333').font('Helvetica');
    doc.text(buyer.username, 50, 142);
    doc.fontSize(9).fill('#888888').text(buyer.email, 50, 156);

    doc.fontSize(11).fill('#6C5CE7').font('Helvetica-Bold').text('Seller', 320, 125);
    doc.fontSize(10).fill('#333333').font('Helvetica');
    doc.text(seller.username, 320, 142);
    doc.fontSize(9).fill('#888888').text(seller.email, 320, 156);

    let y = 200;
    doc.rect(50, y, 495, 28).fill('#6C5CE7');
    doc.fontSize(9).fill('#FFFFFF').font('Helvetica-Bold');
    doc.text('Product', 60, y + 9, { width: 200 });
    doc.text('Qty', 280, y + 9, { width: 40 });
    doc.text('Unit Price', 340, y + 9, { width: 70 });
    doc.text('Total', 440, y + 9, { width: 100 });
    y += 32;

    doc.font('Helvetica').fontSize(10).fill('#333333');
    let subtotal = 0;
    for (const item of products) {
      if (y > 720) {
        doc.addPage();
        y = 50;
      }
      const itemTotal = Number(item.price) * (item.quantity || 1);
      subtotal += itemTotal;

      doc.fill('#333333');
      doc.text(item.title || 'Product', 60, y, { width: 200, ellipsis: true });
      doc.text(String(item.quantity || 1), 280, y, { width: 40 });
      doc.text(`${Number(item.price).toFixed(2)} ₽`, 340, y, { width: 70 });
      doc.text(`${itemTotal.toFixed(2)} ₽`, 440, y, { width: 100 });

      y += 22;
      doc.moveTo(50, y - 4).lineTo(545, y - 4).stroke('#F0F0F0');
    }

    y += 10;
    const commission = Number(order.commission) || 0;
    const discount = Number(order.discount) || 0;
    const total = Number(order.amount) || subtotal - discount;

    doc.fontSize(10).fill('#555555').font('Helvetica');
    doc.text('Subtotal:', 380, y);
    doc.text(`${subtotal.toFixed(2)} ₽`, 440, y, { width: 100, align: 'right' });
    y += 20;

    if (discount > 0) {
      doc.fill('#27AE60').text('Discount:', 380, y);
      doc.text(`-${discount.toFixed(2)} ₽`, 440, y, { width: 100, align: 'right' });
      y += 20;
    }

    doc.fill('#888888').text('Commission (platform):', 380, y);
    doc.text(`${commission.toFixed(2)} ₽`, 440, y, { width: 100, align: 'right' });
    y += 10;

    doc.moveTo(380, y).lineTo(545, y).stroke('#6C5CE7');
    y += 8;

    doc.fontSize(13).fill('#6C5CE7').font('Helvetica-Bold');
    doc.text('Total:', 380, y);
    doc.text(`${total.toFixed(2)} ₽`, 440, y, { width: 100, align: 'right' });

    y += 40;
    doc.moveTo(50, y).lineTo(545, y).stroke('#E0E0E0');
    y += 15;

    doc.fontSize(9).fill('#888888').font('Helvetica');
    doc.text('This invoice is generated automatically by Keyzo.pro platform.', 50, y);
    y += 14;
    doc.text('Payment is held in escrow until buyer confirms delivery.', 50, y);
    y += 14;
    doc.text('For questions, contact support@keyzo.pro', 50, y);
    y += 20;

    doc.fontSize(8).fill('#BBBBBB').text('Keyzo.pro — Digital Marketplace | keyzo.pro', 50, y, { align: 'center', width: 495 });

    doc.end();
  });
}

export function pdfRoutes(app, auth) {
  app.get('/api/invoice/:orderId', auth, async (req, res) => {
    try {
      const { getAll } = await import('./db.js');

      const order = await get('SELECT * FROM orders WHERE id = $1', [req.params.orderId]);
      if (!order) return res.status(404).json({ error: 'Order not found' });

      if (order.buyer_id !== req.user.id && order.seller_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
      }

      const buyer = await get('SELECT id, username, email FROM users WHERE id = $1', [order.buyer_id]);
      const seller = await get('SELECT id, username, email FROM users WHERE id = $1', [order.seller_id]);
      const product = await get('SELECT title, price FROM products WHERE id = $1', [order.product_id]);

      const products = [{ title: product?.title || 'Unknown Product', price: order.amount, quantity: 1 }];

      const pdfBuffer = await generateInvoice(order, buyer, seller, products);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="invoice-${order.id.slice(-8)}.pdf"`);
      res.send(pdfBuffer);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
}
