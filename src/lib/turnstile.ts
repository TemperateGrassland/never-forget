interface TurnstileResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
  action?: string;
  cdata?: string;
}

export async function verifyTurnstileToken(token: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  
  if (!secretKey) {
    console.error('TURNSTILE_SECRET_KEY is not configured');
    return false;
  }

  if (!token) {
    console.error('No Turnstile token provided');
    return false;
  }

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
      }),
    });

    if (!response.ok) {
      console.error('Failed to verify Turnstile token:', response.status);
      return false;
    }

    const data: TurnstileResponse = await response.json();
    
    if (!data.success) {
      console.error('Turnstile verification failed:', data['error-codes']);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error verifying Turnstile token:', error);
    return false;
  }
}