// Deployment notes: 
// STRIPE_PROD_KEY is the overall api key
// STRIPE_PROD_EP_KEY is the webhook api key, get this from the dashboard

exports.tabulaInstallments = async(request, response) => {
  let stripeKey = null;
  let endpointSecret  = null;

  if(process.env.HOOK_ENV === 'dev'){
    stripeKey = process.env.STRIPE_DEV_KEY
    endpointSecret  =  process.env.STRIPE_DEV_EP_KEY
  }else if(process.env.HOOK_ENV === 'prod'){
    stripeKey = process.env.STRIPE_PROD_KEY
    endpointSecret  =  process.env.STRIPE_PROD_EP_KEY
  }

  const stripe = require("stripe")(stripeKey);
  const sig = request.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(request.rawBody, sig, endpointSecret );
  }
  catch (err) {
    console.log(err)
    response.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'invoice.payment_succeeded':
      try{
        incrementPaymentsCount(event)
      }
      catch(err){
        console.log(err);
        return response.status(400).send(`Webhook Error: ${err}`);
      }   
      break;
    default:
      return response.status(400).end();
  }

  return response.status(200).json({received: true});
};

function incrementPaymentsCount(event){
  const installmentLimit = 6;
  const sub =  event.data.object.lines.data[0];
  if(sub.metadata.hasOwnProperty('installments_paid')){
    let count = parseInt(sub.metadata['installments_paid'])
    count += 1

    const subscriptionObject = stripe.subscriptions.update(
      sub['subscription'],
          {
            metadata: {
              installments_paid: count,
            },
          }
    );

    if(count >= installmentLimit){
      try{
        subscriptionObject.del();
        console.log("Max installments reached, removing sub for customer id: "+ subscriptionObject.customer)
      }catch(err){
        console.log(err);
      }         
    }
  }
}