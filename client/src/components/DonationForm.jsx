import React, { useState } from 'react';
import api from '../api/axios';

const DonationForm = ({ campaignId, onDonationSuccess }) => {
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setStatusMsg({ type: 'error', text: 'Please enter a valid amount greater than 0' });
      setLoading(false);
      return;
    }

    try {
      // Simulate stripe_payment_id if using card
      const stripe_payment_id = paymentMethod === 'card' ? `ch_${Math.random().toString(36).substring(2, 12)}` : null;

      const response = await api.post('/donations', {
        campaign_id: campaignId,
        amount: parsedAmount,
        message,
        stripe_payment_id,
      });

      setStatusMsg({ type: 'success', text: `Thank you! Your donation of $${parsedAmount} was successful.` });
      setAmount('');
      setMessage('');
      
      // Trigger callback to reload details/donors list in parent component
      if (onDonationSuccess) {
        onDonationSuccess();
      }
    } catch (error) {
      console.error('Donation request failed:', error);
      setStatusMsg({
        type: 'error',
        text: error.response?.data?.message || 'Failed to process donation. Please login or try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {statusMsg && (
        <div
          className={`p-3 rounded-xl text-sm font-medium ${
            statusMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-red-50 text-red-800 border border-red-100'
          }`}
        >
          {statusMsg.text}
        </div>
      )}

      <div>
        <label className="block mb-1 text-sm font-semibold text-gray-700">Donation Amount ($)</label>
        <input
          type="number"
          min="1"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          placeholder="Enter amount (e.g. 50)"
          required
        />
      </div>

      <div>
        <label className="block mb-1 text-sm font-semibold text-gray-700">Optional Message</label>
        <textarea
          rows="3"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          placeholder="Leave a word of encouragement..."
        ></textarea>
      </div>

      <div>
        <label className="block mb-2 text-sm font-semibold text-gray-700">Payment Option</label>
        <div className="grid grid-cols-2 gap-4">
          <label
            className={`border rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition ${
              paymentMethod === 'card' ? 'border-emerald-600 bg-emerald-50/50' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <input
              type="radio"
              name="paymentMethod"
              value="card"
              checked={paymentMethod === 'card'}
              onChange={() => setPaymentMethod('card')}
              className="sr-only"
            />
            <span className="font-semibold text-sm text-gray-900">Credit / Debit Card</span>
            <span className="text-xs text-gray-500 mt-1">Stripe</span>
          </label>
          <label
            className={`border rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition ${
              paymentMethod === 'jazzcash' ? 'border-emerald-600 bg-emerald-50/50' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <input
              type="radio"
              name="paymentMethod"
              value="jazzcash"
              checked={paymentMethod === 'jazzcash'}
              onChange={() => setPaymentMethod('jazzcash')}
              className="sr-only"
            />
            <span className="font-semibold text-sm text-gray-900">Mobile Wallet</span>
            <span className="text-xs text-gray-500 mt-1">JazzCash</span>
          </label>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white font-semibold rounded-xl transition duration-200 shadow-md hover:shadow-lg"
      >
        {loading ? 'Processing...' : `Donate $${amount || '0'}`}
      </button>
    </form>
  );
};

export default DonationForm;
