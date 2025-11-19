// api/email/preview-template.js
// Endpoint para previsualizar templates de email
const templates = require('./templates');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { template, firstName = 'Julio' } = req.query;

    if (!template) {
      return res.status(400).json({ 
        error: 'Template parameter is required',
        availableTemplates: [
          'welcome',
          'signup_followup_1',
          'signup_followup_2',
          'checkout_abandoned_1',
          'checkout_abandoned_2',
          'checkout_abandoned_3',
          'subscription_welcome'
        ]
      });
    }

    let emailTemplate;
    switch (template) {
      case 'welcome':
        emailTemplate = templates.getWelcomeEmailTemplate({ firstName });
        break;
      case 'signup_followup_1':
        emailTemplate = templates.getSignupFollowUp1({ firstName });
        break;
      case 'signup_followup_2':
        emailTemplate = templates.getSignupFollowUp2({ firstName });
        break;
      case 'checkout_abandoned_1':
        emailTemplate = templates.getCheckoutAbandonedEmail1({ firstName });
        break;
      case 'checkout_abandoned_2':
        emailTemplate = templates.getCheckoutAbandonedEmail2({ firstName });
        break;
      case 'checkout_abandoned_3':
        emailTemplate = templates.getCheckoutAbandonedEmail3({ firstName });
        break;
      case 'subscription_welcome':
        emailTemplate = templates.getSubscriptionWelcomeEmail({ firstName });
        break;
      default:
        return res.status(400).json({ 
          error: 'Invalid template name',
          availableTemplates: [
            'welcome',
            'signup_followup_1',
            'signup_followup_2',
            'checkout_abandoned_1',
            'checkout_abandoned_2',
            'checkout_abandoned_3',
            'subscription_welcome'
          ]
        });
    }

    // Return HTML for preview
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(emailTemplate.html);

  } catch (error) {
    console.error('Error previewing template:', error);
    return res.status(500).json({ error: error.message });
  }
};

