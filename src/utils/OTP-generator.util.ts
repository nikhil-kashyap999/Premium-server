import { randomInt } from 'crypto';

export default function OTPGenerator() {
  const OTP = randomInt(100000, 1000000);
  return String(OTP);
}
