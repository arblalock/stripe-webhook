// Deployment note: stripe_key needs to be set as an env variable during cloud function deployment/testing

exports.tabulaInstallments = async(request, response) => {
  let stripe_key = null;
  if(process.env.ENV === 'dev'){
    stripe_key = process.env.STRIPE_DEV_KEY
  }else if(process.env.ENV === 'prod'){
    stripe_key = process.env.STRIPE_PROD_KEY
  }

  console.log(stripe_key)
  let event;

  try {
    console.log(request.body);
    event = JSON.parse(request.body);
  }
  catch (err) {
    return response.status(400).send(`Webhook Error: ${err.message}`);
  }


  return response.send('Hello, World');
};