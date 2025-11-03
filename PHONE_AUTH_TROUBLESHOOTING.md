# Phone Authentication Troubleshooting Guide

## Problem: Not Receiving OTP

### Step 1: Check Console Errors
1. Open browser console (F12)
2. Try sending OTP
3. Look for error messages

### Step 2: Check Twilio Settings in Supabase

Go to: **Supabase Dashboard → Authentication → Providers → Phone**

**Required Settings:**
- ☑ Phone provider enabled
- ☑ Twilio Account SID filled in
- ☑ Twilio Auth Token filled in  
- ☑ Twilio Phone Number filled in (format: +15551234567)
- ☑ Twilio Messaging Service SID (optional)

### Step 3: Check Twilio Account

**In Twilio Console (https://console.twilio.com/):**

1. **Verify your phone number:**
   - Numbers → Manage → Active numbers
   - You should see a verified number

2. **Check balance:**
   - Home → Account Summary
   - Must have credit available (trial has $15 credit)

3. **Check SMS logs:**
   - Monitor → Logs → Messaging
   - Look for failed SMS attempts

### Step 4: Common Issues

#### Issue: "Authentication is disabled"
**Solution:** Enable phone provider in Supabase

#### Issue: "Invalid phone number"
**Solution:** 
- Use E.164 format: +4791234567 (Norwegian number)
- Include country code (+47 for Norway)
- No spaces or special characters

#### Issue: "SMS sending failed"
**Solution:**
- Check Twilio credentials are correct
- Verify you have balance in Twilio
- Check Twilio phone number is verified

#### Issue: "Twilio credentials invalid"
**Solution:**
- Regenerate Twilio Auth Token
- Update in Supabase dashboard

### Step 5: Test with Supabase Debug Mode

Add this to your code temporarily to see more details:

```typescript
const { data, error } = await supabase.auth.signInWithOtp({
  phone: phone,
  options: {
    channel: 'sms' // explicitly set channel
  }
})
```

### Step 6: Alternative - Use Email for Testing

If phone auth isn't working, test with email first to ensure Supabase is working:

```typescript
const { data, error } = await supabase.auth.signInWithOtp({
  email: 'test@example.com'
})
```

### Still Not Working?

1. Check Supabase status: https://status.supabase.com/
2. Check Twilio status: https://status.twilio.com/
3. Verify your Twilio trial hasn't expired
4. Make sure you're testing with a real phone number (not a virtual number)

## Quick Test Checklist

- [ ] Twilio account created and verified
- [ ] Phone number purchased in Twilio
- [ ] Twilio credentials added to Supabase
- [ ] Phone provider enabled in Supabase
- [ ] Using correct phone format (+47XXXXXXXX)
- [ ] Browser console shows no errors
- [ ] Twilio has balance available







