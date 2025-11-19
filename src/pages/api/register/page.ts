import type { ActionFunctionArgs } from "react-router";
import { getOrm } from "@/lib/server/db";
import {User} from "@/lib/server/entities/User"

 
export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    // Only accept POST requests
    if (request.method !== 'POST') {
      return Response.json(
        { error: 'Method not allowed' },
        { status: 405 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { name, email, password } = body;

    // Validate required fields
    if (!name || !email || !password) {
      return Response.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return Response.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return Response.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Initialize database
    const orm = await getOrm();
    const em = orm.em.fork();

    // Check if user already exists
    const existingUser = await em.findOne(User, { email: email.toLowerCase().trim() });
    if (existingUser) {
      return Response.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Create new user (password will be handled by BetterAuth in Account entity)
    const now = new Date();
    const user = em.create(User, {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      emailVerified: false,
      createdAt: now,
      updatedAt: now,
    });

    // Save user to database
    await em.persistAndFlush(user);

    // Return success response
    return Response.json({
      success: true,
      message: 'User registered successfully',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Registration API Error:', error);
    
    // Handle unique constraint violation
    if (error instanceof Error && error.message.includes('unique')) {
      return Response.json(
        {
          success: false,
          error: 'User with this email already exists',
        },
        { status: 409 }
      );
    }

    return Response.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
};


