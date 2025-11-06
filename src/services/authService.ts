import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import { generateToken } from '../utils/jwt';
import { AppError } from '../middleware/errorHandler';

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  country: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  mentalHealthConditions?: string[];
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    username: string;
    country: string;
    role: string;
    profile?: {
      firstName?: string;
      lastName?: string;
      dateOfBirth?: Date;
      mentalHealthConditions?: string[];
    };
  };
  token: string;
}

export class AuthService {
  async register(data: RegisterData): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email },
          { username: data.username }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.email === data.email) {
        throw new AppError('Email already registered', 409, 'EMAIL_EXISTS');
      }
      if (existingUser.username === data.username) {
        throw new AppError('Username already taken', 409, 'USERNAME_EXISTS');
      }
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(data.password, saltRounds);

    // Create user with profile
    const user = await prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        password: hashedPassword,
        country: data.country.toUpperCase(),
        profile: {
          create: {
            firstName: data.firstName,
            lastName: data.lastName,
            dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
            mentalHealthConditions: data.mentalHealthConditions || [],
            preferences: {},
            emergencyContacts: []
          }
        }
      },
      include: {
        profile: true
      }
    });

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        country: user.country,
        role: user.role,
        profile: user.profile ? {
          firstName: user.profile.firstName || undefined,
          lastName: user.profile.lastName || undefined,
          dateOfBirth: user.profile.dateOfBirth || undefined,
          mentalHealthConditions: user.profile.mentalHealthConditions
        } : undefined
      },
      token
    };
  }

  async login(data: LoginData): Promise<AuthResponse> {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: {
        profile: true
      }
    });

    if (!user) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        country: user.country,
        role: user.role,
        profile: user.profile ? {
          firstName: user.profile.firstName || undefined,
          lastName: user.profile.lastName || undefined,
          dateOfBirth: user.profile.dateOfBirth || undefined,
          mentalHealthConditions: user.profile.mentalHealthConditions
        } : undefined
      },
      token
    };
  }

  async getUserProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        country: true,
        role: true,
        createdAt: true,
        profile: {
          select: {
            firstName: true,
            lastName: true,
            dateOfBirth: true,
            mentalHealthConditions: true,
            preferences: true,
            emergencyContacts: true
          }
        }
      }
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    return user;
  }

  async updateUserProfile(userId: string, updateData: any) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true }
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Update profile
    const updatedProfile = await prisma.userProfile.update({
      where: { userId: userId },
      data: {
        firstName: updateData.firstName,
        lastName: updateData.lastName,
        dateOfBirth: updateData.dateOfBirth ? new Date(updateData.dateOfBirth) : undefined,
        mentalHealthConditions: updateData.mentalHealthConditions,
        emergencyContacts: updateData.emergencyContacts,
        preferences: updateData.preferences
      }
    });

    return this.getUserProfile(userId);
  }
}