import jwt from 'jsonwebtoken';

export const generateToken = (payload: object, expiresIn: string | number = '1d'): string => {
  const secret = process.env.JWT_SECRET || 'fallback_secret_key';
  return jwt.sign(payload, secret, { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] });
};

export const verifyToken = (token: string): any => {
  const secret = process.env.JWT_SECRET || 'fallback_secret_key';
  return jwt.verify(token, secret);
};
