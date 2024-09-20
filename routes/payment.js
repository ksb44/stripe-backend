// const express = require('express');
// const Stripe = require('stripe');
// const pool = require('../models/db');

// const router = express.Router();
// const stripe = Stripe(process.env.STRIPE_SECRET_KEY);


// router.post('/create', async (req, res) => {
//     const { amount, currency, payment_method_data, description } = req.body;
  
//     console.log(req.body);
  
//     try {
//       const paymentIntent = await stripe.paymentIntents.create({
//         amount,
//         currency,
//         payment_method_data, 
//         description,
//         confirm: true, 
//         automatic_payment_methods: {
//           enabled: true,
//           allow_redirects: 'never', 
//         },
//       });
  
//       console.log(paymentIntent);
//       const { id: paymentId, status } = paymentIntent;
  
//       const queryText = 'INSERT INTO payments(payment_id, amount, currency, status, description) VALUES($1, $2, $3, $4, $5)';
//       await pool.query(queryText, [paymentId, amount, currency, status, description]);
  
//       res.status(201).json({ paymentId, amount, currency, status, description });
//     } catch (error) {
//       res.status(400).json({ error: error.message });
//     }
//   });
  


// router.get('/:id', async (req, res) => {
//   const { id } = req.params;
//   try {
//     const result = await pool.query('SELECT * FROM payments WHERE payment_id = $1', [id]);
//     if (result.rows.length === 0) {
//       return res.status(404).json({ error: 'Payment not found' });
//     }
//     res.json(result.rows[0]);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// module.exports = router;


const express = require('express');
const Stripe = require('stripe');
const supabase = require('../models/supabaseClient');


const router = express.Router();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

router.post('/create', async (req, res) => {
    const { amount, currency, payment_method_data, description } = req.body;
  
    console.log(req.body);
  
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency,
        payment_method_data,
        description,
        confirm: true,
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never',
        },
      });
  
    //   console.log(paymentIntent);
      const { id: paymentId, status } = paymentIntent;
  

      const { data, error } = await supabase
        .from('payments')
        .insert([{ payment_id: paymentId, amount, currency, status, description }]);
  
      if (error) {
        console.error('Supabase Error:', error);
        throw new Error('Error saving payment to Supabase');
      }
  
      res.status(201).json({ paymentId, amount, currency, status, description });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  

router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
   
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('payment_id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
