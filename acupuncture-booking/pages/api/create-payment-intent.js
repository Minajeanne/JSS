import { useState, useEffect } from 'react';
import Head from 'next/head';
import { loadStripe } from '@stripe/stripe-js';
import moment from 'moment';
import styles from '../styles/Home.module.css'; //
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);  //Secure Key

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
    setPaymentStatus(null); // Reset status

    if (!selectedTime) {
      alert('Please select an appointment time.');
      setLoading(false);
      return;
    }

    try {
      // 1. Create a Payment Intent on the server
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 5000 }), // $50.00 (in cents)
      });

      const { clientSecret } = await response.json();
      setClientSecret(clientSecret);

      // 2. Use Stripe.js to confirm the payment
      const stripe = await stripePromise;

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements: stripe.elements({clientSecret: clientSecret}), // Important: Pass the clientSecret
        confirmParams: {
          return_url: `${window.location.origin}/?payment_status=success`, // Redirect after payment
        },
      });

      if (error) {
        console.error(error);
        setPaymentStatus('error');
        alert(`Payment failed: ${error.message}`);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log('Payment succeeded!');
        setPaymentStatus('success');

        //Simulate appointment booking
        alert("Booking Confirmed!");
        //Potentially send confirmation email

        //Remove the booked appointment time from available times
        setAvailableTimes(prevTimes => prevTimes.filter(time => time !== selectedTime));
      }
    } catch (error) {
      console.error("Payment Error:", error);
      setPaymentStatus('error');
      alert("An error occurred during payment processing.");
    } finally {
      setLoading(false);
    }
  };

  const handleTimeChange = (event) => {
    setSelectedTime(event.target.value);
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('payment_status');
    if (status === 'success') {
      setPaymentStatus('success');  //update payment status, but do not remove time again.
    }
  }, []);

  return (
    <div className={styles.container}>
      <Head>
        <title>Acupuncture Booking</title>
        <link rel="icon" href="/favicon.ico" />
        <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css"></link>
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>Book Your Acupuncture Session</h1>

        {paymentStatus === 'success' && (
          <div className={styles.success}>
            <p>Payment successful!  Your appointment is confirmed. You will receive an email shortly.</p>
          </div>
        )}

        {paymentStatus === 'error' && (
          <div className={styles.error}>
            <p>Payment failed. Please try again.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className="form-group">
            <label htmlFor="name">Name:</label>
            <input
              type="text"
              id="name"
              className="form-control"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="time">Select Appointment Time:</label>
            <select id="time" className="form-control" onChange={handleTimeChange} value={selectedTime || ''} required>
              <option value="" disabled>Select a time</option>
              {availableTimes.map((time) => (
                <option key={time} value={time}>
                  {moment(time, 'HH:mm').format('h:mm A')}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Processing...' : 'Book & Pay'}
          </button>
        </form>
      </main>

      <footer className={styles.footer}>
        Powered by Next.js and Stripe
      </footer>
    </div>
  );
}