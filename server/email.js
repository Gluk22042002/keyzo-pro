import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: `${__dirname}/../.env` });

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.warn('[Email] SMTP not configured, emails will be logged only');
    return null;
  }
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: parseInt(process.env.SMTP_PORT || '587') === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporter;
}

async function sendMail({ to, subject, html, text }) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@keyzo.pro';
  const transport = getTransporter();

  if (!transport) {
    console.log(`[Email] To: ${to} | Subject: ${subject}`);
    return { success: true, logged: true };
  }

  try {
    const info = await transport.sendMail({ from, to, subject, html, text });
    console.log(`[Email] Sent: ${info.messageId} to ${to}`);
    return { success: true, messageId: info.messageId };
  } catch (e) {
    console.error(`[Email] Error: ${e.message}`);
    return { success: false, error: e.message };
  }
}

export async function sendWelcomeEmail(user) {
  const subject = 'Добро пожаловать на Keyzo.pro!';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #6C5CE7;">Добро пожаловать на Keyzo.pro!</h2>
      <p>Привет, <strong>${user.username}</strong>!</p>
      <p>Спасибо за регистрацию на Keyzo.pro — маркетплейсе цифровых товаров.</p>
      <p>Ваш аккаунт готов к использованию. Вот что вы можете делать:</p>
      <ul>
        <li>Покупать цифровые товары по лучшим ценам</li>
        <li>Продавать товары как продавец</li>
        <li>Участвовать в реферальной программе</li>
      </ul>
      <p style="margin-top: 20px;">
        <a href="https://keyzo.pro" style="background: #6C5CE7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Перейти в магазин</a>
      </p>
      <hr style="margin-top: 30px; border: none; border-top: 1px solid #eee;">
      <p style="color: #888; font-size: 12px;">Keyzo.pro — Маркетплейс цифровых товаров</p>
    </div>`;
  return sendMail({ to: user.email, subject, html });
}

export async function sendOrderConfirmation(order, buyer, product) {
  const subject = `Заказ #${order.id.slice(-8)} оформлен`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #6C5CE7;">Заказ оформлен!</h2>
      <p>Привет, <strong>${buyer.username}</strong>!</p>
      <p>Ваш заказ успешно оформлен.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #888;">Номер заказа</td><td style="padding: 8px; border-bottom: 1px solid #eee;">#${order.id.slice(-8)}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #888;">Товар</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${product.title}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #888;">Сумма</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${order.amount} ₽</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #888;">Статус</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${order.status === 'delivered' ? 'Доставлен' : 'Оплачен'}</td></tr>
      </table>
      ${order.delivery_data ? `<p><strong>Данные для активации:</strong> ${order.delivery_data}</p>` : ''}
      <hr style="margin-top: 30px; border: none; border-top: 1px solid #eee;">
      <p style="color: #888; font-size: 12px;">Keyzo.pro — Маркетплейс цифровых товаров</p>
    </div>`;
  return sendMail({ to: buyer.email, subject, html });
}

export async function sendDisputeNotification(order, user, action) {
  const subject = `Спор по заказу #${order.id.slice(-8)}`;
  const actionText = {
    opened: 'открыт',
    resolved: 'resolved',
    refund: 'возврат оформлен',
  };
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #E74C3C;">Спор по заказу</h2>
      <p>Привет, <strong>${user.username}</strong>!</p>
      <p>Спор по заказу <strong>#${order.id.slice(-8)}</strong> ${actionText[action] || action}.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #888;">Номер заказа</td><td style="padding: 8px; border-bottom: 1px solid #eee;">#${order.id.slice(-8)}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #888;">Сумма</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${order.amount} ₽</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #888;">Причина</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${order.dispute_reason || 'Не указана'}</td></tr>
      </table>
      <p>
        <a href="https://keyzo.pro/orders" style="background: #6C5CE7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Посмотреть заказ</a>
      </p>
      <hr style="margin-top: 30px; border: none; border-top: 1px solid #eee;">
      <p style="color: #888; font-size: 12px;">Keyzo.pro — Маркетплейс цифровых товаров</p>
    </div>`;
  return sendMail({ to: user.email, subject, html });
}

export async function sendPromoEmail(user, promoCode, discountText) {
  const subject = `Специальное предложение для ${user.username}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #6C5CE7;">Специальное предложение!</h2>
      <p>Привет, <strong>${user.username}</strong>!</p>
      <p>Мы подготовили для вас особое предложение:</p>
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
        <p style="font-size: 14px; color: #888; margin: 0;">Ваш промокод</p>
        <p style="font-size: 28px; font-weight: bold; color: #6C5CE7; margin: 8px 0; letter-spacing: 2px;">${promoCode}</p>
        <p style="font-size: 16px; color: #333; margin: 0;">${discountText}</p>
      </div>
      <p>Используйте промокод при оформлении заказа на Keyzo.pro.</p>
      <p style="margin-top: 20px;">
        <a href="https://keyzo.pro" style="background: #6C5CE7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Перейти в магазин</a>
      </p>
      <hr style="margin-top: 30px; border: none; border-top: 1px solid #eee;">
      <p style="color: #888; font-size: 12px;">Keyzo.pro — Маркетплейс цифровых товаров</p>
    </div>`;
  return sendMail({ to: user.email, subject, html });
}
