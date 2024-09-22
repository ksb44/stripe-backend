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

/**
 * @swagger
 * /api/payment/create:
 *   post:
 *     summary: Create a payment
 *     description: Create a payment intent with Stripe and save the payment details in Supabase.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: integer
 *                 description: Amount to charge in the smallest currency unit (e.g., cents for USD).
 *               currency:
 *                 type: string
 *                 description: Three-letter currency code (e.g., usd).
 *               payment_method_data:
 *                 type: object
 *                 description: Stripe payment method data.
 *               description:
 *                 type: string
 *                 description: Payment description.
 *     responses:
 *       201:
 *         description: Payment successfully created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 paymentId:
 *                   type: string
 *                   description: The Stripe payment intent ID.
 *                 amount:
 *                   type: integer
 *                   description: The payment amount.
 *                 currency:
 *                   type: string
 *                   description: The currency code.
 *                 status:
 *                   type: string
 *                   description: The payment status.
 *                 description:
 *                   type: string
 *                   description: The payment description.
 *       400:
 *         description: Bad Request - Invalid input or payment creation failed.
 */
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
  
/**
 * @swagger
 * /api/payment/{id}:
 *   get:
 *     summary: Retrieve payment details
 *     description: Get payment information from Supabase by payment ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The payment ID.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 payment_id:
 *                   type: string
 *                 amount:
 *                   type: integer
 *                 currency:
 *                   type: string
 *                 status:
 *                   type: string
 *                 description:
 *                   type: string
 *       404:
 *         description: Payment not found.
 */
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
