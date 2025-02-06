import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { loadStripe } from '@stripe/stripe-js';
import moment from 'moment';
import styles from '/styles/Home.module.css'; // Create this!

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);  // Secure Key

export default function Home() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedTime, setSelectedTime] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null); // 'success', 'error', null
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState('');  // Store client secret
  const [availableTimes, setAvailableTimes] = useState([]);

  // Simulated appointment times
  const availableAppointmentTimes = [
    '09:00', '10:00', '11:00', '13:00', '14:00', '15:00'
  ];

  // Stripe Appearance API
  useEffect(() => {
    // As soon as the API loads Stripe, we can call the Appearance API
    stripePromise.then(() => {
      const appearance = {
        theme: 'stripe',
      };
      const stripe = new Stripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, {
        appearance,
      });
    });
  }, []);

  // Populate available times on component mount
  useEffect(() => {
    setAvailableTimes(availableAppointmentTimes);
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    // Create a PaymentIntent on the server
    const res = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, selectedTime }),
    });

    const { clientSecret } = await res.json();
    setClientSecret(clientSecret);

    // Confirm the payment with Stripe
    const stripe = await stripePromise;
    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement),
        billing_details: {
          name,
          email,
        },
      },
    });

    if (error) {
      setPaymentStatus('error');
    } else if (paymentIntent.status === 'succeeded') {
      setPaymentStatus('success');
    }

    setLoading(false);
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Acupuncture Booking</title>
        <meta name="description" content="Book your acupuncture appointment" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>Book Your Appointment</h1>

        <form onSubmit={handleSubmit} className={styles.form}>
          <label>
            Name:
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label>
            Email:
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            Select Time:
            <select
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              required
            >
              <option value="" disabled>Select a time</option>
              {availableTimes.map((time) => (
                <option key={time} value={time}>
                  {moment(time, 'HH:mm').format('h:mm A')}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" disabled={loading}>
            {loading ? 'Processing...' : 'Book Appointment'}
          </button>
        </form>

        {paymentStatus === 'success' && <p>Payment successful!</p>}
        {paymentStatus === 'error' && <p>Payment failed. Please try again.</p>}
      </main>
    </div>
  );
}