# Cricket Platform Frontend

Mobile-first cricket scores and commentary frontend integration plan.

## Required integrations
- Firebase Authentication phone login with SMS OTP and reCAPTCHA.
- Backend API URL configured through environment variables.
- Authorized cricket score provider for real-time scores and commentary.
- Wallet view reads the balance and ledger from the backend only; never calculate or set a real balance in browser state.

## Production checklist
1. Configure Firebase web app and authorized domains.
2. Configure backend API base URL.
3. Connect a cricket data provider with redistribution rights.
4. Test mobile layouts, loading/error states, auth expiration, and admin permissions.
5. Keep deposits/withdrawals disabled until the payment provider and legal review are complete.
