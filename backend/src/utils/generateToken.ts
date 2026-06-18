import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';

const secret = process.env.JWT_SECRET;

if (!secret) {
  throw new Error('JWT_SECRET is not defined');
}

export const generateToken = (
  payload: object,
  expiresIn: SignOptions['expiresIn'] = '1d'
): string => {
  return jwt.sign(payload, secret, { expiresIn });
};

export const verifyToken = (
  token: string
): JwtPayload | string => {
  return jwt.verify(token, secret);
};
