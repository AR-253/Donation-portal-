import React, { useState } from 'react';
import api from '../api/axios';
import { toast } from 'react-hot-toast';

const DonationForm = ({ campaignId, onDonationSuccess }) => {
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank');
  const [transactionId, setTransactionId] = useState('');
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

    if (!transactionId.trim()) {
      setStatusMsg({ type: 'error', text: 'Please enter the Transaction ID / Reference ID' });
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/donations', {
        campaign_id: campaignId,
        amount: parsedAmount,
        message,
        stripe_payment_id: `${paymentMethod.toUpperCase()}: ${transactionId.trim()}`,
      });

      setStatusMsg({ 
        type: 'success', 
        text: `JazakAllah! Your donation of $${parsedAmount} has been recorded successfully under reference ID ${transactionId.trim()}.` 
      });
      toast.success('Donation completed successfully!');
      setAmount('');
      setMessage('');
      setTransactionId('');
      
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
          className={`p-3.5 rounded-xl text-sm font-medium ${
            statusMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-red-50 text-red-800 border border-red-100'
          }`}
        >
          {statusMsg.text}
        </div>
      )}

      <div>
        <label className="block mb-1 text-xs font-bold text-gray-700 uppercase tracking-wider">Donation Amount ($)</label>
        <input
          type="number"
          min="1"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-semibold"
          placeholder="Enter amount (e.g. 50)"
          required
        />
      </div>

      <div>
        <label className="block mb-1 text-xs font-bold text-gray-700 uppercase tracking-wider">Optional Message</label>
        <textarea
          rows="2"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
          placeholder="Leave a word of encouragement..."
        ></textarea>
      </div>

      <div>
        <label className="block mb-2 text-xs font-bold text-gray-700 uppercase tracking-wider">Payment Method</label>
        <div className="grid grid-cols-2 gap-4">
          <label
            className={`border rounded-xl p-3.5 flex flex-col items-center justify-center cursor-pointer transition ${
              paymentMethod === 'bank' ? 'border-emerald-600 bg-emerald-50/50 shadow-2xs' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <input
              type="radio"
              name="paymentMethod"
              value="bank"
              checked={paymentMethod === 'bank'}
              onChange={() => setPaymentMethod('bank')}
              className="sr-only"
            />
            <span className="font-bold text-sm text-gray-900">Bank Transfer</span>
            <span className="text-[10px] text-emerald-700 font-bold mt-1 bg-emerald-50 px-2 py-0.5 rounded">BankIslami</span>
          </label>
          <label
            className={`border rounded-xl p-3.5 flex flex-col items-center justify-center cursor-pointer transition ${
              paymentMethod === 'jazzcash' ? 'border-emerald-600 bg-emerald-50/50 shadow-2xs' : 'border-gray-200 hover:border-gray-300'
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
            <span className="font-bold text-sm text-gray-900">Mobile Wallet</span>
            <span className="text-[10px] text-amber-700 font-bold mt-1 bg-amber-50 px-2 py-0.5 rounded">JazzCash / Raast</span>
          </label>
        </div>
      </div>

      {/* Account details card based on method selection */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3">
        <h4 className="font-bold text-xs text-gray-400 uppercase tracking-widest">
          {paymentMethod === 'bank' ? '🏦 BankIslami Details' : '📱 Wallet / Raast Details'}
        </h4>
        
        {paymentMethod === 'bank' ? (
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Account Title:</span>
              <span className="font-bold text-gray-800">IBTIDAA WELFARE FOUNDATION</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Account Number:</span>
              <span className="font-mono font-bold text-emerald-700 select-all">305215692520001</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">IBAN:</span>
              <span className="font-mono font-bold text-gray-800 select-all">PK91BKIP0305215692520001</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Branch:</span>
              <span className="font-bold text-gray-700">G-6 Markaz, Islamabad (Code: 3052)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Swift Code:</span>
              <span className="font-mono font-bold text-gray-800">BKIPPKKA</span>
            </div>
          </div>
        ) : (
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Account Title:</span>
              <span className="font-bold text-gray-800">IBTIDAA WELFARE FOUNDATION</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">JazzCash Mobile No:</span>
              <span className="font-mono font-bold text-emerald-700 select-all">0326 8200015</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">JazzCash Till ID:</span>
              <span className="font-mono font-bold text-gray-800 select-all">982550170</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Raast ID / IBAN:</span>
              <span className="font-mono font-bold text-gray-800 select-all">PK44JCMA1002923268200015</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Raast Contact Name:</span>
              <span className="font-bold text-gray-700">Mr. Saqib Akram</span>
            </div>
          </div>
        )}
        <div className="text-[10px] text-gray-400 bg-white/70 border border-gray-100 rounded-lg p-2 leading-relaxed">
          <strong>Step 1:</strong> Transfer the money from your banking / wallet app to the details above. <br/>
          <strong>Step 2:</strong> Copy the Transaction ID / Reference ID and paste it in the field below to complete your donation.
        </div>
      </div>

      <div>
        <label className="block mb-1 text-xs font-bold text-gray-700 uppercase tracking-wider">Transaction ID / Reference ID *</label>
        <input
          type="text"
          value={transactionId}
          onChange={(e) => setTransactionId(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono text-sm"
          placeholder="e.g. 120283948572"
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white font-extrabold rounded-xl transition duration-200 shadow-md hover:shadow-lg active:scale-98 cursor-pointer"
      >
        {loading ? 'Processing...' : `Donate $${amount || '0'} Instantly`}
      </button>
    </form>
  );
};

export default DonationForm;
