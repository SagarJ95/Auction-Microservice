import bcrypt from "bcrypt";
import User, { UserRole } from "../models/user.model";
import { redis } from "../config/redis";
import { randomUUID } from "crypto";
import {
  generateAccessToken,
  generateRefreshToken,
  generateTokenId,
  verifyRefreshToken
} from "../utils/jwt";

export const registerUser = async (
  name: string,
  email: string,
  password: string
) => {

  const existingUser = await User.findOne({
    where: { email }
  });

  if (existingUser) {
    throw new Error("Email already registered");
  }

  const hashedPassword = await bcrypt.hash(password, 12);
console.log(`${name}.${email}.${hashedPassword}.${UserRole.BIDDER}`)
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role: UserRole.BIDDER
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  };
};

export const loginUser = async (
  email: string,
  password: string
) => {

  const user = await User.findOne({
    where: { email }
  });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  const isValid = await bcrypt.compare(
    password,
    user.password
  );

  if (!isValid) {
    throw new Error("Invalid email or password");
  }

  const sid = randomUUID();
  const jti = generateTokenId();

  const accessToken = generateAccessToken(
    user.id,
    user.role,
    sid
  );

  const refreshToken = generateRefreshToken(user.id,sid,jti);

  await redis.set(
  `auth:session:${sid}`,
  JSON.stringify({
    userId: user.id,
    jti
  }),
  {
    EX: 7 * 24 * 60 * 60
  }
);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  };
};

export const refreshUserToken = async (
  token: string
) => {
  const decoded = verifyRefreshToken(token);

  const sessionKey = `auth:session:${decoded.sid}`;

  const newJti = generateTokenId();

  const newRefreshToken = generateRefreshToken(
    decoded.userId,
    decoded.sid,
    newJti
  );

  const session = await redis.get(sessionKey);

  if (!session) {
    throw new Error("Session expired or revoked");
  }

  const currentSession = JSON.parse(session);

  if (
    currentSession.userId !== decoded.userId ||
    currentSession.jti !== decoded.jti
  ) {
    throw new Error("Invalid or reused refresh token");
  }

  // Atomic compare-and-swap operation.
  const script = `
    local current = redis.call('GET', KEYS[1])

    if not current then
      return 0
    end

    local session = cjson.decode(current)

    if session.userId ~= tonumber(ARGV[1])
      or session.jti ~= ARGV[2] then
      return 0
    end

    redis.call(
      'SET',
      KEYS[1],
      ARGV[3],
      'EX',
      604800
    )

    return 1
  `;

  const updated = await redis.eval(script, {
    keys: [sessionKey],
    arguments: [
      String(decoded.userId),
      decoded.jti,
      JSON.stringify({
        userId: decoded.userId,
        jti: newJti
      })
    ]
  });

  if (updated !== 1) {
    throw new Error("Refresh token already used or invalid");
  }

  const accessToken = generateAccessToken(
    decoded.userId,
    "BIDDER",
    decoded.sid
  );

  return {
    accessToken,
    refreshToken: newRefreshToken
  };
};

export const refreshAccessToken = async (
  refreshToken: string
) => {

  // 1. Verify refresh token
  const decoded = verifyRefreshToken(refreshToken);

  // 2. Create Redis session key
  const sessionKey = `session:${decoded.sid}`;

  // 3. Check session in Redis
  const session = await redis.get(sessionKey);

  if (!session) {
    throw new Error("Session expired or invalid");
  }

  // 4. Find user in PostgreSQL
  const user = await User.findByPk(decoded.userId);

  if (!user) {
    await redis.del(sessionKey);
    throw new Error("User not found");
  }

  // 5. Generate new access token
  const accessToken = generateAccessToken(
    user.id,
    user.role,
    decoded.sid
  );

  return {
    accessToken
  };
};


export const logoutUser = async (sid: string) => {
  
  await redis.del(`auth:session:${sid}`);

  return {
    message: "Logout successful"
  };
};
